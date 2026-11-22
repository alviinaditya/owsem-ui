"use client";

import { Button, Popover, Toggle } from "owsem-ui/base";
import { useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    share: "Bagikan",
    title: "Bagikan draf",
    body: "Siapa pun yang punya link bisa membacanya.",
    comments: "Izinkan komentar",
    caption: "Atau buka dari",
    settings: "pengaturan berbagi",
    removeTitle: "Hapus link ini?",
    removeBody: "Orang yang sudah memilikinya tidak bisa membaca draf lagi.",
    keep: "Simpan",
    remove: "Hapus",
    done: "Selesai",
  },
  en: {
    share: "Share",
    title: "Share the draft",
    body: "Anyone with the link can read it.",
    comments: "Allow comments",
    caption: "Or open it from",
    settings: "sharing settings",
    removeTitle: "Remove this link?",
    removeBody: "People who already have it can no longer read the draft.",
    keep: "Keep it",
    remove: "Remove",
    done: "Done",
  },
} satisfies Record<Lang, Record<string, string>>;

/** The Share button every example opens its panel from. */
const shareButton = (lang: Lang) => (
  <Button variant="outline" startIcon={<Icon name="share-2" />}>
    {TEXT[lang].share}
  </Button>
);

/** The panel's content: an arrow, a title, a line, and a toggle. */
function Content({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Popover.Arrow />
      <Popover.Title>{t.title}</Popover.Title>
      <Popover.Description>{t.body}</Popover.Description>
      <div className="demo-popover-actions">
        <Toggle size="sm" startIcon={<Icon name="message-square" />} data-demo="comments">
          {t.comments}
        </Toggle>
      </div>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Popover.Root>
      <Popover.Trigger render={shareButton(lang)} data-demo="share" />
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup className="demo-popover-popup" data-demo="panel">
            <Content lang={lang} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Placement({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Popover.Root>
      <Popover.Trigger render={shareButton(lang)} data-demo="share" />
      <Popover.Portal>
        <Popover.Positioner side="right" align="start">
          <Popover.Popup className="demo-popover-popup" data-demo="panel">
            <Popover.Arrow />
            <Popover.Title>{t.title}</Popover.Title>
            <Popover.Description>{t.body}</Popover.Description>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Close({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Popover.Root>
      <Popover.Trigger render={<Button variant="outline">{t.remove}</Button>} data-demo="share" />
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Popup className="demo-popover-popup" data-demo="panel">
            <Popover.Arrow />
            <Popover.Title>{t.removeTitle}</Popover.Title>
            <Popover.Description>{t.removeBody}</Popover.Description>
            <div className="demo-popover-actions">
              <Popover.Close render={<Button size="sm" variant="outline" />}>
                {t.keep}
              </Popover.Close>
              <Popover.Close render={<Button size="sm" variant="destructive" />}>
                {t.remove}
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Two triggers for one panel: the Share button and a link in the line under it. */
function Detached({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [handle] = useState(() => Popover.createHandle());
  return (
    <div className="demo-popover-detached">
      <Popover.Trigger handle={handle} render={shareButton(lang)} data-demo="share" />
      <p className="demo-popover-line">
        {t.caption}{" "}
        <Popover.Trigger handle={handle} className="demo-popover-link-button" data-demo="settings">
          {t.settings}
        </Popover.Trigger>
      </p>
      <Popover.Root handle={handle}>
        <Popover.Portal>
          <Popover.Positioner side="top">
            <Popover.Popup className="demo-popover-popup" data-demo="panel">
              <Content lang={lang} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/**
 * Every part, the panel held open: it lands in its own box, `inert`, with no focus taken, so
 * Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-popover-specimen">
      <Popover.Root open>
        <Popover.Trigger render={shareButton(lang)} data-demo="share" />
        <Popover.Portal container={box}>
          <Popover.Positioner positionMethod="absolute">
            <Popover.Popup
              inert
              {...({ initialFocus: false } as object)}
              className="demo-popover-popup"
            >
              <Popover.Arrow />
              <Popover.Title>{t.title}</Popover.Title>
              <Popover.Description>{t.body}</Popover.Description>
              <div className="demo-popover-actions">
                <Popover.Close render={<Button size="sm" />}>{t.done}</Popover.Close>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

const imports = (setup: TokenSetup, toggle = false) => [
  ...(isDefaultSetup(setup)
    ? [`import { Button, Popover${toggle ? ", Toggle" : ""} } from "owsem-ui/base";`]
    : [
        `import { Button } from "${importPath(setup, "button")}";`,
        `import { Popover } from "${importPath(setup, "popover")}";`,
        ...(toggle ? [`import { Toggle } from "${importPath(setup, "toggle")}";`] : []),
      ]),
  `import { ${toggle ? "MessageSquare, " : ""}Share2 } from "lucide-react";`,
];

const shareCss = (actions = false) => ({
  name: "share.css",
  code: [
    ".share {",
    "  inline-size: 16rem;",
    "}",
    ...(actions
      ? [
          "",
          ".actions {",
          "  display: flex;",
          "  justify-content: flex-end;",
          "  gap: 8px;",
          "  margin-block-start: 12px;",
          "}",
        ]
      : []),
  ].join("\n"),
});

const trigger = (lang: Lang, handle = false) =>
  `<Popover.Trigger${handle ? " handle={handle}" : ""} render={<Button variant="outline" startIcon={<Share2 />} />}>${TEXT[lang].share}</Popover.Trigger>`;

const toggle = (lang: Lang) => [
  '<div className="actions">',
  `  <Toggle size="sm" startIcon={<MessageSquare />}>${TEXT[lang].comments}</Toggle>`,
  "</div>",
];

/** Portal, Positioner, and Popup around some lines. */
const panel = (lines: string[], positioner = "") => [
  "<Popover.Portal>",
  `  <Popover.Positioner${positioner}>`,
  '    <Popover.Popup className="share">',
  ...lines.map((l) => `      ${l}`),
  "    </Popover.Popup>",
  "  </Popover.Positioner>",
  "</Popover.Portal>",
];

const titles = (lang: Lang) => [
  "<Popover.Arrow />",
  `<Popover.Title>${TEXT[lang].title}</Popover.Title>`,
  `<Popover.Description>${TEXT[lang].body}</Popover.Description>`,
];

export const popoverDefinition = defineComponent({
  item: "popover",
  imports: ["Popover"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Panel tumbuh dari tombolnya dengan panah ke arahnya. Fokus masuk ke panel dan kembali ke tombol saat panel menutup.",
        en: "The panel grows out of its button, its arrow toward it. Focus moves into the panel and comes back to the button when it shuts.",
      },
      uses: ["Popover", "Button", "Toggle"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("SharePopover", imports(setup, true), [
          "<Popover.Root>",
          `  ${trigger(lang)}`,
          ...panel([...titles(lang), ...toggle(lang)]).map((l) => `  ${l}`),
          "</Popover.Root>",
        ]),
        shareCss(true),
      ],
    },
    {
      id: "placement",
      title: { id: "Penempatan", en: "Placement" },
      description: {
        id: "side dan align di Positioner memilih sisi dan ujungnya; panel berbalik ke sisi lain saat tak muat.",
        en: "side and align on the Positioner pick the edge and the end; the panel flips to the other side when it does not fit.",
      },
      uses: ["Popover", "Button"],
      demo: (lang) => <Placement lang={lang} />,
      code: (setup, lang) => [
        exampleFile("SharePopover", imports(setup), [
          "<Popover.Root>",
          `  ${trigger(lang)}`,
          ...panel(titles(lang), ' side="right" align="start"').map((l) => `  ${l}`),
          "</Popover.Root>",
        ]),
        shareCss(),
      ],
    },
    {
      id: "close",
      title: { id: "Tutup", en: "Close" },
      description: {
        id: "Popover.Close memakai tombol Anda untuk menutup panel; di sini untuk pilihan singkat.",
        en: "Popover.Close wears your button to shut the panel, here for a short choice.",
      },
      uses: ["Popover", "Button"],
      demo: (lang) => <Close lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile("RemovePopover", imports(setup), [
            "<Popover.Root>",
            `  <Popover.Trigger render={<Button variant="outline" />}>${t.remove}</Popover.Trigger>`,
            ...panel([
              "<Popover.Arrow />",
              `<Popover.Title>${t.removeTitle}</Popover.Title>`,
              `<Popover.Description>${t.removeBody}</Popover.Description>`,
              '<div className="actions">',
              `  <Popover.Close render={<Button size="sm" variant="outline" />}>${t.keep}</Popover.Close>`,
              `  <Popover.Close render={<Button size="sm" variant="destructive" />}>`,
              `    ${t.remove}`,
              "  </Popover.Close>",
              "</div>",
            ]).map((l) => `  ${l}`),
            "</Popover.Root>",
          ]),
          shareCss(true),
        ];
      },
    },
    {
      id: "detached",
      title: { id: "Terpisah", en: "Detached" },
      description: {
        id: "Satu panel, banyak trigger: handle dari createHandle() menautkan trigger di mana saja, dan panel pindah ke trigger yang terakhir ditekan. Di sini panel terbuka di atas, agar kedua trigger tetap terjangkau.",
        en: "One panel, many triggers: a handle from createHandle() links triggers placed anywhere, and the panel moves to the one pressed last. Here it opens above, so both triggers stay within reach.",
      },
      uses: ["Popover", "Button", "Toggle"],
      demo: (lang) => <Detached lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "DetachedPopover",
            [...imports(setup, true), 'import { useState } from "react";'],
            [
              trigger(lang, true),
              `<p>${t.caption} <Popover.Trigger handle={handle}>${t.settings}</Popover.Trigger></p>`,
              "<Popover.Root handle={handle}>",
              ...panel([...titles(lang), ...toggle(lang)], ' side="top"').map((l) => `  ${l}`),
              "</Popover.Root>",
            ],
            ["  const [handle] = useState(() => Popover.createHandle());"],
          ),
          shareCss(true),
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
      selector: ".demo-popover-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state (open, modal, handle). Inspect menandai kotak yang memuat trigger dan panelnya.",
        en: "Renders no element: it holds the state (open, modal, handle). Inspect outlines the box that holds the trigger and its panel.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="share"]',
      note: {
        id: "Tombol pembuka, lewat render; Popover.Trigger menambah perilaku dan ARIA.",
        en: "The button that opens it, through render; Popover.Trigger adds behavior and ARIA.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-popover__popup",
      note: {
        id: "Material raised dengan bayangan popup; role=dialog, dinamai oleh Title. Tumbuh dari titik panah dalam 180 ms.",
        en: "The raised material with the popup shadow; role=dialog, named by its Title. It grows from the arrow's tip in 180 ms.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Arrow",
      selector: ".ow-popover__arrow",
      note: {
        id: "Opsional: permukaan dan bayangan panel, di tepinya, tepat di atas trigger.",
        en: "Optional: the panel's surface and shadow, on its edge, over the trigger.",
      },
      tokens: { "--ow-raised-bg": "--_bg", "--ow-popup-shadow": "--_shadow" },
    },
    {
      name: "Title",
      selector: ".ow-popover__title",
      note: {
        id: "h2 yang menamai dialog untuk teknologi asistif.",
        en: "An h2 that names the dialog for assistive technology.",
      },
    },
    {
      name: "Description",
      selector: ".ow-popover__description",
      note: {
        id: "Baris muted yang mendeskripsikan dialog.",
        en: "A muted line that describes the dialog.",
      },
    },
    {
      name: "Close",
      selector: ".ow-popover__popup .ow-button",
      note: {
        id: "Tombol Anda, lewat render; menutup panel dan mengembalikan fokus ke trigger.",
        en: "Your button, through render; it shuts the panel and returns focus to the trigger.",
      },
    },
  ],
});

export default function PopoverPage(props: ExamplePageProps) {
  return <ComponentPage definition={popoverDefinition} {...props} />;
}
