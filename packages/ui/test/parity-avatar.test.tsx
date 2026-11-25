import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Avatar as CssAvatar } from "../src/components/avatar/index";
import {
  type AvatarSize,
  avatarSlots,
  avatarVariants,
} from "../src/tailwind/avatar/avatar-variants";
import { Avatar as TwAvatar } from "../src/tailwind/avatar/index";
import { cn } from "../src/tailwind/lib/cn";
import { type Case, classNames, expectStyles, PROPS, setMedia, tailwindParity } from "./parity";

// Avatar in Tailwind CSS v4 (src/tailwind/avatar) against avatar.css.

const SIZES: AvatarSize[] = ["sm", "md", "lg"];
const OVERRIDES =
  "rounded-none bg-red-500 text-sm size-20 outline-red-500 focus-visible:outline-red-500";

const tw = tailwindParity(
  classNames(
    ...Object.values(avatarSlots),
    ...SIZES.map((size) => avatarVariants({ size })),
    OVERRIDES,
    "opacity-100 transition-none",
  ),
);

// What an avatar draws that PROPS leaves out: the cut, the picture's fit, and the digits.
const props = [
  ...PROPS,
  "maskImage",
  "maskComposite",
  "objectFit",
  "fontVariantNumeric",
  "userSelect",
  "outlineStyle",
  "marginInlineStart",
];

type Kit = typeof CssAvatar;
const make = (name: string, ui: (Avatar: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssAvatar),
  tw: ui(TwAvatar),
});

/** A 4 × 4 picture, inline. */
const PICTURE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%232563eb'/%3E%3C/svg%3E";

const User = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0z" />
  </svg>
);

const cases: Case[] = [
  ...SIZES.map((size) =>
    make(size, (Avatar) => (
      <Avatar.Root size={size}>
        <Avatar.Fallback>AR</Avatar.Fallback>
      </Avatar.Root>
    )),
  ),
  make("default", (Avatar) => (
    <Avatar.Root>
      <Avatar.Fallback>MW</Avatar.Fallback>
    </Avatar.Root>
  )),
  make("an icon", (Avatar) => (
    <Avatar.Root size="lg">
      <Avatar.Fallback>
        <User />
      </Avatar.Fallback>
    </Avatar.Root>
  )),
  make("a count", (Avatar) => (
    <Avatar.Root size="sm">
      <Avatar.Fallback>+3</Avatar.Fallback>
    </Avatar.Root>
  )),
  make("a link", (Avatar) => (
    <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
      <Avatar.Fallback>A</Avatar.Fallback>
    </Avatar.Root>
  )),
  make("a button", (Avatar) => (
    <Avatar.Root render={<button type="button" aria-label="Ana" />}>
      <Avatar.Fallback>A</Avatar.Fallback>
    </Avatar.Root>
  )),
  make("in a larger font", (Avatar) => (
    <div style={{ fontSize: 24 }}>
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
    </div>
  )),
  ...SIZES.map((size) =>
    make(`a ${size} group`, (Avatar) => (
      <Avatar.Group size={size} aria-label="Team">
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>+3</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>
    )),
  ),
  make("a group with an avatar of its own size", (Avatar) => (
    <Avatar.Group size="lg" aria-label="Team">
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root size="sm">
        <Avatar.Fallback>B</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>C</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  )),
  make("a group of links", (Avatar) => (
    <Avatar.Group aria-label="Team">
      <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root render={<a href="/budi" aria-label="Budi" />}>
        <Avatar.Fallback>B</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root render={<a href="/cici" aria-label="Cici" />}>
        <Avatar.Fallback>C</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  )),
  make("a group of buttons", (Avatar) => (
    <Avatar.Group aria-label="Team">
      <Avatar.Root render={<button type="button" aria-label="Ana" />}>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root render={<button type="button" aria-label="Budi" />}>
        <Avatar.Fallback>B</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root render={<button type="button" aria-label="Cici" />}>
        <Avatar.Fallback>C</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  )),
  make("a group of four buttons", (Avatar) => (
    <Avatar.Group aria-label="Team">
      {["Ana", "Budi", "Cici", "Dewi"].map((name) => (
        <Avatar.Root key={name} render={<button type="button" aria-label={name} />}>
          <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
        </Avatar.Root>
      ))}
    </Avatar.Group>
  )),
  make("a group of spans", (Avatar) => (
    <Avatar.Group aria-label="Team">
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>B</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  )),
  make("a group of one", (Avatar) => (
    <Avatar.Group aria-label="Team">
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>
  )),
];

const root = { target: "[data-slot=avatar]", props };
const first = { target: "a", props };

describe("Avatar in Tailwind CSS v4 against avatar.css", () => {
  test("every size, fallback, and group matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where a group overlaps and cuts the other way", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("the picture covers the circle, in both", async () => {
    const pictured = [
      make("a picture", (Avatar) => (
        <Avatar.Root>
          <Avatar.Image src={PICTURE} alt="Ana" />
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
      )),
    ];
    await tw.parity(pictured, {
      props,
      prepare: async (side) => {
        await expect.poll(() => side.querySelector("img")).not.toBeNull();
      },
    });
  });

  test("keyboard focus draws the ring, and in a group shows it whole", async () => {
    await tw.states(cases, "a link", "focus", root);
    await tw.states(cases, "a group of links", "focus", first);
  });

  test("a hovered button in a group shows whole and cuts the next; a span does not react", async () => {
    const four = "a group of four buttons";
    const nth = (n: number) => ({ target: `[data-slot=avatar]:nth-child(${n})`, props });
    await tw.states(cases, four, "hover", nth(1));
    await tw.states(cases, four, "hover", nth(2));
    await tw.states(cases, four, "hover", nth(3));
    await tw.states(cases, four, "hover", nth(4));
    await tw.states(cases, "a group of buttons", "hover", { target: "button", props });
    await tw.states(cases, "a group of spans", "hover", { target: "[data-slot=avatar]", props });
  });

  test("keyboard focus on the first, a middle, and the last avatar does the same", async () => {
    const four = "a group of four buttons";
    for (const n of [1, 2, 4]) {
      await tw.states(cases, four, "focus", {
        target: `[data-slot=avatar]:nth-child(${n})`,
        props,
      });
    }
  });

  test("an open tooltip does not change a button's cut", async () => {
    const open = [
      make("open", (Avatar) => (
        <Avatar.Group aria-label="Team">
          <Avatar.Root render={<button type="button" data-popup-open="" aria-label="Ana" />}>
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback>B</Avatar.Fallback>
          </Avatar.Root>
        </Avatar.Group>
      )),
    ];
    await tw.parity(open, { props });
  });

  test("in a right-to-left page the cut before an avatar in front mirrors", async () => {
    const four = "a group of four buttons";
    await tw.states(cases, four, "hover", {
      dir: "rtl",
      target: "[data-slot=avatar]:nth-child(2)",
      props,
    });
    await tw.states(cases, four, "focus", {
      dir: "rtl",
      target: "[data-slot=avatar]:nth-child(2)",
      props,
    });
  });

  test("forced colors match: the edge shows, the ring is Highlight", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
    await tw.states(cases, "a link", "focus", root);
    await tw.states(cases, "a group of four buttons", "hover", {
      target: "[data-slot=avatar]:nth-child(2)",
      props,
    });
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
  });

  test("more contrast brings the edge back, and the ring keeps its color", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
    await tw.states(cases, "a link", "focus", root);
  });

  test("transitions are the same", async () => {
    await tw.motion(cases);
  });
});

describe("className on Avatar in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwAvatar.Root className={OVERRIDES}>
        <TwAvatar.Fallback>A</TwAvatar.Fallback>
      </TwAvatar.Root>,
    );
    const avatar = screen.container.querySelector("[data-slot=avatar]");
    if (!avatar) throw new Error("not rendered");
    expectStyles(avatar, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      width: "80px",
      height: "80px",
      fontSize: "14px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("avatarVariants() output merges with a className, the user's last", () => {
    const merged = cn(avatarVariants({ size: "sm" }), "rounded-none size-20 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("size-20");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-[50%]");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("size-(--_size)");
  });
});
