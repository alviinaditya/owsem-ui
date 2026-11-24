import { expect, test } from "@playwright/test";
import { demo, pageTests, picker, visit } from "./example-page.ts";
import { thumbKey } from "./helpers.ts";

pageTests("toggle-group", {
  examples: ["Default", "Sizes", "Solid", "Icons", "Multiple", "Equal", "Disabled"],
  parts: ["Root", "Item", "Thumb"],
  specimen: ".ow-toggle-group__thumb",
});

test("the thumb lands on the picked view, and the choice keeps one pressed", async ({ page }) => {
  await visit(page, "/en/toggle-group");
  const view = demo(page).getByRole("group", { name: "View" });
  const board = view.getByRole("button", { name: "Board" });
  await board.click();
  await expect(board).toHaveAttribute("aria-pressed", "true");
  // Pressing the chosen view again keeps it.
  await board.click();
  await expect(board).toHaveAttribute("aria-pressed", "true");
  const thumb = view.locator(".ow-toggle-group__thumb");
  await expect
    .poll(async () => {
      const [at, under] = await Promise.all([thumbKey(thumb), board.boundingBox()]);
      return Math.abs(at.x - (under?.x ?? 99));
    })
    .toBeLessThanOrEqual(0.5);
});

test("with multiple, each format toggles on its own and there is no thumb movement to follow", async ({
  page,
}) => {
  await visit(page, "/en/toggle-group");
  await picker(page).getByRole("button", { name: "Multiple" }).click();
  const group = demo(page).getByRole("group", { name: "Formatting" });
  const bold = group.getByRole("button", { name: "Bold" });
  const italic = group.getByRole("button", { name: "Italic" });
  const note = demo(page).getByText("The team meeting");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await italic.click();
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(note).toHaveCSS("font-style", "italic");
  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
});

test("equal items share one width, and sizes grow", async ({ page }) => {
  await visit(page, "/en/toggle-group");
  await picker(page).getByRole("button", { name: "Equal" }).click();
  const widths = await demo(page)
    .locator(".ow-toggle-group__item")
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  expect(widths).toHaveLength(3);
  expect(new Set(widths).size).toBe(1);

  await picker(page).getByRole("button", { name: "Sizes" }).click();
  const heights = await demo(page)
    .locator(".ow-toggle-group")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(heights).toHaveLength(3);
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);
});

test("a disabled group ignores presses", async ({ page }) => {
  await visit(page, "/en/toggle-group");
  await picker(page).getByRole("button", { name: "Disabled" }).click();
  const board = demo(page).getByRole("button", { name: "Board" });
  await board.click({ force: true });
  await expect(board).toHaveAttribute("aria-pressed", "false");
});
