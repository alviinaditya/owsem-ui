"use client";

import { Toggle, type ToggleSize } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Catatan rapat",
    body: "Peluncuran pindah ke Jumat; toolbar ikut rilis bersamanya.",
    format: "Format teks",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    pin: "Sematkan",
  },
  en: {
    title: "Meeting notes",
    body: "Launch moves to Friday; the toolbar ships with it.",
    format: "Text format",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    pin: "Pin",
  },
} satisfies Record<Lang, Record<string, string>>;

const MATRIX = {
  id: {
    light: "Terang",
    dark: "Gelap",
    off: "Mati",
    on: "Menyala",
    disabledOff: "Disabled, mati",
    disabledOn: "Disabled, menyala",
    both: "Ikon dan label",
    label: "Label",
    icon: "Ikon saja",
  },
  en: {
    light: "Light",
    dark: "Dark",
    off: "Off",
    on: "On",
    disabledOff: "Disabled, off",
    disabledOn: "Disabled, on",
    both: "Icon and label",
    label: "Label",
    icon: "Icon only",
  },
} satisfies Record<Lang, Record<string, string>>;

type Format = "bold" | "italic" | "underline";
type Theme = "light" | "dark";

const SIZES: readonly ToggleSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { size: "md", on: "", text: "" };
type Cfg = typeof initial;

/** A note whose text follows its own formatting toggles, with a Pin toggle beside its title. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const size = cfg.size as ToggleSize;
  const [format, setFormat] = useState<Record<Format, boolean>>({
    bold: true,
    italic: false,
    underline: false,
  });
  // On the toggles, so the text color leaves the note's own text alone.
  const style = {
    "--ow-raised-bg": cfg.on || undefined,
    "--ow-fg": cfg.text || undefined,
  } as CSSProperties;
  const mark = (key: Format) => (
    <Toggle
      size={size}
      style={style}
      aria-label={t[key]}
      startIcon={<Icon name={key} />}
      pressed={format[key]}
      onPressedChange={(on) => setFormat((current) => ({ ...current, [key]: on }))}
      data-demo={key}
    />
  );
  return (
    <div className="demo-card demo-toggle">
      <div className="demo-toggle-head">
        <p className="demo-title">{t.title}</p>
        <Toggle size={size} style={style} startIcon={<Icon name="pin" />} data-demo="pin">
          {t.pin}
        </Toggle>
      </div>
      <p
        style={{
          fontWeight: format.bold ? 600 : undefined,
          fontStyle: format.italic ? "italic" : undefined,
          textDecorationLine: format.underline ? "underline" : undefined,
        }}
      >
        {t.body}
      </p>
      <fieldset className="demo-toggle-row">
        <legend className="visually-hidden">{t.format}</legend>
        {mark("bold")}
        {mark("italic")}
        {mark("underline")}
      </fieldset>
    </div>
  );
}

/** A toggle with its used size under it, read from the layout (the stage may scale the demo). */
function Measured({ children, square }: { children: ReactNode; square?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState("");
  useLayoutEffect(() => {
    const toggle = ref.current?.querySelector<HTMLElement>(".ow-toggle");
    if (!toggle) return;
    const px = (value: string) => String(Math.round(Number.parseFloat(value) * 100) / 100);
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(toggle);
      setSize(square ? `${px(style.width)} × ${px(style.height)}` : px(style.height));
    });
    observer.observe(toggle);
    return () => observer.disconnect();
  }, [square]);
  return (
    <span ref={ref} className="demo-measured">
      {children}
      <span className="demo-measure">{size}</span>
    </span>
  );
}

/** Each size with an icon and label, a label, and an icon only: one height per size. */
function Geometry({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <div className="demo-surface">
      <Matrix
        columns={[t.both, t.label, t.icon]}
        rows={SIZES.map((size) => ({
          label: size,
          cells: [
            <Measured key="both">
              <Toggle size={size} startIcon={<Icon name="pin" />}>
                {t.pin}
              </Toggle>
            </Measured>,
            <Measured key="label">
              <Toggle size={size} defaultPressed>
                {t.pin}
              </Toggle>
            </Measured>,
            <Measured key="icon" square>
              <Toggle size={size} aria-label={t.bold} startIcon={<Icon name="bold" />} />
            </Measured>,
          ],
        }))}
      />
    </div>
  );
}

const STATES = [
  { key: "off", props: {} },
  { key: "on", props: { defaultPressed: true } },
  { key: "disabledOff", props: { disabled: true } },
  { key: "disabledOn", props: { disabled: true, defaultPressed: true } },
] as const;

/** Off, on, and disabled, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={STATES.map(({ key, props }) => ({
        label: t[key],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} data-cell={`${theme}-${key}`} className="demo-cell">
            <Toggle {...props} aria-label={t.bold} startIcon={<Icon name="bold" />} />
            <Toggle {...props} startIcon={<Icon name="pin" />} data-demo="pin">
              {t.pin}
            </Toggle>
          </div>
        )),
      }))}
    />
  );
}

// Turns Italic and Underline on, then off again: the note's text follows.
const pressing: SceneScript = async (stage) => {
  for (const key of ["italic", "underline", "italic", "underline"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(900);
  }
};

// Points at the off toggle in each theme, then turns it on and off.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const pin = stage.get(`[data-cell="${theme}-off"] [data-demo="pin"]`);
    await stage.point(pin);
    await stage.wait(500);
    await stage.click(pin);
    await stage.wait(900);
    await stage.click(pin);
    await stage.wait(500);
  }
};

const toggleLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "on",
      type: "color",
      label: { id: "Permukaan menyala", en: "On surface" },
      token: "--ow-raised-bg",
    },
    {
      key: "text",
      type: "color",
      label: { id: "Teks menyala", en: "On text" },
      token: "--ow-fg",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: '[data-demo="pin"]',
      note: {
        id: "button dari Base UI, dengan aria-pressed. Datar saat mati, tombol timbul saat menyala.",
        en: "Base UI's button, with aria-pressed. Flat while off, the raised key while on.",
      },
      tokens: {
        "--ow-muted": "--_muted",
        "--ow-fg": "--_fg",
        "--ow-hover": "--_hover",
        "--ow-raised-bg": "--_raised-bg",
        "--ow-raised-shadow": "--_raised-shadow",
        "--ow-pressed-bg": "--_pressed-bg",
        "--ow-pressed-shadow": "--_pressed-shadow",
      },
    },
    {
      name: "Icon",
      selector: '[data-demo="pin"] .ow-toggle__icon',
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px, sejauh jarak atas dari tepi.",
        en: "startIcon or endIcon: the font size plus 2px, as far from the edge as from the top.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/toggle";
    const custom = cfg.on || cfg.text;
    const scope = custom ? ' className="note"' : "";
    const size = cfg.size === "md" ? "" : ` size="${cfg.size}"`;
    const usage = [
      `import { Toggle } from "${from}";`,
      'import { Bold, Italic, Pin } from "lucide-react";',
      "",
      "export function NoteTools() {",
      "  return (",
      `    <div${scope}>`,
      `      <Toggle${size} aria-label="Bold" startIcon={<Bold />} defaultPressed />`,
      `      <Toggle${size} aria-label="Italic" startIcon={<Italic />} />`,
      `      <Toggle${size} startIcon={<Pin />}>Pin</Toggle>`,
      "    </div>",
      "  );",
      "}",
    ];
    const files = [{ name: "note-tools.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // On the toggles: the text color would recolor the note's own text, and isolated values
      // sit on each Toggle's root, so an inherited value would lose.
      const lines = [
        "/* Every Toggle inside .note */",
        ".note .ow-toggle {",
        ...(cfg.on ? [`  ${token}-raised-bg: ${cfg.on};`] : []),
        ...(cfg.text ? [`  ${token}-fg: ${cfg.text};`] : []),
        "}",
      ];
      files.push({ name: "note.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    pressing: { play: pressing },
    geometry: { demo: (_cfg, lang) => <Geometry lang={lang} /> },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function ToggleLab(props: LabProps) {
  return <LabShell lab={toggleLab} {...props} />;
}
