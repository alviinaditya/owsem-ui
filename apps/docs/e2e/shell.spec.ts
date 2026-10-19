import { expect, test } from "@playwright/test";
import { catalog, isAvailable } from "../lib/catalog.ts";

const robots = (page: import("@playwright/test").Page) => page.locator('meta[name="robots"]');

test("the sidebar lists every catalog component", async ({ page }, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  const sidebar = page.getByRole("navigation", { name: "Documentation navigation" });
  for (const entry of catalog) {
    const name = isAvailable(entry) ? entry.title : `${entry.title} Soon`;
    await expect(sidebar.getByRole("link", { name, exact: true })).toHaveCount(1);
  }
});

test("the sidebar fades the edges that have more to scroll", async ({ page }, testInfo) => {
  await page.goto("/en/docs");
  if (testInfo.project.name === "mobile-390") {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  const scroller = page.locator("#site-sidebar");
  await expect(scroller).not.toHaveAttribute("data-fade-top");
  await expect(scroller).toHaveAttribute("data-fade-bottom", "");
  await scroller.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(scroller).toHaveAttribute("data-fade-top", "");
  await expect(scroller).not.toHaveAttribute("data-fade-bottom");
});

test("planned components show Coming soon and stay out of search", async ({ page }) => {
  await page.goto("/en/button");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Button" })).toBeVisible();
  await expect(main.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Button", exact: true })).toHaveAttribute(
    "href",
    "https://base-ui.com/react/components/button",
  );
  await expect(robots(page)).toHaveAttribute("content", /noindex/);

  await page.goto("/en/separator");
  await expect(robots(page)).toHaveCount(0);
});

test("a Lab links the components before and after it", async ({ page }) => {
  await page.goto("/en/separator");
  const nav = page.getByRole("navigation", { name: "Component" });
  await expect(nav.getByRole("link", { name: "Previous: Collapsible" })).toHaveAttribute(
    "rel",
    "prev",
  );
  await expect(nav.getByRole("link", { name: "Next: Scroll Area" })).toHaveAttribute("rel", "next");
});

test("the index filters components by family", async ({ page }) => {
  await page.goto("/en");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Separator", exact: true })).toBeVisible();

  await main.getByLabel("Owsem").check();
  await expect(main.getByRole("link", { name: "Separator", exact: true })).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Lumen Rail Nav", exact: true })).toBeVisible();
  // Base + Owsem components belong to both filters.
  await expect(main.getByRole("link", { name: "Button", exact: true })).toBeVisible();

  await main.getByLabel("Base").check();
  await expect(main.getByRole("link", { name: "Lumen Rail Nav", exact: true })).toHaveCount(0);
  await expect(main.getByRole("link", { name: "Button", exact: true })).toBeVisible();
});

test("the mobile menu opens and closes after navigating", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "the menu button only shows below 900 px");
  await page.goto("/id/docs");
  const menu = page.getByRole("button", { name: "Menu" });
  const sidebar = page.getByRole("navigation", { name: "Navigasi dokumentasi" });
  await expect(sidebar).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  // Escape inside the panel closes it and returns focus to the button.
  await expect(sidebar.getByRole("link").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(sidebar).toBeHidden();
  await menu.click();
  await sidebar.getByRole("link", { name: "Separator" }).click();
  await expect(page).toHaveURL(/\/id\/separator$/);
  await expect(sidebar).toBeHidden();

  // Going back to the page where it was opened keeps it closed.
  await page.goBack();
  await expect(page).toHaveURL(/\/id\/docs$/);
  await expect(sidebar).toBeHidden();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});
