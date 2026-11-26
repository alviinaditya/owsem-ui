import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Accordion } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const all = <T extends HTMLElement>(selector: string) => [
    ...screen.container.querySelectorAll<T>(selector),
  ];
  return {
    screen,
    group: screen.container.querySelector("[data-slot=accordion]") as HTMLElement,
    items: () => all(".ow-accordion__item"),
    headers: () => all(".ow-accordion__header"),
    triggers: () => all(".ow-accordion__trigger"),
    panels: () => all(".ow-accordion__panel"),
    strokes: () => all<HTMLElement>(".ow-accordion__stroke"),
  };
}

/** Resolves a value (e.g. `var(--ow-line)`) of `color` to its computed form in `scope`. */
function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue("color");
  probe.remove();
  return computed;
}

const Tall = ({ height = 100 }: { height?: number }) => (
  <div style={{ blockSize: height }}>Content</div>
);

const Three = (props: Accordion.Root.Props) => (
  <div style={{ inlineSize: 320 }}>
    <Accordion.Root {...props}>
      {["one", "two", "three"].map((value) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Trigger>Item {value}</Accordion.Trigger>
          <Accordion.Panel>
            <Tall />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  </div>
);

const heightOf = (el: Element) => el.getBoundingClientRect().height;
const transitions = (el: Element) =>
  el.getAnimations().filter((a): a is CSSTransition => a instanceof CSSTransition);

describe("Accordion", () => {
  test("is Base UI's: triggers inside headings, one panel open at a time", async () => {
    const { triggers, panels, headers } = await mount(<Three />);
    expect(headers()).toHaveLength(3);
    expect(headers().map((h) => h.tagName)).toEqual(["H3", "H3", "H3"]);
    expect(triggers().every((t) => t.parentElement?.tagName === "H3")).toBe(true);
    expect(triggers().map((t) => t.getAttribute("aria-expanded"))).toEqual([
      "false",
      "false",
      "false",
    ]);
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(1);
    await userEvent.click(triggers()[1] as HTMLElement);
    await expect
      .poll(() => triggers().map((t) => t.getAttribute("aria-expanded")))
      .toEqual(["false", "true", "false"]);
    await expect.poll(() => panels()).toHaveLength(1);
    const first = triggers()[1] as HTMLElement;
    expect(first.getAttribute("aria-controls")).toBe(panels()[0]?.id);
  });

  test("multiple: several stay open", async () => {
    const { triggers, panels } = await mount(<Three multiple />);
    await userEvent.click(triggers()[0] as HTMLElement);
    await userEvent.click(triggers()[2] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(2);
  });

  test("controlled: value and onValueChange decide", async () => {
    const changes: string[][] = [];
    const { triggers, panels } = await mount(
      <Three value={[]} onValueChange={(value) => changes.push(value)} />,
    );
    await userEvent.click(triggers()[1] as HTMLElement);
    expect(changes).toEqual([["two"]]);
    expect(panels()).toHaveLength(0);
  });

  test("Tab visits each trigger, and Enter and Space open the focused one", async () => {
    const { triggers, panels } = await mount(<Three />);
    await userEvent.tab();
    expect(document.activeElement).toBe(triggers()[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(triggers()[1]);
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => panels()).toHaveLength(1);
    await userEvent.keyboard(" ");
    await expect.poll(() => panels()).toHaveLength(0);
  });

  test("a Trigger draws its own heading, unless it is in a Header, which can change the level", async () => {
    const { headers, triggers } = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          {/* biome-ignore lint/a11y/useHeadingContent: Header fills it with its children */}
          <Accordion.Header render={<h2 />}>
            <Accordion.Trigger>Own header</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>Drawn header</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(headers().map((h) => h.tagName)).toEqual(["H2", "H3"]);
    expect(triggers().map((t) => t.parentElement)).toEqual(headers());
  });

  test("a Header found through a wrapper component is still found: no second heading", async () => {
    const Wrapped = ({ children }: { children: ReactNode }) => <>{children}</>;
    const { headers } = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Header>
            <Wrapped>
              <Wrapped>
                <Accordion.Trigger>Deep</Accordion.Trigger>
              </Wrapped>
            </Wrapped>
          </Accordion.Header>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(headers()).toHaveLength(1);
  });

  test("the chevron draws itself, hidden from screen readers; icon replaces it and null leaves it out", async () => {
    const { triggers, strokes } = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Trigger>Plain</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger icon={<b data-mine="">+</b>}>Mine</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="c">
          <Accordion.Trigger icon={null}>None</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const [plain, mine, none] = triggers() as [HTMLElement, HTMLElement, HTMLElement];
    expect(plain.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(strokes()).toHaveLength(2);
    expect(mine.querySelector(".ow-accordion__icon [data-mine]")).not.toBeNull();
    expect(none.querySelector(".ow-accordion__icon")).toBeNull();
    expect(plain.textContent).toBe("Plain");
  });

  test("one hairline between items: none before the first or after the last", async () => {
    const { items } = await mount(<Three />);
    const widths = items().map((item) => getComputedStyle(item).borderTopWidth);
    expect(widths).toEqual(["0px", "1px", "1px"]);
    for (const item of items()) {
      expect(getComputedStyle(item).borderBottomWidth).toBe("0px");
    }
    const line = resolve("var(--ow-line)");
    expect(getComputedStyle(items()[1] as HTMLElement).borderTopColor).toBe(line);
    expect(getComputedStyle(items()[1] as HTMLElement).borderTopStyle).toBe("solid");
  });

  test("a trigger is a full-width row with its label at the start and its chevron at the end", async () => {
    const { triggers, group } = await mount(<Three />);
    const trigger = triggers()[0] as HTMLElement;
    const style = getComputedStyle(trigger);
    expect(style.display).toBe("flex");
    expect(style.justifyContent).toBe("space-between");
    expect(style.fontWeight).toBe("500");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(heightOf(trigger)).toBe(40);
    expect(trigger.getBoundingClientRect().width).toBe(group.getBoundingClientRect().width);
    const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
    expect(icon.getBoundingClientRect().left).toBeGreaterThan(
      trigger.getBoundingClientRect().left + 200,
    );
  });

  test("the chevron is muted, and takes the text color on hover and while open; no fill, no press", async () => {
    const { triggers } = await mount(<Three />);
    const trigger = triggers()[0] as HTMLElement;
    const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
    expect(getComputedStyle(icon).color).toBe(resolve("var(--ow-muted)"));
    await userEvent.hover(trigger);
    await expect.poll(() => getComputedStyle(icon).color).toBe(resolve("var(--ow-fg)"));
    expect(getComputedStyle(trigger).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    onTestFinished(() => commands.mouse("up"));
    await commands.mouse("down");
    expect(getComputedStyle(trigger).transform).toBe("none");
    expect(getComputedStyle(trigger).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await commands.mouse("up");
    await userEvent.unhover(trigger);
    await expect.poll(() => getComputedStyle(icon).color).toBe(resolve("var(--ow-fg)"));
    // Open: the text color, even with the pointer away.
    await userEvent.hover(document.body, { position: { x: 1270, y: 790 }, force: true });
    await expect.poll(() => trigger.hasAttribute("data-panel-open")).toBe(true);
  });

  test("a closed row's chevron is muted when the pointer is away", async () => {
    const { triggers } = await mount(<Three />);
    const icon = (triggers()[1] as HTMLElement).querySelector(".ow-accordion__icon") as HTMLElement;
    expect(getComputedStyle(icon).color).toBe(resolve("var(--ow-muted)"));
  });

  test("a clear focus ring that the panel does not paint over", async () => {
    const { triggers, panels } = await mount(<Three defaultValue={["one"]} />);
    await userEvent.tab();
    const trigger = triggers()[0] as HTMLElement;
    expect(document.activeElement).toBe(trigger);
    const style = getComputedStyle(trigger);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("var(--ow-focus)"));
    expect(style.position).toBe("relative");
    expect(style.zIndex).toBe("1");
    // The ring's bottom edge is inside the panel's box: the trigger is above it.
    const ringBottom = trigger.getBoundingClientRect().bottom + 4;
    const panel = panels()[0] as HTMLElement;
    expect(ringBottom).toBeGreaterThan(panel.getBoundingClientRect().top);
    expect(
      document.elementsFromPoint(
        trigger.getBoundingClientRect().left + 10,
        trigger.getBoundingClientRect().bottom - 2,
      )[0],
    ).toBe(trigger);
  });

  test("sizes on Root reach every trigger: 32, 40, and 48 px rows", async () => {
    for (const [size, edge] of [
      ["sm", 32],
      ["md", 40],
      ["lg", 48],
    ] as const) {
      const { triggers, group } = await mount(<Three size={size} />);
      expect(group.getAttribute("data-size")).toBe(size);
      for (const trigger of triggers()) {
        expect(heightOf(trigger)).toBe(edge);
        expect(trigger.getAttribute("data-size")).toBe(size);
      }
    }
  });

  test("the panel's height moves on a transition without overshoot; padding is in the content", async () => {
    const { triggers, panels } = await mount(
      <div style={{ "--ow-motion-scale": 3 } as CSSProperties}>
        <Three />
      </div>,
    );
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => transitions(panels()[0] as HTMLElement).length).toBeGreaterThan(0);
    const names = transitions(panels()[0] as HTMLElement).map((a) => a.transitionProperty);
    expect(names).toContain("opacity");
    expect(names.some((name) => name === "block-size" || name === "height")).toBe(true);
    const panel = panels()[0] as HTMLElement;
    expect(getComputedStyle(panel).overflow).toBe("hidden");
    expect(getComputedStyle(panel).transitionTimingFunction).toContain(
      "cubic-bezier(0.32, 0.72, 0, 1)",
    );
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      expect(getComputedStyle(panel)[`padding${side}`]).toBe("0px");
    }
    const content = panel.querySelector("[data-slot=accordion-content]") as HTMLElement;
    expect(getComputedStyle(content).paddingTop).toBe("3.5px");
    expect(getComputedStyle(content).paddingBottom).toBe("14px");
    for (let i = 0; i < 12; i++) {
      expect(heightOf(panel)).toBeLessThanOrEqual(117.5 + 0.5);
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
          <Accordion.Root defaultValue={["a"]}>
            <Accordion.Item value="a">
              <Accordion.Trigger>A</Accordion.Trigger>
              <Accordion.Panel>
                <Tall height={80} />
                {more ? <div data-late="" style={{ blockSize: 100 }} /> : null}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </div>
      );
    }
    const { screen, panels } = await mount(<Late />);
    await settle();
    const panel = panels()[0] as HTMLElement;
    expect(panel.style.getPropertyValue("--accordion-panel-height")).toBe("auto");
    const before = heightOf(panel);
    await userEvent.click(screen.container.querySelector("[data-more]") as HTMLElement);
    await expect.poll(() => heightOf(panel)).toBe(before + 100);
  });

  test("the panel's text takes the Root's size: its font, weight 400, line height 1.5, and --ow-fg", async () => {
    for (const [size, font] of [
      ["sm", "13px"],
      ["md", "14px"],
      ["lg", "16px"],
    ] as const) {
      const { panels, triggers } = await mount(<Three size={size} defaultValue={["one"]} />);
      await settle();
      const content = (panels()[0] as HTMLElement).firstElementChild as HTMLElement;
      const style = getComputedStyle(content);
      expect(content.className).toBe(`ow-accordion__content ow-accordion__content--${size}`);
      expect(style.fontSize).toBe(font);
      expect(style.fontSize).toBe(getComputedStyle(triggers()[0] as HTMLElement).fontSize);
      expect(style.fontWeight).toBe("400");
      expect(style.lineHeight).toBe(`${Number.parseFloat(font) * 1.5}px`);
      expect(style.color).toBe(resolve("var(--ow-fg)"));
    }
  });

  test("interrupted, it turns around from where it is", async () => {
    const { triggers, panels } = await mount(
      <div style={{ "--ow-motion-scale": 4 } as CSSProperties}>
        <Three />
      </div>,
    );
    const trigger = triggers()[0] as HTMLElement;
    await userEvent.click(trigger);
    await expect.poll(() => heightOf(panels()[0] as HTMLElement)).toBeGreaterThan(30);
    const at = heightOf(panels()[0] as HTMLElement);
    expect(at).toBeLessThan(117.5 - 10);
    await userEvent.click(trigger);
    // It turns from the height it had, which the slow motion keeps close, and not from an end.
    const turned = heightOf(panels()[0] as HTMLElement);
    expect(turned).toBeGreaterThanOrEqual(at - 1);
    expect(turned).toBeLessThan(117.5 - 5);
    const first = heightOf(panels()[0] as HTMLElement);
    await expect.poll(() => heightOf(panels()[0] as HTMLElement)).toBeLessThan(first);
  });

  test("nothing is left running at rest, open or closed", async () => {
    const { triggers, panels } = await mount(<Three />);
    await userEvent.click(triggers()[0] as HTMLElement);
    await settle();
    expect(Math.abs(heightOf(panels()[0] as HTMLElement) - 117.5)).toBeLessThanOrEqual(0.5);
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(0);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("keepMounted on the root keeps closed panels in the page, hidden", async () => {
    const { panels } = await mount(<Three keepMounted />);
    expect(panels()).toHaveLength(3);
    for (const panel of panels()) {
      expect(panel.hasAttribute("hidden")).toBe(true);
      expect(getComputedStyle(panel).display).toBe("none");
    }
  });

  test("hiddenUntilFound: find in page opens the panel that holds the match", async () => {
    const { triggers, panels } = await mount(<Three hiddenUntilFound />);
    expect(panels()).toHaveLength(3);
    expect(panels()[1]?.getAttribute("hidden")).toBe("until-found");
    panels()[1]?.dispatchEvent(new Event("beforematch", { bubbles: true }));
    await expect.poll(() => triggers()[1]?.getAttribute("aria-expanded")).toBe("true");
  });

  test("print: a closed panel stays closed", async () => {
    onTestFinished(() => commands.setPrint("screen"));
    const kept = await mount(<Three keepMounted />);
    const found = await mount(<Three hiddenUntilFound />);
    await commands.setPrint("print");
    for (const panel of kept.panels()) expect(getComputedStyle(panel).display).toBe("none");
    for (const panel of found.panels()) {
      expect(getComputedStyle(panel).contentVisibility).toBe("hidden");
    }
  });

  test("the chevron turns each stroke a quarter about its own center: down, flat, up", async () => {
    const { triggers, strokes } = await mount(
      <div style={{ "--ow-motion-scale": 4 } as CSSProperties}>
        <Three />
      </div>,
    );
    const [start, end] = strokes() as [HTMLElement, HTMLElement];
    expect(getComputedStyle(start).rotate).toBe("0deg");
    expect(getComputedStyle(start).transformBox).toBe("fill-box");
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => transitions(start).length).toBeGreaterThan(0);
    for (const a of start.getAnimations()) {
      a.pause();
      a.currentTime = 400;
    }
    const mid = Number.parseFloat(getComputedStyle(start).rotate);
    expect(mid).toBeLessThan(0);
    expect(mid).toBeGreaterThan(-90);
    for (const a of triggers()[0]?.getAnimations({ subtree: true }) ?? []) a.finish();
    await settle();
    expect(getComputedStyle(start).rotate).toBe("-90deg");
    expect(getComputedStyle(end).rotate).toBe("90deg");
  });

  test("under reduced motion the chevron turns at once and the panel opens at once", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const { triggers, panels, strokes } = await mount(<Three />);
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(1);
    const panel = panels()[0] as HTMLElement;
    expect(getComputedStyle(strokes()[0] as HTMLElement).transitionDuration).toBe("0s");
    expect(getComputedStyle(strokes()[0] as HTMLElement).rotate).toBe("-90deg");
    expect(Math.abs(heightOf(panel) - 117.5)).toBeLessThanOrEqual(0.5);
    const names = transitions(panel).map((a) => a.transitionProperty);
    expect(names).not.toContain("block-size");
    expect(names).not.toContain("height");
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(0);
  });

  test("with the motion scale at 0 nothing moves", async () => {
    const { triggers, panels, strokes } = await mount(
      <div style={{ "--ow-motion-scale": 0 } as CSSProperties}>
        <Three />
      </div>,
    );
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(1);
    expect(getComputedStyle(panels()[0] as HTMLElement).transitionDuration).toBe("0s, 0s");
    expect(Math.abs(heightOf(panels()[0] as HTMLElement) - 117.5)).toBeLessThanOrEqual(0.5);
    expect(getComputedStyle(strokes()[0] as HTMLElement).rotate).toBe("-90deg");
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => panels()).toHaveLength(0);
  });

  test("disabled: the root, or one item, does not open and looks it", async () => {
    const whole = await mount(<Three disabled />);
    for (const trigger of whole.triggers()) {
      expect(trigger.hasAttribute("data-disabled")).toBe(true);
      expect(getComputedStyle(trigger).opacity).toBe("0.5");
      expect(getComputedStyle(trigger).cursor).toBe("not-allowed");
    }
    await userEvent.click(whole.triggers()[0] as HTMLElement, { force: true });
    expect(whole.panels()).toHaveLength(0);
    const one = await mount(
      <Accordion.Root>
        <Accordion.Item value="a" disabled>
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>B</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    const [a, b] = one.triggers() as [HTMLElement, HTMLElement];
    expect(getComputedStyle(a).opacity).toBe("0.5");
    expect(getComputedStyle(b).opacity).toBe("1");
    await userEvent.click(a, { force: true });
    expect(one.panels()).toHaveLength(0);
    // The arrow keys skip it.
    await userEvent.click(b);
    await expect.poll(() => one.panels()).toHaveLength(1);
  });

  test("horizontal: items side by side, the panel's width moves, and it works once", async () => {
    const { triggers, panels, items, group } = await mount(
      <div style={{ "--ow-motion-scale": 3 } as CSSProperties}>
        <Accordion.Root orientation="horizontal">
          {["one", "two"].map((value) => (
            <Accordion.Item key={value} value={value}>
              <Accordion.Trigger>Item {value}</Accordion.Trigger>
              <Accordion.Panel>
                <div style={{ inlineSize: 140 }}>Content</div>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>,
    );
    expect(getComputedStyle(group).flexDirection).toBe("row");
    const [a, b] = items() as [HTMLElement, HTMLElement];
    expect(b.getBoundingClientRect().left).toBeGreaterThan(a.getBoundingClientRect().right - 1);
    expect(getComputedStyle(b).borderInlineStartWidth).toBe("1px");
    expect(getComputedStyle(b).borderTopWidth).toBe("0px");
    await userEvent.click(triggers()[0] as HTMLElement);
    await expect.poll(() => transitions(panels()[0] as HTMLElement).length).toBeGreaterThan(0);
    const names = transitions(panels()[0] as HTMLElement).map((x) => x.transitionProperty);
    expect(names.some((name) => name === "inline-size" || name === "width")).toBe(true);
    await settle();
    // 140 wide, plus the content's 4px each side.
    expect(panels()[0]?.getBoundingClientRect().width).toBe(148);
    expect(panels()[0]?.style.getPropertyValue("--accordion-panel-width")).toBe("auto");
  });

  test("nested accordions keep their own orientation, whichever way they nest", async () => {
    const Inner = ({ orientation }: { orientation: "horizontal" | "vertical" }) => (
      <Accordion.Root orientation={orientation} defaultValue={["i"]}>
        {["i", "j"].map((value) => (
          <Accordion.Item key={value} value={value}>
            <Accordion.Trigger>{`Inner ${value}`}</Accordion.Trigger>
            <Accordion.Panel>
              <div style={{ inlineSize: 80 }}>Inner content</div>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    );
    const nest = (outer: "horizontal" | "vertical", inner: "horizontal" | "vertical") => (
      <div style={{ inlineSize: 600 }}>
        <Accordion.Root orientation={outer} defaultValue={["o"]}>
          <Accordion.Item value="o">
            <Accordion.Trigger>Outer</Accordion.Trigger>
            <Accordion.Panel>
              <Inner orientation={inner} />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    );
    for (const [outer, inner] of [
      ["horizontal", "vertical"],
      ["vertical", "horizontal"],
    ] as const) {
      const { screen } = await mount(nest(outer, inner));
      await settle();
      const roots = [...screen.container.querySelectorAll<HTMLElement>(".ow-accordion")];
      const [first, second] = roots as [HTMLElement, HTMLElement];
      for (const [group, direction] of [
        [first, outer],
        [second, inner],
      ] as const) {
        const own = (selector: string) =>
          [...group.querySelectorAll<HTMLElement>(selector)].filter(
            (el) => el.closest(".ow-accordion") === group,
          );
        const sideways = direction === "horizontal";
        expect(getComputedStyle(group).flexDirection).toBe(sideways ? "row" : "column");
        for (const item of own(".ow-accordion__item")) {
          expect(getComputedStyle(item).display).toBe(sideways ? "flex" : "block");
        }
        for (const trigger of own(".ow-accordion__trigger")) {
          // A vertical row is as wide as its accordion; a horizontal one is as wide as its label.
          const full =
            trigger.getBoundingClientRect().width >= group.getBoundingClientRect().width - 1;
          expect(full).toBe(!sideways);
          expect(getComputedStyle(trigger).whiteSpace).toBe(sideways ? "nowrap" : "normal");
        }
        for (const panel of own(".ow-accordion__panel")) {
          const style = getComputedStyle(panel);
          expect(style.transitionProperty.includes("inline-size")).toBe(sideways);
        }
      }
      const separators = [...screen.container.querySelectorAll<HTMLElement>(".ow-accordion")].map(
        (group) =>
          [...group.querySelectorAll<HTMLElement>(".ow-accordion__item + .ow-accordion__item")]
            .filter((el) => el.closest(".ow-accordion") === group)
            .map((el) => [
              getComputedStyle(el).borderTopWidth,
              getComputedStyle(el).borderLeftWidth,
            ]),
      );
      expect(separators[0]?.[0] ?? ["-", "-"]).toEqual(["-", "-"]); // the outer has one item
      expect(separators[1]?.[0]).toEqual(inner === "horizontal" ? ["0px", "1px"] : ["1px", "0px"]);
    }
  });

  test("right to left: the label at the right and the chevron at the left", async () => {
    const screen = await render(
      <div dir="rtl" style={{ inlineSize: 320 }}>
        <Three />
      </div>,
    );
    const trigger = screen.container.querySelector(".ow-accordion__trigger") as HTMLElement;
    const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
    const box = trigger.getBoundingClientRect();
    expect(icon.getBoundingClientRect().left).toBeLessThan(box.left + 20);
  });

  test("more contrast brings the hairlines back at 3:1", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { items } = await mount(<Three />);
    const sideways = await mount(<Three orientation="horizontal" />);
    await commands.setContrast("more");
    const border = getComputedStyle(items()[1] as HTMLElement).borderTopColor;
    expect(border).toBe(resolve("var(--ow-edge)"));
    expect(getComputedStyle(sideways.items()[1] as HTMLElement).borderInlineStartColor).toBe(
      resolve("var(--ow-edge)"),
    );
    expect(contrast(composite(border), composite(resolve("var(--ow-bg)")))).toBeGreaterThanOrEqual(
      3,
    );
  });

  test("forced colors: the ring is Highlight, a disabled row is GrayText, the hairline stays", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { triggers, items } = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b" disabled>
          <Accordion.Trigger>B</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    await commands.setForcedColors("active");
    await userEvent.tab();
    expect(document.activeElement).toBe(triggers()[0]);
    await expect
      .poll(() => getComputedStyle(triggers()[0] as HTMLElement).outlineColor)
      .toBe(resolve("Highlight"));
    expect(getComputedStyle(triggers()[1] as HTMLElement).color).toBe(resolve("GrayText"));
    expect(getComputedStyle(items()[1] as HTMLElement).borderTopStyle).toBe("solid");
    expect(getComputedStyle(items()[1] as HTMLElement).borderTopWidth).toBe("1px");
  });

  test("contrast: the label 4.5:1, the muted chevron 3:1, the hairline visible, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { triggers, items } = await mount(<Three />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const page = composite(resolve("var(--ow-bg)"));
      const trigger = triggers()[0] as HTMLElement;
      const label = composite(getComputedStyle(trigger).color);
      expect(contrast(label, page)).toBeGreaterThanOrEqual(4.5);
      const icon = trigger.querySelector(".ow-accordion__icon") as HTMLElement;
      const chevron = composite(getComputedStyle(icon).color);
      expect(contrast(chevron, page)).toBeGreaterThanOrEqual(3);
      const line = composite(getComputedStyle(items()[1] as HTMLElement).borderTopColor);
      expect(line).not.toEqual(page);
    }
  });

  test("passes className, style, render, and ref through on every part", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      header: createRef<HTMLHeadingElement>(),
      trigger: createRef<HTMLButtonElement>(),
      panel: createRef<HTMLDivElement>(),
    };
    const { group, items, headers, triggers, panels } = await mount(
      <Accordion.Root
        ref={refs.root}
        defaultValue={["a"]}
        className="mine"
        style={{ marginInline: "3px" }}
      >
        <Accordion.Item ref={refs.item} value="a" className="i">
          <Accordion.Header ref={refs.header} className="h">
            <Accordion.Trigger ref={refs.trigger} className="t" style={{ opacity: 0.9 }}>
              A
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel ref={refs.panel} className="p" render={<section />}>
            x
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(refs.root.current).toBe(group);
    expect(refs.item.current).toBe(items()[0]);
    expect(refs.header.current).toBe(headers()[0]);
    expect(refs.trigger.current).toBe(triggers()[0]);
    expect(refs.panel.current).toBe(panels()[0]);
    expect(panels()[0]?.tagName).toBe("SECTION");
    expect(group.className).toBe("ow-accordion mine");
    expect(items()[0]?.className).toBe("ow-accordion__item i");
    expect(headers()[0]?.className).toBe("ow-accordion__header h");
    expect(triggers()[0]?.className).toBe("ow-accordion__trigger ow-accordion__trigger--md t");
    expect(panels()[0]?.className).toBe("ow-accordion__panel p");
    expect(group.style.marginInline).toBe("3px");
  });

  test("a theme token set on the group changes it alone", async () => {
    const { triggers } = await mount(
      <Accordion.Root style={{ "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties}>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(getComputedStyle(triggers()[0] as HTMLElement).color).toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".brand { color: rgb(1, 2, 3); } .brand-item { border-color: rgb(4, 5, 6); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { triggers, items } = await mount(
      <Accordion.Root>
        <Accordion.Item value="a">
          <Accordion.Trigger className="brand">A</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b" className="brand-item">
          <Accordion.Trigger>B</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(getComputedStyle(triggers()[0] as HTMLElement).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(items()[1] as HTMLElement).borderTopColor).toBe("rgb(4, 5, 6)");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Accordion.Root defaultValue={["a"]}>
        <Accordion.Item value="a">
          <Accordion.Trigger>A</Accordion.Trigger>
          <Accordion.Panel>x</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );
    expect(html).toContain("ow-accordion__trigger");
    expect(html).toContain("<h3");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, open, closed, disabled, in every size", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 320 }}>
        <Three defaultValue={["one"]} />
        <Three size="sm" multiple defaultValue={["one", "two"]} />
        <Three size="lg" disabled />
        <Three keepMounted />
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
    <Accordion.Root defaultValue={["a"]}>
      <Accordion.Item value="a">
        <Accordion.Trigger>A</Accordion.Trigger>
        <Accordion.Panel>x</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>,
  );
  await settle();
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "accordion",
    "accordion-item",
    "accordion-header",
    "accordion-trigger",
    "accordion-icon",
    "accordion-panel",
    "accordion-content",
  ]);
});
