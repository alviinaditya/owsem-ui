import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Field } from "@base-ui/react/field";
import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Select, type SelectRootProps } from "./index";

const root = document.documentElement;

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "mango", label: "Mango" },
];
const MANY = Array.from({ length: 40 }, (_, i) => ({
  value: `v${i}`,
  label: `Option ${i}`,
}));

/** The shortest usage: a name, and items. */
function Fruits({
  popupStyle,
  triggerStyle,
  triggerClass,
  items = FRUITS,
  ...props
}: Omit<SelectRootProps<string>, "items"> & {
  popupStyle?: CSSProperties;
  triggerStyle?: CSSProperties;
  triggerClass?: string;
  items?: readonly { value: string; label: string }[];
}) {
  return (
    <Select.Root items={items as { value: string; label: string }[]} {...props}>
      <Select.Trigger
        aria-label="Fruit"
        placeholder="Pick a fruit"
        style={{ margin: 80, ...triggerStyle }}
        {...(triggerClass ? { className: triggerClass } : {})}
      />
      <Select.Popup {...(popupStyle ? { style: popupStyle } : {})}>
        {items.map((item) => (
          <Select.Item key={item.value} value={item.value} disabled={item.value === "banana"}>
            {item.label}
          </Select.Item>
        ))}
      </Select.Popup>
    </Select.Root>
  );
}

/** Written out, to open beside the trigger. */
function Beside() {
  return (
    <Select.Root defaultValue="a">
      <Select.Trigger aria-label="Letter" style={{ margin: 80 }} />
      <Select.Portal>
        <Select.Positioner alignItemWithTrigger={false}>
          <Select.Popup>
            <Select.Item value="a">A</Select.Item>
            <Select.Item value="b">B</Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

const trigger = () => document.querySelector<HTMLElement>(".ow-select__trigger") as HTMLElement;
const popup = () => document.querySelector<HTMLElement>(".ow-select__popup:not([hidden])");
const shown = () => {
  const el = popup();
  return el && el.closest("[hidden]") === null ? el : null;
};
const list = () => document.querySelector<HTMLElement>(".ow-select__list") as HTMLElement;
const item = (name: string) => {
  const el = [...document.querySelectorAll<HTMLElement>(".ow-select__item")].find(
    (candidate) => candidate.textContent?.trim() === name,
  );
  if (!el) throw new Error(`no item ${name}`);
  return el;
};
const lit = () => document.querySelector("[data-glide-active]")?.textContent;

/** Resolves a value (e.g. `var(--ow-raised-bg)`) of `property` to its computed form in `scope`. */
function resolve(property: "color" | "box-shadow", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

/** The trigger's tints: at rest, hovered or open, and invalid (the critical tone). */
const REST = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const HOVER = "color-mix(in oklab, var(--ow-fg) 9%, transparent)";
const INVALID = "color-mix(in oklab, var(--ow-critical) 14%, transparent)";
const NO_SHADOW = "none";

const opened = () => expect.poll(shown).not.toBeNull();
const gone = () => expect.poll(shown, { timeout: 1000 }).toBeNull();

/** Backdrops on show; a shut select may keep its parts mounted, hidden. */
const backdrops = () =>
  [...document.querySelectorAll<HTMLElement>(".ow-select__backdrop")].filter(
    (el) => el.closest("[hidden]") === null,
  );
/** Whether a wheel turned over `target` was held back. */
const held = (target: Element = document.body) =>
  !target.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }));
/** The page's own style attributes, which the lock leaves alone. */
const pageStyle = () => [root.getAttribute("style"), document.body.getAttribute("style")];

/** A button away from the select, in the window's corner. */
function Behind({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ position: "fixed", right: 20, bottom: 20 }}>
      Behind
    </button>
  );
}

/** Presses the page where `el` is, whatever lies over it. */
async function pressAt(el: Element) {
  const box = el.getBoundingClientRect();
  const page = document.body.getBoundingClientRect();
  await userEvent.click(document.body, {
    position: { x: box.left + box.width / 2 - page.left, y: box.top + box.height / 2 - page.top },
  });
}

describe("Select", () => {
  test("the shortest usage draws the rest: value, icon, list, indicator, and check", async () => {
    await render(<Fruits defaultValue="cherry" />);
    expect(trigger().getAttribute("role")).toBe("combobox");
    expect(trigger().getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger().getAttribute("aria-label")).toBe("Fruit");
    expect(trigger().querySelector(".ow-select__value")?.textContent).toBe("Cherry");
    const icon = trigger().querySelector(".ow-select__icon");
    expect(icon?.querySelectorAll("svg path")).toHaveLength(2);
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    await userEvent.click(trigger());
    await opened();
    expect(list().getAttribute("role")).toBe("listbox");
    // Portaled, inside a Positioner.
    expect(shown()?.parentElement?.className).toBe("ow-select__positioner");
    expect(trigger().contains(shown())).toBe(false);
    const cherry = item("Cherry");
    expect(cherry.getAttribute("role")).toBe("option");
    expect(cherry.getAttribute("aria-selected")).toBe("true");
    expect(cherry.querySelector(".ow-select__item-text")?.textContent).toBe("Cherry");
    expect(cherry.querySelector(".ow-select__item-indicator svg")).not.toBeNull();
    // The text first, the check at the end, where the trigger's icon is.
    expect([...cherry.children].map((part) => part.className)).toEqual([
      "ow-select__item-text",
      "ow-select__item-indicator",
    ]);
    await userEvent.click(item("Mango"));
    await gone();
    expect(trigger().textContent).toBe("Mango");
    expect(document.activeElement).toBe(trigger());
  });

  test("explicit parts replace each default", async () => {
    await render(
      <Select.Root defaultValue="a">
        <Select.Label>Letter</Select.Label>
        <Select.Trigger>
          <Select.Value>{(value: string) => `Letter ${value}`}</Select.Value>
          <Select.Icon>
            <i>v</i>
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Backdrop />
          <Select.Positioner>
            <Select.Popup>
              <Select.List className="mine">
                <Select.Item value="a">
                  <Select.ItemText>A</Select.ItemText>
                  <Select.ItemIndicator>
                    <b>on</b>
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item value="b">
                  <Select.ItemIndicator />
                  <em>icon</em>
                  <Select.ItemText>B</Select.ItemText>
                </Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    expect(trigger().textContent).toBe("Letter av");
    // The label names the trigger.
    expect(trigger().getAttribute("aria-labelledby")).toBe(
      document.querySelector(".ow-select__label")?.id,
    );
    await userEvent.click(trigger());
    await opened();
    // One List, the explicit one, with no scroll arrows added beside it.
    expect(document.querySelectorAll(".ow-select__list")).toHaveLength(1);
    expect(list().classList.contains("mine")).toBe(true);
    expect(document.querySelector(".ow-select__scroll-down-arrow")).toBeNull();
    // One Positioner, and items as written.
    expect(document.querySelectorAll(".ow-select__positioner")).toHaveLength(1);
    const first = list().querySelector(".ow-select__item") as HTMLElement;
    expect(first.firstElementChild?.className).toBe("ow-select__item-text");
    expect(first.textContent).toBe("Aon");
    expect(document.querySelectorAll(".ow-select__item-text")).toHaveLength(2);
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("a List in a fragment still counts as written out", async () => {
    await render(
      <Select.Root defaultValue="a">
        <Select.Trigger aria-label="Letter" />
        <Select.Popup>
          {/* biome-ignore lint/complexity/noUselessFragments: the case under test */}
          <>
            <Select.ScrollUpArrow />
            <Select.List className="mine">
              <Select.Item value="a">A</Select.Item>
            </Select.List>
            <Select.ScrollDownArrow />
          </>
        </Select.Popup>
      </Select.Root>,
    );
    await userEvent.click(trigger());
    await opened();
    expect(document.querySelectorAll(".ow-select__list")).toHaveLength(1);
    expect(list().classList.contains("mine")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("the keyboard opens it, moves, types ahead, picks, and shuts it", async () => {
    await render(<Fruits defaultValue="apple" />);
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    await opened();
    await expect.poll(() => document.activeElement).toBe(item("Apple"));
    await userEvent.keyboard("{End}");
    await expect.poll(() => document.activeElement).toBe(item("Mango"));
    await userEvent.keyboard("{Home}");
    await expect.poll(() => document.activeElement).toBe(item("Apple"));
    await userEvent.keyboard("c");
    await expect.poll(() => document.activeElement).toBe(item("Cherry"));
    await new Promise((done) => setTimeout(done, 800));
    await userEvent.keyboard("{Enter}");
    await gone();
    expect(trigger().textContent).toBe("Cherry");
    expect(document.activeElement).toBe(trigger());
    await userEvent.keyboard("{Enter}");
    await opened();
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(trigger().textContent).toBe("Cherry");
    expect(document.activeElement).toBe(trigger());
    await userEvent.keyboard("{Enter}");
    await opened();
    await userEvent.keyboard("{Tab}");
    await gone();
    expect(trigger().textContent).toBe("Cherry");
  });

  test("Glide lights the item under the pointer and the one the keyboard reaches", async () => {
    await render(<Fruits defaultValue="apple" />);
    await userEvent.click(trigger());
    await opened();
    // Opening highlights the selected item.
    await expect.poll(lit).toBe("Apple");
    await userEvent.hover(item("Cherry"));
    await expect.poll(lit).toBe("Cherry");
    const highlight = list().querySelector<HTMLElement>(".ow-glide") as HTMLElement;
    expect(highlight.hasAttribute("data-visible")).toBe(true);
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("Mango");
    expect(document.activeElement).toBe(item("Mango"));
    // The pointer passes a disabled item by; the keyboard reaches it, so it can be found.
    await userEvent.hover(item("Apple"));
    await expect.poll(lit).toBe("Apple");
    await userEvent.hover(item("Banana"));
    await settle();
    expect(lit()).toBe("Apple");
    await userEvent.hover(document.body, { position: { x: 2, y: 2 } });
    await userEvent.keyboard("{Home}");
    await expect.poll(lit).toBe("Apple");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("Banana");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("a reopened list lights the selected item, wherever the pointer went", async () => {
    await render(<Fruits defaultValue="apple" />);
    await userEvent.click(trigger());
    await opened();
    await userEvent.click(item("Cherry"));
    await gone();
    await userEvent.hover(document.body, { position: { x: 2, y: 2 } });
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await opened();
    await expect.poll(() => document.activeElement).toBe(item("Cherry"));
    await expect.poll(lit).toBe("Cherry");
    await settle();
    expect(lit()).toBe("Cherry");
    const box = item("Cherry").getBoundingClientRect();
    const glow = list().querySelector(".ow-glide")?.getBoundingClientRect();
    expect(glow?.top).toBeCloseTo(box.top, 0);
  });

  test("controlled and uncontrolled, in a plain form with a name", async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>("apple");
      return (
        <form aria-label="Order">
          <Fruits name="fruit" value={value} onValueChange={setValue} />
          <output>{value}</output>
        </form>
      );
    }
    await render(<Controlled />);
    const data = () => new FormData(document.querySelector("form") as HTMLFormElement).get("fruit");
    expect(data()).toBe("apple");
    await userEvent.click(trigger());
    await opened();
    await userEvent.click(item("Mango"));
    await gone();
    expect(document.querySelector("output")?.textContent).toBe("mango");
    expect(data()).toBe("mango");
  });

  test("placeholder: muted through Base UI's state, until something is picked", async () => {
    await render(<Fruits />);
    const value = trigger().querySelector(".ow-select__value") as HTMLElement;
    expect(value.textContent).toBe("Pick a fruit");
    expect(value.hasAttribute("data-placeholder")).toBe(true);
    expect(getComputedStyle(value).color).toBe(resolve("color", "var(--ow-muted)"));
    await userEvent.click(trigger());
    await opened();
    await userEvent.click(item("Apple"));
    await gone();
    expect(value.hasAttribute("data-placeholder")).toBe(false);
    expect(getComputedStyle(value).color).toBe(resolve("color", "var(--ow-fg)"));
  });

  test("disabled does not open, and invalid takes the critical tint with no edge", async () => {
    await render(
      <>
        <Fruits disabled defaultValue="apple" />
        <Field.Root invalid>
          <Select.Root defaultValue="a">
            <Select.Trigger aria-label="Field" data-testid="field" />
            <Select.Popup>
              <Select.Item value="a">A</Select.Item>
            </Select.Popup>
          </Select.Root>
        </Field.Root>
        <Select.Root defaultValue="a">
          <Select.Trigger aria-label="Alone" aria-invalid="true" data-testid="alone" />
          <Select.Popup>
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Root>
      </>,
    );
    expect(trigger().hasAttribute("data-disabled")).toBe(true);
    expect(getComputedStyle(trigger()).opacity).toBe("0.5");
    expect(getComputedStyle(trigger()).cursor).toBe("not-allowed");
    await userEvent.click(trigger(), { force: true });
    await settle();
    expect(shown()).toBeNull();
    const style = (id: string) =>
      getComputedStyle(document.querySelector(`[data-testid="${id}"]`) as HTMLElement);
    const critical = resolve("color", INVALID);
    expect(document.querySelector('[data-testid="field"]')?.hasAttribute("data-invalid")).toBe(
      true,
    );
    for (const id of ["field", "alone"]) {
      expect(style(id).backgroundColor).toBe(critical);
      expect(style(id).boxShadow).toBe(NO_SHADOW);
    }
    expect(getComputedStyle(trigger()).backgroundColor).not.toBe(critical);
  });

  test("a trigger that becomes invalid shakes once, and blinks instead under reduced motion", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    const Pick = ({ invalid }: { invalid?: boolean }) => (
      <Select.Root defaultValue="a">
        <Select.Trigger aria-label="Pick" aria-invalid={invalid || undefined} />
        <Select.Popup>
          <Select.Item value="a">A</Select.Item>
        </Select.Popup>
      </Select.Root>
    );
    const screen = await render(<Pick />);
    const el = screen.getByRole("combobox").element() as HTMLElement;
    expect(getComputedStyle(el).animationName).toBe("none");
    await screen.rerender(<Pick invalid />);
    const style = getComputedStyle(el);
    expect(style.animationName).toBe("ow-select-shake");
    expect(style.animationDuration).toBe("0.32s");
    expect(style.willChange).toBe("transform");
    const shake = el.getAnimations()[0] as Animation;
    shake.pause();
    const x = (ms: number) => {
      shake.currentTime = ms;
      return new DOMMatrix(getComputedStyle(el).transform).m41;
    };
    expect([0, 64, 128, 192, 256, 320].map(x)).toEqual([0, -4, 4, -2, 2, 0]);
    shake.cancel();
    await commands.setReducedMotion("reduce");
    await screen.rerender(<Pick />);
    await screen.rerender(<Pick invalid />);
    expect(getComputedStyle(el).animationName).toBe("ow-select-blink");
    expect(getComputedStyle(el).animationDuration).toBe("0.16s");
    expect(getComputedStyle(el).transform).toBe("none");
  });

  test("a trigger invalid on first render stays still", async () => {
    const screen = await render(
      <Select.Root defaultValue="a">
        <Select.Trigger aria-label="Pick" aria-invalid="true" />
        <Select.Popup>
          <Select.Item value="a">A</Select.Item>
        </Select.Popup>
      </Select.Root>,
    );
    const el = screen.getByRole("combobox").element() as HTMLElement;
    await settle();
    expect(getComputedStyle(el).animationName).toBe("none");
    expect(el.getAnimations()).toEqual([]);
  });

  test("multiple: picks add up, the popup stays open beside the trigger, checks show", async () => {
    await render(
      <Select.Root items={FRUITS} multiple defaultValue={["apple"]}>
        <Select.Trigger aria-label="Fruits" />
        <Select.Popup>
          {FRUITS.map((fruit) => (
            <Select.Item key={fruit.value} value={fruit.value}>
              {fruit.label}
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>,
    );
    expect(trigger().textContent).toBe("Apple");
    await userEvent.click(trigger());
    await opened();
    expect(list().getAttribute("aria-multiselectable")).toBe("true");
    // Not over the trigger, which keeps adding up the picks in view.
    await expect.poll(() => shown()?.getAttribute("data-side")).toBe("bottom");
    await userEvent.click(item("Mango"));
    expect(trigger().textContent).toBe("Apple, Mango");
    expect(shown()).not.toBeNull();
    const check = (name: string) =>
      getComputedStyle(item(name).querySelector(".ow-select__item-indicator > svg") as Element)
        .opacity;
    expect(check("Apple")).toBe("1");
    await expect.poll(() => check("Mango")).toBe("1");
    expect(check("Cherry")).toBe("0");
    await userEvent.click(item("Apple"));
    expect(trigger().textContent).toBe("Mango");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("a long list scrolls, with arrows that show while there is more", async () => {
    await render(<Fruits items={MANY} defaultValue="v0" />);
    await userEvent.click(trigger());
    await opened();
    const down = () => document.querySelector<HTMLElement>(".ow-select__scroll-down-arrow");
    const up = () => document.querySelector<HTMLElement>(".ow-select__scroll-up-arrow");
    await expect.poll(down).not.toBeNull();
    expect(up()).toBeNull();
    expect(down()?.getAttribute("aria-hidden")).toBe("true");
    expect(down()?.querySelector("svg")).not.toBeNull();
    expect(getComputedStyle(down() as HTMLElement).color).toBe(resolve("color", "var(--ow-muted)"));
    // The scrollbar gives way to the arrows.
    expect(list().classList.contains("base-ui-disable-scrollbar")).toBe(true);
    // Base UI grows the popup by what is scrolled, and scrolls the list once it cannot grow.
    await expect
      .poll(() => {
        list().scrollTop = 200;
        return up();
      })
      .not.toBeNull();
    // The highlight scrolls with the items, inside the list.
    expect(list().querySelector(".ow-glide")).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("beside its trigger it grows: 0.96 and transparent to full, 180 ms ease-out", async () => {
    const runs: { property: string; frames: Keyframe[]; timing: string }[] = [];
    const onRun = (event: TransitionEvent) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("ow-select__popup")) return;
      const transition = target
        .getAnimations()
        .find((a) => (a as CSSTransition).transitionProperty === event.propertyName);
      const effect = transition?.effect as KeyframeEffect | undefined;
      const { transitionDuration, transitionDelay } = getComputedStyle(target);
      runs.push({
        property: event.propertyName,
        frames: effect?.getKeyframes() ?? [],
        timing: `${transitionDuration} after ${transitionDelay}`,
      });
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Beside />);
    await userEvent.click(trigger());
    await expect.poll(() => runs.length).toBe(2);
    expect(runs.find((run) => run.property === "transform")?.frames[0]?.transform).toBe(
      "scale(0.96)",
    );
    expect(runs.find((run) => run.property === "opacity")?.frames[0]?.opacity).toBe("0");
    const style = getComputedStyle(shown() as HTMLElement);
    expect(style.transitionDuration).toBe("0.18s, 0.18s");
    expect(style.transitionTimingFunction).toBe(
      "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1)",
    );
    expect(style.willChange).toBe("transform");
    runs.length = 0;
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.poll(() => runs.length).toBe(2);
    // Leaving is quicker, after a beat that lets a pick's check land.
    expect(runs.map((run) => run.timing)).toEqual(["0.14s after 0.06s", "0.14s after 0.06s"]);
    await gone();
  });

  test("a pick's check fades and scales in on the settle spring", async () => {
    const runs: string[] = [];
    const onRun = (event: TransitionEvent) => {
      if (
        (event.target as Element).parentElement?.classList.contains("ow-select__item-indicator")
      ) {
        runs.push(event.propertyName);
      }
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    // Multiple, so the popup stays open to show the pick.
    await render(
      <Select.Root items={FRUITS} multiple defaultValue={["apple"]}>
        <Select.Trigger aria-label="Fruits" />
        <Select.Popup>
          {FRUITS.map((fruit) => (
            <Select.Item key={fruit.value} value={fruit.value}>
              {fruit.label}
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>,
    );
    await userEvent.click(trigger());
    await opened();
    const check = (name: string) =>
      getComputedStyle(item(name).querySelector(".ow-select__item-indicator > svg") as Element);
    // Unpicked, it keeps its room, so the labels stay in line.
    expect(check("Cherry").opacity).toBe("0");
    expect(check("Cherry").transform).toBe("matrix(0.6, 0, 0, 0.6, 0, 0)");
    expect(check("Cherry").transitionDuration).toBe("0.12s, 0.573s");
    expect(check("Apple").opacity).toBe("1");
    expect(check("Apple").transform).toBe("none");
    await settle();
    runs.length = 0;
    await userEvent.click(item("Cherry"));
    await expect.poll(() => check("Cherry").opacity).toBe("1");
    await expect.poll(() => check("Cherry").transform).toBe("none");
    expect(runs.sort()).toEqual(["opacity", "transform"]);
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("over its trigger it only fades, so the text stays put", async () => {
    const runs: string[] = [];
    const onRun = (event: TransitionEvent) => {
      if ((event.target as HTMLElement).classList.contains("ow-select__popup")) {
        runs.push(event.propertyName);
      }
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Fruits defaultValue="cherry" />);
    await userEvent.click(trigger());
    await expect.poll(() => runs).toContain("opacity");
    expect(shown()?.getAttribute("data-side")).toBe("none");
    await settle();
    expect(runs).toEqual(["opacity"]);
    // No layer of its own: it would land the text a device pixel off at a fractional zoom.
    const style = getComputedStyle(shown() as HTMLElement);
    expect(style.willChange).toBe("auto");
    expect(style.transform).toBe("none");
  });

  test("from the keyboard it opens and shuts at once (data-instant)", async () => {
    await render(<Fruits defaultValue="apple" />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await opened();
    expect(shown()?.hasAttribute("data-instant")).toBe(true);
    expect(getComputedStyle(shown() as HTMLElement).transitionProperty).toBe("none");
    await userEvent.keyboard("{Escape}");
    await gone();
    // A mouse animates again.
    await userEvent.click(trigger());
    await opened();
    expect(shown()?.hasAttribute("data-instant")).toBe(false);
    await expect
      .poll(() => getComputedStyle(shown() as HTMLElement).transitionProperty)
      .toBe("opacity");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("under reduced motion it fades without growing (FR-20)", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    let fades = 0;
    let transforms = 0;
    const onRun = (event: TransitionEvent) => {
      if (!(event.target as HTMLElement).classList.contains("ow-select__popup")) return;
      if (event.propertyName === "opacity") fades++;
      if (event.propertyName === "transform") transforms++;
    };
    document.addEventListener("transitionrun", onRun);
    onTestFinished(() => document.removeEventListener("transitionrun", onRun));
    await render(<Beside />);
    await userEvent.click(trigger());
    await expect.poll(() => fades).toBe(1);
    await settle();
    expect(transforms).toBe(0);
  });

  test("passes className, style, render, and ref through its parts (FR-2, FR-5)", async () => {
    const refs = {
      label: createRef<HTMLDivElement>(),
      trigger: createRef<HTMLButtonElement>(),
      value: createRef<HTMLSpanElement>(),
      icon: createRef<HTMLSpanElement>(),
      positioner: createRef<HTMLDivElement>(),
      popup: createRef<HTMLDivElement>(),
      list: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      text: createRef<HTMLDivElement>(),
      indicator: createRef<HTMLSpanElement>(),
      group: createRef<HTMLDivElement>(),
      groupLabel: createRef<HTMLDivElement>(),
      separator: createRef<HTMLDivElement>(),
    };
    await render(
      <Select.Root defaultOpen defaultValue="a" size="lg">
        <Select.Label ref={refs.label} className="l">
          Letter
        </Select.Label>
        <Select.Trigger ref={refs.trigger} className="t" style={{ zIndex: 2 }}>
          <Select.Value ref={refs.value} className="v" />
          <Select.Icon ref={refs.icon} className="c" render={<b />} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner ref={refs.positioner} className="p">
            <Select.Popup ref={refs.popup} className="u" style={{ zIndex: 3 }}>
              <Select.List ref={refs.list} className="s">
                <Select.Group ref={refs.group}>
                  <Select.GroupLabel ref={refs.groupLabel} className="g">
                    Group
                  </Select.GroupLabel>
                  <Select.Item ref={refs.item} value="a" className="i" render={<section />}>
                    <Select.ItemIndicator ref={refs.indicator} className="n" />
                    <Select.ItemText ref={refs.text} className="x">
                      A
                    </Select.ItemText>
                  </Select.Item>
                </Select.Group>
                <Select.Separator ref={refs.separator} className="e" />
                <Select.Item value="b">B</Select.Item>
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );
    await expect.poll(() => refs.popup.current).not.toBeNull();
    expect(refs.label.current?.className).toBe("ow-select__label l");
    expect(refs.trigger.current?.className).toBe("ow-select__trigger ow-select__trigger--lg t");
    expect(refs.trigger.current?.style.zIndex).toBe("2");
    expect(refs.trigger.current?.dataset.size).toBe("lg");
    expect(refs.value.current?.className).toBe("ow-select__value v");
    expect(refs.icon.current?.className).toBe("ow-select__icon c");
    expect(refs.icon.current?.tagName).toBe("B");
    expect(refs.positioner.current?.className).toBe("ow-select__positioner p");
    expect(refs.popup.current?.className).toBe("ow-select__popup ow-select__popup--lg u");
    expect(refs.popup.current?.style.zIndex).toBe("3");
    expect(refs.popup.current?.dataset.size).toBe("lg");
    expect(refs.list.current?.classList.contains("ow-select__list")).toBe(true);
    expect(refs.list.current?.classList.contains("s")).toBe(true);
    expect(refs.item.current?.className).toBe("ow-select__item i");
    expect(refs.item.current?.tagName).toBe("SECTION");
    expect(refs.text.current?.className).toBe("ow-select__item-text x");
    expect(refs.indicator.current?.className).toBe("ow-select__item-indicator n");
    expect(refs.group.current?.getAttribute("role")).toBe("group");
    expect(refs.group.current?.getAttribute("aria-labelledby")).toBe(refs.groupLabel.current?.id);
    expect(refs.groupLabel.current?.className).toBe("ow-select__group-label g");
    expect(refs.separator.current?.className).toBe("ow-select__separator e");
  });

  test("the field is a tint of the text color with no shadow or edge, deeper while open; the popup is raised, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <>
        <Fruits defaultValue="apple" />
        <p>Away</p>
        <Select.Root open modal={false} defaultValue="a">
          <Select.Trigger aria-label="Open" data-testid="open" />
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup>
                <Select.Item value="a">A</Select.Item>
                <Select.Separator />
                <Select.Item value="b">B</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </>,
    );
    await opened();
    // The pointer may still rest where an earlier test left it, over the trigger.
    await userEvent.hover(screen.getByText("Away"));
    const open = document.querySelector('[data-testid="open"]') as HTMLElement;
    const line = document.querySelector(".ow-select__separator") as HTMLElement;
    const a = item("A");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const field = getComputedStyle(trigger());
      expect(field.backgroundColor).toBe(resolve("color", REST));
      expect(field.boxShadow).toBe(NO_SHADOW);
      expect(field.color).toBe(resolve("color", "var(--ow-fg)"));
      // Its popup open, a deeper tint, still with no shadow or edge.
      expect(open.hasAttribute("data-popup-open")).toBe(true);
      expect(getComputedStyle(open).backgroundColor).toBe(resolve("color", HOVER));
      expect(getComputedStyle(open).boxShadow).toBe(NO_SHADOW);
      const surface = getComputedStyle(shown() as HTMLElement);
      expect(surface.backgroundColor).toBe(resolve("color", "var(--ow-raised-bg)"));
      expect(surface.boxShadow).toBe(resolve("box-shadow", "var(--ow-popup-shadow)"));
      expect(getComputedStyle(a).color).toBe(resolve("color", "var(--ow-fg)"));
      // The separator is one hairline.
      expect(getComputedStyle(line).borderTopWidth).toBe("1px");
      expect(getComputedStyle(line).borderTopColor).toBe(resolve("color", "var(--ow-line)"));
      expect(getComputedStyle(line).borderBottomWidth).toBe("0px");
    }
  });

  test("hover steps the fill up, keyboard focus adds the ring, and more contrast draws the edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const screen = await render(
      <>
        <button type="button">Before</button>
        <Fruits defaultValue="apple" />
        <p>Away</p>
      </>,
    );
    const away = screen.getByText("Away");
    await userEvent.hover(away);
    expect(getComputedStyle(trigger()).backgroundColor).toBe(resolve("color", REST));
    await userEvent.hover(trigger());
    expect(getComputedStyle(trigger()).backgroundColor).toBe(resolve("color", HOVER));
    await userEvent.hover(away);
    screen.getByRole("button", { name: "Before" }).element().focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(trigger());
    expect(getComputedStyle(trigger()).boxShadow).toBe(NO_SHADOW);
    expect(getComputedStyle(trigger()).outlineWidth).toBe("2px");
    expect(getComputedStyle(trigger()).outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    await commands.setContrast("more");
    expect(getComputedStyle(trigger()).boxShadow).toBe(
      resolve("box-shadow", "inset 0 0 0 1px var(--ow-edge)"),
    );
  });

  test("a theme token set on a part changes that part alone (TK-9)", async () => {
    await render(
      <Fruits
        defaultValue="apple"
        triggerStyle={
          {
            "--ow-fg": "rgb(7, 8, 9)",
            "--ow-raised-bg": "rgb(1, 2, 3)",
          } as CSSProperties
        }
        popupStyle={
          {
            "--ow-raised-bg": "rgb(10, 11, 12)",
            "--ow-popup-shadow": "none",
            "--ow-fg": "rgb(13, 14, 15)",
            "--ow-hover": "rgb(0, 128, 0)",
          } as CSSProperties
        }
      />,
    );
    await userEvent.hover(document.body, { position: { x: 2, y: 2 } });
    const field = getComputedStyle(trigger());
    // Its fill follows the surface color set here, and its text the text color.
    expect(field.backgroundColor).toBe(resolve("color", REST, trigger()));
    expect(field.backgroundColor).not.toBe(resolve("color", REST));
    expect(field.color).toBe("rgb(7, 8, 9)");
    await userEvent.click(trigger());
    await opened();
    expect(field.backgroundColor).toBe(resolve("color", HOVER, trigger()));
    const style = getComputedStyle(shown() as HTMLElement);
    expect(style.backgroundColor).toBe("rgb(10, 11, 12)");
    expect(style.boxShadow).toBe("none");
    expect(getComputedStyle(item("Cherry")).color).toBe("rgb(13, 14, 15)");
    await userEvent.hover(item("Cherry"));
    await expect.poll(lit).toBe("Cherry");
    const highlight = list().querySelector(".ow-glide") as HTMLElement;
    expect(getComputedStyle(highlight).backgroundColor).toBe("rgb(0, 128, 0)");
    // The trigger's tokens did not reach the popup, nor the popup's the trigger.
    expect(style.color).toBe("rgb(13, 14, 15)");
    expect(field.backgroundColor).toBe(resolve("color", HOVER, trigger()));
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("an unlayered rule on a className beats the component's own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = `
      .mine { inline-size: 100%; border-radius: 3px; background-color: rgb(1, 2, 3); --py: 1em; }
      .mine-popup { border-radius: 2px; background-color: rgb(4, 5, 6); }
    `;
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    await render(
      <div style={{ inlineSize: 400 }}>
        <Select.Root defaultValue="a">
          <Select.Trigger aria-label="Letter" className="mine" />
          <Select.Popup className="mine-popup">
            <Select.Item value="a">A</Select.Item>
          </Select.Popup>
        </Select.Root>
      </div>,
    );
    // It has no width of its own, so it stretches with plain CSS; the icon stays at the end.
    const field = trigger();
    expect(field.getBoundingClientRect().width).toBeCloseTo(400, 1);
    const style = getComputedStyle(field);
    expect(style.borderTopLeftRadius).toBe("3px");
    expect(style.backgroundColor).toBe("rgb(1, 2, 3)");
    expect(style.paddingTop).toBe("14px");
    const icon = field.querySelector(".ow-select__icon") as HTMLElement;
    expect(field.getBoundingClientRect().right - icon.getBoundingClientRect().right).toBeLessThan(
      20,
    );
    await userEvent.click(field);
    await opened();
    const surface = getComputedStyle(shown() as HTMLElement);
    expect(surface.borderTopLeftRadius).toBe("2px");
    expect(surface.backgroundColor).toBe("rgb(4, 5, 6)");
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("fits its value with no margin of its own", async () => {
    await render(
      <Select.Root defaultValue="A much longer label than the others">
        <Select.Trigger aria-label="Letter" />
        <Select.Popup>
          <Select.Item value="A much longer label than the others">Long</Select.Item>
        </Select.Popup>
      </Select.Root>,
    );
    const style = getComputedStyle(trigger());
    expect(style.marginTop).toBe("0px");
    expect(style.marginLeft).toBe("0px");
    const value = trigger().querySelector(".ow-select__value") as HTMLElement;
    expect(value.scrollWidth).toBe(value.clientWidth);
  });

  test("marks edges, the selected item, and the highlighted one in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Fruits defaultValue="cherry" />);
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await opened();
    await expect.poll(lit).toBe("Cherry");
    await commands.setForcedColors("active");
    expect(getComputedStyle(trigger()).outlineStyle).toBe("solid");
    expect(getComputedStyle(trigger()).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const style = getComputedStyle(shown() as HTMLElement);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    const check = item("Cherry").querySelector(".ow-select__item-indicator svg") as SVGElement;
    expect(getComputedStyle(check).stroke).not.toBe("none");
    expect(getComputedStyle(check.parentElement as HTMLElement).visibility).toBe("visible");
    const highlight = getComputedStyle(list().querySelector(".ow-glide") as HTMLElement);
    expect(highlight.outlineStyle).toBe("solid");
    expect(highlight.outlineWidth).toBe("2px");
    const ring = getComputedStyle(item("Cherry"));
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineWidth).toBe("2px");
  });

  test("follows the text direction into the portal (FR-16)", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl">
          <Fruits defaultValue="cherry" />
        </div>
      </DirectionProvider>,
    );
    const field = trigger();
    const icon = field.querySelector(".ow-select__icon") as HTMLElement;
    // The icon is at the line's end: the left.
    expect(icon.getBoundingClientRect().left).toBeLessThan(
      (field.querySelector(".ow-select__value") as HTMLElement).getBoundingClientRect().left,
    );
    await userEvent.click(field);
    await opened();
    expect(document.querySelector(".ow-select__positioner")?.getAttribute("dir")).toBe("rtl");
    // The check is at the line's end too: the left, as the trigger's icon.
    const cherry = item("Cherry");
    expect(
      cherry.querySelector(".ow-select__item-indicator")?.getBoundingClientRect().left,
    ).toBeLessThan(
      (cherry.querySelector(".ow-select__item-text") as HTMLElement).getBoundingClientRect().left,
    );
    await userEvent.keyboard("{Escape}");
    await gone();
  });

  test("modal by default: a clear backdrop takes an outside press, and the page holds still", async () => {
    let behind = 0;
    const screen = await render(
      <>
        <Fruits defaultValue="apple" />
        <Behind onClick={() => behind++} />
      </>,
    );
    // Focused but shut, Base UI mounts the popup ahead; that holds nothing.
    trigger().focus();
    await settle();
    expect(held()).toBe(false);
    await userEvent.click(trigger());
    await opened();
    expect(backdrops()).toHaveLength(1);
    const backdrop = backdrops()[0] as HTMLElement;
    expect(getComputedStyle(backdrop).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    const box = backdrop.getBoundingClientRect();
    expect([box.left, box.top, box.width, box.height]).toEqual([
      0,
      0,
      root.clientWidth,
      root.clientHeight,
    ]);
    await expect.poll(() => held()).toBe(true);
    expect(held(list())).toBe(true);
    // A press on Behind lands on the backdrop: it only shuts the popup.
    const button = screen.getByText("Behind").element();
    await pressAt(button);
    await gone();
    expect(behind).toBe(0);
    expect(trigger().textContent).toBe("Apple");
    expect(backdrops()).toHaveLength(0);
    await expect.poll(() => held()).toBe(false);
    await userEvent.click(button);
    expect(behind).toBe(1);
  });

  test("beside its trigger, the page holds still with no style on it", async () => {
    const before = pageStyle();
    await render(<Beside />);
    await userEvent.click(trigger());
    await opened();
    await expect.poll(() => held()).toBe(true);
    await settle();
    expect(pageStyle()).toEqual(before);
    expect(getComputedStyle(root).overflow).toBe("visible");
    expect(getComputedStyle(document.body).overflow).toBe("visible");
    await userEvent.keyboard("{Escape}");
    await gone();
    expect(held()).toBe(false);
    expect(pageStyle()).toEqual(before);
  });

  test("over its trigger, Base UI's own page lock is put back: the page holds with no style", async () => {
    // Base UI locks the page with `overflow` over the trigger, modal or not, since the popup
    // cannot follow a scroll there; OwsemUI's lock holds the page instead and keeps its style.
    const before = pageStyle();
    await render(<Fruits defaultValue="cherry" modal={false} />);
    await userEvent.click(trigger());
    await opened();
    await expect.poll(() => popup()?.getAttribute("data-side")).toBe("none");
    await expect.poll(() => held()).toBe(true);
    await settle();
    expect(pageStyle()).toEqual(before);
    expect(getComputedStyle(document.body).overflow).toBe("visible");
    await userEvent.keyboard("{Escape}");
    await gone();
    await settle();
    expect(held()).toBe(false);
    expect(pageStyle()).toEqual(before);
  });

  test("a long list takes the wheel while it can scroll; the page never does", async () => {
    await render(<Fruits items={MANY} defaultValue="v0" />);
    await userEvent.click(trigger());
    await opened();
    await expect.poll(() => held()).toBe(true);
    const option = item("Option 1");
    list().scrollTop = 0;
    expect(held(option)).toBe(false);
    list().scrollTop = list().scrollHeight;
    expect(held(option)).toBe(true);
  });

  test("modal={false}: no backdrop and no lock; an outside press reaches what it hits", async () => {
    let behind = 0;
    // Beside its trigger: over it, the page is held even when not modal (above).
    const screen = await render(
      <>
        <Select.Root defaultValue="a" modal={false}>
          <Select.Trigger aria-label="Letter" style={{ margin: 80 }} />
          <Select.Portal>
            <Select.Positioner alignItemWithTrigger={false}>
              <Select.Popup>
                <Select.Item value="a">A</Select.Item>
                <Select.Item value="b">B</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Behind onClick={() => behind++} />
      </>,
    );
    await userEvent.click(trigger());
    await opened();
    await settle();
    expect(document.querySelector(".ow-select__backdrop")).toBeNull();
    expect(held()).toBe(false);
    await userEvent.click(screen.getByText("Behind"));
    await gone();
    expect(behind).toBe(1);
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    await render(
      <main>
        <Fruits defaultValue="cherry" />
        <Select.Root>
          <Select.Label>Letter</Select.Label>
          <Select.Trigger placeholder="Pick one" />
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.Group>
                  <Select.GroupLabel>First</Select.GroupLabel>
                  <Select.Item value="a">A</Select.Item>
                </Select.Group>
                <Select.Separator />
                <Select.Item value="b">B</Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </main>,
    );
    await userEvent.click(trigger());
    await opened();
    await settle();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const report = await axeReport(document.body);
      // All it may find is Base UI's focus guards, hidden on purpose: they hand Tab on.
      const violations = report.violations.filter((violation) =>
        violation.nodes.some((node) => !node.includes("data-base-ui-focus-guard")),
      );
      expect({ violations, contrastUnknown: report.contrastUnknown }).toEqual({
        violations: [],
        contrastUnknown: [],
      });
    }
  });

  test("runs no rAF and no animations when idle, open", async () => {
    await render(<Fruits defaultValue="cherry" />);
    await userEvent.click(trigger());
    await opened();
    await userEvent.hover(item("Apple"));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  await render(
    <Select.Root defaultOpen defaultValue="a">
      <Select.Label>Letter</Select.Label>
      <Select.Trigger />
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.ScrollUpArrow keepMounted />
            <Select.List>
              <Select.Group>
                <Select.GroupLabel>Group</Select.GroupLabel>
                <Select.Item value="a">A</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Item value="b">B</Select.Item>
            </Select.List>
            <Select.ScrollDownArrow keepMounted />
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>,
  );
  await expect.poll(() => document.querySelector('[data-slot="select-popup"]')).not.toBeNull();
  const slots = [...document.querySelectorAll('[data-slot^="select"]')].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual([
    "select-label",
    "select-trigger",
    "select-value",
    "select-icon",
    "select-portal",
    "select-backdrop",
    "select-positioner",
    "select-popup",
    "select-scroll-up-arrow",
    "select-list",
    "select-group-label",
    "select-item",
    "select-item-text",
    "select-item-indicator",
    "select-separator",
    "select-item",
    "select-item-text",
    "select-item-indicator",
    "select-scroll-down-arrow",
  ]);
});

test("a trigger rendered by an outer part keeps the outer data-size", async () => {
  const screen = await render(
    <Select.Root size="md">
      <Select.Trigger data-size="lg" aria-label="Letter" />
    </Select.Root>,
  );
  const trigger = screen.container.querySelector('[data-slot="select-trigger"]');
  expect(trigger?.getAttribute("data-size")).toBe("lg");
  expect(trigger?.className).toBe("ow-select__trigger ow-select__trigger--lg");
});
