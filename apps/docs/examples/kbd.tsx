"use client";

import { Kbd } from "owsem-ui/base";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    press: "Tekan",
    toSearch: "untuk mencari.",
    search: "Cari…",
    newDoc: "Dokumen baru",
    close: "Tutup",
    or: "atau",
  },
  en: {
    press: "Press",
    toSearch: "to search.",
    search: "Search…",
    newDoc: "New document",
    close: "Close",
    or: "or",
  },
} satisfies Record<Lang, Record<string, string>>;

function Sentence({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <p className="demo-kbd-line">
      {t.press} <Kbd>⌘K</Kbd> {t.toSearch}
    </p>
  );
}

function Field({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-kbd-stack">
      <div className="demo-kbd-field">
        <span>{t.search}</span>
        <Kbd>⌘K</Kbd>
      </div>
      <div className="demo-kbd-row">
        <span>{t.newDoc}</span>
        <Kbd>⌘N</Kbd>
      </div>
    </div>
  );
}

function Combination({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <p className="demo-kbd-line">
      {t.press} <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd> {t.or} <Kbd>Esc</Kbd>
    </p>
  );
}

export const kbdDefinition = defineComponent({
  item: "kbd",
  imports: ["Kbd"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu tuts di dalam kalimat; ukurannya mengikuti teks di sekitarnya.",
        en: "One keycap inside a sentence; it takes its size from the text around it.",
      },
      uses: ["Kbd"],
      demo: (lang) => <Sentence lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SearchHint",
          [`import { Kbd } from "${importPath(setup, "kbd")}";`],
          [`<p>`, `  ${TEXT[lang].press} <Kbd>⌘K</Kbd> ${TEXT[lang].toSearch}`, `</p>`],
        ),
      ],
    },
    {
      id: "combination",
      title: { id: "Kombinasi", en: "Combination" },
      description: {
        id: "Satu Kbd per tombol, berdampingan, untuk kombinasi tombol.",
        en: "One Kbd per key, side by side, for a combination.",
      },
      uses: ["Kbd"],
      demo: (lang) => <Combination lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "CommandPaletteHint",
          [`import { Kbd } from "${importPath(setup, "kbd")}";`],
          [
            "<p>",
            `  ${TEXT[lang].press} <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd> ${TEXT[lang].or}`,
            "  <Kbd>Esc</Kbd>",
            "</p>",
          ],
        ),
      ],
    },
    {
      id: "in-controls",
      title: { id: "Di kontrol", en: "In controls" },
      description: {
        id: "Di ujung field pencarian dan baris daftar: ukurannya ikut teks tempatnya berada.",
        en: "At the end of a search field and a list row: it follows the text it sits in.",
      },
      uses: ["Kbd"],
      demo: (lang) => <Field lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "ShortcutRows",
          [`import { Kbd } from "${importPath(setup, "kbd")}";`],
          [
            '<div className="search-field">',
            `  <span>${TEXT[lang].search}</span>`,
            "  <Kbd>⌘K</Kbd>",
            "</div>",
            '<div className="list-row">',
            `  <span>${TEXT[lang].newDoc}</span>`,
            "  <Kbd>⌘N</Kbd>",
            "</div>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: () => <Kbd>⌘K</Kbd>,
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-kbd",
      note: {
        id: "Tuts: isian 8% dari warna teks tanpa tepi, teksnya campuran muted dan teks; ukurannya dari teks di sekitarnya.",
        en: "A keycap: an 8% tint of the text color with no edge, its text a mix of muted and text; its size from the text around it.",
      },
      tokens: {
        "--ow-fg": "--_bg",
        "--ow-muted": "--_fg",
        "--ow-radius": "--_radius",
      },
    },
  ],
});

export default function KbdPage(props: ExamplePageProps) {
  return <ComponentPage definition={kbdDefinition} {...props} />;
}
