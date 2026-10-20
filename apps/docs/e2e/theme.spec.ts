import { expect, type TestInfo, test } from "@playwright/test";

type Page = import("@playwright/test").Page;
const html = (page: Page) => page.locator("html");
const themes = (page: Page, name: string) => page.getByRole("group", { name });

/** Below 1100 px the switchers live in the sidebar, which the dock's Menu opens. */
async function showSettings(page: Page, testInfo: TestInfo) {
  if (testInfo.project.name !== "mobile-390") return;
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  if ((await menu.getAttribute("aria-expanded")) !== "true") await menu.click();
}

test("follows the system theme by default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(html(page)).not.toHaveAttribute("data-theme");
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("light");
});

test("stores the chosen theme and restores it on load", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/en");
  await showSettings(page, testInfo);
  const dark = themes(page, "Theme").getByRole("button", { name: "Dark" });
  await dark.click();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");

  // Only the inline <head> script sets data-theme on load; hydration must not log a mismatch.
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await showSettings(page, testInfo);
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  // The thumb is under Dark, placed there on hydration without sliding from a default.
  const thumb = page.locator(".theme-switcher .ow-toggle-group-thumb");
  await expect(thumb).toHaveCSS("opacity", "1");
  expect(await thumb.evaluate((el) => el.getAnimations().length)).toBe(0);
  const [at, under] = await Promise.all([thumb.boundingBox(), dark.boundingBox()]);
  expect(Math.abs((at?.x ?? 0) - (under?.x ?? 1))).toBeLessThanOrEqual(0.5);
  expect(Math.abs((at?.width ?? 0) - (under?.width ?? 1))).toBeLessThanOrEqual(0.5);
  await themes(page, "Theme").getByRole("button", { name: "System" }).click();
  await expect(html(page)).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => localStorage.getItem("owsem-theme"))).toBeNull();
  expect(errors).toEqual([]);
});

test("keeps the chosen theme when switching language", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/en/docs");
  await showSettings(page, testInfo);
  await themes(page, "Theme").getByRole("button", { name: "Dark" }).click();
  // A client-side switch: the page is not reloaded, so this survives.
  await page.evaluate(() => Object.assign(window, { owsemMark: "kept" }));
  await page.getByRole("link", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(html(page)).toHaveAttribute("lang", "id");
  expect(await page.evaluate(() => (window as Window & { owsemMark?: string }).owsemMark)).toBe(
    "kept",
  );
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await showSettings(page, testInfo);
  await expect(themes(page, "Tema").getByRole("button", { name: "Gelap" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(errors).toEqual([]);
});
