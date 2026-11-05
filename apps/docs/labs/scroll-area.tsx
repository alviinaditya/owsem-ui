"use client";

import { ScrollArea, Separator } from "owsem-ui/base";
import { type CSSProperties, Fragment, useEffect, useRef } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    hint: "Arahkan pointer ke daftar untuk melihat scrollbar",
    resting: "Diam",
    shown: "Hover atau digulir",
    faded: "Tepi memudar",
    light: "Terang",
    dark: "Gelap",
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
    hint: "Point at the list to see its scrollbar",
    resting: "Resting",
    shown: "Hovered or scrolling",
    faded: "Faded edges",
    light: "Light",
    dark: "Dark",
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
  "12:04:19  docs     apps/docs/labs/scroll-area.tsx                        compiled",
  "12:04:21  docs     apps/docs/content/labs/en/scroll-area.mdx             compiled",
  "12:04:22  docs     apps/docs/content/labs/id/scroll-area.mdx             compiled",
  "12:04:24  e2e      apps/docs/e2e/smoke.spec.ts                           passed",
  "12:04:26  e2e      apps/docs/e2e/lab.spec.ts                             passed",
  "12:04:27  size     dist/components/scroll-area/index.js                  under 3 kB",
  "12:04:27  done     all checks passed                                     16.2 s",
];

type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { axes: "vertical", fade: "off", width: "thin", parts: "content", muted: "" };
type Cfg = typeof initial;

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

function Log() {
  return (
    <pre className="demo-scroll-area-log">
      <code>{LOG.join("\n")}</code>
    </pre>
  );
}

/** The area as the controls ask for it: the same result with only content or with every part. */
function Area({ cfg, lang, pin }: { cfg: Cfg; lang: Lang; pin?: boolean }) {
  const content = cfg.axes === "both" ? <Log /> : <Notes lang={lang} />;
  const props = {
    className: "demo-scroll-area",
    fade: cfg.fade === "on",
    style: { "--ow-muted": cfg.muted || undefined } as CSSProperties,
    "data-width": cfg.width,
    "data-pin": pin ? "" : undefined,
  };
  return cfg.parts === "parts" ? (
    <ScrollArea.Root {...props}>
      <ScrollArea.Viewport>
        <ScrollArea.Content>{content}</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  ) : (
    <ScrollArea.Root {...props}>{content}</ScrollArea.Root>
  );
}

function Demo({ cfg, lang, pin }: { cfg: Cfg; lang: Lang; pin?: boolean }) {
  return (
    <div className="demo-scroll-area-frame">
      <Area cfg={cfg} lang={lang} pin={pin ?? false} />
      <p className="demo-caption" data-demo="away">
        {TEXT[lang].hint}
      </p>
    </div>
  );
}

/** A small area in one theme: at rest, with its scrollbar showing, or scrolled between two fades. */
function Cell({ theme, row, lang }: { theme: Theme; row: string; lang: Lang }) {
  const viewport = useRef<HTMLDivElement>(null);
  const faded = row === "faded";
  useEffect(() => {
    if (faded && viewport.current) viewport.current.scrollTop = 96;
  }, [faded]);
  return (
    <div data-theme={theme} className="demo-cell demo-scroll-area-cell">
      <ScrollArea.Root
        className="demo-scroll-area"
        fade={faded}
        data-pin={row === "resting" ? undefined : ""}
      >
        <ScrollArea.Viewport ref={viewport} tabIndex={-1}>
          <Notes lang={lang} />
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar />
      </ScrollArea.Root>
    </div>
  );
}

function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={(["resting", "shown", "faded"] as const).map((row) => ({
        label: t[row],
        cells: THEMES.map((theme) => <Cell key={theme} theme={theme} row={row} lang={lang} />),
      }))}
    />
  );
}

const thumbOf = (axis: "vertical" | "horizontal") =>
  `.ow-scroll-area__scrollbar[data-orientation="${axis}"] .ow-scroll-area__thumb`;

// The pointer comes over the list and the scrollbar fades in; it takes the thumb down and back up,
// then leaves, and the scrollbar fades out.
const shows: SceneScript = async (stage) => {
  await stage.point(stage.get(".ow-scroll-area__viewport"));
  await stage.wait(700);
  const thumb = stage.get(thumbOf("vertical"));
  await stage.drag(thumb, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 2.5 },
  ]);
  await stage.wait(600);
  await stage.drag(thumb, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: -3 },
  ]);
  await stage.wait(400);
  await stage.point(stage.get('[data-demo="away"]'));
};

// One thumb across, then the other down; the bars meet at the corner without touching.
const axes: SceneScript = async (stage) => {
  await stage.point(stage.get(".ow-scroll-area__viewport"));
  await stage.wait(500);
  const across = stage.get(thumbOf("horizontal"));
  await stage.drag(across, [
    { x: 0.5, y: 0.5 },
    { x: 1, y: 0.5 },
  ]);
  await stage.wait(400);
  const down = stage.get(thumbOf("vertical"));
  await stage.drag(down, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 1.5 },
  ]);
  await stage.wait(600);
  await stage.drag(down, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: -3 },
  ]);
  await stage.drag(across, [
    { x: 0.5, y: 0.5 },
    { x: -2, y: 0.5 },
  ]);
};

// At the top only the bottom edge fades; in the middle both do; at the end only the top.
const edges: SceneScript = async (stage) => {
  await stage.point(stage.get(".ow-scroll-area__viewport"));
  await stage.wait(500);
  const thumb = stage.get(thumbOf("vertical"));
  await stage.drag(thumb, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 1 },
  ]);
  await stage.wait(800);
  await stage.drag(thumb, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 6 },
  ]);
  await stage.wait(800);
  await stage.drag(thumb, [
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: -6 },
  ]);
};

const scrollAreaLab = defineLab({
  initial,
  controls: [
    {
      key: "axes",
      type: "choice",
      label: { id: "Arah", en: "Axes" },
      options: [
        { value: "vertical", label: { id: "Vertikal", en: "Vertical" } },
        { value: "both", label: { id: "Keduanya", en: "Both" } },
      ],
    },
    {
      key: "fade",
      type: "choice",
      label: { id: "Tepi memudar", en: "Faded edges" },
      options: [
        { value: "off", label: { id: "Tidak", en: "Off" } },
        { value: "on", label: { id: "Ya", en: "On" } },
      ],
    },
    {
      key: "width",
      type: "choice",
      label: { id: "Lebar (className)", en: "Width (className)" },
      options: [
        { value: "thin", label: { id: "Tipis", en: "Thin" } },
        { value: "wide", label: { id: "10 px", en: "10 px" } },
      ],
    },
    {
      key: "parts",
      type: "choice",
      label: { id: "Komposisi", en: "Composition" },
      options: [
        { value: "content", label: { id: "Hanya konten", en: "Only content" } },
        { value: "parts", label: { id: "Semua part", en: "Every part" } },
      ],
    },
    { key: "muted", type: "color", label: { id: "Thumb", en: "Thumb" }, token: "--ow-muted" },
  ],

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

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/scroll-area";
    const both = cfg.axes === "both";
    const content = both ? "<Log />" : "<Notes />";
    const root = `<ScrollArea.Root className="notes"${cfg.fade === "on" ? " fade" : ""}>`;
    const inner =
      cfg.parts === "parts"
        ? [
            "      <ScrollArea.Viewport>",
            "        <ScrollArea.Content>",
            `          ${content}`,
            "        </ScrollArea.Content>",
            "      </ScrollArea.Viewport>",
            "      <ScrollArea.Scrollbar>",
            "        <ScrollArea.Thumb />",
            "      </ScrollArea.Scrollbar>",
            ...(both
              ? [
                  '      <ScrollArea.Scrollbar orientation="horizontal">',
                  "        <ScrollArea.Thumb />",
                  "      </ScrollArea.Scrollbar>",
                  "      <ScrollArea.Corner />",
                ]
              : []),
          ]
        : [`      ${content}`];
    const usage = [
      `import { ScrollArea } from "${from}";`,
      "",
      "export function ReleaseNotes() {",
      "  return (",
      `    ${root}`,
      ...inner,
      "    </ScrollArea.Root>",
      "  );",
      "}",
    ];
    const bar = ".notes .ow-scroll-area__scrollbar";
    // Isolated values sit on each part, so an inherited value would lose.
    const isolated = setup.mode === "isolated";
    const token = cfg.muted ? [`  --${setup.prefix}-muted: ${cfg.muted};`] : [];
    const css = [
      "/* The height that makes it scroll comes from your CSS. */",
      ".notes {",
      "  block-size: 16rem;",
      ...(isolated ? [] : token),
      "}",
      ...(isolated && cfg.muted ? ["", ".notes .ow-scroll-area__thumb {", ...token, "}"] : []),
      ...(cfg.width === "wide"
        ? [
            "",
            `${bar}[data-orientation="vertical"] {`,
            "  inline-size: 10px;",
            "}",
            ...(both
              ? ["", `${bar}[data-orientation="horizontal"] {`, "  block-size: 10px;", "}"]
              : []),
          ]
        : []),
    ];
    return [
      { name: "release-notes.tsx", code: usage.join("\n") },
      { name: "notes.css", code: css.join("\n") },
    ];
  },

  scenes: {
    shows: { play: shows },
    axes: { cfg: { axes: "both" }, play: axes },
    edges: { cfg: { fade: "on" }, play: edges },
    anatomy: {
      inspect: true,
      cfg: { axes: "both" },
      demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} pin />,
    },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} pin /> },
    ship: { code: true },
  },
});

export default function ScrollAreaLab(props: LabProps) {
  return <LabShell lab={scrollAreaLab} {...props} />;
}
