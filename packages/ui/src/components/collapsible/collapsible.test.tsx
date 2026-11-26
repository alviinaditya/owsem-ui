import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Collapsible } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const el = <T extends HTMLElement>(selector: string) =>
    screen.container.querySelector(selector) as T;
  return {
    screen,
    group: el("[data-slot=collapsible]"),
    trigger: el(".ow-collapsible__trigger"),
    panel: () => screen.container.querySelector<HTMLElement>(".ow-collapsible__panel"),
    strokes: () => [...screen.container.querySelectorAll<SVGElement>(".ow-collapsible__stroke")],
  };
}

/** Resolves a value (e.g. `var(--ow-hover)`) of `color` to its computed form in `scope`. */
function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue("color");
  probe.remove();
  return computed;
}

const Tall = ({ height = 120 }: { height?: number }) => (
  <div style={{ blockSize: height }}>Content</div>
);

const Basic = (props: Collapsible.Root.Props) => (
  <div style={{ inlineSize: 320 }}>
    <Collapsible.Root {...props}>
      <Collapsible.Trigger>Details</Collapsible.Trigger>
      <Collapsible.Panel>
        <Tall />
      </Collapsible.Panel>
    </Collapsible.Root>
  </div>
);

const heightOf = (el: Element) => el.getBoundingClientRect().height;
const transitions = (el: Element) =>
  el.getAnimations().filter((a): a is CSSTransition => a instanceof CSSTransition);

describe("Collapsible", () => {
  test("is Base UI's: a button that controls its panel, mounted only while open", async () => {
    const { trigger, panel, screen } = await mount(<Basic />);
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel()).toBeNull();
    await userEvent.click(trigger);
    await expect.poll(() => panel()).not.toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel()?.id);
    expect(trigger.hasAttribute("data-panel-open")).toBe(true);
    await userEvent.click(trigger);
    await expect.poll(() => panel()).toBeNull();
    expect(screen.container.querySelector("[data-panel-open]")).toBeNull();
  });

  test("Enter and Space open and close it from the keyboard", async () => {
    const { trigger, panel } = await mount(<Basic />);
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => panel()).not.toBeNull();
    await userEvent.keyboard(" ");
    await expect.poll(() => panel()).toBeNull();
  });

  test("controlled: open and onOpenChange decide", async () => {
    const changes: boolean[] = [];
    const { trigger, panel } = await mount(
      <Basic open={false} onOpenChange={(o) => changes.push(o)} />,
    );
    await userEvent.click(trigger);
    expect(changes).toEqual([true]);
    expect(panel()).toBeNull();
  });

  test("the trigger draws its label and a chevron of two strokes, hidden from screen readers", async () => {
    const { trigger, strokes } = await mount(<Basic />);
    const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
    expect(trigger.firstChild?.textContent).toBe("Details");
    expect(icon.getAttribute("data-slot")).toBe("collapsible-icon");
    const svg = icon.querySelector("svg") as SVGElement;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(strokes()).toHaveLength(2);
    expect(trigger.textContent).toBe("Details");
  });

  test("icon replaces the chevron, and icon={null} leaves it out", async () => {
    const custom = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger icon={<b data-mine="">+</b>}>A</Collapsible.Trigger>
      </Collapsible.Root>,
    );
    expect(custom.trigger.querySelector(".ow-collapsible__icon [data-mine]")).not.toBeNull();
    expect(custom.strokes()).toHaveLength(0);
    const none = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger icon={null}>B</Collapsible.Trigger>
      </Collapsible.Root>,
    );
    expect(none.trigger.querySelector(".ow-collapsible__icon")).toBeNull();
    expect(none.trigger.textContent).toBe("B");
  });

  test("the label sits at the start and the chevron at the end", async () => {
    const { trigger } = await mount(<Basic />);
    const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
    const style = getComputedStyle(trigger);
    expect(style.display).toBe("flex");
    expect(style.justifyContent).toBe("space-between");
    const box = trigger.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(trigger.firstChild as Node);
    const before = range.getBoundingClientRect().left - box.left;
    const after = box.right - icon.getBoundingClientRect().right;
    // Both sit near their edge: the chevron a little closer, as Button's end icon does.
    expect(before).toBeLessThan(20);
    expect(after).toBeLessThan(before + 1);
    expect(before - after).toBeLessThan(6);
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(box.left + box.width / 2);
  });

  test("right to left: the label at the right and the chevron at the left", async () => {
    const screen = await render(
      <div dir="rtl" style={{ inlineSize: 320 }}>
        <Collapsible.Root>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
        </Collapsible.Root>
      </div>,
    );
    const trigger = screen.container.querySelector(".ow-collapsible__trigger") as HTMLElement;
    const icon = trigger.querySelector(".ow-collapsible__icon") as HTMLElement;
    const box = trigger.getBoundingClientRect();
    expect(icon.getBoundingClientRect().left).toBeLessThan(box.left + 20);
    expect(getComputedStyle(trigger).textAlign).toBe("start");
  });

  test("the trigger is a ghost button: flat, a hover tint, the radius token, and a ring on focus", async () => {
    const { trigger } = await mount(<Basic />);
    const style = getComputedStyle(trigger);
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.borderRadius).toBe("16px");
    expect(style.fontWeight).toBe("500");
    await userEvent.hover(trigger);
    await expect
      .poll(() => getComputedStyle(trigger).backgroundColor)
      .toBe(resolve("var(--ow-hover)"));
    await userEvent.unhover(trigger);
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => document.activeElement).toBe(trigger);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("var(--ow-focus)"));
  });

  test("held down it takes the pressed fill and presses in like a ghost Button", async () => {
    const { trigger } = await mount(<Basic />);
    onTestFinished(() => commands.mouse("up"));
    await userEvent.hover(trigger);
    await commands.mouse("down");
    await expect
      .poll(() => getComputedStyle(trigger).backgroundColor)
      .toBe(resolve("var(--ow-pressed-bg)"));
    await expect
      .poll(() => new DOMMatrixReadOnly(getComputedStyle(trigger).transform).a)
      .toBeCloseTo(0.97, 2);
  });

  test("the panel's height moves on a transition without overshoot, and its content fades", async () => {
    const { trigger, panel } = await mount(
      <div style={{ "--ow-motion-scale": 3 } as CSSProperties}>
        <Basic />
      </div>,
    );
    await userEvent.click(trigger);
    await expect.poll(() => transitions(panel() as HTMLElement).length).toBeGreaterThan(0);
    const names = transitions(panel() as HTMLElement).map((a) => a.transitionProperty);
    expect(names).toContain("opacity");
    expect(names.some((name) => name === "block-size" || name === "height")).toBe(true);
    const style = getComputedStyle(panel() as HTMLElement);
    expect(style.transitionTimingFunction).toContain("cubic-bezier(0.32, 0.72, 0, 1)");
    expect(style.overflow).toBe("hidden");
    // Never past the content: the ease has no overshoot.
    const full = 141;
    for (let i = 0; i < 12; i++) {
      expect(heightOf(panel() as HTMLElement)).toBeLessThanOrEqual(full + 0.5);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  });

  test("it rests at auto height, so content that arrives late is not clipped", async () => {
    function Late() {
      const [more, setMore] = useState(false);
      return (
        <div style={{ inlineSize: 320 }}>
          <button type="button" data-more="" onClick={() => setMore(true)}>
            more
          </button>
          <Collapsible.Root defaultOpen>
            <Collapsible.Trigger>Details</Collapsible.Trigger>
            <Collapsible.Panel>
              <Tall height={80} />
              {more ? <div data-late="" style={{ blockSize: 100 }} /> : null}
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      );
    }
    const { screen, panel } = await mount(<Late />);
    await settle();
    expect(panel()?.style.getPropertyValue("--collapsible-panel-height")).toBe("auto");
    const before = heightOf(panel() as HTMLElement);
    await userEvent.click(screen.container.querySelector("[data-more]") as HTMLElement);
    await expect.poll(() => heightOf(panel() as HTMLElement)).toBe(before + 100);
    const late = screen.container.querySelector("[data-late]") as HTMLElement;
    expect(late.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      (panel() as HTMLElement).getBoundingClientRect().bottom,
    );
  });

  test("after opening and after closing nothing is left running, and a closed panel is gone", async () => {
    const { trigger, panel } = await mount(<Basic />);
    await userEvent.click(trigger);
    await settle();
    expect(heightOf(panel() as HTMLElement)).toBe(141);
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(trigger);
    await expect.poll(() => panel()).toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("padding lives in the content, never on the box that moves", async () => {
    const { trigger, panel } = await mount(<Basic />);
    await userEvent.click(trigger);
    await settle();
    const style = getComputedStyle(panel() as HTMLElement);
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      expect(style[`padding${side}`]).toBe("0px");
      expect(style[`border${side}Width`]).toBe("0px");
    }
    const content = (panel() as HTMLElement).querySelector(
      "[data-slot=collapsible-content]",
    ) as HTMLElement;
    expect(content.className).toBe("ow-collapsible__content ow-collapsible__content--md");
    // 0.5em above and 1em below, in em of the size's 14px.
    expect(getComputedStyle(content).paddingTop).toBe("7px");
    expect(getComputedStyle(content).paddingBottom).toBe("14px");
    // The side padding is the trigger's own formula, so the two match in any font.
    expect(getComputedStyle(content).paddingLeft).toBe(getComputedStyle(trigger).paddingLeft);
  });

  test("size on Root reaches the trigger and the panel's text; an own size wins for the trigger only", async () => {
    const sizes = [
      ["sm", "13px", 32],
      ["md", "14px", 40],
      ["lg", "16px", 48],
    ] as const;
    for (const [size, font, edge] of sizes) {
      const { trigger, panel } = await mount(
        <Collapsible.Root size={size} defaultOpen>
          <Collapsible.Trigger>A</Collapsible.Trigger>
          <Collapsible.Panel>x</Collapsible.Panel>
        </Collapsible.Root>,
      );
      await settle();
      const content = (panel() as HTMLElement).firstElementChild as HTMLElement;
      expect(trigger.getAttribute("data-size")).toBe(size);
      expect(trigger.className).toContain(`ow-collapsible__trigger--${size}`);
      expect(content.className).toBe(`ow-collapsible__content ow-collapsible__content--${size}`);
      expect(heightOf(trigger)).toBe(edge);
      const style = getComputedStyle(content);
      expect(style.fontSize).toBe(font);
      expect(style.fontSize).toBe(getComputedStyle(trigger).fontSize);
      expect(style.fontWeight).toBe("400");
      expect(style.lineHeight).toBe(`${Number.parseFloat(font) * 1.5}px`);
      expect(style.color).toBe(resolve("var(--ow-fg)"));
    }
    const own = await mount(
      <Collapsible.Root size="lg" defaultOpen>
        <Collapsible.Trigger size="sm">A</Collapsible.Trigger>
        <Collapsible.Panel>x</Collapsible.Panel>
      </Collapsible.Root>,
    );
    await settle();
    expect(own.trigger.getAttribute("data-size")).toBe("sm");
    expect(heightOf(own.trigger)).toBe(32);
    expect(((own.panel() as HTMLElement).firstElementChild as HTMLElement).className).toContain(
      "--lg",
    );
  });

  test("the panel's text is in the component layer: an unlayered rule changes it", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".brand-text { font-size: 20px; color: rgb(1, 2, 3); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { panel } = await mount(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger>A</Collapsible.Trigger>
        <Collapsible.Panel>
          <p className="brand-text">mine</p>
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    const text = (panel() as HTMLElement).querySelector("p") as HTMLElement;
    expect(getComputedStyle(text).fontSize).toBe("20px");
    expect(getComputedStyle(text).color).toBe("rgb(1, 2, 3)");
  });

  test("interrupted, it turns around from where it is, never from the end or the start", async () => {
    const { trigger, panel } = await mount(
      <div style={{ "--ow-motion-scale": 4 } as CSSProperties}>
        <Basic />
      </div>,
    );
    await userEvent.click(trigger);
    await expect.poll(() => heightOf(panel() as HTMLElement)).toBeGreaterThan(30);
    const at = heightOf(panel() as HTMLElement);
    expect(at).toBeLessThan(141 - 10);
    await userEvent.click(trigger);
    // It turns from the height it had, which the slow motion keeps close, and not from an end.
    const turned = heightOf(panel() as HTMLElement);
    expect(turned).toBeGreaterThanOrEqual(at - 1);
    expect(turned).toBeLessThan(141 - 5);
    // From there it keeps shrinking.
    const first = heightOf(panel() as HTMLElement);
    await expect.poll(() => heightOf(panel() as HTMLElement)).toBeLessThan(first);
  });

  test("keepMounted: closed, it stays in the page, hidden", async () => {
    const { panel } = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger>A</Collapsible.Trigger>
        <Collapsible.Panel keepMounted>
          <Tall />
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(panel()).not.toBeNull();
    expect(panel()?.hasAttribute("hidden")).toBe(true);
    expect(getComputedStyle(panel() as HTMLElement).display).toBe("none");
  });

  test("hiddenUntilFound: the browser's find in page opens it", async () => {
    const { trigger, panel } = await mount(
      <Collapsible.Root>
        <Collapsible.Trigger>A</Collapsible.Trigger>
        <Collapsible.Panel hiddenUntilFound>
          <Tall />
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(panel()?.getAttribute("hidden")).toBe("until-found");
    expect(getComputedStyle(panel() as HTMLElement).display).not.toBe("none");
    panel()?.dispatchEvent(new Event("beforematch", { bubbles: true }));
    await expect.poll(() => trigger.getAttribute("aria-expanded")).toBe("true");
    await expect.poll(() => panel()?.hasAttribute("hidden")).toBe(false);
  });

  test("print: a closed panel stays closed", async () => {
    onTestFinished(() => commands.setPrint("screen"));
    const { panel, screen } = await mount(
      <>
        <Collapsible.Root>
          <Collapsible.Trigger>A</Collapsible.Trigger>
          <Collapsible.Panel keepMounted>
            <Tall />
          </Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root>
          <Collapsible.Trigger>B</Collapsible.Trigger>
          <Collapsible.Panel hiddenUntilFound>
            <Tall />
          </Collapsible.Panel>
        </Collapsible.Root>
      </>,
    );
    await commands.setPrint("print");
    expect(getComputedStyle(panel() as HTMLElement).display).toBe("none");
    const found = screen.container.querySelectorAll<HTMLElement>(".ow-collapsible__panel")[1];
    expect(getComputedStyle(found as HTMLElement).contentVisibility).toBe("hidden");
  });

  test("the chevron turns each stroke a quarter about its own center: down, flat, up", async () => {
    const { trigger, strokes } = await mount(
      <div style={{ "--ow-motion-scale": 4 } as CSSProperties}>
        <Basic />
      </div>,
    );
    const [start, end] = strokes() as [SVGElement, SVGElement];
    expect(getComputedStyle(start).rotate).toBe("0deg");
    expect(getComputedStyle(start).transformBox).toBe("fill-box");
    expect(getComputedStyle(start).transformOrigin).toBe(getComputedStyle(end).transformOrigin);
    await userEvent.click(trigger);
    await expect.poll(() => transitions(start).length).toBeGreaterThan(0);
    // Halfway between: turned, not there yet.
    for (const a of start.getAnimations()) {
      a.pause();
      a.currentTime = 400;
    }
    const mid = Number.parseFloat(getComputedStyle(start).rotate);
    expect(mid).toBeLessThan(0);
    expect(mid).toBeGreaterThan(-90);
    for (const a of trigger.getAnimations({ subtree: true })) a.finish();
    await settle();
    expect(getComputedStyle(start).rotate).toBe("-90deg");
    expect(getComputedStyle(end).rotate).toBe("90deg");
  });

  test("under reduced motion the chevron turns at once and the panel opens at once", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { trigger, panel, strokes } = await mount(<Basic />);
    await userEvent.click(trigger);
    await expect.poll(() => panel()).not.toBeNull();
    const [start] = strokes() as [SVGElement];
    expect(getComputedStyle(start).transitionDuration).toBe("0s");
    expect(getComputedStyle(start).rotate).toBe("-90deg");
    expect(heightOf(panel() as HTMLElement)).toBe(141);
    expect(transitions(panel() as HTMLElement).map((a) => a.transitionProperty)).not.toContain(
      "block-size",
    );
    expect(transitions(panel() as HTMLElement).map((a) => a.transitionProperty)).not.toContain(
      "height",
    );
    await userEvent.click(trigger);
    await expect.poll(() => panel()).toBeNull();
    // A held press does not scale.
    expect(getComputedStyle(trigger).transform).toBe("none");
  });

  test("with the motion scale at 0 nothing moves: no panel transition, the chevron is there", async () => {
    const { trigger, panel, strokes } = await mount(
      <div style={{ "--ow-motion-scale": 0 } as CSSProperties}>
        <Basic />
      </div>,
    );
    await userEvent.click(trigger);
    await expect.poll(() => panel()).not.toBeNull();
    expect(getComputedStyle(panel() as HTMLElement).transitionDuration).toBe("0s, 0s");
    expect(heightOf(panel() as HTMLElement)).toBe(141);
    expect(getComputedStyle(strokes()[0] as SVGElement).rotate).toBe("-90deg");
    expect(getComputedStyle(strokes()[0] as SVGElement).transitionDuration).toBe("0s");
    await userEvent.click(trigger);
    await expect.poll(() => panel()).toBeNull();
  });

  test("disabled: the trigger does not open, and looks it", async () => {
    const { trigger, panel } = await mount(<Basic disabled />);
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(trigger).opacity).toBe("0.5");
    expect(getComputedStyle(trigger).cursor).toBe("not-allowed");
    await userEvent.click(trigger, { force: true });
    expect(panel()).toBeNull();
    await userEvent.hover(trigger, { force: true });
    expect(getComputedStyle(trigger).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("forced colors: the ring and a disabled label take the system's colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { trigger, screen } = await mount(
      <>
        <Basic />
        <Basic disabled />
      </>,
    );
    await commands.setForcedColors("active");
    await userEvent.tab();
    expect(document.activeElement).toBe(trigger);
    await expect.poll(() => getComputedStyle(trigger).outlineColor).toBe(resolve("Highlight"));
    const disabled = screen.container.querySelectorAll<HTMLElement>(".ow-collapsible__trigger")[1];
    expect(getComputedStyle(disabled as HTMLElement).color).toBe(resolve("GrayText"));
    const stroke = trigger.querySelector(".ow-collapsible__stroke") as SVGElement;
    expect(getComputedStyle(stroke).stroke).toBe(getComputedStyle(trigger).color);
  });

  test("the label has 4.5:1 and the chevron 3:1, in both themes, at rest and hovered", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { trigger } = await mount(<Basic />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const ink = composite(getComputedStyle(trigger).color);
      expect(contrast(ink, page)).toBeGreaterThanOrEqual(4.5);
      await userEvent.hover(trigger);
      await expect
        .poll(() => getComputedStyle(trigger).backgroundColor)
        .toBe(resolve("var(--ow-hover)"));
      const hovered = composite(resolve("var(--ow-bg)"), getComputedStyle(trigger).backgroundColor);
      expect(contrast(ink, hovered)).toBeGreaterThanOrEqual(4.5);
      // The chevron draws in the text color, which is 3:1 and more.
      const stroke = trigger.querySelector(".ow-collapsible__stroke") as SVGElement;
      expect(composite(getComputedStyle(stroke).stroke)).toEqual(ink);
      await userEvent.unhover(trigger);
    }
  });

  test("passes className, style, render, and ref through on every part", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      panel: createRef<HTMLDivElement>(),
    };
    const { group, trigger, panel } = await mount(
      <Collapsible.Root
        ref={refs.root}
        defaultOpen
        className="mine"
        style={{ marginInline: "3px" }}
      >
        <Collapsible.Trigger ref={refs.trigger} className="t" size="lg" style={{ opacity: 0.9 }}>
          A
        </Collapsible.Trigger>
        <Collapsible.Panel ref={refs.panel} className="p" render={<section />}>
          x
        </Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(refs.root.current).toBe(group);
    expect(refs.trigger.current).toBe(trigger);
    expect(refs.panel.current).toBe(panel());
    expect(panel()?.tagName).toBe("SECTION");
    expect(group.className).toBe("mine");
    expect(trigger.className).toBe("ow-collapsible__trigger ow-collapsible__trigger--lg t");
    expect(panel()?.className).toBe("ow-collapsible__panel p");
    expect(trigger.getAttribute("data-size")).toBe("lg");
    expect(group.style.marginInline).toBe("3px");
  });

  test("a theme token set on a group changes it alone", async () => {
    const { trigger } = await mount(
      <Collapsible.Root style={{ "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties}>
        <Collapsible.Trigger>A</Collapsible.Trigger>
      </Collapsible.Root>,
    );
    expect(getComputedStyle(trigger).color).toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".brand { background-color: rgb(1, 2, 3); } .brand-panel { overflow: visible; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { trigger, panel } = await mount(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger className="brand">A</Collapsible.Trigger>
        <Collapsible.Panel className="brand-panel">x</Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(getComputedStyle(trigger).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(panel() as HTMLElement).overflow).toBe("visible");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger>A</Collapsible.Trigger>
        <Collapsible.Panel>x</Collapsible.Panel>
      </Collapsible.Root>,
    );
    expect(html).toContain("ow-collapsible__trigger");
    expect(html).toContain("ow-collapsible__content");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, closed or open", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 320 }}>
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger>Open one</Collapsible.Trigger>
          <Collapsible.Panel>Some content</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root>
          <Collapsible.Trigger size="sm">Closed one</Collapsible.Trigger>
          <Collapsible.Panel keepMounted>Hidden content</Collapsible.Panel>
        </Collapsible.Root>
        <Collapsible.Root disabled>
          <Collapsible.Trigger size="lg">Disabled one</Collapsible.Trigger>
          <Collapsible.Panel>Never</Collapsible.Panel>
        </Collapsible.Root>
      </main>,
    );
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });
});

test("every part has its data-slot", async () => {
  const { screen } = await mount(
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>A</Collapsible.Trigger>
      <Collapsible.Panel>x</Collapsible.Panel>
    </Collapsible.Root>,
  );
  await settle();
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "collapsible",
    "collapsible-trigger",
    "collapsible-icon",
    "collapsible-panel",
    "collapsible-content",
  ]);
});
