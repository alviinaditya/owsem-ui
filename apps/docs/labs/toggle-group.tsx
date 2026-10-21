"use client";

import { ToggleGroup } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const VIEWS = ["list", "board", "calendar"] as const;
const FORMATS = ["bold", "italic", "underline", "strikethrough"] as const;
type View = (typeof VIEWS)[number];
type Format = (typeof FORMATS)[number];

const ICONS: Record<View | Format, IconName> = {
  list: "list",
  board: "square-kanban",
  calendar: "calendar",
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
};

// Lucide's React names, for the generated code.
const LUCIDE: Record<View | Format, string> = {
  list: "List",
  board: "SquareKanban",
  calendar: "Calendar",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
};

const TEXT = {
  id: {
    view: "Tampilan",
    list: "Daftar",
    board: "Papan",
    calendar: "Kalender",
    showing: {
      list: "12 tugas, sebagai daftar",
      board: "12 tugas, di papan",
      calendar: "12 tugas, di kalender",
    },
    tasks: "Tugas",
    formatting: "Format",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    strikethrough: "Coret",
    sample: "Rapat tim pindah ke Kamis pagi.",
    note: "Catatan",
  },
  en: {
    view: "View",
    list: "List",
    board: "Board",
    calendar: "Calendar",
    showing: {
      list: "12 tasks, as a list",
      board: "12 tasks, on a board",
      calendar: "12 tasks, on a calendar",
    },
    tasks: "Tasks",
    formatting: "Formatting",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strikethrough: "Strikethrough",
    sample: "The team meeting moves to Thursday morning.",
    note: "Note",
  },
} satisfies Record<Lang, unknown>;

const THEME_NAMES = {
  id: { light: "Terang", dark: "Gelap" },
  en: { light: "Light", dark: "Dark" },
} satisfies Record<Lang, Record<string, string>>;

const initial = {
  size: "md",
  selection: "single",
  width: "auto",
  content: "text",
  thumb: "",
  track: "",
};
type Cfg = typeof initial;
type Size = "sm" | "md" | "lg";

/** An item's content: its text, its icon (named for screen readers), or both. */
function itemProps(value: View | Format, content: string, lang: Lang) {
  const label = TEXT[lang][value];
  const icon = <Icon key="icon" name={ICONS[value]} />;
  if (content === "icon") return { "aria-label": label, children: icon };
  // An array, not a fragment: the item wraps text it can see, so the icon keeps its spacing.
  if (content === "both") return { children: [icon, label] };
  return { children: label };
}

/** The segmented control: one view at a time, always one. */
function Views({ cfg, lang, style }: { cfg: Cfg; lang: Lang; style?: CSSProperties }) {
  const t = TEXT[lang];
  const [view, setView] = useState<View>("list");
  return (
    <div className="demo-card demo-toggle" style={style}>
      <div className="demo-toggle-head">
        <p className="demo-title">{t.tasks}</p>
        <ToggleGroup.Root
          aria-label={t.view}
          size={cfg.size as Size}
          equal={cfg.width === "equal"}
          value={[view]}
          onValueChange={([next]) => next && setView(next)}
        >
          {VIEWS.map((value) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              data-value={value}
              {...itemProps(value, cfg.content, lang)}
            />
          ))}
        </ToggleGroup.Root>
      </div>
      <p className="demo-muted">{t.showing[view]}</p>
    </div>
  );
}

/** Multiple selection: each format toggles on its own, and the note follows. */
function Formats({ cfg, lang, style }: { cfg: Cfg; lang: Lang; style?: CSSProperties }) {
  const t = TEXT[lang];
  const [formats, setFormats] = useState<Format[]>(["bold"]);
  const on = (format: Format) => formats.includes(format);
  const lines = [on("underline") && "underline", on("strikethrough") && "line-through"];
  return (
    <div className="demo-card demo-toggle" style={style}>
      <ToggleGroup.Root
        aria-label={t.formatting}
        multiple
        size={cfg.size as Size}
        equal={cfg.width === "equal"}
        value={formats}
        onValueChange={setFormats}
      >
        {FORMATS.map((value) => (
          <ToggleGroup.Item
            key={value}
            value={value}
            data-value={value}
            {...itemProps(value, cfg.content, lang)}
          />
        ))}
      </ToggleGroup.Root>
      <p
        className="demo-toggle-note"
        style={{
          fontWeight: on("bold") ? 600 : 400,
          fontStyle: on("italic") ? "italic" : "normal",
          textDecorationLine: lines.filter(Boolean).join(" ") || "none",
        }}
      >
        {t.sample}
      </p>
    </div>
  );
}

const THEMES = ["light", "dark"] as const;
const SIZES: readonly Size[] = ["sm", "md", "lg"];

/** One cell of the states matrix: a group in one theme. */
function Cell({
  theme,
  row,
  lang,
}: {
  theme: (typeof THEMES)[number];
  row: Size | "disabled" | "multiple";
  lang: Lang;
}) {
  const t = TEXT[lang];
  const [view, setView] = useState<View>("board");
  const multiple = row === "multiple";
  return (
    <div data-theme={theme} className="demo-surface" data-cell={`${theme}-${row}`}>
      {multiple ? (
        <ToggleGroup.Root aria-label={t.formatting} multiple defaultValue={["bold"]}>
          {FORMATS.map((value) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              data-value={value}
              {...itemProps(value, "icon", lang)}
            />
          ))}
        </ToggleGroup.Root>
      ) : (
        <ToggleGroup.Root
          aria-label={`${t.view}, ${row}`}
          size={row === "disabled" ? "md" : row}
          disabled={row === "disabled"}
          value={[view]}
          onValueChange={([next]) => next && setView(next)}
        >
          {VIEWS.map((value) => (
            <ToggleGroup.Item
              key={value}
              value={value}
              data-value={value}
              {...itemProps(value, "text", lang)}
            />
          ))}
        </ToggleGroup.Root>
      )}
    </div>
  );
}

/** Sizes, disabled, and multiple selection, in both themes. */
function States({ lang }: { lang: Lang }) {
  const rows = [...SIZES, "disabled", "multiple"] as const;
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

// The pointer picks each view in turn, and ends on the first.
const segmented: SceneScript = async (stage) => {
  for (const view of ["board", "calendar", "list"]) {
    await stage.click(stage.get(`[data-value="${view}"]`));
    await stage.wait(1100);
  }
};

// A press on the chosen view, then a change of mind mid-slide, then back.
const spring: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-value="list"]'));
  await stage.wait(900);
  await stage.click(stage.get('[data-value="calendar"]'));
  await stage.click(stage.get('[data-value="board"]'));
  await stage.wait(1100);
  await stage.click(stage.get('[data-value="list"]'));
  await stage.wait(900);
};

// Two formats on, then off again.
const multiple: SceneScript = async (stage) => {
  for (const format of ["italic", "underline", "underline", "italic"]) {
    await stage.click(stage.get(`[data-value="${format}"]`));
    await stage.wait(900);
  }
};

// Each theme's medium group picks Calendar, then Board again.
const states: SceneScript = async (stage) => {
  for (const view of ["calendar", "board"]) {
    for (const theme of THEMES) {
      await stage.click(stage.get(`[data-cell="${theme}-md"] [data-value="${view}"]`));
      await stage.wait(900);
    }
  }
};

const toggleGroupLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "selection",
      type: "choice",
      label: { id: "Pilihan", en: "Selection" },
      options: [
        { value: "single", label: { id: "Satu", en: "Single" } },
        { value: "multiple", label: { id: "Banyak", en: "Multiple" } },
      ],
    },
    {
      key: "width",
      type: "choice",
      label: { id: "Lebar item", en: "Item width" },
      options: [
        { value: "auto", label: { id: "Isi", en: "Content" } },
        { value: "equal", label: { id: "Sama", en: "Equal" } },
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
      key: "thumb",
      type: "color",
      label: { id: "Thumb", en: "Thumb" },
      token: "--ow-raised-bg",
    },
    {
      key: "track",
      type: "color",
      label: { id: "Track", en: "Track" },
      token: "--ow-well-bg",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-toggle-group",
      note: {
        id: "Track datar dengan role group. Memuat item, thumb, dan highlight hover (Glide).",
        en: "The flat track, with the group role. Holds the items, the thumb, and Glide's hover highlight.",
      },
      tokens: {
        "--ow-toggle-group-track": "--_track",
        "--ow-toggle-group-track-shadow": "--_track-shadow",
        "--ow-toggle-group-fg": "--_fg",
        "--ow-toggle-group-muted": "--_muted",
      },
    },
    {
      name: "Item",
      selector: ".ow-toggle-group-item:not([data-pressed])",
      note: {
        id: "Toggle dari Base UI: button dengan aria-pressed. Ukurannya mengikuti aturan --py.",
        en: "Base UI's Toggle: a button with aria-pressed. Sized by the --py rule.",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-toggle-group-thumb",
      note: {
        id: "Tombol timbul bertepi tegas di bawah item yang ditekan. Dekoratif; hanya di pilihan tunggal.",
        en: "The raised key with crisp edges, under the pressed item. Decorative; single selection only.",
      },
      tokens: {
        "--ow-toggle-group-thumb": "--_thumb",
        "--ow-toggle-group-thumb-shadow": "--_thumb-shadow",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      "--ow-toggle-group-thumb": cfg.thumb || undefined,
      "--ow-toggle-group-track": cfg.track || undefined,
    } as CSSProperties;
    // Remounted when the selection changes, so each demo starts from its own value.
    return cfg.selection === "multiple" ? (
      <Formats key="formats" cfg={cfg} lang={lang} style={style} />
    ) : (
      <Views key="views" cfg={cfg} lang={lang} style={style} />
    );
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/toggle-group";
    const multiple = cfg.selection === "multiple";
    const values: readonly (View | Format)[] = multiple ? FORMATS : VIEWS;
    const content = cfg.content;
    const scope = multiple ? "formatting" : "view-switcher";
    const custom = cfg.thumb || cfg.track;
    const rootProps = [
      `aria-label="${multiple ? "Formatting" : "View"}"`,
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(cfg.width === "equal" ? ["equal"] : []),
      ...(custom ? [`className="${scope}"`] : []),
      ...(multiple
        ? ["multiple", 'defaultValue={["bold"]}']
        : [
            "value={[view]}",
            "// Always one view: pressing the current one changes nothing.",
            "onValueChange={([next]) => next && setView(next)}",
          ]),
    ];
    const label = (value: string) => value[0]?.toUpperCase() + value.slice(1);
    const itemLines = values.flatMap((value) => {
      const icon = `<${LUCIDE[value]} />`;
      if (content === "text") {
        return [`<ToggleGroup.Item value="${value}">${label(value)}</ToggleGroup.Item>`];
      }
      return [
        content === "icon"
          ? `<ToggleGroup.Item value="${value}" aria-label="${label(value)}">`
          : `<ToggleGroup.Item value="${value}">`,
        `  ${icon}`,
        ...(content === "both" ? [`  ${label(value)}`] : []),
        "</ToggleGroup.Item>",
      ];
    });
    const name = multiple ? "Formatting" : "ViewSwitcher";
    const usage = [
      ...(content === "text"
        ? []
        : [
            `import { ${values
              .map((value) => LUCIDE[value])
              .sort()
              .join(", ")} } from "lucide-react";`,
          ]),
      `import { ToggleGroup } from "${from}";`,
      ...(multiple ? [] : ['import { useState } from "react";']),
      "",
      `export function ${name}() {`,
      ...(multiple ? [] : ['  const [view, setView] = useState("list");']),
      "  return (",
      "    <ToggleGroup.Root",
      ...rootProps.map((prop) => `      ${prop}`),
      "    >",
      ...itemLines.map((line) => `      ${line}`),
      "    </ToggleGroup.Root>",
      "  );",
      "}",
    ];
    const files = [
      { name: `${multiple ? "formatting" : "view-switcher"}.tsx`, code: usage.join("\n") },
    ];
    if (custom) {
      const token = `--${setup.prefix}-toggle-group`;
      // Isolated tokens are set on each group's root, so set them there too.
      const lines = [
        setup.mode === "isolated" ? `.${scope}.ow-toggle-group {` : `.${scope} {`,
        ...(cfg.thumb ? [`  ${token}-thumb: ${cfg.thumb};`] : []),
        ...(cfg.track ? [`  ${token}-track: ${cfg.track};`] : []),
        "}",
      ];
      files.push({ name: `${scope}.css`, code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    segmented: { cfg: { selection: "single" }, play: segmented },
    spring: { cfg: { selection: "single" }, play: spring },
    multiple: { cfg: { selection: "multiple", content: "icon" }, play: multiple },
    anatomy: { inspect: true },
    states: {
      demo: (_cfg, lang) => <States lang={lang} />,
      play: states,
    },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function ToggleGroupLab(props: LabProps) {
  return <LabShell lab={toggleGroupLab} {...props} />;
}
