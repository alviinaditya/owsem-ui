import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("field", {
  examples: ["Default", "Validation", "Invalid", "Disabled", "Textarea"],
  parts: ["Root", "Label", "Control", "Description", "Error"],
  specimen: ".ow-field__error",
});

test("typing an address shows the error, and it joins the control's description", async ({
  page,
}) => {
  await visit(page, "/en/field");
  const email = demo(page).getByRole("textbox", { name: "Work email" });
  await expect(email).toHaveAccessibleDescription("We only use it to sign you in.");
  await email.pressSequentially("ana@");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAccessibleDescription(/doesn't look like an email/);
  await email.fill("ana@owsem.dev");
  await expect(email).not.toHaveAttribute("aria-invalid");
  await expect(email).toHaveAccessibleDescription("We only use it to sign you in.");
});

test("native and custom checks each show their own message", async ({ page }) => {
  await visit(page, "/en/field");
  await pick(page, "Validation");
  const name = demo(page).getByRole("textbox", { name: "Username" });
  const validity = demo(page).locator('[data-demo="validity"]');
  await expect(validity).toHaveText("Not checked yet");
  await name.fill("ad");
  await expect(demo(page).getByText("Use lowercase letters and numbers")).toBeVisible();
  await expect(validity).toHaveText("Invalid");
  await name.fill("admin");
  await expect(demo(page).getByText("That name is taken.")).toBeVisible();
  await name.fill("admin7");
  await expect(validity).toHaveText("Valid");
  await expect(demo(page).locator(".ow-field__error")).toHaveCount(0);
});

test("a disabled field disables its control", async ({ page }) => {
  await visit(page, "/en/field");
  await pick(page, "Disabled");
  await expect(demo(page).getByRole("textbox", { name: "Work email" })).toBeDisabled();
});
