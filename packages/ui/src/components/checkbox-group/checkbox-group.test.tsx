import { Field } from "@base-ui/react/field";
import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Checkbox } from "../checkbox";
import { CheckboxGroup } from "./index";

const root = document.documentElement;
const TOPPINGS = ["Cheese", "Olives", "Onions"] as const;

function Rows(props: Partial<CheckboxGroup.Props>) {
  return (
    <CheckboxGroup aria-label="Toppings" defaultValue={["olives"]} {...props}>
      {TOPPINGS.map((name) => (
        <label key={name}>
          <Checkbox.Root value={name.toLowerCase()} />
          {name}
        </label>
      ))}
    </CheckboxGroup>
  );
}

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const group = screen.container.querySelector<HTMLElement>(".ow-checkbox-group");
  if (!group) throw new Error("no group");
  const row = (name: string) => {
    const el = [...group.querySelectorAll("label")].find((label) => label.textContent === name);
    if (!el) throw new Error(`no row ${name}`);
    return el;
  };
  const box = (name: string) => row(name).querySelector<HTMLElement>(".ow-checkbox") as HTMLElement;
  return { screen, group, row, box };
}

const checked = (box: Element) => box.getAttribute("aria-checked");

describe("Checkbox Group", () => {
  test("is Base UI's group: a named group of checkboxes, with the value of the ticked ones", async () => {
    const { group, box } = await mount(<Rows />);
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Toppings");
    expect(group.getAttribute("data-slot")).toBe("checkbox-group");
    expect(group.className).toBe("ow-checkbox-group ow-checkbox-group--md");
    expect(group.getAttribute("data-size")).toBe("md");
    expect(checked(box("Cheese"))).toBe("false");
    expect(checked(box("Olives"))).toBe("true");
  });

  test("a press on a row, its label, or its box toggles it, and onValueChange says what is ticked", async () => {
    const seen: string[][] = [];
    const { row, box } = await mount(<Rows onValueChange={(value) => seen.push(value)} />);
    await userEvent.click(row("Cheese"));
    expect(checked(box("Cheese"))).toBe("true");
    await userEvent.click(box("Olives"));
    expect(checked(box("Olives"))).toBe("false");
    expect(seen).toEqual([["olives", "cheese"], ["cheese"]]);
  });

  test("a controlled group shows the value it is given", async () => {
    function Controlled() {
      const [value, setValue] = useState<string[]>(["cheese"]);
      return (
        <>
          <Rows value={value} onValueChange={setValue} />
          <output>{value.join(",")}</output>
        </>
      );
    }
    const { screen, row, box } = await mount(<Controlled />);
    expect(checked(box("Cheese"))).toBe("true");
    await userEvent.click(row("Onions"));
    await expect
      .poll(() => screen.container.querySelector("output")?.textContent)
      .toBe("cheese,onions");
  });

  test("the group's size reaches its boxes: 19, 20, or 22 px, and a box's own size wins", async () => {
    const sizes = { sm: 19, md: 20, lg: 22 } as const;
    for (const [size, edge] of Object.entries(sizes) as [keyof typeof sizes, number][]) {
      const { group, box } = await mount(<Rows size={size} />);
      expect(group.className).toContain(`ow-checkbox-group--${size}`);
      for (const name of TOPPINGS) {
        expect(box(name).getAttribute("data-size")).toBe(size);
        expect(box(name).className).toContain(`ow-checkbox--${size}`);
        expect(box(name).getBoundingClientRect().width).toBeCloseTo(edge, 0);
      }
    }
    const own = await mount(
      <CheckboxGroup aria-label="Own" size="lg">
        <label>
          <Checkbox.Root size="sm" />
          Small
        </label>
        <label>
          <Checkbox.Root />
          Large
        </label>
      </CheckboxGroup>,
    );
    expect(own.box("Small").getAttribute("data-size")).toBe("sm");
    expect(own.box("Large").getAttribute("data-size")).toBe("lg");
  });

  test("a Checkbox outside a group still defaults to md", async () => {
    const screen = await render(<Checkbox.Root aria-label="Alone" />);
    const box = screen.container.querySelector(".ow-checkbox");
    expect(box?.getAttribute("data-size")).toBe("md");
  });

  test("select all: a parent box takes allValues, mixed when some are ticked, and ticks or clears all", async () => {
    function All() {
      return (
        <CheckboxGroup
          aria-label="Toppings"
          defaultValue={["cheese"]}
          allValues={["cheese", "olives", "onions"]}
        >
          <label>
            <Checkbox.Root parent />
            All
          </label>
          {TOPPINGS.map((name) => (
            <label key={name}>
              <Checkbox.Root value={name.toLowerCase()} />
              {name}
            </label>
          ))}
        </CheckboxGroup>
      );
    }
    const { row, box } = await mount(<All />);
    expect(checked(box("All"))).toBe("mixed");
    expect(box("All").hasAttribute("data-indeterminate")).toBe(true);
    expect(box("All").querySelector('[data-glyph="minus"]')).not.toBeNull();
    await userEvent.click(row("All"));
    for (const name of ["All", ...TOPPINGS]) expect(checked(box(name))).toBe("true");
    expect(box("All").hasAttribute("data-indeterminate")).toBe(false);
    await userEvent.click(row("All"));
    for (const name of ["All", ...TOPPINGS]) expect(checked(box(name))).toBe("false");
    await userEvent.click(row("Onions"));
    expect(checked(box("All"))).toBe("mixed");
  });

  test("disabled: every box and its row are dim, and a press does nothing", async () => {
    const { group, row, box } = await mount(<Rows disabled />);
    expect(group.hasAttribute("data-disabled")).toBe(true);
    for (const name of TOPPINGS) {
      expect(box(name).hasAttribute("data-disabled")).toBe(true);
      // The row dims once, with its box in it.
      expect(getComputedStyle(row(name)).opacity).toBe("0.5");
      expect(getComputedStyle(box(name)).opacity).toBe("1");
      expect(getComputedStyle(row(name)).cursor).toBe("not-allowed");
    }
    await userEvent.click(row("Cheese"), { force: true });
    expect(checked(box("Cheese"))).toBe("false");
  });

  test("a read-only box keeps its look and its row's default cursor", async () => {
    const { row, box } = await mount(
      <CheckboxGroup aria-label="Locked">
        <label>
          <Checkbox.Root readOnly />
          Locked
        </label>
      </CheckboxGroup>,
    );
    expect(getComputedStyle(row("Locked")).cursor).toBe("default");
    await userEvent.click(row("Locked"));
    expect(checked(box("Locked"))).toBe("false");
  });

  test("in a form, every ticked box submits its value under the box's name", async () => {
    const screen = await render(
      <form>
        <CheckboxGroup aria-label="Toppings" defaultValue={["olives"]}>
          {TOPPINGS.map((name) => (
            <label key={name}>
              <Checkbox.Root name="topping" value={name.toLowerCase()} />
              {name}
            </label>
          ))}
        </CheckboxGroup>
      </form>,
    );
    const form = screen.container.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).getAll("topping")).toEqual(["olives"]);
    await userEvent.click(screen.getByText("Onions"));
    expect(new FormData(form).getAll("topping").sort()).toEqual(["olives", "onions"]);
  });

  test("in a Field the label names the group, and the description describes it", async () => {
    const { group } = await mount(
      <Field.Root name="topping">
        <Field.Label>Choose toppings</Field.Label>
        <Rows aria-label={undefined} />
        <Field.Description>Two at most.</Field.Description>
      </Field.Root>,
    );
    const label = document.querySelector("label") as HTMLElement;
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(group.getAttribute("aria-describedby")).toBeTruthy();
  });

  test("Glide lights the row under the pointer, and leaves a caption alone", async () => {
    const { group, row } = await mount(
      <CheckboxGroup aria-label="Toppings">
        <p>Pick some</p>
        <label>
          <Checkbox.Root />
          Cheese
        </label>
      </CheckboxGroup>,
    );
    const highlight = group.querySelector<HTMLElement>(".ow-glide");
    expect(highlight).not.toBeNull();
    await userEvent.hover(row("Cheese"));
    await expect.poll(() => getComputedStyle(highlight as Element).opacity).not.toBe("0");
  });

  test("a nested list indents under a parent with plain layout, and stays in the group", async () => {
    const { group } = await mount(
      <CheckboxGroup aria-label="Toppings" allValues={["a", "b"]}>
        <label>
          <Checkbox.Root parent />
          All
        </label>
        <div style={{ paddingInlineStart: 24 }}>
          <label>
            <Checkbox.Root value="a" />A
          </label>
          <label>
            <Checkbox.Root value="b" />B
          </label>
        </div>
      </CheckboxGroup>,
    );
    const all = group.querySelectorAll('[role="checkbox"]');
    expect(all).toHaveLength(3);
    const [parent, a] = [...all] as HTMLElement[];
    expect(
      (a as HTMLElement).getBoundingClientRect().left -
        (parent as HTMLElement).getBoundingClientRect().left,
    ).toBeCloseTo(24, 0);
  });
});

describe("Checkbox Group, around it", () => {
  test("forced colors: a disabled row is GrayText", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { row } = await mount(<Rows disabled />);
    await commands.setForcedColors("active");
    const probe = document.createElement("span");
    probe.style.color = "GrayText";
    document.body.append(probe);
    const gray = getComputedStyle(probe).color;
    probe.remove();
    expect(getComputedStyle(row("Cheese")).color).toBe(gray);
  });

  test("passes className, style, and ref through", async () => {
    const ref = createRef<HTMLDivElement>();
    const { group } = await mount(
      <Rows ref={ref} className="mine" style={{ marginInline: "3px" }} />,
    );
    expect(ref.current).toBe(group);
    expect(group.className).toBe("ow-checkbox-group ow-checkbox-group--md mine");
    expect(group.style.marginInline).toBe("3px");
  });

  test("a theme token set on a group changes it alone", async () => {
    const tokens = { "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const { group, screen } = await mount(<Rows style={tokens} />);
    expect(getComputedStyle(group).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(screen.container).color).not.toBe("rgb(1, 2, 3)");
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(<Rows />);
    expect(html).toContain("ow-checkbox-group");
    expect(html).toContain("ow-checkbox--md");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, with a parent and disabled", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24 }}>
        <CheckboxGroup aria-label="All" allValues={["a", "b"]} defaultValue={["a"]}>
          <label>
            <Checkbox.Root parent />
            Everything
          </label>
          <label>
            <Checkbox.Root value="a" />A
          </label>
          <label>
            <Checkbox.Root value="b" />B
          </label>
        </CheckboxGroup>
        <Rows aria-label="Locked" disabled size="sm" />
        <Rows aria-label="Large" size="lg" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after a press too", async () => {
    const { row } = await mount(<Rows />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(row("Cheese"));
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

test("every part has its data-slot", async () => {
  const { group } = await mount(<Rows />);
  expect(group.getAttribute("data-slot")).toBe("checkbox-group");
  for (const box of group.querySelectorAll('[role="checkbox"]')) {
    expect(box.getAttribute("data-slot")).toBe("checkbox");
  }
});
