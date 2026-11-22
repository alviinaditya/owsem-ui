import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("fieldset", {
  examples: ["Default", "Disabled", "Columns", "Heading"],
  parts: ["Root", "Legend"],
  specimen: ".ow-fieldset__legend",
});

test("the legend names the group, and one switch turns the whole group off, then on", async ({
  page,
}) => {
  await visit(page, "/en/fieldset");
  await expect(demo(page).getByRole("group", { name: "Billing address" })).toBeVisible();
  await pick(page, "Disabled");
  const group = demo(page).getByRole("group", { name: "Billing address" });
  const street = group.getByRole("textbox", { name: "Street" });
  const city = group.getByRole("textbox", { name: "City" });
  await expect(street).toBeDisabled();
  await expect(city).toBeDisabled();
  await demo(page).getByRole("switch").click();
  await expect(street).toBeEnabled();
  await expect(city).toBeEnabled();
});

test("the legend can render as a heading and still name the group", async ({ page }) => {
  await visit(page, "/en/fieldset");
  await pick(page, "Heading");
  await expect(demo(page).getByRole("heading", { name: "Billing address" })).toBeVisible();
  await expect(demo(page).getByRole("group", { name: "Billing address" })).toBeVisible();
});
