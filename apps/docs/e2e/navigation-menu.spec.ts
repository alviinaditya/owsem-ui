import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("navigation-menu", {
  examples: ["Default", "With an arrow", "Sizes"],
  parts: ["Root", "List", "Trigger", "Popup", "Arrow", "Viewport", "Content", "Link"],
  specimen: ".ow-navigation-menu__popup .ow-navigation-menu__arrow",
});

// The panel is in a portal on the body; it is the one open panel on the page.
const panel = (page: Page) => page.locator(".ow-navigation-menu__popup");
const trigger = (page: Page, name: string) =>
  demo(page).getByRole("button", { name, exact: true }).first();

test("a click opens a panel, the chevron turns, and Escape returns focus", async ({ page }) => {
  await visit(page, "/en/navigation-menu");
  await trigger(page, "Products").click();
  await expect(panel(page)).toBeVisible();
  await expect(trigger(page, "Products")).toHaveAttribute("data-popup-open", "");
  await expect(panel(page).getByRole("link")).toHaveCount(4);
  await expect(trigger(page, "Products").locator(".ow-navigation-menu__icon")).toHaveAttribute(
    "data-popup-open",
    "",
  );
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
  await expect(trigger(page, "Products")).toBeFocused();
});

test("moving to another trigger swaps the content in the one panel", async ({ page }, testInfo) => {
  await visit(page, "/en/navigation-menu");
  await trigger(page, "Products").click();
  await expect(panel(page).getByRole("link", { name: /Components/ })).toBeVisible();
  const before = await panel(page).boundingBox();
  // Hover swaps it, as a pointer does; a click on top of that would toggle it shut.
  await trigger(page, "Resources").hover();
  await expect(panel(page).getByRole("link", { name: /Guides/ })).toBeVisible();
  await expect(panel(page).getByRole("link", { name: /Components/ })).toHaveCount(0);
  await expect(panel(page)).toHaveCount(1);
  test.skip(testInfo.project.name !== "desktop", "on a phone both panels are one column");
  // It resized to the new content: a list of three is narrower and shorter than the grid.
  await expect
    .poll(async () => (await panel(page).boundingBox())?.width ?? 0)
    .toBeLessThan(before?.width ?? 0);
});

test("the keyboard moves between the triggers and a link follows in the row", async ({ page }) => {
  await visit(page, "/en/navigation-menu");
  await trigger(page, "Products").focus();
  await page.keyboard.press("ArrowRight");
  await expect(trigger(page, "Resources")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(demo(page).getByRole("link", { name: "Pricing" })).toBeFocused();
});

test("on a phone the list fits, the panel stays inside the window, and a click opens it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the phone layout");
  await visit(page, "/en/navigation-menu");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await trigger(page, "Products").click();
  await expect(panel(page)).toBeVisible();
  const box = await panel(page).boundingBox();
  const width = page.viewportSize()?.width ?? 390;
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
  await expect(panel(page).getByRole("link", { name: /Components/ })).toBeVisible();
  await trigger(page, "Resources").click();
  await expect(panel(page).getByRole("link", { name: /Guides/ })).toBeVisible();
});

test("sizes grow the triggers", async ({ page }) => {
  await visit(page, "/en/navigation-menu");
  await pick(page, "Sizes");
  const heights = await demo(page)
    .getByRole("navigation")
    .evaluateAll((navs) =>
      navs.map((nav) => nav.querySelector("button")?.getBoundingClientRect().height ?? 0),
    );
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

test("Inspect's panel is open inline, beside its list, with no lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/navigation-menu");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-navigation-menu__popup")).toBeVisible();
  await expect(page.locator(".ow-navigation-menu__popup")).toHaveCount(1);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
