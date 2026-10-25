"use client";

import { Kbd } from "owsem-ui/base";
import type { CSSProperties } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    press: "Tekan",
    toSearch: "untuk mencari.",
    search: "Cari…",
    newDoc: "Dokumen baru",
    light: "Terang",
    dark: "Gelap",
  },
  en: {
    press: "Press",
    toSearch: "to search.",
    search: "Search…",
    newDoc: "New document",
    light: "Light",
    dark: "Dark",
  },
};

const SIZES = ["13", "14", "16"] as const;
const THEMES = ["light", "dark"] as const;

const initial = { keys: "⌘K", size: "14", bg: "" };

/** One key in three places: a sentence, a field, and a list row. */
function Contexts({ keys, lang }: { keys: string; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <p>
        {t.press} <Kbd>{keys}</Kbd> {t.toSearch}
      </p>
      <div className="demo-kbd-field">
        <span>{t.search}</span>
        <Kbd>{keys}</Kbd>
      </div>
      <div className="demo-kbd-row">
        <span>{t.newDoc}</span>
        <Kbd>⌘N</Kbd>
      </div>
    </>
  );
}

/** Each text size in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={SIZES.map((size) => ({
        label: `${size}px`,
        cells: THEMES.map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            className="demo-kbd-cell"
            style={{ fontSize: `${size}px` }}
          >
            {t.press} <Kbd>⌘K</Kbd> <Kbd>Esc</Kbd>
          </div>
        )),
      }))}
    />
  );
}

const kbdLab = defineLab({
  initial,
  controls: [
    {
      key: "keys",
      type: "choice",
      label: { id: "Tombol", en: "Keys" },
      options: ["⌘K", "Ctrl K", "⇧⌘P", "Esc"].map((keys) => ({
        value: keys,
        label: { id: keys, en: keys },
      })),
    },
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran teks", en: "Text size" },
      options: SIZES.map((size) => ({ value: size, label: { id: `${size}px`, en: `${size}px` } })),
    },
    {
      key: "bg",
      type: "color",
      label: { id: "Tuts", en: "Keycap" },
      token: "--ow-raised-bg",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-kbd",
      note: {
        id: "Tuts timbul: isian dan tepi dari material raised, ukurannya dari teks di sekitarnya.",
        en: "A raised keycap: its fill and edge from the raised material, its size from the text around it.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-raised-shadow": "--_edge",
        "--ow-muted": "--_fg",
        "--ow-radius": "--_radius",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      fontSize: `${cfg.size}px`,
      "--ow-raised-bg": cfg.bg || undefined,
    } as CSSProperties;
    return (
      <div className="demo-card" style={style}>
        <Contexts keys={cfg.keys} lang={lang} />
      </div>
    );
  },

  code(cfg, setup) {
    const scope = cfg.bg ? ' className="settings"' : "";
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/kbd";
    const usage = [
      `import { Kbd } from "${from}";`,
      "",
      "export function Hint() {",
      "  return (",
      `    <p${scope}>`,
      `      Press <Kbd>${cfg.keys}</Kbd> to search.`,
      "    </p>",
      "  );",
      "}",
    ];
    const files = [{ name: "usage.tsx", code: usage.join("\n") }];
    if (cfg.bg) {
      // Isolated values sit on each Kbd's root, so an inherited value would lose.
      const lines = [
        "/* Every Kbd inside .settings */",
        setup.mode === "isolated" ? ".settings .ow-kbd {" : ".settings {",
        `  --${setup.prefix}-raised-bg: ${cfg.bg};`,
        "}",
      ];
      files.push({ name: "settings.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function KbdLab(props: LabProps) {
  return <LabShell lab={kbdLab} {...props} />;
}
