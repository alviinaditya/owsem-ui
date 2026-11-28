"use client";

import { Meter, type MeterSize, type MeterTone } from "owsem-ui/base";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    storage: "Penyimpanan",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    accent: "Aksen",
    good: "Baik",
    warning: "Perhatian",
    critical: "Kritis",
    used: "terpakai dari 100 GB",
    battery: "Baterai",
    week: "Minggu kerja",
    legend: "Bagian minggu kerja",
    parts: { focus: "Fokus", meetings: "Rapat", reviews: "Tinjauan", support: "Bantuan" },
    unit: "jam",
    hours: (value: number) => `${value} jam`,
    total: (used: number, all: number) => `${used} dari ${all} jam`,
  },
  en: {
    storage: "Storage",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    accent: "Accent",
    good: "Good",
    warning: "Warning",
    critical: "Critical",
    used: "used of 100 GB",
    battery: "Battery",
    week: "Working week",
    legend: "Parts of the working week",
    parts: { focus: "Focus", meetings: "Meetings", reviews: "Reviews", support: "Support" },
    unit: "h",
    hours: (value: number) => `${value} h`,
    total: (used: number, all: number) => `${used} of ${all} h`,
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly MeterSize[] = ["sm", "md", "lg"];

const TONES: readonly { tone: MeterTone; value: number }[] = [
  { tone: "accent", value: 48 },
  { tone: "good", value: 82 },
  { tone: "warning", value: 71 },
  { tone: "critical", value: 94 },
];

const PARTS = [
  { id: "focus", hours: 14 },
  { id: "meetings", hours: 9 },
  { id: "reviews", hours: 6 },
  { id: "support", hours: 3 },
] as const;

const WEEK = 40;
const USED = PARTS.reduce((sum, part) => sum + part.hours, 0);

function Breakdown({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-parts">
      <Meter.Group defaultActive="focus">
        {(shown) => {
          const part = PARTS.find((one) => one.id === shown);
          return (
            <>
              <Meter.Root value={USED} max={WEEK} getAriaValueText={() => t.total(USED, WEEK)}>
                <Meter.Label>{t.week}</Meter.Label>
                <Meter.Value>
                  {() =>
                    part
                      ? `${t.parts[part.id]} · ${Math.round((part.hours / WEEK) * 100)}%`
                      : t.total(USED, WEEK)
                  }
                </Meter.Value>
                <Meter.Track>
                  {PARTS.map((one) => (
                    <Meter.Segment key={one.id} name={one.id} value={one.hours} />
                  ))}
                </Meter.Track>
              </Meter.Root>
              <Meter.Legend aria-label={t.legend}>
                {PARTS.map((one) => (
                  <Meter.LegendItem key={one.id} name={one.id}>
                    {t.parts[one.id]} <Meter.LegendValue>{t.hours(one.hours)}</Meter.LegendValue>
                  </Meter.LegendItem>
                ))}
              </Meter.Legend>
            </>
          );
        }}
      </Meter.Group>
    </div>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar">
      <Meter.Root value={62}>
        <Meter.Label>{TEXT[lang].storage}</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar demo-col">
      {SIZES.map((size) => (
        <Meter.Root key={size} size={size} value={62}>
          <Meter.Label>{TEXT[lang][size]}</Meter.Label>
          <Meter.Value />
          <Meter.Track />
        </Meter.Root>
      ))}
    </div>
  );
}

function Tones({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar demo-col">
      {TONES.map(({ tone, value }) => (
        <Meter.Root key={tone} tone={tone} value={value}>
          <Meter.Label>{TEXT[lang][tone]}</Meter.Label>
          <Meter.Value />
          <Meter.Track />
        </Meter.Root>
      ))}
    </div>
  );
}

function Custom({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-bar">
      <Meter.Root
        value={62}
        tone="warning"
        format={{ style: "unit", unit: "gigabyte" }}
        getAriaValueText={(formatted) => `${formatted} ${t.used}`}
      >
        <Meter.Label>{t.storage}</Meter.Label>
        <Meter.Value>{(formatted) => `${formatted} / 100 GB`}</Meter.Value>
        <Meter.Track />
      </Meter.Root>
    </div>
  );
}

export const meterDefinition = defineComponent({
  item: "meter",
  imports: ["Meter"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Nilai dalam rentang 0 sampai 100, dengan label di awal dan nilai di akhir.",
        en: "A value in a range of 0 to 100, with the label at the start and the value at the end.",
      },
      uses: ["Meter", "Meter.Label", "Meter.Value"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "StorageMeter",
          [`import { Meter } from "${importPath(setup, "meter")}";`],
          [
            "<Meter.Root value={62}>",
            `  <Meter.Label>${TEXT[lang].storage}</Meter.Label>`,
            "  <Meter.Value />",
            "  <Meter.Track />",
            "</Meter.Root>",
          ],
        ),
      ],
    },
    {
      id: "breakdown",
      title: { id: "Rincian", en: "Breakdown" },
      description: {
        id: "Bagian-bagian dari satu keseluruhan: Group menghubungkan Segment dengan legendanya, dan memilih satu bagian menampilkannya.",
        en: "The parts of a whole: Group ties the Segments to their legend, and picking one shows it.",
      },
      uses: [
        "Meter",
        "Meter.Group",
        "Meter.Root",
        "Meter.Label",
        "Meter.Value",
        "Meter.Track",
        "Meter.Segment",
        "Meter.Legend",
        "Meter.LegendItem",
        "Meter.LegendValue",
      ],
      demo: (lang) => <Breakdown lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        const total = t.total(USED, WEEK);
        return [
          exampleFile(
            "WeekBreakdown",
            [`import { Meter } from "${importPath(setup, "meter")}";`],
            [
              '<Meter.Group defaultActive="focus">',
              "  {(shown) => {",
              "    const part = parts.find((one) => one.name === shown);",
              "    return (",
              "      <>",
              `        <Meter.Root value={${USED}} max={${WEEK}} getAriaValueText={() => "${total}"}>`,
              `          <Meter.Label>${t.week}</Meter.Label>`,
              "          <Meter.Value>",
              "            {() =>",
              "              part",
              `                ? \`\${part.label} · \${Math.round((part.hours / ${WEEK}) * 100)}%\``,
              `                : "${total}"`,
              "            }",
              "          </Meter.Value>",
              "          <Meter.Track>",
              "            {parts.map((one) => (",
              "              <Meter.Segment key={one.name} name={one.name} value={one.hours} />",
              "            ))}",
              "          </Meter.Track>",
              "        </Meter.Root>",
              `        <Meter.Legend aria-label="${t.legend}">`,
              "          {parts.map((one) => (",
              "            <Meter.LegendItem key={one.name} name={one.name}>",
              `              {one.label} <Meter.LegendValue>{one.hours} ${t.unit}</Meter.LegendValue>`,
              "            </Meter.LegendItem>",
              "          ))}",
              "        </Meter.Legend>",
              "      </>",
              "    );",
              "  }}",
              "</Meter.Group>",
            ],
            [
              "  const parts = [",
              ...PARTS.map(
                (one) =>
                  `    { name: "${one.id}", label: "${t.parts[one.id]}", hours: ${one.hours} },`,
              ),
              "  ];",
            ],
          ),
        ];
      },
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg memberi track setebal 4, 8, dan 12px.",
        en: "sm, md, and lg give a track 4, 8, and 12px thick.",
      },
      uses: ["Meter", "Meter.Label", "Meter.Value"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Meter } from "${importPath(setup, "meter")}";`],
          SIZES.flatMap((size) => [
            `<Meter.Root size="${size}" value={62}>`,
            `  <Meter.Label>${TEXT[lang][size]}</Meter.Label>`,
            "  <Meter.Value />",
            "  <Meter.Track />",
            "</Meter.Root>",
          ]),
        ),
      ],
    },
    {
      id: "tones",
      title: { id: "Nada", en: "Tones" },
      description: {
        id: "tone mewarnai isian; halaman yang memilih nadanya. Warna bukan satu-satunya penanda, jadi biarkan Value atau aria-valuetext.",
        en: "tone colors the fill; the page picks it. Color is never the only signal, so keep Value or an aria-valuetext.",
      },
      uses: ["Meter", "Meter.Label", "Meter.Value"],
      demo: (lang) => <Tones lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Tones",
          [`import { Meter } from "${importPath(setup, "meter")}";`],
          TONES.flatMap(({ tone, value }) => [
            `<Meter.Root tone="${tone}" value={${value}}>`,
            `  <Meter.Label>${TEXT[lang][tone]}</Meter.Label>`,
            "  <Meter.Value />",
            "  <Meter.Track />",
            "</Meter.Root>",
          ]),
        ),
      ],
    },
    {
      id: "custom",
      title: { id: "Format", en: "Custom format" },
      description: {
        id: "format dan anak fungsi Value mengatur teks yang terlihat; getAriaValueText mengatur yang dibaca.",
        en: "format and Value's function child set the visible text; getAriaValueText sets what is read out.",
      },
      uses: ["Meter", "Meter.Label", "Meter.Value"],
      demo: (lang) => <Custom lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "DiskUsage",
          [`import { Meter } from "${importPath(setup, "meter")}";`],
          [
            "<Meter.Root",
            "  value={62}",
            '  tone="warning"',
            '  format={{ style: "unit", unit: "gigabyte" }}',
            `  getAriaValueText={(formatted) => \`\${formatted} ${TEXT[lang].used}\`}`,
            ">",
            `  <Meter.Label>${TEXT[lang].storage}</Meter.Label>`,
            `  <Meter.Value>{(formatted) => \`\${formatted} / 100 GB\`}</Meter.Value>`,
            "  <Meter.Track />",
            "</Meter.Root>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => {
      const t = TEXT[lang];
      return (
        <div style={{ inlineSize: 260 }}>
          <Meter.Group defaultActive="focus">
            <Meter.Root value={62} size="lg">
              <Meter.Label>{t.storage}</Meter.Label>
              <Meter.Value />
              <Meter.Track>
                <Meter.Indicator />
              </Meter.Track>
            </Meter.Root>
            <div style={{ marginBlockStart: 24 }}>
              <Meter.Root value={USED} max={WEEK} aria-label={t.week}>
                <Meter.Track>
                  {PARTS.map((one) => (
                    <Meter.Segment key={one.id} name={one.id} value={one.hours} />
                  ))}
                </Meter.Track>
              </Meter.Root>
            </div>
            <Meter.Legend aria-label={t.legend}>
              {PARTS.slice(0, 2).map((one) => (
                <Meter.LegendItem key={one.id} name={one.id}>
                  {t.parts[one.id]} <Meter.LegendValue>{t.hours(one.hours)}</Meter.LegendValue>
                </Meter.LegendItem>
              ))}
            </Meter.Legend>
          </Meter.Group>
        </div>
      );
    },
  },
  parts: [
    {
      name: "Group",
      selector: '[data-slot="meter-group"]',
      note: {
        id: "Div biasa di sekitar Root dan Legend. Ia menyimpan bagian yang dipilih dan yang sedang disorot pointer, supaya Segment dan item legenda saling menjawab.",
        en: "A plain div around the Root and the Legend. It holds the part that is picked and the one under the pointer, so a Segment and its legend item answer each other.",
      },
    },
    {
      name: "Root",
      selector: ".ow-meter",
      note: {
        id: "Div dengan role meter dan aria-valuenow: label di awal dan nilai di akhir di atas track. Root tanpa children menggambar Track sendiri.",
        en: "A div with the meter role and aria-valuenow: the label at the start and the value at the end above the track. Root draws its own Track without children.",
      },
      tokens: {
        "--ow-accent": "--_fill",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Label",
      selector: ".ow-meter__label",
      note: {
        id: "Nama meter, di awal baris di atas track. Ia menamai Root lewat aria-labelledby.",
        en: "The meter's name, at the start of the line above the track. It names Root through aria-labelledby.",
      },
    },
    {
      name: "Value",
      selector: ".ow-meter__value",
      note: {
        id: "Nilai terformat dengan angka tabular, di akhir baris. Disembunyikan dari screen reader: Root yang menyampaikannya.",
        en: "The formatted value in tabular figures, at the end of the line. Hidden from screen readers: Root says it.",
      },
    },
    {
      name: "Track",
      selector: ".ow-meter__track",
      size: true,
      note: {
        id: "Alur berbentuk pil setebal 4, 8, atau 12px: tint 10% dari warna teks. Track tanpa children menggambar Indicator sendiri.",
        en: "A pill groove 4, 8, or 12px thick: a 10% tint of the text color. Track draws its own Indicator without children.",
      },
      tokens: {
        "--ow-fg": "--_track",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-meter__indicator",
      note: {
        id: "Isian selebar track yang bergeser dengan translate, berwarna aksen atau nada yang dipilih.",
        en: "The fill, as wide as the track, moving with translate, in the accent or the tone you pick.",
      },
      tokens: {
        "--ow-accent": "--_fill",
      },
    },
    {
      name: "Segment",
      selector: ".ow-meter__segment",
      note: {
        id: "Pil selebar bagiannya dari rentang. Warnanya mengikuti posisi, dari aksen ke warna teks. Bagian lain memudar saat satu bagian ditampilkan.",
        en: "A pill as wide as its share of the range. Its color follows its position, from the accent toward the text color. The others fade while one part is shown.",
      },
      tokens: {
        "--ow-accent": "--_color",
      },
    },
    {
      name: "Legend",
      selector: ".ow-meter__legend",
      note: {
        id: "Grup tombol di bawah bar, di luar meter, yang membungkus baris bila sempit.",
        en: "A group of buttons below the bar, outside the meter, wrapping when it is narrow.",
      },
    },
    {
      name: "LegendItem",
      selector: ".ow-meter__legend-item",
      note: {
        id: "Tombol dengan titik berwarna bagiannya. Menekannya memilih bagian itu; menekan lagi melepasnya.",
        en: "A button with a dot in its part's color. Pressing it picks the part; pressing again clears it.",
      },
      tokens: {
        "--ow-accent": "--_color",
      },
    },
    {
      name: "LegendValue",
      selector: ".ow-meter__legend-value",
      note: {
        id: "Angka redup berangka tabular di akhir item legenda.",
        en: "A muted figure in tabular numbers at the end of a legend item.",
      },
    },
  ],
});

export default function MeterPage(props: ExamplePageProps) {
  return <ComponentPage definition={meterDefinition} {...props} />;
}
