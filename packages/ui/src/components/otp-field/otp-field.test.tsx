import { type CSSProperties, createRef, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { composite, contrast } from "../../../test/contrast.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import { Form } from "../form";
import { OTPField } from "./index";

const root = document.documentElement;

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const all = () => [
    ...screen.container.querySelectorAll<HTMLInputElement>(".ow-otp-field__input"),
  ];
  return {
    screen,
    row: screen.container.querySelector(".ow-otp-field") as HTMLElement,
    slots: all,
  };
}

/** Resolves a value (e.g. `var(--ow-fg)`) of `color` to its computed form in `scope`. */
function resolve(value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty("color", value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue("color");
  probe.remove();
  return computed;
}

const REST = "color-mix(in oklab, var(--ow-fg) 6%, transparent)";
const HOVER = "color-mix(in oklab, var(--ow-fg) 9%, transparent)";
const INVALID = "color-mix(in oklab, var(--ow-critical) 14%, transparent)";

/** The accessible name the way assistive technology computes it for these inputs. */
function nameOf(input: HTMLInputElement): string {
  const ids = input.getAttribute("aria-labelledby");
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
  }
  return input.getAttribute("aria-label") ?? input.labels?.[0]?.textContent ?? "";
}

describe("OTP Field", () => {
  test("the shortest use draws one slot for each character, and the group is named", async () => {
    const { row, slots } = await mount(<OTPField.Root length={6} aria-label="Code" />);
    expect(row.getAttribute("role")).toBe("group");
    expect(row.getAttribute("aria-label")).toBe("Code");
    expect(slots()).toHaveLength(6);
  });

  test("every drawn slot has a name, numbered, and the first one too", async () => {
    const { slots } = await mount(<OTPField.Root length={4} aria-label="Code" />);
    expect(slots().map(nameOf)).toEqual(["Code", "Code 2/4", "Code 3/4", "Code 4/4"]);
  });

  test("naming writes nothing to the console, drawn in the browser or on the server", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => {
      warn.mockRestore();
      error.mockRestore();
    });
    const { slots } = await mount(<OTPField.Root length={6} aria-label="Code" />);
    await settle();
    renderToString(<OTPField.Root length={6} aria-label="Code" />);
    expect(slots().map(nameOf)).toEqual([
      "Code",
      "Code 2/6",
      "Code 3/6",
      "Code 4/6",
      "Code 5/6",
      "Code 6/6",
    ]);
    // The first slot points at a hidden label with the group's name, and has no aria-label.
    const first = slots()[0] as HTMLInputElement;
    expect(first.hasAttribute("aria-label")).toBe(false);
    const label = document.getElementById(first.getAttribute("aria-labelledby") ?? "");
    expect(label?.textContent).toBe("Code");
    expect(label?.hidden).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test("a Field label and no aria-label leave Base UI's own naming, and draw no extra label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    onTestFinished(() => warn.mockRestore());
    const { row } = await mount(
      <Field.Root>
        <Field.Label>Code</Field.Label>
        <OTPField.Root length={3} />
      </Field.Root>,
    );
    expect(row.querySelectorAll("span[hidden]")).toHaveLength(0);
    expect(warn).not.toHaveBeenCalled();
  });

  test("a Field label names every slot as Base UI does, and nothing is added", async () => {
    const { slots } = await mount(
      <Field.Root>
        <Field.Label>Verification code</Field.Label>
        <OTPField.Root length={3} />
      </Field.Root>,
    );
    expect(slots().map(nameOf)).toEqual(Array(3).fill("Verification code"));
    for (const slot of slots()) expect(slot.hasAttribute("aria-label")).toBe(false);
  });

  test("aria-labelledby on the Root names the group and every slot", async () => {
    const { slots, row } = await mount(
      <>
        <span id="lab">Your code</span>
        <OTPField.Root length={3} aria-labelledby="lab" />
      </>,
    );
    expect(row.getAttribute("aria-labelledby")).toBe("lab");
    expect(slots().map(nameOf)).toEqual(Array(3).fill("Your code"));
  });

  test("with children it draws no slots of its own: they are yours, and so is a separator", async () => {
    const { slots, row } = await mount(
      <OTPField.Root length={4} aria-label="Code">
        <OTPField.Input aria-label="One" />
        <OTPField.Input aria-label="Two" />
        <span aria-hidden="true" className="dash">
          -
        </span>
        <OTPField.Input aria-label="Three" />
        <OTPField.Input aria-label="Four" />
      </OTPField.Root>,
    );
    expect(slots()).toHaveLength(4);
    expect(row.querySelectorAll(".dash")).toHaveLength(1);
    expect(slots().map((slot) => slot.getAttribute("aria-label"))).toEqual([
      null,
      "Two",
      "Three",
      "Four",
    ]);
  });

  test("typing fills the slots in turn, and the digit is tabular", async () => {
    const { slots } = await mount(<OTPField.Root length={4} aria-label="Code" />);
    await userEvent.click(slots()[0] as HTMLElement);
    await userEvent.keyboard("1234");
    expect(slots().map((slot) => slot.value)).toEqual(["1", "2", "3", "4"]);
    expect(getComputedStyle(slots()[0] as Element).fontVariantNumeric).toBe("tabular-nums");
    expect(getComputedStyle(slots()[0] as Element).textAlign).toBe("center");
  });

  test("backspace clears a slot and goes back, and the arrow keys move between them", async () => {
    const { slots } = await mount(
      <OTPField.Root length={4} aria-label="Code" defaultValue="123" />,
    );
    await userEvent.click(slots()[3] as HTMLElement);
    await userEvent.keyboard("{Backspace}");
    await expect.poll(() => document.activeElement).toBe(slots()[2]);
    await userEvent.keyboard("{ArrowLeft}");
    await expect.poll(() => document.activeElement).toBe(slots()[1]);
    await userEvent.keyboard("{Home}");
    await expect.poll(() => document.activeElement).toBe(slots()[0]);
  });

  test("pasting a whole code fills every slot and completes it", async () => {
    const onComplete = vi.fn();
    const { slots, row } = await mount(
      <OTPField.Root length={6} aria-label="Code" onValueComplete={onComplete} />,
    );
    const first = slots()[0] as HTMLElement;
    first.focus();
    const data = new DataTransfer();
    data.setData("text/plain", "482916");
    first.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
    );
    await expect
      .poll(() => slots().map((slot) => slot.value))
      .toEqual(["4", "8", "2", "9", "1", "6"]);
    expect(onComplete).toHaveBeenCalledWith("482916", expect.anything());
    expect(row.hasAttribute("data-complete")).toBe(true);
  });

  test("a complete code shows nothing special", async () => {
    const empty = await mount(<OTPField.Root length={4} aria-label="Code" />);
    const slotsOf = (slot: HTMLElement) => {
      const style = getComputedStyle(slot);
      return [
        style.backgroundColor,
        style.outlineStyle,
        style.opacity,
        style.boxShadow,
        style.color,
      ];
    };
    const before = slotsOf(empty.slots()[0] as HTMLElement);
    const done = await mount(<OTPField.Root length={4} aria-label="Code" defaultValue="1234" />);
    expect(done.row.hasAttribute("data-complete")).toBe(true);
    expect(slotsOf(done.slots()[0] as HTMLElement)).toEqual(before);
    expect(getComputedStyle(done.row).animationName).toBe("none");
  });

  test("mask hides the characters, and validationType takes letters or anything", async () => {
    const masked = await mount(
      <OTPField.Root length={4} aria-label="Code" mask defaultValue="12" />,
    );
    expect(masked.slots().every((slot) => slot.type === "password")).toBe(true);
    const letters = await mount(
      <OTPField.Root length={4} aria-label="Code" validationType="alpha" />,
    );
    const first = letters.slots()[0] as HTMLInputElement;
    await userEvent.click(first);
    await userEvent.keyboard("a1b");
    expect(letters.slots().map((slot) => slot.value)).toEqual(["a", "b", "", ""]);
  });

  test("readOnly and disabled take no input; disabled is dimmed and not-allowed", async () => {
    const ro = await mount(
      <OTPField.Root length={3} aria-label="Code" readOnly defaultValue="12" />,
    );
    expect(ro.slots().every((slot) => slot.readOnly)).toBe(true);
    await userEvent.click(ro.slots()[2] as HTMLElement);
    await userEvent.keyboard("9");
    expect(ro.slots().map((slot) => slot.value)).toEqual(["1", "2", ""]);
    const off = await mount(<OTPField.Root length={3} aria-label="Code" disabled />);
    const slot = off.slots()[0] as HTMLInputElement;
    expect(slot.disabled).toBe(true);
    expect(getComputedStyle(slot).opacity).toBe("0.45");
    expect(getComputedStyle(slot).cursor).toBe("not-allowed");
  });

  test("required reaches the form, which cannot submit it empty", async () => {
    const screen = await render(
      <form>
        <OTPField.Root length={3} aria-label="Code" required name="code" />
      </form>,
    );
    const form = screen.container.querySelector("form") as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
  });

  test("a name submits the whole code, and autoSubmit submits the form when it is complete", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const screen = await render(
      <form onSubmit={onSubmit}>
        <OTPField.Root length={4} aria-label="Code" name="code" autoSubmit />
      </form>,
    );
    const slot = screen.container.querySelector(".ow-otp-field__input") as HTMLElement;
    await userEvent.click(slot);
    await userEvent.keyboard("12");
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard("34");
    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    const data = new FormData(screen.container.querySelector("form") as HTMLFormElement);
    expect(data.get("code")).toBe("1234");
  });

  test("inside a Field, the error shows and the form's server error marks the slots", async () => {
    const screen = await render(
      <Form errors={{ code: "Wrong code" }}>
        <Field.Root name="code">
          <Field.Label>Code</Field.Label>
          <OTPField.Root length={4} />
          <Field.Error />
        </Field.Root>
      </Form>,
    );
    expect(screen.container.textContent).toContain("Wrong code");
    const slot = screen.container.querySelector(".ow-otp-field__input") as HTMLElement;
    expect(slot.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("OTP Field, looks", () => {
  test("a slot is Input's field material: a 6% tint, 9% on hover, no edge, the one radius", async () => {
    onTestFinished(() => commands.mouse("up"));
    const { slots } = await mount(<OTPField.Root length={3} aria-label="Code" />);
    const slot = slots()[1] as HTMLElement;
    expect(getComputedStyle(slot).backgroundColor).toBe(resolve(REST));
    expect(getComputedStyle(slot).borderTopWidth).toBe("0px");
    expect(getComputedStyle(slot).borderTopLeftRadius).toBe(
      getComputedStyle(
        document.body.appendChild(
          Object.assign(document.createElement("i"), { style: "border-radius: var(--ow-radius)" }),
        ),
      ).borderTopLeftRadius,
    );
    await userEvent.hover(slot);
    await expect.poll(() => getComputedStyle(slot).backgroundColor).toBe(resolve(HOVER));
  });

  test("the focus ring is Input's: 2px, offset 2px, in the focus color, on the slot with focus", async () => {
    const { slots } = await mount(<OTPField.Root length={3} aria-label="Code" />);
    const slot = slots()[0] as HTMLElement;
    slot.focus();
    const style = getComputedStyle(slot);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("var(--ow-focus)"));
    for (const other of slots().filter((s) => s !== slot)) {
      expect(getComputedStyle(other).outlineColor).not.toBe(resolve("var(--ow-focus)"));
    }
  });

  test("invalid tints the slots critical and shakes the whole row once, not each slot", async () => {
    const screen = await render(
      <Field.Root>
        <OTPField.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    const row = screen.container.querySelector(".ow-otp-field") as HTMLElement;
    const slot = screen.container.querySelector(".ow-otp-field__input") as HTMLElement;
    expect(getComputedStyle(row).animationName).toBe("none");
    await screen.rerender(
      <Field.Root invalid>
        <OTPField.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    await expect.poll(() => getComputedStyle(row).animationName).toBe("ow-otp-field-shake");
    expect(getComputedStyle(row).animationDuration).toBe("0.32s");
    expect(getComputedStyle(row).willChange).toBe("transform");
    expect(getComputedStyle(slot).backgroundColor).toBe(resolve(INVALID));
    expect(getComputedStyle(slot).animationName).toBe("none");
    const shake = row.getAnimations()[0] as Animation;
    shake.pause();
    const x = (ms: number) => {
      shake.currentTime = ms;
      return new DOMMatrix(getComputedStyle(row).transform).m41;
    };
    expect([0, 64, 128, 192, 256, 320].map(x)).toEqual([0, -4, 4, -2, 2, 0]);
  });

  test("a row invalid from the start stays still", async () => {
    const screen = await render(
      <Field.Root invalid>
        <OTPField.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    await settle();
    const row = screen.container.querySelector(".ow-otp-field") as HTMLElement;
    expect(getComputedStyle(row).animationName).toBe("none");
    expect(row.getAnimations()).toEqual([]);
  });

  test("reduced motion blinks instead of moving", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const screen = await render(
      <Field.Root>
        <OTPField.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    const row = screen.container.querySelector(".ow-otp-field") as HTMLElement;
    await screen.rerender(
      <Field.Root invalid>
        <OTPField.Root length={4} aria-label="Code" />
      </Field.Root>,
    );
    await expect.poll(() => getComputedStyle(row).animationName).toBe("ow-otp-field-blink");
    expect(getComputedStyle(row).animationDuration).toBe("0.16s");
  });

  test("a size sets the font for the row and every slot", async () => {
    const sizes = ["0.8125rem", "0.875rem", "1rem"];
    for (const [index, size] of (["sm", "md", "lg"] as const).entries()) {
      const { row, slots } = await mount(
        <OTPField.Root length={2} size={size} aria-label="Code" />,
      );
      expect(row.dataset.size).toBe(size);
      const px = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      expect(getComputedStyle(slots()[0] as Element).fontSize).toBe(
        `${Number.parseFloat(sizes[index] as string) * px}px`,
      );
    }
  });

  test("a theme token set on a row changes it alone", async () => {
    const tokens = { "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const { slots, row } = await mount(
      <OTPField.Root length={2} aria-label="Code" style={tokens} />,
    );
    expect(getComputedStyle(slots()[0] as Element).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(slots()[0] as Element).backgroundColor).toBe(resolve(REST, row));
  });

  test("the slot's text has 4.5:1 against its tint, in both themes", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { slots } = await mount(<OTPField.Root length={2} aria-label="Code" defaultValue="12" />);
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const slot = slots()[0] as HTMLElement;
      const tint = composite(resolve("var(--ow-bg)"), getComputedStyle(slot).backgroundColor);
      expect(contrast(composite(getComputedStyle(slot).color), tint)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("OTP Field, around it", () => {
  test("more contrast draws each slot's edge at 3:1", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const { slots } = await mount(<OTPField.Root length={2} aria-label="Code" />);
    await commands.setContrast("more");
    expect(getComputedStyle(slots()[0] as Element).boxShadow).toContain(resolve("var(--ow-edge)"));
  });

  test("forced colors: the slot keeps its outline as the edge, focus is Highlight, disabled is gray", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { slots } = await mount(
      <>
        <OTPField.Root length={2} aria-label="Code" />
        <OTPField.Root length={2} aria-label="Off" disabled />
      </>,
    );
    await commands.setForcedColors("active");
    const [slot] = slots();
    expect(getComputedStyle(slot as Element).outlineStyle).toBe("solid");
    expect(getComputedStyle(slot as Element).outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    (slot as HTMLElement).focus();
    expect(getComputedStyle(slot as Element).outlineColor).toBe(resolve("Highlight"));
    const off = slots().at(-1) as HTMLElement;
    expect(getComputedStyle(off).color).toBe(resolve("GrayText"));
    expect(getComputedStyle(off).opacity).toBe("1");
  });

  test("passes className, style, render, and ref through, and each part has its data-slot", async () => {
    const refs = { root: createRef<HTMLDivElement>(), input: createRef<HTMLInputElement>() };
    const { row, screen } = await mount(
      <OTPField.Root
        ref={refs.root}
        length={2}
        className="mine"
        style={{ marginInline: "3px" }}
        aria-label="Code"
      >
        <OTPField.Input ref={refs.input} className="s" style={{ opacity: 0.5 }} aria-label="A" />
        <OTPField.Input aria-label="B" />
      </OTPField.Root>,
    );
    expect(refs.root.current).toBe(row);
    expect(row.className).toBe("ow-otp-field ow-otp-field--md mine");
    expect(row.style.marginInline).toBe("3px");
    expect(refs.input.current?.className).toBe("ow-otp-field__input s");
    expect(refs.input.current?.style.opacity).toBe("0.5");
    const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
      el.getAttribute("data-slot"),
    );
    expect(slots).toEqual(["otp-field", "otp-field-input", "otp-field-input"]);
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".brand-slot { background-color: rgb(1, 2, 3); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { slots } = await mount(
      <OTPField.Root length={2} aria-label="Code">
        <OTPField.Input className="brand-slot" aria-label="A" />
        <OTPField.Input aria-label="B" />
      </OTPField.Root>,
    );
    expect(getComputedStyle(slots()[0] as Element).backgroundColor).toBe("rgb(1, 2, 3)");
  });

  test("renders on the server, without warnings, with one slot for each character", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(<OTPField.Root length={6} aria-label="Code" defaultValue="12" />);
    expect(html.match(/ow-otp-field__input/g)).toHaveLength(6);
    expect(html).toContain('aria-label="Code 2/6"');
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark: bare, in a Field, grouped, masked, disabled", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24 }}>
        <OTPField.Root length={6} aria-label="Code" />
        <Field.Root>
          <Field.Label>Verification code</Field.Label>
          <OTPField.Root length={4} size="lg" mask defaultValue="12" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Grouped</Field.Label>
          <OTPField.Root length={4} size="sm">
            <OTPField.Input aria-label="2" />
            <OTPField.Input aria-label="3" />
            <span aria-hidden="true">-</span>
            <OTPField.Input aria-label="4" />
            <OTPField.Input aria-label="5" />
          </OTPField.Root>
        </Field.Root>
        <OTPField.Root length={3} aria-label="Off" disabled />
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, typing included", async () => {
    const { slots } = await mount(<OTPField.Root length={4} aria-label="Code" />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.click(slots()[0] as HTMLElement);
    await userEvent.keyboard("12");
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
