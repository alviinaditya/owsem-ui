"use client";

import { Radio, RadioGroup, type RadioGroupSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const OPTIONS = ["standard", "express", "pickup"] as const;
type Option = (typeof OPTIONS)[number];
const PAIR: readonly Option[] = ["standard", "express"];
const SIZES: readonly RadioGroupSize[] = ["sm", "md", "lg"];

const TEXT = {
  id: {
    delivery: "Pengiriman",
    standard: "Reguler",
    express: "Kilat",
    pickup: "Ambil di toko",
    disabled: "Nonaktif",
    readOnly: "Hanya baca",
    invalid: "Invalid",
    arrives: {
      standard: "Tiba dalam 3 sampai 5 hari.",
      express: "Tiba besok pagi.",
      pickup: "Siap diambil hari ini.",
    },
  },
  en: {
    delivery: "Delivery",
    standard: "Standard",
    express: "Express",
    pickup: "Pick up in store",
    disabled: "Disabled",
    readOnly: "Read-only",
    invalid: "Invalid",
    arrives: {
      standard: "Arrives in 3 to 5 days.",
      express: "Arrives tomorrow morning.",
      pickup: "Ready to collect today.",
    },
  },
} satisfies Record<Lang, unknown>;

/** The options as rows: a label around a radio, optionally with a glyph of your own. */
function Rows({
  lang,
  options = OPTIONS,
  check,
  invalid,
}: {
  lang: Lang;
  options?: readonly Option[];
  check?: boolean;
  invalid?: boolean;
}) {
  return options.map((value) => (
    <label key={value}>
      <Radio.Root value={value} aria-invalid={invalid || undefined}>
        {check ? (
          <Radio.Indicator>
            <Icon name="check" />
          </Radio.Indicator>
        ) : undefined}
      </Radio.Root>
      {TEXT[lang][value]}
    </label>
  ));
}

function Default({ lang }: { lang: Lang }) {
  return (
    <RadioGroup aria-label={TEXT[lang].delivery} defaultValue="standard">
      <Rows lang={lang} />
    </RadioGroup>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-radio-set">
      {SIZES.map((size) => (
        <RadioGroup
          key={size}
          aria-label={`${TEXT[lang].delivery}, ${size}`}
          size={size}
          defaultValue="standard"
        >
          <Rows lang={lang} options={PAIR} />
        </RadioGroup>
      ))}
    </div>
  );
}

function Across({ lang }: { lang: Lang }) {
  return (
    <RadioGroup
      aria-label={TEXT[lang].delivery}
      className="demo-radio-group-across"
      defaultValue="express"
    >
      <Rows lang={lang} />
    </RadioGroup>
  );
}

function Controlled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [value, setValue] = useState<Option>("standard");
  return (
    <div className="demo-col">
      <RadioGroup aria-label={t.delivery} value={value} onValueChange={setValue}>
        <Rows lang={lang} />
      </RadioGroup>
      <p className="demo-muted">{t.arrives[value]}</p>
    </div>
  );
}

function Mark({ lang }: { lang: Lang }) {
  return (
    <RadioGroup aria-label={TEXT[lang].delivery} defaultValue="express">
      <Rows lang={lang} check />
    </RadioGroup>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-radio-set">
      <RadioGroup aria-label={t.disabled} defaultValue="standard" disabled>
        <Rows lang={lang} options={PAIR} />
      </RadioGroup>
      <RadioGroup aria-label={t.readOnly} defaultValue="standard" readOnly>
        <Rows lang={lang} options={PAIR} />
      </RadioGroup>
    </div>
  );
}

function Invalid({ lang }: { lang: Lang }) {
  return (
    <RadioGroup aria-label={TEXT[lang].invalid} defaultValue="standard">
      <Rows lang={lang} options={PAIR} invalid />
    </RadioGroup>
  );
}

const imp = (setup: TokenSetup, ...extra: string[]) => [
  ...extra,
  `import { Radio, RadioGroup } from "${importPath(setup, "radio-group")}";`,
];

const cap = (lang: Lang, value: Option) => TEXT[lang][value];

/** The rows' JSX, one `<label>` per option. */
const rows = (lang: Lang, options: readonly Option[] = OPTIONS, check = false, invalid = false) =>
  options.flatMap((value) => [
    "<label>",
    ...(check
      ? [
          `  <Radio.Root value="${value}">`,
          "    <Radio.Indicator>",
          "      <Check />",
          "    </Radio.Indicator>",
          "  </Radio.Root>",
        ]
      : [`  <Radio.Root value="${value}"${invalid ? " aria-invalid" : ""} />`]),
    `  ${cap(lang, value)}`,
    "</label>",
  ]);

const group = (props: string[], inner: string[]) => [
  `<RadioGroup ${props.join(" ")}>`,
  ...inner.map((line) => `  ${line}`),
  "</RadioGroup>",
];

const ACROSS_CSS = {
  name: "delivery.css",
  code: [".delivery {", "  flex-flow: row wrap;", "}"].join("\n"),
};

export const radioGroupDefinition = defineComponent({
  item: "radio-group",
  imports: ["Radio", "RadioGroup"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu pilihan dari beberapa opsi. Setiap opsi adalah label dengan radio di dalamnya.",
        en: "One choice from a few options. Each option is a label with a radio inside it.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Delivery",
          imp(setup),
          group([`aria-label="${TEXT[lang].delivery}"`, 'defaultValue="standard"'], rows(lang)),
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg mengikuti font dan tinggi baris Button.",
        en: "sm, md, and lg follow Button's fonts and row heights.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) =>
            group(
              [
                `aria-label="${TEXT[lang].delivery}, ${size}"`,
                `size="${size}"`,
                'defaultValue="standard"',
              ],
              rows(lang, PAIR),
            ),
          ),
        ),
      ],
    },
    {
      id: "row",
      title: { id: "Baris", en: "Row" },
      description: {
        id: "Satu aturan di className menata opsi ke samping; Glide mengukur di kedua sumbu.",
        en: "One rule on className lays the options out side by side; Glide measures on both axes.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Across lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "DeliveryRow",
          imp(setup),
          group(
            [
              `aria-label="${TEXT[lang].delivery}"`,
              'className="delivery"',
              'defaultValue="express"',
            ],
            rows(lang),
          ),
        ),
        ACROSS_CSS,
      ],
    },
    {
      id: "controlled",
      title: { id: "Terkontrol", en: "Controlled" },
      description: {
        id: "value dan onValueChange dari state Anda; catatan di bawah mengikuti pilihan.",
        en: "value and onValueChange from your own state; the note below follows the choice.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Controlled lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ControlledDelivery",
            imp(setup, 'import { useState } from "react";'),
            [
              ...group(
                [`aria-label="${t.delivery}"`, "value={value}", "onValueChange={setValue}"],
                rows(lang),
              ),
              "<p>{arrives[value]}</p>",
            ],
            [
              '  const [value, setValue] = useState("standard");',
              "  const arrives: Record<string, string> = {",
              ...OPTIONS.map((option) => `    ${option}: "${t.arrives[option]}",`),
              "  };",
            ],
          ),
        ];
      },
    },
    {
      id: "mark",
      title: { id: "Tanda", en: "Mark" },
      description: {
        id: "Children Radio.Indicator menggantikan titiknya dengan node apa pun, seperti ikon centang.",
        en: "Children of Radio.Indicator replace the dot with any node, such as a check icon.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Mark lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "CheckedDelivery",
          imp(setup, 'import { Check } from "lucide-react";'),
          group(
            [`aria-label="${TEXT[lang].delivery}"`, 'defaultValue="express"'],
            rows(lang, OPTIONS, true),
          ),
        ),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled meredupkan grup dan melewatkannya; readOnly tampil biasa dan mengabaikan tekanan.",
        en: "disabled dims the group and skips it; readOnly looks as usual and ignores presses.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Locked", imp(setup), [
            ...group(
              [`aria-label="${t.disabled}"`, 'defaultValue="standard"', "disabled"],
              rows(lang, PAIR),
            ),
            ...group(
              [`aria-label="${t.readOnly}"`, 'defaultValue="standard"', "readOnly"],
              rows(lang, PAIR),
            ),
          ]),
        ];
      },
    },
    {
      id: "invalid",
      title: { id: "Invalid", en: "Invalid" },
      description: {
        id: "Di dalam Field yang invalid, atau dengan aria-invalid pada radionya: lingkaran menjadi critical dan bergetar sekali; terpilih, ia critical solid.",
        en: "In an invalid Field, or with aria-invalid on the radios: the circle turns critical and shakes once; selected, it is the solid critical.",
      },
      uses: ["RadioGroup", "Radio"],
      demo: (lang) => <Invalid lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Invalid",
          imp(setup),
          group(
            [`aria-label="${TEXT[lang].invalid}"`, 'defaultValue="standard"'],
            rows(lang, PAIR, false, true),
          ),
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <RadioGroup aria-label={TEXT[lang].delivery} defaultValue="standard">
        <Rows lang={lang} options={PAIR} />
      </RadioGroup>
    ),
  },
  parts: [
    {
      name: "Group",
      selector: ".ow-radio-group",
      note: {
        id: "Wadah dengan role radiogroup. Memuat baris dan highlight hover (Glide). Tanpa lebar dan margin.",
        en: "The container, with the radiogroup role. Holds the rows and Glide's hover highlight. No width, no margin.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Row",
      selector: ".ow-radio-group label",
      note: {
        id: "<label> milik Anda yang memuat radio. Tingginya mengikuti aturan --py, dan Glide menyalakannya.",
        en: "Your <label> holding a radio. Its height follows the --py rule, and Glide lights it.",
      },
    },
    {
      name: "Radio",
      selector: ".ow-radio-group__radio",
      note: {
        id: "Lingkaran seukuran font + 6 px, dengan target tekan 24 px. Tanpa children, ia menggambar Indicator.",
        en: "The circle, the font size plus 6 px, with a 24 px press target. Without children it draws its Indicator.",
      },
      size: true,
      tokens: {
        "--ow-accent": "--_accent",
        "--ow-primary-shadow": "--_accent-shadow",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-radio-group__indicator",
      note: {
        id: "Titik yang membesar dengan spring settle. Hanya terpasang saat radio aktif; children menggantikan titiknya.",
        en: "The dot, scaling in on the settle spring. Mounted only while checked; children replace the dot.",
      },
      tokens: {
        "--ow-on-accent": "--_dot",
      },
    },
  ],
});

export default function RadioGroupPage(props: ExamplePageProps) {
  return <ComponentPage definition={radioGroupDefinition} {...props} />;
}
