"use client";

import { Toggle, Toolbar, type ToolbarSize } from "owsem-ui/base";
import { type CSSProperties, type FocusEvent, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    toolbar: "Format",
    text: "Teks",
    history: "Riwayat",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    redo: "Ulangi",
    help: "Bantuan",
    find: "Cari",
    sample: "Toolbar ini memformat baris ini.",
    stop: "Tab mendarat di",
    light: "Terang",
    dark: "Gelap",
  },
  en: {
    toolbar: "Formatting",
    text: "Text",
    history: "History",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    redo: "Redo",
    help: "Help",
    find: "Find",
    sample: "The toolbar formats this line.",
    stop: "Tab lands on",
    light: "Light",
    dark: "Dark",
  },
} satisfies Record<Lang, Record<string, string>>;

type Format = "bold" | "italic" | "underline";
type Theme = "light" | "dark";

const SIZES: readonly ToolbarSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];
const FORMATS: readonly Format[] = ["bold", "italic", "underline"];

const initial = { size: "md", orientation: "horizontal", bg: "", line: "" };
type Cfg = typeof initial;

/**
 * An editor's toolbar over a line of text that follows its toggles. With `stop`, a line under it
 * names the item Tab lands on: the one focused last (roving tabindex).
 */
function Editor({ cfg, lang, stop }: { cfg: Cfg; lang: Lang; stop?: boolean }) {
  const t = TEXT[lang];
  const [format, setFormat] = useState<Record<Format, boolean>>({
    bold: true,
    italic: false,
    underline: false,
  });
  const [tabStop, setTabStop] = useState(t.bold);
  const style = {
    "--ow-panel": cfg.bg || undefined,
    "--ow-line-dark": cfg.line || undefined,
  } as CSSProperties;
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const item = event.target;
    setTabStop(item.getAttribute("aria-label") ?? item.textContent ?? "");
  };
  return (
    <div className="demo-editor">
      <Toolbar.Root
        aria-label={t.toolbar}
        size={cfg.size as ToolbarSize}
        orientation={cfg.orientation as "horizontal" | "vertical"}
        style={style}
        onFocus={onFocus}
      >
        <Toolbar.Group aria-label={t.text}>
          {FORMATS.map((key) => (
            <Toolbar.Button
              key={key}
              render={
                <Toggle
                  pressed={format[key]}
                  onPressedChange={(on) => setFormat((current) => ({ ...current, [key]: on }))}
                />
              }
              aria-label={t[key]}
              startIcon={<Icon name={key} />}
              data-demo={key}
            />
          ))}
        </Toolbar.Group>
        <Toolbar.Separator />
        <Toolbar.Group aria-label={t.history}>
          <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} data-demo="undo" />
          <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} disabled />
        </Toolbar.Group>
        <Toolbar.Separator />
        <Toolbar.Link
          href="#help"
          aria-label={t.help}
          startIcon={<Icon name="circle-help" />}
          onClick={(event) => event.preventDefault()}
        />
        <Toolbar.Input aria-label={t.find} placeholder={t.find} style={{ inlineSize: "7em" }} />
      </Toolbar.Root>
      <p
        className="demo-editor-text"
        style={{
          fontWeight: format.bold ? 600 : undefined,
          fontStyle: format.italic ? "italic" : undefined,
          textDecorationLine: format.underline ? "underline" : undefined,
        }}
      >
        {t.sample}
      </p>
      {stop ? (
        <p className="demo-caption">
          {t.stop} {tabStop}
        </p>
      ) : null}
    </div>
  );
}

/** Each size in both themes: on, off, and disabled items, and a groove. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={SIZES.map((size) => ({
        label: size,
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} data-cell={`${theme}-${size}`} className="demo-cell">
            <Toolbar.Root aria-label={`${t.toolbar}, ${t[theme]}, ${size}`} size={size}>
              <Toolbar.Button
                render={<Toggle defaultPressed />}
                aria-label={t.bold}
                startIcon={<Icon name="bold" />}
              />
              <Toolbar.Button
                render={<Toggle />}
                aria-label={t.italic}
                startIcon={<Icon name="italic" />}
                data-demo="italic"
              />
              <Toolbar.Separator />
              <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
              <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} disabled />
            </Toolbar.Root>
          </div>
        )),
      }))}
    />
  );
}

// Turns Italic and Underline on, presses Undo, then turns them off again.
const together: SceneScript = async (stage) => {
  for (const key of ["italic", "underline", "undo", "italic", "underline"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(key === "undo" ? 700 : 900);
  }
};

// Turns Italic on and off in each theme's md toolbar.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const italic = stage.get(`[data-cell="${theme}-md"] [data-demo="italic"]`);
    await stage.click(italic);
    await stage.wait(900);
    await stage.click(italic);
    await stage.wait(500);
  }
};

const toolbarLab = defineLab({
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
      label: { id: "Orientasi", en: "Orientation" },
      options: [
        { value: "horizontal", label: { id: "Horizontal", en: "Horizontal" } },
        { value: "vertical", label: { id: "Vertikal", en: "Vertical" } },
      ],
    },
    {
      key: "bg",
      type: "color",
      label: { id: "Permukaan", en: "Surface" },
      token: "--ow-panel",
    },
    {
      key: "line",
      type: "color",
      label: { id: "Garis gelap alur", en: "Groove dark line" },
      token: "--ow-line-dark",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-toolbar",
      note: {
        id: "div role=toolbar di atas material panel: satu perhentian Tab, lalu tombol panah.",
        en: "A div with role=toolbar on the panel material: one Tab stop, then arrow keys.",
      },
      tokens: { "--ow-panel": "--_bg", "--ow-panel-shadow": "--_shadow" },
    },
    {
      name: "Group",
      selector: ".ow-toolbar__group",
      note: {
        id: "Item yang satu kelompok, dengan role=group dan namanya sendiri.",
        en: "Items that belong together, with role=group and a name of their own.",
      },
    },
    {
      name: "Toggle",
      selector: '[data-demo="bold"]',
      note: {
        id: "Button yang dirender sebagai Toggle: perilaku dan tampilan Toggle, navigasi toolbar.",
        en: "A Button rendered as a Toggle: Toggle's behavior and look, the toolbar's navigation.",
      },
    },
    {
      name: "Button",
      selector: '[data-demo="undo"]',
      note: {
        id: "Tombol ghost yang tenang, dengan geometri Button. Tetap bisa difokus saat disabled.",
        en: "A quiet ghost button with Button's geometry. Still focusable while disabled.",
      },
      tokens: {
        "--ow-muted": "--_muted",
        "--ow-fg": "--_fg",
        "--ow-hover": "--_hover",
        "--ow-pressed-bg": "--_pressed-bg",
        "--ow-pressed-shadow": "--_pressed-shadow",
      },
    },
    {
      name: "Icon",
      selector: '[data-demo="undo"] .ow-toolbar__icon',
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px. Tanpa label, itemnya persegi.",
        en: "startIcon or endIcon: the font size plus 2px. Without a label, the item is square.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-toolbar__separator",
      note: {
        id: "Alur terukir di antara grup, melintang arah toolbar.",
        en: "An etched groove between groups, across the toolbar's direction.",
      },
      tokens: { "--ow-line-dark": "--_dark", "--ow-line-light": "--_light" },
    },
    {
      name: "Link",
      selector: ".ow-toolbar__link",
      note: {
        id: "Link yang tampil seperti tombol toolbar, ikut navigasi panah.",
        en: "A link that looks like the toolbar's buttons, in the arrow-key order.",
      },
    },
    {
      name: "Input",
      selector: ".ow-toolbar__input",
      note: {
        id: "Field datar bertepi 3:1, setinggi tombol. Panah menggeser caret dulu, jadi letakkan di akhir.",
        en: "A flat field with a 3:1 edge, as tall as the buttons. Arrows move the caret first, so put it last.",
      },
      tokens: {
        "--ow-well-bg": "--_bg",
        "--ow-well-shadow": "--_shadow",
        "--ow-edge": "--_edge",
      },
    },
  ],

  demo(cfg, lang) {
    return <Editor cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Toggle, Toolbar } from "owsem-ui/base";']
      : [
          'import { Toggle } from "@/components/owsem/toggle";',
          'import { Toolbar } from "@/components/owsem/toolbar";',
        ];
    const custom = cfg.bg || cfg.line;
    const props = [
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(cfg.orientation === "vertical" ? ['orientation="vertical"'] : []),
      ...(custom ? ['className="editor"'] : []),
    ];
    const usage = [
      ...imports,
      'import { Bold, CircleHelp, Italic, Redo2, Underline, Undo2 } from "lucide-react";',
      "",
      "export function EditorToolbar() {",
      "  return (",
      `    <Toolbar.Root aria-label="Formatting"${props.map((p) => ` ${p}`).join("")}>`,
      '      <Toolbar.Group aria-label="Text">',
      "        <Toolbar.Button",
      "          render={<Toggle defaultPressed />}",
      '          aria-label="Bold"',
      "          startIcon={<Bold />}",
      "        />",
      "        <Toolbar.Button",
      "          render={<Toggle />}",
      '          aria-label="Italic"',
      "          startIcon={<Italic />}",
      "        />",
      "        <Toolbar.Button",
      "          render={<Toggle />}",
      '          aria-label="Underline"',
      "          startIcon={<Underline />}",
      "        />",
      "      </Toolbar.Group>",
      "      <Toolbar.Separator />",
      '      <Toolbar.Group aria-label="History">',
      '        <Toolbar.Button aria-label="Undo" startIcon={<Undo2 />} />',
      '        <Toolbar.Button aria-label="Redo" startIcon={<Redo2 />} disabled />',
      "      </Toolbar.Group>",
      "      <Toolbar.Separator />",
      '      <Toolbar.Link href="/help" aria-label="Help" startIcon={<CircleHelp />} />',
      '      <Toolbar.Input aria-label="Find" placeholder="Find" />',
      "    </Toolbar.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "editor-toolbar.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // On the toolbar's root, where isolated values sit too.
      const lines = [
        '/* The toolbar with className="editor" */',
        ".editor {",
        ...(cfg.bg ? [`  ${token}-panel: ${cfg.bg};`] : []),
        ...(cfg.line ? [`  ${token}-line-dark: ${cfg.line};`] : []),
        "}",
      ];
      files.push({ name: "editor.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    together: { play: together },
    roving: { demo: (cfg, lang) => <Editor cfg={cfg} lang={lang} stop /> },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function ToolbarLab(props: LabProps) {
  return <LabShell lab={toolbarLab} {...props} />;
}
