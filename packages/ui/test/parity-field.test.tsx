import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Field as CssField } from "../src/components/field/index";
import { Fieldset as CssFieldset } from "../src/components/fieldset/index";
import { Form as CssForm } from "../src/components/form/index";
import { Button as TwButton } from "../src/tailwind/button/button";
import { fieldSlots } from "../src/tailwind/field/field-variants";
import { Field as TwField } from "../src/tailwind/field/index";
import { fieldsetSlots } from "../src/tailwind/fieldset/fieldset-variants";
import { Fieldset as TwFieldset } from "../src/tailwind/fieldset/index";
import { formSlots } from "../src/tailwind/form/form-variants";
import { Form as TwForm } from "../src/tailwind/form/index";
import { inputSlots, inputVariants } from "../src/tailwind/input/input-variants";
import {
  type Case,
  classNames,
  expectStyles,
  INPUT_RESIZE,
  setMedia,
  tailwindParity,
} from "./parity";
import { settle } from "./raf-counter";

// Field, Fieldset, and Form in Tailwind CSS v4 (src/tailwind) against their stylesheets. Field's
// control is Input, so the Tailwind Field must draw the Tailwind Input.

const OVERRIDES =
  "gap-0 text-red-500 text-lg font-bold opacity-100 m-4 p-2 min-w-0 ps-8 flex-row items-start leading-none";

const tw = tailwindParity(
  classNames(
    ...Object.values(fieldSlots),
    ...Object.values(fieldsetSlots),
    ...Object.values(formSlots),
    ...Object.values(inputSlots),
    ...(["sm", "md", "lg"] as const).map((size) => inputVariants({ size })),
    OVERRIDES,
    "data-disabled:opacity-100 data-disabled:text-red-500",
  ),
  [
    INPUT_RESIZE,
    {
      what: /^alignSelf$/,
      part: /button/,
      reason: "`self-start` is flex-start and the CSS says start; the same in a flex column.",
    },
  ],
);

interface Kit {
  Field: typeof CssField;
  Fieldset: typeof CssFieldset;
  Form: typeof CssForm;
}
const css: Kit = { Field: CssField, Fieldset: CssFieldset, Form: CssForm };
const twind: Kit = { Field: TwField, Fieldset: TwFieldset, Form: TwForm };

const make = (name: string, ui: (kit: Kit) => ReactElement): Case => ({
  name,
  css: ui(css),
  tw: ui(twind),
});

const fields: Case[] = [
  make("label and control", ({ Field }) => (
    <Field.Root>
      <Field.Label>Email</Field.Label>
      <Field.Control />
    </Field.Root>
  )),
  make("with a description", ({ Field }) => (
    <Field.Root>
      <Field.Label>Email</Field.Label>
      <Field.Control size="lg" />
      <Field.Description>We never share it.</Field.Description>
    </Field.Root>
  )),
  make("with an error", ({ Field }) => (
    <Field.Root invalid>
      <Field.Label>Email</Field.Label>
      <Field.Control />
      <Field.Error match>Enter a valid email.</Field.Error>
    </Field.Root>
  )),
  make("with several errors", ({ Field }) => (
    <Field.Root invalid>
      <Field.Label>Password</Field.Label>
      <Field.Control size="sm" />
      <Field.Error match>
        <ul>
          <li>Too short.</li>
          <li>Needs a digit.</li>
        </ul>
      </Field.Error>
    </Field.Root>
  )),
  make("everything", ({ Field }) => (
    <Field.Root invalid>
      <Field.Label>Email</Field.Label>
      <Field.Control startIcon={<span>@</span>} placeholder="you@owsem.dev" />
      <Field.Description>Used to sign in.</Field.Description>
      <Field.Error match>Required.</Field.Error>
    </Field.Root>
  )),
  make("disabled", ({ Field }) => (
    <Field.Root disabled>
      <Field.Label>Email</Field.Label>
      <Field.Control />
      <Field.Description>Locked.</Field.Description>
    </Field.Root>
  )),
  make("item in a row", ({ Field }) => (
    <Field.Root>
      <Field.Item>
        <input type="checkbox" aria-label="One" />
        <Field.Label>One</Field.Label>
      </Field.Item>
      <Field.Item disabled>
        <input type="checkbox" aria-label="Two" disabled />
        <Field.Label>Two</Field.Label>
      </Field.Item>
    </Field.Root>
  )),
  make("in a narrow parent", ({ Field }) => (
    <div style={{ inlineSize: 140 }}>
      <Field.Root>
        <Field.Label>A long label for a narrow box</Field.Label>
        <Field.Control />
        <Field.Description>A longer help text that has to wrap onto lines.</Field.Description>
      </Field.Root>
    </div>
  )),
  make("in a larger font", ({ Field }) => (
    <div style={{ fontSize: 22 }}>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control />
        <Field.Description>Help.</Field.Description>
      </Field.Root>
    </div>
  )),
];

const fieldsets: Case[] = [
  make("legend and fields", ({ Fieldset, Field }) => (
    <Fieldset.Root>
      <Fieldset.Legend>Contact</Fieldset.Legend>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
      </Field.Root>
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Control />
      </Field.Root>
    </Fieldset.Root>
  )),
  make("disabled", ({ Fieldset, Field }) => (
    <Fieldset.Root disabled>
      <Fieldset.Legend>Contact</Fieldset.Legend>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
      </Field.Root>
    </Fieldset.Root>
  )),
  make("legend as a heading", ({ Fieldset, Field }) => (
    <Fieldset.Root>
      {/* biome-ignore lint/a11y/useHeadingContent: Legend fills the heading */}
      <Fieldset.Legend render={<h3 />}>Contact</Fieldset.Legend>
      <Field.Root>
        <Field.Label>Name</Field.Label>
        <Field.Control />
      </Field.Root>
    </Fieldset.Root>
  )),
  make("in a narrow parent", ({ Fieldset }) => (
    <div style={{ display: "flex", inlineSize: 120 }}>
      <Fieldset.Root>
        <Fieldset.Legend>Wide legend that wraps</Fieldset.Legend>
        <input aria-label="x" style={{ inlineSize: 200 }} />
      </Fieldset.Root>
    </div>
  )),
  make("nested", ({ Fieldset, Field }) => (
    <Fieldset.Root>
      <Fieldset.Legend>Outer</Fieldset.Legend>
      <Fieldset.Root>
        <Fieldset.Legend>Inner</Fieldset.Legend>
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <Field.Control />
        </Field.Root>
      </Fieldset.Root>
    </Fieldset.Root>
  )),
];

const forms: Case[] = [
  make("fields and a button", ({ Form, Field }) => (
    <Form>
      <Field.Root name="email">
        <Field.Label>Email</Field.Label>
        <Field.Control />
      </Field.Root>
      <button type="submit">Sign up</button>
    </Form>
  )),
  make("two fields, a button, and a link", ({ Form, Field }) => (
    <Form>
      <Field.Root name="a">
        <Field.Label>A</Field.Label>
        <Field.Control />
      </Field.Root>
      <Field.Root name="b">
        <Field.Label>B</Field.Label>
        <Field.Control />
      </Field.Root>
      <button type="submit">Send</button>
      <a href="#top">Cancel</a>
    </Form>
  )),
  make("in a narrow parent", ({ Form }) => (
    <div style={{ display: "flex", inlineSize: 100 }}>
      <Form>
        <input aria-label="x" style={{ inlineSize: 160 }} />
        <button type="submit">Go</button>
      </Form>
    </div>
  )),
];

describe("Field in Tailwind CSS v4 against field.css", () => {
  test("matches in the light theme", async () => {
    await tw.parity(fields);
  });

  test("and in the dark theme", async () => {
    await tw.parity(fields, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(fields, { dir: "rtl" });
  });

  test("and in forced colors", async () => {
    await setMedia("forced-colors");
    await tw.parity(fields);
  });

  test("and with more contrast and reduced motion", async () => {
    await setMedia("more-contrast");
    await setMedia("reduced-motion");
    await tw.parity(fields);
  });

  test("its control reacts to a real hover and keyboard focus as Input does", async () => {
    await tw.states(fields, "label and control", "hover", { target: "input" });
    await tw.states(fields, "with an error", "focus", { target: "input" });
  });

  test("has the same transitions and animations", async () => {
    await tw.motion(fields);
  });

  test("draws the Tailwind Input as its control", async () => {
    tw.load();
    const screen = await render(
      <TwField.Root>
        <TwField.Label>Email</TwField.Label>
        <TwField.Control />
      </TwField.Root>,
    );
    const input = screen.container.querySelector("input");
    expect(input?.className).toBe(inputVariants({ size: "md" }));
  });
});

describe("Fieldset in Tailwind CSS v4 against fieldset.css", () => {
  test("matches in the light theme", async () => {
    await tw.parity(fieldsets);
  });

  test("and in the dark theme", async () => {
    await tw.parity(fieldsets, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(fieldsets, { dir: "rtl" });
  });

  test("and in forced colors, and with reduced motion and more contrast", async () => {
    await setMedia("forced-colors");
    await setMedia("reduced-motion");
    await setMedia("more-contrast");
    await tw.parity(fieldsets);
  });

  test("has the same transitions and animations", async () => {
    await tw.motion(fieldsets);
  });
});

describe("Form in Tailwind CSS v4 against form.css", () => {
  test("matches in the light theme", async () => {
    await tw.parity(forms);
  });

  test("and in the dark theme", async () => {
    await tw.parity(forms, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(forms, { dir: "rtl" });
  });

  test("and in forced colors, and with reduced motion and more contrast", async () => {
    await setMedia("forced-colors");
    await setMedia("reduced-motion");
    await setMedia("more-contrast");
    await tw.parity(forms);
  });

  test("has the same transitions and animations", async () => {
    await tw.motion(forms);
  });

  test("a failed submit shakes the first invalid field again, as it does with the CSS flavor", async () => {
    tw.load();
    const screen = await render(
      <TwForm onFormSubmit={vi.fn()}>
        <TwField.Root name="email">
          <TwField.Label>Email</TwField.Label>
          <TwField.Control type="email" required />
          <TwField.Error match="valueMissing">Required.</TwField.Error>
        </TwField.Root>
        <TwButton type="submit">Sign up</TwButton>
      </TwForm>,
    );
    const email = screen.getByRole("textbox", { name: "Email" }).element() as HTMLInputElement;
    const shaking = () =>
      email.getAnimations().filter((a) => (a as CSSAnimation).animationName === "ow-input-shake");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await expect.poll(() => shaking().length).toBe(1);
    await expect.poll(() => shaking().length, { timeout: 2000 }).toBe(0);
    await userEvent.type(email, "a");
    await settle();
    expect(shaking()).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await expect.poll(() => shaking().length).toBe(1);
  });

  test("a field invalid from the start stays still, and a failed submit shakes it", async () => {
    tw.load();
    const screen = await render(
      <TwForm onFormSubmit={vi.fn()}>
        <TwField.Root name="email" invalid>
          <TwField.Label>Email</TwField.Label>
          <TwField.Control type="email" />
          <TwField.Error match />
        </TwField.Root>
        <TwButton type="submit">Sign up</TwButton>
      </TwForm>,
    );
    const email = screen.getByRole("textbox", { name: "Email" }).element() as HTMLInputElement;
    const shaking = () =>
      email.getAnimations().filter((a) => (a as CSSAnimation).animationName === "ow-input-shake");
    await settle();
    expect(shaking()).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    await expect.poll(() => shaking().length).toBe(1);
  });
});

describe("className on Field, Fieldset, and Form in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's, on every part", async () => {
    tw.load();
    const screen = await render(
      <TwForm className={OVERRIDES}>
        <TwFieldset.Root className={OVERRIDES}>
          <TwFieldset.Legend className={OVERRIDES}>Legend</TwFieldset.Legend>
          <TwField.Root className={OVERRIDES}>
            <TwField.Label className={OVERRIDES}>Label</TwField.Label>
            <TwField.Description className={OVERRIDES}>Help</TwField.Description>
            <TwField.Error match className={OVERRIDES}>
              Wrong
            </TwField.Error>
            <TwField.Item className={OVERRIDES}>
              <span />
            </TwField.Item>
          </TwField.Root>
        </TwFieldset.Root>
      </TwForm>,
    );
    const parts = [
      "form",
      '[data-slot="fieldset"]',
      '[data-slot="fieldset-legend"]',
      '[data-slot="field"]',
      "label",
      '[data-slot="field-description"]',
      '[data-slot="field-error"]',
      '[data-slot="field-item"]',
    ].map((selector) => {
      const el = screen.container.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      return el;
    });
    for (const part of parts) {
      expectStyles(part, {
        columnGap: "0px",
        color: "oklch(0.637 0.237 25.331)",
        fontSize: "18px",
        fontWeight: "700",
        marginTop: "16px",
        paddingTop: "8px",
      });
    }
  });

  test("a user's utility with a state's variant beats that state's", async () => {
    tw.load();
    const screen = await render(
      <TwField.Root disabled>
        <TwField.Label className="data-disabled:opacity-100">Label</TwField.Label>
        <TwField.Control />
      </TwField.Root>,
    );
    const label = screen.container.querySelector("label");
    if (!label) throw new Error("not rendered");
    expectStyles(label, { opacity: "1" });
  });
});
