import type { Page } from "@playwright/test";

export const stage = (page: Page) => page.getByRole("region", { name: "Stage" });

/** The component on the stage, apart from the stage's own toolbar and panels. */
export const demo = (page: Page) => page.locator(".lab-demo");

/** Below 960 px the narrative is a sheet over the stage, opened from the stage's toolbar. */
export async function openSheet(page: Page): Promise<void> {
  const docs = page.locator(".lab-tool-docs");
  if ((await docs.isVisible()) && (await docs.getAttribute("aria-expanded")) === "false") {
    await docs.click();
  }
}

/** Presses a stage tool; a narrow stage keeps some in its More menu, under `item`. */
export async function stageTool(page: Page, name: string, item = name): Promise<void> {
  const more = stage(page).getByRole("button", { name: "More", exact: true });
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("menu").locator('[role^="menuitem"]', { hasText: item }).click();
  } else {
    await stage(page).getByRole("button", { name, exact: true }).click();
  }
}

/** Sets a Lab color control through Color Picker's Hex field, as a person types it. */
export async function pickColor(page: Page, label: string, hex: string): Promise<void> {
  await stage(page)
    .getByRole("button", { name: new RegExp(`^${label} `) })
    .click();
  const field = page.getByRole("dialog", { name: label }).getByRole("textbox", { name: "Hex" });
  await field.fill(hex.replace("#", ""));
  await field.press("Enter");
  await page.keyboard.press("Escape");
}
