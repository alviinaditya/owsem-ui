import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("input", {
  examples: ["Default", "Sizes", "Icons", "Validation", "Disabled", "Textarea"],
  parts: ["Wrapper", "Input", "Icon"],
  specimen: ".ow-input__icon",
});

test("typing an address turns the input invalid, and back once it is one", async ({ page }) => {
  await visit(page, "/en/input");
  await pick(page, "Validation");
  const email = demo(page).getByRole("textbox", { name: "Email" });
  await expect(email).toHaveValue("");
  await email.pressSequentially("ana@");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(demo(page).getByText("doesn't look like an email")).toBeVisible();
  await email.fill("ana@owsem.dev");
  await expect(email).not.toHaveAttribute("aria-invalid");
  await expect(demo(page).getByText("We send an invite link")).toBeVisible();
});

test("icons sit inside a wrapper, and sizes follow Button's heights", async ({ page }) => {
  await visit(page, "/en/input");
  await pick(page, "Icons");
  await expect(demo(page).locator(".ow-input__wrapper")).toHaveCount(3);
  await expect(demo(page).locator('.ow-input__icon[data-side="start"]')).toHaveCount(2);
  await expect(demo(page).locator('.ow-input__icon[data-side="end"]')).toHaveCount(2);
  await pick(page, "Sizes");
  const heights = await demo(page)
    .locator(".ow-input")
    .evaluateAll((els) =>
      els.map((el) => Math.round(Number.parseFloat(getComputedStyle(el).height))),
    );
  expect(heights).toEqual([32, 40, 48]);
});
