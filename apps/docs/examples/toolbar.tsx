"use client";

import { Toggle, Toolbar, type ToolbarSize } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    toolbar: "Format",
    text: "Teks",
    history: "Riwayat",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    redo: "Ulangi",
    help: "Bantuan",
    find: "Cari",
    sample: "Toolbar ini memformat baris ini.",
  },
  en: {
    toolbar: "Formatting",
    text: "Text",
    history: "History",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    redo: "Redo",
    help: "Help",
    find: "Find",
    sample: "The toolbar formats this line.",
  },
} satisfies Record<Lang, Record<string, string>>;

type Format = "bold" | "italic" | "underline";
const FORMATS: readonly Format[] = ["bold", "italic", "underline"];
const SIZES: readonly ToolbarSize[] = ["sm", "md", "lg"];

/** The editor's toolbar over a line of text that follows its toggles. */
function Editor({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [format, setFormat] = useState<Record<Format, boolean>>({
    bold: true,
    italic: false,
    underline: false,
  });
  const style: CSSProperties = {
    fontWeight: format.bold ? 600 : undefined,
    fontStyle: format.italic ? "italic" : undefined,
    textDecorationLine: format.underline ? "underline" : undefined,
  };
  return (
    <div className="demo-editor">
      <Toolbar.Root aria-label={t.toolbar}>
        <Toolbar.Group aria-label={t.text}>
          {FORMATS.map((key) => (
            <Toolbar.Button
              key={key}
              render={
                <Toggle
                  pressed={format[key]}
                  onPressedChange={(on) => setFormat((current) => ({ ...current, [key]: on }))}
                />
              }
              aria-label={t[key]}
              startIcon={<Icon name={key} />}
            />
          ))}
        </Toolbar.Group>
        <Toolbar.Separator />
        <Toolbar.Group aria-label={t.history}>
          <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
          <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} disabled />
        </Toolbar.Group>
      </Toolbar.Root>
      <p className="demo-editor-text" style={style}>
        {t.sample}
      </p>
    </div>
  );
}

function Sized({ lang, size }: { lang: Lang; size: ToolbarSize }) {
  const t = TEXT[lang];
  return (
    <Toolbar.Root aria-label={`${t.toolbar}, ${size}`} size={size}>
      <Toolbar.Button
        render={<Toggle defaultPressed />}
        aria-label={t.bold}
        startIcon={<Icon name="bold" />}
      />
      <Toolbar.Button
        render={<Toggle />}
        aria-label={t.italic}
        startIcon={<Icon name="italic" />}
      />
      <Toolbar.Separator />
      <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
      <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} disabled />
    </Toolbar.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-toggle-stack">
      {SIZES.map((size) => (
        <Sized key={size} lang={lang} size={size} />
      ))}
    </div>
  );
}

function Vertical({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Toolbar.Root aria-label={t.toolbar} orientation="vertical">
      <Toolbar.Button
        render={<Toggle defaultPressed />}
        aria-label={t.bold}
        startIcon={<Icon name="bold" />}
      />
      <Toolbar.Button
        render={<Toggle />}
        aria-label={t.italic}
        startIcon={<Icon name="italic" />}
      />
      <Toolbar.Separator />
      <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
      <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} disabled />
    </Toolbar.Root>
  );
}

function LinkAndField({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Toolbar.Root aria-label={t.toolbar}>
      <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
      <Toolbar.Button aria-label={t.redo} startIcon={<Icon name="redo-2" />} />
      <Toolbar.Separator />
      <Toolbar.Link
        href="#help"
        aria-label={t.help}
        startIcon={<Icon name="circle-help" />}
        onClick={(event) => event.preventDefault()}
      />
      <Toolbar.Input aria-label={t.find} placeholder={t.find} style={{ inlineSize: "7em" }} />
    </Toolbar.Root>
  );
}

/** Toolbar (and Toggle, when an item renders one) from the package, or from the CLI's copies. */
const imports = (setup: TokenSetup, icons: string[], toggle: boolean) => [
  ...(isDefaultSetup(setup)
    ? [`import { ${toggle ? "Toggle, " : ""}Toolbar } from "owsem-ui/base";`]
    : [
        ...(toggle ? ['import { Toggle } from "@/components/owsem/toggle";'] : []),
        'import { Toolbar } from "@/components/owsem/toolbar";',
      ]),
  `import { ${icons.join(", ")} } from "lucide-react";`,
];

const toggle = (lang: Lang, key: Format, props = "") => [
  "<Toolbar.Button",
  `  render={<Toggle${props} />}`,
  `  aria-label="${TEXT[lang][key]}"`,
  `  startIcon={<${NAMES[key]} />}`,
  "/>",
];

const NAMES = { bold: "Bold", italic: "Italic", underline: "Underline" } as const;

const button = (lang: Lang, key: "undo" | "redo", props = "") =>
  `<Toolbar.Button aria-label="${TEXT[lang][key]}" startIcon={<${key === "undo" ? "Undo2" : "Redo2"} />}${props} />`;

/** Bold on, Italic off, a separator, Undo and a disabled Redo: the toolbar of three examples. */
const basic = (lang: Lang, rootProps = "") => [
  `<Toolbar.Root aria-label="${TEXT[lang].toolbar}"${rootProps}>`,
  ...toggle(lang, "bold", " defaultPressed").map((line) => `  ${line}`),
  ...toggle(lang, "italic").map((line) => `  ${line}`),
  "  <Toolbar.Separator />",
  `  ${button(lang, "undo")}`,
  `  ${button(lang, "redo", " disabled")}`,
  "</Toolbar.Root>",
];

export const toolbarDefinition = defineComponent({
  item: "toolbar",
  imports: ["Toolbar", "Toggle"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Toggle dan tombol dalam grup, dipisah garis; teks di bawahnya mengikuti toggle.",
        en: "Toggles and buttons in groups, split by a hairline; the line below follows the toggles.",
      },
      uses: ["Toolbar", "Toggle"],
      demo: (lang) => <Editor lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "EditorToolbar",
            [
              'import { useState } from "react";',
              ...imports(setup, ["Bold", "Italic", "Redo2", "Underline", "Undo2"], true),
            ],
            [
              `<Toolbar.Root aria-label="${t.toolbar}">`,
              `  <Toolbar.Group aria-label="${t.text}">`,
              ...FORMATS.flatMap((key) => [
                "    <Toolbar.Button",
                `      render={<Toggle pressed={${key}} onPressedChange={set${NAMES[key]}} />}`,
                `      aria-label="${t[key]}"`,
                `      startIcon={<${NAMES[key]} />}`,
                "    />",
              ]),
              "  </Toolbar.Group>",
              "  <Toolbar.Separator />",
              `  <Toolbar.Group aria-label="${t.history}">`,
              `    ${button(lang, "undo")}`,
              `    ${button(lang, "redo", " disabled")}`,
              "  </Toolbar.Group>",
              "</Toolbar.Root>",
              "<p",
              "  style={{",
              "    fontWeight: bold ? 600 : undefined,",
              '    fontStyle: italic ? "italic" : undefined,',
              '    textDecorationLine: underline ? "underline" : undefined,',
              "  }}",
              ">",
              `  ${t.sample}`,
              "</p>",
            ],
            [
              "  const [bold, setBold] = useState(true);",
              "  const [italic, setItalic] = useState(false);",
              "  const [underline, setUnderline] = useState(false);",
            ],
          ),
        ];
      },
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Root mengatur semua item: sm, md, atau lg. Bar setinggi Button seukuran itu.",
        en: "size on the Root sets every item: sm, md, or lg. The bar is as tall as a Button of that size.",
      },
      uses: ["Toolbar", "Toggle"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imports(setup, ["Bold", "Italic", "Redo2", "Undo2"], true),
          SIZES.flatMap((size) => basic(lang, ` size="${size}"`)),
        ),
      ],
    },
    {
      id: "vertical",
      title: { id: "Vertikal", en: "Vertical" },
      description: {
        id: 'orientation="vertical" menumpuk item; panah atas dan bawah berpindah, dan garis memotong ke samping.',
        en: 'orientation="vertical" stacks the items; Up and Down move between them, and the hairline turns across.',
      },
      uses: ["Toolbar", "Toggle"],
      demo: (lang) => <Vertical lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "VerticalToolbar",
          imports(setup, ["Bold", "Italic", "Redo2", "Undo2"], true),
          basic(lang, ' orientation="vertical"'),
        ),
      ],
    },
    {
      id: "link-and-field",
      title: { id: "Link dan field", en: "Link and field" },
      description: {
        id: "Toolbar.Link dan Toolbar.Input ikut urutan panah; taruh field di akhir.",
        en: "Toolbar.Link and Toolbar.Input join the arrow-key order; put the field last.",
      },
      uses: ["Toolbar"],
      demo: (lang) => <LinkAndField lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("SearchToolbar", imports(setup, ["CircleHelp", "Redo2", "Undo2"], false), [
            `<Toolbar.Root aria-label="${t.toolbar}">`,
            `  ${button(lang, "undo")}`,
            `  ${button(lang, "redo")}`,
            "  <Toolbar.Separator />",
            `  <Toolbar.Link href="/help" aria-label="${t.help}" startIcon={<CircleHelp />} />`,
            `  <Toolbar.Input aria-label="${t.find}" placeholder="${t.find}" />`,
            "</Toolbar.Root>",
          ]),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => {
      const t = TEXT[lang];
      return (
        <Toolbar.Root aria-label={t.toolbar}>
          <Toolbar.Group aria-label={t.text}>
            <Toolbar.Button
              render={<Toggle defaultPressed />}
              aria-label={t.bold}
              startIcon={<Icon name="bold" />}
            />
            <Toolbar.Button aria-label={t.undo} startIcon={<Icon name="undo-2" />} />
          </Toolbar.Group>
          <Toolbar.Link href="#help" aria-label={t.help} startIcon={<Icon name="circle-help" />} />
          <Toolbar.Separator />
          <Toolbar.Input aria-label={t.find} placeholder={t.find} style={{ inlineSize: "5em" }} />
        </Toolbar.Root>
      );
    },
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-toolbar",
      note: {
        id: "div role=toolbar di atas material panel dengan bayangan permukaan: satu perhentian Tab, lalu tombol panah.",
        en: "A div with role=toolbar on the panel material with the surface shadow: one Tab stop, then arrow keys.",
      },
      tokens: { "--ow-panel": "--_bg", "--ow-surface-shadow": "--_shadow" },
    },
    {
      name: "Group",
      selector: ".ow-toolbar__group",
      note: {
        id: "Item yang satu kelompok, dengan role=group dan namanya sendiri.",
        en: "Items that belong together, with role=group and a name of their own.",
      },
    },
    {
      name: "Toggle",
      selector: ".ow-toolbar__button.ow-toggle",
      note: {
        id: "Button yang dirender sebagai Toggle: perilaku dan tampilan Toggle, navigasi toolbar.",
        en: "A Button rendered as a Toggle: Toggle's behavior and look, the toolbar's navigation.",
      },
    },
    {
      name: "Button",
      selector: ".ow-toolbar__button:not(.ow-toggle)",
      note: {
        id: "Tombol ghost yang tenang, dengan geometri Button. Tetap bisa difokus saat disabled.",
        en: "A quiet ghost button with Button's geometry. Still focusable while disabled.",
      },
      tokens: {
        "--ow-muted": "--_muted",
        "--ow-fg": "--_fg",
        "--ow-hover": "--_hover",
        "--ow-pressed-bg": "--_pressed-bg",
      },
    },
    {
      name: "Icon",
      selector: ".ow-toolbar__button:not(.ow-toggle) .ow-toolbar__icon",
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px. Tanpa label, itemnya persegi.",
        en: "startIcon or endIcon: the font size plus 2px. Without a label, the item is square.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-toolbar__separator",
      note: {
        id: "Garis tipis di antara grup, melintang arah toolbar.",
        en: "A hairline between groups, across the toolbar's direction.",
      },
      tokens: { "--ow-line": "--ow-line" },
    },
    {
      name: "Link",
      selector: ".ow-toolbar__link",
      note: {
        id: "Link yang tampil seperti tombol toolbar, ikut navigasi panah.",
        en: "A link that looks like the toolbar's buttons, in the arrow-key order.",
      },
    },
    {
      name: "Input",
      selector: ".ow-toolbar__input",
      note: {
        id: "Field dengan isian 6% dari warna teks tanpa tepi (9% saat hover), setinggi tombol. Panah menggeser caret dulu, jadi letakkan di akhir.",
        en: "A field with a 6% tint of the text color and no edge (9% on hover), as tall as the buttons. Arrows move the caret first, so put it last.",
      },
      tokens: { "--ow-fg": "--_bg" },
    },
  ],
});

export default function ToolbarPage(props: ExamplePageProps) {
  return <ComponentPage definition={toolbarDefinition} {...props} />;
}
