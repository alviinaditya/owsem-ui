import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("tooltip", {
  examples: ["Default", "Each", "Single", "Side"],
  parts: ["Root", "Trigger", "Popup", "Arrow", "Shortcut"],
  specimen: ".ow-tooltip__popup kbd",
});

// The tooltip is in a portal on the body; the one closing stays a moment, without data-open.
const open = (page: Page) => page.locator(".ow-tooltip__popup[data-open]");
const button = (page: Page, name: string) => demo(page).getByRole("button", { name });

test("the first tooltip waits for the delay; its neighbours open at once", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "a pointer hovers");
  await visit(page, "/en/tooltip");
  await expect(open(page)).toHaveCount(0);
  await button(page, "Bold").hover();
  await expect(open(page)).toHaveText("Bold⌘B", { timeout: 10_000 });
  await expect(open(page).locator(".ow-tooltip__arrow")).toHaveCount(1);
  await button(page, "Italic").hover();
  await expect(open(page)).toHaveText("Italic⌘I");
  // Beside an open one it skips the animation.
  await expect(open(page)).toHaveAttribute("data-instant", "delay");
  // The tooltip is visual: the button's own name stays.
  await expect(button(page, "Italic")).toHaveAccessibleName("Italic");
});

test("keyboard focus opens a tooltip at once, unanimated, and Escape shuts it", async ({
  page,
}) => {
  await visit(page, "/en/tooltip");
  const bar = demo(page).getByRole("toolbar", { name: "Formatting" });
  await bar.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(bar.getByRole("button", { name: "Italic" })).toBeFocused();
  await expect(open(page)).toHaveText("Italic⌘I");
  await expect(open(page)).toHaveAttribute("data-instant", /focus|delay/);
  await page.keyboard.press("Escape");
  await expect(open(page)).toHaveCount(0);
  await expect(bar.getByRole("button", { name: "Italic" })).toBeFocused();
});

test("a single trigger shows its label, and the side moves it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "a pointer hovers");
  await visit(page, "/en/tooltip");
  await pick(page, "Single");
  await button(page, "Pin").hover();
  await expect(open(page)).toHaveText("Pin", { timeout: 10_000 });
  await expect(open(page)).toHaveAttribute("data-side", "top");

  await pick(page, "Side");
  await button(page, "Undo").hover();
  await expect(open(page)).toHaveText("Undo⌘Z", { timeout: 10_000 });
  await expect(open(page)).toHaveAttribute("data-side", "right");
});

test("Inspect's tooltip is open inline, without a portal", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/tooltip");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-tooltip__popup")).toBeVisible();
  await expect(specimen(page).locator(".ow-tooltip__arrow")).toHaveCount(1);
  await expect(page.locator(".ow-tooltip__popup")).toHaveCount(1);
});
