"use client";

import { Button, Dialog } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useState } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

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
    open: "Terbuka",
    nested: "Bertumpuk",
    light: "Terang",
    dark: "Gelap",
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
    open: "Open",
    nested: "Nested",
    light: "Light",
    dark: "Dark",
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { content: "short", scroll: "popup", layout: "center", bg: "", fg: "" };
type Cfg = typeof initial;

/**
 * Layouts are plain CSS on the Popup's className: these classes are in the docs' stylesheet, and
 * LAYOUT_CSS writes the same rules for the code drawer.
 */
const LAYOUT_CLASS: Record<string, string | undefined> = {
  narrow: "demo-dialog-narrow",
  sheet: "demo-dialog-sheet",
  full: "demo-dialog-full",
};

/** The panel's tokens go on the Portal, which holds the scrim and the popup. */
function tokens(cfg: Cfg) {
  return {
    "--ow-panel": cfg.bg || undefined,
    "--ow-fg": cfg.fg || undefined,
  } as CSSProperties;
}

/**
 * An app's window: a bar and a page. Its dialogs portal into it, so they take the stage's theme and
 * scale, and Inspect finds them. A container from state: Base UI waits while it is null.
 */
function useWindow() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, ref: setContainer };
}

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

/** The shortest dialog: a title, a line, and a button that shuts it. */
function Content({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Dialog.Title>{t.title}</Dialog.Title>
      <Dialog.Description>{t.body}</Dialog.Description>
      {cfg.content === "long"
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

/**
 * The window with its dialog. Stage dialogs are not modal, so the narrative keeps the keyboard and
 * the page's scroll; `open` pins it open without taking focus, for Inspect and the controls.
 */
function Demo({ cfg, lang, open }: { cfg: Cfg; lang: Lang; open?: boolean }) {
  const t = TEXT[lang];
  const frame = useWindow();
  const className = LAYOUT_CLASS[cfg.layout];
  const popup = (
    <Dialog.Popup
      data-demo="panel"
      {...(className ? { className } : {})}
      {...(open ? { initialFocus: false } : {})}
    >
      <Content cfg={cfg} lang={lang} />
    </Dialog.Popup>
  );
  return (
    <div ref={frame.ref} className="demo-dialog">
      <Dialog.Root modal={false} {...(open ? { open: true } : {})}>
        <div className="demo-dialog-bar">
          {t.app}
          <Dialog.Trigger render={<Button size="sm" />} data-demo="share">
            {t.share}
          </Dialog.Trigger>
        </div>
        <Page />
        <Dialog.Portal container={frame.container} style={tokens(cfg)}>
          {cfg.scroll === "viewport" ? <Dialog.Viewport>{popup}</Dialog.Viewport> : popup}
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** The parent's content, with a Root inside it: the nested dialog opens from the first button. */
function Parent({ lang, size, open }: { lang: Lang; size: "sm" | "md"; open?: boolean }) {
  const t = TEXT[lang];
  return (
    <Dialog.Popup data-demo="parent" {...(open ? { initialFocus: false } : {})}>
      <Dialog.Title>{t.title}</Dialog.Title>
      <Dialog.Description>{t.body}</Dialog.Description>
      <div className="demo-dialog-actions">
        <Dialog.Root modal={false} {...(open ? { open: true } : {})}>
          <Dialog.Trigger render={<Button size={size} variant="outline" />} data-demo="remove">
            {t.remove}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup data-demo="nested" {...(open ? { initialFocus: false } : {})}>
              <Dialog.Title>{t.removeTitle}</Dialog.Title>
              {/* A matrix cell has no room for the line. */}
              {open ? null : <Dialog.Description>{t.removeBody}</Dialog.Description>}
              <div className="demo-dialog-actions">
                <Dialog.Close render={<Button size={size} variant="outline" />} data-demo="keep">
                  {t.keep}
                </Dialog.Close>
                <Dialog.Close render={<Button size={size} variant="destructive" />}>
                  {t.delete}
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Dialog.Close render={<Button size={size} />} data-demo="done">
          {t.done}
        </Dialog.Close>
      </div>
    </Dialog.Popup>
  );
}

function Nested({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const frame = useWindow();
  return (
    <div ref={frame.ref} className="demo-dialog">
      <Dialog.Root modal={false}>
        <div className="demo-dialog-bar">
          {t.app}
          <Dialog.Trigger render={<Button size="sm" />} data-demo="share">
            {t.share}
          </Dialog.Trigger>
        </div>
        <Page />
        <Dialog.Portal container={frame.container}>
          <Parent lang={lang} size="md" />
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** A matrix cell: a small window with its dialog pinned open, in the cell's theme. */
function Cell({ theme, children }: { theme: Theme; children: ReactNode }) {
  const frame = useWindow();
  return (
    <div ref={frame.ref} className="demo-dialog" data-cell="" data-theme={theme}>
      <Page />
      <Dialog.Root open modal={false}>
        <Dialog.Portal container={frame.container}>{children}</Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** The panel open, and stepped back behind a nested one, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={[
        {
          label: t.open,
          cells: THEMES.map((theme) => (
            <Cell key={theme} theme={theme}>
              <Dialog.Popup initialFocus={false}>
                <Dialog.Title>{t.title}</Dialog.Title>
                <Dialog.Description>{t.body}</Dialog.Description>
                <Dialog.Close render={<Button size="sm" />}>{t.done}</Dialog.Close>
              </Dialog.Popup>
            </Cell>
          )),
        },
        {
          label: t.nested,
          cells: THEMES.map((theme) => (
            <Cell key={theme} theme={theme}>
              <Parent lang={lang} size="sm" open />
            </Cell>
          )),
        },
      ]}
    />
  );
}

// Opens Share: the scrim fades in and the panel grows from its middle. Done shuts it.
const panel: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="share"]'));
  await stage.wait(1400);
  await stage.click(stage.get('[data-demo="done"]'));
};

// Reads down the long panel and back: it scrolls inside itself, or in its Viewport.
const scroll: SceneScript = async (stage) => {
  const scroller = stage.get(".ow-dialog__viewport, .ow-dialog__popup");
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  await stage.point(scroller);
  await stage.wait(300);
  scroller.scrollTo({ top: scroller.scrollHeight, behavior });
  await stage.wait(1500);
  scroller.scrollTo({ top: 0, behavior });
  await stage.wait(900);
};

// Opens one over the other: the parent steps back and dims. Keep it, then Done, shut them in turn.
const stack: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="share"]'));
  await stage.wait(800);
  await stage.click(stage.get('[data-demo="remove"]'));
  await stage.wait(1400);
  await stage.click(stage.get('[data-demo="keep"]'));
  await stage.wait(800);
  await stage.click(stage.get('[data-demo="done"]'));
};

const LAYOUT_CSS: Record<string, (prefix: string) => string[]> = {
  narrow: (prefix) => [
    "/* Narrower, with less padding; the radius follows it (FR-10b). */",
    ".narrow {",
    "  inline-size: 22em;",
    "  padding: 12px;",
    `  border-radius: calc(var(--${prefix}-radius) + 12px);`,
    "}",
  ],
  sheet: () => [
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
  ],
  full: () => [
    "/* The whole screen. */",
    ".full {",
    "  inline-size: 100%;",
    "  max-inline-size: none;",
    "  block-size: 100%;",
    "  max-block-size: none;",
    "  border-radius: 0;",
    "}",
  ],
};

const dialogLab = defineLab({
  initial,
  controls: [
    {
      key: "content",
      type: "choice",
      label: { id: "Isi", en: "Content" },
      options: [
        { value: "short", label: { id: "Pendek", en: "Short" } },
        { value: "long", label: { id: "Panjang", en: "Long" } },
      ],
    },
    {
      key: "scroll",
      type: "choice",
      label: { id: "Gulir", en: "Scrolls" },
      options: [
        { value: "popup", label: { id: "Popup", en: "Popup" } },
        { value: "viewport", label: { id: "Viewport", en: "Viewport" } },
      ],
    },
    {
      key: "layout",
      type: "choice",
      label: { id: "Tata letak", en: "Layout" },
      options: [
        { value: "center", label: { id: "Tengah", en: "Center" } },
        { value: "narrow", label: { id: "Sempit", en: "Narrow" } },
        { value: "sheet", label: { id: "Sheet", en: "Sheet" } },
        { value: "full", label: { id: "Penuh", en: "Full" } },
      ],
    },
    { key: "bg", type: "color", label: { id: "Permukaan", en: "Surface" }, token: "--ow-panel" },
    { key: "fg", type: "color", label: { id: "Teks", en: "Text" }, token: "--ow-fg" },
  ],

  parts: [
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
        en: "The scrim Portal draws behind the panel; it only fades.",
      },
      tokens: { "--ow-backdrop": "--_bg" },
    },
    {
      name: "Popup",
      selector: ".ow-dialog__popup",
      note: {
        id: "Material panel dengan bayangan popup; role=dialog, dinamai oleh Title.",
        en: "The panel material with the popup shadow; role=dialog, named by its Title.",
      },
      tokens: {
        "--ow-panel": "--_bg",
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
      selector: '[data-demo="done"]',
      note: {
        id: "Tombol Anda, lewat render; tanpa ikon tutup bawaan.",
        en: "Your button, through render; there is no built-in close icon.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Button, Dialog } from "owsem-ui/base";']
      : [
          'import { Button } from "@/components/owsem/button";',
          'import { Dialog } from "@/components/owsem/dialog";',
        ];
    const themed = Boolean(cfg.bg || cfg.fg);
    const layout = LAYOUT_CSS[cfg.layout];
    const popup = [
      `<Dialog.Popup${layout ? ` className="${cfg.layout}"` : ""}>`,
      "  <Dialog.Title>Share the draft</Dialog.Title>",
      "  <Dialog.Description>Anyone with the link can read it.</Dialog.Description>",
      ...(cfg.content === "long" ? ["  {/* Long content */}"] : []),
      "  <Dialog.Close render={<Button />}>Done</Dialog.Close>",
      "</Dialog.Popup>",
    ];
    const inner =
      cfg.scroll === "viewport"
        ? ["<Dialog.Viewport>", ...popup.map((line) => `  ${line}`), "</Dialog.Viewport>"]
        : popup;
    const usage = [
      ...imports,
      "",
      "export function ShareDialog() {",
      "  return (",
      "    <Dialog.Root>",
      "      <Dialog.Trigger render={<Button />}>Share</Dialog.Trigger>",
      `      <Dialog.Portal${themed ? ' className="share"' : ""}>`,
      ...inner.map((line) => `        ${line}`),
      "      </Dialog.Portal>",
      "    </Dialog.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "share-dialog.tsx", code: usage.join("\n") }];
    if (themed || layout) {
      const rules = [
        ...(themed
          ? [
              "/* On the Portal: dialogs render in a portal, outside the trigger's subtree. */",
              ".share {",
              ...(cfg.bg ? [`  --${setup.prefix}-panel: ${cfg.bg};`] : []),
              ...(cfg.fg ? [`  --${setup.prefix}-fg: ${cfg.fg};`] : []),
              "}",
            ]
          : []),
        ...(themed && layout ? [""] : []),
        ...(layout ? layout(setup.prefix) : []),
      ];
      files.push({ name: "share-dialog.css", code: rules.join("\n") });
    }
    return files;
  },

  scenes: {
    window: { play: panel },
    long: {
      cfg: { content: "long" },
      controls: true,
      demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} open />,
      play: scroll,
    },
    nested: { demo: (_cfg, lang) => <Nested lang={lang} />, play: stack },
    anatomy: { inspect: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} open /> },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} open /> },
    ship: { code: true },
  },
});

export default function DialogLab(props: LabProps) {
  return <LabShell lab={dialogLab} {...props} />;
}
