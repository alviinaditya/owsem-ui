import { expect, test } from "@playwright/test";

test("the install box is a Code Block whose icon-only Copy says Copied in its tooltip", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Getting Started's install command.
  await page.goto("/en/docs");
  const install = page.locator(".docs-code").first();
  await expect(install).toHaveClass(/\bow-code-block\b/);
  await expect(install.getByRole("tablist", { name: "Package manager" })).toBeVisible();
  const copy = install.locator(".ow-code-block__copy");
  await expect(copy).toHaveAttribute("data-variant", "ghost");
  await expect(copy).toHaveAttribute("data-icon-only", "");
  await expect(copy).toHaveAccessibleName("Copy");
  await expect(copy).toBeVisible();
  const popup = page.locator(".ow-tooltip__popup");
  // Both words stay in the popup; the visible one is marked.
  const tip = popup.locator(".ow-copy-button__tip-text[data-visible]");
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
  await expect(tip).toHaveText("Copy");
});

test("a press on the Button page scales the button and ripples from the pointer", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a pointer press");
  await page.goto("/en/button");
  const button = page.locator(".cp-stage").getByRole("button", { name: "Secondary" });
  const ripple = button.locator(".ow-button__ripple");
  await expect(button).toBeVisible();
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
