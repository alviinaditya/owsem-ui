"use client";

import { Button, Input, type InputSize } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { enterText } from "@/components/lab/enter-text";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Undang rekan",
    email: "Email",
    placeholder: "nama@perusahaan.com",
    invite: "Undang",
    hint: "Kami kirim tautan undangan ke alamat ini.",
    error: "Itu belum terlihat seperti alamat email.",
    search: "Cari",
    note: "Catatan",
  },
  en: {
    title: "Invite a teammate",
    email: "Email",
    placeholder: "name@company.com",
    invite: "Invite",
    hint: "We send an invite link to this address.",
    error: "That doesn't look like an email address yet.",
    search: "Search",
    note: "Note",
  },
} satisfies Record<Lang, Record<string, string>>;

const MATRIX = {
  id: {
    light: "Terang",
    dark: "Gelap",
    empty: "Kosong",
    filled: "Terisi",
    focus: "Fokus",
    invalid: "Invalid",
    disabled: "Disabled",
    plain: "Input",
    icons: "Dengan ikon",
    button: "Button",
    token: "Token",
    className: "className",
    render: "render",
    sample: "ana@owsem.dev",
  },
  en: {
    light: "Light",
    dark: "Dark",
    empty: "Empty",
    filled: "Filled",
    focus: "Focus",
    invalid: "Invalid",
    disabled: "Disabled",
    plain: "Input",
    icons: "With icons",
    button: "Button",
    token: "Token",
    className: "className",
    render: "render",
    sample: "ana@owsem.dev",
  },
} satisfies Record<Lang, Record<string, string>>;

type Theme = "light" | "dark";

const SIZES: readonly InputSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { size: "md", icons: "none", well: "", edge: "" };
type Cfg = typeof initial;

const tokens = (cfg: Cfg) =>
  ({
    "--ow-well-bg": cfg.well || undefined,
    "--ow-edge": cfg.edge || undefined,
  }) as CSSProperties;

const looksLikeEmail = (value: string) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

/** An invite box: the field beside a Button, and an edge that follows what is typed. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const size = cfg.size as InputSize;
  const [value, setValue] = useState("");
  const valid = looksLikeEmail(value);
  return (
    <div className="demo-card demo-input">
      <p className="demo-title">{t.title}</p>
      <div className="demo-input-row">
        <Input
          size={size}
          style={tokens(cfg)}
          aria-label={t.email}
          aria-invalid={!valid || undefined}
          placeholder={t.placeholder}
          value={value}
          onValueChange={setValue}
          startIcon={cfg.icons === "start" || cfg.icons === "both" ? <Icon name="mail" /> : null}
          endIcon={cfg.icons === "end" || cfg.icons === "both" ? <Icon name="user-plus" /> : null}
          data-demo="email"
        />
        <Button size={size} variant="secondary">
          {t.invite}
        </Button>
      </div>
      <p className="demo-muted">{valid ? t.hint : t.error}</p>
    </div>
  );
}

/** A control with its used height under it, read from the layout (the stage may scale the demo). */
function Measured({ children, of }: { children: ReactNode; of: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState("");
  useLayoutEffect(() => {
    const control = ref.current?.querySelector<HTMLElement>(of);
    if (!control) return;
    const observer = new ResizeObserver(() => {
      const height = Number.parseFloat(getComputedStyle(control).height);
      setSize(String(Math.round(height * 100) / 100));
    });
    observer.observe(control);
    return () => observer.disconnect();
  }, [of]);
  return (
    <span ref={ref} className="demo-measured demo-input-measured">
      {children}
      <span className="demo-caption">{size}</span>
    </span>
  );
}

/** Each size plain, with icons, and beside a Button: one height per size. */
function Geometry({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <div className="demo-surface">
      <Matrix
        columns={[t.plain, t.icons, t.button]}
        rows={SIZES.map((size) => ({
          label: size,
          cells: [
            <Measured key="plain" of=".ow-input">
              <Input size={size} aria-label={`${t.search} ${size}`} placeholder={t.search} />
            </Measured>,
            <Measured key="icons" of=".ow-input">
              <Input
                size={size}
                aria-label={`${t.email} ${size}`}
                placeholder={t.search}
                startIcon={<Icon name="search" />}
                endIcon={<Icon name="x" />}
              />
            </Measured>,
            <Measured key="button" of=".ow-button">
              <Button size={size} variant="secondary">
                {t.invite}
              </Button>
            </Measured>,
          ],
        }))}
      />
    </div>
  );
}

const STATES = [
  { key: "empty", props: {} },
  { key: "filled", props: { defaultValue: "ana@owsem.dev" } },
  { key: "focus", props: { className: "demo-input-ring" } },
  { key: "invalid", props: { "aria-invalid": true, defaultValue: "ana@" } },
  { key: "disabled", props: { disabled: true, defaultValue: "ana@owsem.dev" } },
] as const;

/** Each state in both themes. The focus row wears the ring on demand: only one field has focus. */
function States({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={STATES.map(({ key, props }) => ({
        label: t[key],
        cells: THEMES.map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            data-cell={`${theme}-${key}`}
            className="demo-cell demo-input-cell"
          >
            <Input
              {...props}
              aria-label={`${t.email} ${t[key]} ${t[theme]}`}
              placeholder={t.placeholder}
              startIcon={<Icon name="mail" />}
            />
          </div>
        )),
      }))}
    />
  );
}

/** The three ways to change it, side by side: a token, a className rule, and `render`. */
function Customized({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <div className="demo-card demo-input demo-input-custom">
      <span className="demo-caption">{t.token}</span>
      <Input
        aria-label={t.token}
        size={cfg.size as InputSize}
        style={tokens(cfg)}
        placeholder={t.placeholder}
      />
      <span className="demo-caption">{t.className}</span>
      <Input
        aria-label={t.className}
        size={cfg.size as InputSize}
        className="demo-input-pill"
        placeholder={t.placeholder}
      />
      <span className="demo-caption">{t.render}</span>
      <Input aria-label={t.note} render={<textarea rows={2} />} placeholder={t.note} />
    </div>
  );
}

// Types an address: the edge turns critical while it isn't one, and back once it is.
const typing: SceneScript = async (stage) => {
  const email = stage.get('[data-demo="email"]');
  await stage.click(email);
  const text = "ana@owsem.dev";
  for (let i = 1; i <= text.length; i++) {
    enterText(email, text.slice(0, i));
    await stage.wait(i === 4 ? 900 : 90);
  }
  await stage.wait(900);
  enterText(email, "");
};

// Points at the empty field in each theme, and fills it for a moment.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const field = stage.get(`[data-cell="${theme}-empty"] .ow-input`);
    await stage.click(field);
    enterText(field, "ana@owsem.dev");
    await stage.wait(900);
    enterText(field, "");
    await stage.wait(300);
  }
};

const inputLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "icons",
      type: "choice",
      label: { id: "Ikon", en: "Icons" },
      options: [
        { value: "none", label: { id: "Tanpa", en: "None" } },
        { value: "start", label: { id: "Depan", en: "Start" } },
        { value: "end", label: { id: "Belakang", en: "End" } },
        { value: "both", label: { id: "Keduanya", en: "Both" } },
      ],
    },
    {
      key: "well",
      type: "color",
      label: { id: "Isian", en: "Fill" },
      token: "--ow-well-bg",
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
      selector: '[data-demo="email"]',
      note: {
        id: "input dari Base UI, selalu berupa well-nya. ref, className, style, dan props native sampai ke sini.",
        en: "Base UI's input, always the well itself. ref, className, style, and native props land here.",
      },
      tokens: {
        "--ow-well-bg": "--_bg",
        "--ow-well-shadow": "--_shadow",
        "--ow-edge": "--_edge",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Wrapper",
      selector: ".ow-input__wrapper",
      note: {
        id: "Hanya ada bila ada ikon. Tanpa tampilan: hanya menempatkan ikonnya.",
        en: "Only there with an icon. It has no look: it only places the icons.",
      },
    },
    {
      name: "Icon",
      selector: ".ow-input__icon",
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px, sejauh jarak atas dari tepi. Klik menembus ke input.",
        en: "startIcon or endIcon: the font size plus 2px, as far from the edge as from the top. Clicks pass to the input.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/input";
    const custom = cfg.well || cfg.edge;
    const start = cfg.icons === "start" || cfg.icons === "both";
    const end = cfg.icons === "end" || cfg.icons === "both";
    const icons = [start ? "Mail" : "", end ? "UserPlus" : ""].filter(Boolean);
    const props = [
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      'aria-label="Email"',
      'placeholder="name@company.com"',
      ...(start ? ["startIcon={<Mail />}"] : []),
      ...(end ? ["endIcon={<UserPlus />}"] : []),
    ];
    const input =
      props.length > 2
        ? ["<Input", ...props.map((prop) => `  ${prop}`), "/>"]
        : [`<Input ${props.join(" ")} />`];
    const usage = [
      `import { Input } from "${from}";`,
      ...(icons.length ? [`import { ${icons.join(", ")} } from "lucide-react";`] : []),
      "",
      "export function Invite() {",
      "  return (",
      ...(custom
        ? ['    <div className="invite">', ...input.map((line) => `      ${line}`), "    </div>"]
        : input.map((line) => `    ${line}`)),
      "  );",
      "}",
    ];
    const files = [{ name: "invite.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // Isolated values sit on each Input's root, so an inherited value would lose.
      const lines = [
        "/* Every Input inside .invite */",
        setup.mode === "isolated" ? ".invite .ow-input {" : ".invite {",
        ...(cfg.well ? [`  ${token}-well-bg: ${cfg.well};`] : []),
        ...(cfg.edge ? [`  ${token}-edge: ${cfg.edge};`] : []),
        "}",
      ];
      files.push({ name: "invite.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    typing: { play: typing },
    geometry: { demo: (_cfg, lang) => <Geometry lang={lang} /> },
    anatomy: { inspect: true, cfg: { icons: "both" } },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: {
      controls: true,
      demo: (cfg, lang) => <Customized cfg={cfg} lang={lang} />,
    },
    ship: { code: true },
  },
});

export default function InputLab(props: LabProps) {
  return <LabShell lab={inputLab} {...props} />;
}
