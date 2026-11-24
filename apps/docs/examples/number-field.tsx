"use client";

import { Field, NumberField, type NumberFieldSize } from "owsem-ui/base";
import { useId, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    quantity: "Jumlah",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    price: "Harga",
    discount: "Diskon",
    weight: "Berat",
    amount: "Jumlah, geser untuk mengubah",
    seats: "Kursi",
    seatsHelp: "Paling banyak 10 kursi per pesanan.",
    seatsError: "Pilih 10 kursi atau kurang.",
    locale: "id-ID",
    currency: "IDR",
  },
  en: {
    quantity: "Quantity",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    price: "Price",
    discount: "Discount",
    weight: "Weight",
    amount: "Amount, drag to change",
    seats: "Seats",
    seatsHelp: "At most 10 seats per order.",
    seatsError: "Choose 10 seats or fewer.",
    locale: "en-US",
    currency: "USD",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly NumberFieldSize[] = ["sm", "md", "lg"];
const PRICE = { id: { value: 125000, step: 5000 }, en: { value: 24.5, step: 0.5 } } as const;

function Default({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="quantity" className="demo-number-field">
      <Field.Label>{TEXT[lang].quantity}</Field.Label>
      <NumberField.Root defaultValue={2} min={0} max={20} />
    </Field.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col demo-number-field">
      {SIZES.map((size) => (
        <Field.Root key={size} name={size}>
          <Field.Label>{TEXT[lang][size]}</Field.Label>
          <NumberField.Root size={size} defaultValue={2} min={0} />
        </Field.Root>
      ))}
    </div>
  );
}

function Format({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-col demo-number-field">
      <Field.Root name="price">
        <Field.Label>{t.price}</Field.Label>
        <NumberField.Root
          defaultValue={PRICE[lang].value}
          step={PRICE[lang].step}
          min={0}
          format={{ style: "currency", currency: t.currency }}
          locale={t.locale}
        />
      </Field.Root>
      <Field.Root name="discount">
        <Field.Label>{t.discount}</Field.Label>
        <NumberField.Root
          defaultValue={0.25}
          step={0.05}
          min={0}
          max={1}
          format={{ style: "percent" }}
          locale={t.locale}
        />
      </Field.Root>
      <Field.Root name="weight">
        <Field.Label>{t.weight}</Field.Label>
        <NumberField.Root
          defaultValue={2.5}
          step={0.5}
          min={0}
          format={{ style: "unit", unit: "kilogram", unitDisplay: "short" }}
          locale={t.locale}
        />
      </Field.Root>
    </div>
  );
}

function Scrub({ lang }: { lang: Lang }) {
  const id = useId();
  return (
    <NumberField.Root defaultValue={50} min={0} max={100} className="demo-number-field">
      <NumberField.ScrubArea>
        <label htmlFor={id}>{TEXT[lang].amount}</label>
        <NumberField.ScrubAreaCursor />
      </NumberField.ScrubArea>
      <NumberField.Group>
        <NumberField.Decrement />
        <NumberField.Input id={id} />
        <NumberField.Increment />
      </NumberField.Group>
    </NumberField.Root>
  );
}

function WithError({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [seats, setSeats] = useState<number | null>(12);
  const invalid = seats !== null && seats > 10;
  return (
    <Field.Root name="seats" invalid={invalid} className="demo-number-field">
      <Field.Label>{t.seats}</Field.Label>
      <NumberField.Root value={seats} onValueChange={setSeats} min={1} />
      <Field.Description>{t.seatsHelp}</Field.Description>
      <Field.Error match={invalid}>{t.seatsError}</Field.Error>
    </Field.Root>
  );
}

const imp = (setup: TokenSetup) => [
  `import { Field } from "${importPath(setup, "field")}";`,
  `import { NumberField } from "${importPath(setup, "number-field")}";`,
];

const field = (name: string, label: string, root: string[]) => [
  `<Field.Root name="${name}">`,
  `  <Field.Label>${label}</Field.Label>`,
  ...root.map((line) => `  ${line}`),
  "</Field.Root>",
];

export const numberFieldDefinition = defineComponent({
  item: "number-field",
  imports: ["NumberField"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Tanpa anak, Root menggambar Group dengan Decrement, Input, dan Increment. Field.Label menamai inputnya.",
        en: "With no children, Root draws a Group with a Decrement, an Input, and an Increment. Field.Label names the input.",
      },
      uses: ["NumberField", "Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Quantity", imp(setup), [
          ...field("quantity", TEXT[lang].quantity, [
            "<NumberField.Root defaultValue={2} min={0} max={20} />",
          ]),
        ]),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size pada Root mengatur font dan tinggi: 32, 40, atau 48px, sama dengan Input.",
        en: "size on Root sets the font and the height: 32, 40, or 48px, as Input's.",
      },
      uses: ["NumberField", "Field"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) =>
            field(size, TEXT[lang][size], [
              `<NumberField.Root size="${size}" defaultValue={2} min={0} />`,
            ]),
          ),
        ),
      ],
    },
    {
      id: "format",
      title: { id: "Format", en: "Format" },
      description: {
        id: "format memakai Intl.NumberFormat: mata uang, persen, atau satuan, dengan locale. Nilainya tetap angka.",
        en: "format takes Intl.NumberFormat options: currency, percent, or a unit, with a locale. The value stays a number.",
      },
      uses: ["NumberField", "Field"],
      demo: (lang) => <Format lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("Formats", imp(setup), [
            ...field("price", t.price, [
              "<NumberField.Root",
              `  defaultValue={${PRICE[lang].value}}`,
              `  step={${PRICE[lang].step}}`,
              "  min={0}",
              `  format={{ style: "currency", currency: "${t.currency}" }}`,
              `  locale="${t.locale}"`,
              "/>",
            ]),
            ...field("discount", t.discount, [
              "<NumberField.Root",
              "  defaultValue={0.25}",
              "  step={0.05}",
              "  min={0}",
              "  max={1}",
              '  format={{ style: "percent" }}',
              `  locale="${t.locale}"`,
              "/>",
            ]),
            ...field("weight", t.weight, [
              "<NumberField.Root",
              "  defaultValue={2.5}",
              "  step={0.5}",
              "  min={0}",
              '  format={{ style: "unit", unit: "kilogram", unitDisplay: "short" }}',
              `  locale="${t.locale}"`,
              "/>",
            ]),
          ]),
        ];
      },
    },
    {
      id: "scrub",
      title: { id: "Geser", en: "Scrub" },
      description: {
        id: "ScrubArea membungkus label: seret ke kiri atau kanan untuk mengubah nilai. ScrubAreaCursor menggambar panah dua arah selama menyeret.",
        en: "ScrubArea wraps the label: drag left or right to change the value. ScrubAreaCursor draws a two-way arrow while you drag.",
      },
      uses: ["NumberField"],
      demo: (lang) => <Scrub lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Amount",
          [
            'import { useId } from "react";',
            `import { NumberField } from "${importPath(setup, "number-field")}";`,
          ],
          [
            "<NumberField.Root defaultValue={50} min={0} max={100}>",
            "  <NumberField.ScrubArea>",
            `    <label htmlFor={id}>${TEXT[lang].amount}</label>`,
            "    <NumberField.ScrubAreaCursor />",
            "  </NumberField.ScrubArea>",
            "  <NumberField.Group>",
            "    <NumberField.Decrement />",
            "    <NumberField.Input id={id} />",
            "    <NumberField.Increment />",
            "  </NumberField.Group>",
            "</NumberField.Root>",
          ],
          ["  const id = useId();"],
        ),
      ],
    },
    {
      id: "error",
      title: { id: "Dengan field dan error", en: "With a field and an error" },
      description: {
        id: "Field memberi label, deskripsi, dan error; invalid mewarnai field jadi critical. Coba kurangi sampai 10.",
        en: "Field gives it a label, a description, and an error; invalid turns the field critical. Step down to 10 to clear it.",
      },
      uses: ["NumberField", "Field"],
      demo: (lang) => <WithError lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Seats",
            ['import { useState } from "react";', ...imp(setup)],
            [
              '<Field.Root name="seats" invalid={invalid}>',
              `  <Field.Label>${t.seats}</Field.Label>`,
              "  <NumberField.Root value={seats} onValueChange={setSeats} min={1} />",
              `  <Field.Description>${t.seatsHelp}</Field.Description>`,
              `  <Field.Error match={invalid}>${t.seatsError}</Field.Error>`,
              "</Field.Root>",
            ],
            [
              "  const [seats, setSeats] = useState<number | null>(12);",
              "  const invalid = seats !== null && seats > 10;",
            ],
          ),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <NumberField.Root defaultValue={5} size="lg" className="demo-number-field">
        <NumberField.ScrubArea>
          <label htmlFor="number-field-specimen">{TEXT[lang].quantity}</label>
        </NumberField.ScrubArea>
        <NumberField.Group>
          <NumberField.Decrement />
          <NumberField.Input id="number-field-specimen" />
          <NumberField.Increment />
        </NumberField.Group>
      </NumberField.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-number-field",
      note: {
        id: "Div dari Base UI yang menyimpan state, dengan input tersembunyi untuk form. Tanpa children ia menggambar Group. size-nya adalah font dan --py yang dibaca semua bagian.",
        en: "Base UI's div that holds the state, with a hidden input for forms. With no children it draws a Group. Its size is the font and --py that every part reads.",
      },
    },
    {
      name: "ScrubArea",
      selector: ".ow-number-field__scrub-area",
      note: {
        id: "Membungkus label. Kursornya ew-resize (ns-resize bila vertical) dan teksnya tidak bisa diseleksi.",
        en: "Wraps the label. Its cursor is ew-resize (ns-resize when vertical) and its text cannot be selected.",
      },
    },
    {
      name: "Group",
      selector: ".ow-number-field__group",
      size: true,
      note: {
        id: "Fieldnya: tint 6% dari warna teks (9% saat hover), cincin fokus saat input fokus, critical bila invalid. Setinggi Input; tombolnya masuk 4px dari ujung.",
        en: "The field: a 6% tint of the text color (9% on hover), the focus ring while the input has focus, critical when invalid. As tall as an Input; the buttons are inset 4px from the ends.",
      },
    },
    {
      name: "Decrement",
      selector: ".ow-number-field__decrement",
      size: true,
      note: {
        id: "Tombol persegi di awal, datar. Hover memberi --ow-hover, ditekan memberi bahan tekan dan skala 0,97. Mati dan redup di nilai min.",
        en: "A flat square button at the start. Hover gives --ow-hover, held gives the pressed material and a 0.97 scale. Dim and off at the min.",
      },
    },
    {
      name: "Input",
      selector: ".ow-number-field__input",
      note: {
        id: "Kolom teks tanpa tampilan sendiri: angka di tengah, tabular, tanpa spinner bawaan.",
        en: "The text field with no look of its own: digits centered and tabular, with no native spinner.",
      },
    },
    {
      name: "Increment",
      selector: ".ow-number-field__increment",
      size: true,
      note: {
        id: "Seperti Decrement, di akhir. Mati dan redup di nilai maks.",
        en: "As the Decrement, at the end. Dim and off at the max.",
      },
    },
  ],
});

export default function NumberFieldPage(props: ExamplePageProps) {
  return <ComponentPage definition={numberFieldDefinition} {...props} />;
}
