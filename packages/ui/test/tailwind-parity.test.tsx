import type { ReactElement, ReactNode } from "react";
import { beforeAll, describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button as CssButton, IconButton as CssIconButton } from "../src/components/button/button";
import { buttonVariants as cssVariants } from "../src/components/button/button-variants";
import tokens from "../src/core/tokens/tokens.css?raw";
import { Button as TwButton, IconButton as TwIconButton } from "../src/tailwind/button/button";
import { buttonSlots, buttonVariants } from "../src/tailwind/button/button-variants";
import { cn } from "../src/tailwind/lib/cn";

// The Tailwind version of Button (src/tailwind/button, generated) against the CSS version
// (button.css): the same cases side by side, and the computed styles of every part compared.

const SETUP = `
@import "./src/tailwind.css";
@import "tailwindcss";
@import "./src/core/tokens/tokens.css";
`;
const OVERRIDES =
  "rounded-none bg-red-500 px-8 py-1 shadow-none text-sm ease-linear bg-green-500 text-red-500 before:bg-red-500 before:shadow-none text-[1.5rem] [--py:2em]";
const ALL_VARIANTS = ["primary", "secondary", "outline", "ghost", "link", "destructive"] as const;
const candidates = [
  ...new Set([
    ...Object.values(buttonSlots).flatMap((value) => value.split(/\s+/)),
    ...ALL_VARIANTS.flatMap((variant) =>
      (["sm", "md", "lg"] as const).flatMap((size) =>
        [false, true].flatMap((soft) => buttonVariants({ variant, size, soft }).split(/\s+/)),
      ),
    ),
    ...OVERRIDES.split(" "),
  ]),
];

let css = "";
beforeAll(async () => {
  css = await commands.compileTailwind(SETUP, candidates);
  expect(tokens.length).toBeGreaterThan(0);
});

/** Loads the compiled CSS first, as an app's global CSS: its layer order statement wins. */
function loadTailwind() {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.prepend(style);
  onTestFinished(() => style.remove());
}

/** Turns transitions and animations off, so each element is measured where it ends. */
function freeze() {
  const style = document.createElement("style");
  style.textContent =
    "*, ::before, ::after { transition: none !important; animation: none !important; }";
  document.head.append(style);
  onTestFinished(() => style.remove());
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

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

function Cases({ theme }: { theme: "light" | "dark" }): ReactNode {
  return (
    <div data-theme={theme} style={{ background: "var(--ow-bg)", color: "var(--ow-fg)" }}>
      {specs.map((spec) => (
        <div key={spec.name} data-case={spec.name} style={{ display: "flex" }}>
          <div data-side="css" style={{ inlineSize: 360, padding: 12 }}>
            {button({ Button: CssButton, IconButton: CssIconButton }, spec)}
          </div>
          <div data-side="tw" style={{ inlineSize: 360, padding: 12 }}>
            {button({ Button: TwButton, IconButton: TwIconButton }, spec)}
          </div>
        </div>
      ))}
    </div>
  );
}

// What matters on a part: the box, type, colors, the face, and the states.
const PROPS = [
  "display",
  "position",
  "boxSizing",
  "zIndex",
  "overflow",
  "isolation",
  "alignItems",
  "justifyContent",
  "placeItems",
  "columnGap",
  "rowGap",
  "gridRowStart",
  "gridColumnStart",
  "flexGrow",
  "flexShrink",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "top",
  "right",
  "bottom",
  "left",
  "borderTopWidth",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "color",
  "backgroundColor",
  "backgroundImage",
  "boxShadow",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "whiteSpace",
  "verticalAlign",
  "textDecorationLine",
  "textDecorationColor",
  "textDecorationThickness",
  "textUnderlineOffset",
  "opacity",
  "cursor",
  "pointerEvents",
  "touchAction",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
] as const;
const PSEUDO = [
  "content",
  "position",
  "zIndex",
  "top",
  "right",
  "bottom",
  "left",
  "borderTopLeftRadius",
  "backgroundColor",
  "backgroundImage",
  "boxShadow",
  "pointerEvents",
] as const;
const ANIMATION = [
  "animationName",
  "animationDuration",
  "animationIterationCount",
  "animationDirection",
  "animationTimingFunction",
] as const;

type Style = Record<string, string>;
// Tailwind's shadow utilities compute to a stack of empty shadows where CSS says `none`, and a
// face with no image layer computes without the trailing `none`: the same pixels.
const EMPTY_SHADOW = "rgba(0, 0, 0, 0) 0px 0px 0px 0px";
function normalize(name: string, value: string): string {
  if (name === "boxShadow") {
    const shadows = value.split(/, (?![^(]*\))/).filter((shadow) => shadow !== EMPTY_SHADOW);
    return shadows.join(", ") || "none";
  }
  if (name === "backgroundImage") return value.replace(/, none$/, "");
  return value;
}
const pick = (style: CSSStyleDeclaration, names: readonly string[]): Style =>
  Object.fromEntries(
    names.map((name) => [name, normalize(name, String(style[name as keyof CSSStyleDeclaration]))]),
  );
const round = (n: number) => Math.round(n * 100) / 100;

/** Every element of a side: the geometry from its container, and its computed styles. */
function measure(side: Element, props: readonly string[]) {
  const origin = side.getBoundingClientRect();
  const root = side.firstElementChild as HTMLElement;
  return [root, ...root.querySelectorAll("*")].map((el, index) => {
    const box = el.getBoundingClientRect();
    return {
      index,
      tag: el.tagName.toLowerCase(),
      // Nothing is laid out (display: none, here or above): the box has no place.
      box: (el.getClientRects().length === 0
        ? [0, 0, 0, 0]
        : [box.x - origin.x, box.y - origin.y, box.width, box.height]
      ).map(round),
      style: pick(getComputedStyle(el), props),
      before: index === 0 ? pick(getComputedStyle(el, "::before"), PSEUDO) : undefined,
    };
  });
}

/** The differences between the two versions of one case. */
function compare(name: string, css: ReturnType<typeof measure>, tw: ReturnType<typeof measure>) {
  const problems: string[] = [];
  if (css.length !== tw.length) return [`${name}: ${css.length} parts against ${tw.length}`];
  css.forEach((a, i) => {
    const b = tw[i];
    if (!b) return;
    const where = `${name} [${i} ${a.tag}]`;
    a.box.forEach((n, k) => {
      if (Math.abs(n - (b.box[k] ?? Number.NaN)) > 0.1) {
        problems.push(`${where} box ${["x", "y", "w", "h"][k]}: ${n} / ${b.box[k]}`);
      }
    });
    for (const [prop, value] of Object.entries(a.style)) {
      if (value !== b.style[prop]) problems.push(`${where} ${prop}: ${value} / ${b.style[prop]}`);
    }
    for (const [prop, value] of Object.entries(a.before ?? {})) {
      if (value !== b.before?.[prop]) {
        problems.push(`${where} ::before ${prop}: ${value} / ${b.before?.[prop]}`);
      }
    }
  });
  return problems;
}

function sides(container: Element, name: string) {
  const row = container.querySelector(`[data-case="${name}"]`);
  const css = row?.querySelector('[data-side="css"]');
  const tw = row?.querySelector('[data-side="tw"]');
  if (!css || !tw) throw new Error(`no case ${name}`);
  return { css, tw };
}

async function parity(
  theme: "light" | "dark",
  props: readonly string[],
  names = specs.map((s) => s.name),
) {
  loadTailwind();
  freeze();
  const screen = await render(<Cases theme={theme} />);
  await frame();
  await frame();
  const problems = names.flatMap((name) => {
    const { css, tw } = sides(screen.container, name);
    return compare(name, measure(css, props), measure(tw, props));
  });
  expect(unique(problems)).toEqual([]);
}

/** One line per kind of difference, with the first case it shows in and how many cases have it. */
function unique(problems: string[]): string[] {
  const kinds = new Map<string, { first: string; count: number }>();
  for (const problem of problems) {
    const [name = "", kind = ""] =
      problem.split(/ (?=\[\d+ [a-z]+\])|(?<=\]) /).length > 1
        ? [problem.slice(0, problem.indexOf(" [")), problem.slice(problem.indexOf(" ["))]
        : [problem, ""];
    const seen = kinds.get(kind);
    if (seen) seen.count++;
    else kinds.set(kind, { first: name, count: 1 });
  }
  return [...kinds].map(([kind, { first, count }]) => `${kind} (${first}, x${count})`);
}

describe("Button in Tailwind CSS v4 against button.css", () => {
  test("every variant, size, soft, and state matches in the light theme", async () => {
    await parity("light", PROPS);
  });

  test("and in the dark theme", async () => {
    await parity("dark", PROPS);
  });

  test("hover tints the face the same way", async () => {
    loadTailwind();
    freeze();
    const screen = await render(<Cases theme="light" />);
    await frame();
    const problems: string[] = [];
    for (const variant of VARIANTS) {
      const { css, tw } = sides(screen.container, `${variant} md`);
      const [a, b] = [css, tw].map((side) => side.firstElementChild as HTMLElement);
      const snapshot = async (el: HTMLElement | undefined) => {
        if (!el) throw new Error("no button");
        await userEvent.hover(el);
        await frame();
        return pick(getComputedStyle(el), PROPS).backgroundColor === undefined
          ? []
          : [pick(getComputedStyle(el), PROPS), pick(getComputedStyle(el, "::before"), PSEUDO)];
      };
      const [x, y] = [await snapshot(a), await snapshot(b)];
      if (JSON.stringify(x) !== JSON.stringify(y))
        problems.push(`${variant}: ${JSON.stringify([x, y])}`);
    }
    await userEvent.unhover(document.body);
    expect(problems).toEqual([]);
  });

  test("reduced motion and forced colors match too", async () => {
    loadTailwind();
    freeze();
    const names = [
      "primary held",
      "outline loading",
      "ghost start icon, loading",
      "link md",
      "primary disabled",
    ];
    const screen = await render(<Cases theme="light" />);
    onTestFinished(async () => {
      await commands.setReducedMotion("no-preference");
      await commands.setForcedColors("none");
    });
    for (const mode of ["reduced", "forced"]) {
      if (mode === "reduced") await commands.setReducedMotion("reduce");
      else {
        await commands.setReducedMotion("no-preference");
        await commands.setForcedColors("active");
      }
      await frame();
      await frame();
      const problems = names.flatMap((name) => {
        const { css, tw } = sides(screen.container, name);
        return compare(`${mode} ${name}`, measure(css, PROPS), measure(tw, PROPS));
      });
      expect(unique(problems), mode).toEqual([]);
    }
  });

  test("the spinner animates the same way, and pulses when motion is reduced", async () => {
    loadTailwind();
    const screen = await render(<Cases theme="light" />);
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    const problems: string[] = [];
    for (const mode of ["no-preference", "reduce"] as const) {
      await commands.setReducedMotion(mode);
      await frame();
      await frame();
      for (const name of ["primary loading", "ghost start icon, loading", "link soft loading"]) {
        const { css, tw } = sides(screen.container, name);
        const spin = (side: Element) =>
          [...side.querySelectorAll("svg")]
            .map((svg) => pick(getComputedStyle(svg), ANIMATION))
            .find((style) => style.animationName !== "none");
        const [a, b] = [spin(css), spin(tw)];
        if (!a || !b) problems.push(`${mode} ${name}: no spinner animation`);
        else {
          // The keyframes are named ow-button-spin and ow-spin: compare them without the prefix.
          const norm = (style: Style) => ({
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
    loadTailwind();
    freeze();
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
    loadTailwind();
    freeze();
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
    expect(getComputedStyle(small).paddingLeft).toBe("32px");
    expect(getComputedStyle(small).paddingTop).toBe("4px");
    expect(getComputedStyle(large).fontSize).toBe("24px");
    expect(getComputedStyle(large).paddingTop).toBe("48px");
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
  test("looks the same in both versions", async () => {
    loadTailwind();
    freeze();
    const cases = VARIANTS.flatMap((variant) =>
      [false, true].map((soft) => ({ name: `${variant}${soft ? " soft" : ""}`, variant, soft })),
    );
    const screen = await render(
      <div data-theme="light" style={{ background: "var(--ow-bg)", color: "var(--ow-fg)" }}>
        {cases.map(({ name, variant, soft }) => (
          <div key={name} data-case={name} style={{ display: "flex" }}>
            <div data-side="css" style={{ inlineSize: 240, padding: 12 }}>
              <a href="#next" className={cssVariants({ variant, soft })}>
                Next
              </a>
            </div>
            <div data-side="tw" style={{ inlineSize: 240, padding: 12 }}>
              <a href="#next" className={buttonVariants({ variant, soft })}>
                Next
              </a>
            </div>
          </div>
        ))}
      </div>,
    );
    await frame();
    await frame();
    const problems = cases.flatMap(({ name }) => {
      const { css, tw } = sides(screen.container, name);
      return compare(name, measure(css, PROPS), measure(tw, PROPS));
    });
    expect(unique(problems)).toEqual([]);
  });
});

describe("cn and the Button's shorthands", () => {
  // The utility of each shorthand the Button map uses, and a built-in utility of the same kind.
  const BUILT_IN: Record<string, string> = {
    animate: "animate-none",
    bg: "bg-red-500",
    duration: "duration-75",
    ease: "ease-linear",
    me: "me-1",
    ms: "ms-1",
    outline: "outline-red-500",
    px: "px-1",
    py: "py-1",
    rounded: "rounded-none",
    scale: "scale-50",
    shadow: "shadow-none",
    size: "size-4",
    text: "text-red-500",
  };
  // Variants stay with the utility: before:bg-(color:--ow-accent) meets before:bg-red-500.
  const shorthands = candidates.filter((name) =>
    /-\((color:|shadow:)?--[\w-]+\)$|(^|:)animate-\[/.test(name),
  );

  test("each is replaced by a built-in of its kind, in either order", () => {
    expect(shorthands.length).toBeGreaterThan(15);
    const problems = shorthands.flatMap((name) => {
      const head = name.replace(/-(\(.*|\[[^\]]*\])$/, "");
      const prefix = head.slice(0, head.lastIndexOf(":") + 1);
      const utility = head.slice(prefix.length);
      const base = BUILT_IN[utility];
      if (!base) return [`${name}: add "${utility}" to this test`];
      const builtIn = `${prefix}${base}`;
      const merged = cn(name, builtIn);
      const reverse = cn(builtIn, name);
      return [
        ...(merged === builtIn ? [] : [`${name} + ${builtIn} gives ${merged}`]),
        ...(reverse === name ? [] : [`${builtIn} + ${name} gives ${reverse}`]),
      ];
    });
    expect(problems).toEqual([]);
  });

  test("a plain utility still merges", () => {
    expect(cn("px-4", false, undefined, "px-8")).toBe("px-8");
  });
});
