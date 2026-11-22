import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("menu", {
  examples: ["Default", "Submenu", "Choices", "Sizes"],
  parts: [
    "Root",
    "Trigger",
    "Popup",
    "Item",
    "GroupLabel",
    "CheckboxItem",
    "Separator",
    "SubmenuTrigger",
  ],
  specimen: ".ow-menu__popup .ow-menu__chevron",
});

// The menu is in a portal on the body; it is the one open menu on the page.
const menu = (page: Page) => page.getByRole("menu");
const trigger = (page: Page, name: string) => demo(page).getByRole("button", { name, exact: true });

test("Edit opens its items with Glide on the one reached, and Escape returns focus", async ({
  page,
}, testInfo) => {
  await visit(page, "/en/menu");
  await trigger(page, "Edit").click();
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole("menuitem")).toHaveCount(4);
  await expect(menu(page).getByRole("menuitem", { name: /Paste/ })).toHaveAttribute(
    "data-disabled",
    "",
  );
  if (testInfo.project.name !== "mobile-390") {
    await menu(page).getByRole("menuitem", { name: /Copy/ }).hover();
    await expect(menu(page).locator("[data-glide-active]")).toHaveText(/Copy/);
  }
  await page.keyboard.press("Escape");
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page, "Edit")).toBeFocused();
});

test("the keyboard opens the menu at its first item and Glide follows the arrows", async ({
  page,
}) => {
  await visit(page, "/en/menu");
  await trigger(page, "Edit").focus();
  await page.keyboard.press("ArrowDown");
  await expect(menu(page).getByRole("menuitem", { name: /Cut/ })).toBeFocused();
  await expect(menu(page).locator("[data-glide-active]")).toHaveText(/Cut/);
  await page.keyboard.press("ArrowDown");
  await expect(menu(page).locator("[data-glide-active]")).toHaveText(/Copy/);
  // The disabled item is passed over by Glide, and the keyboard still reaches the next one.
  await page.keyboard.press("End");
  await expect(menu(page).getByRole("menuitem", { name: "Select all" })).toBeFocused();
});

test("an item with a chevron opens a submenu beside it; Escape shuts only that level", async ({
  page,
}) => {
  await visit(page, "/en/menu");
  await pick(page, "Submenu");
  await trigger(page, "Edit").click();
  const share = menu(page).getByRole("menuitem", { name: "Share" });
  await expect(share).toHaveAttribute("aria-haspopup", "menu");
  await share.focus();
  await page.keyboard.press("ArrowRight");
  const submenu = page
    .getByRole("menu")
    .filter({ has: page.getByRole("menuitem", { name: "Email" }) });
  await expect(submenu).toBeVisible();
  await expect(share).toHaveAttribute("data-popup-open", "");
  await expect(submenu.getByRole("menuitem", { name: "Email" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(submenu).toHaveCount(0);
  await expect(menu(page)).toBeVisible();
  await expect(share).toBeFocused();
});

test("checks and choices change without shutting the menu", async ({ page }) => {
  await visit(page, "/en/menu");
  await pick(page, "Choices");
  await trigger(page, "View").click();
  const numbers = menu(page).getByRole("menuitemcheckbox", { name: "Line numbers" });
  await expect(menu(page).getByRole("menuitemcheckbox", { name: "Word wrap" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(numbers).toHaveAttribute("aria-checked", "false");
  await numbers.click();
  await expect(numbers).toHaveAttribute("aria-checked", "true");

  const dark = menu(page).getByRole("menuitemradio", { name: "Dark" });
  await expect(menu(page).getByRole("menuitemradio", { name: "System" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await dark.click();
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await expect(menu(page).getByRole("menuitemradio", { name: "System" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole("group", { name: "Theme" })).toBeVisible();
});

test("sizes grow the items", async ({ page }) => {
  await visit(page, "/en/menu");
  await pick(page, "Sizes");
  const heights: number[] = [];
  for (const size of ["sm", "md", "lg"]) {
    await demo(page).locator(`[data-demo="edit-${size}"]`).click();
    await expect(menu(page)).toHaveAttribute("data-size", size);
    const box = await menu(page).getByRole("menuitem").first().boundingBox();
    heights.push(box?.height ?? 0);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

test("an open menu holds the page without an overflow style that redraws its text", async ({
  page,
}) => {
  await visit(page, "/en/menu");
  await trigger(page, "Edit").click();
  await expect(menu(page)).toBeVisible();
  // A modal menu's clear backdrop takes a press outside; the page's overflow stays as it was.
  await expect(page.locator(".ow-menu__backdrop")).toHaveCount(1);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});

test("Inspect's menu is open inline, without a portal or a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/menu");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-menu__popup")).toBeVisible();
  await expect(page.locator(".ow-menu__popup")).toHaveCount(1);
  await expect(page.locator(".ow-menu__backdrop")).toHaveCount(0);
  await expect(specimen(page).locator(".ow-menu__popup")).not.toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
