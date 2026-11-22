"use client";

import { type ColorFormat, ColorPicker, ColorPickerPopover } from "owsem-ui/owsem";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { getDictionary } from "@/lib/dictionaries";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

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
    brand: "Warna merek",
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
    brand: "Brand color",
  },
} satisfies Record<Lang, Record<string, unknown>>;

const swatches = (lang: Lang) =>
  TEXT[lang].swatches.map(([color = "", label = ""]) => ({ color, label }));

const labelsOf = (lang: Lang) => getDictionary(lang).common.picker;

function Default({ lang }: { lang: Lang }) {
  return <ColorPicker defaultValue={START} swatches={swatches(lang)} labels={labelsOf(lang)} />;
}

/** The panel, with what its two callbacks last sent. */
function Callbacks({ lang }: { lang: Lang }) {
  const [live, setLive] = useState(START);
  const [done, setDone] = useState(START);
  return (
    <div className="demo-color">
      <ColorPicker
        defaultValue={START}
        swatches={swatches(lang)}
        labels={labelsOf(lang)}
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

function Formats({ lang }: { lang: Lang }) {
  return (
    <ColorPicker
      defaultValue={START}
      format={"hsl" satisfies ColorFormat}
      alpha={false}
      swatches={swatches(lang)}
      labels={labelsOf(lang)}
    />
  );
}

function Popover({ lang }: { lang: Lang }) {
  const labels = labelsOf(lang);
  return (
    <div className="demo-color-row">
      <ColorPickerPopover
        aria-label={TEXT[lang].brand}
        defaultValue={START}
        swatches={swatches(lang)}
        labels={labels}
      />
      <ColorPickerPopover
        variant="swatch"
        aria-label={TEXT[lang].brand}
        defaultValue={START}
        swatches={swatches(lang)}
        labels={labels}
      />
    </div>
  );
}

const THEMES = ["light", "dark"] as const;

/** Triggers on each theme's own background; each opens the picker in a popover. */
function Themes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const labels = labelsOf(lang);
  return (
    <div className="demo-color-themes">
      {THEMES.map((theme) => (
        <div key={theme} className="demo-color-cell" data-theme={theme}>
          <ColorPickerPopover
            aria-label={`${t[theme]}, ${t.brand}`}
            defaultValue={START}
            labels={labels}
          />
          <ColorPickerPopover
            variant="swatch"
            aria-label={`${t[theme]}, ${t.brand}`}
            defaultValue={START}
            labels={labels}
          />
          <ColorPickerPopover
            aria-label={`${t[theme]}, ${t.brand}, 50%`}
            defaultValue="#7c6ab880"
            labels={labels}
          />
        </div>
      ))}
    </div>
  );
}

/** Color Picker is an Owsem component: its own entry, and its own registry item. */
const imp = (setup: TokenSetup, ...names: string[]) => [
  ...(names.includes("useState") ? ['import { useState } from "react";'] : []),
  `import { ${names.filter((n) => n !== "useState").join(", ")} } from "${
    isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/color-picker"
  }";`,
];

const swatchLines = (lang: Lang) => [
  "  swatches={[",
  ...TEXT[lang].swatches.map(([color, label]) => `    { color: "${color}", label: "${label}" },`),
  "  ]}",
];

const CLIENT = ['"use client";', ""];

/** A file with a client directive and its imports. */
const clientFile = (name: string, imports: string[], body: string[], hooks: string[] = []) => {
  const file = exampleFile(name, imports, body, hooks);
  return { ...file, code: [...CLIENT, file.code].join("\n") };
};

export const colorPickerDefinition = defineComponent({
  item: "color-picker",
  imports: ["ColorPicker", "ColorPickerPopover"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Panel lengkap: area, slider rona dan opasitas, kolom, dan swatch bernama.",
        en: "The full panel: an area, hue and opacity sliders, fields, and named swatches.",
      },
      uses: ["ColorPicker"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        clientFile("BrandColor", imp(setup, "ColorPicker"), [
          "<ColorPicker",
          `  defaultValue="${START}"`,
          ...swatchLines(lang),
          "/>",
        ]),
      ],
    },
    {
      id: "callbacks",
      title: { id: "Callback", en: "Callbacks" },
      description: {
        id: "onChange mengikuti setiap gerakan; onChangeComplete datang sekali, saat selesai.",
        en: "onChange follows every move; onChangeComplete arrives once, when the change is done.",
      },
      uses: ["ColorPicker"],
      demo: (lang) => <Callbacks lang={lang} />,
      code: (setup) => [
        clientFile(
          "LiveColor",
          imp(setup, "ColorPicker", "useState"),
          [
            "<ColorPicker",
            `  defaultValue="${START}"`,
            "  onChange={setLive}",
            "  onChangeComplete={setDone}",
            "/>",
            "<dl>",
            "  <dt>onChange</dt>",
            "  <dd>{live}</dd>",
            "  <dt>onChangeComplete</dt>",
            "  <dd>{done}</dd>",
            "</dl>",
          ],
          [
            `  const [live, setLive] = useState("${START}");`,
            `  const [done, setDone] = useState("${START}");`,
          ],
        ),
      ],
    },
    {
      id: "formats",
      title: { id: "Format", en: "Format" },
      description: {
        id: "format memilih kolom yang tampil pertama dan string yang dikirim callback; alpha={false} menjaga warna tetap buram.",
        en: "format sets the fields shown first and the string the callbacks get; alpha={false} keeps the color opaque.",
      },
      uses: ["ColorPicker"],
      demo: (lang) => <Formats lang={lang} />,
      code: (setup, lang) => [
        clientFile("OpaqueColor", imp(setup, "ColorPicker"), [
          "<ColorPicker",
          `  defaultValue="${START}"`,
          '  format="hsl"',
          "  alpha={false}",
          ...swatchLines(lang),
          "/>",
        ]),
      ],
    },
    {
      id: "popover",
      title: { id: "Popover", en: "Popover" },
      description: {
        id: "ColorPickerPopover membuka panel dari trigger: sebagai kolom berisi warna dan nilainya, atau persegi warna.",
        en: "ColorPickerPopover opens the panel from a trigger: a field with the color and its value, or a square of the color.",
      },
      uses: ["ColorPickerPopover"],
      demo: (lang) => <Popover lang={lang} />,
      code: (setup, lang) => [
        clientFile("BrandTriggers", imp(setup, "ColorPickerPopover"), [
          "<ColorPickerPopover",
          `  aria-label="${TEXT[lang].brand}"`,
          `  defaultValue="${START}"`,
          "/>",
          "<ColorPickerPopover",
          '  variant="swatch"',
          `  aria-label="${TEXT[lang].brand}"`,
          `  defaultValue="${START}"`,
          "/>",
        ]),
      ],
    },
    {
      id: "themes",
      title: { id: "Tema", en: "Themes" },
      description: {
        id: "Trigger di latar tiap tema; popup membawa tema dan arah trigger-nya, meski dirender di body.",
        en: "Triggers on each theme's background; the popup carries its trigger's theme and direction, though it renders in the body.",
      },
      uses: ["ColorPickerPopover"],
      demo: (lang) => <Themes lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          clientFile(
            "ThemedTriggers",
            imp(setup, "ColorPickerPopover"),
            THEMES.flatMap((theme) => [
              `<div data-theme="${theme}">`,
              `  <ColorPickerPopover aria-label="${t[theme]}, ${t.brand}" defaultValue="${START}" />`,
              `  <ColorPickerPopover variant="swatch" aria-label="${t[theme]}, ${t.brand}" defaultValue="${START}" />`,
              `  <ColorPickerPopover aria-label="${t[theme]}, ${t.brand}, 50%" defaultValue="#7c6ab880" />`,
              "</div>",
            ]),
          ),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <ColorPicker defaultValue={START} swatches={swatches(lang)} labels={labelsOf(lang)} />
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-color-picker",
      note: {
        id: "Panel berisi --ow-panel dengan bayangan permukaan, tanpa tepi. Token tema yang dipasang di sini hanya berlaku untuknya.",
        en: "The panel: the --ow-panel fill with the surface shadow and no edge. Theme tokens set here apply to it alone.",
      },
      tokens: {
        "--ow-panel": "--_bg",
        "--ow-line": "--_checker",
        "--ow-fg": "--_fg",
        "--ow-radius": "--_radius",
        "--ow-surface-shadow": "--_panel-shadow",
      },
    },
    {
      name: "Area",
      selector: ".ow-color-picker__area",
      note: {
        id: "Saturasi ke kanan, kecerahan ke atas. Slider 2D dengan keyboard dan ARIA sendiri, dengan thumb berupa cincin warna bergaris gelap 1px yang memadat saat ditekan.",
        en: "Saturation to the right, brightness up. A 2D slider with its own keyboard and ARIA; its thumb is a ring with a 1px dark line that compacts when pressed.",
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
      selector: ".ow-color-picker__tool",
      note: {
        id: "Mengambil warna dari layar, dengan tint tuts yang sama dengan Format; hanya muncul di browser yang punya EyeDropper API.",
        en: "Picks a color off the screen, with the same key tint as Format; shown only where the browser has the EyeDropper API.",
      },
      tokens: { "--ow-fg": "--_key" },
    },
    {
      name: "Preview",
      selector: ".ow-color-picker__preview",
      note: {
        id: "Warna saat ini di atas papan catur, setinggi kedua track.",
        en: "The current color over the checkerboard, as tall as both tracks.",
      },
    },
    {
      name: "Format",
      selector: ".ow-color-picker__format",
      note: {
        id: "Berganti antara kolom HEX, RGB, dan HSL. Tint 9% dari warna teks, naik saat hover dan ditekan.",
        en: "Switches between the HEX, RGB, and HSL fields. A 9% tint of the text color, stepping up on hover and press.",
      },
      tokens: { "--ow-fg": "--_key" },
    },
    {
      name: "Field",
      selector: ".ow-color-picker__field",
      note: {
        id: "Kolom dengan isian 6% dari warna teks tanpa tepi, 9% saat hover. Angka berlaku saat diketik; hex saat Enter atau blur.",
        en: "A field with a 6% tint of the text color and no edge, 9% on hover. Numbers apply as you type; hex on Enter or blur.",
      },
      tokens: { "--ow-fg": "--_field" },
    },
    {
      name: "Swatches",
      selector: ".ow-color-picker__swatches",
      note: {
        id: "Toggle Group dari Base UI di bawah satu garis tipis; yang cocok diberi centang.",
        en: "A Base UI Toggle Group under a hairline; the match carries a check.",
      },
    },
  ],
});

export default function ColorPickerPage(props: ExamplePageProps) {
  return <ComponentPage definition={colorPickerDefinition} {...props} />;
}
