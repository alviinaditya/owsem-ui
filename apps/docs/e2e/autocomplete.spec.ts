import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("autocomplete", {
  examples: ["Default", "Sizes", "Inline", "Grouped", "Buttons"],
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

const popup = (page: Page) => page.locator(".ow-combobox__popup");
const input = (page: Page, name: string) => demo(page).getByRole("combobox", { name });

test("typing filters the suggestions, a pick fills the input, and other text stays", async ({
  page,
}) => {
  await visit(page, "/en/autocomplete");
  const field = input(page, "Search tags");
  await field.click();
  await field.fill("f");
  await expect(popup(page).getByRole("option")).toHaveText(["feature", "fix", "performance"]);
  await popup(page).getByRole("option", { name: "fix" }).click();
  await expect(field).toHaveValue("fix");
  await field.fill("nothing like it");
  await expect(popup(page)).toContainText("No suggestions.");
  await expect(field).toHaveValue("nothing like it");
});

test("inline: the arrows fill the input with the highlighted suggestion", async ({ page }) => {
  await visit(page, "/en/autocomplete");
  await pick(page, "Inline");
  const field = input(page, "Search tags");
  await field.click();
  await field.press("ArrowDown");
  await field.press("ArrowDown");
  await expect(field).toHaveValue("feature");
  await expect(field).toHaveAttribute("aria-autocomplete", "both");
});

test("groups: labels head the groups with a separator between, also while filtering", async ({
  page,
}) => {
  await visit(page, "/en/autocomplete");
  await pick(page, "Groups");
  const field = input(page, "Search tags");
  await field.click();
  await field.press("ArrowDown");
  await expect(popup(page).locator(".ow-select__group-label")).toHaveText(["Type", "Area"]);
  await expect(popup(page).locator(".ow-select__separator")).toHaveCount(1);
});

test("buttons: Clear empties the text and the Trigger opens the list", async ({ page }) => {
  await visit(page, "/en/autocomplete");
  await pick(page, "Buttons");
  const field = input(page, "Search tags");
  await expect(field).toHaveValue("feature");
  await demo(page).getByRole("button", { name: "Clear" }).click();
  await expect(field).toHaveValue("");
  await demo(page).locator(".ow-combobox__trigger").click();
  await expect(popup(page)).toBeVisible();
});

test("Inspect's list is open inline, with no lock on the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/autocomplete");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-combobox__popup")).toBeVisible();
  await expect(page.locator(".ow-combobox__popup")).toHaveCount(1);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
