import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("progress", {
  examples: ["Default", "Sizes", "Indeterminate", "Custom value and format"],
  parts: ["Root", "Label", "Value", "Track", "Indicator"],
  specimen: ".ow-progress",
});

test("a named progress bar with its value, and a fill reaching it", async ({ page }) => {
  await visit(page, "/en/progress");
  const bar = demo(page).getByRole("progressbar", { name: "Uploading" });
  await expect(bar).toHaveAttribute("aria-valuenow", "60");
  await expect(bar).toHaveAttribute("aria-valuetext", "60%");
  await expect(bar.locator(".ow-progress__value")).toHaveText("60%");
  const reach = await bar.evaluate((el) => {
    const track = el.querySelector(".ow-progress__track") as HTMLElement;
    const fill = el.querySelector(".ow-progress__indicator") as HTMLElement;
    return (
      (fill.getBoundingClientRect().right - track.getBoundingClientRect().left) /
      track.getBoundingClientRect().width
    );
  });
  expect(reach).toBeCloseTo(0.6, 2);
});

test("the sizes are 4, 8, and 12px tracks", async ({ page }) => {
  await visit(page, "/en/progress");
  await pick(page, "Sizes");
  const tracks = demo(page).locator(".ow-progress__track");
  await expect(tracks).toHaveCount(3);
  expect(
    await tracks.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
  ).toEqual([4, 8, 12]);
});

test("an indeterminate bar travels until it has a value, then stops", async ({ page }) => {
  await visit(page, "/en/progress");
  await pick(page, "Indeterminate");
  const bar = demo(page).getByRole("progressbar", { name: "Loading" });
  await expect(bar).not.toHaveAttribute("aria-valuenow", /.*/);
  const fill = bar.locator(".ow-progress__indicator");
  await expect
    .poll(() =>
      fill.evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName)),
    )
    .toEqual(["ow-progress-travel"]);
  await demo(page).getByRole("button", { name: "Finish" }).click();
  const done = demo(page).getByRole("progressbar", { name: "Done" });
  await expect(done).toHaveAttribute("aria-valuenow", "100");
  await expect
    .poll(() =>
      done
        .locator(".ow-progress__indicator")
        .evaluate((el) => el.getAnimations().filter((a) => a instanceof CSSAnimation).length),
    )
    .toBe(0);
});

test("a custom value and format reach the text and what is read out", async ({ page }) => {
  await visit(page, "/en/progress");
  await pick(page, "Custom value and format");
  const bar = demo(page).getByRole("progressbar", { name: "File" });
  await expect(bar).toHaveAttribute("aria-valuetext", "3 MB of 8 MB");
  await expect(bar.locator(".ow-progress__value")).toHaveText("3 MB / 8 MB");
});
