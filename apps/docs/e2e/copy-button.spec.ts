import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("copy-button", {
  examples: ["Default", "With a label", "Variants", "Sizes"],
  parts: ["Root", "Icon", "Label"],
  specimen: ".ow-copy-button__label",
});

test("icon only: the tooltip says Copy, then Copied in place, and the link is on the clipboard", async ({
  page,
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a hover");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await visit(page, "/en/copy-button");
  const copy = demo(page).getByRole("button", { name: "Copy link" });
  await expect(copy).toHaveAttribute("data-icon-only", "");
  const tip = page.locator(".ow-tooltip__popup .ow-copy-button__tip-text[data-visible]");
  // A hover before hydration is lost, so come in again until the tooltip answers.
  await expect(async () => {
    await page.mouse.move(0, 0);
    await copy.hover();
    await expect(tip).toHaveText("Copy link", { timeout: 1500 });
  }).toPass();
  await copy.click();
  // The name stays; the status region and the tooltip say Copied, and it is busy until it is back.
  await expect(demo(page).getByRole("status")).toHaveText("Copied");
  await expect(tip).toHaveText("Copied");
  await expect(copy).toHaveAccessibleName("Copy link");
  await expect(copy).toHaveAttribute("data-copied", "");
  await expect(copy).toHaveAttribute("aria-disabled", "true");
  await expect(copy.locator(".ow-copy-button__check")).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://owsem.dev/join/7Kq2",
  );
  await expect(copy).not.toHaveAttribute("data-copied", "", { timeout: 5000 });
  await expect(tip).toHaveText("Copy link");
});

test("with a label: both words share one cell, and Copied shows after a press", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await visit(page, "/en/copy-button");
  await pick(page, "With a label");
  const copy = demo(page).locator(".ow-copy-button");
  await expect(copy.locator(".ow-copy-button__label-text")).toHaveCount(2);
  await expect(copy.locator(".ow-copy-button__label-text[data-visible]")).toHaveText("Copy link");
  await copy.click();
  await expect(copy.locator(".ow-copy-button__label-text[data-visible]")).toHaveText("Copied");
  await expect(demo(page).getByRole("status")).toHaveText("Copied");
  await expect(copy).not.toHaveAttribute("data-copied", "", { timeout: 5000 });
});

test("variants and sizes render one button each", async ({ page }) => {
  await visit(page, "/en/copy-button");
  await pick(page, "Variants");
  const variants = await demo(page)
    .locator(".ow-copy-button")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-variant")));
  expect(variants).toEqual(["ghost", "outline", "secondary"]);
  await pick(page, "Sizes");
  const sizes = await demo(page)
    .locator(".ow-copy-button")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-size")));
  expect(sizes).toEqual(["sm", "md", "lg"]);
});
