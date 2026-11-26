"use client";

import { Tabs, type TabsSize } from "owsem-ui/base";
import type { ReactNode } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const FEW = ["overview", "activity", "members"] as const;
const MANY = [...FEW, "integrations", "security", "billing", "settings"] as const;
type Value = (typeof MANY)[number];
type Content = "text" | "icon" | "both";

const ICONS: Record<Value, IconName> = {
  overview: "layout-dashboard",
  activity: "list",
  members: "user-plus",
  integrations: "layers",
  security: "scan",
  billing: "file-text",
  settings: "sliders-horizontal",
};

// Lucide's React names, for the code.
const LUCIDE: Record<Value, string> = {
  overview: "LayoutDashboard",
  activity: "List",
  members: "UserPlus",
  integrations: "Layers",
  security: "Scan",
  billing: "FileText",
  settings: "SlidersHorizontal",
};

const TEXT = {
  id: {
    project: "Proyek",
    tabs: {
      overview: "Ringkasan",
      activity: "Aktivitas",
      members: "Anggota",
      integrations: "Integrasi",
      security: "Keamanan",
      billing: "Tagihan",
      settings: "Pengaturan",
    },
    panels: {
      overview: "Proyek sekilas: 12 tugas terbuka, 3 jatuh tempo pekan ini.",
      activity: "Rilis 0.4 diterbitkan oleh Dina dua jam yang lalu.",
      members: "Lima orang di proyek ini, dua di antaranya admin.",
      integrations: "GitHub dan Slack terhubung; webhook aktif.",
      security: "Autentikasi dua langkah wajib untuk semua anggota.",
      billing: "Paket Tim, diperpanjang 1 Desember.",
      settings: "Nama, tautan, dan siapa yang bisa melihat proyek ini.",
    },
  },
  en: {
    project: "Project",
    tabs: {
      overview: "Overview",
      activity: "Activity",
      members: "Members",
      integrations: "Integrations",
      security: "Security",
      billing: "Billing",
      settings: "Settings",
    },
    panels: {
      overview: "The project at a glance: 12 open tasks, 3 due this week.",
      activity: "Dina published release 0.4 two hours ago.",
      members: "Five people on this project, two of them admins.",
      integrations: "GitHub and Slack are connected; webhooks are on.",
      security: "Two-step sign-in is required for every member.",
      billing: "Team plan, renews on December 1.",
      settings: "The name, the link, and who can see this project.",
    },
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly TabsSize[] = ["sm", "md", "lg"];

/** A tab's content: its text, its icon (named for screen readers), or both. */
function tabContent(value: Value, content: Content, lang: Lang) {
  const label = TEXT[lang].tabs[value];
  const icon = <Icon key="icon" name={ICONS[value]} />;
  if (content === "icon") return { "aria-label": label, children: icon };
  // An array, not a fragment: the tab wraps text it can see, so the icon keeps its spacing.
  if (content === "both") return { children: [icon, label] as ReactNode };
  return { children: label as ReactNode };
}

interface ProjectProps {
  lang: Lang;
  values?: readonly Value[];
  size?: TabsSize;
  vertical?: boolean;
  content?: Content;
  panels?: boolean;
  equal?: boolean;
  disabled?: Value;
  activateOnFocus?: boolean;
}

/** A project's tabs, with a panel for each, or the list alone. */
function Project({
  lang,
  values = FEW,
  size,
  vertical,
  content = "text",
  panels = true,
  equal,
  disabled,
  activateOnFocus,
}: ProjectProps) {
  const t = TEXT[lang];
  return (
    <div className={panels ? "demo-tabs" : undefined}>
      <Tabs.Root
        defaultValue="overview"
        orientation={vertical ? "vertical" : "horizontal"}
        className={equal ? "demo-tabs-equal" : undefined}
      >
        <Tabs.List aria-label={t.project} size={size} activateOnFocus={activateOnFocus}>
          {values.map((value) => (
            <Tabs.Tab
              key={value}
              value={value}
              disabled={value === disabled}
              {...tabContent(value, content, lang)}
            />
          ))}
        </Tabs.List>
        {panels
          ? values.map((value) => (
              <Tabs.Panel key={value} value={value} className="demo-tabs-panel">
                {t.panels[value]}
              </Tabs.Panel>
            ))
          : null}
      </Tabs.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-tabs-stack">
      {SIZES.map((size) => (
        <Tabs.Root key={size} defaultValue="activity">
          <Tabs.List aria-label={`${t.project}, ${size}`} size={size}>
            {FEW.map((value) => (
              <Tabs.Tab key={value} value={value} disabled={size === "md" && value === "members"}>
                {t.tabs[value]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
      ))}
    </div>
  );
}

interface CodeOptions {
  values?: readonly Value[];
  size?: TabsSize;
  vertical?: boolean;
  content?: Content;
  panels?: boolean;
  equal?: boolean;
  disabled?: Value;
}

/** The Project component's code: the same tabs, in English whatever the page's language. */
function projectCode(setup: TokenSetup, name: string, options: CodeOptions = {}) {
  const { values = FEW, size, vertical, content = "text", panels = true, equal } = options;
  const t = TEXT.en;
  const icons = content !== "text";
  const rootProps = [
    'defaultValue="overview"',
    ...(vertical ? ['orientation="vertical"'] : []),
    ...(equal ? ['className="equal-tabs"'] : []),
  ];
  const tab = (value: Value) => {
    const disabled = options.disabled === value ? " disabled" : "";
    if (content === "text") {
      return [`<Tabs.Tab value="${value}"${disabled}>${t.tabs[value]}</Tabs.Tab>`];
    }
    return [
      content === "icon"
        ? `<Tabs.Tab value="${value}" aria-label="${t.tabs[value]}"${disabled}>`
        : `<Tabs.Tab value="${value}"${disabled}>`,
      `  <${LUCIDE[value]} />`,
      ...(content === "both" ? [`  ${t.tabs[value]}`] : []),
      "</Tabs.Tab>",
    ];
  };
  const body = [
    `<Tabs.Root ${rootProps.join(" ")}>`,
    `  <Tabs.List aria-label="Project"${size && size !== "md" ? ` size="${size}"` : ""}>`,
    ...values.flatMap(tab).map((line) => `    ${line}`),
    "  </Tabs.List>",
    ...(panels
      ? values.map((value) => `  <Tabs.Panel value="${value}">${t.panels[value]}</Tabs.Panel>`)
      : []),
    "</Tabs.Root>",
  ];
  const imports = [
    ...(icons
      ? [
          `import { ${values
            .map((value) => LUCIDE[value])
            .sort()
            .join(", ")} } from "lucide-react";`,
        ]
      : []),
    `import { Tabs } from "${importPath(setup, "tabs")}";`,
  ];
  const files = [exampleFile(name, imports, body)];
  if (equal) {
    files.push({
      name: "equal-tabs.css",
      code: [
        ".equal-tabs .ow-tabs__list {",
        "  inline-size: 100%;",
        "}",
        "",
        ".equal-tabs .ow-tabs__tab {",
        "  flex: 1;",
        "}",
      ].join("\n"),
    });
  }
  return files;
}

export const tabsDefinition = defineComponent({
  item: "tabs",
  imports: ["Tabs"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu panel per tab; indikator meregang dari tepi depannya ke tab yang dipilih.",
        en: "One panel per tab; the indicator stretches from its leading edge to the picked tab.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Project lang={lang} />,
      code: (setup) => projectCode(setup, "ProjectTabs"),
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg, dan satu tab yang nonaktif.",
        en: "sm, md, and lg, and a disabled tab.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup) => {
        const t = TEXT.en;
        return [
          exampleFile(
            "TabSizes",
            [`import { Tabs } from "${importPath(setup, "tabs")}";`],
            SIZES.flatMap((size) => [
              '<Tabs.Root defaultValue="activity">',
              `  <Tabs.List aria-label="Project, ${size}"${size === "md" ? "" : ` size="${size}"`}>`,
              ...FEW.map((value) => {
                const disabled = size === "md" && value === "members" ? " disabled" : "";
                return `    <Tabs.Tab value="${value}"${disabled}>${t.tabs[value]}</Tabs.Tab>`;
              }),
              "  </Tabs.List>",
              "</Tabs.Root>",
            ]),
          ),
        ];
      },
    },
    {
      id: "icons",
      title: { id: "Ikon", en: "Icons" },
      description: {
        id: "Ikon dan teks, atau ikon saja: tab yang hanya berisi ikon menjadi persegi dan butuh aria-label.",
        en: "An icon with text, or an icon alone: an icon-only tab is square and needs an aria-label.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Project lang={lang} content="both" panels={false} />,
      code: (setup) => projectCode(setup, "ProjectTabs", { content: "both", panels: false }),
    },
    {
      id: "vertical",
      title: { id: "Vertikal", en: "Vertical" },
      description: {
        id: "orientation vertikal menaruh list di samping panel; panah atas dan bawah berpindah, dan Glide mengikuti.",
        en: "A vertical orientation puts the list beside the panel; the up and down arrows move, and Glide follows.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Project lang={lang} vertical />,
      code: (setup) => projectCode(setup, "VerticalTabs", { vertical: true }),
    },
    {
      id: "overflow",
      title: { id: "Meluap", en: "Overflow" },
      description: {
        id: "Bila tab tidak muat, list bergulir ke samping; tab yang terpotong tepi masuk saat dipilih.",
        en: "When the tabs do not fit, the list scrolls sideways; a tab the edge cuts comes in when picked.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Project lang={lang} values={MANY} />,
      code: (setup) => projectCode(setup, "ManyTabs", { values: MANY }),
    },
    {
      id: "equal",
      title: { id: "Lebar penuh", en: "Full width" },
      description: {
        id: "Dengan className, list selebar kolomnya dan tiap tab berbagi lebar yang sama.",
        en: "With a className, the list fills its column and every tab shares the width.",
      },
      uses: ["Tabs"],
      demo: (lang) => <Project lang={lang} equal />,
      code: (setup) => projectCode(setup, "FullWidthTabs", { equal: true }),
    },
  ],
  anatomy: {
    specimen: (lang) => {
      const t = TEXT[lang];
      return (
        <Tabs.Root defaultValue="activity" className="demo-tabs">
          <Tabs.List aria-label={t.project}>
            {FEW.map((value) => (
              <Tabs.Tab key={value} value={value}>
                {t.tabs[value]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <Tabs.Panel value="activity" className="demo-tabs-panel">
            {t.panels.activity}
          </Tabs.Panel>
        </Tabs.Root>
      );
    },
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-tabs",
      note: {
        id: "Memuat list dan panel, bersusun ke bawah atau, jika vertikal, berdampingan.",
        en: "Holds the list and the panels, stacked or, when vertical, side by side.",
      },
    },
    {
      name: "List",
      selector: ".ow-tabs__list",
      note: {
        id: "Well datar tanpa tepi, tint 6% dari warna teks, dengan role tablist, selebar tab-nya. Menggambar indikator dan Glide sendiri.",
        en: "The flat well with no edge, a 6% tint of the text color, with the tablist role, as wide as its tabs. Draws the indicator and Glide itself.",
      },
      tokens: {
        "--ow-fg": "--_well",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Tab",
      selector: ".ow-tabs__tab:not([data-active])",
      note: {
        id: "Tab dari Base UI: button dengan aria-selected. Ukurannya mengikuti aturan --py.",
        en: "Base UI's Tab: a button with aria-selected. Sized by the --py rule.",
      },
      tokens: {
        "--ow-muted": "--_muted",
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-tabs__indicator",
      note: {
        id: "Tint aksen 14% di atas warna raised, tanpa tepi dan bayangan, di bawah tab aktif. Dekoratif, digambar oleh List.",
        en: "A 14% accent tint over the raised color, with no edge or shadow, under the active tab. Decorative, drawn by List.",
      },
      tokens: {
        "--ow-accent": "--_key",
        "--ow-raised-bg": "--_key",
      },
    },
    {
      name: "Panel",
      selector: ".ow-tabs__panel",
      note: {
        id: "Panel tab aktif, dengan role tabpanel. Tanpa padding sendiri.",
        en: "The active tab's panel, with the tabpanel role. No padding of its own.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
      },
    },
  ],
});

export default function TabsPage(props: ExamplePageProps) {
  return <ComponentPage definition={tabsDefinition} {...props} />;
}
