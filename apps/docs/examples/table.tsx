"use client";

import { Table } from "owsem-ui/owsem";
import type { CSSProperties, ReactNode } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    caption: "Tagihan terbaru",
    columns: ["Tagihan", "Status", "Metode", "Jumlah"],
    paid: "Lunas",
    pending: "Menunggu",
    unpaid: "Belum dibayar",
    card: "Kartu",
    transfer: "Transfer",
    total: "Total",
    wide: [
      "Tagihan",
      "Pelanggan",
      "Status",
      "Metode",
      "Dibuat",
      "Jatuh tempo",
      "Mata uang",
      "Jumlah",
    ],
    customer: ["Mutiara Hasan", "Raka Putra", "Dewi Lestari"],
    created: "2 Nov",
    due: "16 Nov",
    currency: "USD",
  },
  en: {
    caption: "Recent invoices",
    columns: ["Invoice", "Status", "Method", "Amount"],
    paid: "Paid",
    pending: "Pending",
    unpaid: "Unpaid",
    card: "Card",
    transfer: "Transfer",
    total: "Total",
    wide: ["Invoice", "Customer", "Status", "Method", "Created", "Due", "Currency", "Amount"],
    customer: ["Maya Hassan", "Ray Porter", "Dee Lester"],
    created: "Nov 2",
    due: "Nov 16",
    currency: "USD",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

/** The invoices: id, status, method, amount. */
const rows = (lang: Lang): string[][] => {
  const t = TEXT[lang];
  return [
    ["INV-001", t.paid, t.card, "$250.00"],
    ["INV-002", t.pending, t.transfer, "$150.00"],
    ["INV-003", t.unpaid, t.card, "$350.00"],
    ["INV-004", t.paid, t.transfer, "$450.00"],
  ];
};

/** Rows of the wide table: the same invoices with more columns. */
const wideRows = (lang: Lang): string[][] => {
  const t = TEXT[lang];
  return rows(lang)
    .slice(0, 3)
    .map(([id, status, method, amount], i) => [
      id as string,
      t.customer[i] as string,
      status as string,
      method as string,
      t.created,
      t.due,
      t.currency,
      amount as string,
    ]);
};

const WIDTH: CSSProperties = { inlineSize: 560 };
const NARROW: CSSProperties = { inlineSize: 340 };

function Grid({
  head,
  body,
  foot,
  ...props
}: {
  head: string[];
  body: string[][];
  foot?: string[];
  caption?: ReactNode;
  size?: "default" | "sm";
  layout?: "table" | "stack" | "auto";
  label?: string;
  style?: CSSProperties;
}) {
  const { caption, label, ...root } = props;
  return (
    <Table.Root {...root} aria-label={label}>
      {caption ? <Table.Caption>{caption}</Table.Caption> : null}
      <Table.Header>
        <Table.Row>
          {head.map((name) => (
            <Table.Head key={name}>{name}</Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {body.map((row) => (
          <Table.Row key={row[0]}>
            {row.map((value) => (
              <Table.Cell key={value}>{value}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
      {foot ? (
        <Table.Footer>
          <Table.Row>
            {foot.map((value, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed row
              <Table.Cell key={i}>{value}</Table.Cell>
            ))}
          </Table.Row>
        </Table.Footer>
      ) : null}
    </Table.Root>
  );
}

/** Any other setup comes from the owsem CLI, which copies the component into the project. */
const importLine = (setup: TokenSetup) =>
  `import { Table } from "${isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/table"}";`;

const cells = (tag: "Head" | "Cell", values: string[]) =>
  `  ${values.map((value) => `<Table.${tag}>${value}</Table.${tag}>`).join("")}`;

const headerLines = (head: string[]) => [
  "<Table.Header>",
  "  <Table.Row>",
  `  ${cells("Head", head)}`,
  "  </Table.Row>",
  "</Table.Header>",
];

const bodyLines = (body: string[][]) => [
  "<Table.Body>",
  ...body.flatMap((row) => ["  <Table.Row>", `  ${cells("Cell", row)}`, "  </Table.Row>"]),
  "</Table.Body>",
];

const indent = (lines: string[]) => lines.map((line) => `  ${line}`);

export const tableDefinition = defineComponent({
  item: "table",
  imports: ["Table"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Kartu dengan baris judul yang tenang dan garis tipis di antara baris; tanpa garis vertikal.",
        en: "A card with a quiet heading row and hairlines between rows, with no vertical lines.",
      },
      uses: ["Table"],
      demo: (lang) => (
        <Grid
          style={WIDTH}
          head={TEXT[lang].columns}
          body={rows(lang)}
          label={TEXT[lang].caption}
        />
      ),
      code: (setup, lang) => [
        exampleFile(
          "Invoices",
          [importLine(setup)],
          [
            "<Table.Root>",
            ...indent(headerLines(TEXT[lang].columns)),
            ...indent(bodyLines(rows(lang))),
            "</Table.Root>",
          ],
        ),
      ],
    },
    {
      id: "caption",
      title: { id: "Dengan caption", en: "With caption" },
      description: {
        id: "Caption menjadi judul kecil di atas kartu dan menamai tabel; Footer menutup dengan total.",
        en: "The Caption is a small title above the card and names the table; the Footer closes with a total.",
      },
      uses: ["Table"],
      demo: (lang) => (
        <Grid
          style={WIDTH}
          caption={TEXT[lang].caption}
          head={TEXT[lang].columns}
          body={rows(lang).slice(0, 3)}
          foot={[TEXT[lang].total, "", "", "$750.00"]}
        />
      ),
      code: (setup, lang) => [
        exampleFile(
          "Invoices",
          [importLine(setup)],
          [
            "<Table.Root>",
            `  <Table.Caption>${TEXT[lang].caption}</Table.Caption>`,
            ...indent(headerLines(TEXT[lang].columns)),
            ...indent(bodyLines(rows(lang).slice(0, 3))),
            "  <Table.Footer>",
            "    <Table.Row>",
            `    ${cells("Cell", [TEXT[lang].total, "", "", "$750.00"])}`,
            "    </Table.Row>",
            "  </Table.Footer>",
            "</Table.Root>",
          ],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: 'size="sm" merapatkan sel untuk tabel yang padat.',
        en: 'size="sm" tightens the cells for a dense table.',
      },
      uses: ["Table"],
      demo: (lang) => (
        <div style={{ ...WIDTH, display: "grid" }}>
          <Grid
            caption="default"
            head={TEXT[lang].columns}
            body={rows(lang).slice(0, 2)}
            label="default"
          />
          <Grid
            caption="sm"
            size="sm"
            head={TEXT[lang].columns}
            body={rows(lang).slice(0, 2)}
            label="sm"
          />
        </div>
      ),
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [importLine(setup)],
          [
            '<Table.Root size="sm">',
            ...indent(headerLines(TEXT[lang].columns)),
            ...indent(bodyLines(rows(lang).slice(0, 2))),
            "</Table.Root>",
          ],
        ),
      ],
    },
    {
      id: "stacked",
      title: { id: "Bertumpuk", en: "Stacked" },
      description: {
        id: "Di bawah 480 px lebar Root, tiap baris menjadi blok: sel pertama judulnya, sel lain diawali judul kolomnya.",
        en: "Under 480 px of Root width each row becomes a block: the first cell is its title and the others lead with their column's heading.",
      },
      uses: ["Table"],
      demo: (lang) => (
        <Grid
          style={NARROW}
          head={TEXT[lang].columns}
          body={rows(lang).slice(0, 3)}
          label={TEXT[lang].caption}
        />
      ),
      code: (setup, lang) => [
        exampleFile(
          "Invoices",
          [importLine(setup)],
          [
            '{/* layout="stack" stacks at any width; the default, "auto", stacks under 480px. */}',
            '<Table.Root layout="stack">',
            ...indent(headerLines(TEXT[lang].columns)),
            ...indent(bodyLines(rows(lang).slice(0, 3))),
            "</Table.Root>",
          ],
        ),
      ],
    },
    {
      id: "scrolling",
      title: { id: "Menggulir", en: "Scrolling" },
      description: {
        id: 'Dengan layout="table", tabel lebar menggulir di dalam kartu; tepinya memudar di sisi yang masih ada isinya.',
        en: 'With layout="table", a wide table scrolls inside the card; its edges fade on the sides with more.',
      },
      uses: ["Table"],
      demo: (lang) => (
        <Grid
          style={NARROW}
          layout="table"
          head={TEXT[lang].wide}
          body={wideRows(lang)}
          label={TEXT[lang].caption}
        />
      ),
      code: (setup, lang) => [
        exampleFile(
          "Invoices",
          [importLine(setup)],
          [
            `<Table.Root layout="table" aria-label="${TEXT[lang].caption}">`,
            ...indent(headerLines(TEXT[lang].wide)),
            ...indent(bodyLines(wideRows(lang))),
            "</Table.Root>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Grid
        style={WIDTH}
        caption={TEXT[lang].caption}
        head={TEXT[lang].columns}
        body={rows(lang).slice(0, 2)}
        foot={[TEXT[lang].total, "", "", "$400.00"]}
      />
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-table",
      note: {
        id: "Kartu: warna panel, bayangan permukaan, dan radius. Isinya terpotong mengikuti sudut; data-layout, data-size.",
        en: "The card: the panel fill, the surface shadow, and the radius. Its content is clipped to the corners; data-layout, data-size.",
      },
      tokens: {
        "--ow-panel": "--_panel",
        "--ow-surface-shadow": "--_shadow",
        "--ow-radius": "--_radius",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "Caption",
      selector: ".ow-table__caption",
      note: {
        id: "Judul kecil di atas kartu, bukan di dalamnya; menamai tabel.",
        en: "A small title above the card, not inside it; it names the table.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Header",
      selector: ".ow-table__header",
      note: {
        id: "Baris judul kolom: tint 4% dari warna teks dengan garis tipis di bawahnya. Bertumpuk, ia tetap ada untuk pembaca layar.",
        en: "The column headings: a 4% tint of the text color over a hairline. Stacked, it stays for screen readers.",
      },
      tokens: { "--ow-line": "--_line" },
    },
    {
      name: "Head",
      selector: ".ow-table__head",
      note: {
        id: 'Sel judul (th): teks muted 13px, bobot 500, scope="col". Teksnya melabeli sel kolom itu saat bertumpuk.',
        en: 'A heading cell (th): 13px muted text at weight 500, scope="col". Its text labels that column\'s cells when stacked.',
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Body",
      selector: ".ow-table__body",
      note: {
        id: "Baris data, dipisah garis tipis kecuali setelah baris terakhir.",
        en: "The data rows, split by hairlines except after the last.",
      },
    },
    {
      name: "Row",
      selector: ".ow-table__body .ow-table__row",
      note: {
        id: "Satu baris. Bertumpuk, ia menjadi blok dengan sel pertama sebagai judul.",
        en: "One row. Stacked, it is a block whose first cell is the title.",
      },
    },
    {
      name: "Cell",
      selector: ".ow-table__body .ow-table__cell",
      note: {
        id: "Sel data (td): padding 10px 14px, rata atas, teks 14px.",
        en: "A data cell (td): 10px 14px of padding, top-aligned, 14px text.",
      },
    },
    {
      name: "Footer",
      selector: ".ow-table__footer",
      note: {
        id: "Baris penutup seperti total, dengan tint yang sama dengan Header dan garis tipis di atasnya.",
        en: "Closing rows such as a total, with the Header's tint and a hairline above.",
      },
    },
  ],
});

export default function TablePage(props: ExamplePageProps) {
  return <ComponentPage definition={tableDefinition} {...props} />;
}
