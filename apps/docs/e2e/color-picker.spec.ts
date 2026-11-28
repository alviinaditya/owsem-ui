import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("color-picker", {
  examples: ["Default", "Callbacks", "Format", "Popover", "Sizes", "Themes"],
  parts: ["Root", "Area", "Hue", "Alpha", "EyeDropper", "Preview", "Format", "Field", "Swatches"],
  specimen: ".ow-color-picker__area .ow-color-picker__thumb",
});

test("the area, the opacity, and a swatch drive the callbacks", async ({ page }) => {
  await visit(page, "/en/color-picker");
  await pick(page, "Callbacks");
  const log = demo(page).locator(".demo-color-log dd");
  await expect(log).toHaveText(["#7c6ab8", "#7c6ab8"]);

  // A key moves the thumb; both callbacks follow a step.
  const area = demo(page).getByRole("slider", { name: "Saturation and brightness" });
  await area.focus();
  await page.keyboard.press("ArrowDown");
  await expect(log.first()).not.toHaveText("#7c6ab8");
  await expect(log.last()).not.toHaveText("#7c6ab8");

  // A drag on the opacity track.
  const opacity = demo(page).getByRole("slider", { name: "Opacity" });
  await expect(opacity).toHaveAttribute("aria-valuenow", "100");
  const track = demo(page).locator('[data-channel="alpha"] .ow-color-picker__track');
  const box = await track.boundingBox();
  if (!box) throw new Error("The track has no box.");
  await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(opacity).not.toHaveAttribute("aria-valuenow", "100");

  // A swatch lands on its color.
  await demo(page).getByRole("button", { name: "Red" }).click();
  await expect(log.last()).toHaveText(/^#ef4444/);
});

test("fields take a typed hex, and the format switch cycles", async ({ page }) => {
  await visit(page, "/en/color-picker");
  const hex = demo(page).getByRole("textbox", { name: "Hex" });
  await hex.fill("FF0000");
  await hex.press("Enter");
  await expect(hex).toHaveValue("FF0000");
  await demo(page)
    .getByRole("button", { name: /^Format: HEX/ })
    .click();
  await expect(demo(page).getByRole("textbox", { name: "Red" })).toHaveValue("255");

  // Format: HSL with no opacity.
  await pick(page, "Format");
  await expect(demo(page).getByRole("button", { name: /^Format: HSL/ })).toBeVisible();
  await expect(demo(page).getByRole("slider", { name: "Opacity" })).toHaveCount(0);
});

test("the popover opens on the area, takes a typed color, and goes back to its trigger", async ({
  page,
}) => {
  await visit(page, "/en/color-picker");
  await pick(page, "Popover");
  const trigger = demo(page).locator(".ow-color-picker__trigger").first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Color picker" });
  await expect(dialog.getByRole("slider", { name: "Saturation and brightness" })).toBeFocused();
  const hex = dialog.getByRole("textbox", { name: "Hex" });
  await hex.fill("00FF00");
  await hex.press("Enter");
  await expect(trigger).toContainText("#00ff00");
  await expect(trigger.locator(".ow-color-picker__chip")).toHaveCSS(
    "background-color",
    "rgb(0, 255, 0)",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("triggers by theme open the popover in that theme", async ({ page }) => {
  await visit(page, "/en/color-picker");
  await pick(page, "Themes");
  await expect(demo(page).locator("[data-theme]")).toHaveCount(2);
  const dark = demo(page).locator('[data-theme="dark"] .ow-color-picker__trigger').first();
  await dark.click();
  const dialog = page.getByRole("dialog", { name: "Color picker" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("..")).toHaveAttribute("data-theme", "dark");
});
