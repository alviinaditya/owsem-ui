import type { CSSProperties } from "react";
import { beforeAll, describe, expect, onTestFinished, test } from "vitest";
import { commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Separator } from "../src/components/separator/index.ts";
import { TreeRailNav } from "../src/components/tree-rail-nav/index.ts";
import tokens from "../src/core/tokens/tokens.css?raw";
import bridge from "../src/tailwind.css?raw";
import { settle } from "./raf-counter.ts";

// FR-8 with Tailwind CSS v4: the setup from Getting Started, built by the real compiler in Node.
const SETUP = `
@import "./src/tailwind.css";
@import "tailwindcss";
@import "./src/styles.css";
`;
// Class names used below; the bridge's utilities are added from the file itself.
const CLASSES = [
  "border-red-500",
  "border-[rgb(0,0,255)]",
  "data-panel-open:text-[rgb(0,128,0)]",
  "data-current:text-[rgb(255,0,0)]",
  "[--ow-line-dark:rgb(255,0,0)]",
];

const comment = /\/\*[\s\S]*?\*\//g;
const themeTokens = new Set(tokens.match(/--ow-[a-z\d-]+(?=\s*:)/g));
// A utility per Tailwind namespace the bridge uses: --color-ow-panel gives bg-ow-panel.
const UTILITY: Record<string, string> = {
  color: "bg",
  shadow: "shadow",
  radius: "rounded",
  ease: "ease",
};
/** The bridge's theme variables, with the token each reads and a utility made from it. */
const mapping = [
  ...bridge.replace(comment, "").matchAll(/--([a-z]+)-(ow[a-z\d-]*):\s*var\((--ow-[a-z\d-]+)\)/g),
].map(([, namespace = "", name, token = ""]) => ({
  token,
  utility: `${UTILITY[namespace]}-${name}`,
}));

let css = "";
beforeAll(async () => {
  css = await commands.compileTailwind(SETUP, [...CLASSES, ...mapping.map((m) => m.utility)]);
});

/** Loads the compiled CSS first, as an app's global CSS: its layer order statement wins. */
function loadTailwind() {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.prepend(style);
  onTestFinished(() => style.remove());
}

/** Resolves a color (e.g. `var(--ow-panel)`) to its computed value inside `scope`. */
function resolveColor(value: string, scope: Element = document.body): string {
  const probe = document.createElement("span");
  probe.style.color = value;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** A nav with optional classes on a Base UI part (Toggle) and on an OwsemUI part (Link). */
function Nav({ toggle, link }: { toggle?: string; link?: string }) {
  return (
    <TreeRailNav.Root aria-label="Docs" style={{ inlineSize: 280 }}>
      <TreeRailNav.List>
        <TreeRailNav.Node>
          <TreeRailNav.Link href="#home">
            <TreeRailNav.Icon>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10 12 3l9 7v11H3z" />
              </svg>
            </TreeRailNav.Icon>
            <TreeRailNav.Label>Home</TreeRailNav.Label>
          </TreeRailNav.Link>
        </TreeRailNav.Node>
        <TreeRailNav.Node defaultOpen>
          <TreeRailNav.Toggle className={toggle}>Settings</TreeRailNav.Toggle>
          <TreeRailNav.Panel>
            <TreeRailNav.List>
              <TreeRailNav.Node>
                <TreeRailNav.Link href="#profile" current className={link}>
                  Profile
                </TreeRailNav.Link>
              </TreeRailNav.Node>
            </TreeRailNav.List>
          </TreeRailNav.Panel>
        </TreeRailNav.Node>
      </TreeRailNav.List>
    </TreeRailNav.Root>
  );
}

describe("Tailwind CSS v4 (FR-8)", () => {
  test("the bridge maps every theme token, or names it as not mapped", () => {
    const mapped = new Set(mapping.map((m) => m.token));
    const comments = bridge.match(comment)?.join("") ?? "";
    const named = new Set(comments.match(/--ow-[a-z\d-]+/g));
    const problems: string[] = [];
    for (const token of themeTokens) {
      if (mapped.has(token) === named.has(token)) problems.push(`${token}: map it or name it`);
    }
    for (const token of mapped) {
      if (!themeTokens.has(token)) problems.push(`${token}: no such token`);
    }
    expect(themeTokens.size).toBeGreaterThan(20);
    expect(problems).toEqual([]);
  });

  test("each theme variable compiles to a utility that reads its token", () => {
    for (const { token, utility } of mapping) {
      const start = css.indexOf(`.${utility} {`);
      expect(start, utility).toBeGreaterThan(-1);
      expect(css.slice(start, css.indexOf("}", start)), utility).toContain(`var(${token})`);
    }
  });

  test("utilities in className beat the component CSS, as a string or a function", async () => {
    loadTailwind();
    const screen = await render(
      <>
        <Separator className="border-red-500" />
        <Separator
          orientation="vertical"
          className={(state) => (state.orientation === "vertical" ? "border-[rgb(0,0,255)]" : "")}
        />
        <Nav toggle="data-panel-open:text-[rgb(0,128,0)]" link="data-current:text-[rgb(255,0,0)]" />
      </>,
    );
    const [line, vertical] = screen.container.querySelectorAll<HTMLElement>('[role="separator"]');
    if (!line || !vertical) throw new Error("no separators");
    expect(getComputedStyle(line).borderBlockStartColor).toBe(resolveColor("var(--color-red-500)"));
    expect(getComputedStyle(vertical).borderInlineStartColor).toBe("rgb(0, 0, 255)");
    // State variants from data attributes: Base UI's data-panel-open and OwsemUI's data-current.
    const color = (text: string) => getComputedStyle(screen.getByText(text).element()).color;
    expect(color("Settings")).toBe("rgb(0, 128, 0)");
    expect(color("Profile")).toBe("rgb(255, 0, 0)");
  });

  test("preflight leaves the components as they are", async () => {
    const screen = await render(
      <div style={{ fontFamily: "sans-serif", lineHeight: 1.5 }}>
        <Separator />
        <Nav />
        <Separator orientation="vertical" style={{ blockSize: 40 }} />
      </div>,
    );
    const root = screen.container.firstElementChild as HTMLElement;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      return [root, ...root.querySelectorAll("*")].map((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          el: `${el.tagName} ${el.getAttribute("class") ?? ""}`,
          box: [x - origin.x, y - origin.y, width, height].map((n) => Math.round(n * 100) / 100),
          color: style.color,
          background: style.backgroundColor,
          border: `${style.borderWidth} ${style.borderColor}`,
          list: style.listStyleType,
        };
      });
    };
    await settle();
    const before = measure();
    loadTailwind();
    await settle();
    expect(measure()).toEqual(before);
  });

  test("tokens set on an element, or by data-theme, flow through the utilities", async () => {
    loadTailwind();
    const screen = await render(
      <>
        <div
          className="bg-ow-panel rounded-ow"
          style={{ "--ow-panel": "rgb(1, 2, 3)", "--ow-radius": "3px" } as CSSProperties}
        />
        <div data-theme="dark">
          <div className="bg-ow-panel" />
        </div>
        <Separator className="[--ow-line-dark:rgb(255,0,0)]" />
      </>,
    );
    const [own, dark, line] = screen.container.querySelectorAll<HTMLElement>(
      ".bg-ow-panel, [role='separator']",
    );
    if (!own || !dark || !line) throw new Error("not rendered");
    expect(getComputedStyle(own).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(own).borderTopLeftRadius).toBe("3px");
    expect(getComputedStyle(dark).backgroundColor).toBe(resolveColor("var(--ow-panel)", dark));
    expect(getComputedStyle(dark).backgroundColor).not.toBe(resolveColor("var(--ow-panel)"));
    expect(getComputedStyle(line).borderBlockStartColor).toBe("rgb(255, 0, 0)");
  });
});
