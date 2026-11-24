import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("slider", {
  examples: ["Default", "Range", "Sizes", "Vertical", "With a field"],
  parts: ["Root", "Label", "Value", "Control", "Track", "Indicator", "Thumb"],
  specimen: ".ow-slider",
});

test("a named slider says its value, steps with the keyboard, and the value follows", async ({
  page,
}) => {
  await visit(page, "/en/slider");
  const slider = demo(page).getByRole("slider", { name: "Volume" });
  await expect(slider).toHaveValue("40");
  await expect(demo(page).locator(".ow-slider__value")).toHaveText("40");
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("42");
  await expect(demo(page).locator(".ow-slider__value")).toHaveText("42");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
});

test("dragging the thumb follows the pointer, and the thumb stays where the value is", async ({
  page,
}) => {
  await visit(page, "/en/slider");
  const thumb = demo(page).locator(".ow-slider__thumb");
  const track = demo(page).locator(".ow-slider__track");
  // The thumb is placed against the track without its transparent ends.
  const box = await track.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + el.clientLeft, width: el.clientWidth };
  });
  const from = await thumb.boundingBox();
  if (!from) throw new Error("not laid out");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, from.y + from.height / 2, { steps: 6 });
  await expect(demo(page).getByRole("slider", { name: "Volume" })).toHaveValue("80");
  const now = await thumb.boundingBox();
  if (!now) throw new Error("not laid out");
  expect(now.x + now.width / 2).toBeCloseTo(box.x + box.width * 0.8, 0);
  await page.mouse.up();
});

test("a range has two thumbs, each with its own name, and a value that reads both", async ({
  page,
}) => {
  await visit(page, "/en/slider");
  await pick(page, "Range");
  const thumbs = demo(page).getByRole("slider");
  await expect(thumbs).toHaveCount(2);
  await expect(thumbs.first()).toHaveAccessibleName("Lowest price");
  await expect(thumbs.last()).toHaveAccessibleName("Highest price");
  await expect(demo(page).locator(".ow-slider__value")).toContainText("–");
  await thumbs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(thumbs.first()).toHaveValue("250");
});

test("the sizes are 4, 6, and 8px tracks with 16, 20, and 24px thumbs", async ({ page }) => {
  await visit(page, "/en/slider");
  await pick(page, "Sizes");
  const tracks = demo(page).locator(".ow-slider__track");
  await expect(tracks).toHaveCount(3);
  expect(
    await tracks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
  ).toEqual([4, 6, 8]);
  expect(
    await demo(page)
      .locator(".ow-slider__thumb")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width)),
  ).toEqual([16, 20, 24]);
});

test("upright sliders are columns 12rem tall, and Arrow Up raises the value", async ({ page }) => {
  await visit(page, "/en/slider");
  await pick(page, "Vertical");
  const sliders = demo(page).locator(".ow-slider");
  await expect(sliders).toHaveCount(3);
  expect(
    await sliders.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
  ).toEqual([192, 192, 192]);
  const bass = demo(page).getByRole("slider", { name: "Bass" });
  await bass.focus();
  await page.keyboard.press("ArrowUp");
  await expect(bass).toHaveValue("71");
});

test("a value over 80 marks the field invalid with its error, and lowering it clears it", async ({
  page,
}) => {
  await visit(page, "/en/slider");
  await pick(page, "With a field");
  const slider = demo(page).getByRole("slider", { name: "Loudness" });
  await expect(slider).toHaveValue("60");
  await expect(demo(page).getByText("Above 80 can harm your hearing.")).toHaveCount(0);
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-invalid", "true");
  await expect(demo(page).getByText("Above 80 can harm your hearing.")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(demo(page).getByText("Above 80 can harm your hearing.")).toHaveCount(0);
});
