"use client";

import { Switch, type SwitchSize } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Notifikasi",
    email: "Email",
    push: "Push",
    digest: "Ringkasan mingguan",
    on: (count: number) => `${count} dari 3 menyala`,
    hold: "Tekan dan tahan",
    power: "Mode gelap",
    off: "Mati",
    lit: "Menyala",
    light: "Terang",
    dark: "Gelap",
    held: "Ditahan",
    disabledOff: "Disabled, mati",
    disabledOn: "Disabled, menyala",
    readOnly: "Read-only",
  },
  en: {
    title: "Notifications",
    email: "Email",
    push: "Push",
    digest: "Weekly digest",
    on: (count: number) => `${count} of 3 on`,
    hold: "Press and hold",
    power: "Dark mode",
    off: "Off",
    lit: "On",
    light: "Light",
    dark: "Dark",
    held: "Held",
    disabledOff: "Disabled, off",
    disabledOn: "Disabled, on",
    readOnly: "Read-only",
  },
} satisfies Record<Lang, unknown>;

const ROWS = ["email", "push", "digest"] as const;
type Row = (typeof ROWS)[number];
type Theme = "light" | "dark";

const SIZES: readonly SwitchSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { size: "md", thumb: "plain", width: "fit", accent: "", key: "", well: "" };
type Cfg = typeof initial;

/** A switch whose thumb holds a sun or a moon, following its own state. */
function IconSwitch({ defaultChecked = false, ...props }: Switch.Root.Props) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <Switch.Root {...props} checked={on} onCheckedChange={setOn}>
      <Switch.Thumb>
        <Icon name={on ? "moon" : "sun"} />
      </Switch.Thumb>
    </Switch.Root>
  );
}

/** A settings card: each row is a label around its switch, and the line below counts them. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const [on, setOn] = useState<Record<Row, boolean>>({ email: true, push: false, digest: false });
  const style = {
    "--ow-accent": cfg.accent || undefined,
    "--ow-raised-bg": cfg.key || undefined,
    "--ow-well-bg": cfg.well || undefined,
  } as CSSProperties;
  const props = {
    size: cfg.size as SwitchSize,
    className: cfg.width === "wide" ? "demo-switch-wide" : undefined,
    style,
  };
  return (
    <div className="demo-card">
      <p className="demo-title">{t.title}</p>
      {ROWS.map((row) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: Switch.Root renders the input
        <label key={row} className="demo-switch-row">
          {t[row]}
          <Switch.Root
            {...props}
            data-demo={row}
            checked={on[row]}
            onCheckedChange={(next) => setOn((current) => ({ ...current, [row]: next }))}
          >
            {cfg.thumb === "icon" ? (
              <Switch.Thumb>
                <Icon name={on[row] ? "moon" : "sun"} />
              </Switch.Thumb>
            ) : undefined}
          </Switch.Root>
        </label>
      ))}
      <p className="demo-muted">{t.on(Object.values(on).filter(Boolean).length)}</p>
    </div>
  );
}

/** One large switch, from font-size alone: a press is easy to see at this size. */
function Press({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-surface demo-switch-press">
      <Switch.Root aria-label={t.hold} data-demo="press" style={{ fontSize: 44 }} />
      <p className="demo-caption">{t.hold}</p>
    </div>
  );
}

/** A switch with its used size under it, read from the layout (the stage may scale the demo). */
function Measured({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState("");
  useLayoutEffect(() => {
    const track = ref.current?.querySelector<HTMLElement>(".ow-switch");
    if (!track) return;
    const px = (value: string) => String(Math.round(Number.parseFloat(value) * 100) / 100);
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(track);
      setSize(`${px(style.width)} × ${px(style.height)}`);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={ref} className="demo-measured">
      {children}
      <span className="demo-caption">{size}</span>
    </span>
  );
}

/** Each size, then a font-size and a width from outside: the thumb follows the track in all. */
function Fit({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const rows: { label: string; props: Switch.Root.Props }[] = [
    ...SIZES.map((size) => ({ label: size, props: { size } })),
    { label: "font-size: 22px", props: { style: { fontSize: 22 } } },
    { label: "inline-size: 3.5em", props: { className: "demo-switch-wide" } },
  ];
  return (
    <div className="demo-surface">
      <Matrix
        columns={[t.off, t.lit]}
        rows={rows.map(({ label, props }) => ({
          label,
          cells: [false, true].map((on) => (
            <Measured key={String(on)}>
              <Switch.Root
                {...props}
                aria-label={`${label}, ${on ? t.lit : t.off}`}
                defaultChecked={on}
              />
            </Measured>
          )),
        }))}
      />
    </div>
  );
}

const STATES = [
  { key: "off", props: {} },
  { key: "lit", props: { defaultChecked: true } },
  { key: "disabledOff", props: { disabled: true } },
  { key: "disabledOn", props: { disabled: true, defaultChecked: true } },
  { key: "readOnly", props: { readOnly: true, defaultChecked: true } },
] as const;

/** A frozen frame of a press: :active is the browser's own, so a still can't use it. */
const HELD = { "--_switch-held": 1 } as CSSProperties;

/** Off, on, held, disabled, and read-only, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={[
        ...STATES.map(({ key, props }) => ({
          label: t[key],
          cells: THEMES.map((theme) => (
            <div key={theme} data-theme={theme} data-cell={`${theme}-${key}`} className="demo-cell">
              <Switch.Root {...props} aria-label={t[key]} />
              <IconSwitch {...props} aria-label={t.power} />
            </div>
          )),
        })),
        {
          label: t.held,
          cells: THEMES.map((theme) => (
            <div key={theme} data-theme={theme} className="demo-cell">
              <Switch.Root aria-label={t.held}>
                <Switch.Thumb style={HELD} />
              </Switch.Root>
              <Switch.Root aria-label={t.held} defaultChecked>
                <Switch.Thumb style={HELD} />
              </Switch.Root>
            </div>
          )),
        },
      ]}
    />
  );
}

// Push on, the digest on, then both off again: the line below counts them.
const travel: SceneScript = async (stage) => {
  for (const row of ["push", "digest", "digest", "push"]) {
    await stage.click(stage.get(`[data-demo="${row}"]`));
    await stage.wait(1000);
  }
};

// A script's press can't set :active, so it holds the thumb in through the same property.
const press: SceneScript = async (stage) => {
  const track = stage.get('[data-demo="press"]');
  const thumb = track.querySelector<HTMLElement>(".ow-switch__thumb");
  if (!thumb) return;
  for (let turn = 0; turn < 2; turn++) {
    await stage.point(track);
    thumb.style.setProperty("--_switch-held", "1");
    try {
      await stage.wait(700);
      await stage.click(track);
    } finally {
      thumb.style.removeProperty("--_switch-held");
    }
    await stage.wait(1200);
  }
};

// Each theme's off switch, on and off again.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const track = stage.get(`[data-cell="${theme}-off"] .ow-switch`);
    await stage.click(track);
    await stage.wait(1000);
    await stage.click(track);
    await stage.wait(700);
  }
};

const switchLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "thumb",
      type: "choice",
      label: { id: "Thumb", en: "Thumb" },
      options: [
        { value: "plain", label: { id: "Polos", en: "Plain" } },
        { value: "icon", label: { id: "Ikon", en: "Icon" } },
      ],
    },
    {
      key: "width",
      type: "choice",
      label: { id: "Lebar (className)", en: "Width (className)" },
      options: [
        { value: "fit", label: { id: "Bawaan", en: "Default" } },
        { value: "wide", label: { id: "Lebar", en: "Wide" } },
      ],
    },
    {
      key: "accent",
      type: "color",
      label: { id: "Isi menyala", en: "On fill" },
      token: "--ow-accent",
    },
    {
      key: "key",
      type: "color",
      label: { id: "Thumb", en: "Thumb color" },
      token: "--ow-raised-bg",
    },
    {
      key: "well",
      type: "color",
      label: { id: "Track mati", en: "Off track" },
      token: "--ow-well-bg",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: '[data-demo="email"]',
      note: {
        id: "Track dengan role switch dan aria-checked. Input tersembunyi di sebelahnya yang masuk ke form.",
        en: "The track, with the switch role and aria-checked. A hidden input beside it goes to the form.",
      },
      tokens: {
        "--ow-well-bg": "--_well",
        "--ow-edge": "--_edge",
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Thumb",
      selector: '[data-demo="email"] .ow-switch__thumb',
      note: {
        id: "Tombol timbul yang bergerak. Tergambar sendiri bila Root tanpa children, dan bisa memuat ikon.",
        en: "The raised key that moves. Root draws it without children, and it can hold an icon.",
      },
      tokens: {
        "--ow-raised-bg": "--_key",
        "--ow-raised-shadow": "--_key-shadow",
        "--ow-fg": "--_ink",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/switch";
    const icon = cfg.thumb === "icon";
    const tokens = cfg.accent || cfg.key || cfg.well;
    const wide = cfg.width === "wide";
    const classes = [...(wide ? ["wide"] : []), ...(tokens ? ["alerts"] : [])].join(" ");
    const props = [
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(classes ? [`className="${classes}"`] : []),
      ...(icon ? ["checked={on}", "onCheckedChange={setOn}"] : ["defaultChecked"]),
    ].join(" ");
    const usage = [
      ...(icon
        ? ['import { useState } from "react";', 'import { Moon, Sun } from "lucide-react";']
        : []),
      `import { Switch } from "${from}";`,
      "",
      "export function SettingsRow() {",
      ...(icon ? ["  const [on, setOn] = useState(true);"] : []),
      "  return (",
      "    <label>",
      ...(icon
        ? [
            `      <Switch.Root ${props}>`,
            "        <Switch.Thumb>{on ? <Moon /> : <Sun />}</Switch.Thumb>",
            "      </Switch.Root>",
          ]
        : [`      <Switch.Root ${props} />`]),
      `      ${icon ? "Dark mode" : "Email alerts"}`,
      "    </label>",
      "  );",
      "}",
    ];
    const files = [{ name: "settings-row.tsx", code: usage.join("\n") }];
    if (tokens || wide) {
      const token = `--${setup.prefix}`;
      const lines = [
        ...(wide
          ? [
              "/* Plain CSS wins; the thumb's travel comes from this width. */",
              ".wide {",
              "  inline-size: 3.5em;",
              "}",
            ]
          : []),
        ...(tokens && wide ? [""] : []),
        ...(tokens
          ? [
              ".alerts {",
              ...(cfg.accent ? [`  ${token}-accent: ${cfg.accent};`] : []),
              ...(cfg.key ? [`  ${token}-raised-bg: ${cfg.key};`] : []),
              ...(cfg.well ? [`  ${token}-well-bg: ${cfg.well};`] : []),
              "}",
            ]
          : []),
      ];
      files.push({ name: "settings-row.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    travel: { play: travel },
    press: { demo: (_cfg, lang) => <Press lang={lang} />, play: press },
    fit: { demo: (_cfg, lang) => <Fit lang={lang} /> },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function SwitchLab(props: LabProps) {
  return <LabShell lab={switchLab} {...props} />;
}
