"use client";

import { Autocomplete, type AutocompleteSize, Field } from "owsem-ui/base";
import { Fragment, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    tag: "Label",
    search: "Cari label",
    placeholder: "mis. fitur",
    none: "Tidak ada saran.",
    type: "Jenis",
    area: "Area",
    suggestions: "Saran",
    tags: [
      "fitur",
      "perbaikan",
      "bug",
      "dokumentasi",
      "internal",
      "seluler",
      "aksesibilitas",
      "kinerja",
    ],
    types: ["fitur", "perbaikan", "bug"],
    areas: ["tombol", "dialog", "formulir", "navigasi"],
  },
  en: {
    tag: "Tag",
    search: "Search tags",
    placeholder: "e.g. feature",
    none: "No suggestions.",
    type: "Type",
    area: "Area",
    suggestions: "Suggestions",
    tags: ["feature", "fix", "bug", "docs", "internal", "mobile", "accessibility", "performance"],
    types: ["feature", "fix", "bug"],
    areas: ["button", "dialog", "form", "navigation"],
  },
} satisfies Record<Lang, Record<string, unknown>>;

const SIZES: readonly AutocompleteSize[] = ["sm", "md", "lg"];

const groups = (lang: Lang) => [
  { value: TEXT[lang].type, items: TEXT[lang].types },
  { value: TEXT[lang].area, items: TEXT[lang].areas },
];

type Group = ReturnType<typeof groups>[number];

/** The shortest use: an input and a popup with the suggestions. */
function Tags({
  lang,
  size,
  mode,
  label,
}: {
  lang: Lang;
  size?: AutocompleteSize;
  mode?: "both" | "inline";
  label?: string;
}) {
  const t = TEXT[lang];
  return (
    <Autocomplete.Root items={t.tags} size={size} mode={mode}>
      <Autocomplete.Input aria-label={label} placeholder={t.placeholder} />
      <Autocomplete.Popup>
        <Autocomplete.Empty>{t.none}</Autocomplete.Empty>
        <Autocomplete.List>
          {(tag: string) => (
            <Autocomplete.Item key={tag} value={tag}>
              {tag}
            </Autocomplete.Item>
          )}
        </Autocomplete.List>
      </Autocomplete.Popup>
    </Autocomplete.Root>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="tag" className="demo-combobox-field">
      <Field.Label>{TEXT[lang].search}</Field.Label>
      <Tags lang={lang} />
    </Field.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col">
      {SIZES.map((size) => (
        <div key={size} className="demo-combobox-field">
          <Tags lang={lang} size={size} label={`${TEXT[lang].tag}, ${size}`} />
        </div>
      ))}
    </div>
  );
}

function Inline({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="inline" className="demo-combobox-field">
      <Field.Label>{TEXT[lang].search}</Field.Label>
      <Tags lang={lang} mode="both" />
    </Field.Root>
  );
}

function Groups({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Field.Root name="groups" className="demo-combobox-field">
      <Field.Label>{t.search}</Field.Label>
      <Autocomplete.Root items={groups(lang)}>
        <Autocomplete.Input placeholder={t.placeholder} />
        <Autocomplete.Popup>
          <Autocomplete.Empty>{t.none}</Autocomplete.Empty>
          <Autocomplete.List>
            {(group: Group, index: number) => (
              <Fragment key={group.value}>
                {index > 0 ? <Autocomplete.Separator /> : null}
                <Autocomplete.Group items={group.items}>
                  <Autocomplete.GroupLabel>{group.value}</Autocomplete.GroupLabel>
                  <Autocomplete.Collection>
                    {(tag: string) => (
                      <Autocomplete.Item key={tag} value={tag}>
                        {tag}
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              </Fragment>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>
    </Field.Root>
  );
}

/** A Clear and a Trigger, as a Combobox has them: the input is the same free text. */
function Buttons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Field.Root name="buttons" className="demo-combobox-field">
      <Field.Label>{t.search}</Field.Label>
      <Autocomplete.Root items={t.tags} defaultValue={t.tags[0] as string}>
        <Autocomplete.InputGroup>
          <Autocomplete.Input placeholder={t.placeholder} />
          <Autocomplete.Clear />
          <Autocomplete.Trigger />
        </Autocomplete.InputGroup>
        <Autocomplete.Popup>
          <Autocomplete.Empty>{t.none}</Autocomplete.Empty>
          <Autocomplete.List>
            {(tag: string) => (
              <Autocomplete.Item key={tag} value={tag}>
                {tag}
              </Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>
    </Field.Root>
  );
}

/** The input group, a grouped list, and a separator, held open in a box of their own. */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-combobox-specimen">
      <Autocomplete.Root items={groups(lang)} defaultValue={t.tags[0] as string} open>
        <Autocomplete.InputGroup>
          <Autocomplete.Input aria-label={t.search} />
          <Autocomplete.Clear />
          <Autocomplete.Trigger />
        </Autocomplete.InputGroup>
        <Autocomplete.Portal container={box}>
          <Autocomplete.Positioner positionMethod="absolute">
            <Autocomplete.Popup inert initialFocus={false}>
              <Autocomplete.List>
                {(group: Group) => (
                  <Autocomplete.Group key={group.value} items={group.items}>
                    <Autocomplete.GroupLabel>{group.value}</Autocomplete.GroupLabel>
                    <Autocomplete.Collection>
                      {(tag: string) => (
                        <Autocomplete.Item key={tag} value={tag}>
                          {tag}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.Collection>
                    {group.value === t.type ? <Autocomplete.Separator /> : null}
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </div>
  );
}

const imp = (setup: TokenSetup, extra: string[] = []) => [
  `import { ${["Autocomplete", ...extra].join(", ")} } from "${importPath(setup, "autocomplete")}";`,
];

const FIELD_CSS = {
  name: "field.css",
  code: [".field {", "  display: grid;", "  inline-size: 18rem;", "}"].join("\n"),
};

const list = (lang: Lang) => `[${TEXT[lang].tags.map((n) => `"${n}"`).join(", ")}]`;
const indent = (lines: string[], by = 2) => lines.map((l) => `${" ".repeat(by)}${l}`);

const popup = (lang: Lang, group = false) => [
  "<Autocomplete.Popup>",
  `  <Autocomplete.Empty>${TEXT[lang].none}</Autocomplete.Empty>`,
  "  <Autocomplete.List>",
  ...(group
    ? [
        "    {(group: Group, index: number) => (",
        "      <Fragment key={group.value}>",
        "        {index > 0 ? <Autocomplete.Separator /> : null}",
        "        <Autocomplete.Group items={group.items}>",
        "          <Autocomplete.GroupLabel>{group.value}</Autocomplete.GroupLabel>",
        "          <Autocomplete.Collection>",
        "            {(tag: string) => (",
        "              <Autocomplete.Item key={tag} value={tag}>",
        "                {tag}",
        "              </Autocomplete.Item>",
        "            )}",
        "          </Autocomplete.Collection>",
        "        </Autocomplete.Group>",
        "      </Fragment>",
        "    )}",
      ]
    : [
        "    {(tag: string) => (",
        "      <Autocomplete.Item key={tag} value={tag}>",
        "        {tag}",
        "      </Autocomplete.Item>",
        "    )}",
      ]),
  "  </Autocomplete.List>",
  "</Autocomplete.Popup>",
];

const plain = (lang: Lang, props = "", size?: AutocompleteSize, label?: string) => [
  `<Autocomplete.Root items={tags}${props}${size ? ` size="${size}"` : ""}>`,
  `  <Autocomplete.Input${label ? ` aria-label="${label}"` : ""} placeholder="${TEXT[lang].placeholder}" />`,
  ...indent(popup(lang)),
  "</Autocomplete.Root>",
];

const field = (lang: Lang, name: string, inner: string[]) => [
  `<Field.Root name="${name}" className="field">`,
  `  <Field.Label>${TEXT[lang].search}</Field.Label>`,
  ...indent(inner),
  "</Field.Root>",
];

export const autocompleteDefinition = defineComponent({
  item: "autocomplete",
  imports: ["Autocomplete"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Input dan Popup berisi saran. Nilainya teks bebas: memilih saran mengisi input, dan teks yang tidak ada di daftar tetap sah. Empty bicara saat tidak ada yang cocok.",
        en: "An input and a Popup of suggestions. The value is free text: picking a suggestion fills the input, and text that is not in the list is fine. Empty speaks when nothing matches.",
      },
      uses: ["Autocomplete", "Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("TagSearch", imp(setup, ["Field"]), field(lang, "tag", plain(lang)), [
          `  const tags = ${list(lang)};`,
        ]),
        FIELD_CSS,
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Root mengatur font input dan item: 13, 14, atau 16px; tingginya sama dengan Input.",
        en: "size on the Root sets the input's and the items' type scale: 13, 14, or 16px; it is as tall as an Input.",
      },
      uses: ["Autocomplete"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) => plain(lang, "", size, `${TEXT[lang].tag}, ${size}`)),
          [`  const tags = ${list(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "inline",
      title: { id: "Sebaris", en: "Inline" },
      description: {
        id: 'mode="both" menyaring daftar dan mengisi input dengan saran yang disorot saat panah ditekan; "inline" hanya mengisi, tanpa menyaring.',
        en: 'mode="both" filters the list and fills the input with the highlighted suggestion as the arrows move; "inline" only fills it, without filtering.',
      },
      uses: ["Autocomplete", "Field"],
      demo: (lang) => <Inline lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "InlineTagSearch",
          imp(setup, ["Field"]),
          field(lang, "inline", plain(lang, ' mode="both"')),
          [`  const tags = ${list(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "groups",
      title: { id: "Grup", en: "Groups" },
      description: {
        id: "Saran dikelompokkan dengan Group dan GroupLabel, dengan Separator di antara grup; menyaring membuang grup yang tidak punya yang cocok.",
        en: "Suggestions grouped with Group and GroupLabel and a Separator between the groups; filtering drops a group with no match.",
      },
      uses: ["Autocomplete", "Field"],
      demo: (lang) => <Groups lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "GroupedTagSearch",
          [...imp(setup, ["Field"]), 'import { Fragment } from "react";'],
          field(lang, "groups", [
            "<Autocomplete.Root items={groups}>",
            `  <Autocomplete.Input placeholder="${TEXT[lang].placeholder}" />`,
            ...indent(popup(lang, true)),
            "</Autocomplete.Root>",
          ]),
          [
            "  type Group = { value: string; items: string[] };",
            `  const groups: Group[] = ${JSON.stringify(groups(lang))};`,
          ],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "buttons",
      title: { id: "Tombol", en: "Buttons" },
      description: {
        id: "Di dalam InputGroup, Clear dan Trigger ada seperti pada Combobox: Clear mengosongkan teks, Trigger membuka daftar.",
        en: "In an InputGroup, a Clear and a Trigger work as in a Combobox: Clear empties the text, Trigger opens the list.",
      },
      uses: ["Autocomplete", "Field"],
      demo: (lang) => <Buttons lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "TagSearchWithButtons",
          imp(setup, ["Field"]),
          field(lang, "buttons", [
            `<Autocomplete.Root items={tags} defaultValue="${TEXT[lang].tags[0]}">`,
            "  <Autocomplete.InputGroup>",
            `    <Autocomplete.Input placeholder="${TEXT[lang].placeholder}" />`,
            "    <Autocomplete.Clear />",
            "    <Autocomplete.Trigger />",
            "  </Autocomplete.InputGroup>",
            ...indent(popup(lang)),
            "</Autocomplete.Root>",
          ]),
          [`  const tags = ${list(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-combobox-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state dan membagikan size. Inspect menandai kotak yang memuat bidang dan popupnya.",
        en: "Renders no element: it holds the state and shares size. Inspect outlines the box that holds the field and its popup.",
      },
    },
    {
      name: "InputGroup",
      selector: ".ow-combobox__input-group",
      note: {
        id: "Bidang yang memuat input, Clear, dan Trigger; digambar seperti Input. Tanpanya, Input sendiri yang menjadi bidang.",
        en: "The field that holds the input, Clear, and Trigger, drawn as Input is. Without it, the Input is the field.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "Input",
      selector: ".ow-combobox__input",
      note: {
        id: "Isian teks dengan teks bebas sebagai nilainya.",
        en: "The text field, with free text as its value.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Clear",
      selector: ".ow-combobox__clear",
      note: {
        id: "Persegi datar yang mengosongkan teks; menggambar × dan hanya tampil selama ada teks.",
        en: "A flat square that empties the text; it draws an × and shows only while there is text.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Trigger",
      selector: ".ow-combobox__trigger",
      note: {
        id: "Persegi datar yang membuka dan menutup daftar; tanpa children ia menggambar Icon chevron.",
        en: "A flat square that opens and shuts the list; without children it draws the chevron Icon.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Icon",
      selector: ".ow-combobox__icon",
      note: { id: "Chevron sebesar ikon.", en: "A chevron, icon-sized." },
      size: true,
    },
    {
      name: "Popup",
      selector: ".ow-combobox__popup",
      note: {
        id: "Panel yang sama dengan Combobox dan Select: material raised dengan bayangan popup.",
        en: "The same panel as Combobox and Select: the raised material with the popup shadow.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_popup-shadow",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-select__group-label",
      note: {
        id: "Nama grup sebagai judul: huruf kapital kecil, muted, dengan jarak huruf.",
        en: "A group's name as a heading: small, muted capitals with tracking.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Item",
      selector: ".ow-combobox__item",
      note: {
        id: "Saran: datar, dinyalakan Glide, mengikuti panah keyboard. Menekannya mengisi input.",
        en: "A suggestion: flat, lit by Glide, following the arrow keys. Pressing it fills the input.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
    {
      name: "Separator",
      selector: ".ow-select__separator",
      note: { id: "Garis tipis di antara grup.", en: "A hairline between groups." },
      tokens: { "--ow-line": "--ow-line" },
    },
  ],
});

export default function AutocompletePage(props: ExamplePageProps) {
  return <ComponentPage definition={autocompleteDefinition} {...props} />;
}
