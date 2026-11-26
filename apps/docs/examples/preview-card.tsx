"use client";

import { PreviewCard } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    before: "Sebelum memasang komponen pertama, baca",
    link: "dokumentasi OwsemUI",
    after: ".",
    title: "Dokumentasi OwsemUI",
    body: "Setiap komponen punya pratinjau, contoh, dan perintah pasang.",
    note: "Kartu ini tidak dibacakan pembaca layar; link-nya harus bermakna sendiri.",
    top: "Atas",
    right: "Kanan",
    bottom: "Bawah",
    left: "Kiri",
    side: "Kartu di sisi",
  },
  en: {
    before: "Before you install the first component, read the",
    link: "OwsemUI docs",
    after: ".",
    title: "OwsemUI docs",
    body: "Every component has a preview, examples, and an install command.",
    note: "Screen readers do not announce this card; the link has to make sense alone.",
    top: "Top",
    right: "Right",
    bottom: "Bottom",
    left: "Left",
    side: "Card on the",
  },
} satisfies Record<Lang, Record<string, string>>;

/** A picture drawn in place, so the card makes no request. */
function Picture() {
  return (
    <svg className="demo-preview-card-image" viewBox="0 0 320 120" aria-hidden="true">
      <rect width="320" height="120" style={{ fill: "var(--ow-accent)" }} opacity="0.16" />
      <rect x="24" y="24" width="120" height="72" rx="10" style={{ fill: "var(--ow-raised-bg)" }} />
      <rect x="36" y="38" width="64" height="8" rx="4" style={{ fill: "var(--ow-accent)" }} />
      <rect x="36" y="56" width="88" height="6" rx="3" style={{ fill: "var(--ow-muted)" }} />
      <rect x="36" y="70" width="52" height="6" rx="3" style={{ fill: "var(--ow-muted)" }} />
      <circle cx="226" cy="60" r="34" style={{ fill: "var(--ow-accent)" }} opacity="0.5" />
      <circle cx="250" cy="48" r="18" style={{ fill: "var(--ow-raised-bg)" }} />
    </svg>
  );
}

/** A link with its card. `arrow` and `side` are the only things the examples change. */
function Link({
  lang,
  arrow,
  side,
  picture,
  label,
  open,
  container,
}: {
  lang: Lang;
  arrow?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  picture?: boolean;
  label?: ReactNode;
  open?: boolean;
  container?: HTMLElement | null;
}) {
  const t = TEXT[lang];
  return (
    <PreviewCard.Root {...(open ? { open: true } : {})}>
      <PreviewCard.Trigger href="/" data-demo="link">
        {label ?? t.link}
      </PreviewCard.Trigger>
      <PreviewCard.Portal {...(open ? { container } : {})}>
        <PreviewCard.Positioner
          {...(side ? { side } : {})}
          {...(open ? { positionMethod: "absolute" as const } : {})}
        >
          <PreviewCard.Popup
            className="demo-preview-card-popup"
            data-demo="card"
            {...(open ? { inert: true } : {})}
          >
            {arrow ? <PreviewCard.Arrow /> : null}
            {picture ? <Picture /> : null}
            <strong>{t.title}</strong>
            <p>{t.body}</p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

/** The sentence a link sits in: the card previews what the link goes to. */
/** The link ends the sentence, so the card below it covers no text. */
function Sentence({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = TEXT[lang];
  return (
    <p className="demo-preview-card-text">
      {t.before} {children}
      {t.after}
    </p>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Sentence lang={lang}>
      <Link lang={lang} />
    </Sentence>
  );
}

function WithArrow({ lang }: { lang: Lang }) {
  return (
    <Sentence lang={lang}>
      <Link lang={lang} arrow />
    </Sentence>
  );
}

function LinkPreview({ lang }: { lang: Lang }) {
  return (
    <Sentence lang={lang}>
      <Link lang={lang} arrow picture />
    </Sentence>
  );
}

function Sides({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-preview-card-sides">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Link key={side} lang={lang} side={side} arrow label={t[side]} />
      ))}
    </div>
  );
}

/**
 * Every part, the card held open under its link: it lands in its own box, with no focus taken,
 * so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-preview-card-specimen">
      <Sentence lang={lang}>
        <Link lang={lang} arrow picture open container={box} />
      </Sentence>
    </div>
  );
}

const imports = (setup: TokenSetup) =>
  isDefaultSetup(setup)
    ? ['import { PreviewCard } from "owsem-ui/base";']
    : [`import { PreviewCard } from "${importPath(setup, "preview-card")}";`];

const card = (lang: Lang, options: { arrow?: boolean; picture?: boolean; side?: string } = {}) => {
  const t = TEXT[lang];
  return [
    "<PreviewCard.Root>",
    `  <PreviewCard.Trigger href="https://owsem-ui.dev">${t.link}</PreviewCard.Trigger>`,
    "  <PreviewCard.Portal>",
    `    <PreviewCard.Positioner${options.side ? ` side="${options.side}"` : ""}>`,
    "      <PreviewCard.Popup>",
    ...(options.arrow ? ["        <PreviewCard.Arrow />"] : []),
    ...(options.picture ? ['        <img src="/docs.png" alt="" width={320} height={120} />'] : []),
    `        <strong>${t.title}</strong>`,
    `        <p>${t.body}</p>`,
    "      </PreviewCard.Popup>",
    "    </PreviewCard.Positioner>",
    "  </PreviewCard.Portal>",
    "</PreviewCard.Root>",
  ];
};

export const previewCardDefinition = defineComponent({
  item: "preview-card",
  imports: ["PreviewCard"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Link di dalam kalimat: hover atau fokus membuka kartu setelah 600 ms, dan menutupnya setelah 300 ms. Sentuhan tidak membukanya.",
        en: "A link in a sentence: hover or focus opens the card after 600 ms and shuts it 300 ms after you leave. Touch does not open it.",
      },
      uses: ["PreviewCard"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [exampleFile("DocsLink", imports(setup), card(lang))],
    },
    {
      id: "arrow",
      title: { id: "Dengan panah", en: "With an arrow" },
      description: {
        id: "PreviewCard.Arrow di dalam Popup menunjuk ke link, dengan tepi dan bayangan kartu.",
        en: "A PreviewCard.Arrow inside the Popup points at the link, with the card's edge and shadow.",
      },
      uses: ["PreviewCard"],
      demo: (lang) => <WithArrow lang={lang} />,
      code: (setup, lang) => [
        exampleFile("DocsLinkArrow", imports(setup), card(lang, { arrow: true })),
      ],
    },
    {
      id: "link-preview",
      title: { id: "Pratinjau link", en: "Link preview" },
      description: {
        id: "Kartu memegang isi biasa tanpa tata letak sendiri: gambar, judul, dan teks. Gambarnya SVG yang digambar di tempat, tanpa permintaan keluar.",
        en: "The card holds plain content with no layout of its own: an image, a title, and text. The picture is an SVG drawn in place, with no request out.",
      },
      uses: ["PreviewCard"],
      demo: (lang) => <LinkPreview lang={lang} />,
      code: (setup, lang) => [
        exampleFile("DocsLinkPreview", imports(setup), card(lang, { arrow: true, picture: true })),
      ],
    },
    {
      id: "sides",
      title: { id: "Sisi", en: "Sides" },
      description: {
        id: "side pada Positioner memilih sisi link tempat kartu muncul; kartu berbalik jika tidak ada ruang.",
        en: "`side` on the Positioner picks the side of the link the card opens on; it flips when there is no room.",
      },
      uses: ["PreviewCard"],
      demo: (lang) => <Sides lang={lang} />,
      code: (setup, lang) => [
        exampleFile("DocsLinkSide", imports(setup), card(lang, { arrow: true, side: "right" })),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-preview-card-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state (open dan handle). Inspect menandai kotak yang memuat link dan kartunya.",
        en: "Renders no element: it holds the state (open and handle). Inspect outlines the box that holds the link and its card.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="link"]',
      note: {
        id: "Link (a) yang memakai warna teks di sekitarnya dengan garis bawah halus.",
        en: "A link (a) that takes the color of the text around it, with a quiet underline.",
      },
    },
    {
      name: "Positioner",
      selector: ".ow-preview-card__positioner",
      note: {
        id: "Menempatkan kartu 10px dari link dan membawa arah teks ke dalam portal.",
        en: "Places the card 10px from the link and carries the text direction into the portal.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-preview-card__popup",
      note: {
        id: "Material raised dengan bayangan popup, lebar paling banyak 20rem. Tumbuh dari link dalam 180 ms.",
        en: "The raised material with the popup shadow, at most 20rem wide. It grows out of the link in 180 ms.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "Arrow",
      selector: ".ow-preview-card__arrow",
      note: {
        id: "Panah opsional ke arah link, dengan tepi kartu.",
        en: "An optional arrow toward the link, with the card's edge.",
      },
    },
  ],
});

export default function PreviewCardPage(props: ExamplePageProps) {
  return <ComponentPage definition={previewCardDefinition} {...props} />;
}
