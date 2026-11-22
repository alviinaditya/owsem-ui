import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("dialog", {
  examples: ["Default", "Scrolling", "Viewport", "Nested", "Sheet"],
  parts: ["Root", "Trigger", "Backdrop", "Popup", "Title", "Description", "Close"],
  specimen: ".ow-dialog__popup .ow-dialog__title",
});

// The dialog lands in the demo's window, not in a portal on the body.
const share = (page: Page) => demo(page).locator('[data-demo="share"]');
const panel = (page: Page, name = "Share the draft") => demo(page).getByRole("dialog", { name });

test("a press opens it with a scrim and focus inside; Escape shuts it and focus returns", async ({
  page,
}) => {
  await visit(page, "/en/dialog");
  await share(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(demo(page).locator(".ow-dialog__backdrop")).toHaveCount(1);
  await expect(demo(page).locator('[data-demo="done"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
  await expect(share(page)).toBeFocused();

  // Done shuts it too.
  await share(page).click();
  await demo(page).locator('[data-demo="done"]').click();
  await expect(panel(page)).toHaveCount(0);
  await expect(share(page)).toBeFocused();
});

test("long content scrolls inside the panel, or inside the Viewport", async ({ page }) => {
  await visit(page, "/en/dialog");
  await pick(page, "Scrolling");
  await share(page).click();
  const popup = panel(page);
  await expect(popup).toBeVisible();
  await expect.poll(() => popup.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  // A dialog too long to show whole takes focus itself, so it opens at its start.
  await expect(popup).toBeFocused();
  await page.keyboard.press("Escape");

  await pick(page, "Viewport");
  await share(page).click();
  const viewport = demo(page).locator(".ow-dialog__viewport");
  await expect(viewport).toBeVisible();
  await expect.poll(() => viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  // The panel keeps its full height; it does not scroll itself.
  await expect(panel(page)).toHaveCSS("overflow-y", "visible");
});

test("a dialog nested in another steps the parent back; Escape shuts the top one", async ({
  page,
}) => {
  await visit(page, "/en/dialog");
  await pick(page, "Nested");
  await share(page).click();
  const parent = demo(page).locator('[data-demo="parent"]');
  await expect(parent).toBeVisible();
  const remove = demo(page).locator('[data-demo="remove"]');
  await remove.click();
  await expect(demo(page).getByRole("dialog", { name: "Remove this link?" })).toBeVisible();
  await expect(parent).toHaveAttribute("data-nested-dialog-open", "");
  // Two scrims: the parent dims with the page.
  await expect(demo(page).locator(".ow-dialog__backdrop")).toHaveCount(2);

  await page.keyboard.press("Escape");
  await expect(demo(page).getByRole("dialog", { name: "Remove this link?" })).toHaveCount(0);
  await expect(parent).toBeVisible();
  await expect(parent).not.toHaveAttribute("data-nested-dialog-open", "");
  await expect(remove).toBeFocused();

  await demo(page).locator('[data-demo="done"]').click();
  await expect(parent).toHaveCount(0);
});

test("the sheet is pinned to the bottom of its window", async ({ page }) => {
  await visit(page, "/en/dialog");
  await pick(page, "Sheet");
  await share(page).click();
  const popup = panel(page);
  await expect(popup).toBeVisible();
  await expect
    .poll(async () => {
      const window = await demo(page).locator(".demo-dialog").boundingBox();
      const box = await popup.boundingBox();
      return window && box ? Math.abs(window.y + window.height - (box.y + box.height)) : 99;
    })
    .toBeLessThan(1.5);
});

test("Inspect's dialog is open inline, inert, without a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/dialog");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-dialog__popup")).toBeVisible();
  await expect(specimen(page).locator(".ow-dialog__backdrop")).toHaveCount(1);
  // Nothing in the body, no focus taken, nothing holds the page.
  await expect(page.locator(".ow-dialog__popup")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-dialog__popup")).not.toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
