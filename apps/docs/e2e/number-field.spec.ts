import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("number-field", {
  examples: ["Default", "Sizes", "Format", "Scrub", "With a field and an error"],
  parts: ["Root", "ScrubArea", "Group", "Decrement", "Input", "Increment"],
  specimen: ".ow-number-field",
});

test("a labelled field steps with its buttons and the keyboard", async ({ page }) => {
  await visit(page, "/en/number-field");
  const input = demo(page).getByRole("textbox", { name: "Quantity" });
  await expect(input).toHaveValue("2");
  await demo(page).getByRole("button", { name: "Increase" }).click();
  await expect(input).toHaveValue("3");
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("1");
});

test("the sizes make fields 32, 40, and 48px tall", async ({ page }) => {
  await visit(page, "/en/number-field");
  await pick(page, "Sizes");
  const groups = demo(page).locator(".ow-number-field__group");
  await expect(groups).toHaveCount(3);
  expect(
    await groups.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
  ).toEqual([32, 40, 48]);
});

test("formats show a currency, a percent, and a unit", async ({ page }) => {
  await visit(page, "/en/number-field");
  await pick(page, "Format");
  await expect(demo(page).getByRole("textbox", { name: "Price" })).toHaveValue("$24.50");
  await expect(demo(page).getByRole("textbox", { name: "Discount" })).toHaveValue("25%");
  await expect(demo(page).getByRole("textbox", { name: "Weight" })).toHaveValue("2.5 kg");
});

test("the scrub area wraps the label with a resize cursor", async ({ page }) => {
  await visit(page, "/en/number-field");
  await pick(page, "Scrub");
  const area = demo(page).locator(".ow-number-field__scrub-area");
  await expect(area).toContainText("Amount, drag to change");
  expect(await area.evaluate((el) => getComputedStyle(el).cursor)).toBe("ew-resize");
});

test("a value over ten marks the field invalid with its error, and stepping down clears it", async ({
  page,
}) => {
  await visit(page, "/en/number-field");
  await pick(page, "With a field and an error");
  const input = demo(page).getByRole("textbox", { name: "Seats" });
  await expect(input).toHaveValue("12");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(demo(page).getByText("Choose 10 seats or fewer.")).toBeVisible();
  await demo(page).getByRole("button", { name: "Decrease" }).click();
  await demo(page).getByRole("button", { name: "Decrease" }).click();
  await expect(input).toHaveValue("10");
  await expect(demo(page).getByText("Choose 10 seats or fewer.")).toHaveCount(0);
});
