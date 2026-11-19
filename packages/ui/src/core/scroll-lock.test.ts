import { describe, expect, onTestFinished, test } from "vitest";
import { userEvent } from "vitest/browser";
import { lockScroll, trackPointerType } from "./scroll-lock";

/** A page taller than the window, so the window scrolls; a line at its top to point at. */
function tallPage(): HTMLElement {
  const page = document.createElement("div");
  page.style.blockSize = "4000px";
  const line = document.createElement("p");
  line.textContent = "Outside";
  page.append(line);
  document.body.append(page);
  onTestFinished(() => {
    page.remove();
    window.scrollTo(0, 0);
  });
  return line;
}

/** A region that scrolls: 100px tall, 400px of content. */
function region(): { el: HTMLElement; inner: HTMLElement } {
  const el = document.createElement("div");
  el.style.cssText = "overflow-y:auto;block-size:100px;inline-size:200px";
  const inner = document.createElement("div");
  inner.style.blockSize = "400px";
  el.append(inner);
  document.body.prepend(el);
  onTestFinished(() => el.remove());
  return { el, inner };
}

/** Locks the page for `el` until the test ends; returns the unlock. */
function lock(el: Element): () => void {
  const unlock = lockScroll(el);
  onTestFinished(unlock);
  return unlock;
}

/** Whether a wheel turned over `target` was held back. */
const wheel = (target: Element, deltaY = 100, deltaX = 0) =>
  !target.dispatchEvent(
    new WheelEvent("wheel", { deltaX, deltaY, bubbles: true, cancelable: true }),
  );

/** Whether a key pressed in `target` was held back. */
const press = (target: Element, key: string) =>
  !target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

const pointer = (pointerType: string) => {
  document.body.dispatchEvent(new PointerEvent("pointerdown", { pointerType, bubbles: true }));
};

const frames = async (count = 3) => {
  for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
};

const KEYS = [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"];

describe("lockScroll", () => {
  test("holds the page where it was: a wheel outside is held back, any other scroll undone", async () => {
    tallPage();
    const { el } = region();
    window.scrollTo(0, 150);
    lock(el);
    expect(wheel(document.body)).toBe(true);
    // A dragged scrollbar, or a script: the page goes back where it was held.
    window.scrollTo(0, 400);
    expect(window.scrollY).toBe(400);
    await expect.poll(() => window.scrollY).toBe(150);
  });

  test("a real wheel moves a region but not the page", async () => {
    const outside = tallPage();
    const { el } = region();
    const seen: boolean[] = [];
    const record = (event: WheelEvent) => seen.push(event.defaultPrevented);
    window.addEventListener("wheel", record, { passive: true });
    onTestFinished(() => window.removeEventListener("wheel", record));
    lock(el);
    await userEvent.wheel(outside, { delta: { y: 300 } });
    await expect.poll(() => seen).toEqual([true]);
    await userEvent.wheel(el, { delta: { y: 60 } });
    await expect.poll(() => seen).toEqual([true, false]);
    await expect.poll(() => el.scrollTop).toBeGreaterThan(0);
    await frames(10);
    expect(window.scrollY).toBe(0);
  });

  test("a wheel in a region scrolls it while it can, and is held back at its end", () => {
    const { el, inner } = region();
    lock(el);
    expect(wheel(inner, 100)).toBe(false);
    // At its top it cannot go up, so the page would take that wheel.
    expect(wheel(inner, -100)).toBe(true);
    el.scrollTop = el.scrollHeight;
    expect(wheel(inner, 100)).toBe(true);
    expect(wheel(inner, -100)).toBe(false);
    // Nothing in it scrolls sideways.
    expect(wheel(inner, 0, 100)).toBe(true);
  });

  test("a scroller outside the regions is held too", () => {
    const { el } = region();
    const other = region();
    lock(el);
    expect(wheel(other.inner, 100)).toBe(true);
  });

  test("scroll keys outside are held back; in a field or a region they work", () => {
    const { el, inner } = region();
    const input = document.createElement("input");
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    document.body.append(input, editable);
    onTestFinished(() => {
      input.remove();
      editable.remove();
    });
    lock(el);
    for (const key of KEYS) {
      expect(press(document.body, key), key).toBe(true);
      expect(press(input, key), key).toBe(false);
      expect(press(editable, key), key).toBe(false);
      expect(press(inner, key), key).toBe(false);
    }
    // Keys that do not scroll pass.
    expect(press(document.body, "Tab")).toBe(false);
    expect(press(document.body, "a")).toBe(false);
  });

  test("two regions hold the page until the last lets go", async () => {
    tallPage();
    const a = region();
    const b = region();
    const unlockA = lock(a.el);
    const unlockB = lock(b.el);
    unlockA();
    expect(wheel(document.body)).toBe(true);
    expect(press(document.body, "PageDown")).toBe(true);
    // Letting go twice does not let go of the other.
    unlockA();
    expect(wheel(document.body)).toBe(true);
    expect(wheel(b.inner)).toBe(false);
    unlockB();
    // Unlocked, nothing is held back.
    expect(wheel(document.body)).toBe(false);
    expect(wheel(a.inner, -100)).toBe(false);
    expect(press(document.body, "PageDown")).toBe(false);
    window.scrollTo(0, 200);
    await frames();
    expect(window.scrollY).toBe(200);
  });

  test("opened by touch, it does not lock", async () => {
    trackPointerType();
    onTestFinished(() => pointer("mouse"));
    tallPage();
    const { el } = region();
    pointer("touch");
    lock(el);
    expect(wheel(document.body)).toBe(false);
    expect(press(document.body, "PageDown")).toBe(false);
    window.scrollTo(0, 200);
    await frames();
    expect(window.scrollY).toBe(200);
    // A mouse press, and the next lock holds.
    pointer("mouse");
    lock(region().el);
    expect(wheel(document.body)).toBe(true);
  });

  test("puts back a page lock written while it holds, as Base UI's over a Select's trigger", async () => {
    tallPage();
    const { el } = region();
    const html = document.documentElement;
    const before = [html.style.cssText, document.body.style.cssText];
    const unlock = lock(el);
    html.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";
    // Put back before the next frame, so the page is never drawn locked.
    await Promise.resolve();
    expect(html.style.scrollbarGutter).toBe("");
    expect(document.body.style.overflow).toBe("");
    unlock();
    // Let go, it no longer watches.
    document.body.style.overflow = "hidden";
    await Promise.resolve();
    expect(document.body.style.overflow).toBe("hidden");
    document.body.style.overflow = "";
    expect([html.style.cssText, document.body.style.cssText]).toEqual(before);
  });

  test("keeps a page lock that was there first, as a Dialog's", async () => {
    tallPage();
    const { el } = region();
    document.body.style.overflow = "hidden";
    onTestFinished(() => {
      document.body.style.overflow = "";
    });
    lock(el);
    document.body.style.overflow = "";
    await Promise.resolve();
    expect(document.body.style.overflow).toBe("hidden");
  });

  test("leaves every element's style alone, the page's overflow included", async () => {
    tallPage();
    const { el } = region();
    const html = document.documentElement;
    const before = [html.getAttribute("style"), document.body.getAttribute("style")];
    const styles = new MutationObserver(() => {});
    styles.observe(html, { attributes: true, attributeFilter: ["style"], subtree: true });
    onTestFinished(() => styles.disconnect());
    const unlock = lock(el);
    expect(getComputedStyle(html).overflow).toBe("visible");
    expect(getComputedStyle(document.body).overflow).toBe("visible");
    wheel(document.body);
    press(document.body, "PageDown");
    window.scrollTo(0, 300);
    await expect.poll(() => window.scrollY).toBe(0);
    unlock();
    expect(styles.takeRecords()).toEqual([]);
    expect([html.getAttribute("style"), document.body.getAttribute("style")]).toEqual(before);
  });
});
