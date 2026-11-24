"use client";

import { Field, Slider, type SliderSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    volume: "Volume",
    price: "Rentang harga",
    lowest: "Harga terendah",
    highest: "Harga tertinggi",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    bass: "Bass",
    mid: "Mid",
    treble: "Treble",
    loudness: "Kenyaringan",
    help: "Paling keras 80 agar aman bagi telinga.",
    error: "Di atas 80 bisa merusak pendengaran.",
    locale: "id-ID",
    currency: "IDR",
  },
  en: {
    volume: "Volume",
    price: "Price range",
    lowest: "Lowest price",
    highest: "Highest price",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    bass: "Bass",
    mid: "Mid",
    treble: "Treble",
    loudness: "Loudness",
    help: "Keep it at 80 or below to be safe for your ears.",
    error: "Above 80 can harm your hearing.",
    locale: "en-US",
    currency: "USD",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly SliderSize[] = ["sm", "md", "lg"];
const PRICE = {
  id: { max: 1000000, step: 50000, value: [200000, 700000] },
  en: { max: 1000, step: 50, value: [200, 700] },
} as const;

function Default({ lang }: { lang: Lang }) {
  return (
    <Slider.Root className="demo-slider" defaultValue={40}>
      <Slider.Label>{TEXT[lang].volume}</Slider.Label>
      <Slider.Value />
      <Slider.Control />
    </Slider.Root>
  );
}

function Range({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Slider.Root
      className="demo-slider"
      defaultValue={[...PRICE[lang].value]}
      max={PRICE[lang].max}
      step={PRICE[lang].step}
      format={{
        style: "currency",
        currency: t.currency,
        maximumFractionDigits: 0,
        notation: "compact",
      }}
      locale={t.locale}
    >
      <Slider.Label>{t.price}</Slider.Label>
      <Slider.Value />
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb index={0} aria-label={t.lowest} />
          <Slider.Thumb index={1} aria-label={t.highest} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col demo-slider">
      {SIZES.map((size) => (
        <Slider.Root key={size} size={size} defaultValue={60}>
          <Slider.Label>{TEXT[lang][size]}</Slider.Label>
          <Slider.Value />
          <Slider.Control />
        </Slider.Root>
      ))}
    </div>
  );
}

function Vertical({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-slider-columns">
      {(
        [
          ["bass", 70],
          ["mid", 45],
          ["treble", 60],
        ] as const
      ).map(([key, value]) => (
        <Slider.Root key={key} orientation="vertical" defaultValue={value}>
          <Slider.Label>{t[key]}</Slider.Label>
          <Slider.Value />
          <Slider.Control />
        </Slider.Root>
      ))}
    </div>
  );
}

function WithField({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [value, setValue] = useState(60);
  const invalid = value > 80;
  return (
    <Field.Root name="loudness" invalid={invalid} className="demo-slider">
      <Field.Label>{t.loudness}</Field.Label>
      <Slider.Root value={value} onValueChange={setValue} />
      <Field.Description>{t.help}</Field.Description>
      <Field.Error match={invalid}>{t.error}</Field.Error>
    </Field.Root>
  );
}

const imp = (setup: TokenSetup) => [`import { Slider } from "${importPath(setup, "slider")}";`];

export const sliderDefinition = defineComponent({
  item: "slider",
  imports: ["Slider"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Label di awal dan nilai di akhir; Control menggambar track, isian, dan thumb sendiri.",
        en: "A label at the start and the value at the end; Control draws the track, the fill, and the thumb itself.",
      },
      uses: ["Slider", "Slider.Label", "Slider.Value"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("VolumeSlider", imp(setup), [
          "<Slider.Root defaultValue={40}>",
          `  <Slider.Label>${TEXT[lang].volume}</Slider.Label>`,
          "  <Slider.Value />",
          "  <Slider.Control />",
          "</Slider.Root>",
        ]),
      ],
    },
    {
      id: "range",
      title: { id: "Rentang", en: "Range" },
      description: {
        id: "Nilai berupa array menggambar satu thumb untuk tiap angka; isian mengisi ruang di antaranya. Tulis thumb-nya sendiri agar tiap thumb punya nama. format dan locale mengatur teks Value.",
        en: "A value array draws one thumb for each number, and the fill runs between them. Write the thumbs yourself so each has its own name. format and locale set Value's text.",
      },
      uses: ["Slider", "Slider.Label", "Slider.Value"],
      demo: (lang) => <Range lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("PriceRange", imp(setup), [
            "<Slider.Root",
            `  defaultValue={[${PRICE[lang].value.join(", ")}]}`,
            `  max={${PRICE[lang].max}}`,
            `  step={${PRICE[lang].step}}`,
            `  format={{ style: "currency", currency: "${t.currency}", maximumFractionDigits: 0, notation: "compact" }}`,
            `  locale="${t.locale}"`,
            ">",
            `  <Slider.Label>${t.price}</Slider.Label>`,
            "  <Slider.Value />",
            "  <Slider.Control>",
            "    <Slider.Track>",
            "      <Slider.Indicator />",
            `      <Slider.Thumb index={0} aria-label="${t.lowest}" />`,
            `      <Slider.Thumb index={1} aria-label="${t.highest}" />`,
            "    </Slider.Track>",
            "  </Slider.Control>",
            "</Slider.Root>",
          ]),
        ];
      },
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg memberi track 4, 6, dan 8px dengan thumb 16, 20, dan 24px. Area sentuhnya tetap setidaknya 24px.",
        en: "sm, md, and lg give a 4, 6, and 8px track with a 16, 20, and 24px thumb. The target stays at least 24px.",
      },
      uses: ["Slider", "Slider.Label", "Slider.Value"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) => [
            `<Slider.Root size="${size}" defaultValue={60}>`,
            `  <Slider.Label>${TEXT[lang][size]}</Slider.Label>`,
            "  <Slider.Value />",
            "  <Slider.Control />",
            "</Slider.Root>",
          ]),
        ),
      ],
    },
    {
      id: "vertical",
      title: { id: "Vertikal", en: "Vertical" },
      description: {
        id: 'orientation="vertical" membuatnya kolom setinggi 12rem. Beri blockSize atau tinggi sendiri untuk mengubahnya; panah atas menaikkan nilai.',
        en: 'orientation="vertical" makes it a column 12rem tall. Give it your own height to change that; Arrow Up raises the value.',
      },
      uses: ["Slider", "Slider.Label", "Slider.Value"],
      demo: (lang) => <Vertical lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Equalizer",
          imp(setup),
          [
            ["bass", 70],
            ["mid", 45],
            ["treble", 60],
          ].flatMap(([key, value]) => [
            `<Slider.Root orientation="vertical" defaultValue={${value}}>`,
            `  <Slider.Label>${TEXT[lang][key as "bass" | "mid" | "treble"]}</Slider.Label>`,
            "  <Slider.Value />",
            "  <Slider.Control />",
            "</Slider.Root>",
          ]),
        ),
      ],
    },
    {
      id: "field",
      title: { id: "Dengan field", en: "With a field" },
      description: {
        id: "Field memberi label, deskripsi, dan error; invalid mewarnai isian jadi critical. Coba geser di atas 80.",
        en: "Field gives it a label, a description, and an error; invalid turns the fill critical. Drag above 80 to see it.",
      },
      uses: ["Slider", "Field"],
      demo: (lang) => <WithField lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "Loudness",
            [
              'import { useState } from "react";',
              `import { Field } from "${importPath(setup, "field")}";`,
              ...imp(setup),
            ],
            [
              '<Field.Root name="loudness" invalid={invalid}>',
              `  <Field.Label>${t.loudness}</Field.Label>`,
              "  <Slider.Root value={value} onValueChange={setValue} />",
              `  <Field.Description>${t.help}</Field.Description>`,
              `  <Field.Error match={invalid}>${t.error}</Field.Error>`,
              "</Field.Root>",
            ],
            ["  const [value, setValue] = useState(60);", "  const invalid = value > 80;"],
          ),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Slider.Root defaultValue={60} size="lg" className="demo-slider">
        <Slider.Label>{TEXT[lang].volume}</Slider.Label>
        <Slider.Value />
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-slider",
      note: {
        id: "Div dengan role group: label di awal dan nilai di akhir di atas control. Tanpa children ia menggambar Control dengan satu thumb untuk tiap nilai, dan aria-label diteruskan ke thumb. size-nya mengatur track, thumb, dan font.",
        en: "A div with the group role: the label at the start and the value at the end above the control. With no children it draws a Control with one thumb for each value, and passes aria-label to the thumbs. Its size sets the track, the thumb, and the font.",
      },
      tokens: {
        "--ow-accent": "--_fill",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Label",
      selector: ".ow-slider__label",
      note: {
        id: "Nama slider, di awal baris di atas control. Ia menamai thumb lewat aria-labelledby.",
        en: "The slider's name, at the start of the line above the control. It names the thumbs through aria-labelledby.",
      },
    },
    {
      name: "Value",
      selector: ".ow-slider__value",
      note: {
        id: "Output dengan angka tabular, di akhir baris; rentang terbaca “20 – 80”. Hanya angkanya yang mengikuti nilai.",
        en: "An output in tabular figures at the end of the line; a range reads “20 – 80”. Only the number follows the value.",
      },
    },
    {
      name: "Control",
      selector: ".ow-slider__control",
      note: {
        id: "Area yang menerima pointer, setidaknya 24px tinggi. Padding sisinya setengah thumb, sehingga thumb di ujung tetap di dalam slider.",
        en: "The area that takes the pointer, at least 24px tall. It pads both ends by half a thumb, so a thumb at either end stays within the slider.",
      },
    },
    {
      name: "Track",
      selector: ".ow-slider__track",
      size: true,
      note: {
        id: "Alur berbentuk pil setebal 4, 6, atau 8px, digambar setengah thumb melewati tiap ujung: tint 10% dari warna teks. Thumb ada di dalamnya. Track tanpa children menggambar Indicator dan thumb sendiri.",
        en: "A pill groove 4, 6, or 8px thick, drawn half a thumb past each end: a 10% tint of the text color. The thumbs sit inside it. Track draws its own Indicator and thumbs without children.",
      },
      tokens: {
        "--ow-fg": "--_track",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-slider__indicator",
      note: {
        id: "Isian warna aksen dari awal track sampai thumb, atau di antara dua thumb; ia digambar setengah thumb lebih panjang di awalnya. Base UI yang menaruhnya dengan inset dan lebar inline.",
        en: "The accent fill from the start of the track to the thumb, or between two thumbs; it is drawn half a thumb longer at its start. Base UI places it with an inline inset and width.",
      },
      tokens: {
        "--ow-accent": "--_fill",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-slider__thumb",
      size: true,
      note: {
        id: "Kunci putih bulat 16, 20, atau 24px dengan bayangan permukaan, berisi input range dari Base UI. Ia sedikit membesar di bawah mouse dan saat diseret.",
        en: "A white round key 16, 20, or 24px with the surface shadow, holding Base UI's range input. It grows a little under a mouse and while dragged.",
      },
      tokens: {
        "--ow-on-accent": "--_key",
        "--ow-surface-shadow": "--_key-shadow",
        "--ow-focus": "--_focus",
      },
    },
  ],
});

export default function SliderPage(props: ExamplePageProps) {
  return <ComponentPage definition={sliderDefinition} {...props} />;
}
