import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("menubar", {
  examples: ["Default", "Sizes", "Choices"],
  parts: ["Root", "Trigger", "Popup", "Item", "CheckboxItem"],
  specimen: ".ow-menubar .ow-menubar__trigger",
});

// The menu is in a portal on the body; it is the one open menu on the page.
const menu = (page: Page) => page.getByRole("menu");
const bar = (page: Page) => demo(page).getByRole("menubar");
const trigger = (page: Page, name: string) =>
  bar(page).getByRole("menuitem", { name, exact: true });

test("a trigger opens its menu, stays tinted while it is open, and Escape returns focus", async ({
  page,
}) => {
  await visit(page, "/en/menubar");
  await trigger(page, "Edit").click();
  await expect(menu(page)).toBeVisible();
  await expect(trigger(page, "Edit")).toHaveAttribute("data-popup-open", "");
  await expect(menu(page).getByRole("menuitem")).toHaveCount(3);
  await page.keyboard.press("Escape");
  await expect(menu(page)).toHaveCount(0);
  await expect(trigger(page, "Edit")).toBeFocused();
});

test("arrow keys move between the triggers and, with a menu open, between the menus", async ({
  page,
}) => {
  await visit(page, "/en/menubar");
  await trigger(page, "File").focus();
  await page.keyboard.press("ArrowRight");
  await expect(trigger(page, "Edit")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu(page)).toBeVisible();
  await expect(menu(page).getByRole("menuitem", { name: /Cut/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await trigger(page, "Edit").focus();
  await page.keyboard.press("End");
  await expect(trigger(page, "View")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(trigger(page, "File")).toBeFocused();
});

test("with one menu open, hovering another trigger swaps the menus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "hover needs a mouse");
  await visit(page, "/en/menubar");
  await trigger(page, "File").click();
  await expect(menu(page).getByRole("menuitem", { name: /New/ })).toBeVisible();
  await trigger(page, "Edit").hover();
  await expect(menu(page).getByRole("menuitem", { name: /Cut/ })).toBeVisible();
  await expect(menu(page)).toHaveCount(1);
  await expect(trigger(page, "File")).not.toHaveAttribute("data-popup-open", "");
});

test("File has a submenu, and its checks keep the menu open", async ({ page }) => {
  await visit(page, "/en/menubar");
  await trigger(page, "File").click();
  const exportItem = menu(page).getByRole("menuitem", { name: "Export" });
  await exportItem.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("menu").filter({ has: page.getByRole("menuitem", { name: "PDF" }) }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await trigger(page, "View").click();
  const wrap = menu(page).getByRole("menuitemcheckbox", { name: "Word wrap" });
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-checked", "false");
  await expect(menu(page)).toBeVisible();
});

test("a taller bar has taller triggers", async ({ page }) => {
  await visit(page, "/en/menubar");
  await pick(page, "Sizes");
  const heights = await demo(page)
    .getByRole("menubar")
    .evaluateAll((bars) =>
      bars.map((el) => el.querySelector("button")?.getBoundingClientRect().height ?? 0),
    );
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

test("the bar fits the stage", async ({ page }) => {
  await visit(page, "/en/menubar");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Inspect's menu is open inline under the bar, with no lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/menubar");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-menu__popup")).toBeVisible();
  await expect(page.locator(".ow-menu__popup")).toHaveCount(1);
  await expect(page.locator(".ow-menu__backdrop")).toHaveCount(0);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
