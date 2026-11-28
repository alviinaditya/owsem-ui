import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("command-menu", {
  examples: ["Default", "Sizes", "Blur backdrop", "Solid", "Empty"],
  parts: ["Root", "Trigger", "Popup", "Input", "List", "GroupLabel", "Item", "Shortcut", "Footer"],
  specimen: ".ow-command-menu__popup .ow-command-menu__item",
});

// The demo's menu opens inside its app window, not over the docs.
const panel = (page: Page) => demo(page).getByRole("dialog", { name: "Commands" });
const field = (page: Page) => panel(page).getByRole("combobox");

test("the menu starts open in its window without taking focus, and Escape shuts it", async ({
  page,
}) => {
  await visit(page, "/en/command-menu");
  await expect(panel(page)).toBeVisible();
  await expect(field(page)).not.toBeFocused();
  await expect(panel(page).locator(".ow-command-menu__group")).toHaveCount(2);
  await panel(page).locator(".ow-command-menu__item").first().hover();
  await field(page).focus();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeHidden();
  // The trigger opens it again, and the field takes focus.
  await demo(page)
    .getByRole("button", { name: /Search/ })
    .click();
  await expect(panel(page)).toBeVisible();
  await expect(field(page)).toBeFocused();
});

test("typing filters the list and leaves the first match highlighted for Enter", async ({
  page,
}) => {
  await visit(page, "/en/command-menu");
  await field(page).fill("in");
  // One match is left in each group: Settings and Invite teammates.
  await expect(panel(page).getByRole("option")).toHaveText([/Settings/, /Invite teammates/]);
  await expect(panel(page).getByRole("option").first()).toHaveAttribute("data-highlighted", "");
  await page.keyboard.press("ArrowDown");
  await expect(panel(page).getByRole("option").nth(1)).toHaveAttribute("data-highlighted", "");
  await expect(field(page)).toHaveAttribute(
    "aria-activedescendant",
    (await panel(page).getByRole("option").nth(1).getAttribute("id")) ?? "",
  );
  // Glide lights the highlighted item, and only that one.
  await expect(panel(page).locator(".ow-glide")).toHaveCount(1);
  await field(page).fill("");
  await expect(panel(page).getByRole("option")).toHaveCount(7);
});

test("Enter runs the highlighted item and shuts the menu; a disabled one does nothing", async ({
  page,
}) => {
  await visit(page, "/en/command-menu");
  await field(page).fill("restore");
  const restore = panel(page).getByRole("option", { name: /Restore version/ });
  await expect(restore).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  await expect(panel(page)).toBeVisible();
  await field(page).fill("theme");
  await page.keyboard.press("Enter");
  await expect(panel(page)).toBeHidden();
});

test("a nothing-found query shows Empty, announced politely, and the list hides", async ({
  page,
}) => {
  await visit(page, "/en/command-menu");
  await pick(page, "Empty");
  await expect(panel(page).getByText("No results")).toBeVisible();
  await expect(panel(page).getByRole("option")).toHaveCount(0);
  await expect(panel(page).locator(".ow-command-menu__empty")).toHaveAttribute(
    "aria-live",
    "polite",
  );
});

test("the examples set the size, the backdrop, and the surface", async ({ page }) => {
  await visit(page, "/en/command-menu");
  const popup = demo(page).locator(".ow-command-menu__popup");
  await expect(popup).toHaveAttribute("data-size", "md");
  await expect(demo(page).locator(".ow-command-menu__backdrop")).not.toHaveAttribute("data-blur");
  await pick(page, "Sizes");
  await expect(popup).toHaveAttribute("data-size", "lg");
  await pick(page, "Blur backdrop");
  await expect(demo(page).locator(".ow-command-menu__backdrop")).toHaveAttribute("data-blur", "");
  await pick(page, "Solid");
  await expect(popup).toHaveCSS("backdrop-filter", "none");
});

test("the window clips its scrim to its rounded corners", async ({ page }) => {
  await visit(page, "/en/command-menu");
  const window = demo(page).locator(".demo-command");
  await expect(window).toHaveCSS("clip-path", /inset\(.* round /);
  await pick(page, "Blur backdrop");
  await expect(window).toHaveCSS("clip-path", /inset\(.* round /);
});

test("⌘K on the page opens the docs search, not the demo", async ({ page }) => {
  await visit(page, "/en/command-menu");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search docs" })).toBeVisible();
  await expect(panel(page)).toBeVisible();
});

test("Inspect's panel is open inline, without a portal on the page or a lock on it", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/command-menu");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-command-menu__popup")).toBeVisible();
  await expect(specimen(page).locator(".ow-command-menu__popup")).toHaveAttribute("inert", "");
  // Both popups live in their boxes (the window and the specimen), none in the body.
  await expect(page.locator(".ow-command-menu__popup")).toHaveCount(2);
  const loose = await page.evaluate(
    () =>
      [...document.querySelectorAll(".ow-command-menu__popup")].filter(
        (el) => !el.closest(".demo-command, .demo-command-specimen"),
      ).length,
  );
  expect(loose).toBe(0);
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
