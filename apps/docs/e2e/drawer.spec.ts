import { expect, type Locator, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("drawer", {
  examples: ["Default", "Four sides", "Scrolling", "Snap points", "Nested", "Indent"],
  parts: [
    "Root",
    "Trigger",
    "Backdrop",
    "Viewport",
    "Popup",
    "Title",
    "Description",
    "Content",
    "Close",
  ],
  specimen: ".ow-drawer__popup .ow-drawer__title",
});

// The drawer lands in the demo's window, not in a portal on the body.
const open = (page: Page) => demo(page).locator('[data-demo="open"]');
const sheet = (page: Page, name = "Share the draft") => demo(page).getByRole("dialog", { name });
const windowBox = (page: Page) => demo(page).locator(".demo-dialog");

/**
 * The sheet at rest: the opening style gone, then every finite animation and transition ended.
 * Reading a style first starts a transition still pending, so it is there to finish.
 */
async function arrived(popup: Locator) {
  await expect(popup).not.toHaveAttribute("data-starting-style", "");
  await popup.evaluate((el) => {
    getComputedStyle(el).transform;
    for (const a of document.getAnimations()) {
      if (a.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY) a.finish();
    }
  });
}

/** Drags the sheet by its top padding with the mouse, in steps, and lets go. */
async function swipe(page: Page, popup: Locator, dx: number, dy: number, release = true) {
  const box = await popup.boundingBox();
  if (!box) throw new Error("no sheet");
  const x = box.x + box.width / 2;
  const y = box.y + 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x + (dx * i) / 6, y + (dy * i) / 6);
  if (release) await page.mouse.up();
}

test("a press opens it with a scrim; focus moves in, and Escape gives it back", async ({
  page,
}) => {
  await visit(page, "/en/drawer");
  await open(page).click();
  await expect(sheet(page)).toBeVisible();
  await expect(demo(page).locator(".ow-drawer__backdrop")).toHaveCount(1);
  await arrived(sheet(page));
  await expect
    .poll(() => sheet(page).evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toHaveCount(0);
  await expect(open(page)).toBeFocused();
});

test("a bottom sheet rests on the window's bottom edge, with its grabber", async ({ page }) => {
  await visit(page, "/en/drawer");
  await open(page).click();
  const popup = sheet(page);
  await expect(popup).toBeVisible();
  await arrived(popup);
  const [win, box] = [await windowBox(page).boundingBox(), await popup.boundingBox()];
  expect(
    Math.abs((box?.y ?? 0) + (box?.height ?? 0) - ((win?.y ?? 0) + (win?.height ?? 0))),
  ).toBeLessThan(1);
  const grabber = await popup.evaluate((el) => getComputedStyle(el, "::before").content);
  expect(grabber).toBe('""');
});

test("a press on the scrim shuts it", async ({ page }) => {
  await visit(page, "/en/drawer");
  await open(page).click();
  await arrived(sheet(page));
  await demo(page)
    .locator(".ow-drawer__viewport")
    .click({ position: { x: 4, y: 4 } });
  await expect(sheet(page)).toHaveCount(0);
});

test("a swipe follows the finger, settles back when it is short, and shuts when it is long", async ({
  page,
}) => {
  await visit(page, "/en/drawer");
  await open(page).click();
  const popup = sheet(page);
  await arrived(popup);
  const rest = (await popup.boundingBox())?.y ?? 0;
  await swipe(page, popup, 0, 60, false);
  await expect(popup).toHaveAttribute("data-swiping", "");
  const moved = (await popup.boundingBox())?.y ?? 0;
  expect(moved).toBeGreaterThan(rest + 20);
  // Back where it began, and let go: it stays open and settles to rest.
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(popup).not.toHaveAttribute("data-swiping", "");
  await expect(popup).toBeVisible();
  await arrived(popup);
  expect(Math.abs(((await popup.boundingBox())?.y ?? 0) - rest)).toBeLessThan(2);
  await swipe(page, popup, 0, 260);
  await expect(sheet(page)).toHaveCount(0);
  await expect(open(page)).toBeFocused();
});

test("a touch swipe follows the finger and shuts it; on Content it scrolls first", async ({
  page,
}) => {
  await visit(page, "/en/drawer");
  await pick(page, "Scrolling");
  await open(page).click();
  const popup = sheet(page, "Release notes");
  await arrived(popup);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x, y }],
    });
  // On Content, a swipe up scrolls the text and does not move the sheet.
  const content = demo(page).locator('[data-demo="content"]');
  const area = await content.boundingBox();
  if (!area) throw new Error("no content");
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height - 10;
  await touch("touchStart", cx, cy);
  for (let i = 1; i <= 5; i++) await touch("touchMove", cx, cy - i * 12);
  await touch("touchEnd", cx, cy - 60);
  await expect(popup).not.toHaveAttribute("data-swiping", "");
  await expect.poll(() => content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  // On the sheet's top padding, a swipe down follows the finger, and a long one shuts it.
  const box = await popup.boundingBox();
  if (!box) throw new Error("no sheet");
  const x = box.x + box.width / 2;
  const y = box.y + 3;
  await touch("touchStart", x, y);
  for (let i = 1; i <= 4; i++) await touch("touchMove", x, y + i * 15);
  await expect(popup).toHaveAttribute("data-swiping", "");
  for (let i = 5; i <= 14; i++) await touch("touchMove", x, y + i * 15);
  await touch("touchEnd", x, y + 210);
  await expect(sheet(page, "Release notes")).toHaveCount(0);
});

test("the four sides: each opens at its own edge", async ({ page }) => {
  await visit(page, "/en/drawer");
  await pick(page, "Four sides");
  for (const side of ["up", "right", "down", "left"] as const) {
    await demo(page).locator(`[data-demo="open-${side}"]`).click();
    const popup = sheet(page);
    await expect(popup).toBeVisible();
    await expect(popup).toHaveAttribute("data-swipe-direction", side);
    await arrived(popup);
    // Both boxes at the same moment: a click can scroll the page, and the window can move.
    const win = await windowBox(page).boundingBox();
    const box = await popup.boundingBox();
    if (!win || !box) throw new Error("no window or sheet");
    if (side === "up") expect(Math.abs(box.y - win.y)).toBeLessThan(1);
    if (side === "down")
      expect(Math.abs(box.y + box.height - (win.y + win.height))).toBeLessThan(1);
    if (side === "left") expect(Math.abs(box.x - win.x)).toBeLessThan(1);
    if (side === "right") expect(Math.abs(box.x + box.width - (win.x + win.width))).toBeLessThan(1);
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
  }
});

test("long content scrolls in Content, and the button stays in view", async ({ page }) => {
  await visit(page, "/en/drawer");
  await pick(page, "Scrolling");
  await open(page).click();
  const popup = sheet(page, "Release notes");
  await expect(popup).toBeVisible();
  await arrived(popup);
  const content = demo(page).locator('[data-demo="content"]');
  await expect.poll(() => content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  const [sheetBox, done] = [
    await popup.boundingBox(),
    await demo(page).locator('[data-demo="done"]').boundingBox(),
  ];
  expect((done?.y ?? 0) + (done?.height ?? 0)).toBeLessThanOrEqual(
    (sheetBox?.y ?? 0) + (sheetBox?.height ?? 0),
  );
});

test("snap points: it opens at the first stop, below the full height", async ({ page }) => {
  await visit(page, "/en/drawer");
  await pick(page, "Snap points");
  await open(page).click();
  const popup = sheet(page, "Comments");
  await expect(popup).toBeVisible();
  await arrived(popup);
  await expect
    .poll(() => popup.evaluate((el) => el.style.getPropertyValue("--drawer-snap-point-offset")))
    .not.toBe("0px");
  const [win, box] = [await windowBox(page).boundingBox(), await popup.boundingBox()];
  // 40% of the window's height is showing.
  expect(
    Math.abs((win?.y ?? 0) + (win?.height ?? 0) - (box?.y ?? 0) - (win?.height ?? 0) * 0.4),
  ).toBeLessThan(4);
});

test("a drawer nested in another steps the parent back; Escape shuts the top one", async ({
  page,
}) => {
  await visit(page, "/en/drawer");
  await pick(page, "Nested");
  await open(page).click();
  const parent = demo(page).locator('[data-demo="parent"]');
  await expect(parent).toBeVisible();
  const more = parent.locator('[data-demo="more"]');
  await more.click();
  await expect(sheet(page, "Remove this link?")).toBeVisible();
  await expect(parent).toHaveAttribute("data-nested-drawer-open", "");
  await page.keyboard.press("Escape");
  await expect(sheet(page, "Remove this link?")).toHaveCount(0);
  await expect(parent).toBeVisible();
  await expect(more).toBeFocused();
});

test("the Indent example: the window's page recedes while the drawer is open", async ({ page }) => {
  await visit(page, "/en/drawer");
  await pick(page, "Indent");
  const indent = demo(page).locator(".ow-drawer__indent");
  await expect(indent).not.toHaveAttribute("data-active", "");
  await open(page).click();
  await expect(indent).toHaveAttribute("data-active", "");
  await arrived(sheet(page));
  await expect
    .poll(() => indent.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
    .toBeCloseTo(0.96, 2);
  await page.keyboard.press("Escape");
  await expect(indent).not.toHaveAttribute("data-active", "");
});

test("Inspect's drawer is open inline, inert, inside its own window, without a lock on the page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/drawer");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-drawer__popup")).toBeVisible();
  await expect(specimen(page).locator(".ow-drawer__backdrop")).toHaveCount(1);
  await expect(page.locator(".ow-drawer__popup")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-drawer__popup")).not.toBeFocused();
  // The sheet stays inside the specimen's window.
  const [win, box] = [
    await specimen(page).locator(".demo-dialog").boundingBox(),
    await specimen(page).locator(".ow-drawer__popup").boundingBox(),
  ];
  expect(box?.y ?? 0).toBeGreaterThanOrEqual((win?.y ?? 0) - 1);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    (win?.y ?? 0) + (win?.height ?? 0) + 1,
  );
  const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe("hidden");
});
