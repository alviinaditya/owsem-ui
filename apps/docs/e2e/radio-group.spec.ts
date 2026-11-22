import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("radio-group", {
  examples: ["Default", "Sizes", "Row", "Controlled", "Mark", "Disabled"],
  parts: ["Group", "Row", "Radio", "Indicator"],
  specimen: ".ow-radio-group__radio[data-checked] .ow-radio-group__indicator",
});

test("a row picks its option, and the arrows move and pick", async ({ page }) => {
  await visit(page, "/en/radio-group");
  const group = demo(page).getByRole("radiogroup", { name: "Delivery" });
  const standard = group.getByRole("radio", { name: "Standard" });
  const express = group.getByRole("radio", { name: "Express" });
  await expect(standard).toHaveAttribute("aria-checked", "true");
  // The row's text, not the circle.
  await group.locator("label", { hasText: "Express" }).click();
  await expect(express).toHaveAttribute("aria-checked", "true");
  await expect(express.locator(".ow-radio-group__indicator")).toBeVisible();
  await expect(standard.locator(".ow-radio-group__indicator")).toHaveCount(0);

  await express.press("ArrowDown");
  const pickup = group.getByRole("radio", { name: "Pick up in store" });
  await expect(pickup).toBeFocused();
  await expect(pickup).toHaveAttribute("aria-checked", "true");
});

test("one rule on className lays the options out in a row", async ({ page }) => {
  await visit(page, "/en/radio-group");
  await expect(demo(page).getByRole("radiogroup")).toHaveCSS("flex-direction", "column");
  await pick(page, "Row");
  const group = demo(page).getByRole("radiogroup", { name: "Delivery" });
  await expect(group).toHaveCSS("flex-direction", "row");
  const [a, b] = await group
    .locator("label")
    .evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect().toJSON()));
  // Side by side: the second starts after the first, on the same line.
  expect(b.x).toBeGreaterThan(a.x + a.width - 1);
  expect(Math.abs(b.y - a.y)).toBeLessThan(1);
});

test("a controlled group drives the note, and a glyph replaces the dot", async ({ page }) => {
  await visit(page, "/en/radio-group");
  await pick(page, "Controlled");
  await expect(demo(page)).toContainText("Arrives in 3 to 5 days.");
  await demo(page).getByText("Express").click();
  await expect(demo(page)).toContainText("Arrives tomorrow morning.");

  await pick(page, "Mark");
  const checked = demo(page).getByRole("radio", { name: "Express" });
  await expect(checked.locator(".ow-radio-group__indicator svg")).toHaveCount(1);
});

test("a disabled group ignores presses, and a read-only one keeps its choice", async ({ page }) => {
  await visit(page, "/en/radio-group");
  await pick(page, "Disabled");
  for (const name of ["Disabled", "Read-only"]) {
    const group = demo(page).getByRole("radiogroup", { name });
    await group.locator("label", { hasText: "Express" }).click({ force: true });
    await expect(group.getByRole("radio", { name: "Standard" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  }
});

test("sizes grow the circle", async ({ page }) => {
  await visit(page, "/en/radio-group");
  await pick(page, "Sizes");
  const widths = await demo(page)
    .locator(".ow-radio-group__radio")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  // Two options per size: sm, md, lg.
  expect(widths).toEqual([19, 19, 20, 20, 22, 22]);
});
