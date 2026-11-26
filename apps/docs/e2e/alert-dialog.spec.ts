import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("alert-dialog", {
  examples: ["Default", "Destructive", "Controlled", "Scrolling", "Nested"],
  parts: ["Root", "Trigger", "Backdrop", "Popup", "Title", "Description", "Close"],
  specimen: ".ow-alert-dialog__popup .ow-alert-dialog__title",
});

// The alert lands in the demo's window, not in a portal on the body.
const open = (page: Page) => demo(page).locator('[data-demo="open"]');
const alert = (page: Page, name = "Discard this draft?") =>
  demo(page).getByRole("alertdialog", { name });

test("a press opens it with a scrim; focus goes to the safe answer, and Escape gives it back", async ({
  page,
}) => {
  await visit(page, "/en/alert-dialog");
  await open(page).click();
  await expect(alert(page)).toBeVisible();
  await expect(demo(page).locator(".ow-alert-dialog__backdrop")).toHaveCount(1);
  // No close icon: the answers are the only buttons in it.
  await expect(alert(page).getByRole("button")).toHaveCount(2);
  await expect(demo(page).locator('[data-demo="safe"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(alert(page)).toHaveCount(0);
  await expect(open(page)).toBeFocused();
});

test("a press on the scrim does not shut it; an answer does", async ({ page }) => {
  await visit(page, "/en/alert-dialog");
  await open(page).click();
  await expect(alert(page)).toBeVisible();
  await demo(page)
    .locator(".ow-alert-dialog__backdrop")
    .click({ position: { x: 4, y: 4 } });
  await expect(alert(page)).toBeVisible();
  await demo(page).locator('[data-demo="risky"]').click();
  await expect(alert(page)).toHaveCount(0);
  await expect(open(page)).toBeFocused();
});

test("the controlled example reads the answer when it shuts", async ({ page }) => {
  await visit(page, "/en/alert-dialog");
  await pick(page, "Controlled");
  await open(page).click();
  await expect(alert(page, "Delete this draft?")).toBeVisible();
  await demo(page).locator('[data-demo="risky"]').click();
  await expect(alert(page, "Delete this draft?")).toHaveCount(0);
  await expect(demo(page).getByRole("status")).toHaveText("Draft deleted.");
});

test("long content scrolls inside the panel, which takes the first focus", async ({ page }) => {
  await visit(page, "/en/alert-dialog");
  await pick(page, "Scrolling");
  await open(page).click();
  const popup = alert(page, "Terms of service");
  await expect(popup).toBeVisible();
  await expect.poll(() => popup.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(popup).toBeFocused();
});

test("an alert nested in another steps the parent back; Escape shuts the top one", async ({
  page,
}) => {
  await visit(page, "/en/alert-dialog");
  await pick(page, "Nested");
  await open(page).click();
  const parent = demo(page).locator('[data-demo="parent"]');
  await expect(parent).toBeVisible();
  const risky = parent.locator('[data-demo="risky"]');
  await risky.click();
  await expect(alert(page, "Delete for good?")).toBeVisible();
  await expect(parent).toHaveAttribute("data-nested-dialog-open", "");
  await page.keyboard.press("Escape");
  await expect(alert(page, "Delete for good?")).toHaveCount(0);
  await expect(parent).toBeVisible();
  await expect(risky).toBeFocused();
});

test("Inspect's alert is open inline, inert, without a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/alert-dialog");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-alert-dialog__popup")).toBeVisible();
  await expect(specimen(page).locator(".ow-alert-dialog__backdrop")).toHaveCount(1);
  await expect(page.locator(".ow-alert-dialog__popup")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-alert-dialog__popup")).not.toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
