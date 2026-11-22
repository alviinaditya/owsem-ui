import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("code-block", {
  examples: ["Default", "One file", "Copy label", "Long line"],
  parts: ["Root", "Icon", "List", "Tab", "Copy", "Panel"],
  specimen: ".ow-code-block__thumb",
});

test("the tabs swap the code, and the one icon morphs with them", async ({ page }) => {
  await visit(page, "/en/code-block");
  const block = demo(page).locator(".ow-code-block");
  const icon = block.locator(".ow-code-block__icon .ow-icon-morph__item");
  await expect(icon).toHaveCount(1);
  await block.getByRole("tab", { name: "theme.css" }).click();
  await expect(block.getByRole("tabpanel", { name: "theme.css" })).toContainText("--ow-accent");
  // The TSX file's icon leaves as the CSS file's enters, then goes.
  await expect(icon).toHaveCount(2);
  await expect(icon.first()).toHaveAttribute("data-ending-style", "");
  await expect(icon).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(block.getByRole("tab", { name: "Terminal" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(block.getByRole("tabpanel", { name: "Terminal" })).toContainText(
    "pnpm add owsem-ui",
  );
});

test("the block's height glides to the next snippet's", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the heights are the same check on desktop");
  await visit(page, "/en/code-block");
  const block = demo(page).locator(".ow-code-block");
  const height = () => block.evaluate((el) => el.getBoundingClientRect().height);
  const first = await height();
  await block.getByRole("tab", { name: "Terminal" }).click();
  // It settles on the shorter snippet's height.
  await expect.poll(height).toBeLessThan(first - 20);
});

test("one file has a Title and the long line scrolls inside its panel", async ({ page }) => {
  await visit(page, "/en/code-block");
  await pick(page, "One file");
  await expect(demo(page).locator(".ow-code-block__title")).toHaveText("Button.tsx");
  await expect(demo(page).getByRole("tab")).toHaveCount(0);

  await pick(page, "Long line");
  const panel = demo(page).locator(".ow-code-block__panel");
  await expect.poll(() => panel.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const page_ = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(page_).toBe(true);
});

test("Copy shows its label on request", async ({ page }) => {
  await visit(page, "/en/code-block");
  await pick(page, "Copy label");
  await expect(demo(page).locator(".ow-code-block__copy")).toContainText("Copy");
});
