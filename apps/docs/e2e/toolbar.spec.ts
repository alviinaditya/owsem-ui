import { expect, test } from "@playwright/test";
import { demo, pageTests, picker, visit } from "./example-page.ts";

pageTests("toolbar", {
  examples: ["Default", "Sizes", "Solid", "Vertical", "Link and field"],
  parts: ["Root", "Group", "Toggle", "Button", "Icon", "Separator", "Link", "Input"],
  specimen: ".ow-toolbar__input",
});

test("the toolbar's toggles format the line", async ({ page }) => {
  await visit(page, "/en/toolbar");
  const italic = demo(page).getByRole("button", { name: "Italic" });
  const line = demo(page).getByText("The toolbar formats this line.");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
  await expect(line).toHaveCSS("font-weight", "600");
  await italic.click();
  await expect(italic).toHaveAttribute("aria-pressed", "true");
  await expect(line).toHaveCSS("font-style", "italic");
});

test("the toolbar is one Tab stop; arrow keys move, and a disabled button stays reachable", async ({
  page,
}) => {
  await visit(page, "/en/toolbar");
  const bar = demo(page).getByRole("toolbar", { name: "Formatting" });
  const bold = bar.getByRole("button", { name: "Bold" });
  await bold.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(bar.getByRole("button", { name: "Underline" })).toBeFocused();
  // Roving tabindex: only the last item used is a Tab stop.
  await expect(bar.locator('[tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const redo = bar.getByRole("button", { name: "Redo" });
  await expect(redo).toBeFocused();
  await expect(redo).toHaveAttribute("aria-disabled", "true");
});

test("sizes grow, a vertical toolbar stacks, and the field comes last", async ({ page }) => {
  await visit(page, "/en/toolbar");
  await picker(page).getByRole("button", { name: "Sizes" }).click();
  const bars = demo(page).getByRole("toolbar");
  await expect(bars).toHaveCount(3);
  const heights = await bars.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  );
  expect(heights[0]).toBeLessThan(heights[1] ?? 0);
  expect(heights[1]).toBeLessThan(heights[2] ?? 0);

  await picker(page).getByRole("button", { name: "Vertical" }).click();
  const vertical = demo(page).getByRole("toolbar");
  await expect(vertical).toHaveAttribute("aria-orientation", "vertical");
  await vertical.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(vertical.getByRole("button", { name: "Italic" })).toBeFocused();

  await picker(page).getByRole("button", { name: "Link and field" }).click();
  const bar = demo(page).getByRole("toolbar");
  await expect(bar.getByRole("link", { name: "Help" })).toBeVisible();
  await expect(bar.getByRole("textbox", { name: "Find" })).toBeVisible();
});
