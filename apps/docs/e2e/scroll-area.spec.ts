import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("scroll-area", {
  examples: ["Default", "Both axes", "Faded edges", "Wide scrollbar", "Every part"],
  parts: ["Root", "Viewport", "Content", "Scrollbar", "Thumb", "Corner"],
  specimen: ".ow-scroll-area__corner",
});

test("the scrollbar shows on hover, and the thumb scrolls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "a pointer hovers and drags");
  await visit(page, "/en/scroll-area");
  const viewport = demo(page).locator(".ow-scroll-area__viewport");
  const scrollbar = demo(page).locator(".ow-scroll-area__scrollbar");
  const thumb = scrollbar.locator(".ow-scroll-area__thumb");
  await expect(scrollbar).toHaveCSS("opacity", "0");
  await viewport.hover();
  await expect(scrollbar).toHaveCSS("opacity", "1");

  const box = await thumb.boundingBox();
  if (!box) throw new Error("The thumb has no box.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 120, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  // Hidden by the stylesheet, with no <style> added at runtime (NF-4).
  await expect(page.locator('style[data-href="base-ui-disable-scrollbar"]')).toHaveCount(0);
  expect(await viewport.evaluate((el) => getComputedStyle(el).scrollbarWidth)).toBe("none");
});

test("a wide log gets both scrollbars, and an area with nothing to scroll gets none", async ({
  page,
}) => {
  await visit(page, "/en/scroll-area");
  await expect(demo(page).locator(".ow-scroll-area__scrollbar")).toHaveCount(1);
  await pick(page, "Both axes");
  await expect(demo(page).locator(".ow-scroll-area__scrollbar")).toHaveCount(2);
  await expect(demo(page).locator(".ow-scroll-area__corner")).toHaveCount(1);
});

test("faded edges set data-fade, and the viewport is a tab stop while it overflows", async ({
  page,
}) => {
  await visit(page, "/en/scroll-area");
  await expect(demo(page).locator(".ow-scroll-area")).not.toHaveAttribute("data-fade");
  await pick(page, "Faded edges");
  await expect(demo(page).locator(".ow-scroll-area")).toHaveAttribute("data-fade", "");
  await expect(demo(page).locator(".ow-scroll-area__viewport")).toHaveAttribute("tabindex", "0");
});
