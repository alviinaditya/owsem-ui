import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { rect, TOL } from "../../../test/geometry.ts";
import { Avatar, type AvatarSize } from "./index";

const SIZES: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 48 };

const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOL);

async function mount(ui: ReactNode, dir: "ltr" | "rtl" = "ltr"): Promise<HTMLElement[]> {
  const screen = await render(<div dir={dir}>{ui}</div>);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-avatar")];
}

const Letter = ({ children }: { children: string }) => (
  <Avatar.Fallback>{children}</Avatar.Fallback>
);

describe("Avatar geometry", () => {
  for (const [size, edge] of Object.entries(SIZES) as [AvatarSize, number][]) {
    test(`${size}: ${edge} × ${edge}, with two letters inside and nothing clipped`, async () => {
      const [avatar] = await mount(
        <Avatar.Root size={size}>
          <Letter>MW</Letter>
        </Avatar.Root>,
      );
      if (!avatar) throw new Error("no avatar");
      close(rect(avatar).width, edge);
      close(rect(avatar).height, edge);
      const text = avatar.firstElementChild as HTMLElement;
      expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
      const range = document.createRange();
      range.selectNodeContents(text);
      const letters = range.getBoundingClientRect();
      // The capitals' corners are inside the circle, a pixel from its edge, in any font.
      const cap = document.createElement("span");
      cap.style.cssText = "display: inline-block; block-size: 1cap";
      text.append(cap);
      const height = rect(cap).height;
      cap.remove();
      expect(height).toBeGreaterThan(0);
      expect(Math.hypot(letters.width / 2, height / 2)).toBeLessThanOrEqual(edge / 2 - 1);
      // Centered in the circle.
      close(letters.left + letters.width / 2, rect(avatar).left + edge / 2);
    });
  }

  test("exact at a fractional zoom: whole pixels from px, not from em", async () => {
    const [avatar] = await mount(
      <Avatar.Root style={{ fontSize: 31 }}>
        <Letter>A</Letter>
      </Avatar.Root>,
    );
    if (!avatar) throw new Error("no avatar");
    close(rect(avatar).width, 40);
  });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`a group in ${dir}: each avatar overlaps the one before by an eighth, and the cut is where the next one sits`, async () => {
      const avatars = await mount(
        <Avatar.Group aria-label="Team" size="lg">
          <Avatar.Root>
            <Letter>A</Letter>
          </Avatar.Root>
          <Avatar.Root>
            <Letter>B</Letter>
          </Avatar.Root>
          <Avatar.Root>
            <Letter>+3</Letter>
          </Avatar.Root>
        </Avatar.Group>,
        dir,
      );
      const [a, b, c] = avatars;
      if (!a || !b || !c) throw new Error("no avatars");
      const sign = dir === "ltr" ? 1 : -1;
      const centerOf = (el: HTMLElement) => rect(el).left + rect(el).width / 2;
      close(sign * (centerOf(b) - centerOf(a)), 42);
      close(sign * (centerOf(c) - centerOf(b)), 42);
      // The cut: a circle 2px wider than the next avatar, centered on it.
      const mask = getComputedStyle(a).maskImage;
      const found = /radial-gradient\((?:circle )?([\d.]+)px at calc\(50% ([+-]) ([\d.]+)px\)/.exec(
        mask,
      );
      if (!found) throw new Error(`no cut in ${mask}`);
      close(Number(found[1]), 24 + 2);
      const offset = Number(found[3]) * (found[2] === "-" ? -1 : 1);
      close(centerOf(a) + offset, centerOf(b));
      expect(getComputedStyle(c).maskImage).toBe("none");
    });
  }

  for (const dir of ["ltr", "rtl"] as const) {
    test(`a group in ${dir}: the start cut of the avatar after a hovered one is centered on it`, async () => {
      const avatars = await mount(
        <Avatar.Group aria-label="Team" size="lg">
          {["A", "B", "C", "D"].map((name) => (
            <Avatar.Root key={name} render={<button type="button" aria-label={name} />}>
              <Letter>{name}</Letter>
            </Avatar.Root>
          ))}
        </Avatar.Group>,
        dir,
      );
      const [, b, c] = avatars;
      if (!b || !c) throw new Error("no avatars");
      await userEvent.hover(b);
      const layers = [
        ...getComputedStyle(c).maskImage.matchAll(
          /radial-gradient\((?:circle )?([\d.]+)px at calc\(50% ([+-]) ([\d.]+)px\)/g,
        ),
      ];
      // The cut before comes first, then the cut after.
      expect(layers).toHaveLength(2);
      const centerOf = (el: HTMLElement) => rect(el).left + rect(el).width / 2;
      for (const [index, target] of [b, avatars[3]].entries()) {
        const found = layers[index];
        if (!found || !target) throw new Error("no cut");
        // Half a size plus 2px, centered 0.875 of a size from the avatar's own center.
        close(Number(found[1]), 24 + 2);
        const offset = Number(found[3]) * (found[2] === "-" ? -1 : 1);
        close(Math.abs(offset), 48 * 0.875);
        close(centerOf(c) + offset, centerOf(target));
      }
    });
  }

  for (const dir of ["ltr", "rtl"] as const) {
    for (const [size, edge] of Object.entries(SIZES) as [AvatarSize, number][]) {
      test(`in a ${size} group in ${dir} the initials are centered in their own circle and clear of the cut`, async () => {
        const avatars = await mount(
          <Avatar.Group aria-label="Team" size={size}>
            <Avatar.Root>
              <Letter>AR</Letter>
            </Avatar.Root>
            <Avatar.Root>
              <Letter>AR</Letter>
            </Avatar.Root>
            <Avatar.Root>
              <Letter>AR</Letter>
            </Avatar.Root>
          </Avatar.Group>,
          dir,
        );
        const sign = dir === "ltr" ? 1 : -1;
        expect(avatars).toHaveLength(3);
        for (const [index, avatar] of avatars.entries()) {
          const range = document.createRange();
          range.selectNodeContents(avatar.firstElementChild as Element);
          const letters = range.getBoundingClientRect();
          const circle = rect(avatar);
          close(letters.left + letters.width / 2, circle.left + edge / 2);
          const next = avatars[index + 1];
          if (!next) continue;
          // The cut starts 2px before the next circle, on the side the next one is on.
          const cut = sign === 1 ? rect(next).left - 2 : rect(next).right + 2;
          const clear = sign === 1 ? cut - letters.right : letters.left - cut;
          expect(clear).toBeGreaterThanOrEqual(-0.5);
        }
      });
    }
  }
});
