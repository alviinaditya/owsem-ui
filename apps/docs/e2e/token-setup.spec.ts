import { expect, type Page, test } from "@playwright/test";
import { openSheet, stage, stageTool } from "./lab.ts";

const narrative = (page: Page) => page.locator(".lab-narrative");

test("the token setup rewrites a Lab's code and install steps (DS-4)", async ({ page }) => {
  await page.goto("/en/separator");
  await openSheet(page);
  // The intro's line; Customization has the same one.
  const chip = page.getByRole("button", { name: "Change Token setup" }).first();
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await chip.click();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("radio", { name: "Theme tokens" })).toBeFocused();

  await panel.getByRole("radio", { name: "Isolated tokens" }).check();
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
  await expect(panel).toBeHidden();
  await expect(chip).toBeFocused();

  // The narrative's code, the intro, and the stage follow the setup.
  await expect(narrative(page)).toContainText("--acme-separator-line-dark");
  await expect(narrative(page)).not.toContainText("--ow-separator-line-dark");
  await expect(narrative(page)).toContainText("Isolated tokens · --acme-separator-*");
  const intro = page.locator(".install").first();
  await expect(intro).toContainText("pnpm dlx owsem@latest init --tokens isolated --prefix acme");
  await expect(intro).toContainText("pnpm dlx owsem@latest add separator");
  await expect(intro).toContainText("not released yet");
  // The Customization scene describes the mode in use.
  const customization = page.locator("#scene-customization");
  await expect(customization).toContainText("Its own, per theme");
  await expect(customization).not.toContainText("--acme-line-dark");
  await stage(page).getByRole("button", { name: "Controls" }).click();
  await stage(page).getByLabel("Dark line", { exact: true }).fill("#ff0000");
  await stage(page).getByRole("button", { name: "Code" }).click();
  const code = stage(page).getByRole("tabpanel");
  await expect(code).toContainText('import { Separator } from "@/components/owsem/separator";');
  await stage(page).getByRole("tab", { name: "settings.css" }).click();
  await expect(code).toContainText(".settings .ow-separator {");
  await expect(code).toContainText("--acme-separator-line-dark: #ff0000;");
  await stage(page).getByRole("tab", { name: "Install" }).click();
  await expect(code).toContainText("pnpm dlx owsem@latest init --tokens isolated --prefix acme");

  // Kept for the next visit, until reset.
  await page.reload();
  await expect(narrative(page)).toContainText("--acme-separator-line-dark");
  await openSheet(page);
  await chip.click();
  await panel.getByRole("button", { name: "Reset to theme tokens, --ow" }).click();
  await expect(narrative(page)).toContainText("--ow-separator-line-dark");
  await expect(page.locator(".install").first()).toContainText("pnpm add owsem-ui");
  expect(await page.evaluate(() => localStorage.getItem("owsem-token-setup"))).toBeNull();
});

test("the Theming page's code stays literal whatever the token setup", async ({ page }) => {
  await page.goto("/en/separator");
  await stageTool(page, "Tokens", "Token setup");
  const panel = page.getByRole("dialog", { name: "Token setup" });
  await expect(panel).toBeVisible();
  await panel.getByRole("radio", { name: "Isolated tokens" }).check();
  await panel.getByLabel("Prefix").fill("acme");
  await page.keyboard.press("Escape");
  // The Theming page explains the default, so its code keeps --ow.
  await page.goto("/id/docs/theming");
  await expect(page.getByRole("main")).toContainText("--ow-accent");
});

test("a long prefix leaves the top bar's switchers on screen", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "sweeps desktop widths");
  await page.goto("/en/separator");
  await page.evaluate(() =>
    localStorage.setItem(
      "owsem-token-setup",
      JSON.stringify({ mode: "isolated", prefix: "abcdefghijklmnop" }),
    ),
  );
  for (const lang of ["en", "id"]) {
    await page.goto(`/${lang}/separator`);
    for (const width of [641, 768, 901, 1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const right = await page
        .locator(".theme-switcher")
        .evaluate((el) => el.getBoundingClientRect().right);
      expect(right, `${lang} at ${width} px`).toBeLessThanOrEqual(width);
    }
  }
});
