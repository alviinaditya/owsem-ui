import { type CSSProperties, createRef, type ReactNode, useState } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field/index";
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

const _edgeOf = (input: Element) => getComputedStyle(input).boxShadow;

/** The field's tints of the text color: at rest, hovered, and invalid (the critical tone). */
const REST = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const HOVER = "color-mix(in oklab, var(--ow-fg) 9%, transparent)";
const INVALID = "color-mix(in oklab, var(--ow-critical) 14%, transparent)";

const NO_SHADOW = "none";

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
      expect(input.className).toBe("ow-input ow-input--md mine");
      expect(input.style.marginBlock).toBe("3px");
      expect(input.placeholder).toBe("Your name");
      expect(input.dataset.x).toBe("1");
    }
  });

  test("render swaps the element", async () => {
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
    expect(wrapper?.className).toBe("ow-input__wrapper ow-input__wrapper--md");
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

  test("the field is a tint of the text color with no shadow or edge, deeper on hover, in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <>
        <Input aria-label="Name" placeholder="Name" />
        <p>Away</p>
      </>,
    );
    const input = screen.getByRole("textbox").element() as HTMLInputElement;
    const away = screen.getByText("Away");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      await userEvent.hover(away);
      const style = getComputedStyle(input);
      expect(style.backgroundColor).toBe(resolveColor(REST));
      expect(style.color).toBe(resolveColor("var(--ow-fg)"));
      expect(style.boxShadow).toBe(NO_SHADOW);
      expect(getComputedStyle(input, "::placeholder").color).toBe(resolveColor("var(--ow-muted)"));
      await userEvent.hover(input);
      expect(style.backgroundColor).toBe(resolveColor(HOVER));
      expect(style.boxShadow).toBe(NO_SHADOW);
      await userEvent.hover(away);
    }
  });

  test("invalid turns the fill critical with no edge, from Base UI's or the ARIA state, and the text stays readable", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const input = await mount(<Input aria-label="Email" aria-invalid="true" defaultValue="x" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(input);
      expect(style.backgroundColor).toBe(resolveColor(INVALID));
      expect(style.boxShadow).toBe(NO_SHADOW);
      const page = resolveColor("var(--ow-bg)");
      const text = resolveColor("var(--ow-fg)");
      expect(
        contrast(composite(page, style.backgroundColor), composite(text)),
      ).toBeGreaterThanOrEqual(4.5);
    }
    const byBase = await mount(<Input aria-label="Name" data-invalid="" />);
    expect(getComputedStyle(byBase).backgroundColor).toBe(resolveColor(INVALID));
  });

  test("keyboard focus adds the 2px ring, and still no edge (FR-13)", async () => {
    const input = await mount(<Input aria-label="Name" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(input);
    const style = getComputedStyle(input);
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolveColor("var(--ow-focus)"));
    expect(style.boxShadow).toBe(NO_SHADOW);
  });

  test("more contrast draws the edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const input = await mount(<Input aria-label="Name" />);
    await commands.setContrast("more");
    expect(getComputedStyle(input).boxShadow).toBe(
      `${resolveColor("var(--ow-edge)")} 0px 0px 0px 1px inset`,
    );
  });

  test("a field that becomes invalid shakes once: 0, -4, 4, -2, 2, 0 px in 320 ms, on its own layer", async () => {
    const screen = await render(<Input aria-label="Email" />);
    const input = screen.container.querySelector(".ow-input") as HTMLInputElement;
    expect(getComputedStyle(input).animationName).toBe("none");
    await screen.rerender(<Input aria-label="Email" aria-invalid="true" />);
    const style = getComputedStyle(input);
    expect(style.animationName).toBe("ow-input-shake");
    expect(style.animationDuration).toBe("0.32s");
    expect(style.animationIterationCount).toBe("1");
    expect(style.willChange).toBe("transform");
    const shake = input.getAnimations()[0] as Animation;
    shake.pause();
    const x = (ms: number) => {
      shake.currentTime = ms;
      return new DOMMatrix(getComputedStyle(input).transform).m41;
    };
    expect([0, 64, 128, 192, 256, 320].map(x)).toEqual([0, -4, 4, -2, 2, 0]);
  });

  test("the shake follows --ow-motion-scale", async () => {
    const screen = await render(
      <div style={{ "--ow-motion-scale": 0.5 } as CSSProperties}>
        <Input aria-label="Email" />
      </div>,
    );
    const input = screen.container.querySelector(".ow-input") as HTMLInputElement;
    await screen.rerender(
      <div style={{ "--ow-motion-scale": 0.5 } as CSSProperties}>
        <Input aria-label="Email" aria-invalid="true" />
      </div>,
    );
    const shake = input.getAnimations()[0] as Animation;
    shake.pause();
    shake.currentTime = 64;
    expect(new DOMMatrix(getComputedStyle(input).transform).m41).toBe(-2);
  });

  test("reduced motion blinks instead of moving", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const screen = await render(<Input aria-label="Email" />);
    const input = screen.container.querySelector(".ow-input") as HTMLInputElement;
    await screen.rerender(<Input aria-label="Email" aria-invalid="true" />);
    const style = getComputedStyle(input);
    expect(style.animationName).toBe("ow-input-blink");
    expect(style.animationDuration).toBe("0.16s");
    const blink = input.getAnimations()[0] as Animation;
    blink.pause();
    blink.currentTime = 0;
    expect(getComputedStyle(input).opacity).toBe("0.6");
    expect(getComputedStyle(input).transform).toBe("none");
  });

  test("a field invalid on first render stays still, and shakes only after it has been valid", async () => {
    const screen = await render(<Input aria-label="Email" aria-invalid="true" />);
    const input = screen.container.querySelector(".ow-input") as HTMLInputElement;
    await settle();
    expect(getComputedStyle(input).animationName).toBe("none");
    expect(input.getAnimations()).toEqual([]);
    await screen.rerender(<Input aria-label="Email" />);
    await settle();
    await screen.rerender(<Input aria-label="Email" aria-invalid="true" />);
    expect(getComputedStyle(input).animationName).toBe("ow-input-shake");
  });

  test("a Field's invalid state set after it mounted shakes it, and set from the start does not", async () => {
    const still = await render(
      <Field.Root invalid>
        <Field.Control aria-label="Email" />
      </Field.Root>,
    );
    await settle();
    expect(still.container.querySelector(".ow-input")?.getAnimations()).toEqual([]);
    await still.unmount();
    const screen = await render(
      <Field.Root>
        <Field.Control aria-label="Email" />
      </Field.Root>,
    );
    const input = screen.container.querySelector(".ow-input") as HTMLInputElement;
    await screen.rerender(
      <Field.Root invalid>
        <Field.Control aria-label="Email" />
      </Field.Root>,
    );
    await expect.poll(() => getComputedStyle(input).animationName).toBe("ow-input-shake");
  });

  test("typing in an invalid field does not shake it again", async () => {
    const input = await mount(<Input aria-label="Email" aria-invalid="true" />);
    await settle();
    expect(input.getAnimations()).toEqual([]);
    await userEvent.type(input, "abc");
    expect(input.getAnimations()).toEqual([]);
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
        <div id="a" style={{ "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties}>
          <Input aria-label="A" />
        </div>
        <Input aria-label="B" />
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-input")] as [Element, Element];
    const own = resolveColor(REST, a.parentElement as Element);
    expect(own).not.toBe(resolveColor(REST));
    expect(getComputedStyle(a).backgroundColor).toBe(own);
    expect(getComputedStyle(b).backgroundColor).toBe(resolveColor(REST));
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

test("every part has its data-slot", async () => {
  const screen = await render(<Input aria-label="I" startIcon={<i />} endIcon={<i />} />);
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["input-wrapper", "input-icon", "input", "input-icon"]);
});
