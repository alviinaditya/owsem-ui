"use client";

import { Radio, RadioGroup, type RadioGroupSize } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const OPTIONS = ["standard", "express", "pickup"] as const;
type Option = (typeof OPTIONS)[number];

const TEXT = {
  id: {
    delivery: "Pengiriman",
    standard: "Reguler",
    express: "Kilat",
    pickup: "Ambil di toko",
    arrives: {
      standard: "Tiba dalam 3 sampai 5 hari.",
      express: "Tiba besok pagi.",
      pickup: "Siap diambil hari ini.",
    },
  },
  en: {
    delivery: "Delivery",
    standard: "Standard",
    express: "Express",
    pickup: "Pick up in store",
    arrives: {
      standard: "Arrives in 3 to 5 days.",
      express: "Arrives tomorrow morning.",
      pickup: "Ready to collect today.",
    },
  },
} satisfies Record<Lang, unknown>;

const THEME_NAMES = {
  id: { light: "Terang", dark: "Gelap" },
  en: { light: "Light", dark: "Dark" },
} satisfies Record<Lang, Record<string, string>>;

const initial = {
  size: "md",
  layout: "column",
  mark: "dot",
  accent: "",
  well: "",
};
type Cfg = typeof initial;

/** The options as rows: the shortest radio, or one with a glyph of your own. */
function Rows({
  lang,
  mark,
  options = OPTIONS,
}: {
  lang: Lang;
  mark?: string;
  options?: readonly Option[];
}) {
  return options.map((value) => (
    <label key={value} data-value={value}>
      <Radio.Root value={value}>
        {mark === "check" ? (
          <Radio.Indicator>
            <Icon name="check" />
          </Radio.Indicator>
        ) : undefined}
      </Radio.Root>
      {TEXT[lang][value]}
    </label>
  ));
}

function Delivery({ cfg, lang, style }: { cfg: Cfg; lang: Lang; style?: CSSProperties }) {
  const t = TEXT[lang];
  const [value, setValue] = useState<Option>("standard");
  return (
    <div className="demo-card demo-radio-group" style={style}>
      <p className="demo-title">{t.delivery}</p>
      <RadioGroup
        aria-label={t.delivery}
        size={cfg.size as RadioGroupSize}
        className={cfg.layout === "row" ? "demo-radio-group-across" : undefined}
        value={value}
        onValueChange={setValue}
      >
        <Rows lang={lang} mark={cfg.mark} />
      </RadioGroup>
      <p className="demo-muted">{t.arrives[value]}</p>
    </div>
  );
}

const THEMES = ["light", "dark"] as const;
const SIZES: readonly RadioGroupSize[] = ["sm", "md", "lg"];

/** One cell of the states matrix: two rows, one on, in one theme. */
function Cell({
  theme,
  row,
  lang,
}: {
  theme: (typeof THEMES)[number];
  row: RadioGroupSize | "disabled" | "read-only";
  lang: Lang;
}) {
  const options: readonly Option[] = ["standard", "express"];
  return (
    <div data-theme={theme} className="demo-radio-group-surface" data-cell={`${theme}-${row}`}>
      <RadioGroup
        aria-label={`${TEXT[lang].delivery}, ${row}`}
        size={row === "disabled" || row === "read-only" ? "md" : row}
        disabled={row === "disabled"}
        readOnly={row === "read-only"}
        defaultValue="standard"
      >
        <Rows lang={lang} options={options} />
      </RadioGroup>
    </div>
  );
}

/** Sizes, disabled, and read-only, in both themes. */
function States({ lang }: { lang: Lang }) {
  const rows = [...SIZES, "disabled", "read-only"] as const;
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

// The pointer picks each option in turn, and ends on the first.
const choosing: SceneScript = async (stage) => {
  for (const option of ["express", "pickup", "standard"]) {
    await stage.click(stage.get(`[data-value="${option}"]`));
    await stage.wait(1100);
  }
};

// The pointer walks the rows and Glide follows; only a press picks one.
const rows: SceneScript = async (stage) => {
  for (const option of ["express", "pickup", "express"]) {
    await stage.point(stage.get(`[data-value="${option}"]`));
    await stage.wait(600);
  }
  await stage.click(stage.get('[data-value="express"]'));
  await stage.wait(900);
  await stage.click(stage.get('[data-value="standard"]'));
  await stage.wait(900);
};

// The same rows side by side, from one rule on className: Glide measures on both axes.
const layout: SceneScript = async (stage) => {
  for (const option of ["pickup", "express", "standard"]) {
    await stage.point(stage.get(`[data-value="${option}"]`));
    await stage.wait(600);
  }
  await stage.click(stage.get('[data-value="express"]'));
  await stage.wait(900);
  await stage.click(stage.get('[data-value="standard"]'));
  await stage.wait(900);
};

// Each theme's medium group picks its second option, then its first again.
const states: SceneScript = async (stage) => {
  for (const option of ["express", "standard"]) {
    for (const theme of THEMES) {
      await stage.click(stage.get(`[data-cell="${theme}-md"] [data-value="${option}"]`));
      await stage.wait(900);
    }
  }
};

const radioGroupLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "layout",
      type: "choice",
      label: { id: "Tata letak", en: "Layout" },
      options: [
        { value: "column", label: { id: "Kolom", en: "Column" } },
        { value: "row", label: { id: "Baris", en: "Row" } },
      ],
    },
    {
      key: "mark",
      type: "choice",
      label: { id: "Tanda", en: "Mark" },
      options: [
        { value: "dot", label: { id: "Titik", en: "Dot" } },
        { value: "check", label: { id: "Centang", en: "Check" } },
      ],
    },
    {
      key: "accent",
      type: "color",
      label: { id: "Warna aktif", en: "Accent" },
      token: "--ow-accent",
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
      name: "Group",
      selector: ".ow-radio-group",
      note: {
        id: "Wadah dengan role radiogroup. Memuat baris dan highlight hover (Glide). Tanpa lebar dan margin.",
        en: "The container, with the radiogroup role. Holds the rows and Glide's hover highlight. No width, no margin.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Row",
      selector: ".ow-radio-group label",
      note: {
        id: "<label> milikmu yang memuat radio. Tingginya mengikuti aturan --py, dan Glide menyalakannya.",
        en: "Your <label> holding a radio. Its height follows the --py rule, and Glide lights it.",
      },
    },
    {
      name: "Radio",
      selector: ".ow-radio-group__radio",
      note: {
        id: "Lingkaran seukuran font + 2 px, dengan target tekan 24 px. Tanpa children, ia menggambar Indicator.",
        en: "The circle, the font size plus 2 px, with a 24 px press target. Without children it draws its Indicator.",
      },
      tokens: {
        "--ow-well-bg": "--_well",
        "--ow-edge": "--_edge",
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-pressed-bg": "--_pressed",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-radio-group__indicator",
      note: {
        id: "Titik yang membesar dengan spring settle. Hanya terpasang saat radio aktif; children menggantikan titiknya.",
        en: "The dot, scaling in on the settle spring. Mounted only while checked; children replace the dot.",
      },
      tokens: {
        "--ow-on-accent": "--_dot",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      "--ow-accent": cfg.accent || undefined,
      "--ow-well-bg": cfg.well || undefined,
    } as CSSProperties;
    return <Delivery cfg={cfg} lang={lang} style={style} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/radio-group";
    const across = cfg.layout === "row";
    const check = cfg.mark === "check";
    const scoped = across || cfg.accent || cfg.well;
    const rootProps = [
      'aria-label="Delivery"',
      'defaultValue="standard"',
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(scoped ? ['className="delivery"'] : []),
    ];
    const label = (value: string) => value[0]?.toUpperCase() + value.slice(1);
    const rowLines = OPTIONS.flatMap((value) => [
      "<label>",
      ...(check
        ? [
            `  <Radio.Root value="${value}">`,
            "    <Radio.Indicator>",
            "      <Check />",
            "    </Radio.Indicator>",
            "  </Radio.Root>",
          ]
        : [`  <Radio.Root value="${value}" />`]),
      `  ${label(value)}`,
      "</label>",
    ]);
    const usage = [
      ...(check ? ['import { Check } from "lucide-react";'] : []),
      `import { Radio, RadioGroup } from "${from}";`,
      "",
      "export function Delivery() {",
      "  return (",
      `    <RadioGroup ${rootProps.join(" ")}>`,
      ...rowLines.map((line) => `      ${line}`),
      "    </RadioGroup>",
      "  );",
      "}",
    ];
    const files = [{ name: "delivery.tsx", code: usage.join("\n") }];
    if (scoped) {
      const token = `--${setup.prefix}`;
      // Isolated values sit on each group's root, so set them there too.
      const isolated = setup.mode === "isolated" && (cfg.accent || cfg.well);
      const lines = [
        isolated ? ".delivery.ow-radio-group {" : ".delivery {",
        ...(across ? ["  flex-flow: row wrap;"] : []),
        ...(cfg.accent ? [`  ${token}-accent: ${cfg.accent};`] : []),
        ...(cfg.well ? [`  ${token}-well-bg: ${cfg.well};`] : []),
        "}",
      ];
      files.push({ name: "delivery.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    choosing: { cfg: { layout: "column" }, play: choosing },
    rows: { cfg: { layout: "column" }, play: rows },
    layout: { cfg: { layout: "row" }, play: layout },
    anatomy: { inspect: true },
    states: {
      demo: (_cfg, lang) => <States lang={lang} />,
      play: states,
    },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function RadioGroupLab(props: LabProps) {
  return <LabShell lab={radioGroupLab} {...props} />;
}
