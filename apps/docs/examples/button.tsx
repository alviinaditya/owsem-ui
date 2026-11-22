"use client";

import { Button, type ButtonVariant, IconButton } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: { add: "Tambah", save: "Simpan", sync: "Sinkronkan", publish: "Terbitkan", next: "Lanjut" },
  en: { add: "Add", save: "Save", sync: "Sync", publish: "Publish", next: "Next" },
} satisfies Record<Lang, Record<string, string>>;

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
];
const label = (variant: string) => variant[0]?.toUpperCase() + variant.slice(1);

function Variants() {
  return (
    <div className="demo-board">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {label(variant)}
        </Button>
      ))}
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-buttons">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Button key={size} size={size}>
          {TEXT[lang].save}
        </Button>
      ))}
    </div>
  );
}

function WithIcons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-buttons">
      <Button startIcon={<Icon name="plus" />}>{t.add}</Button>
      <Button variant="secondary" endIcon={<Icon name="arrow-right" />}>
        {t.next}
      </Button>
      <IconButton variant="secondary" icon={<Icon name="plus" />} aria-label={t.add} />
    </div>
  );
}

/** Each button loads for a moment when pressed, so the width that holds is easy to see. */
function Loading({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [loading, setLoading] = useState<string | null>(null);
  const run = (name: string) => {
    setLoading(name);
    setTimeout(() => setLoading(null), 1800);
  };
  return (
    <div className="demo-buttons">
      <Button
        variant="secondary"
        startIcon={<Icon name="rotate-ccw" />}
        loading={loading === "sync"}
        onClick={() => run("sync")}
      >
        {t.sync}
      </Button>
      <Button loading={loading === "publish"} onClick={() => run("publish")}>
        {t.publish}
      </Button>
    </div>
  );
}

function Disabled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-buttons">
      <Button disabled>{t.save}</Button>
      <Button variant="secondary" disabled>
        {t.save}
      </Button>
      <Button variant="secondary" disabled focusableWhenDisabled>
        {t.save}
      </Button>
    </div>
  );
}

export const buttonDefinition = defineComponent({
  item: "button",
  imports: ["Button", "IconButton"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Enam varian, dari aksi utama sampai yang merusak.",
        en: "Six variants, from the main action to the destructive one.",
      },
      uses: ["Button"],
      demo: () => <Variants />,
      code: (setup) => [
        exampleFile(
          "Actions",
          [`import { Button } from "${importPath(setup, "button")}";`],
          VARIANTS.map((v) => `<Button variant="${v}">${label(v)}</Button>`),
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg punya tinggi yang sama di setiap varian.",
        en: "sm, md, and lg share one height across every variant.",
      },
      uses: ["Button"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [`import { Button } from "${importPath(setup, "button")}";`],
          (["sm", "md", "lg"] as const).map(
            (size) => `<Button size="${size}">${TEXT[lang].save}</Button>`,
          ),
        ),
      ],
    },
    {
      id: "icons",
      title: { id: "Ikon", en: "Icons" },
      description: {
        id: "Ikon di awal atau akhir, atau tombol hanya-ikon dengan aria-label.",
        en: "An icon at the start or the end, or an icon-only button with an aria-label.",
      },
      uses: ["Button", "IconButton"],
      demo: (lang) => <WithIcons lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "IconButtons",
          [
            `import { Button, IconButton } from "${importPath(setup, "button")}";`,
            'import { ArrowRight, Plus } from "lucide-react";',
          ],
          [
            `<Button startIcon={<Plus />}>${TEXT[lang].add}</Button>`,
            '<Button variant="secondary" endIcon={<ArrowRight />}>',
            `  ${TEXT[lang].next}`,
            "</Button>",
            `<IconButton variant="secondary" icon={<Plus />} aria-label="${TEXT[lang].add}" />`,
          ],
        ),
      ],
    },
    {
      id: "loading",
      title: { id: "Memuat", en: "Loading" },
      description: {
        id: "loading menampilkan spinner tanpa mengubah lebar; tekan untuk mencobanya.",
        en: "loading shows a spinner without changing the width; press one to try it.",
      },
      uses: ["Button"],
      demo: (lang) => <Loading lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Publish",
          [
            'import { useState } from "react";',
            `import { Button } from "${importPath(setup, "button")}";`,
            'import { RotateCcw } from "lucide-react";',
          ],
          [
            "<Button",
            '  variant="secondary"',
            "  startIcon={<RotateCcw />}",
            '  loading={loading === "sync"}',
            '  onClick={() => run("sync")}',
            ">",
            `  ${TEXT[lang].sync}`,
            "</Button>",
            '<Button loading={loading === "publish"} onClick={() => run("publish")}>',
            `  ${TEXT[lang].publish}`,
            "</Button>",
          ],
          [
            "  const [loading, setLoading] = useState<string | null>(null);",
            "  const run = (name: string) => {",
            "    setLoading(name);",
            "    setTimeout(() => setLoading(null), 1800);",
            "  };",
          ],
        ),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled keluar dari urutan Tab; focusableWhenDisabled menjaganya tetap bisa difokus.",
        en: "disabled leaves the tab order; focusableWhenDisabled keeps it focusable.",
      },
      uses: ["Button"],
      demo: (lang) => <Disabled lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Disabled",
          [`import { Button } from "${importPath(setup, "button")}";`],
          [
            `<Button disabled>${TEXT[lang].save}</Button>`,
            '<Button variant="secondary" disabled>',
            `  ${TEXT[lang].save}`,
            "</Button>",
            '<Button variant="secondary" disabled focusableWhenDisabled>',
            `  ${TEXT[lang].save}`,
            "</Button>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Button startIcon={<Icon name="plus" />} endIcon={<Icon name="arrow-right" />}>
        {TEXT[lang].add}
      </Button>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-button",
      note: {
        id: "Button dari Base UI. Permukaannya (::before) digambar dari isi, bukan garis: primary dan destructive berwarna solid dengan sorot tipis di atas dan tanpa bayangan jatuh, secondary tint 8% dari warna teks (16% saat ditekan) tanpa bayangan, ghost transparan. Outline punya garis tipis dari inset shadow yang tidak menambah ukuran.",
        en: "Base UI's button. Its face (::before) is drawn from fill, not lines: primary and destructive are solid with a thin top highlight and no drop shadow, secondary is an 8% tint of the text color (16% held) with no shadow, ghost is clear. Outline has a quiet line, an inset shadow that adds no size.",
      },
      tokens: {
        "--ow-radius": "--_radius",
        "--ow-fg": "--_ink",
        "--ow-pressed-bg": "--_pressed-bg",
        "--ow-accent": "--_primary-bg",
        "--ow-on-accent": "--_on-primary",
        "--ow-critical-solid": "--_critical",
        "--ow-on-critical": "--_on-critical",
        "--ow-hover": "--_hover",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Icon",
      selector: '.ow-button__icon[data-side="start"]',
      size: true,
      note: {
        id: "Ukuran font ditambah 2px, ditarik ke tepi sejauh jaraknya ke atas. Dekoratif.",
        en: "The font size plus 2px, pulled toward the edge as far as it sits from the top. Decorative.",
      },
    },
    {
      name: "Label",
      selector: ".ow-button__label",
      note: {
        id: "Teks tombol, satu baris. Saat loading tanpa ikon awal, ia memudar tapi tetap mengisi ruangnya.",
        en: "The button's text, on one line. Loading without a start icon fades it but keeps its box.",
      },
    },
    {
      name: "End icon",
      selector: '.ow-button__icon[data-side="end"]',
      size: true,
      note: {
        id: "Sama seperti ikon awal, tetapi di ujung akhir: ditarik ke tepi akhir. Dekoratif.",
        en: "Like the start icon, but at the end: pulled toward the end edge. Decorative.",
      },
    },
    {
      name: "Spinner",
      selector: ".ow-button__spinner",
      note: {
        id: "Keadaan, bukan bagian tetap: hanya ada pada tombol yang punya prop loading. Menempati sel ikon awal (menggantikan ikon), atau di tengah.",
        en: "A state, not a fixed part: only on buttons with a loading prop. It takes the start icon's cell (replacing the icon), or the middle.",
      },
    },
    {
      name: "Ripple",
      selector: ".ow-button__layer",
      note: {
        id: "Lapisan yang memotong riak ke bentuk permukaan. Riaknya tumbuh dari titik tekan.",
        en: "The layer that clips the ripple to the face. The ripple grows from the press point.",
      },
    },
  ],
});

export default function ButtonPage(props: ExamplePageProps) {
  return <ComponentPage definition={buttonDefinition} {...props} />;
}
