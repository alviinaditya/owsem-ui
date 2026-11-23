import type { ReactElement, ReactNode } from "react";
import { beforeAll, expect, onTestFinished } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import tokens from "../src/core/tokens/tokens.css?raw";

// Shared by the parity tests (parity-*.test.tsx): the Tailwind flavor of a component (src/tailwind,
// generated) against its CSS flavor. Both flavors are rendered side by side in the same cases, and
// the computed styles of every part and pseudo element are compared. Differences that are accepted
// are listed by each test file with their reason.
//
// A test file: `const tw = tailwindParity(candidates, accepted)`, cases as `{ name, css, tw }`, then
// `tw.parity(cases)` for the end states, `tw.states(cases, name, "hover")` for real input,
// `tw.motion(cases)` for transitions and animations.

const SETUP = `
@import "./src/tailwind.css";
@import "tailwindcss";
@import "./src/core/tokens/tokens.css";
`;

export const frame = (): Promise<unknown> =>
  new Promise((resolve) => requestAnimationFrame(resolve));

/** The class names in the given class strings. */
export const classNames = (...values: string[]): string[] => [
  ...new Set(values.flatMap((value) => value.split(/\s+/)).filter(Boolean)),
];

/** What matters on a part: the box, type, colors, the face, and the states. */
export const PROPS: readonly string[] = [
  "display",
  "position",
  "boxSizing",
  "zIndex",
  "overflow",
  "isolation",
  "flexDirection",
  "flexGrow",
  "flexShrink",
  "alignItems",
  "alignSelf",
  "justifyContent",
  "placeItems",
  "columnGap",
  "rowGap",
  "gridRowStart",
  "gridColumnStart",
  "width",
  "height",
  "minWidth",
  "minHeight",
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
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderLeftStyle",
  "borderTopColor",
  "borderLeftColor",
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
  "fontStyle",
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
  "resize",
  "transform",
  "scale",
  "willChange",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
];

/** The pseudo elements ::before and ::after of a part. */
export const PSEUDO: readonly string[] = [
  "content",
  "display",
  "position",
  "zIndex",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "borderTopLeftRadius",
  "backgroundColor",
  "backgroundImage",
  "boxShadow",
  "pointerEvents",
];

/** What ::placeholder draws, on the fields that have one. */
const PLACEHOLDER: readonly string[] = ["color", "opacity"];

/** Transitions and animations as authored: duration, easing, name. */
export const MOTION: readonly string[] = [
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
  "transitionDelay",
  "animationName",
  "animationDuration",
  "animationTimingFunction",
  "animationDelay",
  "animationIterationCount",
  "animationDirection",
  "animationFillMode",
  "willChange",
];

type Style = Record<string, string>;

// Tailwind's shadow utilities compute to a stack of empty shadows where CSS says `none`, and a
// face with no image layer computes without the trailing `none`: the same pixels.
const EMPTY_SHADOW = "rgba(0, 0, 0, 0) 0px 0px 0px 0px";
export function normalize(name: string, value: string): string {
  if (name === "boxShadow") {
    const shadows = value.split(/, (?![^(]*\))/).filter((shadow) => shadow !== EMPTY_SHADOW);
    return shadows.join(", ") || "none";
  }
  if (name === "backgroundImage") return value.replace(/, none$/, "");
  return value;
}

/** `scale: 0.5` and `transform: scale(0.5)` draw the same; both read as one matrix. */
function effectiveTransform(transform: string, scale: string | undefined): string {
  if (transform !== "none" || !scale || scale === "none") return transform;
  const [x = "1", y = x] = scale.split(" ");
  return `matrix(${x}, 0, 0, ${y}, 0, 0)`;
}

/** The comma-separated items of a list, without splitting inside parentheses. */
const items = (list: string): string[] => list.split(/,\s*(?![^(]*\))/);

export function pick(style: CSSStyleDeclaration, names: readonly string[]): Style {
  const read = (name: string) => String(style[name as keyof CSSStyleDeclaration]);
  const picked: Style = Object.fromEntries(
    names.map((name) => [name, normalize(name, read(name))]),
  );
  // A border has no style or color at zero width: Tailwind's preflight says solid, CSS says none.
  for (const side of ["Top", "Right", "Bottom", "Left"]) {
    if (read(`border${side}Width`) !== "0px") continue;
    for (const part of ["Style", "Color"]) {
      if (`border${side}${part}` in picked) picked[`border${side}${part}`] = "-";
    }
  }
  // Both ask for the layer the movement needs.
  if (picked.willChange === "scale") picked.willChange = "transform";
  if ("transform" in picked) {
    picked.transform = effectiveTransform(read("transform"), picked.scale);
    delete picked.scale;
  }
  // `transition: transform` and `transition-property: scale` move the same way, and a list that is
  // shorter than the properties repeats.
  if (picked.transitionProperty) {
    const properties = items(picked.transitionProperty.replace(/\bscale\b/g, "transform"));
    picked.transitionProperty = properties.join(", ");
    for (const name of ["transitionDuration", "transitionTimingFunction", "transitionDelay"]) {
      const list = picked[name] === undefined ? [] : items(picked[name]);
      if (list.length > 0) {
        picked[name] = properties.map((_, i) => list[i % list.length]).join(", ");
      }
    }
  }
  return picked;
}

const round = (n: number) => Math.round(n * 100) / 100;

export interface Part {
  index: number;
  label: string;
  /** The box from the side's top left corner; zeros when nothing is laid out. */
  box: number[];
  style: Style;
  before: Style;
  after: Style;
  placeholder: Style | undefined;
}

/** Every element of a side: the geometry from its container, and its computed styles. */
export function measure(side: Element, props: readonly string[] = PROPS): Part[] {
  return measureFrom(side, side.firstElementChild as Element, props);
}

/**
 * The parts of `root` and everything in it, with boxes from the corner of `origin`. For a popup
 * that renders in a portal outside its side: its trigger is the origin.
 */
export function measureFrom(
  origin: Element,
  root: Element,
  props: readonly string[] = PROPS,
): Part[] {
  const corner = origin.getBoundingClientRect();
  return [root, ...root.querySelectorAll("*")].map((el, index) => {
    const box = el.getBoundingClientRect();
    const slot = el.getAttribute("data-slot");
    const field = el.matches("input, textarea");
    return {
      index,
      label: `${index} ${el.tagName.toLowerCase()}${slot ? ` ${slot}` : ""}`,
      // Nothing is laid out (display: none, here or above): the box has no place.
      // A fixed element, such as Base UI's hidden input, is placed in the viewport, not in its side.
      box: (el.getClientRects().length === 0
        ? [0, 0, 0, 0]
        : getComputedStyle(el).position === "fixed"
          ? [box.x, box.y, box.width, box.height]
          : [box.x - corner.x, box.y - corner.y, box.width, box.height]
      ).map(round),
      style: pick(getComputedStyle(el), props),
      before: pick(getComputedStyle(el, "::before"), PSEUDO),
      after: pick(getComputedStyle(el, "::after"), PSEUDO),
      placeholder: field ? pick(getComputedStyle(el, "::placeholder"), PLACEHOLDER) : undefined,
    };
  });
}

/** One difference between the flavors, in one part of one case. */
export interface Problem {
  name: string;
  part: string;
  /** The property, or `::before width`, or `box x`. */
  what: string;
  css: string;
  tailwind: string;
}

/** A difference that is accepted, with the reason. `when` sees the part's label and the property. */
export interface Accepted {
  what: RegExp;
  /** Limits the rule to parts whose label ("0 button", "2 span input-icon") matches. */
  part?: RegExp;
  /** Lengths in px that differ by no more than this are the same (layout rounds to 1/64 px). */
  within?: number;
  reason: string;
}

const px = (value: string): number | undefined =>
  /^-?[\d.]+px$/.test(value) ? Number.parseFloat(value) : undefined;

/** Input's one accepted difference, which every test that draws an Input lists. */
export const INPUT_RESIZE: Accepted = {
  what: /^resize$/,
  part: /^\d+ input /,
  reason:
    "Only a textarea resizes, so an input computes `vertical` and draws nothing of it; the class stays so a user's resize utility can replace it.",
};

/** The Button's ripple, in a test that draws a Button: hidden when motion is reduced. */
export const BUTTON_RIPPLE: Accepted = {
  what: /^transform$/,
  part: /button-ripple/,
  reason: "The ripple is display: none when motion is reduced; only its unseen scale differs.",
};

export function compare(name: string, css: Part[], tw: Part[]): Problem[] {
  const problems: Problem[] = [];
  if (css.length !== tw.length) {
    return [
      { name, part: "-", what: "parts", css: String(css.length), tailwind: String(tw.length) },
    ];
  }
  css.forEach((a, i) => {
    const b = tw[i];
    if (!b) return;
    const add = (what: string, x: string, y: string | undefined) => {
      if (x !== y) problems.push({ name, part: a.label, what, css: x, tailwind: String(y) });
    };
    a.box.forEach((n, k) => {
      const m = b.box[k] ?? Number.NaN;
      if (Math.abs(n - m) > 0.1) add(`box ${["x", "y", "w", "h"][k]}`, String(n), String(m));
    });
    for (const [prop, value] of Object.entries(a.style)) add(prop, value, b.style[prop]);
    for (const pseudo of ["before", "after"] as const) {
      for (const [prop, value] of Object.entries(a[pseudo])) {
        add(`::${pseudo} ${prop}`, value, b[pseudo][prop]);
      }
    }
    for (const [prop, value] of Object.entries(a.placeholder ?? {})) {
      add(`::placeholder ${prop}`, value, b.placeholder?.[prop]);
    }
  });
  return problems;
}

/** One line per kind of difference, with the first case it shows in and how many cases have it. */
export function summarize(problems: Problem[]): string[] {
  const kinds = new Map<string, { first: Problem; count: number }>();
  for (const problem of problems) {
    const kind = `[${problem.part}] ${problem.what}: ${problem.css} / ${problem.tailwind}`;
    const seen = kinds.get(kind);
    if (seen) seen.count++;
    else kinds.set(kind, { first: problem, count: 1 });
  }
  return [...kinds].map(([kind, { first, count }]) => `${kind} (${first.name}, x${count})`);
}

/** One flavor of a case. */
export interface Case {
  name: string;
  css: ReactElement;
  tw: ReactElement;
}

export interface Options {
  theme?: "light" | "dark";
  dir?: "ltr" | "rtl";
  /** Only these cases. */
  names?: string[];
  /** The part of a side to act on, as a selector; the side's first element by default. */
  target?: string;
  /** Properties to compare instead of PROPS. */
  props?: readonly string[];
  /**
   * Runs on each side after it is rendered and before it is measured, to put it in a state the
   * component sets itself, such as `data-ending-style`. It must do the same to both sides.
   */
  prepare?: (side: Element) => void | Promise<void>;
  /**
   * Leaves transitions and animations running, so a state's authored transition can be read
   * (computed `transition-duration` of an element held down). Only for tests that read the motion
   * properties: the end states of a running transition are not the end states, so `states()`
   * compares no boxes then.
   */
  live?: boolean;
}

export type Media = "reduced-motion" | "forced-colors" | "more-contrast";

/** Turns a media feature on for the test; the test's end turns it off. */
export async function setMedia(media: Media): Promise<void> {
  if (media === "reduced-motion") {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
  } else if (media === "forced-colors") {
    onTestFinished(() => commands.setForcedColors("none"));
    await commands.setForcedColors("active");
  } else {
    onTestFinished(() => commands.setContrast("no-preference"));
    await commands.setContrast("more");
  }
  await frame();
}

function Sides({ cases, theme, dir }: { cases: Case[]; theme: string; dir: string }): ReactNode {
  return (
    <div dir={dir} data-theme={theme} style={{ background: "var(--ow-bg)", color: "var(--ow-fg)" }}>
      {/* Where a Tab starts, so the first case is the next stop. */}
      <button
        type="button"
        data-start=""
        aria-hidden="true"
        tabIndex={-1}
        style={{ position: "fixed", opacity: 0 }}
      />
      {cases.map((one) => (
        <div key={one.name} data-case={one.name} style={{ display: "flex" }}>
          <div data-side="css" style={{ inlineSize: 360, padding: 12 }}>
            {one.css}
          </div>
          <div data-side="tw" style={{ inlineSize: 360, padding: 12 }}>
            {one.tw}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Parity {
  /** Both flavors of each case, in the end state, compared part by part. */
  parity(cases: Case[], options?: Options): Promise<void>;
  /** A real hover, a held press, or keyboard focus on one case, in both flavors. */
  states(cases: Case[], name: string, state: State, options?: Options): Promise<void>;
  /** Transitions and animations as authored, not frozen. */
  motion(cases: Case[], options?: Options): Promise<void>;
  /** Renders the cases with the Tailwind CSS loaded, motion frozen. */
  mount(cases: Case[], options?: Options): Promise<{ container: Element }>;
  /**
   * Parts measured by the test itself, for a popup that renders in a portal outside its side:
   * `measureFrom` its trigger. Compared like any other parts, with the accepted differences.
   */
  expectParts(name: string, css: Part[], tailwind: Part[]): void;
  /** Loads the compiled Tailwind CSS first, as an app's global CSS: its layer order wins. */
  load(): void;
}

export type State = "hover" | "held" | "focus";

/**
 * Compiles the Tailwind CSS for `candidates` once for the file. `accepted` lists the differences
 * between the flavors that are fine, each with its reason; anything else fails the test.
 */
export function tailwindParity(candidates: Iterable<string>, accepted: Accepted[] = []): Parity {
  let css = "";
  beforeAll(async () => {
    css = await commands.compileTailwind(SETUP, [...new Set(candidates)]);
    expect(tokens.length).toBeGreaterThan(0);
  });

  const load = () => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.prepend(style);
    onTestFinished(() => style.remove());
  };

  /** Turns transitions and animations off, so each element is measured where it ends. */
  const freeze = () => {
    const style = document.createElement("style");
    style.textContent =
      "*, ::before, ::after { transition: none !important; animation: none !important; }";
    document.head.append(style);
    onTestFinished(() => style.remove());
  };

  const sides = (container: Element, name: string) => {
    const row = container.querySelector(`[data-case="${name}"]`);
    const a = row?.querySelector('[data-side="css"]');
    const b = row?.querySelector('[data-side="tw"]');
    if (!a || !b) throw new Error(`no case ${name}`);
    return { css: a, tw: b };
  };

  const unaccepted = (problems: Problem[]) =>
    problems.filter(
      (p) =>
        !accepted.some(
          (rule) =>
            rule.what.test(p.what) &&
            (!rule.part || rule.part.test(p.part)) &&
            (rule.within === undefined ||
              Math.abs((px(p.css) ?? Number.NaN) - (px(p.tailwind) ?? Number.NaN)) <= rule.within),
        ),
    );

  /** Moves the pointer to a corner nothing is drawn in, so no case starts hovered. */
  const park = async () => {
    const corner = document.createElement("div");
    corner.style.cssText =
      "position:fixed;inset-block-end:0;inset-inline-end:0;inline-size:4px;block-size:4px";
    document.body.append(corner);
    await userEvent.hover(corner);
    corner.remove();
  };

  const show = async (cases: Case[], options: Options) => {
    return render(
      <Sides cases={cases} theme={options.theme ?? "light"} dir={options.dir ?? "ltr"} />,
    );
  };

  const prepare = async (container: Element, options: Options) => {
    if (!options.prepare) return;
    for (const side of container.querySelectorAll(":scope [data-side=css], :scope [data-side=tw]"))
      await options.prepare(side);
    await frame();
  };

  const mount = async (cases: Case[], options: Options = {}) => {
    load();
    if (!options.live) freeze();
    await park();
    const screen = await show(cases, options);
    await frame();
    await frame();
    await prepare(screen.container, options);
    return screen;
  };

  const parity = async (cases: Case[], options: Options = {}) => {
    const screen = await mount(cases, options);
    const names = options.names ?? cases.map((one) => one.name);
    const problems = names.flatMap((name) => {
      const { css: a, tw: b } = sides(screen.container, name);
      return compare(name, measure(a, options.props), measure(b, options.props));
    });
    expect(summarize(unaccepted(problems))).toEqual([]);
  };

  const target = (side: Element, options: Options): HTMLElement => {
    const el = options.target ? side.querySelector(options.target) : side.firstElementChild;
    if (!(el instanceof HTMLElement)) throw new Error("no element to act on");
    return el;
  };

  /** Presses Tab until `el` has the focus, as a keyboard user would. */
  const tabTo = async (el: HTMLElement) => {
    el.closest("[data-theme]")?.querySelector<HTMLElement>("[data-start]")?.focus();
    for (let i = 0; i < 20 && document.activeElement !== el; i++) await userEvent.tab();
    if (document.activeElement !== el || !el.matches(":focus-visible")) {
      throw new Error("the element did not get keyboard focus");
    }
  };

  const states = async (cases: Case[], name: string, state: State, options: Options = {}) => {
    // Only this case, so a few presses of Tab reach each flavor.
    const screen = await mount(
      cases.filter((one) => one.name === name),
      options,
    );
    const { css: a, tw: b } = sides(screen.container, name);
    const taken: Part[][] = [];
    for (const side of [a, b]) {
      const el = target(side, options);
      if (state === "hover") await userEvent.hover(el);
      else if (state === "held") {
        await userEvent.hover(el);
        await commands.mouse("down");
      } else await tabTo(el);
      await frame();
      // Real input: the page must agree the state is on, or the case proves nothing.
      const query = { hover: ":hover", held: ":active", focus: ":focus-visible" }[state];
      if (!el.matches(query)) throw new Error(`${name}: the element is not ${query}`);
      taken.push(measure(side, options.props));
      if (state === "focus") el.blur();
      else {
        // Leave before the button comes up, so nothing is clicked.
        await park();
        if (state === "held") await commands.mouse("up");
      }
    }
    const [x, y] = taken;
    if (!x || !y) throw new Error("not measured");
    // Motion left running is measured part way, each side at its own moment: no box to compare.
    const problems = compare(`${name} ${state}`, x, y).filter(
      (problem) => !options.live || !problem.what.startsWith("box "),
    );
    expect(summarize(unaccepted(problems))).toEqual([]);
  };

  const motion = async (cases: Case[], options: Options = {}) => {
    load();
    await park();
    const screen = await show(cases, options);
    await frame();
    await frame();
    await prepare(screen.container, options);
    const names = options.names ?? cases.map((one) => one.name);
    const problems = names.flatMap((name) => {
      const { css: a, tw: b } = sides(screen.container, name);
      return compare(name, measure(a, MOTION), measure(b, MOTION));
    });
    expect(summarize(unaccepted(problems))).toEqual([]);
  };

  const expectParts = (name: string, a: Part[], b: Part[]) => {
    expect(summarize(unaccepted(compare(name, a, b)))).toEqual([]);
  };

  return { parity, states, motion, mount, expectParts, load };
}

/** The computed style the user's className should have put on an element. */
export function expectStyles(el: Element, expected: Record<string, string>): void {
  const style = getComputedStyle(el);
  const actual = Object.fromEntries(
    Object.keys(expected).map((name) => [
      name,
      normalize(name, String(style[name as keyof CSSStyleDeclaration])),
    ]),
  );
  expect(actual).toEqual(expected);
}
