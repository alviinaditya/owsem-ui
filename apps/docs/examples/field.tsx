"use client";

import { Field } from "owsem-ui/base";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

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

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-field">
      <Field.Root validationMode="onChange">
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" placeholder={t.placeholder} />
        <Field.Description>{t.hint}</Field.Description>
        <Field.Error>{t.wrong}</Field.Error>
      </Field.Root>
    </div>
  );
}

function Validation({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-field">
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
            <p className="demo-muted" data-demo="validity">
              {validity.valid === null ? t.unchecked : validity.valid ? t.valid : t.invalid}
            </p>
          )}
        </Field.Validity>
      </Field.Root>
    </div>
  );
}

function Invalid({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-field">
      <Field.Root invalid>
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" defaultValue="ana@" startIcon={<Icon name="mail" />} />
        <Field.Description>{t.hint}</Field.Description>
        <Field.Error match>{t.wrong}</Field.Error>
      </Field.Root>
    </div>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-field">
      <Field.Root disabled>
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" defaultValue="ana@owsem.dev" />
        <Field.Description>{t.hint}</Field.Description>
      </Field.Root>
    </div>
  );
}

function Multiline({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-field">
      <Field.Root>
        <Field.Label>{t.note}</Field.Label>
        <Field.Control render={<textarea rows={3} />} />
        <Field.Description>{t.noteHint}</Field.Description>
      </Field.Root>
    </div>
  );
}

const imp = (setup: Parameters<typeof importPath>[0]) =>
  `import { Field } from "${importPath(setup, "field")}";`;

export const fieldDefinition = defineComponent({
  item: "field",
  imports: ["Field"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Label, kontrol, deskripsi, dan error: Base UI menghubungkannya, jadi Anda tidak menulis id.",
        en: "A label, a control, a description, and an error: Base UI wires them, so you write no ids.",
      },
      uses: ["Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Email",
            [imp(setup)],
            [
              '<Field.Root validationMode="onChange">',
              `  <Field.Label>${t.email}</Field.Label>`,
              `  <Field.Control type="email" placeholder="${t.placeholder}" />`,
              `  <Field.Description>${t.hint}</Field.Description>`,
              `  <Field.Error>${t.wrong}</Field.Error>`,
              "</Field.Root>",
            ],
          ),
        ];
      },
    },
    {
      id: "validation",
      title: { id: "Validasi", en: "Validation" },
      description: {
        id: "Batasan native (pattern) dan validate buatan Anda, tiap kegagalan dengan pesannya sendiri lewat match.",
        en: "Native constraints (pattern) and your own validate, each failure with its own message through match.",
      },
      uses: ["Field"],
      demo: (lang) => <Validation lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Username",
            [imp(setup)],
            [
              "<Field.Root",
              '  validationMode="onChange"',
              `  validate={(value) => (value === "admin" ? "${t.taken}" : null)}`,
              ">",
              `  <Field.Label>${t.username}</Field.Label>`,
              '  <Field.Control pattern="[a-z0-9]{3,}" autoComplete="off" />',
              `  <Field.Description>${t.usernameHint}</Field.Description>`,
              `  <Field.Error match="patternMismatch">${t.mismatch}</Field.Error>`,
              '  <Field.Error match="customError" />',
              "  <Field.Validity>",
              "    {({ validity }) => <p>{String(validity.valid)}</p>}",
              "  </Field.Validity>",
              "</Field.Root>",
            ],
          ),
        ];
      },
    },
    {
      id: "invalid",
      title: { id: "Invalid", en: "Invalid" },
      description: {
        id: "invalid dan match menahan error tetap tampil untuk state yang Anda kendalikan, misalnya dari server.",
        en: "invalid and match keep the error up for a state you control, such as one from a server.",
      },
      uses: ["Field"],
      demo: (lang) => <Invalid lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "InvalidEmail",
            [imp(setup), 'import { Mail } from "lucide-react";'],
            [
              "<Field.Root invalid>",
              `  <Field.Label>${t.email}</Field.Label>`,
              '  <Field.Control type="email" defaultValue="ana@" startIcon={<Mail />} />',
              `  <Field.Description>${t.hint}</Field.Description>`,
              `  <Field.Error match>${t.wrong}</Field.Error>`,
              "</Field.Root>",
            ],
          ),
        ];
      },
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled pada Root meredupkan label dan kontrolnya.",
        en: "disabled on the root dims the label and the control.",
      },
      uses: ["Field"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "LockedEmail",
            [imp(setup)],
            [
              "<Field.Root disabled>",
              `  <Field.Label>${t.email}</Field.Label>`,
              '  <Field.Control type="email" defaultValue="ana@owsem.dev" />',
              `  <Field.Description>${t.hint}</Field.Description>`,
              "</Field.Root>",
            ],
          ),
        ];
      },
    },
    {
      id: "textarea",
      title: { id: "Textarea", en: "Textarea" },
      description: {
        id: "Field.Control menerima render, jadi kontrol apa pun tetap berlabel dan berdeskripsi.",
        en: "Field.Control takes render, so any control stays labelled and described.",
      },
      uses: ["Field"],
      demo: (lang) => <Multiline lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Note",
            [imp(setup)],
            [
              "<Field.Root>",
              `  <Field.Label>${t.note}</Field.Label>`,
              "  <Field.Control render={<textarea rows={3} />} />",
              `  <Field.Description>${t.noteHint}</Field.Description>`,
              "</Field.Root>",
            ],
          ),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => {
      const t = TEXT[lang];
      return (
        <div className="demo-field">
          <Field.Root invalid>
            <Field.Label>{t.email}</Field.Label>
            <Field.Control type="email" defaultValue="ana@" />
            <Field.Description>{t.hint}</Field.Description>
            <Field.Error match>{t.wrong}</Field.Error>
          </Field.Root>
        </div>
      );
    },
  },
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
        id: "Input itu sendiri, dengan size dan ikonnya. Saat field invalid ia jadi tint critical dan bergetar sekali. render menaruh kontrol lain di sini.",
        en: "Input itself, with its size and icons. While the field is invalid it takes the critical tint and shakes once. render puts another control here.",
      },
      tokens: {
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
});

export default function FieldPage(props: ExamplePageProps) {
  return <ComponentPage definition={fieldDefinition} {...props} />;
}
