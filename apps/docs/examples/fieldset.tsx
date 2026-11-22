"use client";

import { Field, Fieldset, Switch } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    billing: "Alamat penagihan",
    same: "Sama dengan alamat kirim",
    street: "Jalan",
    city: "Kota",
    postal: "Kode pos",
  },
  en: {
    billing: "Billing address",
    same: "Same as shipping",
    street: "Street",
    city: "City",
    postal: "Postal code",
  },
} satisfies Record<Lang, Record<string, string>>;

/** The group's fields; the address never changes, so every demo reads the same. */
function Fields({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Field.Root>
        <Field.Label>{t.street}</Field.Label>
        <Field.Control defaultValue="Jl. Melati 12" />
      </Field.Root>
      <Field.Root>
        <Field.Label>{t.city}</Field.Label>
        <Field.Control defaultValue="Bandung" />
      </Field.Root>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Fieldset.Root className="demo-fieldset">
      <Fieldset.Legend>{TEXT[lang].billing}</Fieldset.Legend>
      <Fields lang={lang} />
    </Fieldset.Root>
  );
}

function Disabled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [same, setSame] = useState(true);
  return (
    <div className="demo-fieldset demo-col">
      <label className="demo-switch-row">
        {t.same}
        <Switch.Root checked={same} onCheckedChange={setSame} />
      </label>
      <Fieldset.Root disabled={same}>
        <Fieldset.Legend>{t.billing}</Fieldset.Legend>
        <Fields lang={lang} />
      </Fieldset.Root>
    </div>
  );
}

function Columns({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Fieldset.Root className="demo-fieldset demo-fieldset-columns">
      <Fieldset.Legend>{t.billing}</Fieldset.Legend>
      <Field.Root>
        <Field.Label>{t.city}</Field.Label>
        <Field.Control defaultValue="Bandung" />
      </Field.Root>
      <Field.Root>
        <Field.Label>{t.postal}</Field.Label>
        <Field.Control defaultValue="40115" />
      </Field.Root>
    </Fieldset.Root>
  );
}

function Heading({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Fieldset.Root className="demo-fieldset">
      {/* biome-ignore lint/a11y/useHeadingContent: Legend fills the heading with its children */}
      <Fieldset.Legend render={<h3 />}>{t.billing}</Fieldset.Legend>
      <Fields lang={lang} />
    </Fieldset.Root>
  );
}

const imports = (setup: TokenSetup, extra: string[] = []) => [
  `import { Fieldset } from "${importPath(setup, "fieldset")}";`,
  `import { Field } from "${importPath(setup, "field")}";`,
  ...extra,
];

const fields = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    "<Field.Root>",
    `  <Field.Label>${t.street}</Field.Label>`,
    '  <Field.Control defaultValue="Jl. Melati 12" />',
    "</Field.Root>",
    "<Field.Root>",
    `  <Field.Label>${t.city}</Field.Label>`,
    '  <Field.Control defaultValue="Bandung" />',
    "</Field.Root>",
  ];
};

const indent = (lines: string[]) => lines.map((line) => `  ${line}`);

export const fieldsetDefinition = defineComponent({
  item: "fieldset",
  imports: ["Fieldset"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu legend menamai grup field; pembaca layar mengumumkannya saat fokus masuk.",
        en: "One legend names a group of fields; a screen reader announces it as focus enters.",
      },
      uses: ["Fieldset", "Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Billing", imports(setup), [
          "<Fieldset.Root>",
          `  <Fieldset.Legend>${TEXT[lang].billing}</Fieldset.Legend>`,
          ...indent(fields(lang)),
          "</Fieldset.Root>",
        ]),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "Satu disabled pada Root menonaktifkan setiap kontrol di dalamnya.",
        en: "One disabled on the root turns off every control inside.",
      },
      uses: ["Fieldset", "Field", "Switch"],
      demo: (lang) => <Disabled lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SameAsShipping",
          [
            'import { useState } from "react";',
            ...imports(setup, [`import { Switch } from "${importPath(setup, "switch")}";`]),
          ],
          [
            "<label>",
            `  ${TEXT[lang].same}`,
            "  <Switch.Root checked={same} onCheckedChange={setSame} />",
            "</label>",
            "<Fieldset.Root disabled={same}>",
            `  <Fieldset.Legend>${TEXT[lang].billing}</Fieldset.Legend>`,
            ...indent(fields(lang)),
            "</Fieldset.Root>",
          ],
          ["  const [same, setSame] = useState(true);"],
        ),
      ],
    },
    {
      id: "columns",
      title: { id: "Kolom", en: "Columns" },
      description: {
        id: "Tata letak adalah CSS Anda: className menang atas nilai bawaan tanpa !important.",
        en: "Layout is your CSS: a className wins over the defaults with no !important.",
      },
      uses: ["Fieldset", "Field"],
      demo: (lang) => <Columns lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("BillingColumns", imports(setup), [
            '<Fieldset.Root className="billing">',
            `  <Fieldset.Legend>${t.billing}</Fieldset.Legend>`,
            "  <Field.Root>",
            `    <Field.Label>${t.city}</Field.Label>`,
            '    <Field.Control defaultValue="Bandung" />',
            "  </Field.Root>",
            "  <Field.Root>",
            `    <Field.Label>${t.postal}</Field.Label>`,
            '    <Field.Control defaultValue="40115" />',
            "  </Field.Root>",
            "</Fieldset.Root>",
          ]),
          {
            name: "billing.css",
            code: [
              ".billing {",
              "  display: grid;",
              "  grid-template-columns: 1fr 1fr;",
              "  gap: 0.75em;",
              "}",
              "",
              ".billing > .ow-fieldset__legend {",
              "  grid-column: 1 / -1;",
              "}",
            ].join("\n"),
          },
        ];
      },
    },
    {
      id: "heading",
      title: { id: "Judul", en: "Heading" },
      description: {
        id: "render menukar elemen legend menjadi judul tanpa mengubah namanya untuk grup.",
        en: "render swaps the legend's element for a heading, and it still names the group.",
      },
      uses: ["Fieldset", "Field"],
      demo: (lang) => <Heading lang={lang} />,
      code: (setup, lang) => [
        exampleFile("BillingHeading", imports(setup), [
          "<Fieldset.Root>",
          `  <Fieldset.Legend render={<h3 />}>${TEXT[lang].billing}</Fieldset.Legend>`,
          ...indent(fields(lang)),
          "</Fieldset.Root>",
        ]),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Fieldset.Root className="demo-fieldset">
        <Fieldset.Legend>{TEXT[lang].billing}</Fieldset.Legend>
        <Fields lang={lang} />
      </Fieldset.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-fieldset",
      note: {
        id: "fieldset dari Base UI: satu kolom dengan jarak yang sama, tanpa bingkai dan tanpa margin luar.",
        en: "Base UI's fieldset: one column with even gaps, no frame, and no outer margins.",
      },
    },
    {
      name: "Legend",
      selector: ".ow-fieldset__legend",
      note: {
        id: "Menamai grup lewat aria-labelledby, dengan jarak 0.75em ke field pertama; tanpa garis.",
        en: "Names the group through aria-labelledby, with a 0.75em gap before the first field; no line.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
  ],
});

export default function FieldsetPage(props: ExamplePageProps) {
  return <ComponentPage definition={fieldsetDefinition} {...props} />;
}
