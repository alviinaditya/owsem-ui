"use client";

import { Button, Dialog } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    app: "Laporan Q3",
    share: "Bagikan",
    title: "Bagikan draf",
    body: "Siapa pun yang punya link bisa membacanya.",
    done: "Selesai",
    long: [
      "Link ini berlaku sampai Anda menghapusnya. Siapa pun yang menerimanya bisa membuka draf tanpa masuk, termasuk orang yang menerimanya dari orang lain.",
      "Pembaca melihat versi terbaru setiap kali membuka link. Perubahan Anda muncul begitu disimpan, jadi tidak perlu membagikan link baru setelah mengedit.",
      "Komentar hanya tampil bagi orang yang masuk. Pembaca lain melihat isi draf saja, tanpa nama penulis komentar dan tanpa riwayat perubahan.",
      "Menghapus link membuat semua salinannya berhenti bekerja. Draf itu sendiri tetap ada, dan Anda bisa membuat link baru kapan saja dari menu yang sama.",
      "Draf yang dibagikan tetap draf: mesin pencari tidak mengindeksnya, dan judulnya tidak muncul di daftar publik tim Anda.",
    ],
    remove: "Hapus link",
    removeTitle: "Hapus link ini?",
    removeBody: "Orang yang sudah memilikinya tidak bisa membaca draf lagi.",
    keep: "Simpan",
    delete: "Hapus",
  },
  en: {
    app: "Q3 report",
    share: "Share",
    title: "Share the draft",
    body: "Anyone with the link can read it.",
    done: "Done",
    long: [
      "This link works until you remove it. Anyone who receives it can open the draft without signing in, including people who got it from someone else.",
      "Readers see the latest version each time they open the link. Your changes appear as soon as they are saved, so there is no new link to send after an edit.",
      "Comments show only to people who are signed in. Other readers see the draft's text alone, without the commenters' names or the history of changes.",
      "Removing the link stops every copy of it from working. The draft itself stays, and you can make a new link at any time from the same menu.",
      "A shared draft is still a draft: search engines do not index it, and its title does not appear in your team's public list.",
    ],
    remove: "Remove link",
    removeTitle: "Remove this link?",
    removeBody: "People who already have it can no longer read the draft.",
    keep: "Keep it",
    delete: "Remove",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

/** The page behind the dialog, as shapes. */
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
 * An app's window with a Share trigger. The dialog lands in the window, not on the docs page,
 * and is not modal, so the page stays usable beside it; `open` holds it open for Inspect.
 */
function Window({
  lang,
  open,
  className,
  children,
}: {
  lang: Lang;
  open?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  return (
    <div ref={setFrame} className={className ? `demo-dialog ${className}` : "demo-dialog"}>
      <Dialog.Root modal={false} {...(open ? { open: true } : {})}>
        <div className="demo-dialog-bar">
          {TEXT[lang].app}
          <Dialog.Trigger render={<Button size="sm" />} data-demo="share">
            {TEXT[lang].share}
          </Dialog.Trigger>
        </div>
        <Page />
        <Dialog.Portal container={frame}>{children}</Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** A title, a line, the long text when asked for, and the button that shuts it. */
function Content({ lang, long }: { lang: Lang; long?: boolean }) {
  const t = TEXT[lang];
  return (
    <>
      <Dialog.Title>{t.title}</Dialog.Title>
      <Dialog.Description>{t.body}</Dialog.Description>
      {long
        ? t.long.map((paragraph) => (
            <p key={paragraph} className="demo-dialog-text">
              {paragraph}
            </p>
          ))
        : null}
      <Dialog.Close render={<Button />} data-demo="done">
        {t.done}
      </Dialog.Close>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Dialog.Popup data-demo="panel">
        <Content lang={lang} />
      </Dialog.Popup>
    </Window>
  );
}

function Scrolling({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Dialog.Popup data-demo="panel">
        <Content lang={lang} long />
      </Dialog.Popup>
    </Window>
  );
}

function Viewport({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Dialog.Viewport>
        <Dialog.Popup data-demo="panel">
          <Content lang={lang} long />
        </Dialog.Popup>
      </Dialog.Viewport>
    </Window>
  );
}

function Sheet({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Dialog.Popup className="demo-dialog-sheet" data-demo="panel">
        <Content lang={lang} />
      </Dialog.Popup>
    </Window>
  );
}

/** A Root inside a Popup: the inner dialog opens from its first button. */
function Nested({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang}>
      <Dialog.Popup data-demo="parent">
        <Dialog.Title>{t.title}</Dialog.Title>
        <Dialog.Description>{t.body}</Dialog.Description>
        <div className="demo-dialog-actions">
          <Dialog.Root modal={false}>
            <Dialog.Trigger render={<Button variant="outline" />} data-demo="remove">
              {t.remove}
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup data-demo="nested">
                <Dialog.Title>{t.removeTitle}</Dialog.Title>
                <Dialog.Description>{t.removeBody}</Dialog.Description>
                <div className="demo-dialog-actions">
                  <Dialog.Close render={<Button variant="outline" />} data-demo="keep">
                    {t.keep}
                  </Dialog.Close>
                  <Dialog.Close render={<Button variant="destructive" />}>{t.delete}</Dialog.Close>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Close render={<Button />} data-demo="done">
            {t.done}
          </Dialog.Close>
        </div>
      </Dialog.Popup>
    </Window>
  );
}

/**
 * Every part in one window, the dialog held open: it lands in the window, `inert`, with no lock
 * on the page and no focus taken, so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang} open>
      <Dialog.Popup inert initialFocus={false} data-demo="panel">
        <Content lang={lang} />
      </Dialog.Popup>
    </Window>
  );
}

const imports = (setup: TokenSetup) =>
  isDefaultSetup(setup)
    ? ['import { Button, Dialog } from "owsem-ui/base";']
    : [
        `import { Button } from "${importPath(setup, "button")}";`,
        `import { Dialog } from "${importPath(setup, "dialog")}";`,
      ];

/** The dialog as an app writes it: modal, in a portal on the body. */
const dialog = (lang: Lang, popup: string[]) => {
  const t = TEXT[lang];
  return [
    "<Dialog.Root>",
    `  <Dialog.Trigger render={<Button />}>${t.share}</Dialog.Trigger>`,
    "  <Dialog.Portal>",
    ...popup.map((l) => `    ${l}`),
    "  </Dialog.Portal>",
    "</Dialog.Root>",
  ];
};

const content = (lang: Lang, long = false) => {
  const t = TEXT[lang];
  return [
    `<Dialog.Title>${t.title}</Dialog.Title>`,
    `<Dialog.Description>${t.body}</Dialog.Description>`,
    ...(long ? ["{paragraphs.map((text) => <p key={text}>{text}</p>)}"] : []),
    `<Dialog.Close render={<Button />}>${t.done}</Dialog.Close>`,
  ];
};

const popup = (lang: Lang, long = false, className?: string) => [
  `<Dialog.Popup${className ? ` className="${className}"` : ""}>`,
  ...content(lang, long).map((l) => `  ${l}`),
  "</Dialog.Popup>",
];

const paragraphs = (lang: Lang) => [
  "  const paragraphs = [",
  ...TEXT[lang].long.map((text) => `    ${JSON.stringify(text)},`),
  "  ];",
];

const SHEET_CSS = {
  name: "sheet.css",
  code: [
    "/* Pinned to the bottom edge, sliding in from below it. */",
    ".sheet {",
    "  inline-size: 100%;",
    "  max-inline-size: none;",
    "  margin-block: auto 0;",
    "  border-end-start-radius: 0;",
    "  border-end-end-radius: 0;",
    "}",
    "",
    ".sheet:is([data-starting-style], [data-ending-style]) {",
    "  transform: translateY(100%);",
    "}",
  ].join("\n"),
};

export const dialogDefinition = defineComponent({
  item: "dialog",
  imports: ["Dialog"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Root, Trigger, Portal, dan Popup dengan Title. Portal menggambar scrim; Popup memusatkan dirinya. Di sini dialog mendarat di jendela dan tidak modal, agar halaman tetap bisa dipakai; milik Anda modal secara default.",
        en: "A Root, a Trigger, a Portal, and a Popup with a Title. The Portal draws the scrim; the Popup centers itself. Here the dialog lands in the window and is not modal, so the page stays usable; yours is modal by default.",
      },
      uses: ["Dialog", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("ShareDialog", imports(setup), dialog(lang, popup(lang))),
      ],
    },
    {
      id: "scrolling",
      title: { id: "Gulir", en: "Scrolling" },
      description: {
        id: "Isi yang tidak muat menggulir di dalam panel, bukan di halaman; panel tetap 16px dari tepi layar.",
        en: "Content that does not fit scrolls inside the panel, not the page; the panel stays 16px inside the screen.",
      },
      uses: ["Dialog", "Button"],
      demo: (lang) => <Scrolling lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "LongDialog",
          imports(setup),
          dialog(lang, popup(lang, true)),
          paragraphs(lang),
        ),
      ],
    },
    {
      id: "viewport",
      title: { id: "Viewport", en: "Viewport" },
      description: {
        id: "Dialog.Viewport di sekitar Popup: panel tetap setinggi isinya dan Viewport yang menggulir, seperti halaman.",
        en: "A Dialog.Viewport around the Popup: the panel keeps its full height and the Viewport scrolls, like a page.",
      },
      uses: ["Dialog", "Button"],
      demo: (lang) => <Viewport lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "PageDialog",
          imports(setup),
          dialog(lang, [
            "<Dialog.Viewport>",
            ...popup(lang, true).map((l) => `  ${l}`),
            "</Dialog.Viewport>",
          ]),
          paragraphs(lang),
        ),
      ],
    },
    {
      id: "nested",
      title: { id: "Bertumpuk", en: "Nested" },
      description: {
        id: "Root di dalam Popup membuat dialog bertumpuk: induk mundur dan meredup saat anaknya terbuka, dan Escape menutup yang teratas saja.",
        en: "A Root inside a Popup nests: the parent steps back and dims while the child is open, and Escape shuts only the top one.",
      },
      uses: ["Dialog", "Button"],
      demo: (lang) => <Nested lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("NestedDialog", imports(setup), [
            "<Dialog.Root>",
            `  <Dialog.Trigger render={<Button />}>${t.share}</Dialog.Trigger>`,
            "  <Dialog.Portal>",
            "    <Dialog.Popup>",
            `      <Dialog.Title>${t.title}</Dialog.Title>`,
            `      <Dialog.Description>${t.body}</Dialog.Description>`,
            "      <Dialog.Root>",
            `        <Dialog.Trigger render={<Button variant="outline" />}>${t.remove}</Dialog.Trigger>`,
            "        <Dialog.Portal>",
            "          <Dialog.Popup>",
            `            <Dialog.Title>${t.removeTitle}</Dialog.Title>`,
            `            <Dialog.Description>${t.removeBody}</Dialog.Description>`,
            `            <Dialog.Close render={<Button variant="outline" />}>${t.keep}</Dialog.Close>`,
            `            <Dialog.Close render={<Button variant="destructive" />}>${t.delete}</Dialog.Close>`,
            "          </Dialog.Popup>",
            "        </Dialog.Portal>",
            "      </Dialog.Root>",
            `      <Dialog.Close render={<Button />}>${t.done}</Dialog.Close>`,
            "    </Dialog.Popup>",
            "  </Dialog.Portal>",
            "</Dialog.Root>",
          ]),
        ];
      },
    },
    {
      id: "sheet",
      title: { id: "Sheet", en: "Sheet" },
      description: {
        id: "Cukup CSS pada className Popup: menempel di tepi bawah dan masuk dari bawahnya.",
        en: "Plain CSS on the Popup's className: pinned to the bottom edge, sliding in from below it.",
      },
      uses: ["Dialog", "Button"],
      demo: (lang) => <Sheet lang={lang} />,
      code: (setup, lang) => [
        exampleFile("ShareSheet", imports(setup), dialog(lang, popup(lang, false, "sheet"))),
        SHEET_CSS,
      ],
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
        id: "Tidak merender elemen: ia memegang state (open, modal, handle). Inspect menandai jendela yang memuat trigger dan dialognya.",
        en: "Renders no element: it holds the state (open, modal, handle). Inspect outlines the window that holds the trigger and its dialog.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="share"]',
      note: {
        id: "Tombol Anda, lewat render; Dialog.Trigger hanya menambah perilaku dan ARIA.",
        en: "Your button, through render; Dialog.Trigger adds only behavior and ARIA.",
      },
    },
    {
      name: "Backdrop",
      selector: ".ow-dialog__backdrop",
      note: {
        id: "Scrim yang digambar Portal, di belakang panel; hanya memudar.",
        en: "The scrim the Portal draws behind the panel; it only fades.",
      },
      tokens: { "--ow-backdrop": "--_bg" },
    },
    {
      name: "Popup",
      selector: ".ow-dialog__popup",
      note: {
        id: "Material raised dengan bayangan popup; role=dialog, dinamai oleh Title. Tumbuh dari 0,96 di tengahnya sendiri.",
        en: "The raised material with the popup shadow; role=dialog, named by its Title. It grows from 0.96 at its own middle.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Title",
      selector: ".ow-dialog__title",
      note: {
        id: "h2 yang menamai dialog untuk teknologi asistif.",
        en: "An h2 that names the dialog for assistive technology.",
      },
    },
    {
      name: "Description",
      selector: ".ow-dialog__description",
      note: {
        id: "Baris muted yang mendeskripsikan dialog.",
        en: "A muted line that describes the dialog.",
      },
    },
    {
      name: "Close",
      selector: '.ow-dialog__popup [data-demo="done"]',
      note: {
        id: "Tombol Anda, lewat render; tidak ada ikon tutup bawaan.",
        en: "Your button, through render; there is no built-in close icon.",
      },
    },
  ],
});

export default function DialogPage(props: ExamplePageProps) {
  return <ComponentPage definition={dialogDefinition} {...props} />;
}
