import { expect, test } from "@playwright/test";
import { openSheet, stage } from "./lab.ts";

test("Copy is a Copy Button that keeps its width when it says Copied", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/separator");
  // Below 960 px the page header is in the docs sheet.
  await openSheet(page);
  const install = page.locator(".page-header .install");
  const copy = install.locator(".ow-button");
  await expect(copy).toHaveAttribute("data-variant", "outline");
  await expect(copy).toHaveAccessibleName("Copy");
  // Layout width: the press scales the box for a moment.
  const width = () => copy.evaluate((el) => (el as HTMLElement).offsetWidth);
  const before = await width();
  await copy.click();
  await expect(install.getByRole("status")).toHaveText("Copied");
  await expect(copy).toHaveAccessibleName("Copied");
  await expect(copy).toHaveAttribute("data-copied", "");
  await expect(copy.locator(".ow-copy-button__check")).toHaveCount(1);
  expect(await width()).toBe(before);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add owsem-ui");
});

test("Reset in the stage controls is a Button", async ({ page }) => {
  await page.goto("/en/separator");
  await stage(page).getByRole("button", { name: "Controls" }).click();
  const reset = stage(page).getByRole("button", { name: "Reset" });
  await expect(reset).toHaveClass(/\bow-button\b/);
  // The stage's choices are radios, or Toggle Group items once those replace them.
  await stage(page)
    .getByRole("radio", { name: "Vertical" })
    .or(stage(page).getByRole("button", { name: "Vertical", exact: true }))
    .click();
  const separator = stage(page).locator(".ow-separator").first();
  await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  await reset.click();
  await expect(separator).toHaveAttribute("aria-orientation", "horizontal");
});

test("Previous and Next are links styled as Buttons", async ({ page }) => {
  await page.goto("/en/separator");
  await openSheet(page);
  const nav = page.getByRole("navigation", { name: "Component" });
  for (const link of await nav.getByRole("link").all()) {
    await expect(link).toHaveClass(/\bow-button\b/);
    await expect(link).toHaveAttribute("data-variant", "outline");
    await expect(link.locator('.ow-button__icon[aria-hidden="true"] svg')).toHaveCount(1);
  }
});

test("a press in the Button Lab scales the button and ripples from the pointer", async ({
  page,
}) => {
  await page.goto("/en/button");
  // Once hydrated, the stage scales the demo to fit; measure after that.
  await expect(stage(page).locator(".lab-fit")).toHaveAttribute("style", /scale/);
  const button = stage(page).locator('[data-demo="secondary"]');
  const ripple = button.locator(".ow-button__ripple");
  const box = await button.boundingBox();
  if (!box) throw new Error("no button");
  await page.mouse.move(box.x + box.width - 8, box.y + 8);
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-held", "");
  await expect(ripple).toHaveAttribute("data-state", "on");
  await page.mouse.up();
  await expect(button).not.toHaveAttribute("data-held");
  await expect(ripple).toHaveAttribute("data-state", "off");
});
