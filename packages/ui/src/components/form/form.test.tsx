import { type CSSProperties, createRef, useState } from "react";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { rect } from "../../../test/geometry.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Button } from "../button";
import { Field } from "../field";
import { Fieldset } from "../fieldset";
import { Form } from "./index";

const root = document.documentElement;

const fields = (
  <>
    <Field.Root name="email">
      <Field.Label>Email</Field.Label>
      <Field.Control type="email" required />
      <Field.Error />
    </Field.Root>
    <Field.Root name="username">
      <Field.Label>Username</Field.Label>
      <Field.Control required />
      <Field.Error />
    </Field.Root>
    <Button type="submit">Sign up</Button>
  </>
);

const q = (scope: Element, selector: string) => {
  const el = scope.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`no ${selector}`);
  return el;
};

describe("Form", () => {
  test("renders a form that passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const ref = createRef<HTMLFormElement>();
    const screen = await render(
      <Form ref={ref} className="mine" style={{ marginBlock: "1px" }} aria-label="Sign up" />,
    );
    expect(ref.current?.tagName).toBe("FORM");
    expect(ref.current?.className).toBe("ow-form mine");
    expect(ref.current?.style.marginBlock).toBe("1px");
    await expect.element(screen.getByRole("form", { name: "Sign up" })).toBeInTheDocument();
  });

  test("native validation stops the submit, shows messages, and focuses the first invalid field", async () => {
    const onFormSubmit = vi.fn();
    const screen = await render(<Form onFormSubmit={onFormSubmit}>{fields}</Form>);
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(onFormSubmit).not.toHaveBeenCalled();
    const email = screen.getByRole("textbox", { name: "Email" });
    await expect.element(email).toHaveFocus();
    await expect.element(email).toHaveAttribute("aria-invalid", "true");
    expect(screen.container.querySelectorAll(".ow-field__error")).toHaveLength(2);
  });

  test("a valid form submits its values by name", async () => {
    const onFormSubmit = vi.fn();
    const screen = await render(<Form onFormSubmit={onFormSubmit}>{fields}</Form>);
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "ana@owsem.dev");
    await userEvent.type(screen.getByRole("textbox", { name: "Username" }), "ana");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(onFormSubmit.mock.calls[0]?.[0]).toEqual({ email: "ana@owsem.dev", username: "ana" });
  });

  test("server errors show on their fields, focus the first, and clear on change", async () => {
    function Server() {
      const [errors, setErrors] = useState<Record<string, string>>({});
      return (
        <Form errors={errors} onFormSubmit={() => setErrors({ username: "That name is taken." })}>
          {fields}
        </Form>
      );
    }
    const screen = await render(<Server />);
    const username = screen.getByRole("textbox", { name: "Username" });
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "ana@owsem.dev");
    await userEvent.type(username, "admin");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await expect.element(screen.getByText("That name is taken.")).toBeVisible();
    await expect.element(username).toHaveFocus();
    await expect.element(username).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(username, "7");
    await expect.element(username).not.toHaveAttribute("aria-invalid");
    expect(screen.container.querySelector(".ow-field__error")).toBeNull();
  });

  test("a button keeps its own width, and a Fieldset inside stretches", async () => {
    const screen = await render(
      <div style={{ inlineSize: 300 }}>
        <Form>
          <Fieldset.Root>
            <Fieldset.Legend>Group</Fieldset.Legend>
          </Fieldset.Root>
          <Button type="submit">Go</Button>
        </Form>
      </div>,
    );
    expect(rect(q(screen.container, ".ow-fieldset")).width).toBe(300);
    expect(rect(q(screen.container, ".ow-button")).width).toBeLessThan(100);
  });

  test("a theme token set on it reaches the fields inside, and no others", async () => {
    const screen = await render(
      <>
        <Form style={{ "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties}>
          <Field.Root>
            <Field.Label>A</Field.Label>
          </Field.Root>
        </Form>
        <Form>
          <Field.Root>
            <Field.Label>B</Field.Label>
          </Field.Root>
        </Form>
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-field__label")] as [Element, Element];
    expect(getComputedStyle(a).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(b).color).not.toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own values, the gap included", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".my-form { gap: 3px; flex-direction: row; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const screen = await render(<Form className="my-form">{fields}</Form>);
    const style = getComputedStyle(q(screen.container, ".ow-form"));
    expect(style.rowGap).toBe("3px");
    expect(style.flexDirection).toBe("row");
  });

  test("has no outer margins or frame", async () => {
    const screen = await render(<Form>{fields}</Form>);
    const style = getComputedStyle(q(screen.container, ".ow-form"));
    expect(style.marginTop).toBe("0px");
    expect(style.paddingTop).toBe("0px");
    expect(style.boxShadow).toBe("none");
    expect(style.borderTopWidth).toBe("0px");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Form aria-label="Sign up">{fields}</Form>
      </main>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      // axe cannot see a Button's face (a pseudo-element); its own tests check that contrast.
      expect((await axeReport(screen.container)).violations).toEqual([]);
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await render(<Form>{fields}</Form>);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
