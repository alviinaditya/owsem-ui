import { expect, type Page, test } from "@playwright/test";
import { demo, pageTests, pick, specimen, visit } from "./example-page.ts";

pageTests("toast", {
  examples: ["Default", "Types", "Action", "Promise", "Anchored", "Stacking"],
  parts: [
    "Provider",
    "Viewport",
    "Root",
    "Content",
    "Mark",
    "Title",
    "Description",
    "Action",
    "Close",
    "Positioner",
    "Arrow",
  ],
  specimen: ".ow-toast .ow-toast__title",
});

// The toasts land in the demo's window, at its bottom end, not in a portal on the body.
const button = (page: Page, name: string) => demo(page).locator(`[data-demo="${name}"]`);
const cards = (page: Page) => demo(page).locator(".ow-toast");
const windowBox = (page: Page) => demo(page).locator(".demo-dialog");

/** Waits for a card to arrive: the opening style gone, its transitions ended. */
async function arrived(card: ReturnType<typeof cards>) {
  await expect
    .poll(() => card.evaluateAll((els) => els.some((el) => el.hasAttribute("data-starting-style"))))
    .toBe(false);
  await card.evaluateAll(async (els) => {
    await Promise.all(
      els.flatMap((el) => el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
  });
}

test("a press shows a toast at the window's bottom end, 16px from its edges", async ({ page }) => {
  await visit(page, "/en/toast");
  await button(page, "show").click();
  const card = cards(page).first();
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { name: "Changes saved" })).toBeVisible();
  await arrived(card);
  const [win, box] = [await windowBox(page).boundingBox(), await card.boundingBox()];
  if (!win || !box) throw new Error("no box");
  // A narrow screen fits the demo by a scale; the gutters scale with it.
  const scale =
    win.width / (await windowBox(page).evaluate((el) => (el as HTMLElement).offsetWidth));
  expect(Math.abs(win.x + win.width - 16 * scale - (box.x + box.width))).toBeLessThan(1);
  expect(Math.abs(win.y + win.height - 16 * scale - (box.y + box.height))).toBeLessThan(1);
  expect(box.width).toBeLessThanOrEqual(22 * 16 * scale + 1);
  await expect(page.locator("body > .ow-toast__viewport")).toHaveCount(0);
});

test("the viewport is a live region, and F6 moves focus to it", async ({ page }) => {
  await visit(page, "/en/toast");
  await button(page, "show").click();
  const region = demo(page).getByRole("region", { name: "Notifications" });
  await expect(region).toHaveAttribute("aria-live", "polite");
  await expect(cards(page).first()).toBeVisible();
  await page.keyboard.press("F6");
  await expect(region).toBeFocused();
});

test("a toast is dismissed by its close button, and by Escape", async ({ page }) => {
  await visit(page, "/en/toast");
  await button(page, "show").click();
  await expect(cards(page)).toHaveCount(1);
  await arrived(cards(page));
  // Base UI hides the button from assistive technology until the stack is open or it has focus.
  await cards(page).first().locator(".ow-toast__close").click();
  await expect(cards(page)).toHaveCount(0);
  await button(page, "show").click();
  await expect(cards(page)).toHaveCount(1);
  await cards(page).first().focus();
  await page.keyboard.press("Escape");
  await expect(cards(page)).toHaveCount(0);
});

test("each type draws its mark, and a toast with no type draws none", async ({ page }) => {
  await visit(page, "/en/toast");
  await pick(page, "Types");
  await button(page, "type-default").click();
  await expect(cards(page)).toHaveCount(1);
  await expect(demo(page).locator(".ow-toast__mark")).toHaveCount(0);
  for (const type of ["success", "error", "warning", "info", "loading"]) {
    await button(page, `type-${type}`).click();
    await expect(demo(page).locator(`.ow-toast[data-type="${type}"]`)).toHaveCount(1);
    await expect(
      demo(page).locator(`.ow-toast[data-type="${type}"] .ow-toast__mark`),
    ).toBeVisible();
  }
});

test("Archive hides the row and shows Undo, which brings it back", async ({ page }) => {
  await visit(page, "/en/toast");
  await pick(page, "Action");
  await button(page, "archive").click();
  await expect(button(page, "archive")).toBeDisabled();
  const undo = demo(page).getByRole("button", { name: "Undo" });
  await expect(undo).toBeVisible();
  await expect(demo(page).locator(".ow-toast__action")).toHaveCount(1);
  await undo.click({ force: true });
  await expect(button(page, "archive")).toBeEnabled();
  await expect(demo(page).getByText("Message restored")).toBeVisible();
});

test("a promise toast loads, then turns into the result", async ({ page }) => {
  await visit(page, "/en/toast");
  await pick(page, "Promise");
  await button(page, "save").click();
  await expect(demo(page).locator('.ow-toast[data-type="loading"]')).toHaveCount(1);
  await expect(demo(page).locator('.ow-toast[data-type="success"]')).toHaveCount(1);
  await expect(demo(page).getByText("Saved", { exact: true })).toBeVisible();
  await button(page, "save-fail").click();
  await expect(demo(page).locator('.ow-toast[data-type="error"]')).toHaveCount(1);
  await expect(demo(page).getByText("Could not save")).toBeVisible();
});

test("an anchored toast sits by its button with an arrow, and leaves by itself", async ({
  page,
}, testInfo) => {
  await visit(page, "/en/toast");
  await pick(page, "Anchored");
  await button(page, "copy").click();
  const card = cards(page).first();
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-anchored", "");
  await expect(card.locator(".ow-toast__arrow")).toHaveCount(1);
  await arrived(card);
  if (testInfo.project.name === "desktop") {
    // Below the button, 10px away (a narrow screen scales the demo, which positioning ignores).
    const anchor = await button(page, "copy").boundingBox();
    if (!anchor) throw new Error("no box");
    await expect
      .poll(async () =>
        Math.abs(((await card.boundingBox())?.y ?? 0) - (anchor.y + anchor.height + 10)),
      )
      .toBeLessThan(2);
  }
  await expect(cards(page)).toHaveCount(0, { timeout: 8000 });
});

test("a stack of more than the limit hides the oldest; F6 opens it into a list", async ({
  page,
}) => {
  await visit(page, "/en/toast");
  await pick(page, "Stacking");
  for (let i = 0; i < 4; i++) await button(page, "add").click();
  await expect(cards(page)).toHaveCount(4);
  await expect(demo(page).locator(".ow-toast[data-limited]")).toHaveCount(1);
  await arrived(cards(page));
  // Focus on the viewport opens the stack, as hover does.
  await page.keyboard.press("F6");
  await expect(demo(page).locator(".ow-toast[data-expanded]")).toHaveCount(4);
  await button(page, "clear").click({ force: true });
  await expect(cards(page)).toHaveCount(0);
});

test("Inspect's stack is held in its own window: inert, no timers, nothing focused", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the full sheet needs a wide preview");
  await visit(page, "/en/toast");
  await page.keyboard.press("i");
  await expect(specimen(page).locator(".ow-toast__title").first()).toBeVisible();
  // Past the entrance, which comes from below the window's edge.
  await expect
    .poll(() =>
      specimen(page)
        .locator(".ow-toast")
        .evaluateAll((els) => els.some((el) => el.hasAttribute("data-starting-style"))),
    )
    .toBe(false);
  await specimen(page)
    .locator(".demo-toast")
    .evaluate(async (el) => {
      await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
    });
  // A stack of three and an anchored toast, all inside the specimen's own window.
  await expect(specimen(page).locator(".ow-toast:not([data-anchored])")).toHaveCount(3);
  await expect(specimen(page).locator(".ow-toast[data-anchored]")).toHaveCount(1);
  await expect(specimen(page).locator(".ow-toast__arrow")).toHaveCount(1);
  await expect(specimen(page).locator(".demo-toast")).toHaveAttribute("inert", "");
  await expect(specimen(page).locator(".ow-toast__viewport").first()).not.toBeFocused();
  const [win, box] = [
    await specimen(page).locator(".demo-toast").boundingBox(),
    await specimen(page).locator(".ow-toast:not([data-anchored])").first().boundingBox(),
  ];
  expect(box?.x ?? 0).toBeGreaterThanOrEqual((win?.x ?? 0) - 1);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    (win?.y ?? 0) + (win?.height ?? 0) + 1,
  );
  // The sheet stays usable: a part's button opens its popover.
  const part = page.getByRole("button", { name: "Close part", exact: true });
  await part.click();
  await expect(part).toHaveAttribute("aria-expanded", "true");
});

test("the index card shows a static stack kept inside it, and takes no focus", async ({ page }) => {
  await page.goto("/en");
  const card = page.locator('.component-preview-live[data-preview="toast"]').locator("..");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".ow-toast")).toHaveCount(3);
  // Past their entrance, which comes from below the card's edge.
  await expect
    .poll(() =>
      card
        .locator(".ow-toast")
        .evaluateAll((els) => els.some((el) => el.hasAttribute("data-starting-style"))),
    )
    .toBe(false);
  await card.evaluate(async (el) => {
    await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  });
  const stage = await card.boundingBox();
  for (const el of await card.locator(".ow-toast").all()) {
    await expect(el).toBeVisible();
  }
  // Nothing in it is fixed to the window, and every card is inside it.
  const problems = await card.evaluate((root) => {
    const bad: string[] = [];
    const box = root.getBoundingClientRect();
    for (const el of root.querySelectorAll("*")) {
      if (getComputedStyle(el).position === "fixed") bad.push(`fixed: ${el.className}`);
    }
    for (const toast of root.querySelectorAll(".ow-toast")) {
      const r = toast.getBoundingClientRect();
      if (r.left < box.left - 1 || r.right > box.right + 1 || r.bottom > box.bottom + 1) {
        bad.push(`outside: ${toast.textContent}`);
      }
    }
    return bad;
  });
  expect(problems).toEqual([]);
  expect(stage?.height).toBeGreaterThan(100);
  // Hidden from assistive technology and not reachable.
  await expect(card).toHaveAttribute("inert", "");
  await expect(page.locator(".ow-toast__viewport")).not.toBeFocused();
  await expect(page.locator(":focus")).toHaveCount(0);
});
