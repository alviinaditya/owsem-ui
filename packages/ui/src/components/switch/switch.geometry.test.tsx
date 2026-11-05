import type { CSSProperties, ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { render } from "vitest-browser-react";
import { insets, rect, TOL, usedRadius } from "../../../test/geometry.ts";
import { Switch, type SwitchSize } from "./index";

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(<div style={{ display: "flex", gap: 8 }}>{ui}</div>);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-switch")];
}

const thumbOf = (track: Element) => track.querySelector(".ow-switch__thumb") as HTMLElement;
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

/** Gaps from the track to the thumb's key, inside the clear border that keeps the inset. */
function keyGaps(track: Element) {
  const thumb = thumbOf(track);
  const gap = insets(track, thumb);
  const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
  return {
    top: gap.top + border,
    right: gap.right + border,
    bottom: gap.bottom + border,
    left: gap.left + border,
  };
}

/** An unlayered stylesheet for one test, as an app's own CSS would be. */
function unlayered(css: string) {
  const sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
  onTestFinished(() => sheet.remove());
}

/** A thumb's travel, done: rests where layout puts it. */
function land(track: Element) {
  for (const animation of thumbOf(track).getAnimations()) animation.finish();
}

// Button's fonts (13, 14, 16 px): whole pixels, two keys wide and one tall inside the 2 px inset.
const SIZES: Record<SwitchSize, { width: number; height: number; key: number }> = {
  sm: { width: 34, height: 19, key: 15 },
  md: { width: 36, height: 20, key: 16 },
  lg: { width: 40, height: 22, key: 18 },
};

describe("Switch geometry", () => {
  for (const [size, expected] of Object.entries(SIZES) as [SwitchSize, typeof SIZES.md][]) {
    test(`${size}: ${expected.width} × ${expected.height}, a ${expected.key} px key 2 px inside at both ends`, async () => {
      const [off, on] = await mount(
        <>
          <Switch.Root aria-label="Off" size={size} />
          <Switch.Root aria-label="On" size={size} defaultChecked />
        </>,
      );
      if (!off || !on) throw new Error("no switches");
      for (const track of [off, on]) {
        close(rect(track).width, expected.width);
        close(rect(track).height, expected.height);
      }
      const offGaps = keyGaps(off);
      close(offGaps.left, 2);
      close(offGaps.top, 2);
      close(offGaps.bottom, 2);
      close(rect(off).width - offGaps.left - offGaps.right, expected.key);
      const onGaps = keyGaps(on);
      close(onGaps.right, 2);
      close(onGaps.top, 2);
      close(onGaps.bottom, 2);
      close(rect(on).width - onGaps.left - onGaps.right, expected.key);
    });
  }

  test("the thumb rests where layout puts it: no translate left at a fractional zoom", async () => {
    const [off, on] = await mount(
      <>
        <Switch.Root aria-label="Off" />
        <Switch.Root aria-label="On" defaultChecked />
      </>,
    );
    for (const track of [off, on]) {
      if (!track) throw new Error("no switch");
      close(rect(thumbOf(track)).left - rect(track).left, thumbOf(track).offsetLeft);
    }
    expect(thumbOf(on as HTMLElement).offsetLeft).toBe(16);
    expect(thumbOf(off as HTMLElement).offsetLeft).toBe(0);
  });

  test("the thumb lands exactly at the far end, and back", async () => {
    const [track] = await mount(<Switch.Root aria-label="Wi-Fi" />);
    if (!track) throw new Error("no switch");
    track.click();
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("true");
    land(track);
    close(keyGaps(track).right, 2);
    track.click();
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("false");
    land(track);
    close(keyGaps(track).left, 2);
  });

  test("radii are concentric: the key's, plus the inset (FR-10b)", async () => {
    const [track] = await mount(
      <Switch.Root aria-label="Square-ish" style={{ "--ow-radius": "4px" } as CSSProperties} />,
    );
    if (!track) throw new Error("no switch");
    expect(usedRadius(track)).toBe(6);
    expect(usedRadius(thumbOf(track))).toBe(6);
    const border = Number.parseFloat(getComputedStyle(thumbOf(track)).borderTopWidth);
    close(usedRadius(thumbOf(track)) - border, 4);
  });

  test("the press target is at least 24 px each way (FR-14)", async () => {
    const tracks = await mount(
      <>
        <Switch.Root aria-label="sm" size="sm" />
        <Switch.Root aria-label="md" />
        <Switch.Root aria-label="lg" size="lg" />
      </>,
    );
    for (const track of tracks) {
      const target = rect({ el: track, pseudo: "::before" });
      expect(target.height).toBeGreaterThanOrEqual(24 - 0.01);
      expect(target.width).toBeGreaterThanOrEqual(24);
      close(target.top + target.height / 2, rect(track).top + rect(track).height / 2);
    }
  });

  test("font-size scales the whole switch, from em", async () => {
    const [track] = await mount(
      <Switch.Root aria-label="Big" style={{ fontSize: 40 }} defaultChecked />,
    );
    if (!track) throw new Error("no switch");
    close(rect(track).width, 88);
    close(rect(track).height, 46);
    const gaps = keyGaps(track);
    close(gaps.right, 2);
    close(gaps.top, 2);
    close(gaps.bottom, 2);
  });

  test("a track resized through CSS keeps the thumb at its ends, and travels the new distance", async () => {
    unlayered(".wide { inline-size: 77px; block-size: 31px; }");
    const [track] = await mount(<Switch.Root aria-label="Wide" className="wide" />);
    if (!track) throw new Error("no switch");
    close(rect(track).width, 77);
    close(rect(track).height, 31);
    close(rect(thumbOf(track)).width, 31);
    close(keyGaps(track).left, 2);
    track.click();
    await expect.poll(() => track.getAttribute("aria-checked")).toBe("true");
    // The first frame of the travel starts from the far side: 77 less the thumb's 31.
    const [travel] = thumbOf(track).getAnimations();
    if (!travel) throw new Error("no travel");
    travel.pause();
    travel.currentTime = 0;
    close(rect(thumbOf(track)).left - rect(track).left, 0);
    travel.finish();
    close(rect(thumbOf(track)).left - rect(track).left, 46);
    close(keyGaps(track).right, 2);
  });

  test("an icon in the thumb is centered, 2 px inside the key", async () => {
    const [track] = await mount(
      <Switch.Root aria-label="Icon">
        <Switch.Thumb>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
          </svg>
        </Switch.Thumb>
      </Switch.Root>,
    );
    if (!track) throw new Error("no switch");
    const thumb = thumbOf(track);
    const gap = insets(thumb, thumb.querySelector("svg") as Element);
    const border = Number.parseFloat(getComputedStyle(thumb).borderTopWidth);
    for (const side of [gap.top, gap.right, gap.bottom, gap.left]) close(side - border, 2);
  });

  test("right to left, off is on the right and on is on the left (FR-16)", async () => {
    const [off, on] = await mount(
      <div dir="rtl" style={{ display: "flex", gap: 8 }}>
        <Switch.Root aria-label="Off" />
        <Switch.Root aria-label="On" defaultChecked />
      </div>,
    );
    if (!off || !on) throw new Error("no switches");
    close(keyGaps(off).right, 2);
    close(keyGaps(on).left, 2);
    on.click();
    await expect.poll(() => on.getAttribute("aria-checked")).toBe("false");
    land(on);
    close(keyGaps(on).right, 2);
  });

  test("it sets no outer margin, and stretches when given a width", async () => {
    unlayered(".full { inline-size: 100%; }");
    const screen = await render(
      <div style={{ inlineSize: 200 }}>
        <Switch.Root aria-label="Full" className="full" defaultChecked />
      </div>,
    );
    const track = screen.container.querySelector(".ow-switch") as HTMLElement;
    expect(getComputedStyle(track).marginLeft).toBe("0px");
    close(rect(track).width, 200);
    close(keyGaps(track).right, 2);
  });
});
