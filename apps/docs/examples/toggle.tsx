"use client";

import { Toggle, type ToggleSize } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    pin: "Sematkan",
    pinned: "Disematkan",
    unpinned: "Tidak disematkan",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    format: "Format teks",
    sample: "Peluncuran pindah ke Jumat.",
    off: "Mati",
    on: "Menyala",
    disabled: "Nonaktif",
  },
  en: {
    pin: "Pin",
    pinned: "Pinned",
    unpinned: "Not pinned",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    format: "Text format",
    sample: "Launch moves to Friday.",
    off: "Off",
    on: "On",
    disabled: "Disabled",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly ToggleSize[] = ["sm", "md", "lg"];
type Format = "bold" | "italic" | "underline";
const FORMATS: readonly Format[] = ["bold", "italic", "underline"];

function Default({ lang }: { lang: Lang }) {
  return (
    <Toggle startIcon={<Icon name="pin" />} defaultPressed>
      {TEXT[lang].pin}
    </Toggle>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-buttons">
      {SIZES.map((size) => (
        <Toggle key={size} size={size} startIcon={<Icon name="pin" />} defaultPressed>
          {TEXT[lang].pin}
        </Toggle>
      ))}
    </div>
  );
}

function Solid({ lang }: { lang: Lang }) {
  return (
    <div className="demo-buttons">
      <Toggle variant="solid" startIcon={<Icon name="pin" />} defaultPressed>
        {TEXT[lang].pin}
      </Toggle>
      <Toggle variant="solid" startIcon={<Icon name="pin" />}>
        {TEXT[lang].pin}
      </Toggle>
    </div>
  );
}

function Formatting({ lang }: { lang: Lang }) {
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
    <div className="demo-toggle-stack">
      <fieldset className="demo-toggle-row">
        <legend className="visually-hidden">{t.format}</legend>
        {FORMATS.map((key) => (
          <Toggle
            key={key}
            aria-label={t[key]}
            startIcon={<Icon name={key} />}
            pressed={format[key]}
            onPressedChange={(on) => setFormat((current) => ({ ...current, [key]: on }))}
          />
        ))}
      </fieldset>
      <p style={style}>{t.sample}</p>
    </div>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-buttons">
      <Toggle startIcon={<Icon name="pin" />} disabled>
        {t.pin}
      </Toggle>
      <Toggle startIcon={<Icon name="pin" />} disabled defaultPressed>
        {t.pin}
      </Toggle>
    </div>
  );
}

function Controlled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [on, setOn] = useState(false);
  return (
    <div className="demo-toggle-stack">
      <Toggle startIcon={<Icon name="pin" />} pressed={on} onPressedChange={setOn}>
        {t.pin}
      </Toggle>
      <p className="demo-muted">{on ? t.pinned : t.unpinned}</p>
    </div>
  );
}

const pin = (lang: Lang, props = "") =>
  `<Toggle${props} startIcon={<Pin />}>${TEXT[lang].pin}</Toggle>`;

export const toggleDefinition = defineComponent({
  item: "toggle",
  imports: ["Toggle"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Tombol dua state dengan ikon dan label; Toggle menyimpan sendiri statenya.",
        en: "A two-state button with an icon and a label; the Toggle keeps its own state.",
      },
      uses: ["Toggle"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "PinButton",
          [
            `import { Toggle } from "${importPath(setup, "toggle")}";`,
            'import { Pin } from "lucide-react";',
          ],
          [pin(lang, " defaultPressed")],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg memakai ukuran font dan tinggi Button.",
        en: "sm, md, and lg use Button's font sizes and heights.",
      },
      uses: ["Toggle"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [
            `import { Toggle } from "${importPath(setup, "toggle")}";`,
            'import { Pin } from "lucide-react";',
          ],
          SIZES.map((size) => pin(lang, ` size="${size}" defaultPressed`)),
        ),
      ],
    },
    {
      id: "solid",
      title: { id: "Solid", en: "Solid" },
      description: {
        id: 'variant="solid" mengisi toggle yang menyala dengan warna aksen, seperti Button utama.',
        en: 'variant="solid" fills an on toggle with the accent, like the primary Button.',
      },
      uses: ["Toggle"],
      demo: (lang) => <Solid lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SolidToggles",
          [
            `import { Toggle } from "${importPath(setup, "toggle")}";`,
            'import { Pin } from "lucide-react";',
          ],
          [pin(lang, ' variant="solid" defaultPressed'), pin(lang, ' variant="solid"')],
        ),
      ],
    },
    {
      id: "icon",
      title: { id: "Hanya ikon", en: "Icon only" },
      description: {
        id: "Tanpa children, Toggle menjadi persegi dan butuh aria-label.",
        en: "Without children a Toggle is square, and needs an aria-label.",
      },
      uses: ["Toggle"],
      demo: (lang) => <Formatting lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "TextFormat",
            [
              'import { useState } from "react";',
              `import { Toggle } from "${importPath(setup, "toggle")}";`,
              'import { Bold, Italic, Underline } from "lucide-react";',
            ],
            [
              `<fieldset>`,
              `  <legend className="visually-hidden">${t.format}</legend>`,
              `  <Toggle aria-label="${t.bold}" startIcon={<Bold />} pressed={bold} onPressedChange={setBold} />`,
              `  <Toggle aria-label="${t.italic}" startIcon={<Italic />} />`,
              `  <Toggle aria-label="${t.underline}" startIcon={<Underline />} />`,
              `</fieldset>`,
              `<p style={{ fontWeight: bold ? 600 : undefined }}>${t.sample}</p>`,
            ],
            ["  const [bold, setBold] = useState(true);"],
          ),
        ];
      },
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled meredupkan toggle dan mengabaikan tekanan, mati maupun menyala.",
        en: "disabled dims the toggle and ignores presses, off or on.",
      },
      uses: ["Toggle"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Locked",
          [
            `import { Toggle } from "${importPath(setup, "toggle")}";`,
            'import { Pin } from "lucide-react";',
          ],
          [pin(lang, " disabled"), pin(lang, " disabled defaultPressed")],
        ),
      ],
    },
    {
      id: "controlled",
      title: { id: "Terkontrol", en: "Controlled" },
      description: {
        id: "pressed dan onPressedChange menyimpan state di komponen Anda.",
        en: "pressed and onPressedChange keep the state in your component.",
      },
      uses: ["Toggle"],
      demo: (lang) => <Controlled lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Controlled",
          [
            'import { useState } from "react";',
            `import { Toggle } from "${importPath(setup, "toggle")}";`,
            'import { Pin } from "lucide-react";',
          ],
          [
            pin(lang, " pressed={on} onPressedChange={setOn}"),
            `<p>{on ? "${TEXT[lang].pinned}" : "${TEXT[lang].unpinned}"}</p>`,
          ],
          ["  const [on, setOn] = useState(false);"],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Toggle startIcon={<Icon name="pin" />} defaultPressed>
        {TEXT[lang].pin}
      </Toggle>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-toggle",
      note: {
        id: "button dari Base UI, dengan aria-pressed. Datar saat mati; saat menyala tint aksen 14% dengan teks aksen (18% hover, 22% ditekan), atau dengan variant solid, isian aksen seperti Button utama.",
        en: "Base UI's button, with aria-pressed. Flat while off; while on, a 14% tint of the accent with accent text (18% on hover, 22% held), or with variant solid, the accent fill of the primary Button.",
      },
      tokens: {
        "--ow-muted": "--_muted",
        "--ow-fg": "--_fg",
        "--ow-hover": "--_hover",
        "--ow-accent": "--_on-bg",
      },
    },
    {
      name: "Icon",
      selector: ".ow-toggle__icon",
      size: true,
      note: {
        id: "startIcon atau endIcon: ukuran font ditambah 2px, sejauh jarak atas dari tepi.",
        en: "startIcon or endIcon: the font size plus 2px, as far from the edge as from the top.",
      },
    },
  ],
});

export default function TogglePage(props: ExamplePageProps) {
  return <ComponentPage definition={toggleDefinition} {...props} />;
}
