import { expect, test } from "@playwright/test";

type Page = import("@playwright/test").Page;
const html = (page: Page) => page.locator("html");
const themes = (page: Page, name: string) => page.getByRole("group", { name });

test("follows the system theme by default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(html(page)).not.toHaveAttribute("data-theme");
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("light");
});

test("stores the chosen theme and restores it on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/en");
  const dark = themes(page, "Theme").getByRole("radio", { name: "Dark" });
  await dark.check();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");

  // Only the inline <head> script sets data-theme on load; hydration must not log a mismatch.
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(dark).toBeChecked();
  // The thumb follows <html data-theme> in CSS: under Dark, the second of three.
  const thumb = await page
    .locator(".theme-switcher")
    .evaluate((el) => getComputedStyle(el, "::before").translate);
  expect(thumb).toBe("30px");
  await themes(page, "Theme").getByRole("radio", { name: "System" }).check();
  await expect(html(page)).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => localStorage.getItem("owsem-theme"))).toBeNull();
  expect(errors).toEqual([]);
});

test("keeps the chosen theme when switching language", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/en/docs");
  await themes(page, "Theme").getByRole("radio", { name: "Dark" }).check();
  await page.getByRole("link", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(themes(page, "Tema").getByRole("radio", { name: "Gelap" })).toBeChecked();
  expect(errors).toEqual([]);
});
