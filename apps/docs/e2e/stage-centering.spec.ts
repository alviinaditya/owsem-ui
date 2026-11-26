import { expect, type Page, test } from "@playwright/test";
import { catalog, isAvailable } from "../lib/catalog.ts";
import { demo, docs, pick, picker, tools, visit } from "./example-page.ts";

// Every example sits in the middle of the stage, and keeps its width while it is used.
const TOLERANCE = 2;

/**
 * Examples whose visible content is lopsided by what they show, not by the stage. They must stay
 * within LOOSE, so a real shift still fails.
 */
const LOOSE = 8;
const DELIBERATE: Record<string, string> = {
  "radio-group / Sizes": "rows of three sizes: each size insets its box and text differently",
  "checkbox-group / Sizes": "rows of three sizes: each size insets its box and text differently",
  "radio-group / Controlled": "a caption flush with the group's edge, under rows that are inset",
  "toggle / Solid": "an unpressed Toggle has no surface at rest, only its icon and text",
  "toggle / Disabled": "a disabled, unpressed Toggle has no surface at rest",
  "copy-button / Variants": "the ghost Copy Button has no surface at rest",
  "copy-button / Sizes": "the ghost Copy Button has no surface at rest",
  "avatar / Fallback": "captions of different widths under cells of one width",
  "meter / Breakdown": "legend items of different widths",
  "collapsible / Controlled": "a left-aligned trigger over a button and its state text",
};

/** Ends every running animation and transition, so nothing is measured mid-way. */
const finish = (page: Page) =>
  page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {
        // An endless animation has no end.
      }
    }
  });

/** The visible content's centre against the stage's, in CSS pixels. */
const measure = async (page: Page) => {
  await finish(page);
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".cp-demo");
    const body = document.querySelector<HTMLElement>(".cp-body");
    if (!root || !body) return null;
    // A colour with no alpha paints nothing: "transparent", "rgba(…, 0)", "oklab(… / 0)".
    const clear = (value: string) => value === "transparent" || /(, |\/ )0(\.0+)?\)$/.test(value);
    const boxes: DOMRect[] = [];
    // A box is cut by every ancestor that clips, up to the demo.
    const clip = (rect: DOMRect, from: Element | null) => {
      let { left, right, top, bottom } = rect;
      for (let el = from; el && el !== root.parentElement; el = el.parentElement) {
        const style = getComputedStyle(el);
        if (style.overflowX !== "visible" || style.overflowY !== "visible") {
          const box = el.getBoundingClientRect();
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      return right > left && bottom > top
        ? new DOMRect(left, top, right - left, bottom - top)
        : null;
    };
    // Visually hidden inputs and measuring spans are 1px boxes.
    const add = (rect: DOMRect, from: Element | null) => {
      const box = clip(rect, from);
      if (box && box.width > 2 && box.height > 2) boxes.push(box);
    };
    const hidden = (el: Element) => {
      for (let node: Element | null = el; node && node !== root.parentElement; ) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };
    for (const el of root.querySelectorAll("*")) {
      if (el.closest("svg") && el.tagName !== "svg") continue;
      if (hidden(el)) continue;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const pseudo = (["::before", "::after"] as const).some((name) => {
        const after = getComputedStyle(el, name);
        return (
          after.content !== "none" && after.content !== "normal" && !clear(after.backgroundColor)
        );
      });
      const paints =
        pseudo ||
        ["svg", "IMG", "INPUT", "TEXTAREA", "CANVAS", "VIDEO"].includes(el.tagName) ||
        !clear(style.backgroundColor) ||
        (Number.parseFloat(style.borderTopWidth) > 0 && !clear(style.borderTopColor)) ||
        (Number.parseFloat(style.borderBottomWidth) > 0 && !clear(style.borderBottomColor));
      if (paints) add(rect, el.parentElement);
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const lines = [...range.getClientRects()];
        // Wrapped text is a block with a ragged edge: its box is what lines up.
        if (lines.length > 1) add(rect, el);
        else for (const line of lines) add(line, el);
      }
    }
    if (!boxes.length) return null;
    const left = Math.min(...boxes.map((box) => box.left));
    const right = Math.max(...boxes.map((box) => box.right));
    const stage = body.getBoundingClientRect();
    return {
      dx: (left + right) / 2 - (stage.left + stage.right) / 2,
      width: right - left,
      stage: stage.width,
    };
  });
};

const names = catalog.filter(isAvailable).map((entry) => entry.name);

/** Every example of every page: the ones whose content is off the stage's middle. */
async function offCentre(page: Page, docsOpen: boolean): Promise<string[]> {
  const off: string[] = [];
  for (const name of names) {
    await visit(page, `/en/${name}`);
    if (docsOpen) {
      await tools(page).getByRole("button", { name: "Docs", exact: true }).click();
      await expect(docs(page)).toBeVisible();
    }
    const titles = await picker(page).getByRole("button").allInnerTexts();
    for (const [index, title] of (titles.length ? titles : [""]).entries()) {
      if (index > 0) await pick(page, title);
      const box = await measure(page);
      if (!box) continue;
      const key = `${name} / ${title || "(one)"}`;
      const allowed = key in DELIBERATE ? LOOSE : TOLERANCE;
      if (Math.abs(box.dx) > allowed) {
        off.push(
          `${key}: ${box.dx.toFixed(1)}px (content ${box.width.toFixed(0)} of ${box.stage.toFixed(0)})`,
        );
      }
    }
  }
  return off;
}

test("every example sits in the middle of the stage", async ({ page }) => {
  test.setTimeout(600_000);
  const off = await offCentre(page, false);
  expect(off, off.join("\n")).toEqual([]);
});

test("every example sits in the middle of the stage with the Docs panel open", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a phone shows the Docs as a sheet");
  test.setTimeout(600_000);
  const off = await offCentre(page, true);
  expect(off, off.join("\n")).toEqual([]);
});

test("an example keeps its width while it is used", async ({ page }) => {
  test.setTimeout(600_000);
  const moved: string[] = [];
  for (const name of names) {
    await visit(page, `/en/${name}`);
    const titles = await picker(page).getByRole("button").allInnerTexts();
    for (const [index, title] of (titles.length ? titles : [""]).entries()) {
      if (index > 0) {
        await pick(page, title);
      }
      const stage = demo(page).locator(".cp-demo");
      await finish(page);
      const base = await stage.evaluate((el) => el.getBoundingClientRect().width);
      const tabs = stage.getByRole("tab");
      const count = await tabs.count();
      for (let i = 0; i < count; i++) {
        await tabs.nth(i).evaluate((el) => (el as HTMLElement).click());
        const width = await stage.evaluate((el) => el.getBoundingClientRect().width);
        if (Math.abs(width - base) > 1) {
          moved.push(
            `${name} / ${title || "(one)"}: tab ${i + 1} ${base.toFixed(0)} -> ${width.toFixed(0)}`,
          );
        }
      }
    }
  }
  expect(moved, moved.join("\n")).toEqual([]);
});
