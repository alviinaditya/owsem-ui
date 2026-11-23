import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Kbd as CssKbd } from "../src/components/kbd/kbd";
import { Tooltip as CssTooltip } from "../src/components/tooltip/index";
import { Kbd as TwKbd } from "../src/tailwind/kbd/kbd";
import { kbdSlots } from "../src/tailwind/kbd/kbd-variants";
import { cn } from "../src/tailwind/lib/cn";
import { Tooltip as TwTooltip } from "../src/tailwind/tooltip/index";
import { tooltipSlots } from "../src/tailwind/tooltip/tooltip-variants";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  setMedia,
  tailwindParity,
} from "./parity";

// Tooltip in Tailwind CSS v4 (src/tailwind/tooltip) against tooltip.css. The popup renders in a
// portal; here the portal's container is the side itself, so its parts are compared like any other.

const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 text-red-500 text-sm font-bold opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100";

const tw = tailwindParity(
  classNames(
    ...Object.values(tooltipSlots),
    ...Object.values(kbdSlots),
    OVERRIDES,
    "bg-red-500 data-starting-style:bg-green-500 group-[[dir=rtl]]/ow-tooltip:data-[side=inline-end]:opacity-50",
  ),
);

// What the tooltip's own parts draw that PROPS leaves out.
const props = [...PROPS, "clipPath", "forcedColorAdjust", "overflowWrap"];

type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";

interface Kit {
  Tooltip: typeof CssTooltip;
  Kbd: typeof CssKbd;
}
const css: Kit = { Tooltip: CssTooltip, Kbd: CssKbd };
const twind: Kit = { Tooltip: TwTooltip, Kbd: TwKbd };

interface TipProps {
  kit: Kit;
  side?: Side;
  dir?: "ltr" | "rtl";
  arrow?: boolean;
  text?: string;
  shortcut?: "kbd" | "Kbd" | "text after";
  popupClassName?: string;
  /** Pins --available-width, which Base UI sets from the room around the trigger. */
  room?: string;
}

/** An open tooltip whose portal is the box around it, so each side owns its popup. */
function Tip({
  kit,
  side = "top",
  dir = "ltr",
  arrow = true,
  text = "Bold",
  shortcut,
  popupClassName,
  room,
}: TipProps): ReactElement {
  const { Tooltip, Kbd } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div
        ref={setHost}
        style={{ position: "relative", blockSize: 130, display: "grid", placeItems: "center" }}
      >
        {host ? (
          <Tooltip.Root open>
            <Tooltip.Trigger render={<button type="button">Trigger</button>} />
            <Tooltip.Portal container={host}>
              <Tooltip.Positioner side={side}>
                <Tooltip.Popup
                  className={popupClassName}
                  style={room ? ({ "--available-width": room } as never) : undefined}
                >
                  {arrow ? <Tooltip.Arrow /> : null}
                  {text}
                  {shortcut === "kbd" ? <kbd>⌘B</kbd> : null}
                  {shortcut === "Kbd" ? <Kbd>⌘B</Kbd> : null}
                  {shortcut === "text after" ? (
                    <>
                      <kbd>⌘B</kbd> then more
                    </>
                  ) : null}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, tip: Omit<TipProps, "kit">): Case => ({
  name,
  css: <Tip kit={css} {...tip} />,
  tw: <Tip kit={twind} {...tip} />,
});

const SIDES: Side[] = ["top", "bottom", "left", "right", "inline-start", "inline-end"];
const LONG = "A tooltip with a label long enough that it has to wrap onto more than one line, ok";

const cases: Case[] = [
  ...SIDES.map((side) => make(side, { side })),
  ...SIDES.map((side) => make(`${side} in rtl`, { side, dir: "rtl" })),
  make("no arrow", { arrow: false }),
  make("a shortcut", { shortcut: "kbd" }),
  make("a Kbd shortcut", { shortcut: "Kbd" }),
  make("a shortcut that is not last", { shortcut: "text after" }),
  make("a long label", { text: LONG }),
  make("narrow room", { text: LONG, room: "150px" }),
  make("wide room", { text: LONG, room: "900px" }),
  make("starting", {}),
  make("ending", {}),
  make("instant", {}),
  make("ending and instant", {}),
  make("starting in rtl", { side: "inline-end", dir: "rtl" }),
];

// The states Base UI sets on the popup, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const popup = () => side.querySelector("[data-slot=tooltip-popup]");
  // Floating UI places the popup after it mounts, and many open at once here.
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  const el = popup();
  if (name.startsWith("starting")) el?.setAttribute("data-starting-style", "");
  if (name.startsWith("ending")) el?.setAttribute("data-ending-style", "");
  // Base UI opens a tooltip that is controlled by `open` without a delay, so it marks it instant.
  if (name.endsWith("instant")) el?.setAttribute("data-instant", "");
  else el?.removeAttribute("data-instant");
  // The popup must stay: it would unmount if Base UI took the state for a close.
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
};

describe("Tooltip in Tailwind CSS v4 against tooltip.css", () => {
  test("every side, arrow, and shortcut matches in the light theme", async () => {
    await tw.parity(cases, { props, prepare: mark });
  });

  test("the popup is as wide as the room allows, up to 20rem", async () => {
    await tw.parity(cases, {
      names: ["narrow room", "wide room", "a long label"],
      props: [...props, "maxWidth"],
      prepare: mark,
    });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props, prepare: mark });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl", props, prepare: mark });
  });

  test("forced colors match: the arrow is CanvasText", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("more contrast changes nothing", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props, prepare: mark });
  });

  test("reduced motion: no transition at all", async () => {
    await setMedia("reduced-motion");
    await tw.motion(cases, { prepare: mark });
  });

  test("transitions are the same: 125 ms in, 100 ms out, none when instant", async () => {
    await tw.motion(cases, { prepare: mark });
  });
});

describe("a tooltip in Tailwind CSS v4 opens and closes", () => {
  test("hover opens the popup in the portal, and it ends fully shown", async () => {
    tw.load();
    const screen = await render(
      <TwTooltip.Root>
        <TwTooltip.Trigger delay={0} render={<button type="button">Trigger</button>} />
        <TwTooltip.Portal>
          <TwTooltip.Positioner>
            <TwTooltip.Popup>
              <TwTooltip.Arrow />
              Bold
            </TwTooltip.Popup>
          </TwTooltip.Positioner>
        </TwTooltip.Portal>
      </TwTooltip.Root>,
    );
    await userEvent.hover(screen.getByRole("button").element());
    await expect.poll(() => document.querySelector("[data-slot=tooltip-popup]")).not.toBeNull();
    const popup = document.querySelector("[data-slot=tooltip-popup]") as HTMLElement;
    await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
    expectStyles(popup, { transform: "none", transitionDuration: "0.125s" });
    expect(document.querySelector("[data-slot=tooltip-positioner]")?.getAttribute("dir")).toBe(
      "ltr",
    );
  });
});

describe("className on Tooltip in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(<Tip kit={twind} popupClassName={OVERRIDES} />);
    await expect
      .poll(() => screen.container.querySelector("[data-slot=tooltip-popup]"))
      .not.toBeNull();
    const popup = screen.container.querySelector("[data-slot=tooltip-popup]");
    if (!popup) throw new Error("not rendered");
    expectStyles(popup, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "4px",
      fontWeight: "700",
      fontSize: "14px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <Tip kit={twind} popupClassName="data-starting-style:bg-green-500" />,
    );
    await expect
      .poll(() => screen.container.querySelector("[data-slot=tooltip-popup]"))
      .not.toBeNull();
    const popup = screen.container.querySelector("[data-slot=tooltip-popup]");
    if (!popup) throw new Error("not rendered");
    popup.setAttribute("data-starting-style", "");
    expectStyles(popup, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(tooltipSlots.popup, "rounded-none px-8 text-lg");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("rounded-(--_radius)");
    expect(merged).not.toContain("px-(--_px)");
    expect(merged).not.toContain("text-[0.8125rem]");
  });
});
