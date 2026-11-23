import type { CSSProperties, ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ScrollArea as CssScrollArea } from "../src/components/scroll-area/index";
import { cn } from "../src/tailwind/lib/cn";
import { ScrollArea as TwScrollArea } from "../src/tailwind/scroll-area/index";
import { scrollAreaSlots } from "../src/tailwind/scroll-area/scroll-area-variants";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  measure,
  type Part,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Scroll Area in Tailwind CSS v4 (src/tailwind/scroll-area) against scroll-area.css: every part,
// its overflow states (the fade, the hover, the scroll), and the keyboard ring.

const OVERRIDES =
  "rounded-none bg-red-500 text-red-500 opacity-100 w-4 h-4 duration-300 ease-linear data-[orientation=vertical]:w-4 data-[orientation=vertical]:my-0 data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:mx-0";

const tw = tailwindParity(
  classNames(
    ...Object.values(scrollAreaSlots),
    OVERRIDES,
    "[--fade-size:3em] data-hovering:opacity-50 forced-colors:bg-red-500",
  ),
);

// What the scroll area's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maskImage",
  "maskComposite",
  "scrollbarWidth",
  "overscrollBehaviorX",
  "overflowX",
  "overflowY",
  "marginInlineEnd",
  "marginInlineStart",
  "maxWidth",
];
// The focus ring on the Root's ::after, and the thumb's press area.
const pseudo = [
  ...PSEUDO,
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
  "insetInlineEnd",
  "borderBottomLeftRadius",
];

interface Kit {
  ScrollArea: typeof CssScrollArea;
}
const css: Kit = { ScrollArea: CssScrollArea };
const twind: Kit = { ScrollArea: TwScrollArea };

interface AreaProps {
  kit: Kit;
  /** The content's size, in px; 0 fits the area. */
  tall?: number;
  wide?: number;
  fade?: boolean;
  /** `--fade-size`, set by the app on the Root. */
  fadeSize?: string;
  /** The Root's own parts, written out. */
  parts?: "viewport only" | "both axes";
  className?: string;
}

function Area({
  kit,
  tall = 600,
  wide = 0,
  fade,
  fadeSize,
  parts,
  className,
}: AreaProps): ReactElement {
  const { ScrollArea } = kit;
  const style: CSSProperties = { inlineSize: 200, blockSize: 120 };
  if (fadeSize) (style as Record<string, string>)["--fade-size"] = fadeSize;
  const content = (
    <div style={{ blockSize: tall || 40, inlineSize: wide || "auto" }}>
      Line one of the content, then more of it.
    </div>
  );
  return (
    <ScrollArea.Root fade={fade ?? false} style={style} className={className}>
      {parts ? (
        <>
          <ScrollArea.Viewport>{content}</ScrollArea.Viewport>
          <ScrollArea.Scrollbar />
          {parts === "both axes" ? <ScrollArea.Scrollbar orientation="horizontal" /> : null}
          {parts === "both axes" ? <ScrollArea.Corner /> : null}
        </>
      ) : (
        content
      )}
    </ScrollArea.Root>
  );
}

const make = (name: string, area: Omit<AreaProps, "kit">): Case => ({
  name,
  css: <Area kit={css} {...area} />,
  tw: <Area kit={twind} {...area} />,
});

const cases: Case[] = [
  make("vertical", {}),
  make("horizontal", { tall: 0, wide: 600 }),
  make("both", { wide: 600 }),
  make("fits", { tall: 0 }),
  make("fade", { fade: true }),
  make("fade both", { fade: true, wide: 600 }),
  make("fade size", { fade: true, fadeSize: "1em", wide: 600 }),
  make("fade, scrolled to the middle", { fade: true, wide: 600 }),
  make("fade, scrolled to the end", { fade: true, wide: 600 }),
  make("scrolled to the middle", { wide: 600 }),
  make("parts written out", { parts: "viewport only" }),
  make("both axes written out", { parts: "both axes", wide: 600, fade: true }),
  make("a user's class", { className: "rounded-none" }),
];

/** Scrolls the viewport as the case's name says, and waits for Base UI to catch up. */
const scroll = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const viewport = side.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
  if (!viewport) return;
  // The start is at the right in right-to-left writing, and scrollLeft counts from there.
  const toward = getComputedStyle(viewport).direction === "rtl" ? -1 : 1;
  if (name.includes("middle")) {
    viewport.scrollTop = 100;
    viewport.scrollLeft = 100 * toward;
  } else if (name.includes("end")) {
    viewport.scrollTop = 1e6;
    viewport.scrollLeft = 1e6 * toward;
  }
  for (let i = 0; i < 4; i++) await frame();
};

/** Scrolls as a wheel does, which Base UI notes as scrolling; it drops that 500 ms later. */
const wheel = async (side: Element) => {
  const viewport = side.querySelector<HTMLElement>("[data-slot=scroll-area-viewport]");
  viewport?.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
  if (viewport) viewport.scrollTop = 50;
  await frame();
};

const run = { props, pseudo, prepare: scroll };

describe("Scroll Area in Tailwind CSS v4 against scroll-area.css", () => {
  test("every part and overflow matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page: the margins and the fade swap", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("and in a right-to-left page, scrolled", async () => {
    await tw.parity(cases, { ...run, dir: "rtl", names: ["fade, scrolled to the end"] });
  });

  test("forced colors match: the thumb is CanvasText", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("the scrollbar fades in 150 ms", async () => {
    await tw.motion(cases, { prepare: scroll });
  });

  test("the scrollbar shows while scrolling, without hover", async () => {
    const one = cases.filter((item) => item.name === "vertical");
    await tw.parity(one, { ...run, prepare: wheel });
  });

  test("the scrollbar draws no native bar in Chromium", async () => {
    tw.load();
    const screen = await render(<Area kit={twind} />);
    const viewport = screen.container.querySelector("[data-slot=scroll-area-viewport]");
    if (!viewport) throw new Error("not rendered");
    expect(getComputedStyle(viewport).scrollbarWidth).toBe("none");
    if (!navigator.userAgent.includes("Firefox")) {
      expect(getComputedStyle(viewport, "::-webkit-scrollbar").display).toBe("none");
    }
  });
});

describe("Scroll Area states, with real input, in Tailwind CSS v4", () => {
  const viewport = { target: "[data-slot=scroll-area-viewport]", props, pseudo };

  test("hover shows the scrollbar", async () => {
    await tw.states(cases, "vertical", "hover", viewport);
  });

  test("hover shows both scrollbars", async () => {
    await tw.states(cases, "both axes written out", "hover", viewport);
  });

  test("hover in a right-to-left page", async () => {
    await tw.states(cases, "both", "hover", { ...viewport, dir: "rtl" });
  });

  test("hover over a faded area", async () => {
    await tw.states(cases, "fade both", "hover", viewport);
  });

  test("a hold on the scrollbar keeps it shown", async () => {
    // The pointer presses the thumb: only :active, with neither state of Base UI's, keeps it shown.
    const screen = await tw.mount(
      cases.filter((one) => one.name === "vertical"),
      viewport,
    );
    const row = screen.container.querySelector('[data-case="vertical"]');
    const taken = [];
    for (const flavor of ["css", "tw"]) {
      const side = row?.querySelector(`[data-side="${flavor}"]`) as Element;
      const area = side.querySelector("[data-slot=scroll-area-viewport]") as Element;
      const bar = side.querySelector("[data-slot=scroll-area-scrollbar]") as HTMLElement;
      await userEvent.hover(area);
      await expect.poll(() => bar.hasAttribute("data-hovering")).toBe(true);
      await userEvent.hover(side.querySelector("[data-slot=scroll-area-thumb]") as Element);
      await commands.mouse("down");
      await frame();
      // The press is Base UI's state too; take them off, so only :active is measured here.
      bar.removeAttribute("data-hovering");
      bar.removeAttribute("data-scrolling");
      await frame();
      expect(bar.matches(":active")).toBe(true);
      expect(bar.hasAttribute("data-hovering"), "hovering").toBe(false);
      expect(bar.hasAttribute("data-scrolling"), "scrolling").toBe(false);
      taken.push(measure(side, props, pseudo));
      await commands.mouse("up");
    }
    const [a, b] = taken;
    tw.expectParts("held", a as Part[], b as Part[]);
    expect(a?.find((part) => part.label.includes("scrollbar"))?.style.opacity).toBe("1");
  });

  test("keyboard focus on the viewport draws the ring on the Root", async () => {
    await tw.states(cases, "vertical", "focus", viewport);
  });

  test("keyboard focus in the dark theme", async () => {
    await tw.states(cases, "fade", "focus", { ...viewport, theme: "dark" });
  });

  test("keyboard focus with forced colors", async () => {
    await setMedia("forced-colors");
    await tw.states(cases, "vertical", "focus", viewport);
  });
});

describe("className on Scroll Area in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <Area kit={twind} className="rounded-none bg-red-500" parts="both axes" wide={600} />,
    );
    const root = screen.container.querySelector("[data-slot=scroll-area]");
    if (!root) throw new Error("not rendered");
    expectStyles(root, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(scrollAreaSlots.scrollbar, "w-4 opacity-100 duration-300");
    expect(merged).toContain("w-4");
    expect(merged).toContain("opacity-100");
    expect(merged).not.toContain(" opacity-0");
    expect(merged).not.toContain("duration-150");
    expect(cn(scrollAreaSlots.thumb, "rounded-none")).not.toContain("rounded-[999px]");
    expect(cn(scrollAreaSlots.root, "rounded-none")).not.toContain("rounded-(--_radius)");
  });

  test("a hovered scrollbar can be restyled with the same state's variant", async () => {
    tw.load();
    const screen = await render(<Area kit={twind} parts="viewport only" />);
    const bar = screen.container.querySelector("[data-slot=scroll-area-scrollbar]");
    expect(bar).not.toBeNull();
    await userEvent.hover(screen.container.querySelector("[data-slot=scroll-area]") as Element);
    await expect.poll(() => bar?.hasAttribute("data-hovering")).toBe(true);
    expectStyles(bar as Element, { pointerEvents: "auto" });
  });
});
