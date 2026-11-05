import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Input } from "../input";
import { Field } from "./index";

const root = document.documentElement;

const Star = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z" />
  </svg>
);

async function mount(ui: ReactNode) {
  const screen = await render(ui);
  const q = <T extends HTMLElement = HTMLElement>(selector: string) => {
    const el = screen.container.querySelector<T>(selector);
    if (!el) throw new Error(`no ${selector}`);
    return el;
  };
  return { screen, q };
}

function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

describe("Field", () => {
  test("Root, Label, and Control are a complete field: the label names the control", async () => {
    const { screen, q } = await mount(
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control />
      </Field.Root>,
    );
    const control = screen.getByRole("textbox", { name: "Email" });
    await expect.element(control).toBeVisible();
    expect(q(".ow-field__label").tagName).toBe("LABEL");
    expect(q("input").className).toBe("ow-input");
    await userEvent.click(q(".ow-field__label"));
    expect(document.activeElement).toBe(q("input"));
  });

  test("the control is Input: it takes size, icons, ref, and className (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLInputElement>();
    const { q } = await mount(
      <Field.Root>
        <Field.Label>Search</Field.Label>
        <Field.Control ref={ref} size="lg" className="mine" startIcon={<Star />} />
      </Field.Root>,
    );
    const input = q<HTMLInputElement>(".ow-input");
    expect(ref.current).toBe(input);
    expect(input.dataset.size).toBe("lg");
    expect(input.className).toBe("ow-input mine");
    expect(q(".ow-input__wrapper").dataset.size).toBe("lg");
  });

  test("render lets another control sit in the field, still labelled and described", async () => {
    const { screen, q } = await mount(
      <Field.Root>
        <Field.Label>Note</Field.Label>
        <Field.Control render={<textarea rows={3} />} />
        <Field.Description>Shown to your team.</Field.Description>
      </Field.Root>,
    );
    await expect.element(screen.getByRole("textbox", { name: "Note" })).toBeVisible();
    const area = q("textarea");
    expect(area.className).toBe("ow-input");
    expect(area.getAttribute("aria-describedby")).toBe(q(".ow-field__description").id);
  });

  test("a plain Input in a Field is wired the same way", async () => {
    const { screen } = await mount(
      <Field.Root invalid>
        <Field.Label>City</Field.Label>
        <Input />
      </Field.Root>,
    );
    const input = screen.getByRole("textbox", { name: "City" });
    await expect.element(input).toHaveAttribute("aria-invalid", "true");
  });

  test("every part passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const refs = {
      root: createRef<HTMLDivElement>(),
      label: createRef<HTMLElement>(),
      description: createRef<HTMLParagraphElement>(),
      error: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
    };
    const { q } = await mount(
      <Field.Root ref={refs.root} invalid className="r" style={{ marginBlock: "1px" }}>
        <Field.Item ref={refs.item} className={() => "i"}>
          <Field.Label ref={refs.label} className="l">
            Name
          </Field.Label>
          <Field.Control />
        </Field.Item>
        <Field.Description ref={refs.description} className="d" render={<span />}>
          Help
        </Field.Description>
        <Field.Error ref={refs.error} className="e" match>
          Wrong
        </Field.Error>
      </Field.Root>,
    );
    expect(refs.root.current?.className).toBe("ow-field r");
    expect(refs.root.current?.style.marginBlock).toBe("1px");
    expect(refs.item.current?.className).toBe("ow-field__item i");
    expect(refs.label.current?.className).toBe("ow-field__label l");
    expect(refs.description.current?.tagName).toBe("SPAN");
    expect(refs.description.current?.className).toBe("ow-field__description d");
    expect(refs.error.current).toBe(q(".ow-field__error"));
    expect(refs.error.current?.className).toBe("ow-field__error e");
  });

  test("Description and Error are tied to the control through aria-describedby", async () => {
    const { q } = await mount(
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Field.Control />
        <Field.Description>Work address.</Field.Description>
        <Field.Error match>Not an address.</Field.Error>
      </Field.Root>,
    );
    const described = q("input").getAttribute("aria-describedby")?.split(" ");
    expect(described).toContain(q(".ow-field__description").id);
    expect(described).toContain(q(".ow-field__error").id);
    expect(q("input").getAttribute("aria-invalid")).toBe("true");
  });

  test("native validation shows the browser's message and the invalid edge", async () => {
    const { q, screen } = await mount(
      <Field.Root validationMode="onChange">
        <Field.Label>Email</Field.Label>
        <Field.Control type="email" />
        <Field.Error />
      </Field.Root>,
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "nope");
    await expect.poll(() => q("input").hasAttribute("data-invalid")).toBe(true);
    expect(q(".ow-field__error").textContent).toBe(q<HTMLInputElement>("input").validationMessage);
    expect(getComputedStyle(q("input")).boxShadow).toContain(resolveColor("var(--ow-critical)"));
  });

  test("validate gives a custom message, listed when there are several; Validity reads the state", async () => {
    const validate = vi.fn(() => ["Too short.", "Needs a digit."]);
    const { q, screen } = await mount(
      <Field.Root validate={validate} validationMode="onChange">
        <Field.Label>Code</Field.Label>
        <Field.Control />
        <Field.Error />
        <Field.Validity>
          {(state) => <output>{String(state.validity.customError)}</output>}
        </Field.Validity>
      </Field.Root>,
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Code" }), "a");
    await expect.poll(() => q(".ow-field__error").querySelectorAll("li").length).toBe(2);
    expect(q("output").textContent).toBe("true");
    expect(getComputedStyle(q(".ow-field__error ul")).marginTop).toBe("0px");
  });

  test("disabled reaches the control and fades the label", async () => {
    const { q } = await mount(
      <Field.Root disabled>
        <Field.Label>Name</Field.Label>
        <Field.Control />
      </Field.Root>,
    );
    expect(q<HTMLInputElement>("input").disabled).toBe(true);
    expect(getComputedStyle(q(".ow-field__label")).opacity).toBe("0.45");
  });

  test("works controlled and uncontrolled, and in a plain form (FR-4)", async () => {
    const { q } = await mount(
      <form>
        <Field.Root name="a">
          <Field.Label>A</Field.Label>
          <Field.Control defaultValue="1" />
        </Field.Root>
        <Field.Root name="b">
          <Field.Label>B</Field.Label>
          <Field.Control value="2" onValueChange={() => {}} />
        </Field.Root>
      </form>,
    );
    expect(Object.fromEntries(new FormData(q<HTMLFormElement>("form")))).toEqual({
      a: "1",
      b: "2",
    });
  });

  test("reads the theme tokens in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { q } = await mount(
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Field.Control />
        <Field.Description>Help</Field.Description>
        <Field.Error match>Wrong</Field.Error>
      </Field.Root>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(q(".ow-field__label")).color).toBe(resolveColor("var(--ow-fg)"));
      expect(getComputedStyle(q(".ow-field__description")).color).toBe(
        resolveColor("var(--ow-muted)"),
      );
      expect(getComputedStyle(q(".ow-field__error")).color).toBe(
        resolveColor("var(--ow-critical)"),
      );
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const screen = await render(
      <>
        <Field.Root style={{ "--ow-muted": "rgb(1, 2, 3)" } as CSSProperties}>
          <Field.Label>A</Field.Label>
          <Field.Control />
          <Field.Description>Help</Field.Description>
        </Field.Root>
        <Field.Root>
          <Field.Label>B</Field.Label>
          <Field.Control />
          <Field.Description>Help</Field.Description>
        </Field.Root>
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-field__description")] as [
      Element,
      Element,
    ];
    expect(getComputedStyle(a).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(b).color).not.toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own values", async () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ".my-field { gap: 2px; } .my-label { font-weight: 700; color: rgb(9, 8, 7); }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { q } = await mount(
      <Field.Root className="my-field">
        <Field.Label className="my-label">A</Field.Label>
        <Field.Control />
      </Field.Root>,
    );
    expect(getComputedStyle(q(".ow-field")).rowGap).toBe("2px");
    expect(getComputedStyle(q(".ow-field__label")).fontWeight).toBe("700");
    expect(getComputedStyle(q(".ow-field__label")).color).toBe("rgb(9, 8, 7)");
  });

  test("forced colors keep the text and the control's thick invalid edge (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { q } = await mount(
      <Field.Root invalid>
        <Field.Label>Email</Field.Label>
        <Field.Control />
        <Field.Error match>Wrong</Field.Error>
      </Field.Root>,
    );
    await commands.setForcedColors("active");
    expect(getComputedStyle(q(".ow-field__error")).color).toBe(resolveColor("CanvasText"));
    expect(getComputedStyle(q("input")).outlineWidth).toBe("2px");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Field.Root invalid>
          <Field.Label>Email</Field.Label>
          <Field.Control defaultValue="nope" />
          <Field.Description>Work address.</Field.Description>
          <Field.Error match>Not an address.</Field.Error>
        </Field.Root>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(
      <Field.Root>
        <Field.Label>A</Field.Label>
        <Field.Control />
      </Field.Root>,
    );
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
