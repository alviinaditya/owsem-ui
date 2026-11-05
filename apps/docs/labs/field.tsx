"use client";

import { Field, type InputSize } from "owsem-ui/base";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { enterText } from "@/components/lab/enter-text";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    email: "Email kerja",
    placeholder: "nama@perusahaan.com",
    hint: "Kami hanya memakainya untuk masuk.",
    wrong: "Itu belum terlihat seperti alamat email.",
    username: "Nama pengguna",
    usernameHint: "Huruf kecil dan angka, minimal 3 karakter.",
    mismatch: "Pakai huruf kecil dan angka, minimal 3 karakter.",
    taken: "Nama itu sudah dipakai.",
    valid: "Valid",
    invalid: "Invalid",
    unchecked: "Belum dicek",
    note: "Catatan",
    noteHint: "Terlihat oleh tim Anda.",
  },
  en: {
    email: "Work email",
    placeholder: "name@company.com",
    hint: "We only use it to sign you in.",
    wrong: "That doesn't look like an email address yet.",
    username: "Username",
    usernameHint: "Lowercase letters and numbers, at least 3.",
    mismatch: "Use lowercase letters and numbers, at least 3.",
    taken: "That name is taken.",
    valid: "Valid",
    invalid: "Invalid",
    unchecked: "Not checked yet",
    note: "Note",
    noteHint: "Your team can see this.",
  },
} satisfies Record<Lang, Record<string, string>>;

const MATRIX = {
  id: {
    light: "Terang",
    dark: "Gelap",
    idle: "Kosong",
    filled: "Terisi",
    invalid: "Invalid",
    disabled: "Disabled",
    token: "Token",
    className: "className",
    render: "render",
  },
  en: {
    light: "Light",
    dark: "Dark",
    idle: "Empty",
    filled: "Filled",
    invalid: "Invalid",
    disabled: "Disabled",
    token: "Token",
    className: "className",
    render: "render",
  },
} satisfies Record<Lang, Record<string, string>>;

type Theme = "light" | "dark";

const SIZES: readonly InputSize[] = ["sm", "md", "lg"];
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { state: "idle", size: "md", icon: "off", muted: "", critical: "" };
type Cfg = typeof initial;

const tokens = (cfg: Cfg) =>
  ({
    "--ow-muted": cfg.muted || undefined,
    "--ow-critical": cfg.critical || undefined,
  }) as CSSProperties;

/** What assistive tech is told about the control, read from its attributes as they change. */
function Wiring() {
  const ref = useRef<HTMLDListElement>(null);
  const [rows, setRows] = useState<[string, string][]>([]);
  useEffect(() => {
    const control = ref.current?.parentElement?.querySelector("input");
    if (!control) return;
    const text = (name: string) =>
      (control.getAttribute(name) ?? "")
        .split(" ")
        .map((id) => (id ? document.getElementById(id)?.textContent : ""))
        .filter(Boolean)
        .join(" + ") || "–";
    const read = () =>
      setRows([
        ["aria-labelledby", text("aria-labelledby")],
        ["aria-describedby", text("aria-describedby")],
        ["aria-invalid", control.getAttribute("aria-invalid") ?? "–"],
      ]);
    read();
    const observer = new MutationObserver(read);
    observer.observe(control, {
      attributes: true,
      attributeFilter: ["aria-labelledby", "aria-describedby", "aria-invalid"],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <dl ref={ref} className="demo-field-wiring">
      {rows.map(([name, value]) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd data-demo={name}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** An email field, and what its control says about itself. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-field">
      <Field.Root
        style={tokens(cfg)}
        invalid={cfg.state === "invalid" || undefined}
        disabled={cfg.state === "disabled"}
        validationMode="onChange"
      >
        <Field.Label>{t.email}</Field.Label>
        <Field.Control
          type="email"
          size={cfg.size as InputSize}
          placeholder={t.placeholder}
          startIcon={cfg.icon === "on" ? <Icon name="mail" /> : undefined}
        />
        <Field.Description>{t.hint}</Field.Description>
        <Field.Error match={cfg.state === "invalid" ? true : undefined}>{t.wrong}</Field.Error>
      </Field.Root>
      <Wiring key={cfg.icon} />
    </div>
  );
}

/** One error for each failure, a custom check, and Field.Validity reading the result. */
function Validation({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-field">
      <Field.Root
        validationMode="onChange"
        validate={(value) => (value === "admin" ? t.taken : null)}
      >
        <Field.Label>{t.username}</Field.Label>
        <Field.Control pattern="[a-z0-9]{3,}" autoComplete="off" spellCheck={false} />
        <Field.Description>{t.usernameHint}</Field.Description>
        <Field.Error match="patternMismatch">{t.mismatch}</Field.Error>
        <Field.Error match="customError" />
        <Field.Validity>
          {({ validity }) => (
            <p className="demo-caption" data-demo="validity">
              {validity.valid === null ? t.unchecked : validity.valid ? t.valid : t.invalid}
            </p>
          )}
        </Field.Validity>
      </Field.Root>
    </div>
  );
}

const STATES = [
  { key: "idle", root: {}, control: {} },
  { key: "filled", root: {}, control: { defaultValue: "ana@owsem.dev" } },
  { key: "invalid", root: { invalid: true }, control: { defaultValue: "ana@" } },
  { key: "disabled", root: { disabled: true }, control: { defaultValue: "ana@owsem.dev" } },
] as const;

/** Each state in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = { ...TEXT[lang], ...MATRIX[lang] };
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={STATES.map(({ key, root, control }) => ({
        label: t[key],
        cells: THEMES.map((theme) => (
          <div
            key={theme}
            data-theme={theme}
            data-cell={`${theme}-${key}`}
            className="demo-cell demo-field-cell"
          >
            <Field.Root {...root} validationMode="onChange">
              <Field.Label>{t.email}</Field.Label>
              <Field.Control type="email" {...control} placeholder={t.placeholder} />
              <Field.Description>{t.hint}</Field.Description>
              {key === "invalid" ? <Field.Error match>{t.wrong}</Field.Error> : null}
            </Field.Root>
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
    <div className="demo-card demo-field demo-field-custom">
      <span className="demo-caption">{t.token}</span>
      <Field.Root style={tokens(cfg)} invalid>
        <Field.Label>{t.email}</Field.Label>
        <Field.Control defaultValue="ana@" />
        <Field.Description>{t.hint}</Field.Description>
        <Field.Error match>{t.wrong}</Field.Error>
      </Field.Root>
      <span className="demo-caption">{t.className}</span>
      <Field.Root className="demo-field-inline">
        <Field.Label>{t.username}</Field.Label>
        <Field.Control placeholder="ana" />
      </Field.Root>
      <span className="demo-caption">{t.render}</span>
      <Field.Root>
        <Field.Label>{t.note}</Field.Label>
        <Field.Control render={<textarea rows={2} />} />
        <Field.Description>{t.noteHint}</Field.Description>
      </Field.Root>
    </div>
  );
}

// Types an address: the error appears and joins the control's description, then leaves.
const wiring: SceneScript = async (stage) => {
  const control = stage.get(".ow-input");
  await stage.click(control);
  const text = "ana@owsem.dev";
  for (let i = 1; i <= text.length; i++) {
    enterText(control, text.slice(0, i));
    await stage.wait(i === 4 ? 1400 : 90);
  }
  await stage.wait(900);
  enterText(control, "");
};

// Too short, taken, and free: each failure shows its own message.
const validation: SceneScript = async (stage) => {
  const control = stage.get(".ow-input");
  await stage.click(control);
  for (const value of ["ad", "admin", "admin7"]) {
    enterText(control, value);
    await stage.wait(1200);
  }
  enterText(control, "");
};

// Fills the empty field in each theme, past an error and on to a valid address.
const states: SceneScript = async (stage) => {
  for (const theme of THEMES) {
    const control = stage.get(`[data-cell="${theme}-idle"] .ow-input`);
    await stage.click(control);
    for (const value of ["ana@", "ana@owsem.dev", ""]) {
      enterText(control, value);
      await stage.wait(700);
    }
  }
};

const fieldLab = defineLab({
  initial,
  controls: [
    {
      key: "state",
      type: "choice",
      label: { id: "State", en: "State" },
      options: [
        { value: "idle", label: { id: "Biasa", en: "Idle" } },
        { value: "invalid", label: { id: "Invalid", en: "Invalid" } },
        { value: "disabled", label: { id: "Disabled", en: "Disabled" } },
      ],
    },
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran kontrol", en: "Control size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "icon",
      type: "choice",
      label: { id: "Ikon", en: "Icon" },
      options: [
        { value: "off", label: { id: "Tanpa", en: "None" } },
        { value: "on", label: { id: "Depan", en: "Start" } },
      ],
    },
    {
      key: "muted",
      type: "color",
      label: { id: "Deskripsi", en: "Description" },
      token: "--ow-muted",
    },
    {
      key: "critical",
      type: "color",
      label: { id: "Error", en: "Error" },
      token: "--ow-critical",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-field",
      note: {
        id: "Satu kolom dengan jarak yang sama, tanpa margin luar. Base UI mengikat bagian-bagiannya.",
        en: "One column with even gaps and no outer margins. Base UI ties its parts together.",
      },
    },
    {
      name: "Label",
      selector: ".ow-field__label",
      note: {
        id: "label dari Base UI: menamai kontrol, dan kliknya memindahkan fokus ke sana.",
        en: "Base UI's label: it names the control, and a click on it moves focus there.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
    {
      name: "Control",
      selector: ".ow-input",
      note: {
        id: "Input itu sendiri, dengan size dan ikonnya. render menaruh kontrol lain di sini.",
        en: "Input itself, with its size and icons. render puts another control here.",
      },
      tokens: {
        "--ow-well-bg": "--_bg",
        "--ow-edge": "--_edge",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Description",
      selector: ".ow-field__description",
      note: {
        id: "Teks bantuan, dibacakan bersama kontrol lewat aria-describedby.",
        en: "Help text, read out with the control through aria-describedby.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Error",
      selector: ".ow-field__error",
      note: {
        id: "Tampil saat field invalid, dan ikut masuk ke aria-describedby selama tampil.",
        en: "Shows while the field is invalid, and joins aria-describedby while it does.",
      },
      tokens: { "--ow-critical": "--_critical" },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/field";
    const custom = cfg.muted || cfg.critical;
    const root = [
      ...(custom ? ['className="signup"'] : []),
      ...(cfg.state === "invalid" ? ["invalid"] : []),
      ...(cfg.state === "disabled" ? ["disabled"] : []),
    ];
    const control = [
      'type="email"',
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
      ...(cfg.icon === "on" ? ["startIcon={<Mail />}"] : []),
    ];
    const usage = [
      `import { Field } from "${from}";`,
      ...(cfg.icon === "on" ? ['import { Mail } from "lucide-react";'] : []),
      "",
      "export function Email() {",
      "  return (",
      `    <Field.Root${root.map((prop) => ` ${prop}`).join("")}>`,
      "      <Field.Label>Work email</Field.Label>",
      `      <Field.Control ${control.join(" ")} />`,
      "      <Field.Description>We only use it to sign you in.</Field.Description>",
      `      <Field.Error${cfg.state === "invalid" ? " match" : ""}>That doesn't look like an email address yet.</Field.Error>`,
      "    </Field.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "email.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // Isolated values sit on each part's root, so set them on the parts that read them.
      const lines = [
        "/* Every Field inside .signup */",
        setup.mode === "isolated"
          ? ".signup :is(.ow-field__description, .ow-field__error) {"
          : ".signup {",
        ...(cfg.muted ? [`  ${token}-muted: ${cfg.muted};`] : []),
        ...(cfg.critical ? [`  ${token}-critical: ${cfg.critical};`] : []),
        "}",
      ];
      files.push({ name: "signup.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    wiring: { play: wiring },
    validation: { demo: (_cfg, lang) => <Validation lang={lang} />, play: validation },
    anatomy: { inspect: true, cfg: { state: "invalid" } },
    states: { demo: (_cfg, lang) => <States lang={lang} />, play: states },
    customization: {
      controls: true,
      demo: (cfg, lang) => <Customized cfg={cfg} lang={lang} />,
    },
    ship: { code: true },
  },
});

export default function FieldLab(props: LabProps) {
  return <LabShell lab={fieldLab} {...props} />;
}
