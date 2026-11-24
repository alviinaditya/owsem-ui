import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("checkbox-group", {
  examples: ["Default", "Sizes", "Select all", "Disabled"],
  parts: ["Group", "Row", "Checkbox"],
  specimen: ".ow-checkbox-group",
});

test("a named group of boxes: a press on a row ticks it", async ({ page }) => {
  await visit(page, "/en/checkbox-group");
  const group = demo(page).getByRole("group", { name: "Toppings" });
  const cheese = group.getByRole("checkbox", { name: "Cheese" });
  const olives = group.getByRole("checkbox", { name: "Olives" });
  await expect(cheese).toBeChecked();
  await expect(olives).not.toBeChecked();
  await group.getByText("Olives").click();
  await expect(olives).toBeChecked();
});

test("the sizes make rows 32, 40, and 48px tall", async ({ page }) => {
  await visit(page, "/en/checkbox-group");
  await pick(page, "Sizes");
  const groups = demo(page).locator(".ow-checkbox-group");
  await expect(groups).toHaveCount(3);
  expect(
    await groups.evaluateAll((els) =>
      els.map((el) => el.querySelector("label")?.getBoundingClientRect().height),
    ),
  ).toEqual([32, 40, 48]);
});

test("select all: the parent shows a minus for some, and ticks or clears every box", async ({
  page,
}) => {
  await visit(page, "/en/checkbox-group");
  await pick(page, "Select all");
  const group = demo(page).getByRole("group", { name: "Toppings" });
  const all = group.getByRole("checkbox", { name: "All toppings" });
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await group.getByText("All toppings").click();
  await expect(group.getByRole("checkbox", { checked: true })).toHaveCount(5);
  await group.getByText("All toppings").click();
  await expect(group.getByRole("checkbox", { checked: true })).toHaveCount(0);
});

test("a disabled group ignores presses, and one box can be disabled alone", async ({ page }) => {
  await visit(page, "/en/checkbox-group");
  await pick(page, "Disabled");
  const off = demo(page).getByRole("group", { name: "Disabled", exact: true });
  await expect(off.getByRole("checkbox", { name: "Olives" })).toBeDisabled();
  const one = demo(page).getByRole("group", { name: "One disabled" });
  await expect(one.getByRole("checkbox", { name: "Olives" })).toBeDisabled();
  await expect(one.getByRole("checkbox", { name: "Cheese" })).toBeEnabled();
});
