import { expect, test } from "@playwright/test";
import { demo, pageTests, picker, tools, visit } from "./example-page.ts";

pageTests("table", {
  examples: ["Default", "With caption", "Sizes", "Stacked", "Scrolling"],
  parts: ["Root", "Caption", "Header", "Head", "Body", "Row", "Cell", "Footer"],
  specimen: ".ow-table__cell",
});

const table = (page: Parameters<typeof demo>[0]) => demo(page).locator(".ow-table").first();

test("the default table is a card with its rows in a table", async ({ page }) => {
  await visit(page, "/en/table");
  await expect(table(page)).toHaveAttribute("data-layout", "table");
  await expect(demo(page).getByRole("columnheader")).toHaveText([
    "Invoice",
    "Status",
    "Method",
    "Amount",
  ]);
  await expect(demo(page).getByRole("row")).toHaveCount(5);
});

test("the caption sits above the card", async ({ page }) => {
  await visit(page, "/en/table");
  await picker(page).getByRole("button", { name: "With caption" }).click();
  const card = await table(page).boundingBox();
  const caption = await demo(page).locator("caption").boundingBox();
  expect(caption && card && caption.y + caption.height <= card.y + 1).toBe(true);
  await expect(demo(page).getByRole("table", { name: "Recent invoices" })).toBeVisible();
});

test("a narrow table stacks its rows, each cell led by its heading", async ({ page }) => {
  await visit(page, "/en/table");
  await picker(page).getByRole("button", { name: "Stacked" }).click();
  await expect(table(page)).toHaveAttribute("data-layout", "stack");
  const status = demo(page).locator("tbody tr").first().locator("td").nth(1);
  await expect(status).toHaveAttribute("data-label", "Status");
  await expect(status).toHaveCSS("display", "grid");
});

test("a wide table scrolls inside its card and can be focused", async ({ page }) => {
  await visit(page, "/en/table");
  await picker(page).getByRole("button", { name: "Scrolling" }).click();
  const scroller = demo(page).locator(".ow-table__scroll");
  await expect(scroller).toHaveAttribute("tabindex", "0");
  await expect(scroller).toHaveAttribute("data-overflow-end", "");
  await scroller.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(scroller).toHaveAttribute("data-overflow-start", "");
});

test("the docs' own tables are Tables, and two in a row stay apart", async ({ page }) => {
  await visit(page, "/en/button");
  await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
  const docs = page.locator(".cp-docs");
  expect(await docs.locator(".ow-table").count()).toBeGreaterThan(1);
  const h3 = docs.locator("h3");
  await expect(h3.filter({ hasText: "Props" }).first()).toBeVisible();
  await expect(h3.filter({ hasText: "Data attributes" }).first()).toBeVisible();
  await expect(h3.filter({ hasText: "CSS classes" })).toHaveCount(1);
});
