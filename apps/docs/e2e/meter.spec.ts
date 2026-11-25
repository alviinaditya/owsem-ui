import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("meter", {
  examples: ["Breakdown", "Default", "Sizes", "Tones", "Custom format"],
  parts: [
    "Root",
    "Label",
    "Value",
    "Track",
    "Indicator",
    "Group",
    "Segment",
    "Legend",
    "LegendItem",
    "LegendValue",
  ],
  specimen: ".ow-meter",
});

test("a named meter with its value, and a fill reaching it", async ({ page }) => {
  await visit(page, "/en/meter");
  await pick(page, "Default");
  const meter = demo(page).getByRole("meter", { name: "Storage" });
  await expect(meter).toHaveAttribute("aria-valuenow", "62");
  await expect(meter).toHaveAttribute("aria-valuetext", "62%");
  await expect(meter.locator(".ow-meter__value")).toHaveText("62%");
  const reach = await meter.evaluate((el) => {
    const track = el.querySelector(".ow-meter__track") as HTMLElement;
    const fill = el.querySelector(".ow-meter__indicator") as HTMLElement;
    return (
      (fill.getBoundingClientRect().right - track.getBoundingClientRect().left) /
      track.getBoundingClientRect().width
    );
  });
  expect(reach).toBeCloseTo(0.62, 2);
});

const WEEK = ["Focus 14 h", "Meetings 9 h", "Reviews 6 h", "Support 3 h"];

test("a breakdown: the week is a meter of 32 of 40 hours, its parts a legend outside it", async ({
  page,
}) => {
  await visit(page, "/en/meter");
  const meter = demo(page).getByRole("meter", { name: "Working week" });
  await expect(meter).toHaveAttribute("aria-valuenow", "32");
  await expect(meter).toHaveAttribute("aria-valuemax", "40");
  await expect(meter).toHaveAttribute("aria-valuetext", "32 of 40 h");
  await expect(meter.locator(".ow-meter__segment")).toHaveCount(4);
  // Nothing in the meter takes focus, and the legend is not inside it.
  await expect(meter.locator("button, a, [tabindex]")).toHaveCount(0);
  const legend = demo(page).getByRole("group", { name: "Parts of the working week" });
  await expect(legend.getByRole("button")).toHaveText(WEEK);
  expect(
    await meter.evaluate((el, id) => el.contains(document.querySelector(id)), ".ow-meter__legend"),
  ).toBe(false);
});

test("a breakdown starts on Focus; pressing a part picks it, pressing again clears it", async ({
  page,
}) => {
  await visit(page, "/en/meter");
  const meter = demo(page).getByRole("meter", { name: "Working week" });
  const items = demo(page)
    .getByRole("group", { name: "Parts of the working week" })
    .getByRole("button");
  await expect(items.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(meter.locator(".ow-meter__value")).toHaveText("Focus · 35%");
  await items.nth(1).click();
  await expect(items.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(items.nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(meter.locator(".ow-meter__value")).toHaveText("Meetings · 23%");
  await expect(meter.locator(".ow-meter__segment[data-dimmed]")).toHaveCount(3);
  await expect(meter.locator(".ow-meter__segment[data-active]")).toHaveCount(1);
  await items.nth(1).click();
  await expect(items.nth(1)).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(0, 0);
  await expect(meter.locator(".ow-meter__value")).toHaveText("32 of 40 h");
  await expect(meter.locator(".ow-meter__segment[data-dimmed]")).toHaveCount(0);
  // The value the meter says never changes.
  await expect(meter).toHaveAttribute("aria-valuetext", "32 of 40 h");
});

test("hovering a legend item or a part shows it for as long as the pointer is there", async ({
  page,
}) => {
  await visit(page, "/en/meter");
  const meter = demo(page).getByRole("meter", { name: "Working week" });
  const items = demo(page)
    .getByRole("group", { name: "Parts of the working week" })
    .getByRole("button");
  await items.nth(2).hover();
  await expect(meter.locator(".ow-meter__value")).toHaveText("Reviews · 15%");
  await expect(items.nth(0)).toHaveAttribute("aria-pressed", "true");
  await meter.locator(".ow-meter__segment").nth(3).hover();
  await expect(meter.locator(".ow-meter__value")).toHaveText("Support · 8%");
  await page.mouse.move(0, 0);
  await expect(meter.locator(".ow-meter__value")).toHaveText("Focus · 35%");
});

test("the keyboard walks the legend and Space and Enter press an item", async ({ page }) => {
  await visit(page, "/en/meter");
  const items = demo(page)
    .getByRole("group", { name: "Parts of the working week" })
    .getByRole("button");
  await items.nth(0).focus();
  await page.keyboard.press("Tab");
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(items.nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(items.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(items.nth(1)).toHaveAttribute("aria-pressed", "false");
});

test("the parts and the rest add up to the track, all the bar's height", async ({ page }) => {
  await visit(page, "/en/meter");
  const meter = demo(page).getByRole("meter", { name: "Working week" });
  const shares = await meter.evaluate((el) => {
    const track = el.querySelector(".ow-meter__track") as HTMLElement;
    const segments = [...track.querySelectorAll<HTMLElement>(".ow-meter__segment")];
    const rest = Number.parseFloat(getComputedStyle(track, "::after").width);
    return {
      track: track.getBoundingClientRect().width,
      widths: [...segments.map((one) => one.getBoundingClientRect().width), rest],
      heights: segments.map((one) => one.getBoundingClientRect().height),
    };
  });
  const free = shares.track - 4 * 3;
  expect(shares.widths.reduce((sum, one) => sum + one, 0)).toBeCloseTo(free, 0);
  for (const [i, hours] of [14, 9, 6, 3, 8].entries()) {
    expect(shares.widths[i]).toBeCloseTo((hours / 40) * free, 0);
  }
  expect(new Set(shares.heights)).toEqual(new Set([8]));
});

test("the sizes are 4, 8, and 12px tracks", async ({ page }) => {
  await visit(page, "/en/meter");
  await pick(page, "Sizes");
  const tracks = demo(page).locator(".ow-meter__track");
  await expect(tracks).toHaveCount(3);
  expect(
    await tracks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
  ).toEqual([4, 8, 12]);
});

test("each tone has its own fill, and every meter still says its value in text", async ({
  page,
}) => {
  await visit(page, "/en/meter");
  await pick(page, "Tones");
  const meters = demo(page).getByRole("meter");
  await expect(meters).toHaveCount(4);
  const fills = await meters.evaluateAll((els) =>
    els.map((el) => [
      el.getAttribute("data-tone"),
      getComputedStyle(el.querySelector(".ow-meter__indicator") as Element).backgroundColor,
      el.querySelector(".ow-meter__value")?.textContent,
    ]),
  );
  expect(fills.map(([tone]) => tone)).toEqual(["accent", "good", "warning", "critical"]);
  expect(new Set(fills.map(([, color]) => color)).size).toBe(4);
  expect(fills.map(([, , text]) => text)).toEqual(["48%", "82%", "71%", "94%"]);
  await expect(demo(page).locator(".ow-meter__label")).toHaveText([
    "Accent",
    "Good",
    "Warning",
    "Critical",
  ]);
});

test("a custom format reaches the text and what is read out", async ({ page }) => {
  await visit(page, "/en/meter");
  await pick(page, "Custom format");
  const meter = demo(page).getByRole("meter", { name: "Storage" });
  await expect(meter).toHaveAttribute("aria-valuetext", "62 GB used of 100 GB");
  await expect(meter.locator(".ow-meter__value")).toHaveText("62 GB / 100 GB");
});
