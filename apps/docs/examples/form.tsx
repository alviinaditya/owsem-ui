"use client";

import { Button, Field, Fieldset, Form } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    email: "Email",
    username: "Nama pengguna",
    submit: "Daftar",
    taken: "Nama itu sudah dipakai.",
    sent: "Akun Anda sudah dibuat.",
    profile: "Profil",
    newsletter: "Email untuk buletin",
    subscribe: "Berlangganan",
    wrong: "Itu belum terlihat seperti alamat email.",
  },
  en: {
    email: "Email",
    username: "Username",
    submit: "Sign up",
    taken: "That name is taken.",
    sent: "Your account is ready.",
    profile: "Profile",
    newsletter: "Newsletter email",
    subscribe: "Subscribe",
    wrong: "That doesn't look like an email address yet.",
  },
} satisfies Record<Lang, Record<string, string>>;

/** A sign-up form against a pretend server, which takes half a second and turns down "admin". */
function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  return (
    <Form
      className="demo-form"
      errors={errors}
      onFormSubmit={async (values) => {
        setStatus("sending");
        await new Promise((resolve) => setTimeout(resolve, 500));
        const taken = values.username === "admin";
        setErrors(taken ? { username: t.taken } : {});
        setStatus(taken ? "idle" : "sent");
      }}
    >
      <Field.Root name="email">
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" required />
        <Field.Error />
      </Field.Root>
      <Field.Root name="username">
        <Field.Label>{t.username}</Field.Label>
        <Field.Control required autoComplete="off" />
        <Field.Error />
      </Field.Root>
      <Button type="submit" loading={status === "sending"}>
        {t.submit}
      </Button>
      <p className="demo-muted demo-form-status" role="status">
        {status === "sent" ? t.sent : null}
      </p>
    </Form>
  );
}

function OnChange({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Form className="demo-form" validationMode="onChange">
      <Field.Root name="email">
        <Field.Label>{t.email}</Field.Label>
        <Field.Control type="email" required />
        <Field.Error>{t.wrong}</Field.Error>
      </Field.Root>
      <Button type="submit">{t.submit}</Button>
    </Form>
  );
}

function WithFieldset({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Form className="demo-form">
      <Fieldset.Root>
        <Fieldset.Legend>{t.profile}</Fieldset.Legend>
        <Field.Root name="email">
          <Field.Label>{t.email}</Field.Label>
          <Field.Control type="email" />
        </Field.Root>
        <Field.Root name="username">
          <Field.Label>{t.username}</Field.Label>
          <Field.Control autoComplete="off" />
        </Field.Root>
      </Fieldset.Root>
      <Button type="submit">{t.submit}</Button>
    </Form>
  );
}

function Row({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Form className="demo-form demo-form-row">
      <Field.Root name="email">
        <Field.Label>{t.newsletter}</Field.Label>
        <Field.Control type="email" required />
      </Field.Root>
      <Button type="submit" variant="secondary">
        {t.subscribe}
      </Button>
    </Form>
  );
}

const imports = (setup: TokenSetup, ...names: ("button" | "field" | "fieldset" | "form")[]) =>
  names.map((name) => {
    const label = name[0]?.toUpperCase() + name.slice(1);
    return `import { ${label} } from "${importPath(setup, name)}";`;
  });

export const formDefinition = defineComponent({
  item: "form",
  imports: ["Form"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Submit memeriksa Field lebih dulu; error dari server masuk lewat errors, per name, dan fokus pindah ke field pertama yang gagal.",
        en: "A submit checks the Fields first; server errors come in through errors, by name, and focus goes to the first that failed.",
      },
      uses: ["Form", "Field", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "SignUp",
            ['import { useState } from "react";', ...imports(setup, "button", "field", "form")],
            [
              "<Form",
              "  errors={errors}",
              "  onFormSubmit={async (values) => {",
              "    setSending(true);",
              "    const found = await save(values);",
              "    setErrors(found);",
              "    setSending(false);",
              "    setSent(Object.keys(found).length === 0);",
              "  }}",
              ">",
              '  <Field.Root name="email">',
              `    <Field.Label>${t.email}</Field.Label>`,
              '    <Field.Control type="email" required />',
              "    <Field.Error />",
              "  </Field.Root>",
              '  <Field.Root name="username">',
              `    <Field.Label>${t.username}</Field.Label>`,
              '    <Field.Control required autoComplete="off" />',
              "    <Field.Error />",
              "  </Field.Root>",
              `  <Button type="submit" loading={sending}>${t.submit}</Button>`,
              `  <p role="status">{sent ? "${t.sent}" : null}</p>`,
              "</Form>",
            ],
            [
              "  const [errors, setErrors] = useState({});",
              "  const [sending, setSending] = useState(false);",
              "  const [sent, setSent] = useState(false);",
              "",
              "  // A stand-in for your server: it answers with errors by field name.",
              "  const save = async (values) => {",
              "    await new Promise((resolve) => setTimeout(resolve, 500));",
              `    return values.username === "admin" ? { username: "${t.taken}" } : {};`,
              "  };",
              "",
            ],
          ),
        ];
      },
    },
    {
      id: "on-change",
      title: { id: "Saat berubah", en: "On change" },
      description: {
        id: "validationMode memeriksa saat blur atau saat berubah sejak awal; bawaannya menunggu submit pertama.",
        en: "validationMode checks on blur or on change from the start; the default waits for the first submit.",
      },
      uses: ["Form", "Field", "Button"],
      demo: (lang) => <OnChange lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Subscribe", imports(setup, "button", "field", "form"), [
            '<Form validationMode="onChange">',
            '  <Field.Root name="email">',
            `    <Field.Label>${t.email}</Field.Label>`,
            '    <Field.Control type="email" required />',
            `    <Field.Error>${t.wrong}</Field.Error>`,
            "  </Field.Root>",
            `  <Button type="submit">${t.submit}</Button>`,
            "</Form>",
          ]),
        ];
      },
    },
    {
      id: "fieldset",
      title: { id: "Fieldset", en: "Fieldset" },
      description: {
        id: "Kelompokkan field dengan Fieldset di dalam Form; hanya name pada Field yang penting bagi Form.",
        en: "Group fields with a Fieldset inside a Form; only the Field's name matters to the Form.",
      },
      uses: ["Form", "Fieldset", "Field", "Button"],
      demo: (lang) => <WithFieldset lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("ProfileForm", imports(setup, "button", "field", "fieldset", "form"), [
            "<Form>",
            "  <Fieldset.Root>",
            `    <Fieldset.Legend>${t.profile}</Fieldset.Legend>`,
            '    <Field.Root name="email">',
            `      <Field.Label>${t.email}</Field.Label>`,
            '      <Field.Control type="email" />',
            "    </Field.Root>",
            '    <Field.Root name="username">',
            `      <Field.Label>${t.username}</Field.Label>`,
            "      <Field.Control />",
            "    </Field.Root>",
            "  </Fieldset.Root>",
            `  <Button type="submit">${t.submit}</Button>`,
            "</Form>",
          ]),
        ];
      },
    },
    {
      id: "row",
      title: { id: "Baris", en: "Row" },
      description: {
        id: "Tata letak lain adalah CSS Anda, seperti kotak buletin satu baris.",
        en: "Any other layout is your CSS, such as a one-row newsletter box.",
      },
      uses: ["Form", "Field", "Button"],
      demo: (lang) => <Row lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Newsletter", imports(setup, "button", "field", "form"), [
            '<Form className="newsletter">',
            '  <Field.Root name="email">',
            `    <Field.Label>${t.newsletter}</Field.Label>`,
            '    <Field.Control type="email" required />',
            "  </Field.Root>",
            `  <Button type="submit" variant="secondary">${t.subscribe}</Button>`,
            "</Form>",
          ]),
          {
            name: "newsletter.css",
            code: [
              ".newsletter {",
              "  flex-direction: row;",
              "  align-items: end;",
              "  gap: 8px;",
              "}",
              "",
              ".newsletter > .ow-field {",
              "  flex: 1;",
              "}",
            ].join("\n"),
          },
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => {
      const t = TEXT[lang];
      return (
        <Form className="demo-form" errors={{ username: t.taken }}>
          <Field.Root name="username">
            <Field.Label>{t.username}</Field.Label>
            <Field.Control defaultValue="admin" />
            <Field.Error />
          </Field.Root>
          <Button type="submit">{t.submit}</Button>
        </Form>
      );
    },
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-form",
      note: {
        id: "form dari Base UI. Ia menggambar jarak antar-field, tanpa token sendiri; submit yang masih gagal menggetarkan lagi field invalid pertama.",
        en: "Base UI's form. It draws the gap between fields and has no token of its own; a submit that still fails shakes the first invalid field again.",
      },
    },
  ],
});

export default function FormPage(props: ExamplePageProps) {
  return <ComponentPage definition={formDefinition} {...props} />;
}
