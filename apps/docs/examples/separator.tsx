"use client";

import { Separator } from "owsem-ui/base";
import type { CSSProperties } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    profile: "Profil",
    profileBody: "Nama, foto, dan bio publik.",
    security: "Keamanan",
    securityBody: "Kata sandi dan sesi yang aktif.",
    states: ["Draf", "Terbit", "Arsip"],
  },
  en: {
    profile: "Profile",
    profileBody: "Name, photo, and public bio.",
    security: "Security",
    securityBody: "Password and active sessions.",
    states: ["Draft", "Published", "Archived"],
  },
} satisfies Record<Lang, unknown>;

/** Two settings with a hairline between them. */
function Sections({ lang, style }: { lang: Lang; style?: CSSProperties }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card">
      <div>
        <p className="demo-title">{t.profile}</p>
        <p className="demo-muted">{t.profileBody}</p>
      </div>
      <Separator style={style} />
      <div>
        <p className="demo-title">{t.security}</p>
        <p className="demo-muted">{t.securityBody}</p>
      </div>
    </div>
  );
}

/** Three states in a row, split by vertical hairlines. */
function States({ lang }: { lang: Lang }) {
  return (
    <div className="demo-card demo-row">
      {TEXT[lang].states.map((label, i) => (
        <span key={label} className="demo-row-item">
          {i > 0 ? <Separator orientation="vertical" /> : null}
          {label}
        </span>
      ))}
    </div>
  );
}

const sectionLines = (lang: Lang, separator: string) => {
  const t = TEXT[lang];
  return [
    "<section>",
    `  <h3>${t.profile}</h3>`,
    `  <p>${t.profileBody}</p>`,
    `  ${separator}`,
    `  <h3>${t.security}</h3>`,
    `  <p>${t.securityBody}</p>`,
    "</section>",
  ];
};

export const separatorDefinition = defineComponent({
  item: "separator",
  imports: ["Separator"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Garis tipis horizontal di antara dua bagian.",
        en: "A horizontal hairline between two sections.",
      },
      uses: ["Separator"],
      demo: (lang) => <Sections lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Settings",
          [`import { Separator } from "${importPath(setup, "separator")}";`],
          sectionLines(lang, "<Separator />"),
        ),
      ],
    },
    {
      id: "vertical",
      title: { id: "Vertikal", en: "Vertical" },
      description: {
        id: "Di dalam baris flex, garis vertikal mengisi tinggi baris dan tetap setebal 1px.",
        en: "In a flex row, a vertical hairline fills the row's height and stays 1px thick.",
      },
      uses: ["Separator"],
      demo: (lang) => <States lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Status",
          [`import { Separator } from "${importPath(setup, "separator")}";`],
          [
            '<div style={{ display: "flex", gap: 12 }}>',
            ...TEXT[lang].states.flatMap((label, i) => [
              ...(i > 0 ? ['  <Separator orientation="vertical" />'] : []),
              `  <span>${label}</span>`,
            ]),
            "</div>",
          ],
        ),
      ],
    },
    {
      id: "custom-line",
      title: { id: "Warna garis", en: "Custom line" },
      description: {
        id: "--ow-line di separator mengganti warna garisnya saja.",
        en: "--ow-line on the separator changes its line alone.",
      },
      uses: ["Separator"],
      demo: (lang) => (
        <Sections lang={lang} style={{ "--ow-line": "var(--ow-accent)" } as CSSProperties} />
      ),
      code: (setup, lang) => [
        exampleFile(
          "Settings",
          [`import { Separator } from "${importPath(setup, "separator")}";`],
          sectionLines(
            lang,
            `<Separator style={{ "--${setup.prefix}-line": "var(--${setup.prefix}-accent)" }} />`,
          ),
        ),
      ],
    },
  ],
  anatomy: {
    specimen: () => (
      <div className="demo-separator-specimen">
        <Separator />
      </div>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-separator",
      note: {
        id: "Satu garis tipis dari warna garis, digambar sebagai border. Base UI memberinya role separator.",
        en: "One hairline in the line color, drawn as a border. Base UI gives it the separator role.",
      },
      tokens: { "--ow-line": "--ow-line" },
    },
  ],
});

export default function SeparatorPage(props: ExamplePageProps) {
  return <ComponentPage definition={separatorDefinition} {...props} />;
}
