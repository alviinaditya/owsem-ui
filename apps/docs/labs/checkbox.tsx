"use client";

import { Checkbox, type CheckboxSize } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Sebelum rilis",
    all: "Semua tugas",
    tests: "Jalankan tes",
    changelog: "Tulis changelog",
    tag: "Beri tag rilis",
    updates: "Kabari saya soal rilis baru",
    terms: "Saya sudah membaca catatan rilis",
  },
  en: {
    title: "Before release",
    all: "All tasks",
    tests: "Run the tests",
    changelog: "Write the changelog",
    tag: "Tag the release",
    updates: "Tell me about new releases",
    terms: "I have read the release notes",
  },
} satisfies Record<Lang, Record<string, string>>;

const MATRIX = {
  id: {
    light: "Terang",
    dark: "Gelap",
    off: "Mati",
    checked: "Dicentang",
    indeterminate: "Indeterminate",
    disabledOff: "Disabled, mati",
    disabledOn: "Disabled, dicentang",
    readOnly: "Read-only",
    box: "Kotak",
    target: "Area tekan 24px",
    tokens: "Token tema",
    tokensOff: "Token tema, mati",
    className: "className",
    fontSize: "font-size",
    glyph: "Glyph sendiri",
  },
  en: {
    light: "Light",
    dark: "Dark",
    off: "Off",
    checked: "Checked",
    indeterminate: "Indeterminate",
    disabledOff: "Disabled, off",
    disabledOn: "Disabled, checked",
    readOnly: "Read-only",
    box: "Box",
    target: "24px target",
    tokens: "Theme tokens",
    tokensOff: "Theme tokens, off",
    className: "className",
    fontSize: "font-size",
    glyph: "Your own glyph",
  },
} satisfies Record<Lang, Record<string, string>>;

const TASKS = ["tests", "changelog", "tag"] as const;
type Task = (typeof TASKS)[number];
type Theme = "light" | "dark";

const SIZES: readonly CheckboxSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { size: "md", fill: "", glyph: "", edge: "" };
type Cfg = typeof initial;

/** The controls' colors, on each box, so they leave the card's own text alone. */
const tokens = (cfg: Cfg) =>
  ({
    "--ow-accent": cfg.fill || undefined,
    "--ow-on-accent": cfg.glyph || undefined,
    "--ow-edge": cfg.edge || undefined,
  }) as CSSProperties;

/** A parent box over its tasks: the parent shows a minus for some and a check for all. */
function Checklist({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const size = cfg.size as CheckboxSize;
  const style = tokens(cfg);
  const [done, setDone] = useState<Record<Task, boolean>>({
    tests: true,
    changelog: false,
    tag: false,
  });
  const count = TASKS.filter((task) => done[task]).length;
  return (
    <div className="demo-card demo-checkbox" data-size={size}>
      <p className="demo-title">{t.title}</p>
      <label className="demo-checkbox-label">
        <Checkbox.Root
          size={size}
          style={style}
          checked={count === TASKS.length}
          indeterminate={count > 0 && count < TASKS.length}
          onCheckedChange={(on) => setDone({ tests: on, changelog: on, tag: on })}
          data-demo="all"
        />
        {t.all}
      </label>
      <div className="demo-checkbox-tasks">
        {TASKS.map((task) => (
          <label key={task} className="demo-checkbox-label">
            <Checkbox.Root
              size={size}
              style={style}
              checked={done[task]}
              onCheckedChange={(on) => setDone((current) => ({ ...current, [task]: on }))}
              data-demo={task}
            />
            {t[task]}
          </label>
        ))}
      </div>
    </div>
  );
}

/** The shortest usage, twice: a label with no CSS of its own around a box. */
function PlainLabels({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const size = cfg.size as CheckboxSize;
  const style = tokens(cfg);
  return (
    <div className="demo-card">
      <label>
        <Checkbox.Root size={size} style={style} /> <span data-demo="updates">{t.updates}</span>
      </label>
      <label>
        <Checkbox.Root size={size} style={style} defaultChecked /> {t.terms}
      </label>
    </div>
  );
}

/** A box with its used size under it, read from the layout (the stage may scale the demo). */
function Measured({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState("");
  useLayoutEffect(() => {
    const box = ref.current?.querySelector<HTMLElement>(".ow-checkbox");
    if (!box) return;
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(box);
      setSize(`${Number.parseFloat(style.width)} × ${Number.parseFloat(style.height)}`);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={ref} className="demo-measured">
      {children}
      <span className="demo-caption">{size}</span>
    </span>
  );
}

/** Each size measured, and each with its press target drawn around it. */
function Sizes({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <div className="demo-surface">
      <Matrix
        columns={[t.box, t.target]}
        rows={SIZES.map((size) => ({
          label: size,
          cells: [
            <Measured key="box">
              <Checkbox.Root size={size} aria-label={t.tests} defaultChecked />
            </Measured>,
            <span key="target" className="demo-checkbox-target">
              <Checkbox.Root size={size} aria-label={t.changelog} />
            </span>,
          ],
        }))}
      />
    </div>
  );
}

const STATES = [
  { key: "off", props: {} },
  { key: "checked", props: { defaultChecked: true } },
  { key: "indeterminate", props: { indeterminate: true } },
  { key: "disabledOff", props: { disabled: true } },
  { key: "disabledOn", props: { disabled: true, defaultChecked: true } },
  { key: "readOnly", props: { readOnly: true, defaultChecked: true } },
] as const;

/** Every state, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={STATES.map(({ key, props }) => ({
        label: t[key],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className="demo-cell">
            <Checkbox.Root {...props} aria-label={t[key]} data-cell={`${theme}-${key}`} />
            <Checkbox.Root {...props} size="lg" aria-label={t[key]} />
          </div>
        )),
      }))}
    />
  );
}

/** The three ways in: theme tokens from the controls, a className, and your own glyph. */
function Custom({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = MATRIX[lang];
  const size = cfg.size as CheckboxSize;
  return (
    <div className="demo-card demo-checkbox" data-size={size}>
      <label className="demo-checkbox-label">
        <Checkbox.Root size={size} style={tokens(cfg)} defaultChecked />
        {t.tokens}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root size={size} style={tokens(cfg)} />
        {t.tokensOff}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root size={size} className="demo-checkbox-mine" defaultChecked />
        {t.className}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root style={{ fontSize: "1.5rem" }} defaultChecked />
        {t.fontSize}
      </label>
      <label className="demo-checkbox-label">
        <Checkbox.Root size={size} defaultChecked>
          <Checkbox.Indicator>
            <Icon name="x" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        {t.glyph}
      </label>
    </div>
  );
}

// Finishes the list and takes it back: the parent's minus crossfades to a check and back.
const marking: SceneScript = async (stage) => {
  for (const task of ["changelog", "tag", "tag", "changelog"]) {
    await stage.click(stage.get(`[data-demo="${task}"]`));
    await stage.wait(900);
  }
};

// Presses the label's text, never the box.
const labelling: SceneScript = async (stage) => {
  const text = stage.get('[data-demo="updates"]');
  for (let i = 0; i < 2; i++) {
    await stage.click(text);
    await stage.wait(1000);
  }
};

// Points at the off box in each theme, then checks and unchecks it.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const box = stage.get(`[data-cell="${theme}-off"]`);
    await stage.point(box);
    await stage.wait(500);
    await stage.click(box);
    await stage.wait(900);
    await stage.click(box);
    await stage.wait(500);
  }
};

const checkboxLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "fill",
      type: "color",
      label: { id: "Isian dicentang", en: "Checked fill" },
      token: "--ow-accent",
    },
    {
      key: "glyph",
      type: "color",
      label: { id: "Glyph", en: "Glyph" },
      token: "--ow-on-accent",
    },
    {
      key: "edge",
      type: "color",
      label: { id: "Tepi", en: "Edge" },
      token: "--ow-edge",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: '[data-demo="all"]',
      note: {
        id: "Kotaknya: span dari Base UI dengan role checkbox, dan input tersembunyi di sampingnya. Well saat mati, warna utama saat dicentang.",
        en: "The box: Base UI's span with the checkbox role, and a hidden input beside it. The well while off, the primary material while checked.",
      },
      tokens: {
        "--ow-well-bg": "--_well",
        "--ow-edge": "--_edge",
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-on-accent": "--_on-accent",
        "--ow-fg": "--_fg",
        "--ow-hover": "--_hover",
        "--ow-pressed-bg": "--_pressed-bg",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Indicator",
      selector: '[data-demo="all"] .ow-checkbox__indicator',
      note: {
        id: "Mengisi kotak dan digambar sendiri bila Root tanpa children. Base UI melepasnya saat mati, setelah memudar.",
        en: "Fills the box, and draws itself when Root has no children. Base UI unmounts it while off, once it has faded.",
      },
    },
    {
      name: "Glyph",
      selector: '[data-demo="all"] [data-glyph="minus"]',
      note: {
        id: 'data-glyph="check" atau "minus": bertumpuk di satu sel dan saling memudar. Children mengganti keduanya dengan node apa pun.',
        en: 'data-glyph="check" or "minus": stacked in one cell, crossfading. Children replace both with any node.',
      },
    },
  ],

  demo(cfg, lang) {
    return <Checklist cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/checkbox";
    const custom = cfg.fill || cfg.glyph || cfg.edge;
    const scope = custom ? ' className="task"' : "";
    const size = cfg.size === "md" ? "" : ` size="${cfg.size}"`;
    const usage = [
      `import { Checkbox } from "${from}";`,
      "",
      "export function Task() {",
      "  return (",
      `    <label${scope}>`,
      `      <Checkbox.Root${size} /> Run the tests`,
      "    </label>",
      "  );",
      "}",
    ];
    const files = [{ name: "task.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // On the box: isolated values sit on each Root, so an inherited value would lose.
      const lines = [
        "/* Every Checkbox inside .task */",
        ".task .ow-checkbox {",
        ...(cfg.fill ? [`  ${token}-accent: ${cfg.fill};`] : []),
        ...(cfg.glyph ? [`  ${token}-on-accent: ${cfg.glyph};`] : []),
        ...(cfg.edge ? [`  ${token}-edge: ${cfg.edge};`] : []),
        "}",
      ];
      files.push({ name: "task.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    marking: { play: marking },
    label: {
      demo: (cfg, lang) => <PlainLabels cfg={cfg} lang={lang} />,
      play: labelling,
    },
    geometry: { demo: (_cfg, lang) => <Sizes lang={lang} /> },
    anatomy: { inspect: true, cfg: { size: "lg" } },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: {
      controls: true,
      demo: (cfg, lang) => <Custom cfg={cfg} lang={lang} />,
    },
    ship: { code: true },
  },
});

export default function CheckboxLab(props: LabProps) {
  return <LabShell lab={checkboxLab} {...props} />;
}
