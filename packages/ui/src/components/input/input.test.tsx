import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Input } from "./index";

const root = document.documentElement;

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z" />
  </svg>
);

async function mount(ui: ReactNode): Promise<HTMLInputElement> {
  const screen = await render(ui);
  const input = screen.container.querySelector<HTMLInputElement>(".ow-input");
  if (!input) throw new Error("no input");
  return input;
}

/** Resolves a value (e.g. `var(--ow-edge)`) to its computed color inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const edgeOf = (input: Element) => getComputedStyle(input).boxShadow;

describe("Input", () => {
  test("alone, it is a complete field that fills its parent", async () => {
    const input = await mount(
      <div style={{ inlineSize: 321 }}>
        <Input aria-label="Name" />
      </div>,
    );
    expect(input.tagName).toBe("INPUT");
    expect(input.parentElement?.className).toBe("");
    expect(input.dataset.size).toBe("md");
    expect(input.getBoundingClientRect().width).toBe(321);
    expect(getComputedStyle(input).marginTop).toBe("0px");
  });

  test("works controlled and uncontrolled, and in a plain form (FR-4)", async () => {
    function Controlled() {
      const [value, setValue] = useState("a");
      return (
        <form aria-label="Plain">
          <Input aria-label="Controlled" name="c" value={value} onValueChange={setValue} />
          <Input aria-label="Uncontrolled" name="u" defaultValue="b" />
          <output>{value}</output>
        </form>
      );
    }
    const screen = await render(<Controlled />);
    const form = screen.container.querySelector("form");
    await userEvent.type(screen.getByRole("textbox", { name: "Controlled" }), "z");
    await expect.element(screen.getByText("az")).toBeVisible();
    await userEvent.type(screen.getByRole("textbox", { name: "Uncontrolled" }), "y");
    expect(Object.fromEntries(new FormData(form as HTMLFormElement))).toEqual({
      c: "az",
      u: "by",
    });
  });

  test("ref, className, style, and native props reach the input, with or without icons (FR-2, FR-5)", async () => {
    for (const icons of [{}, { startIcon: <Star /> }, { endIcon: <Star /> }]) {
      const ref = createRef<HTMLInputElement>();
      const input = await mount(
        <Input
          {...icons}
          ref={ref}
          className="mine"
          style={{ marginBlock: "3px" }}
          aria-label="Name"
          placeholder="Your name"
          data-x="1"
        />,
      );
      expect(ref.current).toBe(input);
      expect(input.className).toBe("ow-input mine");
      expect(input.style.marginBlock).toBe("3px");
      expect(input.placeholder).toBe("Your name");
      expect(input.dataset.x).toBe("1");
    }
  });

  test("className may be a function of the state, and render swaps the element", async () => {
    const byFunction = await mount(
      <Input aria-label="F" disabled className={(state) => `is-${state.disabled}`} />,
    );
    expect(byFunction.className).toBe("ow-input is-true");
    const area = await mount(<Input aria-label="R" render={<textarea rows={3} />} />);
    expect(area.tagName).toBe("TEXTAREA");
    expect(area.getBoundingClientRect().height).toBeGreaterThan(50);
    expect(getComputedStyle(area).resize).toBe("vertical");
  });

  test("a wrapper exists only with an icon, and icons are hidden from assistive tech", async () => {
    const bare = await mount(<Input aria-label="Bare" />);
    expect(bare.closest(".ow-input__wrapper")).toBeNull();
    const input = await mount(<Input aria-label="Both" startIcon={<Star />} endIcon={<Star />} />);
    const wrapper = input.parentElement;
    expect(wrapper?.className).toBe("ow-input__wrapper");
    const icons = [...(wrapper?.querySelectorAll(".ow-input__icon") ?? [])];
    expect(icons.map((icon) => icon.getAttribute("data-side"))).toEqual(["start", "end"]);
    expect(icons.every((icon) => icon.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  test("a click on an icon lands on the input", async () => {
    const screen = await render(<Input aria-label="Search" startIcon={<Star />} />);
    const icon = screen.container.querySelector(".ow-input__icon") as HTMLElement;
    const { left, top, width, height } = icon.getBoundingClientRect();
    expect(document.elementFromPoint(left + width / 2, top + height / 2)?.tagName).toBe("INPUT");
  });

  test("the well reads the theme tokens, with a 3:1 edge in light and dark (DP-6)", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const input = await mount(<Input aria-label="Name" placeholder="Name" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(input);
      const well = resolveColor("var(--ow-well-bg)");
      const edge = resolveColor("var(--ow-edge)");
      expect(style.backgroundColor).toBe(well);
      expect(style.color).toBe(resolveColor("var(--ow-fg)"));
      expect(style.boxShadow).toContain(edge);
      expect(contrast(composite(edge), composite(well))).toBeGreaterThanOrEqual(3);
      expect(getComputedStyle(input, "::placeholder").color).toBe(resolveColor("var(--ow-muted)"));
    }
  });

  test("invalid draws the edge in the critical tone at 3:1, from Base UI's or the ARIA state", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const input = await mount(<Input aria-label="Email" aria-invalid="true" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const edge = resolveColor("var(--ow-critical)");
      expect(edgeOf(input)).toContain(edge);
      const well = resolveColor("var(--ow-well-bg)");
      expect(contrast(composite(edge), composite(well))).toBeGreaterThanOrEqual(3);
    }
  });

  test("focus adds the ring outside the edge (FR-13)", async () => {
    const input = await mount(<Input aria-label="Name" />);
    await userEvent.click(input);
    expect(document.activeElement).toBe(input);
    const style = getComputedStyle(input);
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolveColor("var(--ow-focus)"));
    expect(style.boxShadow).toContain(resolveColor("var(--ow-edge)"));
  });

  test("disabled fades it and its icons, and it cannot take focus", async () => {
    const input = await mount(<Input aria-label="Name" disabled startIcon={<Star />} />);
    expect(input.disabled).toBe(true);
    expect("disabled" in input.dataset).toBe(true);
    expect(getComputedStyle(input).opacity).toBe("0.45");
    const icon = input.parentElement?.querySelector(".ow-input__icon") as Element;
    expect(getComputedStyle(icon).opacity).toBe("0.45");
    input.focus();
    expect(document.activeElement).not.toBe(input);
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const screen = await render(
      <>
        <Input aria-label="A" style={{ "--ow-well-bg": "rgb(1, 2, 3)" } as CSSProperties} />
        <Input aria-label="B" />
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-input")] as [Element, Element];
    expect(getComputedStyle(a).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(b).backgroundColor).not.toBe("rgb(1, 2, 3)");
  });

  test("a theme token set on an ancestor reaches the input and its icons", async () => {
    const input = await mount(
      <div style={{ "--ow-muted": "rgb(4, 5, 6)" } as CSSProperties}>
        <Input aria-label="A" startIcon={<Star />} />
      </div>,
    );
    const icon = input.parentElement?.querySelector(".ow-input__icon") as Element;
    expect(getComputedStyle(icon).color).toBe("rgb(4, 5, 6)");
  });

  test("an unlayered rule on a className beats its own values", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".mine { background-color: rgb(9, 8, 7); inline-size: 111px; border-radius: 1px; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    for (const icons of [{}, { startIcon: <Star /> }]) {
      const input = await mount(<Input {...icons} aria-label="Mine" className="mine" />);
      const style = getComputedStyle(input);
      expect(style.backgroundColor).toBe("rgb(9, 8, 7)");
      expect(style.borderRadius).toBe("1px");
      expect(input.getBoundingClientRect().width).toBe(111);
    }
  });

  test("forced colors keep the edge, the ring, and a thicker invalid edge (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const input = await mount(<Input aria-label="Plain" />);
    const invalid = await mount(<Input aria-label="Bad" aria-invalid="true" />);
    await commands.setForcedColors("active");
    expect(getComputedStyle(input).outlineWidth).toBe("1px");
    expect(getComputedStyle(input).outlineStyle).toBe("solid");
    expect(getComputedStyle(invalid).outlineWidth).toBe("2px");
    await userEvent.click(input);
    expect(getComputedStyle(input).outlineColor).toBe(resolveColor("Highlight"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <label htmlFor="name">Name</label>
        <Input id="name" placeholder="Your name" />
        <Input aria-label="Search" startIcon={<Star />} endIcon={<Star />} defaultValue="Text" />
        <Input aria-label="Email" aria-invalid="true" defaultValue="nope" />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(<Input aria-label="Name" startIcon={<Star />} />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
