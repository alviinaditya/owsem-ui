"use client";

import { type ColorFormat, ColorPicker, ColorPickerPopover } from "owsem-ui/owsem";
import { type CSSProperties, type ReactNode, useState } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const START = "#7c6ab8";

const TEXT = {
  id: {
    swatches: [
      ["#7c6ab8", "Lila"],
      ["#3b82f6", "Biru"],
      ["#14b8a6", "Toska"],
      ["#22c55e", "Hijau"],
      ["#eab308", "Kuning"],
      ["#f97316", "Oranye"],
      ["#ef4444", "Merah"],
      ["#ec4899", "Merah muda"],
    ],
    log: "Nilai yang dikirim",
    light: "Terang",
    dark: "Gelap",
    translucent: "Transparan",
    disabled: "Nonaktif",
  },
  en: {
    swatches: [
      ["#7c6ab8", "Lilac"],
      ["#3b82f6", "Blue"],
      ["#14b8a6", "Teal"],
      ["#22c55e", "Green"],
      ["#eab308", "Yellow"],
      ["#f97316", "Orange"],
      ["#ef4444", "Red"],
      ["#ec4899", "Pink"],
    ],
    log: "Values sent",
    light: "Light",
    dark: "Dark",
    translucent: "Translucent",
    disabled: "Disabled",
  },
} satisfies Record<Lang, Record<string, unknown>>;

const swatches = (lang: Lang) =>
  TEXT[lang].swatches.map(([color = "", label = ""]) => ({ color, label }));

const initial = { format: "hex", alpha: "on", bg: "", checker: "" };
type Config = typeof initial;

/** The panel, with what its two callbacks last sent. */
function Demo({ cfg, lang, style }: { cfg: Config; lang: Lang; style: CSSProperties }) {
  const [live, setLive] = useState(START);
  const [done, setDone] = useState(START);
  return (
    <div className="demo-color" style={style}>
      <ColorPicker
        defaultValue={START}
        format={cfg.format as ColorFormat}
        alpha={cfg.alpha === "on"}
        swatches={swatches(lang)}
        labels={getDictionary(lang).lab.picker}
        onChange={setLive}
        onChangeComplete={setDone}
      />
      <dl className="demo-color-log" aria-label={TEXT[lang].log}>
        <div>
          <dt>onChange</dt>
          <dd>{live}</dd>
        </div>
        <div>
          <dt>onChangeComplete</dt>
          <dd>{done}</dd>
        </div>
      </dl>
    </div>
  );
}

const THEMES = ["light", "dark"] as const;
const SIZES = ["sm", "md", "lg"] as const;

/** Triggers by size and state, in both themes; each opens the picker in a popover. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const labels = getDictionary(lang).lab.picker;
  const cell = (theme: (typeof THEMES)[number], row: string, content: ReactNode) => (
    <div key={theme} className="demo-color-cell" data-theme={theme} data-cell={`${theme}-${row}`}>
      {content}
    </div>
  );
  const row = (label: string, id: string, make: (name: string) => ReactNode) => ({
    label,
    cells: THEMES.map((theme) => cell(theme, id, make(`${t[theme]}, ${label}`))),
  });
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={[
        ...SIZES.map((size) =>
          row(size, size, (name) => (
            <>
              {/* A field is named by its value; the table's headers give its place. */}
              <ColorPickerPopover size={size} defaultValue={START} labels={labels} />
              <ColorPickerPopover
                size={size}
                variant="swatch"
                defaultValue={START}
                labels={labels}
                aria-label={name}
              />
            </>
          )),
        ),
        row(t.translucent, "alpha", () => (
          <ColorPickerPopover defaultValue="#7c6ab880" labels={labels} />
        )),
        row(t.disabled, "disabled", () => (
          <ColorPickerPopover disabled defaultValue={START} labels={labels} />
        )),
      ]}
    />
  );
}

// Drags the area's thumb around, and back to where it started (lilac: saturation 42, brightness 72).
const area: SceneScript = async (stage) => {
  const target = stage.get(".ow-color-picker-area");
  await stage.drag(target, [
    { x: 0.42, y: 0.28 },
    { x: 0.9, y: 0.1 },
    { x: 0.75, y: 0.62 },
    { x: 0.18, y: 0.4 },
    { x: 0.42, y: 0.28 },
  ]);
  await stage.wait(900);
};

// Drags the opacity down over the checkerboard, and back up.
const alpha: SceneScript = async (stage) => {
  const track = stage.get('[data-channel="alpha"] .ow-color-picker-track');
  await stage.drag(track, [
    { x: 1, y: 0.5 },
    { x: 0.15, y: 0.5 },
  ]);
  await stage.wait(1200);
  await stage.drag(track, [
    { x: 0.15, y: 0.5 },
    { x: 0.55, y: 0.5 },
    { x: 1, y: 0.5 },
  ]);
  await stage.wait(600);
};

// Cycles the fields through RGB and HSL, tries two swatches, and comes back to lilac and hex.
const formats: SceneScript = async (stage) => {
  const format = stage.get(".ow-color-picker-format");
  for (let i = 0; i < 2; i++) {
    await stage.click(format);
    await stage.wait(1000);
  }
  for (const n of [2, 7, 1]) {
    await stage.click(stage.get(`.ow-color-picker-swatch:nth-child(${n})`));
    await stage.wait(900);
  }
  await stage.click(format);
  await stage.wait(600);
};

// Opens the medium trigger's popover in each theme, then shuts it.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const trigger = stage.get(`[data-cell="${theme}-md"] .ow-color-picker-trigger`);
    await stage.click(trigger);
    await stage.wait(1800);
    await stage.click(trigger);
    await stage.wait(700);
  }
};

const colorPickerLab = defineLab({
  initial,
  controls: [
    {
      key: "format",
      type: "choice",
      label: { id: "Format", en: "Format" },
      options: [
        { value: "hex", label: { id: "HEX", en: "HEX" } },
        { value: "rgb", label: { id: "RGB", en: "RGB" } },
        { value: "hsl", label: { id: "HSL", en: "HSL" } },
      ],
    },
    {
      key: "alpha",
      type: "choice",
      label: { id: "Opasitas", en: "Opacity" },
      options: [
        { value: "on", label: { id: "Aktif", en: "On" } },
        { value: "off", label: { id: "Nonaktif", en: "Off" } },
      ],
    },
    {
      key: "bg",
      type: "color",
      label: { id: "Panel", en: "Panel" },
      token: "--ow-panel",
    },
    {
      key: "checker",
      type: "color",
      label: { id: "Papan catur", en: "Checkerboard" },
      token: "--ow-line",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-color-picker",
      note: {
        id: "Panel datar dengan tepi tegas. Token komponen dipasang di sini.",
        en: "The panel: a flat fill with a crisp edge. Component tokens go here.",
      },
      tokens: {
        "--ow-color-picker-width": "--_width",
        "--ow-color-picker-area-height": "--_area-height",
        "--ow-color-picker-bg": "--_bg",
        "--ow-color-picker-checker": "--_checker",
        "--ow-color-picker-thumb": "--_thumb",
      },
    },
    {
      name: "Area",
      selector: ".ow-color-picker-area",
      note: {
        id: "Saturasi ke kanan, kecerahan ke atas. Slider 2D dengan keyboard dan ARIA sendiri.",
        en: "Saturation to the right, brightness up. A 2D slider with its own keyboard and ARIA.",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-color-picker-area .ow-color-picker-thumb",
      note: {
        id: "Cincin warna bertepi gelap 1px; memadat saat ditekan, memantul saat dilepas.",
        en: "A ring with a 1px dark edge around the color; compacts when pressed, springs back.",
      },
    },
    {
      name: "Hue",
      selector: '[data-channel="hue"]',
      note: {
        id: "Slider dari Base UI di atas track bertepi 1px berisi pelangi rona.",
        en: "A Base UI Slider over a track painted with every hue, inside a 1px edge.",
      },
    },
    {
      name: "Alpha",
      selector: '[data-channel="alpha"]',
      note: {
        id: "Opasitas, dari transparan ke penuh, di atas papan catur.",
        en: "Opacity, from clear to solid, over the checkerboard.",
      },
    },
    {
      name: "EyeDropper",
      selector: ".ow-color-picker-tool",
      note: {
        id: "Mengambil warna dari layar; hanya muncul di browser yang punya EyeDropper API.",
        en: "Picks a color off the screen; shown only where the browser has the EyeDropper API.",
      },
    },
    {
      name: "Preview",
      selector: ".ow-color-picker-preview",
      note: {
        id: "Warna saat ini di atas papan catur, setinggi kedua track.",
        en: "The current color over the checkerboard, as tall as both tracks.",
      },
    },
    {
      name: "Format",
      selector: ".ow-color-picker-format",
      note: {
        id: "Berganti antara kolom HEX, RGB, dan HSL.",
        en: "Switches between the HEX, RGB, and HSL fields.",
      },
    },
    {
      name: "Field",
      selector: ".ow-color-picker-field",
      note: {
        id: "Kolom datar bertepi 3:1. Angka berlaku saat diketik; hex saat Enter atau blur.",
        en: "A flat field with a 3:1 edge. Numbers apply as you type; hex on Enter or blur.",
      },
    },
    {
      name: "Swatches",
      selector: ".ow-color-picker-swatches",
      note: {
        id: "Toggle Group dari Base UI di bawah garis terukir; yang cocok diberi centang.",
        en: "A Base UI Toggle Group under an etched line; the match carries a check.",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      "--ow-color-picker-bg": cfg.bg || undefined,
      "--ow-color-picker-checker": cfg.checker || undefined,
    } as CSSProperties;
    return <Demo cfg={cfg} lang={lang} style={style} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/color-picker";
    const custom = cfg.bg || cfg.checker;
    const usage = [
      '"use client";',
      "",
      `import { ColorPicker } from "${from}";`,
      'import { useState } from "react";',
      "",
      "export function BrandColor({ onSave }: { onSave: (color: string) => void }) {",
      '  const [color, setColor] = useState("#7c6ab8");',
      "  return (",
      "    <ColorPicker",
      ...(custom ? ['      className="brand-picker"'] : []),
      "      value={color}",
      ...(cfg.format === "hex" ? [] : [`      format="${cfg.format}"`]),
      ...(cfg.alpha === "on" ? [] : ["      alpha={false}"]),
      "      onChange={setColor}",
      "      onChangeComplete={onSave}",
      "    />",
      "  );",
      "}",
    ];
    const files = [{ name: "brand-color.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}-color-picker`;
      // Isolated tokens are set on each picker's root, so set them there too.
      const lines = [
        setup.mode === "isolated" ? ".brand-picker.ow-color-picker {" : ".brand-picker {",
        ...(cfg.bg ? [`  ${token}-bg: ${cfg.bg};`] : []),
        ...(cfg.checker ? [`  ${token}-checker: ${cfg.checker};`] : []),
        "}",
      ];
      files.push({ name: "brand-color.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    area: { play: area },
    alpha: { cfg: { alpha: "on" }, play: alpha },
    formats: { cfg: { format: "hex" }, play: formats },
    anatomy: { inspect: true },
    states: {
      demo: (_cfg, lang) => <States lang={lang} />,
      play: states,
    },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function ColorPickerLab(props: LabProps) {
  return <LabShell lab={colorPickerLab} {...props} />;
}
