import { expect, test } from "@playwright/test";

const html = (page: import("@playwright/test").Page) => page.locator("html");

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
  const theme = page.getByRole("combobox", { name: "Theme" });
  await theme.selectOption("dark");
  await expect(html(page)).toHaveAttribute("data-theme", "dark");

  // Only the inline <head> script sets data-theme on load; hydration must not log a mismatch.
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(theme).toHaveValue("dark");
  await theme.selectOption("system");
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
  await page.getByRole("combobox", { name: "Theme" }).selectOption("dark");
  await page.getByRole("link", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("combobox", { name: "Tema" })).toHaveValue("dark");
  expect(errors).toEqual([]);
});
