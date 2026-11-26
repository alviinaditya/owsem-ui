import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("preview-card", {
  examples: ["Default", "With an arrow", "Link preview", "Sides"],
  parts: ["Root", "Trigger", "Positioner", "Popup", "Arrow"],
  specimen: ".ow-preview-card__popup .ow-preview-card__arrow",
});

// The card is in a portal on the body; it is the one open card on the page.
const link = (page: Page) => demo(page).locator('[data-demo="link"]').first();
const card = (page: Page) => page.locator(".ow-preview-card__popup");

test("hover opens the card after its delay, and leaving shuts it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "touch does not open a preview card");
  await visit(page, "/en/preview-card");
  await link(page).hover();
  await expect(card(page)).toBeVisible();
  await expect(link(page)).toHaveAttribute("data-popup-open", "");
  await page.mouse.move(0, 0);
  await expect(card(page)).toHaveCount(0);
});

test("keyboard focus opens the card; Escape shuts it and the link keeps focus", async ({
  page,
}) => {
  await visit(page, "/en/preview-card");
  await link(page).focus();
  await expect(card(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(card(page)).toHaveCount(0);
  await expect(link(page)).toBeFocused();
});

test("the arrow example draws an arrow, the plain one does not", async ({ page }) => {
  await visit(page, "/en/preview-card");
  await link(page).focus();
  await expect(card(page)).toBeVisible();
  await expect(card(page).locator(".ow-preview-card__arrow")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await pick(page, "With an arrow");
  await link(page).focus();
  await expect(card(page).locator(".ow-preview-card__arrow")).toHaveCount(1);
});

test("the card is at most 20rem wide", async ({ page }) => {
  await visit(page, "/en/preview-card");
  await pick(page, "Link preview");
  await link(page).focus();
  await expect(card(page)).toBeVisible();
  const [width, rem] = await card(page).evaluate((el) => [
    el.getBoundingClientRect().width,
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  ]);
  expect(width).toBeLessThanOrEqual(20 * (rem ?? 16) + 1);
});

test("a card opens on the side it is asked for", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a phone has no room beside the link");
  await visit(page, "/en/preview-card");
  await pick(page, "Sides");
  const right = demo(page).locator('[data-demo="link"]').nth(1);
  await right.focus();
  await expect(card(page)).toHaveAttribute("data-side", "right");
  const trigger = await right.boundingBox();
  const popup = await card(page).boundingBox();
  if (!trigger || !popup) throw new Error("The link and the card need boxes.");
  expect(popup.x).toBeGreaterThan(trigger.x + trigger.width);
});

test("Inspect's card is open inline, with no lock on the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/preview-card");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-preview-card__popup")).toBeVisible();
  await expect(page.locator(".ow-preview-card__popup")).toHaveCount(1);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
