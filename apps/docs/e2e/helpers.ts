import { expect, type Locator, type Page } from "@playwright/test";

/** A Toggle Group thumb's key: its box inside the clear border that keeps the track's padding. */
export const thumbKey = (thumb: Locator) =>
  thumb.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const border = Number.parseFloat(getComputedStyle(el).borderTopWidth);
    return { x: box.x + border, width: box.width - 2 * border };
  });

/** The sidebar: a nav beside the page, or the drawer (a dialog) below 768 px. */
export const sidebar = (page: Page, name = "Documentation navigation") =>
  page.getByRole("navigation", { name }).or(page.getByRole("dialog", { name }));

/** Below 768 px the sidebar is a drawer, opened from the button at the page's top left. */
export async function showSidebar(page: Page, name = "Documentation navigation"): Promise<void> {
  // A press before the page has hydrated does nothing.
  await expect(page.locator(".site")).toHaveAttribute("data-mounted", "");
  await page.getByRole("button", { name: /Show sidebar|Tampilkan sidebar/ }).click();
  await expect(sidebar(page, name)).toBeVisible();
}
