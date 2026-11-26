import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useEffect, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Toast as CssToast } from "../src/components/toast/index";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { cn } from "../src/tailwind/lib/cn";
import { Toast as TwToast } from "../src/tailwind/toast/index";
import { toastSlots } from "../src/tailwind/toast/toast-variants";
import {
  type Accepted,
  BUTTON_RIPPLE,
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Toast in Tailwind CSS v4 (src/tailwind/toast) against toast.css. The viewport is fixed to the
// window; here a transformed box around it holds it, so each side has its own, and toasts are
// added by a manager, as an app does.

const OVERRIDES =
  "rounded-none bg-red-500 p-8 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100";

const candidates = classNames(
  ...Object.values(toastSlots),
  ...Object.values(buttonSlots),
  buttonVariants({ variant: "secondary", size: "sm" }),
  OVERRIDES,
  "m-8 font-bold shadow-none w-96 max-w-none h-64",
  "data-starting-style:bg-green-500 data-expanded:opacity-50 data-anchored:bg-green-500",
);
// An anchored card's room to the side is Base UI's --available-width, and the two flavors sit at
// different places in the window, so beside the anchor it differs by what is there.
const AVAILABLE: Accepted = {
  what: /^maxWidth$/,
  part: / toast$/,
  reason: "max-width reads --available-width, which is the room from where each side sits.",
};
const SPIN: Accepted = {
  what: /^animationName$/,
  reason: "The spinner's keyframes are ow-toast-spin in toast.css and ow-spin in tailwind.css.",
};
const tw = tailwindParity(candidates, [BUTTON_RIPPLE, AVAILABLE, SPIN]);
// A card in a state is measured while it moves, so its box says nothing; the motion test reads
// the transitions.
const twMotion = tailwindParity(candidates, [
  BUTTON_RIPPLE,
  AVAILABLE,
  SPIN,
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the toast's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maxWidth",
  "maxHeight",
  "transformOrigin",
  "userSelect",
  "overflowWrap",
  "clipPath",
  "insetInlineEnd",
  "animationName",
];
const pseudo = [...PSEUDO, "transform", "outlineStyle", "outlineWidth", "outlineColor", "margin"];

type Kit = { Toast: typeof CssToast };
const css: Kit = { Toast: CssToast };
const twind: Kit = { Toast: TwToast };

type Add = Parameters<ReturnType<typeof CssToast.createToastManager>["add"]>[0];

interface StageProps {
  kit: Kit;
  dir?: "ltr" | "rtl";
  /** The toasts, oldest first. */
  toasts: Add[];
  limit?: number;
  anchored?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  explicit?: boolean;
  rootClassName?: string;
}

/** A transformed box that holds the fixed viewport, and the toasts a manager adds to it. */
function Stage({
  kit,
  dir = "ltr",
  toasts,
  limit,
  anchored,
  explicit,
  rootClassName,
}: StageProps): ReactElement {
  const { Toast } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [manager] = useState(() => Toast.createToastManager());
  useEffect(() => {
    if (!host || (anchored && !anchor)) return;
    for (const toast of toasts) {
      manager.add({
        timeout: 0,
        ...toast,
        ...(anchored ? { positionerProps: { anchor, side: anchored } } : {}),
      });
    }
  }, [host, anchor, anchored, manager, toasts]);
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ blockSize: 280, inlineSize: 336, transform: "translateZ(0)" }}>
        {anchored ? (
          <button
            ref={setAnchor}
            type="button"
            style={{ position: "absolute", insetBlockStart: 120, insetInlineStart: 230 }}
          >
            Copy
          </button>
        ) : null}
        {host ? (
          <Toast.Provider toastManager={manager} {...(limit ? { limit } : {})}>
            <Toast.Portal container={host}>
              <Toast.Viewport>
                <List kit={kit} className={rootClassName} explicit={explicit} />
              </Toast.Viewport>
            </Toast.Portal>
          </Toast.Provider>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

/** The shortest use's list, with a class on every card to test overrides. */
function List({
  kit,
  className,
  explicit,
}: {
  kit: Kit;
  className?: string | undefined;
  explicit?: boolean | undefined;
}): ReactElement {
  const { Toast } = kit;
  const { toasts } = Toast.useToastManager();
  return (
    <>
      {toasts.map((toast) =>
        toast.positionerProps ? (
          <Toast.Positioner key={toast.id} toast={toast}>
            <Toast.Root toast={toast} className={className}>
              <Toast.Arrow />
              <Toast.Content>
                <Toast.Mark />
                <div
                  data-slot="toast-text"
                  className={kit === css ? "ow-toast__text" : toastSlots.text}
                >
                  <Toast.Title />
                  <Toast.Description />
                  <Toast.Action />
                </div>
                <Toast.Close />
              </Toast.Content>
            </Toast.Root>
          </Toast.Positioner>
        ) : (
          <Toast.Root key={toast.id} toast={toast} className={className}>
            {explicit ? (
              <Toast.Content>
                <Toast.Title />
              </Toast.Content>
            ) : undefined}
          </Toast.Root>
        ),
      )}
    </>
  );
}

const sample: Add = { title: "Saved", description: "All changes are in." };
const three: Add[] = [
  { title: "First", description: "The oldest." },
  { title: "Second", description: "In the middle." },
  { title: "Third", description: "The newest." },
];

const make = (name: string, stage: Omit<StageProps, "kit">): Case => ({
  name,
  css: <Stage kit={css} {...stage} />,
  tw: <Stage kit={twind} {...stage} />,
});

const SIDES = ["top", "bottom", "left", "right", "inline-start", "inline-end"] as const;

const cases: Case[] = [
  make("title only", { toasts: [{ title: "Saved" }] }),
  make("title and description", { toasts: [sample] }),
  make("description only", { toasts: [{ description: "All changes are in." }] }),
  make("with an action", { toasts: [{ ...sample, actionProps: { children: "Undo" } }] }),
  make("a long title", {
    toasts: [{ title: "Averyveryverylongword ".repeat(10), description: "Wraps." }],
  }),
  ...(["success", "error", "warning", "info", "loading", "custom"] as const).map((type) =>
    make(`type ${type}`, { toasts: [{ ...sample, type }] }),
  ),
  make("stack of three", { toasts: three }),
  make("stack of three, expanded", { toasts: three }),
  make("stack of three, limited to two", { toasts: three, limit: 2 }),
  make("starting", { toasts: [sample] }),
  make("ending", { toasts: [sample] }),
  make("ending, swiped up", { toasts: [sample] }),
  make("ending, swiped left", { toasts: [sample] }),
  make("ending, swiped right", { toasts: [sample] }),
  make("swiping", { toasts: [sample] }),
  make("explicit children", { toasts: [{ title: "Only a title" }], explicit: true }),
  ...SIDES.map((side) => make(`anchored ${side}`, { toasts: [sample], anchored: side })),
  make("anchored starting", { toasts: [sample], anchored: "top" }),
  make("anchored ending", { toasts: [sample], anchored: "top" }),
];

// The states Base UI sets, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const cards = () => [...side.querySelectorAll<HTMLElement>("[data-slot=toast]")];
  const expected = name === "explicit children" ? 1 : name.startsWith("stack") ? 3 : 1;
  await vi.waitFor(() => expect(cards().length).toBe(expected), { timeout: 5000 });
  await vi.waitFor(
    () => expect(cards().some((c) => c.hasAttribute("data-starting-style"))).toBe(false),
    {
      timeout: 5000,
    },
  );
  if (name.startsWith("anchored")) {
    const positioner = side.querySelector<HTMLElement>("[data-slot=toast-positioner]");
    await vi.waitFor(() => expect(positioner?.style.opacity).not.toBe("0"), { timeout: 5000 });
  }
  const set = (el: Element, attribute: string) => el.setAttribute(attribute, "");
  for (const card of cards()) {
    if (name.includes("starting")) set(card, "data-starting-style");
    if (name.includes("ending")) set(card, "data-ending-style");
    if (name.startsWith("swiping")) set(card, "data-swiping");
  }
  const lead = cards()[0] as HTMLElement;
  const direction = /swiped (\w+)/.exec(name)?.[1];
  if (direction) lead.setAttribute("data-swipe-direction", direction);
  if (name.startsWith("swiping") || direction) {
    lead.style.setProperty("--toast-swipe-movement-x", direction === "left" ? "-30px" : "30px");
    lead.style.setProperty("--toast-swipe-movement-y", direction === "up" ? "-30px" : "30px");
  }
  if (name.includes("expanded")) {
    cards().forEach((card, index) => {
      set(card, "data-expanded");
      for (const content of card.querySelectorAll("[data-slot=toast-content]")) {
        set(content, "data-expanded");
      }
      card.style.setProperty("--toast-height", "70px");
      card.style.setProperty("--toast-offset-y", `${index * 70}px`);
    });
  }
  await frame();
  await frame();
};

const run = { props, pseudo, prepare: mark };

describe("Toast in Tailwind CSS v4 against toast.css", () => {
  test("every part and layout matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline and the marks are drawn", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: a ring around the card", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("more contrast in the dark theme", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion: it fades in place, and the spinner stops", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("reduced motion: the transitions stay, as the fade", async () => {
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("transitions are the same: 400 ms on the Core drawer curve, the spinner turning", async () => {
    await twMotion.motion(cases, { prepare: mark });
  });
});

describe("className on Toast in Tailwind CSS v4", () => {
  const cardOf = async (rootClassName: string) => {
    tw.load();
    const screen = await render(
      <Stage kit={twind} toasts={[sample]} rootClassName={rootClassName} />,
    );
    await expect.poll(() => screen.container.querySelector("[data-slot=toast]")).not.toBeNull();
    const card = screen.container.querySelector("[data-slot=toast]");
    if (!card) throw new Error("not rendered");
    return card;
  };

  test("a user's utilities beat the component's", async () => {
    const card = await cardOf(OVERRIDES);
    expectStyles(card, {
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
    const card = await cardOf("data-starting-style:bg-green-500");
    card.setAttribute("data-starting-style", "");
    expectStyles(card, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(toastSlots.root, "w-96 p-8 rounded-none");
    expect(merged).toContain("w-96");
    expect(merged).not.toContain("w-full");
    expect(merged).not.toContain("py-[12px]");
    expect(cn(toastSlots.title, "font-bold")).not.toContain("font-semibold");
  });
});
