import { describe, expect, test } from "vitest";

// NF-8: an element that animates a transform stays on its own layer (will-change). Otherwise
// Chrome draws it on a GPU layer only while it moves, and at a fractional zoom its content lands a
// device pixel away when the motion ends. These tests read the stylesheets as text.

const sheets = import.meta.glob<string>("../src/**/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});

const TRANSFORMS = /(?<![\w-])(transform|scale|translate|rotate)(?![\w-])/g;
// A parenthesized argument, one level of nesting inside it: :where(:active:not([data-disabled])).
const ARGUMENT = String.raw`\((?:[^()]|\([^()]*\))*\)`;

/** Splits at commas or combinators outside parentheses. */
function split(text: string, at: RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let part = "";
  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (depth === 0 && at.test(char)) {
      parts.push(part);
      part = "";
    } else part += char;
  }
  return [...parts, part].map((p) => p.trim()).filter(Boolean);
}

/**
 * The elements a selector styles: the classes in each selector's last compound, with its
 * pseudo-element, and the subjects of the :is() and :where() in it. `.ow-a[data-held]` and
 * `:is(.ow-a, .ow-b > .ow-c):active` style the same elements as `.ow-a` and `.ow-a, .ow-c`; a
 * selector without a class (an SVG circle) is not a box of its own.
 */
function subjects(selector: string): string[] {
  return split(selector, /,/).flatMap((one) => {
    const last = split(one, /[\s>+~]/).at(-1) ?? "";
    const pseudo = /::[\w-]+$/.exec(last)?.[0] ?? "";
    const own = [...last.replace(new RegExp(ARGUMENT, "g"), "()").matchAll(/\.(ow-[\w-]+)/g)];
    const inner = [...last.matchAll(new RegExp(`:(?:is|where)(${ARGUMENT})`, "g"))].flatMap((m) =>
      subjects(m[1]?.slice(1, -1) ?? ""),
    );
    return [...own.map((m) => m[1] as string), ...inner].map((name) => `${name}${pseudo}`);
  });
}

/** Transform properties a rule names in `property` (a regex source), per element it styles. */
function named(css: string, property: string): Map<string, Set<string>> {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = new Map<string, Set<string>>();
  for (const [, selector = "", body = ""] of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const [, value = ""] of body.matchAll(
      new RegExp(`(?<![\\w-])${property}\\s*:([^;]+)`, "g"),
    )) {
      for (const subject of subjects(selector)) {
        const names = found.get(subject) ?? new Set();
        for (const [name] of value.matchAll(TRANSFORMS)) names.add(name);
        found.set(subject, names);
      }
    }
  }
  return found;
}

describe("Layers (NF-8)", () => {
  test("the rules are read", () => {
    const glide = named(sheets["../src/core/glide/glide.css"] ?? "", "transition");
    expect([...(glide.get("ow-glide") ?? [])]).toEqual(["transform"]);
  });

  test("an element that transitions a transform declares will-change for it", () => {
    const problems: string[] = [];
    for (const [path, css] of Object.entries(sheets)) {
      const layered = named(css, "will-change");
      for (const [subject, names] of named(css, "transition(?:-property)?")) {
        for (const name of names) {
          if (!layered.get(subject)?.has(name)) {
            problems.push(`${path}: .${subject} transitions ${name} without will-change`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
