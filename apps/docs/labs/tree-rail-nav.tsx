"use client";

import { TreeRailNav } from "owsem-ui/owsem";
import { type CSSProperties, type ReactNode, useState } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    nav: "Dokumentasi",
    overview: "Ikhtisar",
    guides: "Panduan",
    install: "Instalasi",
    theming: "Tema",
    tokens: "Token",
    dark: "Mode gelap",
    density: "Kerapatan",
    components: "Komponen",
    button: "Button",
    separator: "Separator",
    changelog: "Changelog",
  },
  en: {
    nav: "Documentation",
    overview: "Overview",
    guides: "Guides",
    install: "Installation",
    theming: "Theming",
    tokens: "Tokens",
    dark: "Dark mode",
    density: "Density",
    components: "Components",
    button: "Button",
    separator: "Separator",
    changelog: "Changelog",
  },
} satisfies Record<Lang, Record<string, string>>;

type Page = keyof (typeof TEXT)["en"];
type Theme = "light" | "dark";

const STATES = {
  id: { open: "Grup terbuka", closed: "Grup tertutup", light: "Terang", dark: "Gelap" },
  en: { open: "Group open", closed: "Group closed", light: "Light", dark: "Dark" },
} satisfies Record<Lang, Record<string, string>>;

/** Rows for a demo nav that keeps its own current page: a click picks it, so the trail moves. */
function useRows(lang: Lang) {
  const t = TEXT[lang];
  const [current, setCurrent] = useState<Page>("dark");
  const label = (page: Page, icon?: IconName) => (
    <>
      {icon ? (
        <TreeRailNav.Icon>
          <Icon name={icon} size={16} />
        </TreeRailNav.Icon>
      ) : null}
      <TreeRailNav.Label>{t[page]}</TreeRailNav.Label>
    </>
  );
  const link = (page: Page, icon?: IconName, disabled?: boolean): ReactNode => (
    <TreeRailNav.Node>
      <TreeRailNav.Link
        href={`#${page}`}
        current={current === page}
        disabled={disabled}
        onClick={(event) => {
          event.preventDefault();
          setCurrent(page);
        }}
      >
        {label(page, icon)}
      </TreeRailNav.Link>
    </TreeRailNav.Node>
  );
  const group = (page: Page, children: ReactNode, icon?: IconName, open = true): ReactNode => (
    <TreeRailNav.Node defaultOpen={open} data-demo={page}>
      <TreeRailNav.Toggle>{label(page, icon)}</TreeRailNav.Toggle>
      <TreeRailNav.Panel>
        <TreeRailNav.List>{children}</TreeRailNav.List>
      </TreeRailNav.Panel>
    </TreeRailNav.Node>
  );
  return { t, link, group };
}

function Demo({ lang, style }: { lang: Lang; style: CSSProperties }) {
  const { t, link, group } = useRows(lang);
  return (
    <TreeRailNav.Root aria-label={t.nav} className="demo-tree-rail" style={style}>
      <TreeRailNav.Origin>{t.nav}</TreeRailNav.Origin>
      <TreeRailNav.List>
        {link("overview", "monitor")}
        {group(
          "guides",
          <>
            {link("install")}
            {group(
              "theming",
              <>
                {link("tokens")}
                {link("dark")}
                {link("density", undefined, true)}
              </>,
            )}
          </>,
          "sliders-horizontal",
        )}
        {group(
          "components",
          <>
            {link("button")}
            {link("separator")}
          </>,
          "code-xml",
        )}
        {link("changelog", "rotate-ccw")}
      </TreeRailNav.List>
    </TreeRailNav.Root>
  );
}

/** One cell of the states matrix: a shorter nav in one theme, its group open or closed. */
function Cell({
  theme,
  open,
  label,
  lang,
}: {
  theme: Theme;
  open: boolean;
  label: string;
  lang: Lang;
}) {
  const { link, group } = useRows(lang);
  return (
    <div data-theme={theme}>
      <TreeRailNav.Root
        aria-label={label}
        className="demo-tree-rail"
        data-compact=""
        data-cell={`${theme}-${open ? "open" : "closed"}`}
      >
        <TreeRailNav.List>
          {link("overview", "monitor")}
          {group(
            "guides",
            <>
              {link("install")}
              {link("dark")}
              {link("density", undefined, true)}
            </>,
            "sliders-horizontal",
            open,
          )}
          {link("changelog", "rotate-ccw")}
        </TreeRailNav.List>
      </TreeRailNav.Root>
    </div>
  );
}

const THEMES: readonly Theme[] = ["light", "dark"];

/** Both themes side by side, with the current row's group open and closed. */
function States({ lang }: { lang: Lang }) {
  const text = STATES[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => text[theme])}
      rows={[
        { open: true, row: text.open },
        { open: false, row: text.closed },
      ].map(({ open, row }) => ({
        label: row,
        cells: THEMES.map((theme) => (
          <Cell
            key={theme}
            theme={theme}
            open={open}
            label={`${text[theme]}, ${row}`}
            lang={lang}
          />
        )),
      }))}
    />
  );
}

const initial = { trail: "", rail: "" };

// The pointer picks a few pages in turn, and ends where it started.
const trail: SceneScript = async (stage) => {
  for (const page of ["install", "button", "tokens", "dark"]) {
    await stage.click(stage.get(`a[href="#${page}"]`));
    await stage.wait(1300);
  }
};

// Picks Installation in each theme, then goes back.
const states: SceneScript = async (stage) => {
  for (const page of ["install", "dark"]) {
    for (const theme of THEMES) {
      await stage.click(stage.get(`[data-cell="${theme}-open"] a[href="#${page}"]`));
      await stage.wait(1200);
    }
  }
};

// Closes the group holding the current row, then opens it again.
const groups: SceneScript = async (stage) => {
  const toggle = stage.get('[data-demo="theming"] > .ow-tree-rail-item');
  for (let i = 0; i < 2; i++) {
    await stage.click(toggle);
    await stage.wait(1500);
  }
};

const treeRailNavLab = defineLab({
  initial,
  controls: [
    {
      key: "trail",
      type: "color",
      label: { id: "Jejak", en: "Trail" },
      token: "--ow-accent",
    },
    {
      key: "rail",
      type: "color",
      label: { id: "Rail", en: "Rail" },
      token: "--ow-line",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-tree-rail-nav",
      note: {
        id: "nav yang memuat SVG rail dan highlight hover. Token tema yang dipasang di sini hanya berlaku untuknya.",
        en: "The nav, holding the rail SVG and the hover highlight. Theme tokens set here apply to it alone.",
      },
      tokens: {
        "--ow-accent": "--_trail",
        "--ow-line": "--_rail",
        "--ow-fg": "--_node",
        "--ow-bg": "--_surface",
      },
    },
    {
      name: "List",
      selector: ".ow-tree-rail-list",
      note: {
        id: "Satu tingkat, dengan satu rail. List bersarang diberi label oleh barisnya.",
        en: "One level, with one rail. A nested List is labelled by its row.",
      },
    },
    {
      name: "Node",
      selector: '[data-demo="components"]',
      note: {
        id: "Satu entri: barisnya, plus Panel jika ia grup. Collapsible dari Base UI.",
        en: "One entry: its row, and a Panel if it is a group. A Base UI Collapsible.",
      },
    },
    {
      name: "Toggle",
      selector: '[data-demo="guides"] > .ow-tree-rail-item',
      note: {
        id: "Baris grup: membuka dan menutup Panel-nya, dengan aria-expanded.",
        en: "A group's row: opens and closes its Panel, with aria-expanded.",
      },
    },
    {
      name: "Link",
      selector: "a[aria-current]",
      note: {
        id: "Baris halaman. current memasang aria-current, dan jejak berakhir di sini.",
        en: "A page's row. current sets aria-current, and the trail ends here.",
      },
    },
    {
      name: "Panel",
      selector: '[data-demo="theming"] > .ow-tree-rail-panel',
      note: {
        id: "Tingkat berikutnya dari grup, tetap ada di DOM supaya rail bisa berakhir di barisnya.",
        en: "A group's next level, kept mounted so the rail can end at its row.",
      },
    },
    {
      name: "Icon",
      selector: '[href="#changelog"] .ow-tree-rail-icon',
      note: {
        id: "Ikon dekoratif sebelum label, seukuran font baris ditambah 2px.",
        en: "A decorative icon before the label, the row's font size plus 2px.",
      },
    },
    {
      name: "Label",
      selector: '[href="#install"] .ow-tree-rail-label',
      note: {
        id: "Satu baris. Teks yang tidak muat memudar, lalu berjalan selama barisnya di-hover.",
        en: "One line. Text that does not fit fades, and runs while its row is hovered.",
      },
    },
    {
      name: "Origin",
      selector: ".ow-tree-rail-origin",
      note: {
        id: "Label opsional di paling atas; jejak berawal di sampingnya.",
        en: "An optional label at the top; the trail starts beside it.",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      "--ow-accent": cfg.trail || undefined,
      "--ow-line": cfg.rail || undefined,
    } as CSSProperties;
    return <Demo lang={lang} style={style} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/tree-rail-nav";
    const custom = cfg.trail || cfg.rail;
    const scope = custom ? ' className="sidebar"' : "";
    const usage = [
      `import { TreeRailNav } from "${from}";`,
      "",
      "export function Sidebar({ path }: { path: string }) {",
      "  const link = (href: string, label: string) => (",
      "    <TreeRailNav.Node>",
      "      <TreeRailNav.Link href={href} current={path === href}>",
      "        {label}",
      "      </TreeRailNav.Link>",
      "    </TreeRailNav.Node>",
      "  );",
      "  return (",
      `    <TreeRailNav.Root aria-label="Documentation"${scope}>`,
      "      <TreeRailNav.Origin>Documentation</TreeRailNav.Origin>",
      "      <TreeRailNav.List>",
      '        {link("/", "Overview")}',
      "        <TreeRailNav.Node defaultOpen>",
      "          <TreeRailNav.Toggle>Guides</TreeRailNav.Toggle>",
      "          <TreeRailNav.Panel>",
      "            <TreeRailNav.List>",
      '              {link("/install", "Installation")}',
      '              {link("/theming", "Theming")}',
      "            </TreeRailNav.List>",
      "          </TreeRailNav.Panel>",
      "        </TreeRailNav.Node>",
      "      </TreeRailNav.List>",
      "    </TreeRailNav.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "sidebar.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // Isolated values sit on each nav's root, so set them there too.
      const lines = [
        setup.mode === "isolated" ? ".sidebar.ow-tree-rail-nav {" : ".sidebar {",
        ...(cfg.trail ? [`  ${token}-accent: ${cfg.trail};`] : []),
        ...(cfg.rail ? [`  ${token}-line: ${cfg.rail};`] : []),
        "}",
      ];
      files.push({ name: "sidebar.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    trail: { play: trail },
    groups: { play: groups },
    anatomy: { inspect: true },
    states: {
      demo: (_cfg, lang) => <States lang={lang} />,
      play: states,
    },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function TreeRailNavLab(props: LabProps) {
  return <LabShell lab={treeRailNavLab} {...props} />;
}
