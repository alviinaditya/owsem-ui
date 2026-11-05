"use client";

import { Button, Field, Fieldset, Form } from "owsem-ui/base";
import { type CSSProperties, useRef, useState } from "react";
import { enterText } from "@/components/lab/enter-text";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript, type ScriptStage } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Buat akun",
    email: "Email",
    username: "Nama pengguna",
    submit: "Daftar",
    again: "Ulangi",
    taken: "Nama itu sudah dipakai.",
    sent: "Akun Anda sudah dibuat.",
    missing: "Isi kolom ini.",
    light: "Terang",
    dark: "Gelap",
    untouched: "Belum disentuh",
    native: "Error native",
    server: "Error server",
    token: "Token",
    className: "className",
    composition: "Dengan Fieldset",
    profile: "Profil",
  },
  en: {
    title: "Create an account",
    email: "Email",
    username: "Username",
    submit: "Sign up",
    again: "Start over",
    taken: "That name is taken.",
    sent: "Your account is ready.",
    missing: "Fill out this field.",
    light: "Light",
    dark: "Dark",
    untouched: "Untouched",
    native: "Native error",
    server: "Server error",
    token: "Token",
    className: "className",
    composition: "With a Fieldset",
    profile: "Profile",
  },
} satisfies Record<Lang, Record<string, string>>;

type Theme = "light" | "dark";
type Mode = "onSubmit" | "onBlur" | "onChange";

const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { mode: "onSubmit", gap: "default", critical: "" };
type Cfg = typeof initial;

const GAPS: Record<string, string | undefined> = {
  default: undefined,
  tight: "demo-form-tight",
  roomy: "demo-form-roomy",
};

/**
 * A sign-up form against a pretend server, which takes half a second and turns down "admin". Start
 * over remounts it, so its fields forget what they were told.
 */
function SignUp({ cfg, lang, onAgain }: { cfg: Cfg; lang: Lang; onAgain: () => void }) {
  const t = TEXT[lang];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const timer = useRef(0);
  return (
    <Form
      errors={errors}
      validationMode={cfg.mode as Mode}
      className={GAPS[cfg.gap]}
      style={{ "--ow-critical": cfg.critical || undefined } as CSSProperties}
      onFormSubmit={(values) => {
        setStatus("sending");
        clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          const taken = values.username === "admin";
          setErrors(taken ? { username: t.taken } : {});
          setStatus(taken ? "idle" : "sent");
        }, 500);
      }}
    >
      <Field.Root name="email">
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" required data-demo="email" />
        <Field.Error />
      </Field.Root>
      <Field.Root name="username">
        <Field.Label>{t.username}</Field.Label>
        <Field.Control required autoComplete="off" data-demo="username" />
        <Field.Error />
      </Field.Root>
      <div className="demo-form-actions">
        <Button type="submit" loading={status === "sending"} data-demo="submit">
          {t.submit}
        </Button>
        <Button type="button" variant="ghost" onClick={onAgain} data-demo="again">
          {t.again}
        </Button>
      </div>
      <p className="demo-muted demo-form-status" role="status">
        {status === "sent" ? t.sent : null}
      </p>
    </Form>
  );
}

function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const [run, setRun] = useState(0);
  return (
    <div className="demo-card demo-form">
      <p className="demo-title">{TEXT[lang].title}</p>
      <SignUp key={run} cfg={cfg} lang={lang} onAgain={() => setRun(run + 1)} />
    </div>
  );
}

const STATES = [
  { key: "untouched", errors: {}, invalid: undefined, message: "" },
  { key: "native", errors: {}, invalid: true, message: "missing" },
  { key: "server", errors: { username: "taken" }, invalid: undefined, message: "" },
] as const;

/** Each kind of error in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={STATES.map(({ key, errors, invalid, message }) => ({
        label: t[key],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className="demo-cell demo-field-cell">
            <Form errors={"username" in errors ? { username: t.taken } : {}}>
              <Field.Root name="username" invalid={invalid}>
                <Field.Label>{t.username}</Field.Label>
                <Field.Control />
                {message ? <Field.Error match>{t[message]}</Field.Error> : <Field.Error />}
              </Field.Root>
            </Form>
          </div>
        )),
      }))}
    />
  );
}

/** The ways to change it, side by side: a token, a className rule, and a Fieldset inside. */
function Customized({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-form demo-field-custom">
      <span className="demo-caption">{t.token}</span>
      <Form
        errors={{ username: t.taken }}
        style={{ "--ow-critical": cfg.critical || undefined } as CSSProperties}
      >
        <Field.Root name="username">
          <Field.Label>{t.username}</Field.Label>
          <Field.Control defaultValue="admin" />
          <Field.Error />
        </Field.Root>
      </Form>
      <span className="demo-caption">{t.className}</span>
      <Form className="demo-form-row">
        <Field.Root>
          <Field.Label>{t.email}</Field.Label>
          <Field.Control />
        </Field.Root>
        <Button type="button" variant="secondary">
          {t.submit}
        </Button>
      </Form>
      <span className="demo-caption">{t.composition}</span>
      <Form>
        <Fieldset.Root>
          <Fieldset.Legend>{t.profile}</Fieldset.Legend>
          <Field.Root>
            <Field.Label>{t.username}</Field.Label>
            <Field.Control />
          </Field.Root>
        </Fieldset.Root>
      </Form>
    </div>
  );
}

/** Scripts keep the visitor's focus where it is, so they draw the ring a submit would give. */
const ring = (control: HTMLElement, on: boolean) => {
  control.toggleAttribute("data-demo-focus", on);
};

const type = async (stage: ScriptStage, control: HTMLElement, text: string) => {
  for (let i = 1; i <= text.length; i++) {
    enterText(control, text.slice(0, i));
    await stage.wait(60);
  }
};

// An empty submit: both fields fail, and focus lands on the first. Filling them clears each.
const native: SceneScript = async (stage) => {
  const email = stage.get('[data-demo="email"]');
  const username = stage.get('[data-demo="username"]');
  await stage.click(stage.get('[data-demo="submit"]'));
  await stage.wait(200);
  ring(email, true);
  await stage.wait(1600);
  await type(stage, email, "ana@owsem.dev");
  ring(email, false);
  await stage.wait(500);
  await type(stage, username, "ana");
  await stage.wait(900);
  await stage.click(stage.get('[data-demo="again"]'));
};

// The server turns the name down: the error lands on its field, focus goes there, and an edit
// clears it without asking again.
const server: SceneScript = async (stage) => {
  const email = stage.get('[data-demo="email"]');
  const username = stage.get('[data-demo="username"]');
  await type(stage, email, "ana@owsem.dev");
  await type(stage, username, "admin");
  await stage.wait(300);
  await stage.click(stage.get('[data-demo="submit"]'));
  await stage.wait(700);
  ring(username, true);
  await stage.wait(1600);
  await type(stage, username, "admin7");
  ring(username, false);
  await stage.wait(500);
  await stage.click(stage.get('[data-demo="submit"]'));
  await stage.wait(1500);
  await stage.click(stage.get('[data-demo="again"]'));
};

const formLab = defineLab({
  initial,
  controls: [
    {
      key: "mode",
      type: "choice",
      label: { id: "Validasi", en: "Validation" },
      options: [
        { value: "onSubmit", label: { id: "Submit", en: "Submit" } },
        { value: "onBlur", label: { id: "Blur", en: "Blur" } },
        { value: "onChange", label: { id: "Ubah", en: "Change" } },
      ],
    },
    {
      key: "gap",
      type: "choice",
      label: { id: "Jarak", en: "Gap" },
      options: [
        { value: "default", label: { id: "Bawaan", en: "Default" } },
        { value: "tight", label: { id: "Rapat", en: "Tight" } },
        { value: "roomy", label: { id: "Lega", en: "Roomy" } },
      ],
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
      selector: ".ow-form",
      note: {
        id: "form dari Base UI. Ia hanya menggambar jarak antar-field, tanpa token sendiri.",
        en: "Base UI's form. It draws only the gap between fields, and has no token of its own.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Button, Field, Form } from "owsem-ui/base";']
      : [
          'import { Button } from "@/components/owsem/button";',
          'import { Field } from "@/components/owsem/field";',
          'import { Form } from "@/components/owsem/form";',
        ];
    const custom = cfg.gap !== "default" || cfg.critical;
    const props = [
      ...(custom ? ['className="signup"'] : []),
      ...(cfg.mode === "onSubmit" ? [] : [`validationMode="${cfg.mode}"`]),
      "onFormSubmit={save}",
    ];
    const usage = [
      ...imports,
      "",
      "export function SignUp({ save }) {",
      "  return (",
      `    <Form ${props.join(" ")}>`,
      '      <Field.Root name="email">',
      "        <Field.Label>Email</Field.Label>",
      '        <Field.Control type="email" required />',
      "        <Field.Error />",
      "      </Field.Root>",
      '      <Button type="submit">Sign up</Button>',
      "    </Form>",
      "  );",
      "}",
    ];
    const server = [
      ...imports,
      'import { useState } from "react";',
      "",
      "export function SignUp({ save }) {",
      '  // Errors from your server, by field name: { username: "That name is taken." }',
      "  const [errors, setErrors] = useState({});",
      "  return (",
      "    <Form errors={errors} onFormSubmit={async (values) => setErrors(await save(values))}>",
      '      <Field.Root name="username">',
      "        <Field.Label>Username</Field.Label>",
      "        <Field.Control required />",
      "        <Field.Error />",
      "      </Field.Root>",
      '      <Button type="submit">Sign up</Button>',
      "    </Form>",
      "  );",
      "}",
    ];
    const files = [
      { name: "sign-up.tsx", code: usage.join("\n") },
      { name: "server-errors.tsx", code: server.join("\n") },
    ];
    if (custom) {
      const lines = [
        "/* Unlayered, so it beats the Form's own gap */",
        ".signup {",
        ...(cfg.gap === "tight" ? ["  gap: 0.5em;"] : []),
        ...(cfg.gap === "roomy" ? ["  gap: 2.5em;"] : []),
        ...(cfg.critical ? [`  --${setup.prefix}-critical: ${cfg.critical};`] : []),
        "}",
      ];
      files.push({ name: "signup.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    native: { play: native },
    server: { play: server },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: {
      controls: true,
      demo: (cfg, lang) => <Customized cfg={cfg} lang={lang} />,
    },
    ship: { code: true },
  },
});

export default function FormLab(props: LabProps) {
  return <LabShell lab={formLab} {...props} />;
}
