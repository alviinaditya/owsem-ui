"use client";

import { ScrollArea, Separator } from "owsem-ui/base";
import { Fragment } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    notes: [
      ["Scroll Area", "Scrollbar tipis yang muncul saat dibutuhkan."],
      ["Color Picker", "Area warna, hue, alpha, dan kolom hex."],
      ["Command Menu", "Cari, pilih, dan jalankan dari keyboard."],
      ["Table of Contents", "Penanda yang mengikuti posisi baca."],
      ["Toolbar", "Satu tab stop untuk sederet kontrol."],
      ["Tooltip", "Label singkat, juga untuk keyboard."],
      ["Menu", "Item, centang, pilihan, dan submenu."],
      ["Popover", "Panel kecil berisi konten dan kontrol."],
      ["Toggle Group", "Thumb yang bergeser ke item aktif."],
    ],
  },
  en: {
    notes: [
      ["Scroll Area", "A thin scrollbar that shows when it is needed."],
      ["Color Picker", "A color area, hue, alpha, and a hex field."],
      ["Command Menu", "Search, pick, and run from the keyboard."],
      ["Table of Contents", "A marker that follows where you read."],
      ["Toolbar", "One tab stop for a row of controls."],
      ["Tooltip", "A short label, for the keyboard too."],
      ["Menu", "Items, checks, choices, and submenus."],
      ["Popover", "A small panel of content and controls."],
      ["Toggle Group", "A thumb that glides to the active item."],
    ],
  },
} satisfies Record<Lang, unknown>;

// A build's log: lines too long for the box, in any language.
const LOG = [
  "12:04:11  build    packages/ui/dist/components/scroll-area/index.js      2.1 kB",
  "12:04:11  build    packages/ui/dist/components/scroll-area/scroll-area.css  1.4 kB",
  "12:04:12  check    packages/ui/test/theming.test.ts                      passed",
  "12:04:12  check    packages/ui/test/naming.test.ts                       passed",
  "12:04:13  check    packages/ui/test/layers.test.ts                       passed",
  "12:04:15  test     src/components/scroll-area/scroll-area.test.tsx       passed",
  "12:04:17  test     src/components/scroll-area/scroll-area.geometry.test.tsx  passed",
  "12:04:19  docs     apps/docs/examples/scroll-area.tsx                    compiled",
  "12:04:21  docs     apps/docs/content/components/en/scroll-area.mdx       compiled",
  "12:04:22  docs     apps/docs/content/components/id/scroll-area.mdx       compiled",
  "12:04:24  e2e      apps/docs/e2e/smoke.spec.ts                           passed",
  "12:04:26  e2e      apps/docs/e2e/scroll-area.spec.ts                     passed",
  "12:04:27  size     dist/components/scroll-area/index.js                  under 3 kB",
  "12:04:27  done     all checks passed                                     16.2 s",
];

function Notes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-scroll-area-notes">
      {TEXT[lang].notes.map(([title, body], i) => (
        <Fragment key={title}>
          {i > 0 ? <Separator /> : null}
          <div>
            <p className="demo-title">{title}</p>
            <p className="demo-scroll-area-note">{body}</p>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function Log({ short }: { short?: boolean }) {
  return (
    <pre className="demo-scroll-area-log">
      <code>{(short ? LOG.map((line) => line.slice(0, 64)) : LOG).join("\n")}</code>
    </pre>
  );
}

/** The area with only its content inside: it draws every other part itself. */
function Area({
  lang,
  both,
  fade,
  wide,
}: {
  lang: Lang;
  both?: boolean;
  fade?: boolean;
  wide?: boolean;
}) {
  return (
    <ScrollArea.Root
      className="demo-scroll-area"
      fade={fade ?? false}
      data-width={wide ? "wide" : undefined}
    >
      {both ? <Log /> : <Notes lang={lang} />}
    </ScrollArea.Root>
  );
}

/** Every part written out, both axes. `pin` keeps the scrollbars in view, for Inspect. */
function Parts({ pin }: { pin?: boolean }) {
  return (
    <ScrollArea.Root className="demo-scroll-area" data-pin={pin ? "" : undefined}>
      <ScrollArea.Viewport>
        <ScrollArea.Content>
          <Log short={pin ?? false} />
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
}

/** The examples' code: a `Notes` or `Log` component stands for the content. */
const areaCode = (
  setup: Parameters<typeof importPath>[0],
  name: string,
  options: { both?: boolean; fade?: boolean; wide?: boolean } = {},
) => {
  const content = options.both ? "<Log />" : "<Notes />";
  const files = [
    exampleFile(
      name,
      [`import { ScrollArea } from "${importPath(setup, "scroll-area")}";`],
      [
        `<ScrollArea.Root className="notes"${options.fade ? " fade" : ""}>`,
        `  ${content}`,
        "</ScrollArea.Root>",
      ],
    ),
  ];
  const bar = ".notes .ow-scroll-area__scrollbar";
  files.push({
    name: "notes.css",
    code: [
      "/* The height that makes it scroll comes from your CSS. */",
      ".notes {",
      "  block-size: 16rem;",
      "}",
      ...(options.wide
        ? [
            "",
            `${bar}[data-orientation="vertical"] {`,
            "  inline-size: 10px;",
            "}",
            "",
            `${bar}[data-orientation="horizontal"] {`,
            "  block-size: 10px;",
            "}",
          ]
        : []),
    ].join("\n"),
  });
  return files;
};

export const scrollAreaDefinition = defineComponent({
  item: "scroll-area",
  imports: ["ScrollArea"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Hanya konten di dalam Root: scrollbar muncul saat hover atau menggulir, dan thumb-nya bisa ditarik.",
        en: "Only content inside the Root: the scrollbar shows on hover or while scrolling, and its thumb can be dragged.",
      },
      uses: ["ScrollArea"],
      demo: (lang) => <Area lang={lang} />,
      code: (setup) => areaCode(setup, "ReleaseNotes"),
    },
    {
      id: "both",
      title: { id: "Dua arah", en: "Both axes" },
      description: {
        id: "Isi yang lebih lebar dari kotaknya mendapat scrollbar mendatar juga; keduanya bertemu di sudut tanpa bersentuhan.",
        en: "Content wider than its box gets a horizontal scrollbar too; the two meet at the corner without touching.",
      },
      uses: ["ScrollArea"],
      demo: (lang) => <Area lang={lang} both />,
      code: (setup) => areaCode(setup, "BuildLog", { both: true }),
    },
    {
      id: "fade",
      title: { id: "Tepi memudar", en: "Faded edges" },
      description: {
        id: "Dengan fade, sebuah tepi memudar selama masih ada yang bisa digulir ke sana.",
        en: "With fade, an edge fades while there is more to scroll that way.",
      },
      uses: ["ScrollArea"],
      demo: (lang) => <Area lang={lang} fade />,
      code: (setup) => areaCode(setup, "FadedNotes", { fade: true }),
    },
    {
      id: "wide",
      title: { id: "Scrollbar lebar", en: "Wide scrollbar" },
      description: {
        id: "Lebar scrollbar adalah CSS biasa: tulis aturan untuk kelasnya.",
        en: "The scrollbar's width is plain CSS: write a rule for its class.",
      },
      uses: ["ScrollArea"],
      demo: (lang) => <Area lang={lang} both wide />,
      code: (setup) => areaCode(setup, "WideBars", { both: true, wide: true }),
    },
    {
      id: "parts",
      title: { id: "Semua part", en: "Every part" },
      description: {
        id: "Dengan Viewport di dalam Root, anak-anaknya adalah part-nya, seperti di Base UI.",
        en: "With a Viewport inside the Root, its children are the parts, as in Base UI.",
      },
      uses: ["ScrollArea"],
      demo: () => <Parts />,
      code: (setup) => [
        exampleFile(
          "ComposedLog",
          [`import { ScrollArea } from "${importPath(setup, "scroll-area")}";`],
          [
            '<ScrollArea.Root className="notes">',
            "  <ScrollArea.Viewport>",
            "    <ScrollArea.Content>",
            "      <Log />",
            "    </ScrollArea.Content>",
            "  </ScrollArea.Viewport>",
            "  <ScrollArea.Scrollbar>",
            "    <ScrollArea.Thumb />",
            "  </ScrollArea.Scrollbar>",
            '  <ScrollArea.Scrollbar orientation="horizontal">',
            "    <ScrollArea.Thumb />",
            "  </ScrollArea.Scrollbar>",
            "  <ScrollArea.Corner />",
            "</ScrollArea.Root>",
          ],
        ),
        {
          name: "notes.css",
          code: [
            "/* The height that makes it scroll comes from your CSS. */",
            ".notes {",
            "  block-size: 16rem;",
            "}",
          ].join("\n"),
        },
      ],
    },
  ],
  anatomy: {
    // The scrollbars stay in view (the pin), as only a pointer or a scroll shows them otherwise.
    specimen: () => <Parts pin />,
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-scroll-area",
      note: {
        id: "Tanpa permukaan dan tanpa ukuran sendiri; tingginya dari CSS Anda. Di sini cincin fokus digambar.",
        en: "No surface and no size of its own; the height comes from your CSS. The focus ring is drawn here.",
      },
      tokens: { "--ow-radius": "--_radius", "--ow-focus": "--_focus" },
    },
    {
      name: "Viewport",
      selector: ".ow-scroll-area__viewport",
      note: {
        id: "Elemen yang digulir, dengan scrollbar native disembunyikan. Tab stop selama isinya meluap.",
        en: "The element that scrolls, its native scrollbars hidden. A tab stop while its content overflows.",
      },
    },
    {
      name: "Content",
      selector: ".ow-scroll-area__content",
      note: {
        id: "Membungkus isi dan melaporkan perubahan ukurannya ke Base UI.",
        en: "Wraps the content and reports its size changes to Base UI.",
      },
    },
    {
      name: "Scrollbar",
      selector: ".ow-scroll-area__scrollbar",
      note: {
        id: "Melayang di atas isi, jadi tidak memakan tempat, dan menjauhi sudut yang membulat. Satu per arah.",
        en: "Floats over the content, so it takes no room, and keeps clear of the rounded corners. One per axis.",
      },
      tokens: { "--ow-ease-out": "--_ease" },
    },
    {
      name: "Thumb",
      selector: ".ow-scroll-area__thumb",
      note: {
        id: "Pil dari --ow-muted, kontras 3:1. Area tekannya setidaknya 24 × 24 px.",
        en: "A pill from --ow-muted, at 3:1 contrast. Its press area is at least 24 × 24 px.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Corner",
      selector: ".ow-scroll-area__corner",
      note: {
        id: "Kotak kosong tempat dua scrollbar bertemu; muncul hanya saat keduanya ada.",
        en: "The empty square where two scrollbars meet; there only when both are.",
      },
    },
  ],
});

export default function ScrollAreaPage(props: ExamplePageProps) {
  return <ComponentPage definition={scrollAreaDefinition} {...props} />;
}
