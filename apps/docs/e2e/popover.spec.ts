import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("popover", {
  examples: ["Default", "Placement", "Close", "Detached"],
  parts: ["Root", "Trigger", "Popup", "Arrow", "Title", "Description", "Close"],
  specimen: ".ow-popover__popup .ow-popover__arrow",
});

// The panel is in a portal on the body; it is the one open panel on the page.
const panel = (page: Page, name = "Share the draft") => page.getByRole("dialog", { name });
const share = (page: Page) => demo(page).locator('[data-demo="share"]');

test("the panel opens from Share with its arrow, takes focus, and gives it back", async ({
  page,
}) => {
  await visit(page, "/en/popover");
  await share(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).locator(".ow-popover__arrow")).toHaveCount(1);
  await expect(share(page)).toHaveAttribute("aria-expanded", "true");
  // Not modal: nothing else on the page is held.
  await expect(page.locator(".ow-popover__backdrop")).toHaveCount(0);

  const comments = panel(page).getByRole("button", { name: "Allow comments" });
  await expect(comments).toHaveAttribute("aria-pressed", "false");
  await comments.click();
  await expect(comments).toHaveAttribute("aria-pressed", "true");

  await page.keyboard.press("Escape");
  await expect(panel(page)).toHaveCount(0);
  await expect(share(page)).toBeFocused();
});

test("the panel opens on the side it is asked for", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "a phone has no room beside the button, so it flips",
  );
  await visit(page, "/en/popover");
  await pick(page, "Placement");
  await share(page).click();
  await expect(panel(page)).toHaveAttribute("data-side", "right");
  const trigger = await share(page).boundingBox();
  const popup = await panel(page).boundingBox();
  if (!trigger || !popup) throw new Error("The button and the panel need boxes.");
  expect(popup.x).toBeGreaterThan(trigger.x + trigger.width);
});

test("Popover.Close shuts the panel and returns focus to the trigger", async ({ page }) => {
  await visit(page, "/en/popover");
  await pick(page, "Close");
  await share(page).click();
  await expect(panel(page, "Remove this link?")).toBeVisible();
  await panel(page, "Remove this link?").getByRole("button", { name: "Keep it" }).click();
  await expect(panel(page, "Remove this link?")).toHaveCount(0);
  await expect(share(page)).toBeFocused();
});

test("one panel, two triggers: the link takes the panel over from Share", async ({ page }) => {
  await visit(page, "/en/popover");
  await pick(page, "Detached");
  await share(page).click();
  await expect(panel(page)).toBeVisible();
  const link = demo(page).getByRole("button", { name: "sharing settings" });
  await link.click();
  await expect(link).toHaveAttribute("aria-expanded", "true");
  await expect(share(page)).toHaveAttribute("aria-expanded", "false");
  // The same panel moved: there is still one.
  await expect(page.locator(".ow-popover__popup")).toHaveCount(1);
  await link.click();
  await expect(panel(page)).toHaveCount(0);
});

test("Inspect's panel is open inline, without a portal or a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/popover");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-popover__popup")).toBeVisible();
  await expect(page.locator(".ow-popover__popup")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-popover__popup")).not.toBeFocused();
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
