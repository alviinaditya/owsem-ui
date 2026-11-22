"use client";

import { Input, type InputSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    email: "Email",
    placeholder: "nama@perusahaan.com",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    search: "Cari",
    hint: "Kami kirim tautan undangan ke alamat ini.",
    error: "Itu belum terlihat seperti alamat email.",
    disabled: "Nonaktif",
    readOnly: "Hanya baca",
    note: "Catatan",
  },
  en: {
    email: "Email",
    placeholder: "name@company.com",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    search: "Search",
    hint: "We send an invite link to this address.",
    error: "That doesn't look like an email address yet.",
    disabled: "Disabled",
    readOnly: "Read-only",
    note: "Note",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly InputSize[] = ["sm", "md", "lg"];

const looksLikeEmail = (value: string) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-input">
      <Input aria-label={t.email} placeholder={t.placeholder} />
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-input demo-col">
      {SIZES.map((size) => (
        <Input key={size} size={size} aria-label={t[size]} placeholder={t[size]} />
      ))}
    </div>
  );
}

function Icons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-input demo-col">
      <Input aria-label={t.email} placeholder={t.placeholder} startIcon={<Icon name="mail" />} />
      <Input aria-label={t.search} placeholder={t.search} endIcon={<Icon name="search" />} />
      <Input
        aria-label={t.email}
        placeholder={t.placeholder}
        startIcon={<Icon name="mail" />}
        endIcon={<Icon name="user-plus" />}
      />
    </div>
  );
}

function Validation({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [value, setValue] = useState("");
  const valid = looksLikeEmail(value);
  return (
    <div className="demo-input demo-col">
      <Input
        aria-label={t.email}
        aria-invalid={!valid || undefined}
        placeholder={t.placeholder}
        value={value}
        onValueChange={setValue}
      />
      <p className="demo-muted">{valid ? t.hint : t.error}</p>
    </div>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-input demo-col">
      <Input aria-label={t.disabled} disabled defaultValue="ana@owsem.dev" />
      <Input aria-label={t.readOnly} readOnly defaultValue="ana@owsem.dev" />
    </div>
  );
}

function Multiline({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-input">
      <Input aria-label={t.note} placeholder={t.note} render={<textarea rows={3} />} />
    </div>
  );
}

const imp = (setup: Parameters<typeof importPath>[0]) =>
  `import { Input } from "${importPath(setup, "input")}";`;

export const inputDefinition = defineComponent({
  item: "input",
  imports: ["Input"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu baris teks. Placeholder bukan nama, jadi beri aria-label atau label.",
        en: "One line of text. A placeholder is not a name, so give it an aria-label or a label.",
      },
      uses: ["Input"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "EmailInput",
          [imp(setup)],
          [`<Input aria-label="${TEXT[lang].email}" placeholder="${TEXT[lang].placeholder}" />`],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg setinggi Button dengan ukuran yang sama.",
        en: "sm, md, and lg are as tall as a Button of the same size.",
      },
      uses: ["Input"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [imp(setup)],
          SIZES.map((size) => `<Input size="${size}" aria-label="${TEXT[lang][size]}" />`),
        ),
      ],
    },
    {
      id: "icons",
      title: { id: "Ikon", en: "Icons" },
      description: {
        id: "startIcon dan endIcon menerima node apa pun; keduanya dekoratif dan membiarkan klik lewat.",
        en: "startIcon and endIcon take any node; both are decorative and let clicks through.",
      },
      uses: ["Input"],
      demo: (lang) => <Icons lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "WithIcons",
            [imp(setup), 'import { Mail, Search, UserPlus } from "lucide-react";'],
            [
              `<Input aria-label="${t.email}" startIcon={<Mail />} />`,
              `<Input aria-label="${t.search}" endIcon={<Search />} />`,
              `<Input aria-label="${t.email}" startIcon={<Mail />} endIcon={<UserPlus />} />`,
            ],
          ),
        ];
      },
    },
    {
      id: "validation",
      title: { id: "Validasi", en: "Validation" },
      description: {
        id: "aria-invalid mewarnai kolom critical dan menggetarkannya sekali; di dalam Field, Base UI yang mengaturnya.",
        en: "aria-invalid gives it the critical tint and one shake; inside a Field, Base UI sets it for you.",
      },
      uses: ["Input"],
      demo: (lang) => <Validation lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "InviteEmail",
            ['import { useState } from "react";', imp(setup)],
            [
              "<Input",
              `  aria-label="${t.email}"`,
              "  aria-invalid={!valid || undefined}",
              `  placeholder="${t.placeholder}"`,
              "  value={value}",
              "  onValueChange={setValue}",
              "/>",
              `<p>{valid ? "${t.hint}" : "${t.error}"}</p>`,
            ],
            [
              '  const [value, setValue] = useState("");',
              '  const valid = value === "" || /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value);',
            ],
          ),
        ];
      },
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled meredupkan dan melepas fokus; readOnly tetap fokus dan tampil biasa.",
        en: "disabled dims it and drops focus; readOnly keeps focus and the normal look.",
      },
      uses: ["Input"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Locked",
            [imp(setup)],
            [
              `<Input aria-label="${t.disabled}" disabled defaultValue="ana@owsem.dev" />`,
              `<Input aria-label="${t.readOnly}" readOnly defaultValue="ana@owsem.dev" />`,
            ],
          ),
        ];
      },
    },
    {
      id: "textarea",
      title: { id: "Textarea", en: "Textarea" },
      description: {
        id: "render mengganti elemennya dan mempertahankan tampilan; textarea tumbuh melewati satu baris.",
        en: "render swaps the element and keeps the look; a textarea grows past one line.",
      },
      uses: ["Input"],
      demo: (lang) => <Multiline lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Note",
          [imp(setup)],
          [`<Input aria-label="${TEXT[lang].note}" render={<textarea rows={3} />} />`],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <div className="demo-input">
        <Input
          aria-label={TEXT[lang].email}
          placeholder={TEXT[lang].placeholder}
          startIcon={<Icon name="mail" />}
          endIcon={<Icon name="user-plus" />}
        />
      </div>
    ),
  },
  // Inspect finds each part inside the first one, so the wrapper (an ancestor of the input) leads.
  parts: [
    {
      name: "Wrapper",
      selector: ".ow-input__wrapper",
      note: {
        id: "Hanya ada bila ada ikon. Tanpa tampilan: hanya menempatkan ikonnya, dan mengisi induknya.",
        en: "Only there with an icon. It has no look: it only places the icons, and fills its parent.",
      },
    },
    {
      name: "Input",
      selector: ".ow-input",
      note: {
        id: "input dari Base UI, selalu berupa kolomnya sendiri: isian 6% dari warna teks, tanpa tepi; hover 9%. Invalid mewarnainya critical 14% dan menggetarkannya sekali (kedip saat gerak dikurangi). ref, className, style, dan props native sampai ke sini.",
        en: "Base UI's input, always the field itself: a 6% tint of the text color with no edge, 9% on hover. Invalid turns it a 14% critical tint and shakes it once (a blink under reduced motion). ref, className, style, and native props land here.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Icon",
      selector: ".ow-input__icon",
      size: true,
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px, sejauh jarak atas dari tepi. Klik menembus ke input.",
        en: "startIcon or endIcon: the font size plus 2px, as far from the edge as from the top. Clicks pass to the input.",
      },
    },
  ],
});

export default function InputPage(props: ExamplePageProps) {
  return <ComponentPage definition={inputDefinition} {...props} />;
}
