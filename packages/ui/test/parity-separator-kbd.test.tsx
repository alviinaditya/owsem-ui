import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Kbd as CssKbd } from "../src/components/kbd/kbd";
import { Separator as CssSeparator } from "../src/components/separator/separator";
import { Kbd as TwKbd } from "../src/tailwind/kbd/kbd";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { Separator as TwSeparator } from "../src/tailwind/separator/separator";
import { separatorSlots } from "../src/tailwind/separator/separator-variants";
import { type Case, classNames, expectStyles, setMedia, tailwindParity } from "./parity";

// Separator and Kbd in Tailwind CSS v4 (src/tailwind) against their stylesheets.

const SEPARATOR_OVERRIDES = "border-red-500 border-dashed my-2 border-transparent";
const KBD_OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm font-bold gap-0 min-w-0 outline-red-500 outline-2 whitespace-normal";

const tw = tailwindParity(
  classNames(
    ...Object.values(separatorSlots),
    ...Object.values(kbdSlots),
    SEPARATOR_OVERRIDES,
    KBD_OVERRIDES,
    "data-[orientation=horizontal]:border-t-4 data-[orientation=vertical]:border-s-4",
  ),
);

interface Kit {
  Separator: typeof CssSeparator;
  Kbd: typeof CssKbd;
}
const css: Kit = { Separator: CssSeparator, Kbd: CssKbd };
const twind: Kit = { Separator: TwSeparator, Kbd: TwKbd };

const make = (name: string, ui: (kit: Kit) => ReactElement): Case => ({
  name,
  css: ui(css),
  tw: ui(twind),
});

const separators: Case[] = [
  make("horizontal in a column", ({ Separator }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span>Above</span>
      <Separator />
      <span>Below</span>
    </div>
  )),
  make("vertical in a row", ({ Separator }) => (
    <div style={{ display: "flex", blockSize: 48, gap: 8 }}>
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  )),
  make("horizontal in a block", ({ Separator }) => (
    <div>
      <Separator />
    </div>
  )),
  make("horizontal in a grid", ({ Separator }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <Separator />
      <Separator />
    </div>
  )),
  make("vertical in a grid", ({ Separator }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", blockSize: 40 }}>
      <span>a</span>
      <Separator orientation="vertical" />
      <span>b</span>
    </div>
  )),
  make("vertical as a flex item with a margin", ({ Separator }) => (
    <div style={{ display: "flex", blockSize: 40 }}>
      <Separator orientation="vertical" style={{ marginInline: 12 }} />
    </div>
  )),
];

const keys: Case[] = [
  make("one key", ({ Kbd }) => <Kbd>K</Kbd>),
  make("a shortcut", ({ Kbd }) => <Kbd>⌘K</Kbd>),
  make("two keys side by side", ({ Kbd }) => (
    <span>
      <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
    </span>
  )),
  make("in a sentence", ({ Kbd }) => (
    <p style={{ fontSize: 20 }}>
      Press <Kbd>Esc</Kbd> to close
    </p>
  )),
  make("in a small control", ({ Kbd }) => (
    <button type="button" style={{ fontSize: 13 }}>
      Search <Kbd>/</Kbd>
    </button>
  )),
  make("rendered as a span", ({ Kbd }) => <Kbd render={<span />}>Tab</Kbd>),
  make("wide text", ({ Kbd }) => <Kbd>Page Down</Kbd>),
  make("empty", ({ Kbd }) => <Kbd />),
  make("in bold text", ({ Kbd }) => (
    <strong style={{ fontWeight: 700, fontStyle: "italic" }}>
      <Kbd>Shift</Kbd>
    </strong>
  )),
];

describe("Separator in Tailwind CSS v4 against separator.css", () => {
  test("matches in the light theme", async () => {
    await tw.parity(separators);
  });

  test("and in the dark theme", async () => {
    await tw.parity(separators, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(separators, { dir: "rtl" });
  });

  test("and in forced colors, where the border is what stays visible", async () => {
    await setMedia("forced-colors");
    await tw.parity(separators);
  });

  test("and with reduced motion or more contrast, which it has no rules for", async () => {
    await setMedia("reduced-motion");
    await setMedia("more-contrast");
    await tw.parity(separators);
  });

  test("has no transitions or animations", async () => {
    await tw.motion(separators);
  });
});

describe("Kbd in Tailwind CSS v4 against kbd.css", () => {
  test("matches in the light theme", async () => {
    await tw.parity(keys);
  });

  test("and in the dark theme", async () => {
    await tw.parity(keys, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(keys, { dir: "rtl" });
  });

  test("and in forced colors, where the transparent outline is the edge", async () => {
    await setMedia("forced-colors");
    await tw.parity(keys);
  });

  test("and with reduced motion and more contrast", async () => {
    await setMedia("reduced-motion");
    await setMedia("more-contrast");
    await tw.parity(keys);
  });

  test("has no transitions or animations", async () => {
    await tw.motion(keys);
  });
});

describe("className on Separator and Kbd in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on every part", async () => {
    tw.load();
    const screen = await render(
      <>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <TwSeparator className={SEPARATOR_OVERRIDES} />
        </div>
        <TwKbd className={KBD_OVERRIDES}>K</TwKbd>
      </>,
    );
    const line = screen.container.querySelector('[role="separator"]');
    const key = screen.container.querySelector("kbd");
    if (!line || !key) throw new Error("not rendered");
    expectStyles(line, { borderTopColor: "rgba(0, 0, 0, 0)", borderTopStyle: "dashed" });
    expectStyles(key, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      minWidth: "0px",
      columnGap: "0px",
      outlineColor: "oklch(0.637 0.237 25.331)",
      outlineWidth: "2px",
      whiteSpace: "normal",
    });
    expect(key.className).not.toContain("px-[0.4em]");
  });

  test("a user's utility with the variant of the component's wins on its orientation", async () => {
    tw.load();
    const screen = await render(
      <div style={{ display: "flex", flexDirection: "column" }}>
        <TwSeparator className="data-[orientation=horizontal]:border-t-4" />
      </div>,
    );
    const line = screen.container.querySelector('[role="separator"]');
    if (!line) throw new Error("not rendered");
    expectStyles(line, { borderTopWidth: "4px" });
  });

  test("a merged class string drops what the user replaces", () => {
    const merged = cn(separatorSlots.root, "border-red-500");
    expect(merged).toContain("border-red-500");
    expect(merged).not.toContain("border-(color:--ow-line)");
  });
});
