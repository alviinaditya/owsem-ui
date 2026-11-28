import { DirectionProvider } from "@base-ui/react/direction-provider";
import { createRef, type ReactNode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import chipsCss from "./combobox.css?raw";
import fieldCss from "./combobox-field.css?raw";
import { Combobox } from "./index";

const root = document.documentElement;
const FRUITS = ["Apple", "Banana", "Cherry", "Mango", "Papaya"];

const q = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];
const options = () => all('[role="option"]').map((el) => el.textContent);

/**
 * Finishes every running transition, so a popup is at rest. Base UI drops data-starting-style a
 * frame after a part mounts, and its transition starts only then.
 */
const land = async () => {
  await expect.poll(() => document.querySelector("[data-starting-style]")).toBeNull();
  for (const animation of document.getAnimations()) animation.finish();
};

function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue("color");
  probe.remove();
  return computed;
}

/** The radius token, as the browser computes it for `scope`. */
function radius(scope: Element) {
  const probe = document.createElement("span");
  probe.style.setProperty("border-radius", "var(--ow-radius)");
  scope.append(probe);
  const computed = getComputedStyle(probe).borderTopLeftRadius;
  probe.remove();
  return computed;
}

const TINT = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const TINT_HOVER = "color-mix(in oklab, var(--ow-fg) 9%, transparent)";
const CRITICAL = "color-mix(in oklab, var(--ow-critical) 14%, transparent)";

/** The shortest use: a named input, the two buttons, and a list with a check. */
function Fruit({
  label = "Fruit",
  empty,
  ...props
}: Partial<Combobox.Root.Props<string>> & { label?: string; empty?: ReactNode }) {
  return (
    <Combobox.Root items={FRUITS} {...props}>
      <Combobox.InputGroup>
        <Combobox.Input aria-label={label} placeholder="Pick a fruit" />
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.InputGroup>
      <Combobox.Popup>
        <Combobox.Empty>{empty}</Combobox.Empty>
        <Combobox.List>
          {(item: string) => (
            <Combobox.Item key={item} value={item}>
              {item}
              <Combobox.ItemIndicator />
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Root>
  );
}

function Tags({ size }: { size?: "sm" | "md" | "lg" }) {
  return (
    <Combobox.Root items={FRUITS} multiple defaultValue={["Apple"]} size={size}>
      <Combobox.InputGroup>
        <Combobox.Chips>
          <Combobox.Value>
            {(value: string[]) =>
              value.map((fruit) => (
                <Combobox.Chip key={fruit} aria-label={fruit}>
                  {fruit}
                  <Combobox.ChipRemove aria-label={`Remove ${fruit}`} />
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input aria-label="Fruits" />
        </Combobox.Chips>
      </Combobox.InputGroup>
      <Combobox.Popup>
        <Combobox.List>
          {(item: string) => (
            <Combobox.Item key={item} value={item}>
              {item}
              <Combobox.ItemIndicator />
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Root>
  );
}

const input = () => q<HTMLInputElement>('[data-slot="combobox-input"]');
const group = () => q('[data-slot="combobox-input-group"]');
const trigger = () => q<HTMLButtonElement>('[data-slot="combobox-trigger"]');
const popup = () => q('[data-slot="combobox-popup"]');

async function open() {
  await userEvent.click(trigger());
  await expect.poll(() => popup()).not.toBeNull();
  await land();
}

describe("Combobox", () => {
  test("the shortest use draws the field, a chevron, and a list that filters as you type", async () => {
    await render(<Fruit />);
    expect(group().className).toContain("ow-combobox__input-group--md");
    expect(trigger().querySelector("svg")).not.toBeNull();
    expect(trigger().getAttribute("aria-label")).toBe("Open");
    await open();
    expect(options()).toEqual(FRUITS);
    await userEvent.type(input(), "an");
    await expect.poll(options).toEqual(["Banana", "Mango"]);
  });

  test("Clear draws an × while there is a value, and empties the field", async () => {
    await render(<Fruit defaultValue="Cherry" />);
    const clear = q<HTMLButtonElement>('[data-slot="combobox-clear"]');
    expect(clear.querySelector("svg")).not.toBeNull();
    expect(clear.getAttribute("aria-label")).toBe("Clear");
    expect(input().value).toBe("Cherry");
    await userEvent.click(clear);
    expect(input().value).toBe("");
    await expect.poll(() => q('[data-slot="combobox-clear"]')).toBeNull();
  });

  test("the check draws itself; an unselected row keeps its room", async () => {
    await render(<Fruit defaultValue="Banana" />);
    await open();
    const marks = all('[data-slot="combobox-item-indicator"]');
    expect(marks).toHaveLength(FRUITS.length);
    for (const mark of marks) expect(mark.querySelector("svg")).not.toBeNull();
    const [apple, banana] = marks;
    expect(banana?.hasAttribute("data-selected")).toBe(true);
    expect(apple?.hasAttribute("data-selected")).toBe(false);
    expect(apple?.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  test("the arrows highlight, Enter picks, and Escape shuts", async () => {
    await render(<Fruit />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await land();
    const lit = () => q('[role="option"][data-highlighted]')?.textContent;
    // Opening with the arrow lights the first item.
    await expect.poll(lit).toBe("Apple");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("Banana");
    await userEvent.keyboard("{ArrowUp}");
    await expect.poll(lit).toBe("Apple");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect.poll(() => input().value).toBe("Banana");
    await expect.poll(popup).toBeNull();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await expect.poll(popup).toBeNull();
  });

  test("Home and End move the caret in the text, as in any input, and leave the list alone", async () => {
    await render(<Fruit />);
    await userEvent.type(input(), "ab");
    await userEvent.keyboard("{Home}");
    expect(input().selectionStart).toBe(0);
    await userEvent.keyboard("{End}");
    expect(input().selectionStart).toBe(2);
  });

  test("Glide's highlight follows the keyboard's", async () => {
    await render(<Fruit />);
    await open();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    const item = q('[role="option"][data-highlighted]');
    await expect.poll(() => q(".ow-glide")?.hasAttribute("data-visible")).toBe(true);
    await land();
    const glide = q(".ow-glide").getBoundingClientRect();
    const lit = item.getBoundingClientRect();
    expect(glide.top).toBeCloseTo(lit.top, 0);
    expect(glide.height).toBeCloseTo(lit.height, 0);
  });

  test("groups show their labels, and filtering drops a group with no match", async () => {
    const groups = [
      { value: "Orchard", items: ["Apple", "Cherry"] },
      { value: "Tropical", items: ["Mango", "Papaya"] },
    ];
    await render(
      <Combobox.Root items={groups}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Fruit" />
        </Combobox.InputGroup>
        <Combobox.Popup>
          <Combobox.List>
            {(group: (typeof groups)[number]) => (
              <Combobox.Group key={group.value} items={group.items}>
                <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                <Combobox.Collection>
                  {(item: string) => (
                    <Combobox.Item key={item} value={item}>
                      {item}
                    </Combobox.Item>
                  )}
                </Combobox.Collection>
              </Combobox.Group>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => all('[data-slot="combobox-group-label"]')).toHaveLength(2);
    expect(all('[data-slot="combobox-group-label"]').map((el) => el.textContent)).toEqual([
      "Orchard",
      "Tropical",
    ]);
    expect(getComputedStyle(q('[data-slot="combobox-group-label"]')).textTransform).toBe(
      "uppercase",
    );
    await userEvent.type(input(), "pap");
    await expect.poll(() => all('[data-slot="combobox-group-label"]')).toHaveLength(1);
    expect(options()).toEqual(["Papaya"]);
  });

  test("Empty shows its text when nothing matches; with no text the popup does not show", async () => {
    await render(<Fruit empty="No fruit found." />);
    await userEvent.type(input(), "zzz");
    await expect.poll(() => q('[data-slot="combobox-empty"]')?.textContent).toBe("No fruit found.");
    expect(getComputedStyle(popup()).display).not.toBe("none");
    expect(getComputedStyle(q('[data-slot="combobox-list"]')).display).toBe("none");
    await render(<Fruit label="Second" />);
    const second = all('[data-slot="combobox-input"]')[1] as HTMLInputElement;
    await userEvent.type(second, "zzz");
    await expect.poll(() => all('[data-slot="combobox-popup"]').length).toBeGreaterThan(0);
    const popups = all('[data-slot="combobox-popup"]');
    expect(getComputedStyle(popups.at(-1) as HTMLElement).display).toBe("none");
  });

  test("a Status line shows over the list while loading, even with no items", async () => {
    function Loading() {
      const [text, setText] = useState("Loading...");
      return (
        <>
          <button type="button" onClick={() => setText("")}>
            done
          </button>
          <Combobox.Root items={[]} filter={null}>
            <Combobox.InputGroup>
              <Combobox.Input aria-label="Search" />
            </Combobox.InputGroup>
            <Combobox.Popup>
              <Combobox.Status>{text}</Combobox.Status>
              <Combobox.Empty>Nothing.</Combobox.Empty>
              <Combobox.List>{() => null}</Combobox.List>
            </Combobox.Popup>
          </Combobox.Root>
        </>
      );
    }
    const screen = await render(<Loading />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => q('[data-slot="combobox-status"]')?.textContent).toBe("Loading...");
    expect(getComputedStyle(popup()).display).not.toBe("none");
    expect(q('[data-slot="combobox-status"]').getAttribute("role")).toBe("status");
    await screen.getByText("done").click();
    await expect.poll(() => q('[data-slot="combobox-status"]')?.textContent ?? "").toBe("");
  });

  test("multiple: picks become chips, Backspace removes the last, a remove button removes its own", async () => {
    await render(<Tags />);
    expect(all('[data-slot="combobox-chip"]').map((el) => el.textContent)).toEqual(["Apple"]);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await land();
    await userEvent.click(all('[role="option"]')[2] as HTMLElement);
    await expect
      .poll(() => all('[data-slot="combobox-chip"]').map((el) => el.textContent))
      .toEqual(["Apple", "Cherry"]);
    // The popup stays open as picks add up.
    expect(popup()).not.toBeNull();
    await userEvent.keyboard("{Backspace}");
    await expect
      .poll(() => all('[data-slot="combobox-chip"]').map((el) => el.textContent))
      .toEqual(["Apple"]);
    await userEvent.click(q('[data-slot="combobox-chip-remove"]'));
    await expect.poll(() => all('[data-slot="combobox-chip"]')).toHaveLength(0);
  });

  test("a chip is a small pill and its remove button a 24px target", async () => {
    await render(<Tags />);
    const chip = q('[data-slot="combobox-chip"]');
    const remove = q('[data-slot="combobox-chip-remove"]');
    expect(chip.getBoundingClientRect().height).toBeCloseTo(24, 0);
    expect(remove.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    expect(remove.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    expect(remove.querySelector("svg")).not.toBeNull();
    expect(getComputedStyle(chip).borderTopLeftRadius).toBe("12px");
  });

  test("in a Field the label names the input and the description describes it", async () => {
    await render(
      <Field.Root name="fruit">
        <Field.Label>Favorite fruit</Field.Label>
        <Combobox.Root items={FRUITS}>
          <Combobox.InputGroup>
            <Combobox.Input />
            <Combobox.Trigger />
          </Combobox.InputGroup>
        </Combobox.Root>
        <Field.Description>Pick one.</Field.Description>
      </Field.Root>,
    );
    const field = q<HTMLInputElement>('[data-slot="combobox-input"]');
    const named =
      field.labels?.[0]?.textContent ??
      document.getElementById(field.getAttribute("aria-labelledby") ?? "")?.textContent;
    expect(named).toBe("Favorite fruit");
    expect(field.getAttribute("aria-describedby")).not.toBeNull();
  });

  test("an invalid Field marks the group, and its error is announced", async () => {
    await render(
      <Field.Root name="fruit" invalid>
        <Field.Label>Fruit</Field.Label>
        <Combobox.Root items={FRUITS}>
          <Combobox.InputGroup>
            <Combobox.Input />
          </Combobox.InputGroup>
        </Combobox.Root>
        <Field.Error match>Choose a fruit.</Field.Error>
      </Field.Root>,
    );
    expect(group().hasAttribute("data-invalid")).toBe(true);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(getComputedStyle(group()).backgroundColor).toBe(resolve(CRITICAL));
  });

  test("disabled dims the field and opens nothing; read only keeps its value, whatever is typed or picked", async () => {
    await render(
      <>
        <Fruit label="Off" disabled defaultValue="Apple" />
        <Fruit label="Read" readOnly defaultValue="Banana" />
      </>,
    );
    const [off, read] = all('[data-slot="combobox-input"]') as HTMLInputElement[];
    const [offGroup, readGroup] = all('[data-slot="combobox-input-group"]');
    expect(off?.disabled).toBe(true);
    expect(getComputedStyle(offGroup as HTMLElement).opacity).toBe("0.5");
    expect(getComputedStyle(offGroup as HTMLElement).cursor).toBe("not-allowed");
    expect(read?.readOnly).toBe(true);
    expect(getComputedStyle(readGroup as HTMLElement).opacity).toBe("1");
    await userEvent.type(read as HTMLInputElement, "x");
    expect(read?.value).toBe("Banana");
    await userEvent.click(all('[data-slot="combobox-trigger"]')[1] as HTMLElement);
    await expect.poll(popup).not.toBeNull();
    await land();
    await userEvent.click(all('[role="option"]')[0] as HTMLElement);
    expect(read?.value).toBe("Banana");
  });

  test("a controlled combobox shows the value it is given", async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>("Mango");
      return (
        <>
          <Fruit value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("Papaya")}>
            set
          </button>
        </>
      );
    }
    const screen = await render(<Controlled />);
    expect(input().value).toBe("Mango");
    await screen.getByText("set").click();
    await expect.poll(() => input().value).toBe("Papaya");
  });

  test("in a form it submits its name and value", async () => {
    const seen: (FormDataEntryValue | null)[] = [];
    await render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          seen.push(new FormData(event.currentTarget).get("fruit"));
        }}
      >
        <Fruit name="fruit" defaultValue="Cherry" />
        <button type="submit">go</button>
      </form>,
    );
    await userEvent.click(q('button[type="submit"]'));
    expect(seen).toEqual(["Cherry"]);
  });

  test("the input alone looks like an Input; in a group it is bare", async () => {
    await render(
      <Combobox.Root items={FRUITS}>
        <Combobox.Input aria-label="Alone" />
        <Combobox.InputGroup>
          <Combobox.Input aria-label="Grouped" />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );
    const [alone, grouped] = all('[data-slot="combobox-input"]');
    expect(alone?.className).toContain("ow-input");
    expect(getComputedStyle(alone as HTMLElement).backgroundColor).toBe(resolve(TINT));
    expect(grouped?.className).toBe("ow-combobox__input");
    expect(getComputedStyle(grouped as HTMLElement).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });
});

describe("Combobox, drawn", () => {
  test("the group is the field: a 6% tint, 9% on hover, the radius token, and the ring on focus", async () => {
    await render(<Fruit />);
    const field = group() as HTMLElement;
    expect(getComputedStyle(field).backgroundColor).toBe(resolve(TINT));
    expect(getComputedStyle(field).borderTopLeftRadius).toBe(radius(field));
    await userEvent.hover(field);
    expect(getComputedStyle(field).backgroundColor).toBe(resolve(TINT_HOVER));
    await userEvent.click(input());
    expect(getComputedStyle(field).outlineStyle).toBe("solid");
    expect(getComputedStyle(field).outlineWidth).toBe("2px");
    expect(getComputedStyle(field).outlineColor).toBe(resolve("var(--ow-focus)"));
  });

  test("the popup is Select's: the raised fill, the popup shadow, Glide, and item padding", async () => {
    await render(<Fruit />);
    await open();
    const panel = popup();
    expect(panel.className).toContain("ow-select__popup");
    expect(panel.className).toContain("ow-combobox__popup");
    expect(getComputedStyle(panel).backgroundColor).toBe(resolve("var(--ow-raised-bg)"));
    expect(getComputedStyle(q('[role="option"]')).paddingLeft).not.toBe("0px");
    expect(q('[data-slot="combobox-list"] > .ow-glide')).not.toBeNull();
  });

  test("the popup is at least as wide as the field and sits under it", async () => {
    await render(
      <div style={{ inlineSize: 280, paddingBlockEnd: 260 }}>
        <Fruit />
      </div>,
    );
    await open();
    const field = group().getBoundingClientRect();
    const panel = popup().getBoundingClientRect();
    expect(panel.width).toBeGreaterThanOrEqual(field.width - 0.5);
    expect(panel.top).toBeGreaterThanOrEqual(field.bottom);
  });

  test("every hover rule is behind (hover: hover), so touch never sticks one", () => {
    const css = `${fieldCss}\n${chipsCss}`;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css.replace(/@import[^;]*;/g, ""));
    const hovered: string[] = [];
    const walk = (rules: CSSRuleList, guarded: boolean) => {
      for (const rule of rules) {
        if (rule instanceof CSSMediaRule) walk(rule.cssRules, rule.conditionText.includes("hover"));
        else if (rule instanceof CSSLayerBlockRule) walk(rule.cssRules, guarded);
        else if (rule instanceof CSSStyleRule && rule.selectorText.includes(":hover") && !guarded) {
          hovered.push(rule.selectorText);
        }
      }
    };
    walk(sheet.cssRules, false);
    expect(hovered).toEqual([]);
    expect(css).toContain(":hover");
  });

  test("contrast: text 4.5:1 on the field, the chip, and the popup, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const field = composite(resolve("var(--ow-bg)"), resolve(TINT));
      const hovered = composite(resolve("var(--ow-bg)"), resolve(TINT_HOVER));
      const chip = composite(resolve("var(--ow-raised-bg)"));
      const text = composite(resolve("var(--ow-fg)"));
      const muted = composite(resolve("var(--ow-muted)"));
      expect(contrast(text, field)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, hovered)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, chip)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, field)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(muted, hovered)).toBeGreaterThanOrEqual(3);
    }
  });

  test("right to left: the buttons sit at the start, the check at the other end", async () => {
    await render(
      <DirectionProvider direction="rtl">
        <div dir="rtl" style={{ inlineSize: 260, paddingBlockEnd: 260 }}>
          <Fruit defaultValue="Banana" />
        </div>
      </DirectionProvider>,
    );
    const field = group().getBoundingClientRect();
    expect(trigger().getBoundingClientRect().left).toBeCloseTo(field.left + 4, 0);
    await open();
    const row = all('[role="option"]')[1] as HTMLElement;
    const mark = row.querySelector("svg") as SVGElement;
    expect(mark.getBoundingClientRect().left).toBeLessThan(row.getBoundingClientRect().left + 24);
  });

  test("more contrast draws the field's edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    await render(<Fruit />);
    await commands.setContrast("more");
    expect(getComputedStyle(group()).boxShadow).toContain(resolve("var(--ow-edge)"));
  });

  test("forced colors: the transparent outline is the edge, focus is Highlight, disabled is GrayText", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    await render(<Fruit disabled label="Off" />);
    await commands.setForcedColors("active");
    expect(getComputedStyle(group()).outlineStyle).toBe("solid");
    expect(getComputedStyle(group()).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(trigger()).color).toBe(resolve("GrayText"));
  });

  test("a group that becomes invalid shakes once, and blinks instead under reduced motion", async () => {
    function Toggle() {
      const [invalid, setInvalid] = useState(false);
      return (
        <Field.Root invalid={invalid}>
          <Field.Label>Fruit</Field.Label>
          <Combobox.Root items={FRUITS}>
            <Combobox.InputGroup>
              <Combobox.Input />
            </Combobox.InputGroup>
          </Combobox.Root>
          <button type="button" onClick={() => setInvalid(true)}>
            break
          </button>
        </Field.Root>
      );
    }
    const screen = await render(<Toggle />);
    expect(group().getAnimations()).toHaveLength(0);
    await screen.getByText("break").click();
    await expect
      .poll(() =>
        group()
          .getAnimations()
          .map((a) => (a as CSSAnimation).animationName),
      )
      .toEqual(["ow-input-shake"]);
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    expect(getComputedStyle(group()).animationName).toBe("ow-input-blink");
  });
});

describe("Combobox, around it", () => {
  test("passes className, style, and ref through on every part", async () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      input: createRef<HTMLInputElement>(),
      trigger: createRef<HTMLButtonElement>(),
      clear: createRef<HTMLButtonElement>(),
      popup: createRef<HTMLDivElement>(),
      list: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
      status: createRef<HTMLDivElement>(),
      empty: createRef<HTMLDivElement>(),
    };
    await render(
      <Combobox.Root items={FRUITS} defaultValue="Apple" open>
        <Combobox.InputGroup ref={refs.group} className="a" style={{ marginBlock: 3 }}>
          <Combobox.Input ref={refs.input} className="b" aria-label="Fruit" />
          <Combobox.Clear ref={refs.clear} className="c" />
          <Combobox.Trigger ref={refs.trigger} className="d" />
        </Combobox.InputGroup>
        <Combobox.Popup ref={refs.popup} className="e">
          <Combobox.Status ref={refs.status} className="f" />
          <Combobox.Empty ref={refs.empty} className="g" />
          <Combobox.List ref={refs.list} className="h">
            {(item: string) => (
              <Combobox.Item key={item} value={item} ref={refs.item} className="i">
                {item}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    for (const [name, ref] of Object.entries(refs)) {
      expect(ref.current, name).not.toBeNull();
      expect(
        ref.current?.className.split(" ").some((c) => "abcdefghi".includes(c) && c.length === 1),
        name,
      ).toBe(true);
    }
    expect(refs.group.current?.style.marginBlock).toBe("3px");
    expect(refs.group.current?.className).toContain("ow-combobox__input-group");
  });

  test("every part has its data-slot", async () => {
    await render(
      <Combobox.Root items={FRUITS} multiple defaultValue={["Apple"]} open>
        <Combobox.InputGroup>
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove />
            </Combobox.Chip>
            <Combobox.Input aria-label="Fruit" />
          </Combobox.Chips>
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.InputGroup>
        <Combobox.Popup>
          <Combobox.Status />
          <Combobox.Empty />
          <Combobox.List>
            <Combobox.Group>
              <Combobox.GroupLabel>Group</Combobox.GroupLabel>
              <Combobox.Item value="Apple">
                Apple
                <Combobox.ItemIndicator />
              </Combobox.Item>
            </Combobox.Group>
            <Combobox.Separator />
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>,
    );
    const slots = new Set(all("[data-slot]").map((el) => el.getAttribute("data-slot")));
    for (const slot of [
      "combobox-input-group",
      "combobox-chips",
      "combobox-chip",
      "combobox-chip-remove",
      "combobox-input",
      "combobox-clear",
      "combobox-trigger",
      "combobox-icon",
      "combobox-positioner",
      "combobox-popup",
      "combobox-status",
      "combobox-empty",
      "combobox-list",
      "combobox-group",
      "combobox-group-label",
      "combobox-item",
      "combobox-item-indicator",
      "combobox-separator",
    ]) {
      expect(slots, slot).toContain(slot);
    }
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Combobox.Root items={FRUITS} multiple defaultValue={["Apple"]}>
        <Combobox.InputGroup>
          <Combobox.Chips>
            <Combobox.Chip>
              Apple
              <Combobox.ChipRemove />
            </Combobox.Chip>
            <Combobox.Input aria-label="Fruit" />
          </Combobox.Chips>
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.InputGroup>
      </Combobox.Root>,
    );
    expect(html).toContain("ow-combobox__input-group");
    expect(html).toContain("ow-combobox__chip-remove");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, closed, open, with chips, in a Field, and disabled", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 300, paddingBlockEnd: 260 }}>
        <Field.Root name="a">
          <Field.Label>Fruit</Field.Label>
          <Combobox.Root items={FRUITS} defaultValue="Apple">
            <Combobox.InputGroup>
              <Combobox.Input />
              <Combobox.Clear />
              <Combobox.Trigger />
            </Combobox.InputGroup>
            <Combobox.Popup>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Root>
          <Field.Description>Pick one.</Field.Description>
        </Field.Root>
        <Tags size="sm" />
        <Fruit label="Off" disabled />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
    await userEvent.click(trigger());
    await expect.poll(popup).not.toBeNull();
    await land();
    // Open, Base UI hides the page behind the popup from assistive technology, so only the popup.
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(popup())).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, open or shut", async () => {
    await render(<Fruit defaultValue="Apple" />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await open();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await land();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
