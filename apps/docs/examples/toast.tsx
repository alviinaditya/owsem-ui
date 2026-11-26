"use client";

import { Button, Toast } from "owsem-ui/base";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    app: "Kotak masuk",
    show: "Tampilkan toast",
    savedTitle: "Perubahan disimpan",
    savedBody: "Suntingan Anda sudah masuk ke draf.",
    note: "Catatan",
    noteBody: "Toast tanpa type tampil polos.",
    success: "Berhasil",
    successTitle: "Profil diperbarui",
    error: "Gagal",
    errorTitle: "Unggahan gagal",
    errorBody: "Berkasnya lebih besar dari 10 MB.",
    warning: "Peringatan",
    warningTitle: "Penyimpanan hampir penuh",
    warningBody: "Ruang Anda tersisa 5%.",
    info: "Info",
    infoTitle: "Versi baru tersedia",
    infoBody: "Muat ulang untuk perbaikan terbaru.",
    loading: "Memuat",
    loadingTitle: "Menyinkronkan…",
    report: "Laporan mingguan",
    archive: "Arsipkan",
    archived: "Pesan diarsipkan",
    undo: "Urungkan",
    restored: "Pesan dikembalikan",
    save: "Simpan",
    saveFail: "Simpan, lalu gagal",
    saving: "Menyimpan…",
    saved: "Tersimpan",
    saveError: "Tidak bisa menyimpan",
    saveErrorBody: "Periksa koneksi Anda lalu coba lagi.",
    copy: "Salin tautan",
    copied: "Tautan disalin",
    add: "Tambah toast",
    clear: "Tutup semua",
    stackTitle: "Pesan",
    stackBody: "Arahkan atau fokus untuk membuka tumpukan.",
    region: "Notifikasi",
  },
  en: {
    app: "Inbox",
    show: "Show toast",
    savedTitle: "Changes saved",
    savedBody: "Your edits are in the draft.",
    note: "Note",
    noteBody: "A toast with no type looks plain.",
    success: "Success",
    successTitle: "Profile updated",
    error: "Error",
    errorTitle: "Upload failed",
    errorBody: "The file is larger than 10 MB.",
    warning: "Warning",
    warningTitle: "Storage almost full",
    warningBody: "You have 5% of your space left.",
    info: "Info",
    infoTitle: "A new version is out",
    infoBody: "Reload to get the latest fixes.",
    loading: "Loading",
    loadingTitle: "Syncing…",
    report: "Weekly report",
    archive: "Archive",
    archived: "Message archived",
    undo: "Undo",
    restored: "Message restored",
    save: "Save",
    saveFail: "Save, then fail",
    saving: "Saving…",
    saved: "Saved",
    saveError: "Could not save",
    saveErrorBody: "Check your connection and try again.",
    copy: "Copy link",
    copied: "Link copied",
    add: "Add toast",
    clear: "Close all",
    stackTitle: "Message",
    stackBody: "Hover or focus to open the stack.",
    region: "Notifications",
  },
} satisfies Record<Lang, Record<string, string>>;

type Type = "success" | "error" | "warning" | "info" | "loading";

/** The page behind the toasts, as shapes. */
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

/** The window the toasts land in, for the parts that need it (an anchored Provider's portal). */
const FrameContext = createContext<HTMLElement | null>(null);

/**
 * An app's window with its own Provider. The toasts land at the window's bottom end, not on the
 * docs page, as they do at the screen's in an app. `children` are the buttons in the app's bar.
 */
function Window({
  lang,
  limit,
  children,
  extra,
  specimen,
  manager,
}: {
  lang: Lang;
  limit?: number;
  children?: ReactNode;
  extra?: ReactNode;
  specimen?: boolean;
  manager?: ReturnType<typeof Toast.createToastManager>;
}) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  return (
    <div
      ref={setFrame}
      className={specimen ? "demo-dialog demo-toast demo-toast-specimen" : "demo-dialog demo-toast"}
      {...(specimen ? { inert: true } : {})}
    >
      <FrameContext.Provider value={frame}>
        <Toast.Provider
          {...(limit ? { limit } : {})}
          {...(manager ? { toastManager: manager } : {})}
        >
          <div className="demo-dialog-bar">
            {TEXT[lang].app}
            <div className="demo-toast-triggers">{children}</div>
          </div>
          {extra}
          <Page />
          <Toast.Portal container={frame}>
            <Toast.Viewport aria-label={TEXT[lang].region} />
          </Toast.Portal>
        </Toast.Provider>
      </FrameContext.Provider>
    </div>
  );
}

function Show({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  return (
    <Button
      size="sm"
      variant="outline"
      data-demo="show"
      onClick={() => toastManager.add({ title: t.savedTitle, description: t.savedBody })}
    >
      {t.show}
    </Button>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <Show lang={lang} />
    </Window>
  );
}

const TYPES: Type[] = ["success", "error", "warning", "info", "loading"];

function TypeButtons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  const copy: Record<Type, { title: string; description?: string }> = {
    success: { title: t.successTitle },
    error: { title: t.errorTitle, description: t.errorBody },
    warning: { title: t.warningTitle, description: t.warningBody },
    info: { title: t.infoTitle, description: t.infoBody },
    loading: { title: t.loadingTitle },
  };
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        data-demo="type-default"
        onClick={() => toastManager.add({ title: t.note, description: t.noteBody })}
      >
        {t.note}
      </Button>
      {TYPES.map((type) => (
        <Button
          key={type}
          size="sm"
          variant="outline"
          data-demo={`type-${type}`}
          onClick={() => toastManager.add({ ...copy[type], type })}
        >
          {t[type]}
        </Button>
      ))}
    </>
  );
}

function Types({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <TypeButtons lang={lang} />
    </Window>
  );
}

/** A row the app archives; the toast's Undo brings it back. */
function Row({
  lang,
  archived,
  setArchived,
}: {
  lang: Lang;
  archived: boolean;
  setArchived: (archived: boolean) => void;
}) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  return (
    <div className="demo-toast-row" data-demo="row">
      <span>{t.report}</span>
      <Button
        size="sm"
        variant="outline"
        data-demo="archive"
        disabled={archived}
        onClick={() => {
          setArchived(true);
          const id = toastManager.add({
            title: t.archived,
            actionProps: {
              children: t.undo,
              onClick: () => {
                setArchived(false);
                toastManager.close(id);
                toastManager.add({ title: t.restored, type: "success" });
              },
            },
          });
        }}
      >
        {t.archive}
      </Button>
    </div>
  );
}

function Undoable({ lang }: { lang: Lang }) {
  const [archived, setArchived] = useState(false);
  return (
    <Window lang={lang} extra={<Row lang={lang} archived={archived} setArchived={setArchived} />} />
  );
}

/** A save that takes a moment: the toast loads, then turns into the result. */
const save = (fail: boolean) =>
  new Promise<void>((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error("offline")) : resolve()), 1600);
  });

function SaveButtons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  const run = (fail: boolean) =>
    toastManager
      .promise(save(fail), {
        loading: { title: t.saving },
        success: { title: t.saved },
        error: { title: t.saveError, description: t.saveErrorBody },
      })
      .catch(() => {});
  return (
    <>
      <Button size="sm" variant="outline" data-demo="save" onClick={() => run(false)}>
        {t.save}
      </Button>
      <Button size="sm" variant="outline" data-demo="save-fail" onClick={() => run(true)}>
        {t.saveFail}
      </Button>
    </>
  );
}

function Promised({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <SaveButtons lang={lang} />
    </Window>
  );
}

function CopyButton({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  return (
    <Button
      size="sm"
      variant="outline"
      data-demo="copy"
      onClick={(event) =>
        toastManager.add({
          title: t.copied,
          timeout: 1500,
          positionerProps: { anchor: event.currentTarget, side: "bottom" },
        })
      }
    >
      {t.copy}
    </Button>
  );
}

/** Anchored toasts have a Provider of their own, here the window's: it holds only this one. */
function Anchored({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang}>
      <CopyButton lang={lang} />
    </Window>
  );
}

function StackButtons({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const toastManager = Toast.useToastManager();
  const [count, setCount] = useState(0);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        data-demo="add"
        onClick={() => {
          setCount(count + 1);
          toastManager.add({
            title: `${t.stackTitle} ${count + 1}`,
            description: t.stackBody,
            timeout: 0,
          });
        }}
      >
        {t.add}
      </Button>
      <Button size="sm" variant="ghost" data-demo="clear" onClick={() => toastManager.close()}>
        {t.clear}
      </Button>
    </>
  );
}

function Stacking({ lang }: { lang: Lang }) {
  return (
    <Window lang={lang} limit={3}>
      <StackButtons lang={lang} />
    </Window>
  );
}

/** The anchored toast of the specimen: a Provider of its own, at a button in the bar. */
function AnchoredPart({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const frame = useContext(FrameContext);
  const [manager] = useState(() => Toast.createToastManager());
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!anchor) return;
    manager.add({
      id: "seed-anchored",
      title: t.copied,
      timeout: 0,
      positionerProps: { anchor, side: "bottom" },
    });
  }, [manager, anchor, t]);
  return (
    <Toast.Provider toastManager={manager}>
      <Button ref={setAnchor} size="sm" variant="outline" data-demo="anchor">
        {t.copy}
      </Button>
      <Toast.Portal container={frame}>
        <Toast.Viewport aria-label={TEXT[lang].region} />
      </Toast.Portal>
    </Toast.Provider>
  );
}

/**
 * Every part in one window: a stack held in place with no timers, and an anchored toast with a
 * Provider of its own. It is `inert`, with no focus taken and nothing announced, so Inspect can
 * magnify all of it. The toasts keep fixed ids, so a second mount changes nothing.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [manager] = useState(() => Toast.createToastManager());
  useEffect(() => {
    manager.add({ id: "seed-1", title: t.infoTitle, type: "info", timeout: 0 });
    manager.add({ id: "seed-2", title: t.warningTitle, type: "warning", timeout: 0 });
    manager.add({
      id: "seed-3",
      title: t.savedTitle,
      description: t.savedBody,
      type: "success",
      timeout: 0,
      actionProps: { children: t.undo },
    });
  }, [manager, t]);
  return (
    <Window lang={lang} specimen manager={manager}>
      <AnchoredPart lang={lang} />
    </Window>
  );
}

const imports = (setup: TokenSetup, button = true) =>
  isDefaultSetup(setup)
    ? [`import { ${button ? "Button, " : ""}Toast } from "owsem-ui/base";`]
    : [
        ...(button ? [`import { Button } from "${importPath(setup, "button")}";`] : []),
        `import { Toast } from "${importPath(setup, "toast")}";`,
      ];

/** The one place a toast app is set up: a Provider around the app, and a Viewport in a Portal. */
const setupFile = (setup: TokenSetup, limit?: number) => ({
  name: "app.tsx",
  code: [
    ...imports(setup, false),
    "",
    "export function App({ children }: { children: React.ReactNode }) {",
    "  return (",
    `    <Toast.Provider${limit ? ` limit={${limit}}` : ""}>`,
    "      {children}",
    "      <Toast.Portal>",
    "        <Toast.Viewport />",
    "      </Toast.Portal>",
    "    </Toast.Provider>",
    "  );",
    "}",
  ].join("\n"),
});

/** A component that adds toasts: it must sit inside the Provider. */
const adder = (
  setup: TokenSetup,
  name: string,
  hooks: string[],
  body: string[],
  options: { button?: boolean } = {},
) => ({
  name: `${name.replace(/[A-Z]/g, (c, i) => (i ? `-${c}` : c)).toLowerCase()}.tsx`,
  code: [
    ...imports(setup, options.button ?? true),
    "",
    `export function ${name}() {`,
    "  const toastManager = Toast.useToastManager();",
    ...hooks,
    "  return (",
    ...body.map((line) => `    ${line}`),
    "  );",
    "}",
  ].join("\n"),
});

const button = (label: string, onClick: string[], extra = "") => [
  `<Button variant="outline"${extra} onClick={() => {`,
  ...onClick.map((line) => `  ${line}`),
  `}}>${label}</Button>`,
];

export const toastDefinition = defineComponent({
  item: "toast",
  imports: ["Toast"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Pemakaian tersingkat: satu Provider di sekitar aplikasi dan Viewport di dalam Portal, sekali saja. Viewport tanpa children menggambar setiap toast sendiri, dan useToastManager().add menampilkannya.",
        en: "The shortest use: one Provider around the app and a Viewport in a Portal, once. A Viewport with no children draws every toast itself, and useToastManager().add shows one.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup),
          adder(
            setup,
            "ShowToast",
            [],
            [
              ...button(t.show, [
                "toastManager.add({",
                `  title: ${JSON.stringify(t.savedTitle)},`,
                `  description: ${JSON.stringify(t.savedBody)},`,
                "});",
              ]),
            ],
          ),
        ];
      },
    },
    {
      id: "types",
      title: { id: "Tipe", en: "Types" },
      description: {
        id: "type memberi toast tanda kecil dengan warna nadanya: success, error, warning, info, dan loading (spinner yang tenang). Tipe lain, atau tanpa tipe, tampil polos.",
        en: "type gives a toast a small mark in its tone: success, error, warning, info, and loading (a quiet spinner). Any other type, or none, looks plain.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Types lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup),
          adder(
            setup,
            "TypedToasts",
            [],
            [
              "<>",
              ...button(t.success, [
                `toastManager.add({ title: ${JSON.stringify(t.successTitle)}, type: "success" });`,
              ]).map((l) => `  ${l}`),
              ...button(t.error, [
                "toastManager.add({",
                `  title: ${JSON.stringify(t.errorTitle)},`,
                `  description: ${JSON.stringify(t.errorBody)},`,
                '  type: "error",',
                "});",
              ]).map((l) => `  ${l}`),
              "</>",
            ],
          ),
        ];
      },
    },
    {
      id: "action",
      title: { id: "Aksi", en: "Action" },
      description: {
        id: "actionProps menambah tombol kecil di toast: children-nya adalah labelnya dan onClick-nya aksinya. Di sini Urungkan mengembalikan baris yang baru diarsipkan.",
        en: "actionProps adds a small button to the toast: its children are the label and its onClick the action. Here Undo brings back the row that was just archived.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Undoable lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup),
          adder(
            setup,
            "ArchiveButton",
            [],
            [
              ...button(t.archive, [
                "const id = toastManager.add({",
                `  title: ${JSON.stringify(t.archived)},`,
                "  actionProps: {",
                `    children: ${JSON.stringify(t.undo)},`,
                "    onClick: () => {",
                "      restore();",
                "      toastManager.close(id);",
                "    },",
                "  },",
                "});",
              ]),
            ],
          ),
        ];
      },
    },
    {
      id: "promise",
      title: { id: "Promise", en: "Promise" },
      description: {
        id: "toastManager.promise menampilkan toast loading, lalu mengubahnya menjadi success atau error saat promise selesai. Satu toast, tiga keadaan.",
        en: "toastManager.promise shows a loading toast, then turns it into success or error when the promise settles: one toast, three states.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Promised lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup),
          adder(
            setup,
            "SaveButton",
            [],
            [
              ...button(t.save, [
                "toastManager.promise(saveDraft(), {",
                `  loading: { title: ${JSON.stringify(t.saving)} },`,
                `  success: { title: ${JSON.stringify(t.saved)} },`,
                "  error: {",
                `    title: ${JSON.stringify(t.saveError)},`,
                `    description: ${JSON.stringify(t.saveErrorBody)},`,
                "  },",
                "});",
              ]),
            ],
          ),
        ];
      },
    },
    {
      id: "anchored",
      title: { id: "Berlabuh", en: "Anchored" },
      description: {
        id: "positionerProps.anchor menaruh toast di samping elemen, seperti Popover, lengkap dengan panah, dan melepasnya dari tumpukan. Beri toast berlabuh Provider-nya sendiri.",
        en: "positionerProps.anchor places a toast beside an element, like a Popover with an arrow, and takes it out of the stack. Give anchored toasts their own Provider.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Anchored lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup),
          adder(
            setup,
            "CopyLink",
            [],
            [
              `<Button variant="outline" onClick={(event) => {`,
              "  toastManager.add({",
              `    title: ${JSON.stringify(t.copied)},`,
              "    timeout: 1500,",
              '    positionerProps: { anchor: event.currentTarget, side: "bottom" },',
              "  });",
              `}}>${t.copy}</Button>`,
            ],
          ),
        ];
      },
    },
    {
      id: "stacking",
      title: { id: "Tumpukan", en: "Stacking" },
      description: {
        id: "Toast terbaru di depan, yang lebih lama mengintip di belakang. limit pada Provider (3) menyembunyikan sisanya. Arahkan atau fokus (F6) untuk membuka tumpukan menjadi daftar; geser untuk menutup satu.",
        en: "The newest is in front, older ones peek behind it. limit on the Provider (3) hides the rest. Hover or focus (F6) to open the stack into a list; swipe one to dismiss it.",
      },
      uses: ["Toast", "Button"],
      demo: (lang) => <Stacking lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          setupFile(setup, 3),
          adder(
            setup,
            "AddToast",
            ["  const [count, setCount] = useState(0);"],
            [
              ...button(t.add, [
                "setCount(count + 1);",
                "toastManager.add({",
                `  title: \`${t.stackTitle} \${count + 1}\`,`,
                `  description: ${JSON.stringify(t.stackBody)},`,
                "  timeout: 0,",
                "});",
              ]),
            ],
          ),
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Provider",
      selector: ".demo-toast",
      note: {
        id: "Tidak merender elemen: ia memegang daftar toast dan timernya (limit, timeout, toastManager). Inspect menandai jendela yang memuat tumpukannya.",
        en: "Renders no element: it holds the toasts and their timers (limit, timeout, toastManager). Inspect outlines the window that holds the stack.",
      },
    },
    {
      name: "Viewport",
      selector: ".ow-toast__viewport:has(> .ow-toast:not([data-anchored]))",
      note: {
        id: "Wilayah live (region, aria-live) di ujung bawah jendela; F6 memfokuskannya. Tanpa children ia menggambar setiap toast.",
        en: "The live region (region, aria-live) at the window's bottom end; F6 focuses it. With no children it draws every toast.",
      },
    },
    {
      name: "Root",
      selector: ".ow-toast:not([data-anchored])",
      note: {
        id: "Kartu: material raised dengan bayangan popup. Yang terbaru di depan; yang lama mengintip di belakang dan tumpukan terbuka saat hover atau fokus.",
        en: "The card: the raised material with the popup shadow. The newest is in front, older ones peek behind it, and the stack opens on hover or focus.",
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
      name: "Content",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__content",
      note: {
        id: "Isi toast; disembunyikan selagi toast berada di belakang yang lain dalam tumpukan tertutup.",
        en: "The toast's inside; hidden while the toast is behind another one in a closed stack.",
      },
    },
    {
      name: "Mark",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__mark",
      size: true,
      note: {
        id: "Tanda kecil sesuai type, dengan warna nadanya; loading berupa spinner tenang. Tipe lain tidak menggambar apa pun.",
        en: "A small mark for the type, in its tone; loading is a quiet spinner. Any other type draws nothing.",
      },
      tokens: { "--ow-good": "--_tone" },
    },
    {
      name: "Title",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__title",
      note: {
        id: "h2 yang menamai toast; tanpa children ia menampilkan title toast.",
        en: "An h2 that names the toast; with no children it shows the toast's title.",
      },
    },
    {
      name: "Description",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__description",
      note: {
        id: "Baris muted di bawah judul; tanpa children ia menampilkan description toast.",
        en: "A muted line under the title; with no children it shows the toast's description.",
      },
    },
    {
      name: "Action",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__action",
      note: {
        id: "Button kecil, hanya bila toast punya actionProps; render menggantinya dengan tombol Anda.",
        en: "A small Button, only when the toast has actionProps; render swaps in your own button.",
      },
    },
    {
      name: "Close",
      selector: ".ow-toast:not([data-anchored]) .ow-toast__close",
      size: true,
      note: {
        id: "Tombol ikon kecil yang tenang di pojok ujung, target 24px; aria-label-nya bisa diganti.",
        en: "A small quiet icon button in the end corner, a 24px target; its aria-label can be changed.",
      },
    },
    {
      name: "Positioner",
      selector: ".ow-toast__positioner",
      note: {
        id: "Untuk toast berlabuh: menaruhnya 10px dari elemen dan membawa arah teks ke dalam portal.",
        en: "For an anchored toast: places it 10px from the element and carries the text direction into the portal.",
      },
    },
    {
      name: "Arrow",
      selector: ".ow-toast__arrow",
      note: {
        id: "Panah ke arah elemen, dengan tepi kartu, seperti panah Popover.",
        en: "An arrow toward the element, with the card's edge, like the Popover's.",
      },
    },
  ],
});

export default function ToastPage(props: ExamplePageProps) {
  return <ComponentPage definition={toastDefinition} {...props} />;
}
