import { expect, type Page, test } from "@playwright/test";
import { tools, visit } from "./example-page.ts";

const html = (page: Page) => page.locator("html");
const theme = (page: Page) => page.getByRole("button", { name: "Theme", exact: true });

test("follows the system theme by default", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(html(page)).not.toHaveAttribute("data-theme");
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });
  expect(await html(page).evaluate((el) => getComputedStyle(el).colorScheme)).toBe("light");
});

test("the Theme button flips the site's theme, keeps it, and restores it on load", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  await expect(html(page)).not.toHaveAttribute("data-theme");
  await theme(page).click();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("owsem-theme"))).toBe("dark");

  // Only the inline <head> script sets data-theme on load; hydration must not log a mismatch.
  await page.reload();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  await theme(page).click();
  await expect(html(page)).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("every kind of page has a Theme button, a narrow component page's in its Menu", async ({
  page,
}, testInfo) => {
  const narrow = testInfo.project.name === "mobile-390";
  await visit(page, "/en/tabs");
  if (narrow) {
    await tools(page).getByRole("button", { name: "Menu", exact: true }).click();
    await expect(page.getByRole("menu").getByRole("menuitem", { name: "Theme" })).toBeVisible();
  } else {
    await expect(theme(page)).toBeVisible();
  }
  // A narrow preview keeps Theme in its toolbar menu (component-page.spec.ts).
  for (const path of ["/en", "/en/docs/theming", ...(narrow ? [] : ["/en/switch"])]) {
    await page.goto(path);
    await expect(theme(page), path).toBeVisible();
  }
});

test("keeps the chosen theme when switching language", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/en/docs");
  await theme(page).click();
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  // A client-side switch: the page is not reloaded, so this survives.
  await page.evaluate(() => Object.assign(window, { owsemMark: "kept" }));
  await page.getByRole("button", { name: "Language: English" }).click();
  await page.getByRole("menuitem", { name: "Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(html(page)).toHaveAttribute("lang", "id");
  expect(await page.evaluate(() => (window as Window & { owsemMark?: string }).owsemMark)).toBe(
    "kept",
  );
  await expect(html(page)).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});
