"use client";

import { Accordion, type AccordionSize } from "owsem-ui/base";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    q1: "Apa itu OwsemUI?",
    a1: "Komponen React di atas Base UI, dengan gaya lembut dan token tema.",
    q2: "Bisakah dipakai dengan Tailwind?",
    a2: "Bisa. Setiap komponen punya versi CSS dan versi Tailwind CSS v4.",
    q3: "Apakah gratis?",
    a3: "Ya, berlisensi MIT.",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    soon: "Segera hadir",
    soonBody: "Bagian ini belum tersedia.",
  },
  en: {
    q1: "What is OwsemUI?",
    a1: "React components on top of Base UI, with a soft style and theme tokens.",
    q2: "Can I use it with Tailwind?",
    a2: "Yes. Every component comes in a CSS flavor and a Tailwind CSS v4 flavor.",
    q3: "Is it free?",
    a3: "Yes, under the MIT license.",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    soon: "Coming soon",
    soonBody: "This section is not available yet.",
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly AccordionSize[] = ["sm", "md", "lg"];
const KEYS = ["1", "2", "3"] as const;

function Items({ lang, prefix }: { lang: Lang; prefix?: string }) {
  const t = TEXT[lang];
  return KEYS.map((key) => (
    <Accordion.Item key={key} value={`${prefix ?? ""}${key}`}>
      <Accordion.Trigger>{t[`q${key}`]}</Accordion.Trigger>
      <Accordion.Panel>{t[`a${key}`]}</Accordion.Panel>
    </Accordion.Item>
  ));
}

function Default({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar">
      <Accordion.Root defaultValue={["1"]}>
        <Items lang={lang} />
      </Accordion.Root>
    </div>
  );
}

function Multiple({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar">
      <Accordion.Root multiple defaultValue={["1", "3"]}>
        <Items lang={lang} />
      </Accordion.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-bar demo-col">
      {SIZES.map((size) => (
        <Accordion.Root key={size} size={size}>
          <Accordion.Item value="1">
            <Accordion.Trigger>{t[size]}</Accordion.Trigger>
            <Accordion.Panel>{t.a1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="2">
            <Accordion.Trigger>{t.q2}</Accordion.Trigger>
            <Accordion.Panel>{t.a2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ))}
    </div>
  );
}

function DisabledItem({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-bar">
      <Accordion.Root defaultValue={["1"]}>
        <Accordion.Item value="1">
          <Accordion.Trigger>{t.q1}</Accordion.Trigger>
          <Accordion.Panel>{t.a1}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="2" disabled>
          <Accordion.Trigger>{t.soon}</Accordion.Trigger>
          <Accordion.Panel>{t.soonBody}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="3">
          <Accordion.Trigger>{t.q3}</Accordion.Trigger>
          <Accordion.Panel>{t.a3}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

const itemLines = (lang: Lang) =>
  KEYS.flatMap((key) => [
    `  <Accordion.Item value="${key}">`,
    `    <Accordion.Trigger>${TEXT[lang][`q${key}`]}</Accordion.Trigger>`,
    `    <Accordion.Panel>${TEXT[lang][`a${key}`]}</Accordion.Panel>`,
    "  </Accordion.Item>",
  ]);

export const accordionDefinition = defineComponent({
  item: "accordion",
  imports: ["Accordion"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Baris selebar penuh yang dipisah garis tipis; satu panel terbuka pada satu waktu.",
        en: "Full-width rows told apart by a hairline; one panel is open at a time.",
      },
      uses: ["Accordion", "Accordion.Item", "Accordion.Trigger", "Accordion.Panel"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Faq",
          [`import { Accordion } from "${importPath(setup, "accordion")}";`],
          ['<Accordion.Root defaultValue={["1"]}>', ...itemLines(lang), "</Accordion.Root>"],
        ),
      ],
    },
    {
      id: "multiple",
      title: { id: "Banyak", en: "Multiple" },
      description: {
        id: "multiple membiarkan beberapa panel terbuka bersamaan.",
        en: "multiple lets several panels stay open together.",
      },
      uses: ["Accordion", "Accordion.Item", "Accordion.Trigger", "Accordion.Panel"],
      demo: (lang) => <Multiple lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Multiple",
          [`import { Accordion } from "${importPath(setup, "accordion")}";`],
          [
            '<Accordion.Root multiple defaultValue={["1", "3"]}>',
            ...itemLines(lang),
            "</Accordion.Root>",
          ],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size pada Root berlaku untuk setiap pemicu: baris setinggi 32, 40, atau 48px.",
        en: "size on Root applies to every trigger: rows 32, 40, or 48px tall.",
      },
      uses: ["Accordion", "Accordion.Item", "Accordion.Trigger", "Accordion.Panel"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Accordion } from "${importPath(setup, "accordion")}";`],
          SIZES.flatMap((size) => [
            `<Accordion.Root size="${size}">`,
            '  <Accordion.Item value="1">',
            `    <Accordion.Trigger>${TEXT[lang][size]}</Accordion.Trigger>`,
            `    <Accordion.Panel>${TEXT[lang].a1}</Accordion.Panel>`,
            "  </Accordion.Item>",
            '  <Accordion.Item value="2">',
            `    <Accordion.Trigger>${TEXT[lang].q2}</Accordion.Trigger>`,
            `    <Accordion.Panel>${TEXT[lang].a2}</Accordion.Panel>`,
            "  </Accordion.Item>",
            "</Accordion.Root>",
          ]),
        ),
      ],
    },
    {
      id: "disabled-item",
      title: { id: "Item nonaktif", en: "Disabled item" },
      description: {
        id: "disabled pada satu Item meredupkannya dan membuatnya tak bisa dibuka; disabled pada Root melakukannya untuk semua.",
        en: "disabled on one Item dims it and keeps it shut; disabled on Root does it for all of them.",
      },
      uses: ["Accordion", "Accordion.Item", "Accordion.Trigger", "Accordion.Panel"],
      demo: (lang) => <DisabledItem lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "DisabledItem",
          [`import { Accordion } from "${importPath(setup, "accordion")}";`],
          [
            '<Accordion.Root defaultValue={["1"]}>',
            '  <Accordion.Item value="1">',
            `    <Accordion.Trigger>${TEXT[lang].q1}</Accordion.Trigger>`,
            `    <Accordion.Panel>${TEXT[lang].a1}</Accordion.Panel>`,
            "  </Accordion.Item>",
            '  <Accordion.Item value="2" disabled>',
            `    <Accordion.Trigger>${TEXT[lang].soon}</Accordion.Trigger>`,
            `    <Accordion.Panel>${TEXT[lang].soonBody}</Accordion.Panel>`,
            "  </Accordion.Item>",
            '  <Accordion.Item value="3">',
            `    <Accordion.Trigger>${TEXT[lang].q3}</Accordion.Trigger>`,
            `    <Accordion.Panel>${TEXT[lang].a3}</Accordion.Panel>`,
            "  </Accordion.Item>",
            "</Accordion.Root>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <div style={{ inlineSize: 280 }}>
        <Accordion.Root defaultValue={["1"]}>
          <Accordion.Item value="1">
            <Accordion.Header>
              <Accordion.Trigger>{TEXT[lang].q1}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{TEXT[lang].a1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="2">
            <Accordion.Trigger>{TEXT[lang].q2}</Accordion.Trigger>
            <Accordion.Panel>{TEXT[lang].a2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-accordion",
      note: {
        id: "Div yang menampung item. size di sini berlaku untuk setiap pemicu.",
        en: "A div that holds the items. size here applies to every trigger.",
      },
    },
    {
      name: "Item",
      selector: ".ow-accordion__item",
      note: {
        id: "Satu bagian: header dan panelnya. Garis tipis memisahkannya dari item sebelumnya.",
        en: "One section: a header and its panel. A hairline separates it from the item before.",
      },
    },
    {
      name: "Header",
      selector: ".ow-accordion__header",
      note: {
        id: "Judul (h3) di sekitar pemicu. Trigger menggambarnya sendiri; render={<h2 />} mengubah tingkatnya.",
        en: "The heading (an h3) around a trigger. Trigger draws it itself; render={<h2 />} changes the level.",
      },
    },
    {
      name: "Trigger",
      selector: ".ow-accordion__trigger",
      size: true,
      note: {
        id: "Baris selebar penuh: label berbobot 500 di awal, chevron redup di akhir. Tanpa isian saat hover dan tanpa skala saat ditekan.",
        en: "A full-width row: the label in weight 500 at the start, a muted chevron at the end. No fill on hover and no scale on press.",
      },
    },
    {
      name: "Panel",
      selector: ".ow-accordion__panel",
      note: {
        id: "Kotak yang tingginya beranimasi dan terpotong. Isinya duduk di elemen dalam yang memegang padding.",
        en: "The box whose height animates, clipped. Its children sit in an inner element that has the padding.",
      },
    },
  ],
});

export default function AccordionPage(props: ExamplePageProps) {
  return <ComponentPage definition={accordionDefinition} {...props} />;
}
