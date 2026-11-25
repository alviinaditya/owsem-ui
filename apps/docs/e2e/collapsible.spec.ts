import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("collapsible", {
  examples: ["Default", "Sizes", "Controlled", "Custom icon"],
  parts: ["Root", "Trigger", "Panel"],
  specimen: ".ow-collapsible__trigger",
});

test("the trigger opens and closes its panel, and its height settles at auto", async ({ page }) => {
  await visit(page, "/en/collapsible");
  const trigger = demo(page).getByRole("button", { name: "Order details" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(demo(page).locator(".ow-collapsible__panel")).toHaveCount(0);
  await trigger.click();
  const panel = demo(page).locator(".ow-collapsible__panel");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toContainText("Two shirts");
  await expect
    .poll(() => panel.evaluate((el) => el.style.getPropertyValue("--collapsible-panel-height")))
    .toBe("auto");
  await trigger.click();
  await expect(panel).toHaveCount(0);
});

test("the sizes are 32, 40, and 48px triggers", async ({ page }) => {
  await visit(page, "/en/collapsible");
  await pick(page, "Sizes");
  const triggers = demo(page).locator(".ow-collapsible__trigger");
  await expect(triggers).toHaveCount(3);
  expect(
    await triggers.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().height)),
    ),
  ).toEqual([32, 40, 48]);
});

test("controlled: the button outside opens the panel and the state follows", async ({ page }) => {
  await visit(page, "/en/collapsible");
  await pick(page, "Controlled");
  await expect(demo(page).getByText("Closed", { exact: true })).toBeVisible();
  await demo(page).getByRole("button", { name: "Open or close" }).click();
  await expect(demo(page).getByText("Open", { exact: true })).toBeVisible();
  await expect(demo(page).getByRole("button", { name: "Order details" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("a custom icon replaces the chevron, and icon={null} leaves it out", async ({ page }) => {
  await visit(page, "/en/collapsible");
  await pick(page, "Custom icon");
  const triggers = demo(page).locator(".ow-collapsible__trigger");
  await expect(triggers.first().locator(".demo-plus")).toHaveCount(1);
  await expect(triggers.first().locator(".ow-collapsible__stroke")).toHaveCount(0);
  await expect(triggers.nth(1).locator(".ow-collapsible__icon")).toHaveCount(0);
});

test("the chevron turns into its open shape when opened", async ({ page }) => {
  await visit(page, "/en/collapsible");
  const trigger = demo(page).getByRole("button", { name: "Order details" });
  const stroke = trigger.locator(".ow-collapsible__stroke").first();
  expect(await stroke.evaluate((el) => getComputedStyle(el).rotate)).toBe("0deg");
  await trigger.click();
  await expect.poll(() => stroke.evaluate((el) => getComputedStyle(el).rotate)).toBe("-90deg");
});
