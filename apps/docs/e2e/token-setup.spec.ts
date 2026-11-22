import { expect, test } from "@playwright/test";
import { docs, tools, visit } from "./example-page.ts";

test("the token setup rewrites a page's code, install steps, and tokens (DS-4)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "needs the docs beside the preview");
  await visit(page, "/en/tabs");
  await tools(page).getByRole("button", { name: "Install", exact: true }).click();
  const install = page.getByRole("dialog", { name: /Install/ });
  await expect(install).toContainText("pnpm add owsem-ui");
  await install.getByRole("button", { name: /Token setup/ }).click();
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Theme tokens" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await panel.getByRole("button", { name: "Isolated tokens" }).click();
  const prefix = panel.getByLabel("Prefix");
  // TK-1: a bad prefix is explained and not applied.
  await prefix.fill("9x");
  await expect(prefix).toHaveAttribute("aria-invalid", "true");
  await expect(panel).toContainText("“9x” can't be a prefix");
  await expect(panel.locator(".token-setup-json")).toContainText('"prefix": "ow"');
  await prefix.fill("Acme");
  await expect(prefix).toHaveValue("acme");
  await expect(panel.locator(".token-setup-json")).toContainText('"mode": "isolated"');
  await expect(panel.locator(".token-setup-json")).toContainText('"prefix": "acme"');
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  // The install steps, the docs' code, and the token names follow the setup.
  await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
  const installation = docs(page).locator(".cp-docs-install").first();
  await expect(installation).toContainText(
    "pnpm dlx owsem@latest init --tokens isolated --prefix acme",
  );
  await expect(installation).toContainText("pnpm dlx owsem@latest add tabs");
  await expect(installation).toContainText("not released yet");
  await expect(docs(page).locator("#example-default")).toContainText(
    'import { Tabs } from "@/components/owsem/tabs";',
  );
  await expect(docs(page).getByText("In isolated mode the values sit on")).toBeVisible();
  await expect(docs(page)).toContainText("--acme-motion-scale");
  await expect(docs(page)).not.toContainText("--ow-motion-scale");

  // Kept for the next visit, until reset.
  await page.reload();
  await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
  await expect(docs(page)).toContainText("--acme-motion-scale");
  await tools(page).getByRole("button", { name: "Install", exact: true }).click();
  await page
    .getByRole("dialog", { name: /Install/ })
    .getByRole("button", { name: /Token setup/ })
    .click();
  await page
    .getByRole("dialog", { name: "Token setup" })
    .getByRole("button", { name: "Reset to theme tokens, --ow" })
    .click();
  await expect(docs(page)).toContainText("--ow-motion-scale");
  expect(await page.evaluate(() => localStorage.getItem("owsem-token-setup"))).toBeNull();
});

test("the Theming page's code stays literal whatever the token setup", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "needs the Install popover");
  await visit(page, "/en/tabs");
  await tools(page).getByRole("button", { name: "Install", exact: true }).click();
  await page
    .getByRole("dialog", { name: /Install/ })
    .getByRole("button", { name: /Token setup/ })
    .click();
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Isolated tokens" }).click();
  await panel.getByLabel("Prefix").fill("acme");
  await page.keyboard.press("Escape");
  // The Theming page explains the default, so its code keeps --ow.
  await page.goto("/id/docs/theming");
  await expect(page.getByRole("main")).toContainText("--ow-spring-travel");
});

test("a long prefix leaves the preview toolbar on screen", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "sweeps desktop widths");
  await page.goto("/en/tabs");
  await page.evaluate(() =>
    localStorage.setItem(
      "owsem-token-setup",
      JSON.stringify({ mode: "isolated", prefix: "abcdefghijklmnop" }),
    ),
  );
  for (const lang of ["en", "id"]) {
    await visit(page, `/${lang}/tabs`);
    for (const width of [641, 768, 901, 1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const right = await page
        .locator(".cp-tools")
        .evaluateAll((els) => Math.max(...els.map((el) => el.getBoundingClientRect().right)));
      expect(right, `${lang} at ${width} px`).toBeLessThanOrEqual(width);
    }
  }
});
