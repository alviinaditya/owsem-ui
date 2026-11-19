import { expect, test } from "@playwright/test";
import { openSheet, stage } from "./lab.ts";

test("the install box is a Code Block whose icon-only Copy says Copied in its tooltip", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Getting Started's install command; a Lab's header has a one-line install instead (below).
  await page.goto("/en/docs");
  const install = page.locator(".docs-code").first();
  await expect(install).toHaveClass(/\bow-code-block\b/);
  await expect(install.getByRole("tablist", { name: "Package manager" })).toBeVisible();
  const copy = install.locator(".ow-code-block__copy");
  await expect(copy).toHaveAttribute("data-variant", "ghost");
  await expect(copy).toHaveAttribute("data-icon-only", "");
  await expect(copy).toHaveAccessibleName("Copy");
  await expect(copy).toBeVisible();
  const tip = page.locator(".ow-tooltip__popup");
  // A hover before hydration is lost, so come in again until the tooltip answers.
  await expect(async () => {
    await page.mouse.move(0, 0);
    await copy.hover();
    await expect(tip).toHaveText("Copy", { timeout: 1500 });
  }).toPass();
  await copy.click();
  // The name stays; the status region and the tooltip say Copied, and it is busy until it is back.
  await expect(install.getByRole("status")).toHaveText("Copied");
  await expect(tip).toHaveText("Copied");
  await expect(copy).toHaveAccessibleName("Copy");
  await expect(copy).toHaveAttribute("data-copied", "");
  await expect(copy).toHaveAttribute("aria-disabled", "true");
  await expect(copy.locator(".ow-copy-button__check")).toHaveCount(1);
  // The command, without its prompt.
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add owsem-ui");
  await expect(copy).not.toHaveAttribute("data-copied", "", { timeout: 5000 });
  await expect(tip).toHaveCount(0);
});

test("a Lab's header installs in one line: a package manager menu, the command, and Copy", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/separator");
  // Below 960 px the page header is in the docs sheet.
  await openSheet(page);
  const install = page.locator(".page-header .install-line");
  await expect(install.locator(".ow-code-block")).toHaveCount(0);
  const pm = install.getByRole("button", { name: "Package manager" });
  await expect(pm).toContainText("pnpm");
  await expect(install).toContainText("pnpm add owsem-ui");
  // An icon-only Copy Button: its name stays, and the status region says Copied.
  const copy = install.locator(".install-copy");
  await expect(copy).toHaveClass(/\bow-copy-button\b/);
  await expect(copy).toHaveAttribute("data-variant", "ghost");
  await expect(copy).toHaveAccessibleName("Copy");
  await copy.click();
  await expect(install.getByRole("status")).toHaveText("Copied");
  await expect(copy).toHaveAttribute("data-copied", "");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add owsem-ui");
  // The menu picks another package manager, and the command follows.
  await pm.click();
  await page.getByRole("menuitemradio", { name: "bun" }).click();
  await expect(install).toContainText("bun add owsem-ui");
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
    await expect(link).toHaveAttribute("data-variant", "secondary");
    await expect(link.locator('.ow-button__icon[aria-hidden="true"] svg')).toHaveCount(1);
  }
});

test("a press in the Button Lab scales the button and ripples from the pointer", async ({
  page,
}) => {
  await page.goto("/en/button");
  // Once hydrated, the stage scales the demo to fit; measure after that.
  await expect(stage(page).locator(".lab-fit")).toHaveAttribute("style", /transform/);
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
