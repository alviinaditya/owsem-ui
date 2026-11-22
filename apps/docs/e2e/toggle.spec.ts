import { expect, test } from "@playwright/test";
import { demo, pageTests, picker, visit } from "./example-page.ts";

pageTests("toggle", {
  examples: ["Default", "Sizes", "Icon only", "Disabled", "Controlled"],
  parts: ["Root", "Icon"],
  specimen: ".ow-toggle[data-pressed] .ow-toggle__icon",
});

test("a press turns the toggle on and off", async ({ page }) => {
  await visit(page, "/en/toggle");
  const pin = demo(page).getByRole("button", { name: "Pin" });
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "false");
  await expect(pin).not.toHaveAttribute("data-pressed");
});

test("icon-only toggles format the line, and sizes grow", async ({ page }) => {
  await visit(page, "/en/toggle");
  await picker(page).getByRole("button", { name: "Icon only" }).click();
  const italic = demo(page).getByRole("button", { name: "Italic" });
  const note = demo(page).getByText("Launch moves to Friday");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
  await expect(note).toHaveCSS("font-weight", "600");
  await italic.click();
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(note).toHaveCSS("font-style", "italic");

  await picker(page).getByRole("button", { name: "Sizes" }).click();
  const heights = await demo(page)
    .locator(".ow-toggle")
    .evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height * 100) / 100),
    );
  expect(heights).toHaveLength(3);
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

test("a disabled toggle ignores presses; a controlled one reports its state", async ({ page }) => {
  await visit(page, "/en/toggle");
  await picker(page).getByRole("button", { name: "Disabled" }).click();
  const off = demo(page).getByRole("button", { name: "Pin" }).first();
  await off.click({ force: true });
  await expect(off).toHaveAttribute("aria-pressed", "false");

  await picker(page).getByRole("button", { name: "Controlled" }).click();
  await expect(demo(page).getByText("Not pinned")).toBeVisible();
  await demo(page).getByRole("button", { name: "Pin" }).click();
  await expect(demo(page).getByText("Pinned", { exact: true })).toBeVisible();
});
