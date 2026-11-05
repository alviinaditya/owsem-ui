import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import { Fieldset } from "./index";

const root = document.documentElement;

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

const address = (
  <>
    <Fieldset.Legend>Address</Fieldset.Legend>
    <Field.Root>
      <Field.Label>Street</Field.Label>
      <Field.Control />
    </Field.Root>
    <Field.Root>
      <Field.Label>City</Field.Label>
      <Field.Control />
    </Field.Root>
  </>
);

describe("Fieldset", () => {
  test("renders a fieldset named by its legend", async () => {
    const { screen, q } = await mount(<Fieldset.Root>{address}</Fieldset.Root>);
    expect(q(".ow-fieldset").tagName).toBe("FIELDSET");
    await expect.element(screen.getByRole("group", { name: "Address" })).toBeVisible();
  });

  test("passes className, style, render, and ref through (FR-2, FR-5)", async () => {
    const refs = {
      root: createRef<HTMLFieldSetElement>(),
      legend: createRef<HTMLDivElement>(),
    };
    await mount(
      <Fieldset.Root ref={refs.root} className="r" style={{ marginBlock: "1px" }}>
        <Fieldset.Legend
          ref={refs.legend}
          className={() => "l"}
          render={<h3 aria-label="Address">Address</h3>}
        />
      </Fieldset.Root>,
    );
    expect(refs.root.current?.className).toBe("ow-fieldset r");
    expect(refs.root.current?.style.marginBlock).toBe("1px");
    expect(refs.legend.current?.tagName).toBe("H3");
    expect(refs.legend.current?.className).toBe("ow-fieldset__legend l");
    expect(getComputedStyle(refs.legend.current as Element).marginTop).toBe("0px");
    expect(getComputedStyle(refs.legend.current as Element).fontSize).toBe("14px");
  });

  test("disabled reaches every field inside, and fades the legend", async () => {
    const { q, screen } = await mount(<Fieldset.Root disabled>{address}</Fieldset.Root>);
    const inputs = [...screen.container.querySelectorAll("input")];
    expect(inputs.map((input) => input.disabled)).toEqual([true, true]);
    expect(inputs.every((input) => "disabled" in input.dataset)).toBe(true);
    expect(getComputedStyle(q(".ow-fieldset__legend")).opacity).toBe("0.45");
  });

  test("works with plain controls and in a plain form", async () => {
    const { q } = await mount(
      <form>
        <Fieldset.Root>
          <Fieldset.Legend>Plain</Fieldset.Legend>
          <label>
            Name
            <input name="name" defaultValue="Ana" />
          </label>
        </Fieldset.Root>
      </form>,
    );
    expect(Object.fromEntries(new FormData(q<HTMLFormElement>("form")))).toEqual({ name: "Ana" });
  });

  test("reads the theme tokens in light and dark, with an etched line under the legend", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const { q } = await mount(<Fieldset.Root>{address}</Fieldset.Root>);
    const legend = q(".ow-fieldset__legend");
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(getComputedStyle(legend).color).toBe(resolveColor("var(--ow-fg)"));
      const line = getComputedStyle(legend, "::after");
      expect(line.borderBlockStartWidth).toBe("1px");
      expect(line.borderBlockStartColor).toBe(resolveColor("var(--ow-line-dark)"));
      expect(line.borderBlockEndColor).toBe(resolveColor("var(--ow-line-light)"));
    }
  });

  test("a theme token set on it changes it alone (TK-9)", async () => {
    const screen = await render(
      <>
        <Fieldset.Root style={{ "--ow-line-dark": "rgb(1, 2, 3)" } as CSSProperties}>
          <Fieldset.Legend>A</Fieldset.Legend>
        </Fieldset.Root>
        <Fieldset.Root>
          <Fieldset.Legend>B</Fieldset.Legend>
        </Fieldset.Root>
      </>,
    );
    const [a, b] = [...screen.container.querySelectorAll(".ow-fieldset__legend")] as [
      Element,
      Element,
    ];
    expect(getComputedStyle(a, "::after").borderBlockStartColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(b, "::after").borderBlockStartColor).not.toBe("rgb(1, 2, 3)");
  });

  test("an unlayered rule on a className beats its own values, the gap and the line included", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".my-set { gap: 3px; } .my-legend::after { content: none; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const { q } = await mount(
      <Fieldset.Root className="my-set">
        <Fieldset.Legend className="my-legend">A</Fieldset.Legend>
      </Fieldset.Root>,
    );
    expect(getComputedStyle(q(".ow-fieldset")).rowGap).toBe("3px");
    expect(getComputedStyle(q(".ow-fieldset__legend"), "::after").content).toBe("none");
  });

  test("the line stays in forced colors (DP-8)", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const { q } = await mount(<Fieldset.Root>{address}</Fieldset.Root>);
    await commands.setForcedColors("active");
    const line = getComputedStyle(q(".ow-fieldset__legend"), "::after");
    expect(line.borderBlockStartWidth).toBe("1px");
    expect(line.borderBlockStartColor).toBe(resolveColor("CanvasText"));
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main>
        <Fieldset.Root>{address}</Fieldset.Root>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle", async () => {
    await mount(<Fieldset.Root>{address}</Fieldset.Root>);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});
