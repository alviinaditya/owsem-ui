"use client";

import { AlertDialog, Button } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    app: "Laporan Q3",
    open: "Buang draf",
    title: "Buang draf ini?",
    body: "Perubahan yang belum disimpan akan hilang.",
    keep: "Lanjut mengedit",
    discard: "Buang",
    deleteTitle: "Hapus draf ini?",
    deleteBody: "Draf dan semua komentarnya dihapus untuk selamanya.",
    cancel: "Batal",
    delete: "Hapus",
    deleted: "Draf dihapus.",
    again: "Pulihkan",
    sureTitle: "Hapus untuk selamanya?",
    sureBody: "Ini tidak bisa dibatalkan.",
    back: "Kembali",
    terms: "Syarat layanan",
    termsBody: "Baca syaratnya sampai habis sebelum melanjutkan.",
    accept: "Setuju",
    long: [
      "Layanan ini disediakan apa adanya. Anda bertanggung jawab atas isi yang Anda unggah dan atas siapa saja yang Anda beri akses ke ruang kerja.",
      "Kami menyimpan cadangan harian selama tiga puluh hari. Setelah itu, draf yang dihapus tidak bisa dipulihkan oleh siapa pun, termasuk kami.",
      "Perubahan pada syarat ini diumumkan lewat email paling lambat tujuh hari sebelum berlaku. Terus memakai layanan berarti Anda menerimanya.",
      "Anda boleh menutup akun kapan saja dari pengaturan. Data pribadi dihapus dalam sembilan puluh hari setelah akun ditutup.",
      "Pertanyaan tentang syarat ini bisa dikirim ke tim dukungan, yang membalas dalam dua hari kerja.",
    ],
  },
  en: {
    app: "Q3 report",
    open: "Discard draft",
    title: "Discard this draft?",
    body: "Changes you have not saved will be lost.",
    keep: "Keep editing",
    discard: "Discard",
    deleteTitle: "Delete this draft?",
    deleteBody: "The draft and all its comments are deleted for good.",
    cancel: "Cancel",
    delete: "Delete",
    deleted: "Draft deleted.",
    again: "Restore",
    sureTitle: "Delete for good?",
    sureBody: "This cannot be undone.",
    back: "Go back",
    terms: "Terms of service",
    termsBody: "Read the terms to the end before you continue.",
    accept: "Accept",
    long: [
      "The service is provided as it is. You are responsible for what you upload and for everyone you give access to the workspace.",
      "We keep daily backups for thirty days. After that, a deleted draft cannot be restored by anyone, including us.",
      "Changes to these terms are announced by email at least seven days before they apply. Using the service on means you accept them.",
      "You may close your account at any time from the settings. Personal data is deleted within ninety days after the account is closed.",
      "Questions about these terms can be sent to the support team, which replies within two working days.",
    ],
  },
} satisfies Record<Lang, Record<string, string | string[]>>;

/** The page behind the alert, as shapes. */
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
 * An app's window with a trigger. The alert lands in the window, not on the docs page; it is
 * modal as always, so while it is open only the window's alert answers. `open` holds it open for
 * Inspect.
 */
function Window({
  lang,
  open,
  trigger,
  status,
  children,
  rootProps,
}: {
  lang: Lang;
  open?: boolean;
  trigger?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  rootProps?: AlertDialog.AlertDialogRootProps;
}) {
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  return (
    <div ref={setFrame} className="demo-dialog">
      <AlertDialog.Root {...(open ? { open: true } : {})} {...rootProps}>
        <div className="demo-dialog-bar">
          {TEXT[lang].app}
          {trigger ?? (
            <AlertDialog.Trigger render={<Button size="sm" variant="outline" />} data-demo="open">
              {TEXT[lang].open}
            </AlertDialog.Trigger>
          )}
        </div>
        {status ?? <Page />}
        <AlertDialog.Portal container={frame}>{children}</AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

/** A title, a line, and the two answers: the safe one first, then the one with a consequence. */
function Answers({
  title,
  body,
  safe,
  risky,
  variant = "primary",
}: {
  title: string;
  body: string;
  safe: string;
  risky: string;
  variant?: "primary" | "destructive";
}) {
  return (
    <>
      <AlertDialog.Title>{title}</AlertDialog.Title>
      <AlertDialog.Description>{body}</AlertDialog.Description>
      <div className="demo-dialog-actions">
        <AlertDialog.Close render={<Button variant="outline" />} data-demo="safe">
          {safe}
        </AlertDialog.Close>
        <AlertDialog.Close render={<Button variant={variant} />} data-demo="risky">
          {risky}
        </AlertDialog.Close>
      </div>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang}>
      <AlertDialog.Popup data-demo="panel">
        <Answers title={t.title} body={t.body} safe={t.keep} risky={t.discard} />
      </AlertDialog.Popup>
    </Window>
  );
}

function Destructive({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window
      lang={lang}
      trigger={
        <AlertDialog.Trigger render={<Button size="sm" variant="destructive" />} data-demo="open">
          {t.delete}
        </AlertDialog.Trigger>
      }
    >
      <AlertDialog.Popup data-demo="panel">
        <Answers
          title={t.deleteTitle}
          body={t.deleteBody}
          safe={t.cancel}
          risky={t.delete}
          variant="destructive"
        />
      </AlertDialog.Popup>
    </Window>
  );
}

/** Open and shut from state: the answer is read when the alert closes. */
function Controlled({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <Window
      lang={lang}
      rootProps={{ open, onOpenChange: setOpen }}
      trigger={
        deleted ? (
          <Button size="sm" variant="outline" data-demo="restore" onClick={() => setDeleted(false)}>
            {t.again}
          </Button>
        ) : (
          <AlertDialog.Trigger render={<Button size="sm" variant="destructive" />} data-demo="open">
            {t.delete}
          </AlertDialog.Trigger>
        )
      }
      status={
        deleted ? (
          <p className="demo-dialog-text demo-dialog-status" role="status">
            {t.deleted}
          </p>
        ) : null
      }
    >
      <AlertDialog.Popup data-demo="panel">
        <AlertDialog.Title>{t.deleteTitle}</AlertDialog.Title>
        <AlertDialog.Description>{t.deleteBody}</AlertDialog.Description>
        <div className="demo-dialog-actions">
          <AlertDialog.Close render={<Button variant="outline" />} data-demo="safe">
            {t.cancel}
          </AlertDialog.Close>
          <Button
            variant="destructive"
            data-demo="risky"
            onClick={() => {
              setDeleted(true);
              setOpen(false);
            }}
          >
            {t.delete}
          </Button>
        </div>
      </AlertDialog.Popup>
    </Window>
  );
}

function Scrolling({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window
      lang={lang}
      trigger={
        <AlertDialog.Trigger render={<Button size="sm" variant="outline" />} data-demo="open">
          {t.terms}
        </AlertDialog.Trigger>
      }
    >
      <AlertDialog.Popup data-demo="panel">
        <AlertDialog.Title>{t.terms}</AlertDialog.Title>
        <AlertDialog.Description>{t.termsBody}</AlertDialog.Description>
        {t.long.map((paragraph) => (
          <p key={paragraph} className="demo-dialog-text">
            {paragraph}
          </p>
        ))}
        <div className="demo-dialog-actions">
          <AlertDialog.Close render={<Button />} data-demo="safe">
            {t.accept}
          </AlertDialog.Close>
        </div>
      </AlertDialog.Popup>
    </Window>
  );
}

/** A Root inside a Popup: the second question opens from the first one's risky answer. */
function Nested({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang}>
      <AlertDialog.Popup data-demo="parent">
        <AlertDialog.Title>{t.title}</AlertDialog.Title>
        <AlertDialog.Description>{t.body}</AlertDialog.Description>
        <div className="demo-dialog-actions">
          <AlertDialog.Close render={<Button variant="outline" />} data-demo="safe">
            {t.keep}
          </AlertDialog.Close>
          <AlertDialog.Root>
            <AlertDialog.Trigger render={<Button variant="destructive" />} data-demo="risky">
              {t.delete}
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Popup data-demo="nested">
                <Answers
                  title={t.sureTitle}
                  body={t.sureBody}
                  safe={t.back}
                  risky={t.delete}
                  variant="destructive"
                />
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </AlertDialog.Popup>
    </Window>
  );
}

/**
 * Every part in one window, the alert held open: it lands in the window, `inert`, with no lock
 * on the page and no focus taken, so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Window lang={lang} open>
      <AlertDialog.Popup inert initialFocus={false} data-demo="panel">
        <Answers title={t.title} body={t.body} safe={t.keep} risky={t.discard} />
      </AlertDialog.Popup>
    </Window>
  );
}

const imports = (setup: TokenSetup) =>
  isDefaultSetup(setup)
    ? ['import { AlertDialog, Button } from "owsem-ui/base";']
    : [
        `import { AlertDialog } from "${importPath(setup, "alert-dialog")}";`,
        `import { Button } from "${importPath(setup, "button")}";`,
      ];

/** Two answers in a row, the safe one first: plain markup, there is no part for it. */
const answers = (title: string, body: string, safe: string, risky: string, variant: string) => [
  `<AlertDialog.Title>${title}</AlertDialog.Title>`,
  `<AlertDialog.Description>${body}</AlertDialog.Description>`,
  '<div className="actions">',
  `  <AlertDialog.Close render={<Button variant="outline" />}>${safe}</AlertDialog.Close>`,
  `  <AlertDialog.Close render={<Button variant="${variant}" />}>${risky}</AlertDialog.Close>`,
  "</div>",
];

/** The alert as an app writes it: modal, in a portal on the body. */
const alert = (trigger: string, popup: string[]) => [
  "<AlertDialog.Root>",
  `  ${trigger}`,
  "  <AlertDialog.Portal>",
  "    <AlertDialog.Popup>",
  ...popup.map((l) => `      ${l}`),
  "    </AlertDialog.Popup>",
  "  </AlertDialog.Portal>",
  "</AlertDialog.Root>",
];

const ACTIONS_CSS = {
  name: "actions.css",
  code: [
    "/* The answers in a row at the end, wrapping on a narrow screen. */",
    ".actions {",
    "  display: flex;",
    "  flex-wrap: wrap;",
    "  justify-content: flex-end;",
    "  gap: 8px;",
    "}",
  ].join("\n"),
};

export const alertDialogDefinition = defineComponent({
  item: "alert-dialog",
  imports: ["AlertDialog"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Pertanyaan yang harus dijawab: tidak ada tombol tutup, dan menekan scrim tidak menutupnya. Fokus pertama jatuh pada Close pertama, jawaban yang aman, meski tombol lain lebih dulu di markup.",
        en: "A question that needs an answer: no close button, and a press on the scrim does not shut it. The first focus goes to the first Close, the safe answer, even when another button comes first in the markup.",
      },
      uses: ["AlertDialog", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "DiscardAlert",
            imports(setup),
            alert(
              `<AlertDialog.Trigger render={<Button variant="outline" />}>${t.open}</AlertDialog.Trigger>`,
              answers(t.title, t.body, t.keep, t.discard, "primary"),
            ),
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "destructive",
      title: { id: "Destruktif", en: "Destructive" },
      description: {
        id: "Jawaban yang tidak bisa dibatalkan memakai Button destructive; Batal tetap yang pertama dan yang difokuskan.",
        en: "An answer that cannot be undone wears the destructive Button; Cancel stays first and is the one that takes focus.",
      },
      uses: ["AlertDialog", "Button"],
      demo: (lang) => <Destructive lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "DeleteAlert",
            imports(setup),
            alert(
              `<AlertDialog.Trigger render={<Button variant="destructive" />}>${t.delete}</AlertDialog.Trigger>`,
              answers(t.deleteTitle, t.deleteBody, t.cancel, t.delete, "destructive"),
            ),
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "controlled",
      title: { id: "Terkendali", en: "Controlled" },
      description: {
        id: "open dan onOpenChange dari state; jawaban yang berisiko adalah Button biasa yang bekerja lalu menutup alert.",
        en: "open and onOpenChange from state; the risky answer is a plain Button that does its work and then shuts the alert.",
      },
      uses: ["AlertDialog", "Button"],
      demo: (lang) => <Controlled lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ControlledAlert",
            imports(setup),
            [
              "<AlertDialog.Root open={open} onOpenChange={setOpen}>",
              `  <AlertDialog.Trigger render={<Button variant="destructive" />}>${t.delete}</AlertDialog.Trigger>`,
              "  <AlertDialog.Portal>",
              "    <AlertDialog.Popup>",
              `      <AlertDialog.Title>${t.deleteTitle}</AlertDialog.Title>`,
              `      <AlertDialog.Description>${t.deleteBody}</AlertDialog.Description>`,
              '      <div className="actions">',
              `        <AlertDialog.Close render={<Button variant="outline" />}>${t.cancel}</AlertDialog.Close>`,
              '        <Button variant="destructive" onClick={() => { remove(); setOpen(false); }}>',
              `          ${t.delete}`,
              "        </Button>",
              "      </div>",
              "    </AlertDialog.Popup>",
              "  </AlertDialog.Portal>",
              "</AlertDialog.Root>",
            ],
            ["  const [open, setOpen] = useState(false);"],
          ),
          ACTIONS_CSS,
        ];
      },
    },
    {
      id: "scrolling",
      title: { id: "Gulir", en: "Scrolling" },
      description: {
        id: "Isi yang tidak muat menggulir di dalam panel; panel yang terlalu panjang memfokuskan dirinya sendiri, jadi terbuka di awal, bukan di tombol di akhir.",
        en: "Content that does not fit scrolls inside the panel; a panel too long to show whole takes focus itself, so it opens at its start, not at a button at its end.",
      },
      uses: ["AlertDialog", "Button"],
      demo: (lang) => <Scrolling lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "TermsAlert",
            imports(setup),
            alert(
              `<AlertDialog.Trigger render={<Button variant="outline" />}>${t.terms}</AlertDialog.Trigger>`,
              [
                `<AlertDialog.Title>${t.terms}</AlertDialog.Title>`,
                `<AlertDialog.Description>${t.termsBody}</AlertDialog.Description>`,
                "{paragraphs.map((text) => <p key={text}>{text}</p>)}",
                `<AlertDialog.Close render={<Button />}>${t.accept}</AlertDialog.Close>`,
              ],
            ),
            [
              "  const paragraphs = [",
              ...t.long.map((text) => `    ${JSON.stringify(text)},`),
              "  ];",
            ],
          ),
        ];
      },
    },
    {
      id: "nested",
      title: { id: "Bertumpuk", en: "Nested" },
      description: {
        id: "Pertanyaan kedua dibuka dari jawaban berisiko yang pertama: Root di dalam Popup, dan induknya mundur selama anak terbuka.",
        en: "A second question opens from the first one's risky answer: a Root inside a Popup, and the parent steps back while the child is open.",
      },
      uses: ["AlertDialog", "Button"],
      demo: (lang) => <Nested lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "NestedAlert",
            imports(setup),
            alert(
              `<AlertDialog.Trigger render={<Button variant="outline" />}>${t.open}</AlertDialog.Trigger>`,
              [
                `<AlertDialog.Title>${t.title}</AlertDialog.Title>`,
                `<AlertDialog.Description>${t.body}</AlertDialog.Description>`,
                '<div className="actions">',
                `  <AlertDialog.Close render={<Button variant="outline" />}>${t.keep}</AlertDialog.Close>`,
                "  <AlertDialog.Root>",
                `    <AlertDialog.Trigger render={<Button variant="destructive" />}>${t.delete}</AlertDialog.Trigger>`,
                "    <AlertDialog.Portal>",
                "      <AlertDialog.Popup>",
                ...answers(t.sureTitle, t.sureBody, t.back, t.delete, "destructive").map(
                  (l) => `        ${l}`,
                ),
                "      </AlertDialog.Popup>",
                "    </AlertDialog.Portal>",
                "  </AlertDialog.Root>",
                "</div>",
              ],
            ),
          ),
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
        id: "Tidak merender elemen: ia memegang state (open dan handle); selalu modal. Inspect menandai jendela yang memuat trigger dan alertnya.",
        en: "Renders no element: it holds the state (open and handle); it is always modal. Inspect outlines the window that holds the trigger and its alert.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="open"]',
      note: {
        id: "Tombol Anda, lewat render; AlertDialog.Trigger hanya menambah perilaku dan ARIA.",
        en: "Your button, through render; AlertDialog.Trigger adds only behavior and ARIA.",
      },
    },
    {
      name: "Backdrop",
      selector: ".ow-alert-dialog__backdrop",
      note: {
        id: "Scrim yang digambar Portal, di belakang panel; menekannya tidak menutup alert.",
        en: "The scrim the Portal draws behind the panel; a press on it does not shut the alert.",
      },
      tokens: { "--ow-backdrop": "--_bg" },
    },
    {
      name: "Popup",
      selector: ".ow-alert-dialog__popup",
      note: {
        id: "Material raised dengan bayangan popup; role=alertdialog, dinamai oleh Title. Tumbuh dari 0,96 di tengahnya sendiri.",
        en: "The raised material with the popup shadow; role=alertdialog, named by its Title. It grows from 0.96 at its own middle.",
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
      selector: ".ow-alert-dialog__title",
      note: {
        id: "h2 yang menamai alert untuk teknologi asistif.",
        en: "An h2 that names the alert for assistive technology.",
      },
    },
    {
      name: "Description",
      selector: ".ow-alert-dialog__description",
      note: {
        id: "Baris muted yang mendeskripsikan alert; dibacakan bersama judul.",
        en: "A muted line that describes the alert; it is read out with the title.",
      },
    },
    {
      name: "Close",
      selector: '.ow-alert-dialog__popup [data-demo="safe"]',
      note: {
        id: "Tombol Anda, lewat render. Close pertama adalah jawaban yang aman dan mendapat fokus pertama.",
        en: "Your button, through render. The first Close is the safe answer and takes the first focus.",
      },
    },
  ],
});

export default function AlertDialogPage(props: ExamplePageProps) {
  return <ComponentPage definition={alertDialogDefinition} {...props} />;
}
