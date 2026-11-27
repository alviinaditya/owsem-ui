import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("context-menu", {
  examples: ["Default", "Submenu", "Choices", "With a menu button"],
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
const area = (page: Page) => demo(page).locator('[data-demo="area"]');

/** A mouse has the right button; the phone project opens by long press, which Playwright lacks. */
const needsMouse = (project: string) =>
  test.skip(project !== "desktop", "a right click needs a mouse");

test("a right click opens the menu at the pointer, and Escape returns focus to the area", async ({
  page,
}, testInfo) => {
  needsMouse(testInfo.project.name);
  await visit(page, "/en/context-menu");
  const box = await area(page).boundingBox();
  if (!box) throw new Error("The area needs a box.");
  const x = box.x + 60;
  const y = box.y + 40;
  await page.mouse.click(x, y, { button: "right" });
  await expect(menu(page)).toBeVisible();
  await expect(area(page)).toHaveAttribute("data-popup-open", "");
  await expect(menu(page).getByRole("menuitem")).toHaveCount(4);
  await expect(menu(page).getByRole("menuitem", { name: /Paste/ })).toHaveAttribute(
    "data-disabled",
    "",
  );
  const popup = await menu(page).boundingBox();
  if (!popup) throw new Error("The menu needs a box.");
  // At the pointer, give or take Base UI's small offset.
  expect(Math.abs(popup.x - x)).toBeLessThan(12);
  expect(Math.abs(popup.y - y)).toBeLessThan(12);
  await menu(page).getByRole("menuitem", { name: /Copy/ }).hover();
  await expect(menu(page).locator("[data-glide-active]")).toHaveText(/Copy/);
  await page.keyboard.press("Escape");
  await expect(menu(page)).toHaveCount(0);
});

test("the keyboard moves through the items, and an item shuts the menu", async ({
  page,
}, testInfo) => {
  needsMouse(testInfo.project.name);
  await visit(page, "/en/context-menu");
  await area(page).click({ button: "right" });
  await expect(menu(page)).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(menu(page).locator("[data-glide-active]")).toHaveText(/Cut/);
  await page.keyboard.press("End");
  await expect(menu(page).getByRole("menuitem", { name: "Select all" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menu(page)).toHaveCount(0);
});

test("an item with a chevron opens a submenu beside it; Escape shuts only that level", async ({
  page,
}, testInfo) => {
  needsMouse(testInfo.project.name);
  await visit(page, "/en/context-menu");
  await pick(page, "Submenu");
  await area(page).click({ button: "right" });
  const share = menu(page).getByRole("menuitem", { name: "Share" });
  await share.focus();
  await page.keyboard.press("ArrowRight");
  const submenu = menu(page).filter({ has: page.getByRole("menuitem", { name: "Email" }) });
  await expect(submenu).toBeVisible();
  const [item, popup] = await Promise.all([share.boundingBox(), submenu.boundingBox()]);
  if (!item || !popup) throw new Error("Both need boxes.");
  expect(popup.x).toBeGreaterThanOrEqual(item.x + item.width - 1);
  await page.keyboard.press("Escape");
  await expect(submenu).toHaveCount(0);
  await expect(menu(page)).toBeVisible();
});

test("checks and choices change without shutting the menu", async ({ page }, testInfo) => {
  needsMouse(testInfo.project.name);
  await visit(page, "/en/context-menu");
  await pick(page, "Choices");
  await area(page).click({ button: "right" });
  const numbers = menu(page).getByRole("menuitemcheckbox", { name: "Line numbers" });
  await expect(numbers).toHaveAttribute("aria-checked", "false");
  await numbers.click();
  await expect(numbers).toHaveAttribute("aria-checked", "true");
  const dark = menu(page).getByRole("menuitemradio", { name: "Dark" });
  await dark.click();
  await expect(dark).toHaveAttribute("aria-checked", "true");
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole("group", { name: "Theme" })).toBeVisible();
});

test("the same actions are behind a visible Menu button", async ({ page }) => {
  await visit(page, "/en/context-menu");
  await pick(page, "With a menu button");
  await demo(page).getByRole("button", { name: "Photo actions" }).click();
  await expect(menu(page).getByRole("menuitem")).toHaveCount(3);
});

test("a press outside only shuts the menu, and Base UI draws the layer for it", async ({
  page,
}, testInfo) => {
  needsMouse(testInfo.project.name);
  await visit(page, "/en/context-menu");
  await area(page).click({ button: "right" });
  await expect(menu(page)).toBeVisible();
  await expect(page.locator(".ow-menu__backdrop")).toHaveCount(0);
  await page.mouse.click(5, 5);
  await expect(menu(page)).toHaveCount(0);
});

test("Inspect's menu is open inline, beside its area, with no lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/context-menu");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-menu__popup")).toBeVisible();
  await expect(page.locator(".ow-menu__popup")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-menu__popup")).not.toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
