"use client";

import { Tabs } from "owsem-ui/base";
import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const FEW = ["overview", "activity", "members"] as const;
const MANY = [...FEW, "integrations", "security", "billing", "settings"] as const;
type Value = (typeof MANY)[number];

const ICONS: Record<Value, IconName> = {
  overview: "layout-dashboard",
  activity: "list",
  members: "user-plus",
  integrations: "layers",
  security: "scan",
  billing: "file-text",
  settings: "sliders-horizontal",
};

// Lucide's React names, for the generated code.
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

const THEME_NAMES = {
  id: { light: "Terang", dark: "Gelap" },
  en: { light: "Light", dark: "Dark" },
} satisfies Record<Lang, Record<string, string>>;

const initial = {
  size: "md",
  orientation: "horizontal",
  count: "few",
  width: "fit",
  content: "text",
  activation: "manual",
  indicator: "",
  well: "",
};
type Cfg = typeof initial;
type Size = "sm" | "md" | "lg";

const valuesOf = (cfg: Cfg): readonly Value[] => (cfg.count === "many" ? MANY : FEW);

/** A tab's content: its text, its icon (named for screen readers), or both. */
function tabProps(value: Value, content: string, lang: Lang) {
  const label = TEXT[lang].tabs[value];
  const icon = <Icon key="icon" name={ICONS[value]} />;
  if (content === "icon") return { "aria-label": label, children: icon };
  // An array, not a fragment: the tab wraps text it can see, so the icon keeps its spacing.
  if (content === "both") return { children: [icon, label] };
  return { children: label };
}

const THEMES = ["light", "dark"] as const;
const SIZES: readonly Size[] = ["sm", "md", "lg"];

/** One cell of the states matrix: a list in one theme. */
function Cell({
  theme,
  row,
  lang,
}: {
  theme: (typeof THEMES)[number];
  row: Size | "disabled" | "vertical";
  lang: Lang;
}) {
  const t = TEXT[lang];
  return (
    <div data-theme={theme} className="demo-tabs-surface" data-cell={`${theme}-${row}`}>
      <Tabs.Root
        defaultValue="activity"
        orientation={row === "vertical" ? "vertical" : "horizontal"}
      >
        <Tabs.List
          aria-label={`${t.project}, ${row}`}
          size={row === "disabled" || row === "vertical" ? "md" : row}
        >
          {FEW.map((value) => (
            <Tabs.Tab
              key={value}
              value={value}
              data-value={value}
              disabled={row === "disabled" && value === "members"}
            >
              {t.tabs[value]}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}

/** Sizes, a disabled tab, and a vertical list, in both themes. */
function States({ lang }: { lang: Lang }) {
  const rows = [...SIZES, "disabled", "vertical"] as const;
  return (
    <Matrix
      columns={THEMES.map((theme) => THEME_NAMES[lang][theme])}
      rows={rows.map((row) => ({
        label: row,
        cells: THEMES.map((theme) => <Cell key={theme} theme={theme} row={row} lang={lang} />),
      }))}
    />
  );
}

// The pointer picks each tab in turn, and ends on the first.
const segmented: SceneScript = async (stage) => {
  for (const value of ["activity", "members", "overview"]) {
    await stage.click(stage.get(`[data-value="${value}"]`));
    await stage.wait(1100);
  }
};

// A tab the edge cuts is picked and comes in; the list scrolls to its end (smoothly, in this demo's
// CSS), a tab there is picked, and back.
const overflow: SceneScript = async (stage) => {
  const list = stage.get(".ow-tabs__list");
  await stage.click(stage.get('[data-value="integrations"]'));
  await stage.wait(1100);
  list.scrollLeft = list.scrollWidth;
  await stage.wait(900);
  await stage.click(stage.get('[data-value="billing"]'));
  await stage.wait(1100);
  list.scrollLeft = 0;
  await stage.wait(900);
  await stage.click(stage.get('[data-value="overview"]'));
  await stage.wait(900);
};

// Down the list the pointer lights each tab, then picks one and goes back.
const vertical: SceneScript = async (stage) => {
  await stage.point(stage.get('[data-value="members"]'));
  await stage.wait(500);
  await stage.point(stage.get('[data-value="activity"]'));
  await stage.wait(500);
  await stage.click(stage.get('[data-value="members"]'));
  await stage.wait(1100);
  await stage.click(stage.get('[data-value="overview"]'));
  await stage.wait(900);
};

// Each theme's medium list picks Members, then Activity again.
const states: SceneScript = async (stage) => {
  for (const value of ["members", "activity"]) {
    for (const theme of THEMES) {
      await stage.click(stage.get(`[data-cell="${theme}-md"] [data-value="${value}"]`));
      await stage.wait(900);
    }
  }
};

const tabsLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "orientation",
      type: "choice",
      label: { id: "Arah", en: "Orientation" },
      options: [
        { value: "horizontal", label: { id: "Mendatar", en: "Horizontal" } },
        { value: "vertical", label: { id: "Menurun", en: "Vertical" } },
      ],
    },
    {
      key: "count",
      type: "choice",
      label: { id: "Jumlah tab", en: "Tabs" },
      options: [
        { value: "few", label: { id: "Sedikit", en: "Few" } },
        { value: "many", label: { id: "Banyak", en: "Many" } },
      ],
    },
    {
      key: "width",
      type: "choice",
      label: { id: "Lebar list", en: "List width" },
      options: [
        { value: "fit", label: { id: "Isi", en: "Content" } },
        { value: "equal", label: { id: "Penuh, sama", en: "Full, equal" } },
      ],
    },
    {
      key: "content",
      type: "choice",
      label: { id: "Isi", en: "Content" },
      options: [
        { value: "text", label: { id: "Teks", en: "Text" } },
        { value: "icon", label: { id: "Ikon", en: "Icon" } },
        { value: "both", label: { id: "Keduanya", en: "Both" } },
      ],
    },
    {
      key: "activation",
      type: "choice",
      label: { id: "Panah", en: "Arrow keys" },
      options: [
        { value: "manual", label: { id: "Pindah fokus", en: "Move focus" } },
        { value: "focus", label: { id: "Langsung pilih", en: "Pick at once" } },
      ],
    },
    {
      key: "indicator",
      type: "color",
      label: { id: "Indikator", en: "Indicator" },
      token: "--ow-raised-bg",
    },
    {
      key: "well",
      type: "color",
      label: { id: "Well", en: "Well" },
      token: "--ow-well-bg",
    },
  ],

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
        id: "Well datar dengan role tablist, selebar tab-nya. Menggambar indikator dan Glide sendiri.",
        en: "The flat well, with the tablist role, as wide as its tabs. Draws the indicator and Glide itself.",
      },
      tokens: {
        "--ow-well-bg": "--_well",
        "--ow-well-shadow": "--_well-edge",
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
        id: "Tombol timbul bertepi tegas di bawah tab aktif. Dekoratif, digambar oleh List.",
        en: "The raised key with crisp edges, under the active tab. Decorative, drawn by List.",
      },
      tokens: {
        "--ow-raised-bg": "--_key",
        "--ow-raised-shadow": "--_key-edge",
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

  demo(cfg, lang) {
    const t = TEXT[lang];
    const style = {
      "--ow-raised-bg": cfg.indicator || undefined,
      "--ow-well-bg": cfg.well || undefined,
    } as CSSProperties;
    return (
      <div className="demo-card demo-tabs">
        <Tabs.Root
          defaultValue="overview"
          orientation={cfg.orientation as "horizontal" | "vertical"}
          className={cfg.width === "equal" ? "demo-tabs-equal" : undefined}
          style={style}
        >
          <Tabs.List
            aria-label={t.project}
            size={cfg.size as Size}
            activateOnFocus={cfg.activation === "focus"}
          >
            {valuesOf(cfg).map((value) => (
              <Tabs.Tab
                key={value}
                value={value}
                data-value={value}
                {...tabProps(value, cfg.content, lang)}
              />
            ))}
          </Tabs.List>
          {valuesOf(cfg).map((value) => (
            <Tabs.Panel key={value} value={value} className="demo-tabs-panel">
              {t.panels[value]}
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </div>
    );
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/tabs";
    const values = valuesOf(cfg);
    const custom = cfg.indicator || cfg.well || cfg.width === "equal";
    const open = (name: string, props: string[]) => `<${[name, ...props].join(" ")}>`;
    const rootTag = open("Tabs.Root", [
      'defaultValue="overview"',
      ...(cfg.orientation === "vertical" ? ['orientation="vertical"'] : []),
      ...(custom ? ['className="project-tabs"'] : []),
    ]);
    const listTag = open("Tabs.List", [
      'aria-label="Project"',
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(cfg.activation === "focus" ? ["activateOnFocus"] : []),
    ]);
    const label = (value: Value) => TEXT.en.tabs[value];
    const tabLines = values.flatMap((value) => {
      if (cfg.content === "text") {
        return [`<Tabs.Tab value="${value}">${label(value)}</Tabs.Tab>`];
      }
      return [
        cfg.content === "icon"
          ? `<Tabs.Tab value="${value}" aria-label="${label(value)}">`
          : `<Tabs.Tab value="${value}">`,
        `  <${LUCIDE[value]} />`,
        ...(cfg.content === "both" ? [`  ${label(value)}`] : []),
        "</Tabs.Tab>",
      ];
    });
    const usage = [
      ...(cfg.content === "text"
        ? []
        : [
            `import { ${values
              .map((value) => LUCIDE[value])
              .sort()
              .join(", ")} } from "lucide-react";`,
          ]),
      `import { Tabs } from "${from}";`,
      "",
      "export function ProjectTabs() {",
      "  return (",
      `    ${rootTag}`,
      `      ${listTag}`,
      ...tabLines.map((line) => `        ${line}`),
      "      </Tabs.List>",
      ...values.map(
        (value) => `      <Tabs.Panel value="${value}">${TEXT.en.panels[value]}</Tabs.Panel>`,
      ),
      "    </Tabs.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "project-tabs.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      const lines = [
        ...(cfg.indicator || cfg.well
          ? [
              // Isolated values sit on each component's root, so set them there too.
              setup.mode === "isolated" ? ".project-tabs.ow-tabs {" : ".project-tabs {",
              ...(cfg.indicator ? [`  ${token}-raised-bg: ${cfg.indicator};`] : []),
              ...(cfg.well ? [`  ${token}-well-bg: ${cfg.well};`] : []),
              "}",
            ]
          : []),
        ...(cfg.indicator || cfg.well ? [""] : []),
        ...(cfg.width === "equal"
          ? [
              ".project-tabs .ow-tabs__list {",
              "  inline-size: 100%;",
              "}",
              "",
              ".project-tabs .ow-tabs__tab {",
              "  flex: 1;",
              "}",
            ]
          : []),
      ];
      files.push({ name: "project-tabs.css", code: lines.join("\n").trimEnd() });
    }
    return files;
  },

  scenes: {
    segmented: { cfg: { orientation: "horizontal", count: "few" }, play: segmented },
    overflow: { cfg: { orientation: "horizontal", count: "many", width: "fit" }, play: overflow },
    vertical: { cfg: { orientation: "vertical", count: "few", width: "fit" }, play: vertical },
    anatomy: { cfg: { count: "few" }, inspect: true },
    states: {
      demo: (_cfg, lang) => <States lang={lang} />,
      play: states,
    },
    customization: { cfg: { width: "equal", orientation: "horizontal" }, controls: true },
    ship: { code: true },
  },
});

export default function TabsLab(props: LabProps) {
  return <LabShell lab={tabsLab} {...props} />;
}
