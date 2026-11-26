import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("kbd", {
  examples: ["Default", "Combination", "In controls"],
  parts: ["Root"],
  specimen: ".ow-kbd",
});

test("a keycap takes its size from the text around it", async ({ page }) => {
  await visit(page, "/en/kbd");
  const sentence = demo(page).locator(".ow-kbd");
  await expect(sentence).toHaveText("⌘K");
  const [kbd, text] = await Promise.all([
    sentence.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
    sentence.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el.parentElement as Element).fontSize),
    ),
  ]);
  expect(kbd / text).toBeCloseTo(0.75, 2);

  await pick(page, "Combination");
  await expect(demo(page).locator(".ow-kbd")).toHaveText(["Ctrl", "Shift", "P", "Esc"]);
  await pick(page, "In controls");
  await expect(demo(page).locator(".ow-kbd")).toHaveText(["⌘K", "⌘N"]);
});
