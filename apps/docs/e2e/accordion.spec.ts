import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("accordion", {
  examples: ["Default", "Multiple", "Sizes", "Disabled item"],
  parts: ["Root", "Item", "Header", "Trigger", "Panel"],
  specimen: ".ow-accordion__trigger",
});

test("one panel opens at a time, inside headings", async ({ page }) => {
  await visit(page, "/en/accordion");
  const triggers = demo(page).getByRole("button");
  await expect(triggers).toHaveCount(3);
  await expect(demo(page).getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
  await triggers.nth(1).click();
  await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
  await expect(triggers.first()).toHaveAttribute("aria-expanded", "false");
  await expect(demo(page).locator(".ow-accordion__panel")).toHaveCount(1);
});

test("the rows are told apart by one hairline each between them", async ({ page }) => {
  await visit(page, "/en/accordion");
  const widths = await demo(page)
    .locator(".ow-accordion__item")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).borderTopWidth));
  expect(widths).toEqual(["0px", "1px", "1px"]);
});

test("multiple keeps several panels open", async ({ page }) => {
  await visit(page, "/en/accordion");
  await pick(page, "Multiple");
  const triggers = demo(page).getByRole("button");
  await expect(demo(page).locator(".ow-accordion__panel")).toHaveCount(2);
  await triggers.nth(1).click();
  await expect(demo(page).locator(".ow-accordion__panel")).toHaveCount(3);
});

test("the sizes are 32, 40, and 48px rows", async ({ page }) => {
  await visit(page, "/en/accordion");
  await pick(page, "Sizes");
  const triggers = demo(page).locator(".ow-accordion__trigger");
  await expect(triggers).toHaveCount(6);
  expect(
    await triggers.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height)),
    ),
  ).toEqual([32, 32, 40, 40, 48, 48]);
});

test("a disabled item stays shut", async ({ page }) => {
  await visit(page, "/en/accordion");
  await pick(page, "Disabled item");
  const soon = demo(page).getByRole("button", { name: "Coming soon" });
  await expect(soon).toBeDisabled();
  await soon.click({ force: true });
  await expect(soon).toHaveAttribute("aria-expanded", "false");
});
