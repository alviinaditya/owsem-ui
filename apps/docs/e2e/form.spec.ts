import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("form", {
  examples: ["Default", "On change", "Fieldset", "Row"],
  parts: ["Root"],
  specimen: ".ow-form",
});

test("a submit focuses the first invalid field, and lands a server's error on its field", async ({
  page,
}) => {
  await visit(page, "/en/form");
  const email = demo(page).getByRole("textbox", { name: "Email" });
  const username = demo(page).getByRole("textbox", { name: "Username" });
  const submit = demo(page).getByRole("button", { name: "Sign up" });
  await submit.click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");

  await email.fill("ana@owsem.dev");
  await username.fill("admin");
  await submit.click();
  const taken = demo(page).getByText("That name is taken.");
  await expect(taken).toBeVisible();
  await expect(username).toBeFocused();
  await username.fill("admin7");
  await expect(taken).toHaveCount(0);
  await submit.click();
  await expect(demo(page).getByText("Your account is ready.")).toBeVisible();
});

test("on change checks as you type, and on submit waits for the first submit", async ({ page }) => {
  await visit(page, "/en/form");
  // The default waits: typing a bad address says nothing yet.
  const first = demo(page).getByRole("textbox", { name: "Email" });
  await first.pressSequentially("ana@");
  await expect(first).not.toHaveAttribute("aria-invalid");
  await pick(page, "On change");
  const email = demo(page).getByRole("textbox", { name: "Email" });
  await email.pressSequentially("ana@");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(demo(page).getByText("doesn't look like an email")).toBeVisible();
});

test("a Fieldset inside a Form names its group", async ({ page }) => {
  await visit(page, "/en/form");
  await pick(page, "Fieldset");
  await expect(demo(page).getByRole("group", { name: "Profile" })).toBeVisible();
});
