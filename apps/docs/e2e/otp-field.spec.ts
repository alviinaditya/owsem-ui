import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("otp-field", {
  examples: ["Default", "Sizes", "Grouped", "States", "Masked"],
  parts: ["Root", "Input"],
  specimen: ".ow-otp-field",
});

test("six slots named by the label, typing fills them in turn", async ({ page }) => {
  await visit(page, "/en/otp-field");
  const slots = demo(page).getByRole("textbox", { name: "Verification code" });
  await expect(slots).toHaveCount(6);
  await slots.first().click();
  await page.keyboard.type("482");
  await expect(slots.nth(0)).toHaveValue("4");
  await expect(slots.nth(2)).toHaveValue("2");
  await expect(slots.nth(3)).toBeFocused();
  await page.keyboard.press("Backspace");
  await expect(slots.nth(2)).toBeFocused();
  await expect(slots.nth(2)).toHaveValue("");
});

test("pasting a whole code fills every slot", async ({ page }) => {
  await visit(page, "/en/otp-field");
  const slots = demo(page).getByRole("textbox", { name: "Verification code" });
  await slots.first().focus();
  await slots.first().evaluate((el) => {
    const data = new DataTransfer();
    data.setData("text/plain", "135790");
    el.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
    );
  });
  await expect
    .poll(() =>
      slots.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value).join("")),
    )
    .toBe("135790");
});

test("the sizes make 32, 40, and 48px square slots", async ({ page }) => {
  await visit(page, "/en/otp-field");
  await pick(page, "Sizes");
  for (const [name, side] of [
    ["Small", 32],
    ["Medium", 40],
    ["Large", 48],
  ] as const) {
    const first = demo(page).getByRole("group", { name }).locator("input").first();
    const box = await first.boundingBox();
    expect(box?.width).toBe(side);
    expect(box?.height).toBe(side);
  }
});

test("the grouped example has a dash between two groups of three", async ({ page }) => {
  await visit(page, "/en/otp-field");
  await pick(page, "Grouped");
  const group = demo(page).getByRole("group", { name: "Activation code" });
  await expect(group.locator("input.ow-otp-field__input")).toHaveCount(6);
  await expect(group.locator(".demo-otp-dash")).toHaveCount(1);
  const [a, dash, b] = await Promise.all([
    group.locator("input.ow-otp-field__input").nth(2).boundingBox(),
    group.locator(".demo-otp-dash").boundingBox(),
    group.locator("input.ow-otp-field__input").nth(3).boundingBox(),
  ]);
  if (!a || !dash || !b) throw new Error("not laid out");
  expect(dash.x).toBeGreaterThan(a.x + a.width);
  expect(dash.x + dash.width).toBeLessThan(b.x);
});

test("a wrong complete code shows the error, and the right one clears it", async ({ page }) => {
  await visit(page, "/en/otp-field");
  await pick(page, "States");
  const slots = demo(page).getByRole("textbox", { name: "Verification code" });
  await slots.first().click();
  await page.keyboard.type("654321");
  await expect(demo(page).getByText("That code is wrong. Try again.")).toBeVisible();
  await expect(slots.first()).toHaveAttribute("aria-invalid", "true");
  await slots.first().click();
  await page.keyboard.type("123456");
  await expect(demo(page).getByText("That code is wrong. Try again.")).toHaveCount(0);
});

test("a masked field hides its characters", async ({ page }) => {
  await visit(page, "/en/otp-field");
  await pick(page, "Masked");
  const slots = demo(page).locator("input.ow-otp-field__input");
  await expect(slots).toHaveCount(4);
  await expect(slots.first()).toHaveAttribute("type", "password");
});
