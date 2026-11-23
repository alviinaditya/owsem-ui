import { DirectionProvider } from "@base-ui/react/direction-provider";
import { type ReactElement, type ReactNode, useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Dialog as CssDialog } from "../src/components/dialog/index";
import { dialogSlots } from "../src/tailwind/dialog/dialog-variants";
import { Dialog as TwDialog } from "../src/tailwind/dialog/index";
import { cn } from "../src/tailwind/lib/cn";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  measureFrom,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Dialog in Tailwind CSS v4 (src/tailwind/dialog) against dialog.css. The popup renders in a
// portal; here the portal's container is the side itself, so its parts are compared like any other.
// A dialog is fixed to the page; a transformed box around it holds it, so each side has its own.

const OVERRIDES =
  "rounded-none bg-red-500 p-8 text-red-500 text-sm opacity-100 outline-red-500 duration-300 ease-linear data-ending-style:duration-300 data-starting-style:opacity-100 w-96";

const candidates = classNames(
  ...Object.values(dialogSlots),
  OVERRIDES,
  "m-8 font-bold shadow-none overflow-y-scroll",
  "data-starting-style:bg-green-500 focus-visible:outline-red-500 data-nested-dialog-open:opacity-50",
);
const tw = tailwindParity(candidates);
// A popup in a state is measured while it moves, so its box says nothing; the motion test reads
// the transitions.
const twMotion = tailwindParity(candidates, [
  { what: /^box /, reason: "A transition in progress is measured part way." },
]);

// What the dialog's own parts draw that PROPS leaves out.
const props = [
  ...PROPS,
  "clipPath",
  "maxWidth",
  "maxHeight",
  "overflowY",
  "overscrollBehaviorY",
  "scrollbarWidth",
  "scrollbarColor",
  "marginBlockEnd",
  "insetInlineStart",
  "paddingBlockStart",
];
const pseudo = PSEUDO;

interface Kit {
  Dialog: typeof CssDialog;
}
const css: Kit = { Dialog: CssDialog };
const twind: Kit = { Dialog: TwDialog };

interface DialogProps {
  kit: Kit;
  dir?: "ltr" | "rtl";
  viewport?: boolean;
  tall?: boolean;
  title?: boolean;
  description?: boolean;
  /** Content after the description, so the description is not the last child. */
  after?: boolean;
  explicitBackdrop?: boolean;
  noBackdrop?: boolean;
  kept?: boolean;
  popupClassName?: string;
  children?: ReactNode;
}

/** An open dialog whose portal is the box around it, so each side owns its parts. */
function Dlg({
  kit,
  dir = "ltr",
  viewport,
  tall,
  title = true,
  description = true,
  after = true,
  explicitBackdrop,
  noBackdrop,
  kept,
  popupClassName,
}: DialogProps): ReactElement {
  const { Dialog } = kit;
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const popup = (
    <Dialog.Popup initialFocus={false} className={popupClassName}>
      {title ? <Dialog.Title>Share the draft</Dialog.Title> : null}
      {description ? (
        <Dialog.Description>Anyone with the link can read it.</Dialog.Description>
      ) : null}
      {after ? <input aria-label="Link" defaultValue="owsem.dev/d/42" /> : null}
      {tall ? <div style={{ blockSize: 1600 }}>Tall</div> : null}
    </Dialog.Popup>
  );
  return (
    <DirectionProvider direction={dir}>
      <div ref={setHost} style={{ blockSize: 420, transform: "translateZ(0)" }}>
        {host ? (
          <Dialog.Root open={!kept} modal={false}>
            <Dialog.Portal
              container={host}
              keepMounted={kept}
              {...(noBackdrop ? { backdrop: false } : {})}
            >
              {explicitBackdrop ? <Dialog.Backdrop /> : null}
              {viewport ? <Dialog.Viewport>{popup}</Dialog.Viewport> : popup}
            </Dialog.Portal>
          </Dialog.Root>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

const make = (name: string, dialog: Omit<DialogProps, "kit">): Case => ({
  name,
  css: <Dlg kit={css} {...dialog} />,
  tw: <Dlg kit={twind} {...dialog} />,
});

const cases: Case[] = [
  make("plain", {}),
  make("in rtl", { dir: "rtl" }),
  make("title only", { description: false, after: false }),
  make("title and a field", { description: false }),
  make("description only", { title: false }),
  make("description last", { after: false }),
  make("nothing after the title", { description: false, after: false }),
  make("bare", { title: false, description: false, after: false }),
  make("tall", { tall: true }),
  make("in a viewport", { viewport: true }),
  make("tall in a viewport", { viewport: true, tall: true }),
  make("an explicit backdrop", { explicitBackdrop: true }),
  make("no backdrop", { noBackdrop: true }),
  make("kept mounted in a viewport", { viewport: true, kept: true }),
  make("starting", {}),
  make("ending", {}),
  make("starting in a viewport", { viewport: true }),
  make("nested once", {}),
  make("nested twice", {}),
  make("nested and starting", {}),
  make("nested and ending", {}),
];

// The states Base UI sets, put on by hand: the transitions are frozen.
const mark = async (side: Element) => {
  const name = side.closest("[data-case]")?.getAttribute("data-case") ?? "";
  const popup = () => side.querySelector<HTMLElement>("[data-slot=dialog-popup]");
  await vi.waitFor(() => expect(popup()).not.toBeNull(), { timeout: 5000 });
  const el = popup();
  const parts = [el, ...side.querySelectorAll("[data-slot=dialog-backdrop]")];
  for (const part of parts) {
    if (name.includes("starting")) part?.setAttribute("data-starting-style", "");
    if (name.includes("ending")) part?.setAttribute("data-ending-style", "");
  }
  if (name.startsWith("nested")) {
    el?.setAttribute("data-nested-dialog-open", "");
    el?.style.setProperty("--nested-dialogs", name === "nested twice" ? "2" : "1");
  }
  await frame();
  await frame();
  expect(popup(), name).toBe(el);
};

const run = { props, pseudo, prepare: mark };

describe("Dialog in Tailwind CSS v4 against dialog.css", () => {
  test("every part and layout matches in the light theme", async () => {
    await tw.parity(cases, run);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { ...run, theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { ...run, dir: "rtl" });
  });

  test("forced colors match: the outline is drawn", async () => {
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

  test("reduced motion: it fades, without growing or stepping back", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, run);
  });

  test("reduced motion: the transitions stay, as the fade", async () => {
    await setMedia("reduced-motion");
    await twMotion.motion(cases, { prepare: mark });
  });

  test("transitions are the same: 250 ms in, 200 ms out", async () => {
    await twMotion.motion(cases, { prepare: mark });
  });
});

describe("dialogs nested in Tailwind CSS v4", () => {
  /** A dialog with two more nested in it, all open; the parts' transforms once they settle. */
  async function stack(kit: Kit): Promise<Record<string, string>> {
    const { Dialog } = kit;
    const screen = await render(
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup data-testid="parent">
            <Dialog.Title>Share the draft</Dialog.Title>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup data-testid="child">
                  <Dialog.Title>Remove the link?</Dialog.Title>
                  <Dialog.Root defaultOpen>
                    <Dialog.Portal>
                      <Dialog.Popup data-testid="grandchild">
                        <Dialog.Title>Really?</Dialog.Title>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </Dialog.Root>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
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
          [`${id} nested`, el.style.getPropertyValue("--nested-dialogs")],
        ];
      }),
    );
    await screen.unmount();
    return seen;
  }

  test("each steps back for each dialog open above it", async () => {
    tw.load();
    const a = await stack(css);
    const b = await stack(twind);
    expect(b).toEqual(a);
    expect(a["parent nested"]).toBe("2");
    expect(a["parent transform"]).not.toBe("none");
  });

  test("reduced motion: nobody steps back", async () => {
    await setMedia("reduced-motion");
    tw.load();
    const a = await stack(css);
    const b = await stack(twind);
    expect(b).toEqual(a);
    expect(b["parent transform"]).toBe("none");
  });
});

describe("a dialog in Tailwind CSS v4 opens and closes", () => {
  test("a press opens the popup in the portal, and it ends fully shown", async () => {
    tw.load();
    const screen = await render(
      <TwDialog.Root>
        <TwDialog.Trigger>Open</TwDialog.Trigger>
        <TwDialog.Portal>
          <TwDialog.Popup>
            <TwDialog.Title>Share the draft</TwDialog.Title>
          </TwDialog.Popup>
        </TwDialog.Portal>
      </TwDialog.Root>,
    );
    await userEvent.click(screen.getByRole("button").element());
    await expect.poll(() => document.querySelector("[data-slot=dialog-popup]")).not.toBeNull();
    const popup = document.querySelector("[data-slot=dialog-popup]") as HTMLElement;
    await expect.poll(() => getComputedStyle(popup).opacity).toBe("1");
    await expect.poll(() => getComputedStyle(popup).transform).toBe("none");
    expectStyles(popup, { transform: "none", transitionDuration: "0.25s" });
    expect(popup.getAttribute("dir")).toBe("ltr");
  });
});

describe("the popup's keyboard focus ring in Tailwind CSS v4", () => {
  /** A dialog too tall to show whole: it takes focus itself, and has the ring. */
  async function focused(kit: Kit) {
    const { Dialog } = kit;
    const screen = await render(
      <Dialog.Root defaultOpen modal={false}>
        <Dialog.Portal>
          <Dialog.Popup>
            <Dialog.Title>Share the draft</Dialog.Title>
            <div style={{ blockSize: 1600 }}>Tall</div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await userEvent.keyboard("{Shift}");
    const popup = await vi.waitFor(() => {
      const el = document.querySelector<HTMLElement>("[data-slot=dialog-popup]");
      if (!el) throw new Error("not open");
      return el;
    });
    popup.focus();
    await frame();
    expect(popup.matches(":focus-visible")).toBe(true);
    const parts = measureFrom(popup, popup, props, pseudo);
    await screen.unmount();
    return parts;
  }

  test("a 2px ring 2px outside, as in the CSS flavor", async () => {
    tw.load();
    const a = await focused(css);
    const b = await focused(twind);
    tw.expectParts("focused popup", a, b);
    expect(a[0]?.style.outlineWidth).toBe("2px");
    expect(a[0]?.style.outlineOffset).toBe("2px");
  });
});

describe("className on Dialog in Tailwind CSS v4", () => {
  const popupOf = async (popupClassName: string) => {
    tw.load();
    const screen = await render(<Dlg kit={twind} popupClassName={popupClassName} />);
    await expect
      .poll(() => screen.container.querySelector("[data-slot=dialog-popup]"))
      .not.toBeNull();
    const popup = screen.container.querySelector("[data-slot=dialog-popup]");
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
    const merged = cn(dialogSlots.popup, "rounded-none p-8 w-96 overflow-y-scroll");
    expect(merged).toContain("rounded-none");
    expect(merged).toContain("w-96");
    expect(merged).not.toContain("rounded-(--ow-radius)");
    expect(merged).not.toContain("p-(--_p)");
    expect(merged).not.toContain("w-[32em]");
    expect(merged).not.toContain(" overflow-y-auto");
    expect(cn(dialogSlots.title, "font-bold")).not.toContain("font-semibold");
  });
});
