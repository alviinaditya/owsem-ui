"use client";

import { Button, Drawer } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

type Side = "up" | "right" | "down" | "left";
const SIDES: Side[] = ["up", "right", "down", "left"];

const TEXT = {
  id: {
    app: "Laporan Q3",
    open: "Buka drawer",
    title: "Bagikan draf",
    body: "Siapa pun yang punya tautan bisa membacanya.",
    done: "Selesai",
    up: "Atas",
    right: "Kanan",
    down: "Bawah",
    left: "Kiri",
    notes: "Catatan rilis",
    notesBody: "Geser ke bawah dari bagian atas untuk menutup.",
    snap: "Komentar",
    snapBody: "Tarik ke atas untuk melihat semuanya.",
    edit: "Ubah tautan",
    remove: "Hapus tautan",
    removeTitle: "Hapus tautan ini?",
    removeBody: "Orang yang memakainya kehilangan akses.",
    keep: "Simpan",
    long: [
      "Tampilan tabel kini bisa dikelompokkan, dan kolom yang tersembunyi diingat per orang.",
      "Pencarian memahami kata yang salah ketik dan menampilkan hasil yang paling dekat lebih dulu.",
      "Ekspor ke CSV memakai tanda pemisah dari pengaturan bahasa Anda, bukan koma saja.",
      "Komentar bisa disematkan di atas utas, dan penyebutan mengirim pemberitahuan sekali saja.",
      "Mode gelap mengikuti sistem, dan setiap bagan memakai warna yang sama di kedua mode.",
      "Perbaikan: draf yang dibuka di dua tab tidak lagi saling menimpa saat disimpan.",
    ],
  },
  en: {
    app: "Q3 report",
    open: "Open drawer",
    title: "Share the draft",
    body: "Anyone with the link can read it.",
    done: "Done",
    up: "Top",
    right: "Right",
    down: "Bottom",
    left: "Left",
    notes: "Release notes",
    notesBody: "Swipe down from the top to close.",
    snap: "Comments",
    snapBody: "Pull up to see all of them.",
    edit: "Edit link",
    remove: "Remove the link",
    removeTitle: "Remove this link?",
    removeBody: "People who use it lose access.",
    keep: "Keep it",
    long: [
      "The table view can now be grouped, and hidden columns are remembered for each person.",
      "Search understands misspelled words and shows the closest results first.",
      "CSV export uses the separator from your language settings, not only the comma.",
      "Comments can be pinned to the top of a thread, and a mention sends one notification only.",
      "Dark mode follows the system, and every chart uses the same colors in both modes.",
      "Fix: a draft opened in two tabs no longer overwrites itself when saved.",
    ],
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

/** The page behind the drawer, as shapes. */
function Page() {
  return (
    <div className="demo-dialog-page" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

/**
 * An app's window with a trigger. The drawer lands in the window, not on the docs page, and is
 * not modal, so the page stays usable beside it; `open` holds it open for Inspect. With `indent`,
 * the window's page is the Indent, which recedes while the drawer is open.
 */
function Window({
  lang,
  open,
  indent,
  trigger,
  rootProps,
  children,
}: {
  lang: Lang;
  open?: boolean;
  indent?: boolean;
  trigger?: ReactNode;
  rootProps?: Drawer.DrawerRootProps;
  children: ReactNode;
}) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const page = (
    <>
      <div className="demo-dialog-bar">
        {TEXT[lang].app}
        {trigger ?? (
          <Drawer.Trigger render={<Button size="sm" variant="outline" />} data-demo="open">
            {TEXT[lang].open}
          </Drawer.Trigger>
        )}
      </div>
      <Page />
    </>
  );
  const root = (
    <Drawer.Root modal={false} {...(open ? { open: true } : {})} {...rootProps}>
      {indent ? <Drawer.Indent className="demo-drawer-indent">{page}</Drawer.Indent> : page}
      <Drawer.Portal container={frame}>{children}</Drawer.Portal>
    </Drawer.Root>
  );
  return (
    <div ref={setFrame} className="demo-dialog">
      {indent ? (
        <Drawer.Provider>
          <Drawer.IndentBackground />
          {root}
        </Drawer.Provider>
      ) : (
        root
      )}
    </div>
  );
}

/** A title, a line, and the button that shuts it. */
function Share({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Drawer.Title>{t.title}</Drawer.Title>
      <Drawer.Description>{t.body}</Drawer.Description>
      <div className="demo-dialog-actions">
        <Drawer.Close render={<Button />} data-demo="done">
          {t.done}
        </Drawer.Close>
      </div>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Drawer.Popup data-demo="panel">
        <Share lang={lang} />
      </Drawer.Popup>
    </Window>
  );
}

/** One Root, and its `swipeDirection` set by the button that opens it. */
function Sides({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [side, setSide] = useState<Side>("down");
  return (
    <Window
      lang={lang}
      rootProps={{ swipeDirection: side }}
      trigger={
        <div className="demo-drawer-triggers">
          {SIDES.map((direction) => (
            <Drawer.Trigger
              key={direction}
              render={<Button size="sm" variant="outline" />}
              data-demo={`open-${direction}`}
              onClick={() => setSide(direction)}
            >
              {t[direction]}
            </Drawer.Trigger>
          ))}
        </div>
      }
    >
      <Drawer.Popup data-demo="panel">
        <Share lang={lang} />
      </Drawer.Popup>
    </Window>
  );
}

function Scrolling({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window
      lang={lang}
      trigger={
        <Drawer.Trigger render={<Button size="sm" variant="outline" />} data-demo="open">
          {t.notes}
        </Drawer.Trigger>
      }
    >
      <Drawer.Popup data-demo="panel">
        <Drawer.Title>{t.notes}</Drawer.Title>
        <Drawer.Description>{t.notesBody}</Drawer.Description>
        <Drawer.Content data-demo="content">
          {t.long.map((paragraph) => (
            <p key={paragraph} className="demo-dialog-text">
              {paragraph}
            </p>
          ))}
        </Drawer.Content>
        <div className="demo-dialog-actions">
          <Drawer.Close render={<Button />} data-demo="done">
            {t.done}
          </Drawer.Close>
        </div>
      </Drawer.Popup>
    </Window>
  );
}

/** Two stops: a peek at 40% of the screen, and the full height, where the text scrolls. */
function Snapping({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window
      lang={lang}
      rootProps={{ snapPoints: [0.4, 1], defaultSnapPoint: 0.4 }}
      trigger={
        <Drawer.Trigger render={<Button size="sm" variant="outline" />} data-demo="open">
          {t.snap}
        </Drawer.Trigger>
      }
    >
      <Drawer.Popup className="demo-drawer-snap" data-demo="panel">
        <Drawer.Title>{t.snap}</Drawer.Title>
        <Drawer.Description>{t.snapBody}</Drawer.Description>
        <Drawer.Content data-demo="content">
          {t.long.map((paragraph) => (
            <p key={paragraph} className="demo-dialog-text">
              {paragraph}
            </p>
          ))}
        </Drawer.Content>
      </Drawer.Popup>
    </Window>
  );
}

/** A Root inside a Popup: the second drawer opens over the first, which steps back. */
function Nested({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang}>
      <Drawer.Popup data-demo="parent">
        <Drawer.Title>{t.title}</Drawer.Title>
        <Drawer.Description>{t.body}</Drawer.Description>
        <div className="demo-dialog-actions">
          <Drawer.Close render={<Button variant="outline" />} data-demo="done">
            {t.done}
          </Drawer.Close>
          <Drawer.Root modal={false}>
            <Drawer.Trigger render={<Button />} data-demo="more">
              {t.remove}
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Popup data-demo="nested">
                <Drawer.Title>{t.removeTitle}</Drawer.Title>
                <Drawer.Description>{t.removeBody}</Drawer.Description>
                <div className="demo-dialog-actions">
                  <Drawer.Close render={<Button variant="outline" />} data-demo="keep">
                    {t.keep}
                  </Drawer.Close>
                  <Drawer.Close render={<Button variant="destructive" />}>{t.remove}</Drawer.Close>
                </div>
              </Drawer.Popup>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </Drawer.Popup>
    </Window>
  );
}

/** The window's page recedes while the drawer is open: Provider, IndentBackground, and Indent. */
function Indented({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang} indent>
      <Drawer.Popup data-demo="panel">
        <Share lang={lang} />
      </Drawer.Popup>
    </Window>
  );
}

/**
 * Every part in one window, the drawer held open: it lands in the window, `inert`, with no lock
 * on the page and no focus taken, so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang} open>
      <Drawer.Popup inert initialFocus={false} data-demo="panel">
        <Drawer.Title>{t.title}</Drawer.Title>
        <Drawer.Description>{t.body}</Drawer.Description>
        <Drawer.Content data-demo="content">
          <p className="demo-dialog-text">{t.long[0]}</p>
        </Drawer.Content>
        <div className="demo-dialog-actions">
          <Drawer.Close render={<Button />} data-demo="done">
            {t.done}
          </Drawer.Close>
        </div>
      </Drawer.Popup>
    </Window>
  );
}

const imports = (setup: TokenSetup) =>
  isDefaultSetup(setup)
    ? ['import { Button, Drawer } from "owsem-ui/base";']
    : [
        `import { Button } from "${importPath(setup, "button")}";`,
        `import { Drawer } from "${importPath(setup, "drawer")}";`,
      ];

/** The drawer as an app writes it: modal, in a portal on the body. */
const drawer = (root: string, trigger: string, popup: string[], extra: string[] = []) => [
  `<Drawer.Root${root}>`,
  `  ${trigger}`,
  ...extra.map((l) => `  ${l}`),
  "  <Drawer.Portal>",
  "    <Drawer.Popup>",
  ...popup.map((l) => `      ${l}`),
  "    </Drawer.Popup>",
  "  </Drawer.Portal>",
  "</Drawer.Root>",
];

const share = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    `<Drawer.Title>${t.title}</Drawer.Title>`,
    `<Drawer.Description>${t.body}</Drawer.Description>`,
    '<div className="actions">',
    `  <Drawer.Close render={<Button />}>${t.done}</Drawer.Close>`,
    "</div>",
  ];
};

const paragraphs = (lang: Lang) => [
  "  const paragraphs = [",
  ...TEXT[lang].long.map((text) => `    ${JSON.stringify(text)},`),
  "  ];",
];

const ACTIONS_CSS = {
  name: "actions.css",
  code: [
    "/* The button in a row at the end, wrapping on a narrow screen. */",
    ".actions {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    "  justify-content: flex-end;",
    "  gap: 8px;",
    "}",
  ].join("\n"),
};

export const drawerDefinition = defineComponent({
  item: "drawer",
  imports: ["Drawer"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Lembar yang naik dari tepi bawah dengan pegangan kecil di atasnya. Geser ke bawah, tekan scrim, atau tekan Escape untuk menutup.",
        en: "A sheet that rises from the bottom edge, with a small grabber on top. Swipe it down, press the scrim, or press Escape to close it.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ShareDrawer",
            imports(setup),
            drawer(
              "",
              `<Drawer.Trigger render={<Button variant="outline" />}>${t.open}</Drawer.Trigger>`,
              share(lang),
            ),
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "sides",
      title: { id: "Empat sisi", en: "Four sides" },
      description: {
        id: "swipeDirection memilih tepi: lembar duduk di tepi yang dituju gesernya untuk menutup. Atas dan bawah selebar layar hingga 32rem; kiri dan kanan 24rem, dan tak pernah lebih lebar dari layar.",
        en: "swipeDirection picks the edge: the sheet sits at the edge it is swiped toward to close. Top and bottom are the screen's width up to 32rem; left and right are 24rem, and never wider than the screen.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Sides lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "SideDrawer",
            imports(setup),
            drawer(
              " swipeDirection={side}",
              `<Drawer.Trigger render={<Button variant="outline" />} onClick={() => setSide("right")}>${t.right}</Drawer.Trigger>`,
              share(lang),
            ),
            ['  const [side, setSide] = useState<"up" | "right" | "down" | "left">("down");'],
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "scrolling",
      title: { id: "Gulir", en: "Scrolling" },
      description: {
        id: "Drawer.Content menggulir sendiri, sementara judul dan tombol tetap terlihat. Di layar sentuh, geseran pada Content menggulir lebih dulu dan baru menutup lembar dari puncaknya; seret dengan mouse di dalamnya memilih teks.",
        en: "Drawer.Content scrolls on its own, while the title and the button stay in view. On touch, a swipe on Content scrolls first and closes the sheet only from its top; a mouse drag inside it selects text.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Scrolling lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "NotesDrawer",
            imports(setup),
            drawer(
              "",
              `<Drawer.Trigger render={<Button variant="outline" />}>${t.notes}</Drawer.Trigger>`,
              [
                `<Drawer.Title>${t.notes}</Drawer.Title>`,
                `<Drawer.Description>${t.notesBody}</Drawer.Description>`,
                "<Drawer.Content>",
                "  {paragraphs.map((text) => <p key={text}>{text}</p>)}",
                "</Drawer.Content>",
                '<div className="actions">',
                `  <Drawer.Close render={<Button />}>${t.done}</Drawer.Close>`,
                "</div>",
              ],
            ),
            paragraphs(lang),
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "snap-points",
      title: { id: "Titik jepret", en: "Snap points" },
      description: {
        id: "snapPoints memberi lembar beberapa perhentian: 0,4 adalah 40% tinggi layar, dan 1 adalah tinggi penuh. Beri Popup tinggi perhentian terbesar; Base UI menggesernya turun ke perhentian yang aktif. Hanya untuk atas dan bawah.",
        en: "snapPoints gives the sheet several stops: 0.4 is 40% of the screen's height, and 1 is the full height. Give the Popup the height of the largest stop; Base UI moves it down to the active one. Top and bottom only.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Snapping lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "CommentsDrawer",
            imports(setup),
            drawer(
              " snapPoints={[0.4, 1]} defaultSnapPoint={0.4}",
              `<Drawer.Trigger render={<Button variant="outline" />}>${t.snap}</Drawer.Trigger>`,
              [
                `<Drawer.Title>${t.snap}</Drawer.Title>`,
                `<Drawer.Description>${t.snapBody}</Drawer.Description>`,
                "<Drawer.Content>",
                "  {paragraphs.map((text) => <p key={text}>{text}</p>)}",
                "</Drawer.Content>",
              ],
            ).map((line) =>
              line === "    <Drawer.Popup>" ? '    <Drawer.Popup className="tall">' : line,
            ),
            paragraphs(lang),
          ),
          {
            name: "tall.css",
            code: [
              "/* As tall as the largest stop; the text scrolls only once it is reached. */",
              ".tall {",
              "  block-size: calc(100% - 3rem);",
              "}",
              "",
              ".tall:not([data-expanded]) .ow-drawer__content {",
              "  overflow-y: hidden;",
              "}",
            ].join("\n"),
          },
        ];
      },
    },
    {
      id: "nested",
      title: { id: "Bertumpuk", en: "Nested" },
      description: {
        id: "Root di dalam Popup: lembar kedua naik di atas yang pertama, dan induknya mundur sedikit selama anak terbuka, lebih jauh untuk setiap lembar.",
        en: "A Root inside a Popup: the second sheet rises over the first, and the parent steps back a little while the child is open, further for each one.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Nested lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "NestedDrawer",
            imports(setup),
            drawer(
              "",
              `<Drawer.Trigger render={<Button variant="outline" />}>${t.open}</Drawer.Trigger>`,
              [
                `<Drawer.Title>${t.title}</Drawer.Title>`,
                `<Drawer.Description>${t.body}</Drawer.Description>`,
                '<div className="actions">',
                `  <Drawer.Close render={<Button variant="outline" />}>${t.done}</Drawer.Close>`,
                "  <Drawer.Root>",
                `    <Drawer.Trigger render={<Button />}>${t.remove}</Drawer.Trigger>`,
                "    <Drawer.Portal>",
                "      <Drawer.Popup>",
                `        <Drawer.Title>${t.removeTitle}</Drawer.Title>`,
                `        <Drawer.Description>${t.removeBody}</Drawer.Description>`,
                '        <div className="actions">',
                `          <Drawer.Close render={<Button variant="outline" />}>${t.keep}</Drawer.Close>`,
                `          <Drawer.Close render={<Button variant="destructive" />}>${t.remove}</Drawer.Close>`,
                "        </div>",
                "      </Drawer.Popup>",
                "    </Drawer.Portal>",
                "  </Drawer.Root>",
                "</div>",
              ],
            ),
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "indent",
      title: { id: "Indent", en: "Indent" },
      description: {
        id: "Halaman di belakang sedikit mundur (skala dan sudut membulat) selama drawer terbuka. Opt-in: bungkus aplikasi dengan Provider, taruh IndentBackground sebelum Indent, dan isi aplikasi di dalam Indent.",
        en: "The page behind recedes a little (a slight scale and rounded corners) while a drawer is open. Opt in: wrap the app in a Provider, put IndentBackground before Indent, and the app inside Indent.",
      },
      uses: ["Drawer", "Button"],
      demo: (lang) => <Indented lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("IndentedApp", imports(setup), [
            "<Drawer.Provider>",
            "  <Drawer.IndentBackground />",
            "  <Drawer.Indent>",
            "    <main>",
            ...drawer(
              "",
              `<Drawer.Trigger render={<Button variant="outline" />}>${t.open}</Drawer.Trigger>`,
              share(lang),
            ).map((l) => `      ${l}`),
            "    </main>",
            "  </Drawer.Indent>",
            "</Drawer.Provider>",
          ]),
          ACTIONS_CSS,
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-dialog",
      note: {
        id: "Tidak merender elemen: ia memegang state (open, modal, swipeDirection, snapPoints, handle). Inspect menandai jendela yang memuat trigger dan drawernya.",
        en: "Renders no element: it holds the state (open, modal, swipeDirection, snapPoints, handle). Inspect outlines the window that holds the trigger and its drawer.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="open"]',
      note: {
        id: "Tombol Anda, lewat render; Drawer.Trigger hanya menambah perilaku dan ARIA.",
        en: "Your button, through render; Drawer.Trigger adds only behavior and ARIA.",
      },
    },
    {
      name: "Backdrop",
      selector: ".ow-drawer__backdrop",
      note: {
        id: "Scrim yang digambar Portal, di belakang lembar; memudar mengikuti geseran.",
        en: "The scrim the Portal draws behind the sheet; it fades as the sheet is swiped.",
      },
      tokens: { "--ow-backdrop": "--_bg" },
    },
    {
      name: "Viewport",
      selector: ".ow-drawer__viewport",
      note: {
        id: "Lapisan yang menerima geseran; Popup menggambarnya sendiri bila tidak ditulis.",
        en: "The layer that takes the swipe; the Popup draws it itself when you do not write it.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-drawer__popup",
      note: {
        id: "Lembar: material raised dengan bayangan popup di tepi yang dinamai swipeDirection, sudut membulat hanya yang menghadap halaman, dan pegangan kecil di tepi atas atau bawah.",
        en: "The sheet: the raised material with the popup shadow at the edge swipeDirection names, rounded only on the corners facing the page, with a small grabber on a top or bottom edge.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-radius": "--_r",
      },
    },
    {
      name: "Title",
      selector: ".ow-drawer__title",
      note: {
        id: "h2 yang menamai drawer untuk teknologi asistif.",
        en: "An h2 that names the drawer for assistive technology.",
      },
    },
    {
      name: "Description",
      selector: ".ow-drawer__description",
      note: {
        id: "Baris muted yang mendeskripsikan drawer; dibacakan bersama judul.",
        en: "A muted line that describes the drawer; it is read out with the title.",
      },
    },
    {
      name: "Content",
      selector: ".ow-drawer__content",
      note: {
        id: "Bagian yang menggulir sendiri; seret mouse di dalamnya memilih teks, bukan menggeser lembar.",
        en: "The part that scrolls on its own; a mouse drag inside it selects text instead of swiping the sheet.",
      },
    },
    {
      name: "Close",
      selector: '.ow-drawer__popup [data-demo="done"]',
      note: {
        id: "Tombol Anda, lewat render; menutup drawer.",
        en: "Your button, through render; it shuts the drawer.",
      },
    },
  ],
});

export default function DrawerPage(props: ExamplePageProps) {
  return <ComponentPage definition={drawerDefinition} {...props} />;
}
