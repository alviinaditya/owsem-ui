"use client";

import { Button, type ButtonSize, type ButtonVariant, IconButton } from "owsem-ui/base";
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    sync: "Sinkronkan",
    publish: "Terbitkan",
    add: "Tambah",
    save: "Simpan",
    light: "Terang",
    dark: "Gelap",
  },
  en: {
    sync: "Sync",
    publish: "Publish",
    add: "Add",
    save: "Save",
    light: "Light",
    dark: "Dark",
  },
} satisfies Record<Lang, Record<string, string>>;

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
];
// `soft` applies to these.
const TONED: readonly ButtonVariant[] = ["primary", "secondary", "destructive"];
const name = (variant: string) => variant[0]?.toUpperCase() + variant.slice(1);

const initial = {
  size: "md",
  icon: "start",
  soft: "",
  loading: "",
  accent: "",
  radius: "",
};
type Cfg = typeof initial;

/** One button per variant, as the controls set them up. */
function Board({ cfg, style }: { cfg: Cfg; style?: CSSProperties }) {
  const size = cfg.size as ButtonSize;
  return (
    <div className="demo-board" style={style}>
      {VARIANTS.map((variant) => {
        const shared = {
          variant,
          size,
          soft: Boolean(cfg.soft) && TONED.includes(variant),
          // Always set, so the spinner is mounted for Inspect and can fade in.
          loading: Boolean(cfg.loading),
          "data-demo": variant,
        };
        return cfg.icon === "only" ? (
          <IconButton
            key={variant}
            {...shared}
            icon={<Icon name="plus" />}
            aria-label={name(variant)}
          />
        ) : (
          <Button
            key={variant}
            {...shared}
            startIcon={cfg.icon === "start" ? <Icon name="plus" /> : undefined}
            endIcon={cfg.icon === "end" ? <Icon name="arrow-right" /> : undefined}
          >
            {name(variant)}
          </Button>
        );
      })}
    </div>
  );
}

const tokens = (cfg: Cfg) =>
  ({
    "--ow-accent": cfg.accent || undefined,
    "--ow-radius": cfg.radius || undefined,
  }) as CSSProperties;

/** A button that loads for a moment when pressed, and shows that its width holds. */
function Loader({
  label,
  icon,
  variant,
}: {
  label: string;
  icon?: IconName;
  variant: ButtonVariant;
}) {
  const ref = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);
  // Measured live in layout px, so a scaled stage does not change the number.
  useLayoutEffect(() => {
    const button = ref.current;
    if (!button) return;
    const observer = new ResizeObserver(() => setWidth(button.offsetWidth));
    observer.observe(button);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, [loading]);
  return (
    <figure className="demo-button-measure">
      <Button
        ref={ref}
        variant={variant}
        size="lg"
        loading={loading}
        startIcon={icon ? <Icon name={icon} /> : undefined}
        onClick={() => setLoading(true)}
      >
        {label}
      </Button>
      <span className="demo-button-measure-rule" aria-hidden="true" />
      <figcaption>{width ? `${width}px` : ""}</figcaption>
    </figure>
  );
}

interface Guide {
  x: number;
  y: number;
  length: number;
  axis: "x" | "y";
  /** The length in px, on the large example only. */
  label?: string;
}

/**
 * Draws the distance from each button's icon to its edges: the same on every side that has one
 * (FR-10). Measured in layout px, since the stage may be scaled.
 */
function Geometry({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const ref = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const measure = () => {
      const box = host.getBoundingClientRect();
      const k = box.width ? host.offsetWidth / box.width : 1;
      const x = (v: number) => (v - box.left) * k;
      const y = (v: number) => (v - box.top) * k;
      const next: Guide[] = [];
      for (const button of host.querySelectorAll<HTMLElement>(".ow-button")) {
        const icon = button.querySelector(".ow-button__icon");
        if (!icon) continue;
        const b = button.getBoundingClientRect();
        const i = icon.getBoundingClientRect();
        const cx = x((i.left + i.right) / 2);
        const cy = y((i.top + i.bottom) / 2);
        const sides: Guide[] = [
          { axis: "y", x: cx, y: y(b.top), length: (i.top - b.top) * k },
          { axis: "y", x: cx, y: y(i.bottom), length: (b.bottom - i.bottom) * k },
          { axis: "x", x: x(b.left), y: cy, length: (i.left - b.left) * k },
        ];
        if (!button.querySelector(".ow-button__label")) {
          sides.push({ axis: "x", x: x(i.right), y: cy, length: (b.right - i.right) * k });
        }
        for (const side of sides) {
          if (button.dataset.big !== undefined) side.label = `${Math.round(side.length)}`;
          next.push(side);
        }
      }
      setGuides(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  // The large pair is lg at 32px: the rule holds at any size.
  const big = {
    variant: "secondary",
    size: "lg",
    style: { fontSize: 32 },
    "data-big": "",
  } as const;
  return (
    <div ref={ref} className="demo-geometry">
      <div className="demo-buttons">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Button key={size} variant="secondary" size={size} startIcon={<Icon name="plus" />}>
            {t.add}
          </Button>
        ))}
        <IconButton variant="secondary" size="lg" icon={<Icon name="plus" />} aria-label={t.add} />
      </div>
      <div className="demo-buttons">
        <Button {...big} startIcon={<Icon name="plus" />}>
          {t.add}
        </Button>
        <IconButton {...big} icon={<Icon name="plus" />} aria-label={t.add} />
      </div>
      {guides.map((g, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: guides are positional
          key={i}
          className="demo-guide"
          data-axis={g.axis}
          style={
            {
              "--x": `${g.x}px`,
              "--y": `${g.y}px`,
              "--length": `${g.length}px`,
            } as CSSProperties
          }
        >
          {g.label ? <span className="demo-guide-label">{g.label}</span> : null}
        </span>
      ))}
    </div>
  );
}

/** One button with every part, for Inspect. */
function Anatomy({ lang }: { lang: Lang }) {
  return (
    <Button
      variant="secondary"
      size="lg"
      loading={false}
      startIcon={<Icon name="plus" />}
      endIcon={<Icon name="arrow-right" />}
    >
      {TEXT[lang].add}
    </Button>
  );
}

const THEMES = ["light", "dark"] as const;

/**
 * Each variant in each theme: the three sizes, then disabled and loading. Soft follows the
 * controls.
 */
function States({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={VARIANTS.map((variant) => {
        const soft = Boolean(cfg.soft) && TONED.includes(variant);
        return {
          label: soft ? `${variant} soft` : variant,
          cells: THEMES.map((theme) => (
            <div key={theme} data-theme={theme} className="demo-buttons demo-button-surface">
              {(["sm", "md", "lg"] as const).map((size) => (
                <Button key={size} variant={variant} soft={soft} size={size}>
                  {t.save}
                </Button>
              ))}
              <Button variant={variant} soft={soft} size="sm" disabled>
                {t.save}
              </Button>
              <Button variant={variant} soft={soft} size="sm" loading>
                {t.save}
              </Button>
            </div>
          )),
        };
      })}
    />
  );
}

// Presses four variants in turn: each scales in, ripples from the pointer, and springs back.
const press: SceneScript = async (stage) => {
  for (const variant of ["primary", "secondary", "outline", "ghost"]) {
    await stage.click(stage.get(`[data-demo="${variant}"]`));
    await stage.wait(900);
  }
};

// Loads each button: the spinner takes the icon's place, or the middle; the width holds.
const loading: SceneScript = async (stage) => {
  for (const button of stage.get(".demo-loaders").querySelectorAll(".ow-button")) {
    await stage.click(button);
    await stage.wait(2300);
  }
};

const buttonLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: [
        { value: "sm", label: { id: "sm", en: "sm" } },
        { value: "md", label: { id: "md", en: "md" } },
        { value: "lg", label: { id: "lg", en: "lg" } },
      ],
    },
    {
      key: "icon",
      type: "choice",
      label: { id: "Ikon", en: "Icon" },
      options: [
        { value: "", label: { id: "Tanpa", en: "None" } },
        { value: "start", label: { id: "Awal", en: "Start" } },
        { value: "end", label: { id: "Akhir", en: "End" } },
        { value: "only", label: { id: "Saja", en: "Only" } },
      ],
    },
    {
      key: "soft",
      type: "choice",
      label: { id: "Soft", en: "Soft" },
      options: [
        { value: "", label: { id: "Mati", en: "Off" } },
        { value: "on", label: { id: "Nyala", en: "On" } },
      ],
    },
    {
      key: "loading",
      type: "choice",
      label: { id: "Loading", en: "Loading" },
      options: [
        { value: "", label: { id: "Mati", en: "Off" } },
        { value: "on", label: { id: "Nyala", en: "On" } },
      ],
    },
    {
      key: "radius",
      type: "choice",
      label: { id: "Radius", en: "Radius" },
      options: [
        { value: "", label: { id: "Tema", en: "Theme" } },
        { value: "4px", label: { id: "4px", en: "4px" } },
        { value: "14px", label: { id: "14px", en: "14px" } },
      ],
    },
    {
      key: "accent",
      type: "color",
      label: { id: "Accent", en: "Accent" },
      token: "--ow-accent",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-button",
      note: {
        id: "Button dari Base UI. Permukaannya (::before) digambar dari material: isi datar dengan tepi inset shadow yang tidak menambah ukuran.",
        en: "Base UI's button. Its face (::before) is drawn from the materials: a flat fill with inset-shadow edges that add no size.",
      },
      tokens: {
        "--ow-radius": "--_radius",
        "--ow-fg": "--_ink",
        "--ow-raised-bg": "--_raised-bg",
        "--ow-pressed-bg": "--_pressed-bg",
        "--ow-accent": "--_primary-bg",
        "--ow-on-accent": "--_on-primary",
        "--ow-critical": "--_critical",
        "--ow-bg": "--_on-critical",
        "--ow-edge": "--_edge",
        "--ow-hover": "--_hover",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Icon",
      selector: '.ow-button__icon[data-side="start"]',
      note: {
        id: "Ukuran font ditambah 2px, ditarik ke tepi sejauh jaraknya ke atas. Dekoratif.",
        en: "The font size plus 2px, pulled toward the edge as far as it sits from the top. Decorative.",
      },
    },
    {
      name: "Label",
      selector: ".ow-button__label",
      note: {
        id: "Teks tombol, satu baris. Saat loading tanpa ikon awal, ia memudar tapi tetap mengisi ruangnya.",
        en: "The button's text, on one line. Loading without a start icon fades it but keeps its box.",
      },
    },
    {
      name: "Spinner",
      selector: ".ow-button__spinner",
      note: {
        id: "Hanya ada pada tombol yang punya prop loading. Menempati sel ikon awal, atau di tengah.",
        en: "Only on buttons with a loading prop. It takes the start icon's cell, or the middle.",
      },
    },
    {
      name: "Ripple",
      selector: ".ow-button__layer",
      note: {
        id: "Lapisan yang memotong riak ke bentuk permukaan. Riaknya tumbuh dari titik tekan.",
        en: "The layer that clips the ripple to the face. The ripple grows from the press point.",
      },
    },
  ],

  demo(cfg) {
    return <Board cfg={cfg} style={tokens(cfg)} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/button";
    const only = cfg.icon === "only";
    const custom = cfg.accent || cfg.radius;
    const icons = [
      cfg.icon === "end" ? "ArrowRight" : "",
      cfg.icon && cfg.icon !== "end" ? "Plus" : "",
    ]
      .filter(Boolean)
      .join(", ");
    const props = (variant: ButtonVariant) =>
      [
        ` variant="${variant}"`,
        cfg.size === "md" ? "" : ` size="${cfg.size}"`,
        cfg.soft && TONED.includes(variant) ? " soft" : "",
        cfg.loading ? " loading" : "",
      ].join("");
    const buttons = VARIANTS.map((variant) =>
      only
        ? `      <IconButton${props(variant)} icon={<Plus />} aria-label="${name(variant)}" />`
        : [
            `      <Button${props(variant)}`,
            cfg.icon === "start" ? " startIcon={<Plus />}" : "",
            cfg.icon === "end" ? " endIcon={<ArrowRight />}" : "",
            `>${name(variant)}</Button>`,
          ].join(""),
    );
    const scope = custom ? ' className="actions"' : "";
    const usage = [
      `import { ${only ? "IconButton" : "Button"} } from "${from}";`,
      ...(icons ? [`import { ${icons} } from "lucide-react";`] : []),
      "",
      "export function Actions() {",
      "  return (",
      `    <div${scope}>`,
      ...buttons,
      "    </div>",
      "  );",
      "}",
    ];
    const files = [{ name: "actions.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      const lines = [
        "/* Every Button inside .actions */",
        // Isolated values sit on each button's root, so an inherited value would lose.
        setup.mode === "isolated" ? ".actions .ow-button {" : ".actions {",
        ...(cfg.accent ? [`  ${token}-accent: ${cfg.accent};`] : []),
        ...(cfg.radius ? [`  ${token}-radius: ${cfg.radius};`] : []),
        "}",
      ];
      files.push({ name: "actions.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    press: { cfg: { size: "lg" }, play: press },
    loading: {
      demo: (_cfg, lang) => (
        <div className="demo-buttons demo-loaders">
          <Loader label={TEXT[lang].sync} icon="rotate-ccw" variant="secondary" />
          <Loader label={TEXT[lang].publish} variant="primary" />
        </div>
      ),
      play: loading,
    },
    geometry: { demo: (_cfg, lang) => <Geometry lang={lang} /> },
    anatomy: { inspect: true, demo: (_cfg, lang) => <Anatomy lang={lang} /> },
    states: { demo: (cfg, lang) => <States cfg={cfg} lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function ButtonLab(props: LabProps) {
  return <LabShell lab={buttonLab} {...props} />;
}
