"use client";

import { Select, type SelectSize } from "owsem-ui/base";
import { Fragment, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    fruit: "Buah",
    fruits: "Buah-buahan",
    pick: "Pilih buah",
    year: "Tahun",
    decade: (start: number) => `${start}–${start + 9}`,
    orchard: "Kebun",
    tropical: "Tropis",
    placeholder: "Placeholder",
    disabled: "Nonaktif",
    invalid: "Invalid",
    count: (n: number) => `${n} buah`,
    names: {
      apple: "Apel",
      banana: "Pisang",
      cherry: "Ceri",
      durian: "Durian",
      mango: "Mangga",
      guava: "Jambu",
      lychee: "Leci",
      papaya: "Pepaya",
    },
  },
  en: {
    fruit: "Fruit",
    fruits: "Fruits",
    pick: "Pick a fruit",
    year: "Year",
    decade: (start: number) => `${start}–${start + 9}`,
    orchard: "Orchard",
    tropical: "Tropical",
    placeholder: "Placeholder",
    disabled: "Disabled",
    invalid: "Invalid",
    count: (n: number) => `${n} fruits`,
    names: {
      apple: "Apple",
      banana: "Banana",
      cherry: "Cherry",
      durian: "Durian",
      mango: "Mango",
      guava: "Guava",
      lychee: "Lychee",
      papaya: "Papaya",
    },
  },
} satisfies Record<Lang, Record<string, unknown>>;

type Fruit = keyof typeof TEXT.en.names;
const SHORT: readonly Fruit[] = ["apple", "banana", "cherry", "durian", "mango"];
const ORCHARD: readonly Fruit[] = ["apple", "cherry"];
const TROPICAL: readonly Fruit[] = ["banana", "durian", "guava", "lychee", "mango", "papaya"];
const SIZES: readonly SelectSize[] = ["sm", "md", "lg"];
const DECADES = [2000, 2010, 2020, 2030];

/** The items are valued by the words they show, so no `items` map is needed. */
const fruit = (lang: Lang, key: Fruit) => TEXT[lang].names[key];

const items = (lang: Lang, keys: readonly Fruit[]) =>
  keys.map((key) => (
    <Select.Item key={key} value={fruit(lang, key)} disabled={key === "durian"}>
      {fruit(lang, key)}
    </Select.Item>
  ));

function Default({ lang }: { lang: Lang }) {
  return (
    <div className="demo-select-field">
      <Select.Root defaultValue={fruit(lang, "cherry")}>
        <Select.Label>{TEXT[lang].fruit}</Select.Label>
        <Select.Trigger />
        <Select.Popup>{items(lang, SHORT)}</Select.Popup>
      </Select.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col">
      {SIZES.map((size) => (
        <div key={size} className="demo-select-field">
          <Select.Root defaultValue={fruit(lang, "cherry")} size={size}>
            <Select.Trigger aria-label={`${TEXT[lang].fruit}, ${size}`} />
            <Select.Popup>{items(lang, SHORT)}</Select.Popup>
          </Select.Root>
        </div>
      ))}
    </div>
  );
}

function Multiple({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-select-field">
      <Select.Root multiple defaultValue={[fruit(lang, "cherry")]}>
        <Select.Label>{t.fruits}</Select.Label>
        <Select.Trigger placeholder={t.pick} />
        <Select.Popup>{items(lang, SHORT)}</Select.Popup>
      </Select.Root>
    </div>
  );
}

/** Forty years by decade, more than a screen holds, with one in the middle selected. */
function Groups({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-select-field">
      <Select.Root defaultValue="2026">
        <Select.Label>{t.year}</Select.Label>
        <Select.Trigger />
        <Select.Popup>
          {DECADES.map((start, i) => (
            <Fragment key={start}>
              {i > 0 ? <Select.Separator /> : null}
              <Select.Group>
                <Select.GroupLabel>{t.decade(start)}</Select.GroupLabel>
                {Array.from({ length: 10 }, (_, n) => String(start + n)).map((year) => (
                  <Select.Item key={year} value={year}>
                    {year}
                  </Select.Item>
                ))}
              </Select.Group>
            </Fragment>
          ))}
        </Select.Popup>
      </Select.Root>
    </div>
  );
}

function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-col">
      <div className="demo-select-field">
        <Select.Root>
          <Select.Trigger aria-label={t.placeholder} placeholder={t.pick} />
          <Select.Popup>{items(lang, SHORT)}</Select.Popup>
        </Select.Root>
      </div>
      <div className="demo-select-field">
        <Select.Root disabled defaultValue={fruit(lang, "cherry")}>
          <Select.Trigger aria-label={t.disabled} />
          <Select.Popup>{items(lang, SHORT)}</Select.Popup>
        </Select.Root>
      </div>
      <div className="demo-select-field">
        <Select.Root defaultValue={fruit(lang, "cherry")}>
          <Select.Trigger aria-label={t.invalid} aria-invalid />
          <Select.Popup>{items(lang, SHORT)}</Select.Popup>
        </Select.Root>
      </div>
    </div>
  );
}

/** Parts written out: a summary for the Value, your own icon, the check before the label. */
function Parts({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [picked, setPicked] = useState<string[]>([fruit(lang, "cherry"), fruit(lang, "mango")]);
  return (
    <div className="demo-select-field">
      <Select.Root multiple value={picked} onValueChange={setPicked}>
        <Select.Label>{t.fruits}</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder={t.pick}>
            {(value: string[]) => (value.length > 2 ? t.count(value.length) : value.join(", "))}
          </Select.Value>
          <Select.Icon>
            <Icon name="chevron-down" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Popup>
          {SHORT.map((key) => (
            <Select.Item key={key} value={fruit(lang, key)}>
              <Select.ItemIndicator />
              <Select.ItemText>{fruit(lang, key)}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>
    </div>
  );
}

/**
 * Every part in one popup held open, with no portal and no lock on the page: the popup lands in
 * its own box, `inert`, so Inspect can magnify all of it. The list is capped so a scroll arrow
 * shows.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-select-specimen">
      <Select.Root open modal={false} defaultValue={fruit(lang, "cherry")}>
        <Select.Label>{t.fruit}</Select.Label>
        <Select.Trigger />
        <Select.Portal container={box}>
          <Select.Positioner alignItemWithTrigger={false} positionMethod="absolute">
            <Select.Popup inert>
              <Select.Group>
                <Select.GroupLabel>{t.orchard}</Select.GroupLabel>
                {items(lang, ORCHARD)}
              </Select.Group>
              <Select.Separator />
              {items(lang, TROPICAL)}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

const imp = (setup: TokenSetup) => [`import { Select } from "${importPath(setup, "select")}";`];

const FIELD_CSS = {
  name: "field.css",
  code: [".field {", "  display: grid;", "  inline-size: 12rem;", "}"].join("\n"),
};

/** `<div className="field">` around some lines. */
const field = (inner: string[]) => [
  '<div className="field">',
  ...inner.map((l) => `  ${l}`),
  "</div>",
];

const item = (lang: Lang, key: Fruit) => {
  const name = fruit(lang, key);
  return key === "durian"
    ? [`<Select.Item value="${name}" disabled>`, `  ${name}`, "</Select.Item>"]
    : [`<Select.Item value="${name}">${name}</Select.Item>`];
};

const popup = (lang: Lang, keys: readonly Fruit[]) => [
  "<Select.Popup>",
  ...keys.flatMap((key) => item(lang, key).map((l) => `  ${l}`)),
  "</Select.Popup>",
];

export const selectDefinition = defineComponent({
  item: "select",
  imports: ["Select"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Root, Label, Trigger, dan Popup berisi item. Popup terbuka tepat di atas trigger, dengan teks terpilih di atas teks trigger.",
        en: "A Root, a Label, a Trigger, and a Popup of Items. The popup opens over the trigger, with the selected text on the trigger's own.",
      },
      uses: ["Select"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("FruitSelect", imp(setup), [
          ...field([
            `<Select.Root defaultValue="${fruit(lang, "cherry")}">`,
            `  <Select.Label>${TEXT[lang].fruit}</Select.Label>`,
            "  <Select.Trigger />",
            ...popup(lang, SHORT).map((l) => `  ${l}`),
            "</Select.Root>",
          ]),
        ]),
        FIELD_CSS,
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Root mengatur font trigger dan item: 13, 14, atau 16px.",
        en: "size on the Root sets the trigger's and the items' type scale: 13, 14, or 16px.",
      },
      uses: ["Select"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) =>
            field([
              `<Select.Root defaultValue="${fruit(lang, "cherry")}" size="${size}">`,
              `  <Select.Trigger aria-label="${TEXT[lang].fruit}, ${size}" />`,
              ...popup(lang, SHORT).map((l) => `  ${l}`),
              "</Select.Root>",
            ]),
          ),
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "multiple",
      title: { id: "Banyak", en: "Multiple" },
      description: {
        id: "multiple milik Base UI: popup tetap terbuka, dan trigger menjumlahkan pilihan.",
        en: "Base UI's multiple: the popup stays open as you pick, and the trigger adds up the labels.",
      },
      uses: ["Select"],
      demo: (lang) => <Multiple lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Fruits", imp(setup), [
          ...field([
            `<Select.Root multiple defaultValue={["${fruit(lang, "cherry")}"]}>`,
            `  <Select.Label>${TEXT[lang].fruits}</Select.Label>`,
            `  <Select.Trigger placeholder="${TEXT[lang].pick}" />`,
            ...popup(lang, SHORT).map((l) => `  ${l}`),
            "</Select.Root>",
          ]),
        ]),
        FIELD_CSS,
      ],
    },
    {
      id: "groups",
      title: { id: "Grup", en: "Groups" },
      description: {
        id: "Daftar panjang menggulir di dalam popup; Group, GroupLabel, dan Separator menatanya.",
        en: "A long list scrolls inside the popup; Group, GroupLabel, and Separator organise it.",
      },
      uses: ["Select"],
      demo: (lang) => <Groups lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "YearSelect",
            [...imp(setup), 'import { Fragment } from "react";'],
            field([
              '<Select.Root defaultValue="2026">',
              `  <Select.Label>${t.year}</Select.Label>`,
              "  <Select.Trigger />",
              "  <Select.Popup>",
              "    {decades.map((start, i) => (",
              "      <Fragment key={start}>",
              "        {i > 0 ? <Select.Separator /> : null}",
              "        <Select.Group>",
              "          <Select.GroupLabel>{label(start)}</Select.GroupLabel>",
              "          {years(start).map((year) => (",
              "            <Select.Item key={year} value={year}>",
              "              {year}",
              "            </Select.Item>",
              "          ))}",
              "        </Select.Group>",
              "      </Fragment>",
              "    ))}",
              "  </Select.Popup>",
              "</Select.Root>",
            ]),
            [
              "  const decades = [2000, 2010, 2020, 2030];",
              "  const label = (start: number) => `${start}–${start + 9}`;",
              "  const years = (start: number) =>",
              "    Array.from({ length: 10 }, (_, n) => String(start + n));",
            ],
          ),
          FIELD_CSS,
        ];
      },
    },
    {
      id: "states",
      title: { id: "State", en: "States" },
      description: {
        id: "Placeholder muted, nonaktif memudar, dan invalid memberi tint critical dan satu getaran.",
        en: "A muted placeholder, a faded disabled field, and invalid, a critical tint with one shake.",
      },
      uses: ["Select"],
      demo: (lang) => <States lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        const cherry = fruit(lang, "cherry");
        return [
          exampleFile("States", imp(setup), [
            ...field([
              "<Select.Root>",
              `  <Select.Trigger aria-label="${t.placeholder}" placeholder="${t.pick}" />`,
              ...popup(lang, SHORT).map((l) => `  ${l}`),
              "</Select.Root>",
            ]),
            ...field([
              `<Select.Root disabled defaultValue="${cherry}">`,
              `  <Select.Trigger aria-label="${t.disabled}" />`,
              ...popup(lang, SHORT).map((l) => `  ${l}`),
              "</Select.Root>",
            ]),
            ...field([
              `<Select.Root defaultValue="${cherry}">`,
              `  <Select.Trigger aria-label="${t.invalid}" aria-invalid />`,
              ...popup(lang, SHORT).map((l) => `  ${l}`),
              "</Select.Root>",
            ]),
          ]),
          FIELD_CSS,
        ];
      },
    },
    {
      id: "parts",
      title: { id: "Bagian", en: "Parts" },
      description: {
        id: "Tulis bagiannya sendiri: ringkasan untuk Value, ikon Anda, dan centang sebelum label.",
        en: "Write the parts out: a summary for the Value, your own icon, and the check before the label.",
      },
      uses: ["Select"],
      demo: (lang) => <Parts lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "FruitSummary",
            [
              ...imp(setup),
              'import { ChevronDown } from "lucide-react";',
              'import { useState } from "react";',
            ],
            field([
              "<Select.Root multiple value={picked} onValueChange={setPicked}>",
              `  <Select.Label>${t.fruits}</Select.Label>`,
              "  <Select.Trigger>",
              `    <Select.Value placeholder="${t.pick}">`,
              "      {(value: string[]) =>",
              `        value.length > 2 ? value.length + "${t.count(0).slice(1)}" : value.join(", ")`,
              "      }",
              "    </Select.Value>",
              "    <Select.Icon>",
              "      <ChevronDown />",
              "    </Select.Icon>",
              "  </Select.Trigger>",
              "  <Select.Popup>",
              ...SHORT.flatMap((key) => [
                `    <Select.Item value="${fruit(lang, key)}">`,
                "      <Select.ItemIndicator />",
                `      <Select.ItemText>${fruit(lang, key)}</Select.ItemText>`,
                "    </Select.Item>",
              ]),
              "  </Select.Popup>",
              "</Select.Root>",
            ]),
            [
              `  const [picked, setPicked] = useState(["${fruit(lang, "cherry")}", "${fruit(lang, "mango")}"]);`,
            ],
          ),
          FIELD_CSS,
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-select-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state dan membagikan size. Inspect menandai kotak yang memuat trigger dan popupnya.",
        en: "Renders no element: it holds the state and shares size. Inspect outlines the box that holds the trigger and its popup.",
      },
    },
    {
      name: "Label",
      selector: ".ow-select__label",
      note: {
        id: "Menamai trigger. Tanpanya, trigger butuh aria-label.",
        en: "Names the trigger. Without it, the trigger needs an aria-label.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
    {
      name: "Trigger",
      selector: ".ow-select__trigger",
      note: {
        id: "Material field: isian 6% dari warna teks tanpa tepi, 9% saat hover dan terbuka. Invalid mewarnainya critical 14% dan menggetarkannya sekali (kedip saat gerak dikurangi). Tingginya sama dengan Button; tanpa children, ia menggambar Value dan Icon.",
        en: "The Field material: a 6% tint of the text color with no edge, 9% on hover and while open. Invalid turns it a 14% critical tint and shakes it once (a blink under reduced motion). As tall as a Button; without children, it draws a Value and an Icon.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
        "--ow-critical": "--_critical",
      },
    },
    {
      name: "Value",
      selector: ".ow-select__value",
      note: {
        id: "Label item terpilih, atau placeholder yang muted. Yang panjang diakhiri elipsis.",
        en: "The selected item's label, or the muted placeholder. A long one ends in an ellipsis.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Icon",
      selector: ".ow-select__icon",
      note: {
        id: "Chevron atas dan bawah sebesar ikon, sejauh dari tepi seperti dari atas dan bawah.",
        en: "Up and down chevrons, icon-sized, as far from the edge as from the top and bottom.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Popup",
      selector: ".ow-select__popup",
      note: {
        id: "Material raised dengan bayangan popup. Radiusnya --ow-radius; item memakainya dikurangi padding 4px.",
        en: "The raised material with the popup shadow. Its radius is --ow-radius; items take it less the 4px padding.",
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
        id: "Nama grup sebagai judul: huruf kapital kecil, muted, dengan jarak huruf, seperti Menu dan Sidebar; juga menamai grup untuk teknologi asistif.",
        en: "A group's name as a heading: small, muted capitals with tracking, like Menu and Sidebar; it names the group for assistive technology too.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Item",
      selector: ".ow-select__item[data-selected]",
      note: {
        id: "Datar; Glide yang menyalakannya. Isi biasa masuk ke ItemText, lalu ItemIndicator di ujung baris.",
        en: "Flat; Glide lights it. Plain children go in an ItemText, then an ItemIndicator at the row's end.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "ItemIndicator",
      selector: ".ow-select__item[data-selected] .ow-select__item-indicator",
      note: {
        id: "Centang di ujung baris, sejajar dengan chevron trigger. Tetap menyimpan tempatnya saat tidak terpilih, lalu memudar dan membesar masuk saat dipilih.",
        en: "A check at the row's end, in line with the trigger's chevron. It keeps its room while unselected, and fades and scales in when picked.",
      },
    },
    {
      name: "ItemText",
      selector: ".ow-select__item[data-selected] .ow-select__item-text",
      note: {
        id: "Teks yang mendarat di atas teks trigger, dan yang dicocokkan saat mengetik. Satu baris, dengan elipsis.",
        en: "The text that lands on the trigger's, and what typing matches. One line, with an ellipsis.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-select__separator",
      note: {
        id: "Garis tipis di antara grup.",
        en: "A hairline between groups.",
      },
      tokens: { "--ow-line": "--ow-line" },
    },
    {
      name: "ScrollDownArrow",
      selector: ".ow-select__scroll-down-arrow",
      note: {
        id: "Muncul selama masih ada isi di bawah; pointer yang berhenti di atasnya menggulir.",
        en: "Shows while there is more below; the pointer resting on it scrolls.",
      },
      tokens: { "--ow-raised-bg": "--_bg", "--ow-muted": "--_muted" },
    },
  ],
});

export default function SelectPage(props: ExamplePageProps) {
  return <ComponentPage definition={selectDefinition} {...props} />;
}
