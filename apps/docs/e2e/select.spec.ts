import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("select", {
  examples: ["Default", "Sizes", "Multiple", "Groups", "States", "Parts"],
  parts: [
    "Root",
    "Label",
    "Trigger",
    "Value",
    "Icon",
    "Popup",
    "GroupLabel",
    "Item",
    "ItemIndicator",
    "ItemText",
    "Separator",
    "ScrollDownArrow",
  ],
  specimen: ".ow-select__popup .ow-select__item[data-selected]",
});

// The popup is in a portal on the body; it is the one open list on the page.
const popup = (page: Page) => page.locator(".ow-select__popup");

test("the popup lands the selected text on the trigger's, and a pick fills the trigger", async ({
  page,
}) => {
  await visit(page, "/en/select");
  const trigger = demo(page).getByRole("combobox", { name: "Fruit" });
  await expect(trigger).toHaveText("Cherry");
  await trigger.click();
  await expect(popup(page)).toBeVisible();
  // Over the trigger, the selected text on its text.
  await expect(popup(page)).toHaveAttribute("data-side", "none");
  await expect
    .poll(async () => {
      const value = await trigger.locator(".ow-select__value").boundingBox();
      const text = await popup(page)
        .locator('[role="option"][aria-selected="true"] .ow-select__item-text')
        .boundingBox();
      return value && text ? Math.abs(value.x - text.x) + Math.abs(value.y - text.y) : 99;
    })
    .toBeLessThan(1);
  await popup(page).getByRole("option", { name: "Mango" }).click();
  await expect(popup(page)).toBeHidden();
  await expect(trigger).toHaveText("Mango");
  await expect(trigger).toBeFocused();
});

test("with multiple, picks add up in the trigger and the list stays open", async ({ page }) => {
  await visit(page, "/en/select");
  await pick(page, "Multiple");
  const trigger = demo(page).getByRole("combobox", { name: "Fruits" });
  await expect(trigger).toHaveText("Cherry");
  await trigger.click();
  await expect(popup(page).getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
  await popup(page).getByRole("option", { name: "Mango" }).click();
  await expect(popup(page)).toBeVisible();
  await expect(trigger).toHaveText(/Cherry, Mango/);
});

test("a long list has groups with labels and separators, and a summary replaces the value", async ({
  page,
}) => {
  await visit(page, "/en/select");
  await pick(page, "Groups");
  await demo(page).getByRole("combobox", { name: "Year" }).click();
  await expect(popup(page).locator(".ow-select__group-label")).toHaveText([
    "2000–2009",
    "2010–2019",
    "2020–2029",
    "2030–2039",
  ]);
  await expect(popup(page).locator(".ow-select__separator")).toHaveCount(3);
  await expect(popup(page).getByRole("option", { name: "2026" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(popup(page)).toBeHidden();

  await pick(page, "Parts");
  const trigger = demo(page).getByRole("combobox", { name: "Fruits" });
  await expect(trigger).toHaveText("Cherry, Mango");
  await trigger.click();
  await popup(page).getByRole("option", { name: "Apple" }).click();
  await expect(trigger).toHaveText("3 fruits");
});

test("states: a placeholder, a disabled field, and an invalid one", async ({ page }) => {
  await visit(page, "/en/select");
  await pick(page, "States");
  const empty = demo(page).getByRole("combobox", { name: "Placeholder" });
  await expect(empty).toHaveText("Pick a fruit");
  await expect(empty.locator(".ow-select__value")).toHaveAttribute("data-placeholder", "");
  await expect(demo(page).getByRole("combobox", { name: "Disabled" })).toBeDisabled();
  await expect(demo(page).getByRole("combobox", { name: "Invalid" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("Inspect's popup is open inline, without a portal or a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/select");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-select__popup")).toBeVisible();
  // The popup lives in the specimen, not in the body, and nothing holds the page.
  await expect(page.locator(".ow-select__popup")).toHaveCount(1);
  await expect(page.locator(".ow-select__backdrop")).toHaveCount(0);
  await expect(specimen(page).locator(".ow-select__scroll-down-arrow")).toBeVisible();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
