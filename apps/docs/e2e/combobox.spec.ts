import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("combobox", {
  examples: ["Default", "Sizes", "Multiple", "Grouped", "Async", "States"],
  parts: [
    "Root",
    "InputGroup",
    "Input",
    "Clear",
    "Trigger",
    "Icon",
    "Popup",
    "GroupLabel",
    "Item",
    "Separator",
  ],
  specimen: ".ow-combobox__popup .ow-combobox__item",
});

// The popup is in a portal on the body; it is the one open list on the page.
const popup = (page: Page) => page.locator(".ow-combobox__popup");
const input = (page: Page, name: string) => demo(page).getByRole("combobox", { name });

test("typing filters the list, an Empty speaks when nothing matches, and a pick fills the input", async ({
  page,
}) => {
  await visit(page, "/en/combobox");
  const field = input(page, "Fruit");
  await field.click();
  await field.fill("an");
  await expect(popup(page).getByRole("option")).toHaveText(["Banana", "Durian", "Mango"]);
  await field.fill("zzz");
  await expect(popup(page)).toContainText("No fruit matches.");
  await field.fill("ch");
  await popup(page).getByRole("option", { name: "Cherry" }).click();
  await expect(field).toHaveValue("Cherry");
  await expect(popup(page)).toBeHidden();
});

test("the trigger opens the list, the arrows and Enter pick, and Clear empties the field", async ({
  page,
}) => {
  await visit(page, "/en/combobox");
  const field = input(page, "Fruit");
  await demo(page).locator(".ow-combobox__trigger").click();
  await expect(popup(page).getByRole("option")).toHaveCount(8);
  await field.press("ArrowDown");
  await field.press("ArrowDown");
  await field.press("Enter");
  await expect(field).toHaveValue("Banana");
  await expect(demo(page).getByRole("button", { name: "Clear" })).toBeVisible();
  await demo(page).getByRole("button", { name: "Clear" }).click();
  await expect(field).toHaveValue("");
  await expect(demo(page).getByRole("button", { name: "Clear" })).toHaveCount(0);
});

test("Escape shuts the list", async ({ page }) => {
  await visit(page, "/en/combobox");
  await demo(page).locator(".ow-combobox__trigger").click();
  await expect(popup(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(popup(page)).toBeHidden();
});

test("multiple: picks become chips, Backspace removes the last, and a chip's button its own", async ({
  page,
}) => {
  await visit(page, "/en/combobox");
  await pick(page, "Multiple");
  const chips = demo(page).locator(".ow-combobox__chip");
  await expect(chips).toHaveText(["Apple", "Cherry"]);
  const field = input(page, "Fruits");
  await field.click();
  await field.press("ArrowDown");
  await popup(page).getByRole("option", { name: "Mango" }).click();
  await expect(chips).toHaveText(["Apple", "Cherry", "Mango"]);
  await expect(popup(page)).toBeVisible();
  await field.press("Backspace");
  await expect(chips).toHaveText(["Apple", "Cherry"]);
  await demo(page)
    .locator(".ow-combobox__chip", { hasText: "Apple" })
    .locator(".ow-combobox__chip-remove")
    .click();
  await expect(chips).toHaveText(["Cherry"]);
  // The remove button is a 24px target.
  const box = await demo(page).locator(".ow-combobox__chip-remove").boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(23.5);
  expect(box?.height).toBeGreaterThanOrEqual(23.5);
});

test("grouped: labels head the groups, and filtering drops one with no match", async ({ page }) => {
  await visit(page, "/en/combobox");
  await pick(page, "Grouped");
  const field = input(page, "Fruit");
  await field.click();
  await field.press("ArrowDown");
  await expect(popup(page).locator(".ow-select__group-label")).toHaveText(["Orchard", "Tropical"]);
  await field.fill("lych");
  await expect(popup(page).locator(".ow-select__group-label")).toHaveText(["Tropical"]);
});

test("async: the Status says a search runs, then the results or an Empty come", async ({
  page,
}) => {
  await visit(page, "/en/combobox");
  await pick(page, "Async");
  const field = input(page, "Search fruit");
  await field.click();
  await field.fill("an");
  await expect(popup(page).locator(".ow-combobox__status")).toHaveText("Searching…");
  await expect(popup(page).getByRole("option")).toHaveText(["Banana", "Durian", "Mango"]);
  await expect(popup(page).locator(".ow-combobox__status")).toHaveText("");
  await field.fill("zzz");
  await expect(popup(page).locator(".ow-combobox__empty")).toHaveText("No fruit matches.");
});

test("states: a disabled field, a read-only one, and an invalid one with its message", async ({
  page,
}) => {
  await visit(page, "/en/combobox");
  await pick(page, "States");
  await expect(input(page, "Disabled")).toBeDisabled();
  await expect(input(page, "Read only")).toHaveAttribute("readonly", "");
  const invalid = demo(page).locator(".ow-combobox__input-group[data-invalid]");
  await expect(invalid).toHaveCount(1);
  await expect(demo(page)).toContainText("Pick a fruit from the list.");
});

test("Inspect's list is open inline, with no lock on the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/combobox");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-combobox__popup")).toBeVisible();
  await expect(page.locator(".ow-combobox__popup")).toHaveCount(1);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
