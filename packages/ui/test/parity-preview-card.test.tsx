import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { PreviewCard as CssPreviewCard } from "../src/components/preview-card/index";
import { cn } from "../src/tailwind/lib/cn";
import { PreviewCard as TwPreviewCard } from "../src/tailwind/preview-card/index";
import { previewCardSlots } from "../src/tailwind/preview-card/preview-card-variants";
import {
  type Accepted,
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Preview Card in Tailwind CSS v4 (src/tailwind/preview-card) against preview-card.css. The popup renders in a
// portal; here the portal's container is the side itself, so its parts are compared like any other.

const OVERRIDES =
  "rounded-none bg-red-500 p-8 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100";

const FOCUS_GUARDS: Accepted = {
  what: /^box [xy]$/,
  part: / span$/,
  reason: "Base UI's focus guards are fixed with no offsets, so they sit in each side's own box.",
};

const candidates = classNames(
  ...Object.values(previewCardSlots),
  OVERRIDES,
  "m-8 font-bold shadow-none",
  "data-starting-style:bg-green-500 group-[[dir=rtl]]/ow-preview-card:data-[side=inline-end]:opacity-50",
);
const tw = tailwindParity(candidates, [FOCUS_GUARDS]);
// A popup in a state is measured while it moves, so its box says nothing; the motion test reads
// the transitions.
const twMotion = tailwindParity(candidates, [
  FOCUS_GUARDS,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the card's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "clipPath",
  "maxWidth",
  "textDecorationLine",
  "textDecorationColor",
  "textDecorationThickness",
  "textUnderlineOffset",
];
// The arrow's square and its ring: the pseudo element is what draws the edge.
const pseudo = [
  ...PSEUDO,
  "transform",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
  "margin",
];

// Where the popup goes must not depend on where the side sits in the page.
const NO_COLLISION = { side: "none", align: "none", fallbackAxisSide: "none" } as const;

type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";

interface Kit {
  PreviewCard: typeof CssPreviewCard;
}
const css: Kit = { PreviewCard: CssPreviewCard };
const twind: Kit = { PreviewCard: TwPreviewCard };

interface PopProps {
  kit: Kit;
  side?: Side;
  dir?: "ltr" | "rtl";
  arrow?: boolean;
  /** Shut: only the link shows. */
  shut?: boolean;
  popupClassName?: string;
  /** Pins --available-width, which Base UI sets from the room around the trigger. */
  room?: string;
}

/** An open card whose portal is the box around it, so each side owns its popup. */
function Pop({
  kit,
  side = "top",
  dir = "ltr",
  arrow = true,
  shut,
  popupClassName,
  room,
}: PopProps): ReactElement {
  const { PreviewCard } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div
        ref={setHost}
        style={{ position: "relative", blockSize: 230, display: "grid", placeItems: "center" }}
      >
        {host ? (
          <PreviewCard.Root open={!shut}>
            <PreviewCard.Trigger href="/docs">Docs</PreviewCard.Trigger>
            <PreviewCard.Portal container={host}>
              <PreviewCard.Positioner side={side} collisionAvoidance={NO_COLLISION}>
                <PreviewCard.Popup
                  className={popupClassName}
                  style={{ "--available-width": room ?? "420px" } as never}
                >
                  {arrow ? <PreviewCard.Arrow /> : null}
                  <p>
                    A page about the components, with a preview of each one and how to install it.
                  </p>
                </PreviewCard.Popup>
              </PreviewCard.Positioner>
            </PreviewCard.Portal>
          </PreviewCard.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, pop: Omit<PopProps, "kit">): Case => ({
  name,
  css: <Pop kit={css} {...pop} />,
  tw: <Pop kit={twind} {...pop} />,
});

const SIDES: Side[] = ["top", "bottom", "left", "right", "inline-start", "inline-end"];

const cases: Case[] = [
  ...SIDES.map((side) => make(side, { side })),
  ...SIDES.map((side) => make(`${side} in rtl`, { side, dir: "rtl" })),
  make("no arrow", { arrow: false }),
  make("narrow room", { room: "150px" }),
  make("wide room", { room: "900px" }),
  make("shut", { shut: true }),
  make("starting", {}),
  make("ending", {}),
  make("instant", {}),
  make("ending and instant", {}),
  make("starting in rtl", { side: "inline-end", dir: "rtl" }),
];

// The states Base UI sets on the popup, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (name === "shut") return;
  const popup = () => side.querySelector("[data-slot=preview-card-popup]");
  // Floating UI places the popup after it mounts, and many open at once here.
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  const el = popup();
  if (name.startsWith("starting")) el?.setAttribute("data-starting-style", "");
  if (name.startsWith("ending")) el?.setAttribute("data-ending-style", "");
  if (name.endsWith("instant")) el?.setAttribute("data-instant", "");
  else el?.removeAttribute("data-instant");
  // The popup must stay: it would unmount if Base UI took the state for a close.
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
};

const run = { props, pseudo, prepare: mark };

describe("Preview Card in Tailwind CSS v4 against preview-card.css", () => {
  test("every side and the arrow match in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("the popup is as wide as the room allows, and never wider than 20rem", async () => {
    await tw.parity(cases, { ...run, names: ["narrow room", "wide room", "top"] });
  });

  test("the link: hover and keyboard focus match", async () => {
    await tw.states(cases, "shut", "hover", { ...run, target: "a" });
    await tw.states(cases, "shut", "focus", { ...run, target: "a" });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline is drawn and the arrow keeps its ring", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: a ring around the popup and its arrow", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("more contrast in the dark theme", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion: it fades, without growing", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("reduced motion: the transition stays, as the fade", async () => {
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("transitions are the same: 180 ms in, 120 ms out, none when instant", async () => {
    await twMotion.motion(cases, { prepare: mark });
  });
});

describe("a preview card in Tailwind CSS v4 opens and closes", () => {
  test("a press opens the popup in the portal, and it ends fully shown", async () => {
    tw.load();
    const screen = await render(
      <TwPreviewCard.Root>
        <TwPreviewCard.Trigger href="/docs">Docs</TwPreviewCard.Trigger>
        <TwPreviewCard.Portal>
          <TwPreviewCard.Positioner>
            <TwPreviewCard.Popup>
              <TwPreviewCard.Arrow />
              <p>About the docs</p>
            </TwPreviewCard.Popup>
          </TwPreviewCard.Positioner>
        </TwPreviewCard.Portal>
      </TwPreviewCard.Root>,
    );
    await userEvent.hover(screen.getByRole("link").element());
    await expect
      .poll(() => document.querySelector("[data-slot=preview-card-popup]"))
      .not.toBeNull();
    const popup = document.querySelector("[data-slot=preview-card-popup]") as HTMLElement;
    await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
    await expect.poll(() => getComputedStyle(popup).transform).toBe("none");
    expectStyles(popup, { transform: "none", transitionDuration: "0.18s" });
    expect(document.querySelector("[data-slot=preview-card-positioner]")?.getAttribute("dir")).toBe(
      "ltr",
    );
  });
});

describe("className on Preview Card in Tailwind CSS v4", () => {
  const popupOf = async (popupClassName: string) => {
    tw.load();
    const screen = await render(<Pop kit={twind} popupClassName={popupClassName} />);
    await expect
      .poll(() => screen.container.querySelector("[data-slot=preview-card-popup]"))
      .not.toBeNull();
    const popup = screen.container.querySelector("[data-slot=preview-card-popup]");
    if (!popup) throw new Error("not rendered");
    return popup;
  };

  test("a user's utilities beat the component's", async () => {
    const popup = await popupOf(OVERRIDES);
    expectStyles(popup, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      color: "oklch(0.637 0.237 25.331)",
      paddingLeft: "32px",
      paddingTop: "32px",
      fontSize: "14px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    const popup = await popupOf("data-starting-style:bg-green-500");
    popup.setAttribute("data-starting-style", "");
    expectStyles(popup, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(previewCardSlots.popup, "rounded-none p-8 text-lg shadow-none");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("shadow-none");
    expect(merged).not.toContain("rounded-(--ow-radius)");
    expect(merged).not.toContain("p-[16px]");
    expect(merged).not.toContain("shadow-(shadow:--_shadow)");
    expect(merged).not.toContain("text-[0.875rem]");
    expect(cn(previewCardSlots.trigger, "no-underline")).toContain("no-underline");
  });
});
