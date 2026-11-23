import type { ReactElement } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button as CssButton, IconButton as CssIconButton } from "../src/components/button/button";
import { buttonVariants as cssVariants } from "../src/components/button/button-variants";
import { Button as TwButton, IconButton as TwIconButton } from "../src/tailwind/button/button";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { cn } from "../src/tailwind/lib/cn";
import {
  type Case,
  classNames,
  expectStyles,
  frame,
  MOTION,
  normalize,
  pick,
  setMedia,
  tailwindParity,
} from "./parity";

// The Tailwind version of Button (src/tailwind/button, generated) against the CSS version
// (button.css): the same cases side by side, and the computed styles of every part compared.

const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 shadow-none text-sm ease-linear bg-green-500 text-red-500 before:bg-red-500 before:shadow-none text-[1.5rem] [--py:2em]";
const ALL_VARIANTS = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
const candidates = classNames(
  ...Object.values(buttonSlots),
  ...ALL_VARIANTS.flatMap((variant) =>
    (["sm", "md", "lg"] as const).flatMap((size) =>
      [false, true].map((soft) => buttonVariants({ variant, size, soft })),
    ),
  ),
  OVERRIDES,
);

const tw = tailwindParity(candidates, [
  {
    what: /^transform$/,
    part: /button-ripple/,
    reason: "The ripple is display: none when motion is reduced; only its unseen scale differs.",
  },
  {
    what: /^animationName$/,
    part: /svg/,
    reason: "The spinner's keyframes are ow-button-spin in button.css and ow-spin in tailwind.css.",
  },
]);

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M12 5v14" />
  </svg>
);

type Variant = "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
const VARIANTS: Variant[] = [...ALL_VARIANTS];
const SIZES = ["sm", "md", "lg"] as const;

interface Spec {
  name: string;
  variant: Variant;
  size?: (typeof SIZES)[number];
  soft?: boolean;
  loading?: boolean;
  start?: boolean;
  end?: boolean;
  iconOnly?: boolean;
  held?: boolean;
  disabled?: boolean;
  label?: boolean;
}

const specs: Spec[] = VARIANTS.flatMap((variant) => [
  ...SIZES.flatMap((size) =>
    [false, true].map((soft) => ({
      name: `${variant} ${size}${soft ? " soft" : ""}`,
      variant,
      size,
      soft,
    })),
  ),
  { name: `${variant} start+end icons`, variant, start: true, end: true },
  { name: `${variant} start icon, loading`, variant, start: true, loading: true },
  { name: `${variant} start icon, not loading`, variant, start: true, loading: false },
  { name: `${variant} loading`, variant, loading: true },
  { name: `${variant} soft loading`, variant, soft: true, loading: true },
  { name: `${variant} icon only`, variant, iconOnly: true },
  { name: `${variant} icon only, loading`, variant, iconOnly: true, loading: true },
  { name: `${variant} held`, variant, held: true },
  { name: `${variant} soft held`, variant, soft: true, held: true },
  { name: `${variant} disabled`, variant, disabled: true },
  { name: `${variant} disabled, loading`, variant, disabled: true, loading: true },
]);

type Kit = { Button: typeof CssButton; IconButton: typeof CssIconButton };

function button(kit: Kit, spec: Spec): ReactElement {
  const { variant, size, soft, loading, start, end, iconOnly, held, disabled } = spec;
  const common = {
    variant,
    size,
    soft,
    loading,
    disabled,
    "data-held": held ? "" : undefined,
  };
  if (iconOnly) return <kit.IconButton {...common} icon={<Plus />} aria-label="Add" />;
  return (
    <kit.Button
      {...common}
      startIcon={start ? <Plus /> : undefined}
      endIcon={end ? <Plus /> : undefined}
    >
      Save
    </kit.Button>
  );
}

const cases: Case[] = specs.map((spec) => ({
  name: spec.name,
  css: button({ Button: CssButton, IconButton: CssIconButton }, spec),
  tw: button({ Button: TwButton, IconButton: TwIconButton }, spec),
}));

describe("Button in Tailwind CSS v4 against button.css", () => {
  test("every variant, size, soft, and state matches in the light theme", async () => {
    await tw.parity(cases);
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark" });
  });

  test("and in a right-to-left page", async () => {
    await tw.parity(cases, { dir: "rtl" });
  });

  test("hover tints the face the same way", { timeout: 60_000 }, async () => {
    for (const variant of VARIANTS) await tw.states(cases, `${variant} md`, "hover");
  });

  test("a held press, with a real pointer, matches", { timeout: 60_000 }, async () => {
    for (const variant of VARIANTS) await tw.states(cases, `${variant} soft held`, "held");
    for (const variant of VARIANTS) await tw.states(cases, `${variant} md`, "held");
  });

  test("keyboard focus draws the same ring", { timeout: 60_000 }, async () => {
    for (const variant of VARIANTS) await tw.states(cases, `${variant} md`, "focus");
  });

  test("reduced motion matches", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases);
    await tw.states(cases, "primary md", "held");
  });

  test("forced colors match", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases);
    await tw.states(cases, "primary md", "focus");
    await tw.states(cases, "outline md", "hover");
  });

  test("transitions are the same: property, duration, easing", async () => {
    await tw.motion(cases);
  });

  test("the spinner animates the same way, and pulses when motion is reduced", async () => {
    tw.load();
    const screen = await render(
      <div data-theme="light">
        {["primary loading", "ghost start icon, loading", "link soft loading"].map((name) => {
          const spec = specs.find((one) => one.name === name);
          if (!spec) throw new Error(name);
          return (
            <div key={name} data-case={name} style={{ display: "flex" }}>
              <div data-side="css">
                {button({ Button: CssButton, IconButton: CssIconButton }, spec)}
              </div>
              <div data-side="tw">
                {button({ Button: TwButton, IconButton: TwIconButton }, spec)}
              </div>
            </div>
          );
        })}
      </div>,
    );
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    const problems: string[] = [];
    for (const mode of ["no-preference", "reduce"] as const) {
      await commands.setReducedMotion(mode);
      await frame();
      await frame();
      for (const row of screen.container.querySelectorAll("[data-case]")) {
        const name = row.getAttribute("data-case");
        const spin = (side: Element | null) =>
          [...(side?.querySelectorAll("svg") ?? [])]
            .map((svg) => pick(getComputedStyle(svg), MOTION))
            .find((style) => style.animationName !== "none");
        const [a, b] = [
          spin(row.querySelector('[data-side="css"]')),
          spin(row.querySelector('[data-side="tw"]')),
        ];
        if (!a || !b) problems.push(`${mode} ${name}: no spinner animation`);
        else {
          // The keyframes are named ow-button-spin and ow-spin: compare them without the prefix.
          const norm = (style: Record<string, string>) => ({
            ...style,
            animationName: style.animationName?.replace(/^ow-(button-)?/, ""),
          });
          if (JSON.stringify(norm(a)) !== JSON.stringify(norm(b))) {
            problems.push(`${mode} ${name}: ${JSON.stringify([a, b])}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("className on the Tailwind version", () => {
  test("a user's utilities override the component's", async () => {
    tw.load();
    await render(<style>{"*, ::before, ::after { transition: none !important; }"}</style>);
    const screen = await render(<TwButton className="rounded-none bg-red-500 px-8">One</TwButton>);
    const one = screen.container.querySelector<HTMLElement>("button");
    if (!one) throw new Error("not rendered");
    expect(getComputedStyle(one).borderTopLeftRadius).toBe("0px");
    expect(getComputedStyle(one).backgroundColor).toBe("oklch(0.637 0.237 25.331)");
    expect(getComputedStyle(one).paddingLeft).toBe("32px");
    expect(one.className).not.toMatch(/(^| )rounded-\(--ow-radius\)( |$)/);
    expect(one.className).not.toMatch(/(^| )px-\(--px\)( |$)/);
  });

  test("a user's utilities beat the variant's, the size's, and soft's", async () => {
    tw.load();
    const red = "oklch(0.637 0.237 25.331)";
    const colors = (node: HTMLElement) => ({
      text: getComputedStyle(node).color,
      face: getComputedStyle(node, "::before").backgroundColor,
      shadow: normalize("boxShadow", getComputedStyle(node, "::before").boxShadow),
    });
    const screen = await render(
      <>
        <TwButton variant="primary">Plain</TwButton>
        <TwButton variant="primary" className="text-red-500 before:bg-red-500 before:shadow-none">
          Text and face
        </TwButton>
        <TwButton variant="primary" soft className="text-red-500 before:bg-red-500">
          Soft
        </TwButton>
        <TwButton size="sm" className="px-8 py-1">
          Small
        </TwButton>
        <TwButton size="lg" className="[--py:2em] text-[1.5rem]">
          Large
        </TwButton>
        <TwButton variant="outline" className="before:shadow-none">
          Outline
        </TwButton>
      </>,
    );
    const [plain, text, soft, small, large, outline] = [
      ...screen.container.querySelectorAll<HTMLElement>("button"),
    ] as HTMLElement[];
    if (!plain || !text || !soft || !small || !large || !outline) {
      throw new Error("not rendered");
    }
    expect(colors(plain).text).not.toBe(red);
    expect(colors(plain).face).not.toBe(red);
    expect(colors(text)).toMatchObject({ text: red, face: red, shadow: "none" });
    expect(colors(soft)).toMatchObject({ text: red, face: red });
    expectStyles(small, { paddingLeft: "32px", paddingTop: "4px" });
    expectStyles(large, { fontSize: "24px", paddingTop: "48px" });
    expect(colors(outline).shadow).toBe("none");
    // Held, the user's face goes, as the variant's own does: the pressed fill takes over.
    expect(text.className).not.toContain("before:bg-(color:--ow-accent)");
  });

  test("buttonVariants() output merges with a className, the user's last", () => {
    const merged = cn(buttonVariants({ variant: "primary" }), "rounded-none");
    expect(merged).toContain("rounded-none");
    expect(merged).not.toContain("rounded-(--ow-radius)");
  });
});

describe("buttonVariants() on a link", () => {
  const links: Case[] = VARIANTS.flatMap((variant) =>
    [false, true].map((soft) => ({
      name: `${variant}${soft ? " soft" : ""}`,
      css: (
        <a href="#next" className={cssVariants({ variant, soft })}>
          Next
        </a>
      ),
      tw: (
        <a href="#next" className={buttonVariants({ variant, soft })}>
          Next
        </a>
      ),
    })),
  );

  test("looks the same in both versions", async () => {
    await tw.parity(links);
  });

  test("and hovered", async () => {
    await tw.states(links, "link", "hover");
    await tw.states(links, "primary", "hover");
  });
});
