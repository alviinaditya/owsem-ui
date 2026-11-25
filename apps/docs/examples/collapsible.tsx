"use client";

import { Button, Collapsible, type CollapsibleSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    details: "Detail pesanan",
    body: "Dua kemeja, satu celana. Dikirim dalam tiga hari kerja dan bisa dikembalikan selama 30 hari.",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    more: "Selengkapnya",
    toggle: "Buka atau tutup",
    open: "Terbuka",
    closed: "Tertutup",
    faq: "Bagaimana cara pengembalian?",
    faqBody: "Kirim berkas pengembalian dari akun Anda; kami menjemput paketnya.",
  },
  en: {
    details: "Order details",
    body: "Two shirts and a pair of trousers. Ships in three working days and can be returned for 30 days.",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    more: "Show more",
    toggle: "Open or close",
    open: "Open",
    closed: "Closed",
    faq: "How do returns work?",
    faqBody: "Send the return form from your account; we collect the parcel.",
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly CollapsibleSize[] = ["sm", "md", "lg"];

const Plus = () => (
  <svg
    className="demo-plus"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M12 5v14" />
  </svg>
);

function Default({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar">
      <Collapsible.Root>
        <Collapsible.Trigger>{TEXT[lang].details}</Collapsible.Trigger>
        <Collapsible.Panel>{TEXT[lang].body}</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar demo-col">
      {SIZES.map((size) => (
        <Collapsible.Root key={size} size={size}>
          <Collapsible.Trigger>{TEXT[lang][size]}</Collapsible.Trigger>
          <Collapsible.Panel>{TEXT[lang].body}</Collapsible.Panel>
        </Collapsible.Root>
      ))}
    </div>
  );
}

function Controlled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [open, setOpen] = useState(false);
  return (
    <div className="demo-bar demo-col">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger>{t.details}</Collapsible.Trigger>
        <Collapsible.Panel>{t.body}</Collapsible.Panel>
      </Collapsible.Root>
      <div className="demo-toggle-row">
        <Button size="sm" variant="secondary" onClick={() => setOpen(!open)}>
          {t.toggle}
        </Button>
        <span>{open ? t.open : t.closed}</span>
      </div>
    </div>
  );
}

function CustomIcon({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar demo-col">
      <Collapsible.Root>
        <Collapsible.Trigger icon={<Plus />}>{TEXT[lang].faq}</Collapsible.Trigger>
        <Collapsible.Panel>{TEXT[lang].faqBody}</Collapsible.Panel>
      </Collapsible.Root>
      <Collapsible.Root>
        <Collapsible.Trigger icon={null}>{TEXT[lang].more}</Collapsible.Trigger>
        <Collapsible.Panel>{TEXT[lang].faqBody}</Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}

export const collapsibleDefinition = defineComponent({
  item: "collapsible",
  imports: ["Collapsible"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Pemicu dengan label di awal dan chevron di akhir, di atas panel yang tingginya beranimasi.",
        en: "A trigger with its label at the start and a chevron at the end, above a panel whose height animates.",
      },
      uses: ["Collapsible", "Collapsible.Trigger", "Collapsible.Panel"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "OrderDetails",
          [`import { Collapsible } from "${importPath(setup, "collapsible")}";`],
          [
            "<Collapsible.Root>",
            `  <Collapsible.Trigger>${TEXT[lang].details}</Collapsible.Trigger>`,
            `  <Collapsible.Panel>${TEXT[lang].body}</Collapsible.Panel>`,
            "</Collapsible.Root>",
          ],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size pada Root memberi pemicu setinggi 32, 40, dan 48px, dan teks panel mengikutinya.",
        en: "size on Root gives a trigger 32, 40, and 48px tall, and the panel's text follows.",
      },
      uses: ["Collapsible", "Collapsible.Trigger", "Collapsible.Panel"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Collapsible } from "${importPath(setup, "collapsible")}";`],
          SIZES.flatMap((size) => [
            `<Collapsible.Root size="${size}">`,
            `  <Collapsible.Trigger>${TEXT[lang][size]}</Collapsible.Trigger>`,
            `  <Collapsible.Panel>${TEXT[lang].body}</Collapsible.Panel>`,
            "</Collapsible.Root>",
          ]),
        ),
      ],
    },
    {
      id: "controlled",
      title: { id: "Terkendali", en: "Controlled" },
      description: {
        id: "open dan onOpenChange membiarkan Anda membuka panel dari luar, misalnya dengan tombol.",
        en: "open and onOpenChange let you open the panel from outside, with a button for example.",
      },
      uses: ["Collapsible", "Collapsible.Trigger", "Collapsible.Panel", "Button"],
      demo: (lang) => <Controlled lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Controlled",
          [
            'import { useState } from "react";',
            `import { Button } from "${importPath(setup, "button")}";`,
            `import { Collapsible } from "${importPath(setup, "collapsible")}";`,
          ],
          [
            "<Collapsible.Root open={open} onOpenChange={setOpen}>",
            `  <Collapsible.Trigger>${TEXT[lang].details}</Collapsible.Trigger>`,
            `  <Collapsible.Panel>${TEXT[lang].body}</Collapsible.Panel>`,
            "</Collapsible.Root>",
            `<Button onClick={() => setOpen(!open)}>${TEXT[lang].toggle}</Button>`,
          ],
          ["  const [open, setOpen] = useState(false);"],
        ),
      ],
    },
    {
      id: "custom-icon",
      title: { id: "Ikon sendiri", en: "Custom icon" },
      description: {
        id: "icon menggantikan chevron, dan icon={null} meniadakannya. Pemicu yang terbuka punya data-panel-open untuk CSS Anda.",
        en: "icon replaces the chevron, and icon={null} leaves it out. An open trigger has data-panel-open for your CSS.",
      },
      uses: ["Collapsible", "Collapsible.Trigger", "Collapsible.Panel"],
      demo: (lang) => <CustomIcon lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "CustomIcon",
          [`import { Collapsible } from "${importPath(setup, "collapsible")}";`],
          [
            "<Collapsible.Root>",
            `  <Collapsible.Trigger icon={<Plus />}>${TEXT[lang].faq}</Collapsible.Trigger>`,
            `  <Collapsible.Panel>${TEXT[lang].faqBody}</Collapsible.Panel>`,
            "</Collapsible.Root>",
            "<Collapsible.Root>",
            `  <Collapsible.Trigger icon={null}>${TEXT[lang].more}</Collapsible.Trigger>`,
            `  <Collapsible.Panel>${TEXT[lang].faqBody}</Collapsible.Panel>`,
            "</Collapsible.Root>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <div style={{ inlineSize: 260 }}>
        <Collapsible.Root defaultOpen>
          <Collapsible.Trigger>{TEXT[lang].details}</Collapsible.Trigger>
          <Collapsible.Panel>{TEXT[lang].faqBody}</Collapsible.Panel>
        </Collapsible.Root>
      </div>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: "[data-slot=collapsible]",
      note: {
        id: "Div yang mengelompokkan pemicu dan panelnya; size di sini berlaku untuk keduanya. Ia tidak punya tampilan sendiri.",
        en: "A div that groups a trigger and its panel; size here applies to both. It has no look of its own.",
      },
    },
    {
      name: "Trigger",
      selector: ".ow-collapsible__trigger",
      size: true,
      note: {
        id: "Tombol senyap seperti Button ghost: label di awal, chevron di akhir, setinggi 32, 40, atau 48px.",
        en: "A quiet button like a ghost Button: the label at the start, the chevron at the end, 32, 40, or 48px tall.",
      },
    },
    {
      name: "Panel",
      selector: ".ow-collapsible__panel",
      note: {
        id: "Kotak yang tingginya beranimasi dan terpotong. Isinya duduk di elemen dalam yang memegang padding.",
        en: "The box whose height animates, clipped. Its children sit in an inner element that has the padding.",
      },
    },
  ],
});

export default function CollapsiblePage(props: ExamplePageProps) {
  return <ComponentPage definition={collapsibleDefinition} {...props} />;
}
