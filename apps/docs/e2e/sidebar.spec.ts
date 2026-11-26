import { expect, test } from "@playwright/test";
import { demo, pageTests, pick, visit } from "./example-page.ts";

pageTests("sidebar", {
  examples: ["Default", "Collapsible", "Mobile drawer"],
  parts: [
    "Provider",
    "Root",
    "Header",
    "Content",
    "Group",
    "GroupLabel",
    "List",
    "Item",
    "ItemIcon",
    "ItemBadge",
    "Indicator",
    "Footer",
    "Trigger",
  ],
  specimen: ".ow-sidebar__link[data-active]",
});

test("a click on an item moves the Indicator to it", async ({ page }) => {
  await visit(page, "/en/sidebar");
  const nav = demo(page).getByRole("navigation", { name: "Documentation" });
  const pill = nav.locator(".ow-sidebar__indicator");
  const body = pill.locator("rect");
  const dot = pill.locator(".ow-sidebar__liquid-dot");
  await expect(nav.locator("a[aria-current]")).toHaveText("Installation");
  await expect(pill).toHaveAttribute("data-visible", "");
  const mid = async (loc: typeof body) => {
    const box = await loc.boundingBox();
    return box ? box.y + box.height / 2 : Number.NaN;
  };
  const onLink = async (link: typeof body) => {
    const box = await link.boundingBox();
    const at = box ? box.y + box.height / 2 : Number.NaN;
    return Math.max(Math.abs((await mid(body)) - at), Math.abs((await mid(dot)) - at));
  };
  const target = nav.getByRole("link", { name: "Dialog", exact: true });
  await target.click();
  await expect(nav.locator("a[aria-current]")).toHaveText("Dialog");
  // The liquid lands: the background and the dot end on the new item, and it is still again.
  await expect(pill).not.toHaveAttribute("data-moving", "", { timeout: 5000 });
  await expect(target).toHaveAttribute("data-landed", "");
  await expect.poll(() => onLink(target)).toBeLessThan(1);
});

test("the dot pulses while the next page loads", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "the docs sidebar is a drawer on a phone");
  await page.goto("/en/button");
  await page.route(/tooltip/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  const pill = page.locator(".ow-sidebar__indicator").first();
  await expect(pill).toHaveAttribute("data-visible", "");
  await page
    .locator(".ow-sidebar__link", { hasText: /^Tooltip/ })
    .first()
    .click({ noWaitAfter: true });
  await expect(pill).toHaveAttribute("data-waiting", "");
  await expect(pill.locator(".ow-sidebar__pulse")).toBeVisible();
  await expect(pill).not.toHaveAttribute("data-waiting", "", { timeout: 15000 });
  await expect(page).toHaveURL(/tooltip/);
});

test("a closed sidebar gives its room to the page beside it", async ({ page }) => {
  await visit(page, "/en/sidebar");
  await pick(page, "Collapsible");
  const provider = demo(page).locator(".ow-sidebar__provider");
  const trigger = demo(page).getByRole("button", { name: "Toggle sidebar" });
  const room = () => trigger.evaluate((el) => el.parentElement?.offsetWidth ?? 0);
  const whole = await provider.evaluate((el) => (el as HTMLElement).offsetWidth);
  // Open, the sidebar takes 200px of the window.
  expect(await room()).toBeLessThan(whole - 150);
  await trigger.click();
  await expect(provider).toHaveAttribute("data-sidebar-state", "closed");
  // The margin glides, so the page grows to the whole window without a wait.
  await expect.poll(room).toBeGreaterThanOrEqual(whole - 12);
  await trigger.click();
  await expect.poll(room).toBeLessThan(whole - 150);
});

test("the mobile drawer opens inside the demo's window, not over the docs", async ({ page }) => {
  await visit(page, "/en/sidebar");
  await pick(page, "Mobile drawer");
  const frame = demo(page).locator(".demo-sidebar-frame");
  await frame.getByRole("button", { name: "Open menu" }).click();
  const drawer = frame.getByRole("dialog", { name: "Documentation" });
  await expect(drawer).toBeVisible();
  // The drawer slides in, so wait until it sits inside the window.
  await expect
    .poll(async () => {
      const [inner, outer] = await Promise.all([drawer.boundingBox(), frame.boundingBox()]);
      if (!inner || !outer) return false;
      return (
        inner.x >= outer.x - 1 &&
        inner.y >= outer.y - 1 &&
        inner.x + inner.width <= outer.x + outer.width + 1 &&
        inner.y + inner.height <= outer.y + outer.height + 1
      );
    })
    .toBe(true);
});
