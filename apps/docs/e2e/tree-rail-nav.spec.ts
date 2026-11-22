import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("tree-rail-nav", {
  examples: ["Default", "Closed group", "No origin", "Recolor"],
  parts: ["Root", "Origin", "List", "Toggle", "Link", "Panel", "Icon", "Label"],
  specimen: ".ow-tree-rail-nav__item[data-current]",
});

const nav = (page: Page) => demo(page).getByRole("navigation", { name: "Documentation" });
const current = (page: Page) => nav(page).locator("a[aria-current]");

test("a click picks a row, and the trail follows it", async ({ page }) => {
  await visit(page, "/en/tree-rail-nav");
  await expect(current(page)).toHaveText("Dark mode");
  await nav(page).locator('a[href="#install"]').click();
  await expect(current(page)).toHaveText("Installation");
  await expect(current(page)).toHaveAttribute("data-current", "");
  await expect(nav(page).locator(".ow-tree-rail-nav__rail-trail")).not.toHaveCount(0);
});

test("a group's row opens and closes its panel, and the marker is hollow inside a closed one", async ({
  page,
}) => {
  await visit(page, "/en/tree-rail-nav");
  const theming = nav(page).getByRole("button", { name: "Theming" });
  await expect(theming).toHaveAttribute("aria-expanded", "true");
  await expect(nav(page).locator(".ow-tree-rail-nav__rail-marker[data-hollow]")).toHaveCount(0);
  await theming.click();
  await expect(theming).toHaveAttribute("aria-expanded", "false");
  await expect(nav(page).locator(".ow-tree-rail-nav__rail-marker[data-hollow]")).toHaveCount(1);
  await theming.click();
  await expect(theming).toHaveAttribute("aria-expanded", "true");

  // The Closed group example starts like that.
  await pick(page, "Closed group");
  await expect(nav(page).getByRole("button", { name: "Theming" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(nav(page).locator(".ow-tree-rail-nav__rail-marker[data-hollow]")).toHaveCount(1);
});

test("arrow keys move along the rows, open and close groups, and skip a disabled one", async ({
  page,
}) => {
  await visit(page, "/en/tree-rail-nav");
  const row = (name: string) => nav(page).getByRole("link", { name, exact: true });
  await row("Dark mode").focus();
  // Density is disabled: Down goes past it.
  await page.keyboard.press("ArrowDown");
  await expect(nav(page).getByRole("button", { name: "Components" })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(row("Dark mode")).toBeFocused();
  // Left climbs to the parent row, then closes it; Right opens it and moves in.
  await page.keyboard.press("ArrowLeft");
  const theming = nav(page).getByRole("button", { name: "Theming" });
  await expect(theming).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(theming).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("ArrowRight");
  await expect(theming).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowRight");
  await expect(row("Tokens")).toBeFocused();
  await page.keyboard.press("End");
  await expect(row("Changelog")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(row("Overview")).toBeFocused();
});

test("the docs' element defaults never override the component's own styles", async ({ page }) => {
  await visit(page, "/en/tree-rail-nav");
  const color = (href: string) =>
    nav(page)
      .locator(`a[href="${href}"]`)
      .evaluate((el) => getComputedStyle(el).color);
  // A disabled row is dimmer than a plain one: the docs' `a { color: inherit }` sits under it.
  expect(await color("#density")).not.toBe(await color("#install"));
  await expect(nav(page).locator('a[href="#density"]')).toHaveAttribute("aria-disabled", "true");
  // The component's focus ring stays inside the row, not the docs' outward one.
  const install = nav(page).locator('a[href="#install"]');
  await install.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(install).toBeFocused();
  await expect(install).toHaveCSS("outline-offset", "-2px");
});

test("No origin starts the rail at the first row", async ({ page }) => {
  await visit(page, "/en/tree-rail-nav");
  await expect(demo(page).locator(".ow-tree-rail-nav__origin")).toHaveCount(1);
  await pick(page, "No origin");
  await expect(demo(page).locator(".ow-tree-rail-nav__origin")).toHaveCount(0);
  await expect(current(page)).toHaveText("Overview");
});
