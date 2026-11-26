import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Drawer as CssDrawer } from "../src/components/drawer/index";
import { drawerSlots } from "../src/tailwind/drawer/drawer-variants";
import { Drawer as TwDrawer } from "../src/tailwind/drawer/index";
import { cn } from "../src/tailwind/lib/cn";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Drawer in Tailwind CSS v4 (src/tailwind/drawer) against drawer.css. The popup renders in a
// portal; here the portal's container is the side itself, so its parts are compared like any other.
// A drawer is fixed to the page; a transformed box around it holds it, so each side has its own.

type Direction = "up" | "down" | "left" | "right";
const DIRECTIONS: Direction[] = ["down", "up", "left", "right"];

// What sets a property for one side is overridden by the same variant, as for any state.
const SIDE = "data-[swipe-direction=down]";
const OVERRIDES = `${SIDE}:rounded-none ${SIDE}:pt-8 ${SIDE}:pb-8 ${SIDE}:w-96 ${SIDE}:max-w-none bg-red-500 p-8 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100`;

const candidates = classNames(
  ...Object.values(drawerSlots),
  OVERRIDES,
  "m-8 font-bold shadow-none overflow-y-scroll max-w-none h-64",
  "data-starting-style:bg-green-500 focus-visible:outline-red-500 data-nested-drawer-open:opacity-50",
);
const tw = tailwindParity(candidates);
// A popup in a state is measured while it moves, so its box says nothing; the motion test reads
// the transitions.
const twMotion = tailwindParity(candidates, [
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the drawer's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "maxWidth",
  "maxHeight",
  "overflowY",
  "overscrollBehaviorY",
  "scrollbarWidth",
  "scrollbarColor",
  "transformOrigin",
  "userSelect",
  "paddingBlockStart",
  "paddingBlockEnd",
];
const pseudo = [...PSEUDO, "marginLeft", "marginRight", "inset"];

interface Kit {
  Drawer: typeof CssDrawer;
}
const css: Kit = { Drawer: CssDrawer };
const twind: Kit = { Drawer: TwDrawer };

interface DrawerProps {
  kit: Kit;
  dir?: "ltr" | "rtl";
  direction?: Direction;
  content?: boolean;
  title?: boolean;
  description?: boolean;
  /** Content after the description, so the description is not the last child. */
  after?: boolean;
  explicitBackdrop?: boolean;
  noBackdrop?: boolean;
  kept?: boolean;
  swipeArea?: boolean;
  popupClassName?: string;
}

/** An open drawer whose portal is the box around it, so each side owns its parts. */
function Drw({
  kit,
  dir = "ltr",
  direction = "down",
  content,
  title = true,
  description = true,
  after = true,
  explicitBackdrop,
  noBackdrop,
  kept,
  swipeArea,
  popupClassName,
}: DrawerProps): ReactElement {
  const { Drawer } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ blockSize: 420, transform: "translateZ(0)" }}>
        {host ? (
          <Drawer.Root open={!kept} swipeDirection={direction}>
            {swipeArea ? <Drawer.SwipeArea /> : null}
            <Drawer.Portal
              container={host}
              keepMounted={kept}
              {...(noBackdrop ? { backdrop: false } : {})}
            >
              {explicitBackdrop ? <Drawer.Backdrop /> : null}
              <Drawer.Popup initialFocus={false} className={popupClassName}>
                {title ? <Drawer.Title>Share the draft</Drawer.Title> : null}
                {description ? (
                  <Drawer.Description>Anyone with the link can read it.</Drawer.Description>
                ) : null}
                {content ? (
                  <Drawer.Content>
                    <div style={{ blockSize: 1600 }}>Tall</div>
                  </Drawer.Content>
                ) : null}
                {after ? <input aria-label="Link" defaultValue="owsem.dev/d/42" /> : null}
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

/** The page that recedes, with the layer behind it. */
function Page({ kit }: { kit: Kit }): ReactElement {
  const { Drawer } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setHost} style={{ blockSize: 200, transform: "translateZ(0)" }}>
      {host ? (
        <Drawer.Provider>
          <Drawer.IndentBackground />
          <Drawer.Indent>Page</Drawer.Indent>
        </Drawer.Provider>
      ) : null}
    </div>
  );
}

const make = (name: string, drawer: Omit<DrawerProps, "kit">): Case => ({
  name,
  css: <Drw kit={css} {...drawer} />,
  tw: <Drw kit={twind} {...drawer} />,
});

const each = (name: string, drawer: Omit<DrawerProps, "kit"> = {}): Case[] =>
  DIRECTIONS.map((direction) => make(`${name} ${direction}`, { ...drawer, direction }));

const cases: Case[] = [
  ...each("plain"),
  ...each("with content", { content: true }),
  ...each("starting"),
  ...each("ending"),
  ...each("swiping"),
  ...each("nested once"),
  make("nested twice down", { direction: "down" }),
  make("nested and starting down", { direction: "down" }),
  make("snapped down", { direction: "down" }),
  make("snapped up", { direction: "up" }),
  make("title only", { description: false, after: false }),
  make("title and a field", { description: false }),
  make("description only", { title: false }),
  make("description last", { after: false }),
  make("bare", { title: false, description: false, after: false }),
  make("an explicit backdrop", { explicitBackdrop: true }),
  make("no backdrop", { noBackdrop: true }),
  make("kept mounted", { kept: true }),
  ...each("swipe area", { swipeArea: true }),
  {
    name: "indent idle",
    css: <Page kit={css} />,
    tw: <Page kit={twind} />,
  },
  {
    name: "indent active",
    css: <Page kit={css} />,
    tw: <Page kit={twind} />,
  },
];

// The states Base UI sets, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  if (name.startsWith("indent")) {
    const indent = side.querySelector("[data-slot=drawer-indent]");
    expect(indent).not.toBeNull();
    if (name === "indent active") indent?.setAttribute("data-active", "");
    await frame();
    return;
  }
  const popup = () => side.querySelector<HTMLElement>("[data-slot=drawer-popup]");
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  const el = popup();
  const direction = (el?.getAttribute("data-swipe-direction") ?? "down") as Direction;
  const parts = [el, ...side.querySelectorAll("[data-slot=drawer-backdrop]")];
  for (const part of parts) {
    if (name.includes("starting")) part?.setAttribute("data-starting-style", "");
    if (name.includes("ending")) part?.setAttribute("data-ending-style", "");
    if (name.startsWith("swiping")) part?.setAttribute("data-swiping", "");
  }
  if (name.startsWith("swiping")) {
    const axis = direction === "left" || direction === "right" ? "x" : "y";
    el?.style.setProperty(`--drawer-swipe-movement-${axis}`, "30px");
    for (const scrim of side.querySelectorAll<HTMLElement>("[data-slot=drawer-backdrop]")) {
      scrim.style.setProperty("--drawer-swipe-progress", "0.3");
    }
  }
  if (name.startsWith("snapped")) el?.style.setProperty("--drawer-snap-point-offset", "120px");
  if (name.startsWith("nested")) {
    el?.setAttribute("data-nested-drawer-open", "");
    el?.style.setProperty("--nested-drawers", name === "nested twice down" ? "2" : "1");
  }
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
};

const run = { props, pseudo, prepare: mark };

describe("Drawer in Tailwind CSS v4 against drawer.css", () => {
  test("every part and layout matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline and the grabber are drawn", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, run);
  });

  test("more contrast: a ring around the popup", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, run);
  });

  test("more contrast in the dark theme", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("reduced motion: it fades, without sliding, stepping back, or receding", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("reduced motion: the transitions stay, as the fade", async () => {
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("transitions are the same: 400 ms in, 300 ms out, on the Core drawer curve", async () => {
    await twMotion.motion(cases, { prepare: mark });
  });
});

describe("drawers nested in Tailwind CSS v4", () => {
  /** A drawer with two more nested in it, all open; the parts' transforms once they settle. */
  async function stack(kit: Kit): Promise<Record<string, string>> {
    const { Drawer } = kit;
    const screen = await render(
      <Drawer.Root defaultOpen>
        <Drawer.Portal>
          <Drawer.Popup data-testid="parent">
            <Drawer.Title>Share the draft</Drawer.Title>
            <Drawer.Root defaultOpen>
              <Drawer.Portal>
                <Drawer.Popup data-testid="child">
                  <Drawer.Title>Remove the link?</Drawer.Title>
                  <Drawer.Root defaultOpen>
                    <Drawer.Portal>
                      <Drawer.Popup data-testid="grandchild">
                        <Drawer.Title>Really?</Drawer.Title>
                      </Drawer.Popup>
                    </Drawer.Portal>
                  </Drawer.Root>
                </Drawer.Popup>
              </Drawer.Portal>
            </Drawer.Root>
          </Drawer.Popup>
        </Drawer.Portal>
      </Drawer.Root>,
    );
    const byId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
    await expect.poll(() => byId("grandchild")).not.toBeNull();
    const ids = ["parent", "child", "grandchild"];
    // The transitions end by themselves.
    await expect
      .poll(() => document.getAnimations().filter((a) => a instanceof CSSTransition).length, {
        timeout: 3000,
      })
      .toBe(0);
    const seen = Object.fromEntries(
      ids.flatMap((id) => {
        const el = byId(id) as HTMLElement;
        const style = getComputedStyle(el);
        return [
          [`${id} transform`, style.transform],
          [`${id} opacity`, style.opacity],
          [`${id} nested`, el.style.getPropertyValue("--nested-drawers")],
        ];
      }),
    );
    await screen.unmount();
    return seen;
  }

  test("each steps back for each drawer open above it", async () => {
    tw.load();
    const a = await stack(css);
    const b = await stack(twind);
    expect(b).toEqual(a);
    expect(a["parent nested"]).toBe("2");
    expect(a["parent transform"]).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
  });

  test("reduced motion: nobody steps back", async () => {
    await setMedia("reduced-motion");
    tw.load();
    const a = await stack(css);
    const b = await stack(twind);
    expect(b).toEqual(a);
    expect(b["parent transform"]).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });
});

describe("a drawer in Tailwind CSS v4 opens, swipes, and closes", () => {
  test("a press opens the popup in the portal, and it ends fully shown", async () => {
    tw.load();
    const screen = await render(
      <TwDrawer.Root>
        <TwDrawer.Trigger>Open</TwDrawer.Trigger>
        <TwDrawer.Portal>
          <TwDrawer.Popup>
            <TwDrawer.Title>Share the draft</TwDrawer.Title>
          </TwDrawer.Popup>
        </TwDrawer.Portal>
      </TwDrawer.Root>,
    );
    await userEvent.click(screen.getByRole("button").element());
    await expect.poll(() => document.querySelector("[data-slot=drawer-popup]")).not.toBeNull();
    const popup = document.querySelector("[data-slot=drawer-popup]") as HTMLElement;
    await expect.poll(() => getComputedStyle(popup).transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expectStyles(popup, { transitionDuration: "0.4s" });
    expect(popup.getAttribute("dir")).toBe("ltr");
    expect(popup.parentElement?.getAttribute("data-slot")).toBe("drawer-viewport");
  });

  test("the swipe variables move it, as in the CSS flavor", async () => {
    tw.load();
    const moved = async (kit: Kit) => {
      const { Drawer } = kit;
      const screen = await render(
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Popup>
              <Drawer.Title>Share the draft</Drawer.Title>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>,
      );
      await expect.poll(() => document.querySelector("[data-slot=drawer-popup]")).not.toBeNull();
      const popup = document.querySelector("[data-slot=drawer-popup]") as HTMLElement;
      await expect
        .poll(() => popup.hasAttribute("data-starting-style"), { timeout: 3000 })
        .toBe(false);
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
      popup.style.setProperty("--drawer-swipe-movement-y", "44px");
      popup.style.setProperty("--drawer-snap-point-offset", "10px");
      getComputedStyle(popup).transform;
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
      const transform = getComputedStyle(popup).transform;
      await screen.unmount();
      return transform;
    };
    const a = await moved(css);
    const b = await moved(twind);
    expect(b).toBe(a);
    expect(a).toBe("matrix(1, 0, 0, 1, 0, 54)");
  });
});

describe("className on Drawer in Tailwind CSS v4", () => {
  const popupOf = async (popupClassName: string) => {
    tw.load();
    const screen = await render(<Drw kit={twind} popupClassName={popupClassName} />);
    await expect
      .poll(() => screen.container.querySelector("[data-slot=drawer-popup]"))
      .not.toBeNull();
    const popup = screen.container.querySelector("[data-slot=drawer-popup]");
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
      width: "384px",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    const popup = await popupOf("data-starting-style:bg-green-500");
    popup.setAttribute("data-starting-style", "");
    expectStyles(popup, { backgroundColor: "oklch(0.723 0.219 149.579)" });
  });

  test("the slots merge with a className, the user's last", () => {
    const merged = cn(drawerSlots.popup, `${SIDE}:w-96 p-8 overflow-y-scroll`);
    expect(merged).toContain(`${SIDE}:w-96`);
    expect(merged).not.toContain(`${SIDE}:w-full`);
    expect(merged).not.toContain("p-(--_p)");
    expect(merged).not.toContain(" overflow-y-auto");
    expect(cn(drawerSlots.title, "font-bold")).not.toContain("font-semibold");
  });
});
