import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";
import { thumbKey } from "./helpers.ts";

pageTests("tabs", {
  examples: ["Default", "Sizes", "Icons", "Vertical", "Overflow", "Full width"],
  parts: ["Root", "List", "Tab", "Indicator", "Panel"],
  specimen: ".ow-tabs__indicator",
});

test("the indicator lands on the picked tab, and one panel shows", async ({ page }) => {
  await visit(page, "/en/tabs");
  const list = demo(page).getByRole("tablist", { name: "Project" });
  const members = list.getByRole("tab", { name: "Members" });
  await members.click();
  await expect(members).toHaveAttribute("aria-selected", "true");
  await expect(demo(page).getByRole("tabpanel", { name: "Members" })).toContainText(
    "Five people on this project",
  );
  await expect(demo(page).getByRole("tabpanel")).toHaveCount(1);
  const key = list.locator(".ow-tabs__indicator");
  await expect
    .poll(async () => {
      const [at, under] = await Promise.all([thumbKey(key), members.boundingBox()]);
      return Math.abs(at.x - (under?.x ?? 99));
    })
    .toBeLessThanOrEqual(0.5);
});

test("the arrow keys move focus, and a vertical list answers to the vertical arrows", async ({
  page,
}) => {
  await visit(page, "/en/tabs");
  const list = demo(page).getByRole("tablist", { name: "Project" });
  await list.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Activity" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(list.getByRole("tab", { name: "Activity" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await pick(page, "Vertical");
  const column = demo(page).getByRole("tablist", { name: "Project" });
  await expect(column).toHaveAttribute("aria-orientation", "vertical");
  const [first, second] = await column
    .getByRole("tab")
    .evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect().top));
  expect(second).toBeGreaterThan(first ?? 0);
  await column.getByRole("tab", { name: "Overview" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(column.getByRole("tab", { name: "Activity" })).toBeFocused();
});

test("tabs that do not fit scroll the list, and a picked tab the edge cuts comes in", async ({
  page,
}) => {
  await visit(page, "/en/tabs");
  await pick(page, "Overflow");
  const list = demo(page).getByRole("tablist", { name: "Project" });
  const fits = await list.evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits).toBe(false);
  expect(await list.evaluate((el) => el.scrollLeft)).toBe(0);
  const last = list.getByRole("tab", { name: "Settings" });
  await last.click();
  await expect(last).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(async () => {
      const [tab, edge] = await Promise.all([last.boundingBox(), list.boundingBox()]);
      return (tab?.x ?? 0) + (tab?.width ?? 0) <= (edge?.x ?? 0) + (edge?.width ?? 0) + 1;
    })
    .toBe(true);
  expect(await list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test("full width gives every tab one width, and a disabled tab cannot be picked", async ({
  page,
}) => {
  await visit(page, "/en/tabs");
  await pick(page, "Full width");
  const widths = await demo(page)
    .getByRole("tab")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  expect(widths).toHaveLength(3);
  expect(new Set(widths).size).toBe(1);

  await pick(page, "Sizes");
  const members = demo(page)
    .getByRole("tablist", { name: "Project, md" })
    .getByRole("tab", { name: "Members" });
  await expect(members).toBeDisabled();
});
