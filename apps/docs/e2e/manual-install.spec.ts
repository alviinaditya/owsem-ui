import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { docs, visit } from "./example-page.ts";

// The Manual install in a component page's Docs (Installation): files to copy, in numbered steps.
const manual = (page: Page) => docs(page).locator(".manual");

async function openManual(page: Page, path: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, `${path}#installation`);
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(manual(page)).toBeVisible();
}

test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the Docs column needs a wide screen");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
});

test("the Command tab keeps the npm install; Manual lists the steps and the files", async ({
  page,
}) => {
  await visit(page, "/en/switch#installation");
  await expect(docs(page).getByRole("tab", { name: "Command" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(docs(page).getByText("pnpm add owsem-ui")).toBeVisible();

  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(docs(page).getByText("pnpm add owsem-ui")).toBeHidden();
  const steps = manual(page).locator(".manual-step__title");
  await expect(steps).toHaveText([
    "Install the dependencies",
    "Add the theme tokens",
    "Copy the component files",
    "Update the import paths",
  ]);
  await expect(manual(page).locator(".manual-step").first()).toContainText("@base-ui/react");
  const titles = manual(page).locator(".ow-code-block__title");
  for (const path of [
    "lib/owsem/tokens.css",
    "components/owsem/switch/switch.tsx",
    "components/owsem/switch/switch.css",
    "lib/owsem/class-name.ts",
  ]) {
    await expect(titles.filter({ hasText: path })).toHaveCount(1);
  }
  await expect(manual(page)).toContainText('@import "./lib/owsem/tokens.css";');
});

test("the Manual files are not in the page until the tab opens", async ({ page, request }) => {
  const html = await (await request.get("/en/button")).text();
  expect(html).not.toContain("button-variants");
  expect(html).not.toContain("use-ripple");
  await openManual(page, "/en/button");
  await expect(manual(page)).toContainText("button-variants");
});

test("a component without a Tailwind flavor shows a note that it is coming", async ({ page }) => {
  await openManual(page, "/en/switch");
  await expect(manual(page).getByRole("group", { name: "Styling" })).toHaveCount(0);
  await expect(manual(page)).toContainText("Tailwind v4 version of this component is coming");
});

test("dependencies are a command per package manager", async ({ page }) => {
  await openManual(page, "/en/switch");
  const block = manual(page).locator(".manual-step").first();
  await expect(block).toContainText("pnpm add @base-ui/react@~");
  await block.getByRole("tab", { name: "npm", exact: true }).click();
  await expect(block).toContainText("npm install @base-ui/react@~");
});

test("Copy takes the whole file, and Expand shows all of a collapsed one", async ({ page }) => {
  await openManual(page, "/en/switch");
  const block = manual(page)
    .locator(".manual-file")
    .filter({ has: page.locator(".ow-code-block__title", { hasText: "switch/switch.tsx" }) });
  const code = block.locator(".manual-file__code");
  await expect(code).toHaveAttribute("data-collapsed", "true");
  const collapsed = (await code.boundingBox())?.height ?? 0;
  expect(collapsed).toBeLessThanOrEqual(241);

  await block.getByRole("button", { name: "Copy" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  // Lines past the collapsed 240px are in what was copied.
  expect(copied.split("\n").length).toBeGreaterThan(40);
  expect(copied).toContain("export const Switch");

  const toggle = block.getByRole("button", { name: "Expand" });
  await toggle.click();
  await expect(code).not.toHaveAttribute("data-collapsed", "true");
  expect(copied).toBe(await code.innerText());
  expect((await code.boundingBox())?.height ?? 0).toBeGreaterThan(collapsed);
  await expect(block.getByRole("button", { name: "Collapse" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await block.getByRole("button", { name: "Collapse" }).click();
  await expect(code).toHaveAttribute("data-collapsed", "true");
});

test("Manual lists only the files the component imports", async ({ page }) => {
  await openManual(page, "/en/tabs");
  const titles = manual(page).locator(".ow-code-block__title");
  await expect(titles.filter({ hasText: "components/owsem/toggle-group/thumb.ts" })).toHaveCount(1);
  await expect(titles.filter({ hasText: "toggle-group/toggle-group.tsx" })).toHaveCount(0);
  await expect(titles.filter({ hasText: "toggle-group/toggle-group.css" })).toHaveCount(0);
});

test("the tokens file keeps only the tokens the component reads", async ({ page }) => {
  await openManual(page, "/en/button");
  const tokens = manual(page)
    .locator(".manual-file")
    .filter({ has: page.locator(".ow-code-block__title", { hasText: "lib/owsem/tokens.css" }) })
    .first();
  await tokens.getByRole("button", { name: "Copy" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("--ow-accent:");
  expect(copied).not.toContain("--ow-tooltip-bg");
  expect(copied).not.toContain("--ow-backdrop");
  expect(copied).toContain("@layer owsem.tokens {");
});

test("the page does not scroll sideways in the narrow column", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 800 });
  await visit(page, "/en/switch#installation");
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  const scroll = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    docs: (() => {
      const el = document.querySelector(".cp-docs-scroll");
      return el ? el.scrollWidth - el.clientWidth : 0;
    })(),
  }));
  expect(scroll).toEqual({ page: 0, docs: 0 });
});

// The Tailwind flavor exists once packages/ui/src/tailwind/button/ does.
const tailwindButton = existsSync(join(process.cwd(), "../../packages/ui/src/tailwind/button"));

test("a component with a Tailwind flavor: the switch swaps the files, and is remembered", async ({
  page,
}) => {
  test.skip(!tailwindButton, "packages/ui/src/tailwind/button/ does not exist yet");
  await openManual(page, "/en/button");
  const flavor = manual(page).getByRole("group", { name: "Styling" });
  await expect(flavor.getByRole("button", { name: "CSS" })).toHaveAttribute("aria-pressed", "true");
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "button.css" }),
  ).toHaveCount(1);

  await flavor.getByRole("button", { name: "Tailwind v4" }).click();
  await expect(manual(page).locator(".manual-step:visible").first()).toContainText(" cn");
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "button.css" }),
  ).toHaveCount(0);
  await expect(manual(page)).toContainText('@import "./lib/owsem/tailwind.css";');
  await expect(
    manual(page).locator(".ow-code-block__title:visible", { hasText: "lib/owsem/tailwind.css" }),
  ).toHaveCount(1);

  await page.reload();
  await expect(page.locator(".cp")).toHaveAttribute("data-mounted", "");
  await docs(page).getByRole("tab", { name: "Manual" }).click();
  await expect(
    manual(page).getByRole("group", { name: "Styling" }).getByRole("button", {
      name: "Tailwind v4",
    }),
  ).toHaveAttribute("aria-pressed", "true");
});
