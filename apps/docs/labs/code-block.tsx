"use client";

import { CodeBlock } from "owsem-ui/owsem";
import { type CSSProperties, type MouseEvent, useEffect, useRef } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Highlighted } from "@/components/lab/live-code";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    files: "File",
    copy: "Salin",
    copied: "Tersalin",
    light: "Terang",
    dark: "Gelap",
    single: "Satu snippet",
    tabs: "Tab",
    copiedRow: "Tersalin",
  },
  en: {
    files: "Files",
    copy: "Copy",
    copied: "Copied",
    light: "Light",
    dark: "Dark",
    single: "One snippet",
    tabs: "Tabs",
    copiedRow: "Copied",
  },
} satisfies Record<Lang, Record<string, string>>;

const LONG = `<Button variant="outline" size="sm" startIcon={<Copy />} onClick={() => copy(url)}>Copy link</Button>`;

const SNIPPETS = [
  {
    value: "tsx",
    name: "Button.tsx",
    icon: "atom",
    code: [
      'import { Button } from "owsem-ui/base";',
      "",
      "export function Save() {",
      "  return <Button>Save</Button>;",
      "}",
    ].join("\n"),
  },
  {
    value: "css",
    name: "theme.css",
    icon: "palette",
    code: [":root {", "  --ow-accent: #7c6ab8;", "  --ow-radius: 8px;", "}"].join("\n"),
  },
  {
    value: "sh",
    name: "Terminal",
    icon: "terminal",
    code: "pnpm add owsem-ui",
  },
] as const satisfies readonly { value: string; name: string; icon: IconName; code: string }[];

const initial = { tabs: "on", label: "on", long: "", well: "", panel: "" };
type Cfg = typeof initial;

/**
 * A scene's press is not the visitor's, and browsers let only a visitor's own press write the
 * clipboard: for that one press the stage stands in for the clipboard, which also leaves the
 * visitor's own clipboard alone.
 */
function standIn(event: MouseEvent) {
  const clipboard = navigator.clipboard;
  if (event.isTrusted || !clipboard) return;
  const write = clipboard.writeText;
  clipboard.writeText = () => {
    clipboard.writeText = write;
    return Promise.resolve();
  };
}

/** One snippet's code: highlighted, or a shell command whose prompt CSS draws, so Copy skips it. */
function Code({ snippet, long }: { snippet: (typeof SNIPPETS)[number]; long: boolean }) {
  if (snippet.value === "sh") {
    return (
      <pre>
        <code className="demo-code-shell">
          <span className="tk-fn">pnpm</span> add <span className="tk-str">owsem-ui</span>
        </code>
      </pre>
    );
  }
  const code = long && snippet.value === "tsx" ? `${snippet.code}\n\n${LONG}` : snippet.code;
  return <Highlighted file={{ name: snippet.name, code }} />;
}

/** Snippets in tabs, or one file with its title. */
function Demo({
  cfg,
  lang,
  copied = false,
}: {
  cfg: Cfg;
  lang: Lang;
  /** Copies once it mounts, and holds Copied, for the states matrix. */
  copied?: boolean;
}) {
  const t = TEXT[lang];
  const tabs = cfg.tabs === "on";
  const copy = useRef<HTMLElement>(null);
  useEffect(() => {
    if (copied) copy.current?.click();
  }, [copied]);
  const style = {
    "--ow-well-bg": cfg.well || undefined,
    "--ow-panel": cfg.panel || undefined,
  } as CSSProperties;
  const [first] = SNIPPETS;
  return (
    <CodeBlock.Root className="demo-code" style={style} defaultValue={tabs ? "tsx" : undefined}>
      <CodeBlock.Header>
        {tabs ? (
          <CodeBlock.List aria-label={t.files}>
            {SNIPPETS.map((snippet) => (
              <CodeBlock.Tab
                key={snippet.value}
                value={snippet.value}
                icon={<Icon name={snippet.icon} />}
                data-demo={snippet.value}
              >
                {snippet.name}
              </CodeBlock.Tab>
            ))}
          </CodeBlock.List>
        ) : (
          <CodeBlock.Title icon={<Icon name={first.icon} />}>{first.name}</CodeBlock.Title>
        )}
        <CodeBlock.Copy
          ref={copy}
          labels={{ copy: t.copy, copied: t.copied }}
          showLabel={cfg.label === "on"}
          onClick={standIn}
          timeout={copied ? 86_400_000 : undefined}
          data-demo="copy"
        />
      </CodeBlock.Header>
      {tabs ? (
        SNIPPETS.map((snippet) => (
          <CodeBlock.Panel key={snippet.value} value={snippet.value}>
            <Code snippet={snippet} long={cfg.long === "on"} />
          </CodeBlock.Panel>
        ))
      ) : (
        <CodeBlock.Panel>
          <Code snippet={first} long={cfg.long === "on"} />
        </CodeBlock.Panel>
      )}
    </CodeBlock.Root>
  );
}

const THEMES = ["light", "dark"] as const;

/** One snippet, tabs, and a copy, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const rows = [
    { label: t.single, cfg: { ...initial, tabs: "" }, copied: false },
    { label: t.tabs, cfg: initial, copied: false },
    { label: t.copiedRow, cfg: { ...initial, tabs: "" }, copied: true },
  ];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={rows.map((row) => ({
        label: row.label,
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className="demo-cell demo-code-cell">
            <Demo cfg={row.cfg} lang={lang} copied={row.copied} />
          </div>
        )),
      }))}
    />
  );
}

// Walks the tabs, the icon morphing with each, and comes back to the first.
const tabsScene: SceneScript = async (stage) => {
  for (const value of ["css", "sh", "tsx"]) {
    await stage.click(stage.get(`[data-demo="${value}"]`));
    await stage.wait(1300);
  }
};

// Copies the snippet on show, then another tab's.
const copyScene: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="copy"]'));
  await stage.wait(2000);
  await stage.click(stage.get('[data-demo="css"]'));
  await stage.wait(700);
  await stage.click(stage.get('[data-demo="copy"]'));
  await stage.wait(2000);
  await stage.click(stage.get('[data-demo="tsx"]'));
  await stage.wait(600);
};

// Scrolls the long line to its end and back, as a trackpad would.
const scrollScene: SceneScript = async (stage) => {
  const panel = stage.get(".ow-code-block__panel");
  await stage.point(panel);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  panel.scrollTo({ left: panel.scrollWidth, behavior: reduce ? "instant" : "smooth" });
  await stage.wait(1800);
  panel.scrollTo({ left: 0, behavior: reduce ? "instant" : "smooth" });
  await stage.wait(1200);
};

const codeBlockLab = defineLab({
  initial,
  controls: [
    {
      key: "tabs",
      type: "choice",
      label: { id: "Tab", en: "Tabs" },
      options: [
        { value: "", label: { id: "Satu snippet", en: "One snippet" } },
        { value: "on", label: { id: "Tab", en: "Tabs" } },
      ],
    },
    {
      key: "label",
      type: "choice",
      label: { id: "Label Salin", en: "Copy label" },
      options: [
        { value: "on", label: { id: "Tampil", en: "Shown" } },
        { value: "", label: { id: "Ikon saja", en: "Icon only" } },
      ],
    },
    {
      key: "long",
      type: "choice",
      label: { id: "Baris panjang", en: "Long line" },
      options: [
        { value: "", label: { id: "Mati", en: "Off" } },
        { value: "on", label: { id: "Nyala", en: "On" } },
      ],
    },
    {
      key: "well",
      type: "color",
      label: { id: "Kartu luar", en: "Outer card" },
      token: "--ow-well-bg",
    },
    {
      key: "panel",
      type: "color",
      label: { id: "Kartu dalam", en: "Inner card" },
      token: "--ow-panel",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-code-block",
      note: {
        id: "Kartu luar: well datar dengan tepi tajam. Dengan tab, ia root Tabs Base UI.",
        en: "The outer card: a flat well with a crisp edge. With tabs, Base UI's Tabs root.",
      },
      tokens: {
        "--ow-well-bg": "--_well",
        "--ow-well-shadow": "--_well-edge",
        "--ow-radius": "--_radius",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Header",
      selector: ".ow-code-block__header",
      note: {
        id: "Baris di atas kode: ikon, judul atau tab, dan Salin di ujung.",
        en: "The row above the code: the icon, a title or tabs, and Copy at the end.",
      },
    },
    {
      name: "Icon",
      selector: ".ow-code-block__icon",
      note: {
        id: "Satu ikon di depan, digambar oleh Title atau List. Ia berubah (Icon Morph) saat tab berganti.",
        en: "The one leading icon, drawn by Title or List. It morphs (Icon Morph) as the tab changes.",
      },
    },
    {
      name: "List",
      selector: ".ow-code-block__list",
      note: {
        id: "Tab-nya, list Tabs Base UI: panah memilih sambil bergerak. Bergulir ke samping kalau tidak muat.",
        en: "The tabs, Base UI's Tabs list: the arrows pick as they move. Scrolls sideways when it does not fit.",
      },
    },
    {
      name: "Tab",
      selector: '.ow-code-block__tab[aria-selected="true"]',
      note: {
        id: "Satu snippet. Thumb ada di bawah yang aktif; yang disorot diterangi Glide.",
        en: "One snippet. The thumb sits under the active one; the hovered one is lit by Glide.",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-code-block__thumb",
      note: {
        id: "Tombol timbul bertepi tegas yang bergeser ke tab yang aktif, seperti di Toggle Group. Dekoratif.",
        en: "The raised key with crisp edges that slides to the active tab, as in Toggle Group. Decorative.",
      },
      tokens: { "--ow-raised-bg": "--_key", "--ow-raised-shadow": "--_key-edge" },
    },
    {
      name: "Copy",
      selector: ".ow-code-block__copy",
      note: {
        id: "Copy Button: menyalin snippet yang tampil, atau value-nya sendiri.",
        en: "Copy Button: copies the snippet on show, or its own value.",
      },
    },
    {
      name: "Panel",
      selector: ".ow-code-block__panel",
      note: {
        id: "Kartu dalam: isian panel yang datar, menumpuk 10px di atas header. Kodenya bergulir di dalamnya.",
        en: "The inner card: the flat panel fill, 10px over the header. Its code scrolls inside it.",
      },
      tokens: { "--ow-panel": "--_panel" },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/code-block";
    const custom = cfg.well || cfg.panel;
    const scope = custom ? ' className="snippets"' : "";
    const copy = cfg.label === "on" ? "<CodeBlock.Copy />" : "<CodeBlock.Copy showLabel={false} />";
    const tabs = cfg.tabs === "on";
    const usage = tabs
      ? [
          `import { CodeBlock } from "${from}";`,
          'import { Atom, Palette, Terminal } from "lucide-react";',
          'import type { ReactNode } from "react";',
          "",
          "// Each snippet highlighted at build time, such as with Shiki: a <pre>.",
          'type Snippets = Record<"tsx" | "css" | "sh", ReactNode>;',
          "",
          "export function ButtonSnippets({ code }: { code: Snippets }) {",
          "  return (",
          `    <CodeBlock.Root defaultValue="tsx"${scope}>`,
          "      <CodeBlock.Header>",
          '        <CodeBlock.List aria-label="Files">',
          '          <CodeBlock.Tab value="tsx" icon={<Atom />}>Button.tsx</CodeBlock.Tab>',
          '          <CodeBlock.Tab value="css" icon={<Palette />}>theme.css</CodeBlock.Tab>',
          '          <CodeBlock.Tab value="sh" icon={<Terminal />}>Terminal</CodeBlock.Tab>',
          "        </CodeBlock.List>",
          `        ${copy}`,
          "      </CodeBlock.Header>",
          '      <CodeBlock.Panel value="tsx">{code.tsx}</CodeBlock.Panel>',
          '      <CodeBlock.Panel value="css">{code.css}</CodeBlock.Panel>',
          '      <CodeBlock.Panel value="sh">{code.sh}</CodeBlock.Panel>',
          "    </CodeBlock.Root>",
          "  );",
          "}",
        ]
      : [
          `import { CodeBlock } from "${from}";`,
          'import { Atom } from "lucide-react";',
          'import type { ReactNode } from "react";',
          "",
          "// `code` is highlighted at build time, such as with Shiki: a <pre>.",
          "export function FileSnippet({ name, code }: { name: string; code: ReactNode }) {",
          "  return (",
          `    <CodeBlock.Root${scope}>`,
          "      <CodeBlock.Header>",
          "        <CodeBlock.Title icon={<Atom />}>{name}</CodeBlock.Title>",
          `        ${copy}`,
          "      </CodeBlock.Header>",
          "      <CodeBlock.Panel>{code}</CodeBlock.Panel>",
          "    </CodeBlock.Root>",
          "  );",
          "}",
        ];
    const files = [
      { name: tabs ? "button-snippets.tsx" : "file-snippet.tsx", code: usage.join("\n") },
    ];
    if (custom) {
      const token = `--${setup.prefix}`;
      const lines = [
        setup.mode === "isolated" ? ".snippets.ow-code-block {" : ".snippets {",
        ...(cfg.well ? [`  ${token}-well-bg: ${cfg.well};`] : []),
        ...(cfg.panel ? [`  ${token}-panel: ${cfg.panel};`] : []),
        "}",
      ];
      files.push({ name: "snippets.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    tabs: { play: tabsScene },
    copy: { play: copyScene },
    scroll: { cfg: { tabs: "", long: "on" }, play: scrollScene },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function CodeBlockLab(props: LabProps) {
  return <LabShell lab={codeBlockLab} {...props} />;
}
