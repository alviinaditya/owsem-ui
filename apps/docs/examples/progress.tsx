"use client";

import { Button, Progress, type ProgressSize } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    upload: "Mengunggah",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    loading: "Memuat",
    finish: "Selesai",
    again: "Ulangi",
    done: "Selesai",
    file: "Berkas",
    of: "dari",
  },
  en: {
    upload: "Uploading",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    loading: "Loading",
    finish: "Finish",
    again: "Again",
    done: "Done",
    file: "File",
    of: "of",
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly ProgressSize[] = ["sm", "md", "lg"];

function Default({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar">
      <Progress.Root value={60}>
        <Progress.Label>{TEXT[lang].upload}</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-bar demo-col">
      {SIZES.map((size) => (
        <Progress.Root key={size} size={size} value={60}>
          <Progress.Label>{TEXT[lang][size]}</Progress.Label>
          <Progress.Value />
          <Progress.Track />
        </Progress.Root>
      ))}
    </div>
  );
}

function Indeterminate({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [done, setDone] = useState(false);
  return (
    <div className="demo-bar demo-col">
      <Progress.Root value={done ? 100 : null}>
        <Progress.Label>{done ? t.done : t.loading}</Progress.Label>
        <Progress.Value />
        <Progress.Track />
      </Progress.Root>
      <div>
        <Button size="sm" variant="secondary" onClick={() => setDone(!done)}>
          {done ? t.again : t.finish}
        </Button>
      </div>
    </div>
  );
}

function Custom({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-bar">
      <Progress.Root
        value={3}
        max={8}
        format={{ style: "unit", unit: "megabyte" }}
        getAriaValueText={(formatted) => `${formatted} ${t.of} 8 MB`}
      >
        <Progress.Label>{t.file}</Progress.Label>
        <Progress.Value>{(formatted) => `${formatted} / 8 MB`}</Progress.Value>
        <Progress.Track />
      </Progress.Root>
    </div>
  );
}

export const progressDefinition = defineComponent({
  item: "progress",
  imports: ["Progress"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Label di awal dan nilai di akhir, di atas track yang tergambar sendiri.",
        en: "A label at the start and the value at the end, above a track that draws itself.",
      },
      uses: ["Progress", "Progress.Label", "Progress.Value"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "UploadProgress",
          [`import { Progress } from "${importPath(setup, "progress")}";`],
          [
            "<Progress.Root value={60}>",
            `  <Progress.Label>${TEXT[lang].upload}</Progress.Label>`,
            "  <Progress.Value />",
            "  <Progress.Track />",
            "</Progress.Root>",
          ],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg memberi track setebal 4, 8, dan 12px.",
        en: "sm, md, and lg give a track 4, 8, and 12px thick.",
      },
      uses: ["Progress", "Progress.Label", "Progress.Value"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Progress } from "${importPath(setup, "progress")}";`],
          SIZES.flatMap((size) => [
            `<Progress.Root size="${size}" value={60}>`,
            `  <Progress.Label>${TEXT[lang][size]}</Progress.Label>`,
            "  <Progress.Value />",
            "  <Progress.Track />",
            "</Progress.Root>",
          ]),
        ),
      ],
    },
    {
      id: "indeterminate",
      title: { id: "Tak tentu", en: "Indeterminate" },
      description: {
        id: "value={null}: segmen berjalan di track sampai Anda memberi nilai. Dengan gerak dikurangi, segmen diam di tengah.",
        en: "value={null}: a segment travels the track until you give it a value. With reduced motion, the segment sits still in the middle.",
      },
      uses: ["Progress", "Progress.Label", "Progress.Value", "Button"],
      demo: (lang) => <Indeterminate lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Loading",
          [
            'import { useState } from "react";',
            `import { Button } from "${importPath(setup, "button")}";`,
            `import { Progress } from "${importPath(setup, "progress")}";`,
          ],
          [
            "<Progress.Root value={done ? 100 : null}>",
            `  <Progress.Label>{done ? "${TEXT[lang].done}" : "${TEXT[lang].loading}"}</Progress.Label>`,
            "  <Progress.Value />",
            "  <Progress.Track />",
            "</Progress.Root>",
            `<Button onClick={() => setDone(!done)}>{done ? "${TEXT[lang].again}" : "${TEXT[lang].finish}"}</Button>`,
          ],
          ["  const [done, setDone] = useState(false);"],
        ),
      ],
    },
    {
      id: "custom",
      title: { id: "Nilai dan format", en: "Custom value and format" },
      description: {
        id: "min, max, dan format mengatur skala; anak fungsi Value dan getAriaValueText mengatur teksnya.",
        en: "min, max, and format set the scale; Value's function child and getAriaValueText set the text.",
      },
      uses: ["Progress", "Progress.Label", "Progress.Value"],
      demo: (lang) => <Custom lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "FileProgress",
          [`import { Progress } from "${importPath(setup, "progress")}";`],
          [
            "<Progress.Root",
            "  value={3}",
            "  max={8}",
            '  format={{ style: "unit", unit: "megabyte" }}',
            `  getAriaValueText={(formatted) => \`\${formatted} ${TEXT[lang].of} 8 MB\`}`,
            ">",
            `  <Progress.Label>${TEXT[lang].file}</Progress.Label>`,
            `  <Progress.Value>{(formatted) => \`\${formatted} / 8 MB\`}</Progress.Value>`,
            "  <Progress.Track />",
            "</Progress.Root>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <div style={{ inlineSize: 240 }}>
        <Progress.Root value={60} size="lg">
          <Progress.Label>{TEXT[lang].upload}</Progress.Label>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      </div>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-progress",
      note: {
        id: "Div dengan role progressbar dan aria-valuenow: label di awal dan nilai di akhir di atas track. Root tanpa children menggambar Track sendiri.",
        en: "A div with the progressbar role and aria-valuenow: the label at the start and the value at the end above the track. Root draws its own Track without children.",
      },
      tokens: {
        "--ow-accent": "--_fill",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Label",
      selector: ".ow-progress__label",
      note: {
        id: "Nama bar, di awal baris di atas track. Ia menamai Root lewat aria-labelledby.",
        en: "The bar's name, at the start of the line above the track. It names Root through aria-labelledby.",
      },
    },
    {
      name: "Value",
      selector: ".ow-progress__value",
      note: {
        id: "Nilai terformat dengan angka tabular, di akhir baris. Disembunyikan dari screen reader: Root yang menyampaikannya.",
        en: "The formatted value in tabular figures, at the end of the line. Hidden from screen readers: Root says it.",
      },
    },
    {
      name: "Track",
      selector: ".ow-progress__track",
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
      selector: ".ow-progress__indicator",
      note: {
        id: "Isian warna aksen selebar track yang bergeser dengan translate. Tanpa nilai, ia segmen yang berjalan di track.",
        en: "The accent fill, as wide as the track, moving with translate. With no value it is a segment that travels the track.",
      },
      tokens: {
        "--ow-accent": "--_fill",
      },
    },
  ],
});

export default function ProgressPage(props: ExamplePageProps) {
  return <ComponentPage definition={progressDefinition} {...props} />;
}
