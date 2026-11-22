"use client";

import { TreeRailNav } from "owsem-ui/owsem";
import { type CSSProperties, type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

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

/** Rows for a demo nav that keeps its own current page: a click picks it, so the trail moves. */
function useRows(lang: Lang, start: Page = "dark") {
  const t = TEXT[lang];
  const [current, setCurrent] = useState<Page>(start);
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

/** Three levels, an origin, icons, and a disabled row. */
function Tree({
  lang,
  style,
  start,
  origin = true,
  closed = false,
}: {
  lang: Lang;
  style?: CSSProperties;
  start?: Page;
  origin?: boolean;
  /** Closes the group that holds the current row. */
  closed?: boolean;
}) {
  const { t, link, group } = useRows(lang, start);
  return (
    <TreeRailNav.Root aria-label={t.nav} className="demo-tree-rail" style={style}>
      {origin ? <TreeRailNav.Origin>{t.nav}</TreeRailNav.Origin> : null}
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
              undefined,
              !closed,
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

/** One complete instance for Inspect, short enough to fit the sheet: all three levels, an origin. */
function Specimen({ lang }: { lang: Lang }) {
  const { t, link, group } = useRows(lang, "install");
  return (
    <TreeRailNav.Root aria-label={t.nav} className="demo-tree-rail">
      <TreeRailNav.Origin>{t.nav}</TreeRailNav.Origin>
      <TreeRailNav.List>
        {link("overview", "monitor")}
        {group(
          "guides",
          <>
            {link("install")}
            {group("theming", link("tokens"))}
          </>,
          "sliders-horizontal",
        )}
        {link("changelog", "rotate-ccw")}
      </TreeRailNav.List>
    </TreeRailNav.Root>
  );
}

const RECOLOR = { "--ow-accent": "var(--ow-good)", "--ow-line": "var(--ow-edge)" } as CSSProperties;

const imp = (setup: TokenSetup) => [
  `import { TreeRailNav } from "${
    isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/tree-rail-nav"
  }";`,
];

/** The sidebar of the Default example, as a component fed by the current path. */
const sidebar = (
  lang: Lang,
  { origin = true, rootProps = "" }: { origin?: boolean; rootProps?: string } = {},
) => {
  const t = TEXT[lang];
  return [
    `<TreeRailNav.Root aria-label="${t.nav}"${rootProps}>`,
    ...(origin ? [`  <TreeRailNav.Origin>${t.nav}</TreeRailNav.Origin>`] : []),
    "  <TreeRailNav.List>",
    `    {link("/", "${t.overview}")}`,
    "    <TreeRailNav.Node defaultOpen>",
    `      <TreeRailNav.Toggle>${t.guides}</TreeRailNav.Toggle>`,
    "      <TreeRailNav.Panel>",
    "        <TreeRailNav.List>",
    `          {link("/install", "${t.install}")}`,
    "          <TreeRailNav.Node defaultOpen>",
    `            <TreeRailNav.Toggle>${t.theming}</TreeRailNav.Toggle>`,
    "            <TreeRailNav.Panel>",
    "              <TreeRailNav.List>",
    `                {link("/theming/tokens", "${t.tokens}")}`,
    `                {link("/theming/dark", "${t.dark}")}`,
    "              </TreeRailNav.List>",
    "            </TreeRailNav.Panel>",
    "          </TreeRailNav.Node>",
    "        </TreeRailNav.List>",
    "      </TreeRailNav.Panel>",
    "    </TreeRailNav.Node>",
    `    {link("/changelog", "${t.changelog}")}`,
    "  </TreeRailNav.List>",
    "</TreeRailNav.Root>",
  ];
};

const LINK_HELPER = [
  "  const link = (href: string, label: string) => (",
  "    <TreeRailNav.Node>",
  "      <TreeRailNav.Link href={href} current={path === href}>",
  "        {label}",
  "      </TreeRailNav.Link>",
  "    </TreeRailNav.Node>",
  "  );",
];

const sidebarFile = (
  setup: TokenSetup,
  lang: Lang,
  options?: { origin?: boolean; rootProps?: string },
) => {
  const file = exampleFile("Sidebar", imp(setup), sidebar(lang, options), LINK_HELPER);
  // The props go on the component, and the link helper uses `path`.
  return { ...file, code: file.code.replace("Sidebar()", "Sidebar({ path }: { path: string })") };
};

export const treeRailNavDefinition = defineComponent({
  item: "tree-rail-nav",
  imports: ["TreeRailNav"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Tiga tingkat dengan rail di setiap tingkat; jejak berjalan dari asal ke halaman saat ini.",
        en: "Three levels with a rail on each; the trail runs from the origin to the current page.",
      },
      uses: ["TreeRailNav"],
      demo: (lang) => <Tree lang={lang} />,
      code: (setup, lang) => [sidebarFile(setup, lang)],
    },
    {
      id: "closed",
      title: { id: "Grup tertutup", en: "Closed group" },
      description: {
        id: "Jejak berhenti di baris grup yang menutup halaman saat ini, dan penandanya berlubang.",
        en: "The trail stops at the row of the group that holds the current page, and the marker turns hollow.",
      },
      uses: ["TreeRailNav"],
      demo: (lang) => <Tree lang={lang} closed />,
      code: (setup, lang) => {
        const file = sidebarFile(setup, lang);
        return [
          {
            ...file,
            code: file.code.replace(
              `<TreeRailNav.Node defaultOpen>\n            <TreeRailNav.Toggle>${TEXT[lang].theming}`,
              `<TreeRailNav.Node>\n            <TreeRailNav.Toggle>${TEXT[lang].theming}`,
            ),
          },
        ];
      },
    },
    {
      id: "no-origin",
      title: { id: "Tanpa asal", en: "No origin" },
      description: {
        id: "Tanpa Origin, rail dan jejak mulai dari baris pertama.",
        en: "Without an Origin, the rail and the trail start at the first row.",
      },
      uses: ["TreeRailNav"],
      demo: (lang) => <Tree lang={lang} origin={false} start="overview" />,
      code: (setup, lang) => [sidebarFile(setup, lang, { origin: false })],
    },
    {
      id: "recolor",
      title: { id: "Warna", en: "Recolor" },
      description: {
        id: "Pasang --ow-accent dan --ow-line di navnya untuk mewarnai jejak dan rail.",
        en: "Set --ow-accent and --ow-line on the nav to recolor the trail and the rail.",
      },
      uses: ["TreeRailNav"],
      demo: (lang) => <Tree lang={lang} style={RECOLOR} />,
      code: (setup, lang) => {
        const token = `--${setup.prefix}`;
        return [
          sidebarFile(setup, lang, { rootProps: ' className="sidebar"' }),
          {
            name: "sidebar.css",
            code: [
              setup.mode === "isolated" ? ".sidebar.ow-tree-rail-nav {" : ".sidebar {",
              `  ${token}-accent: var(${token}-good);`,
              `  ${token}-line: var(${token}-edge);`,
              "}",
            ].join("\n"),
          },
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
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
      name: "Origin",
      selector: ".ow-tree-rail-nav__origin",
      note: {
        id: "Label opsional di paling atas; jejak berawal di sampingnya.",
        en: "An optional label at the top; the trail starts beside it.",
      },
    },
    {
      name: "List",
      selector: ".ow-tree-rail-nav__list",
      note: {
        id: "Satu tingkat, dengan satu rail. List bersarang diberi label oleh barisnya.",
        en: "One level, with one rail. A nested List is labelled by its row.",
      },
    },
    {
      name: "Toggle",
      selector: '[data-demo="guides"] > .ow-tree-rail-nav__item',
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
      selector: '[data-demo="theming"] > .ow-tree-rail-nav__panel',
      note: {
        id: "Tingkat berikutnya dari grup, tetap ada di DOM supaya rail bisa berakhir di barisnya.",
        en: "A group's next level, kept mounted so the rail can end at its row.",
      },
    },
    {
      name: "Icon",
      selector: '[href="#changelog"] .ow-tree-rail-nav__icon',
      note: {
        id: "Ikon dekoratif sebelum label, seukuran font baris ditambah 2px.",
        en: "A decorative icon before the label, the row's font size plus 2px.",
      },
    },
    {
      name: "Label",
      selector: '[href="#install"] .ow-tree-rail-nav__label',
      note: {
        id: "Satu baris. Teks yang tidak muat memudar, lalu berjalan selama barisnya di-hover.",
        en: "One line. Text that does not fit fades, and runs while its row is hovered.",
      },
    },
  ],
});

export default function TreeRailNavPage(props: ExamplePageProps) {
  return <ComponentPage definition={treeRailNavDefinition} {...props} />;
}
