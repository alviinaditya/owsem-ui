"use client";

import { Popover, Toggle, Toolbar } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    bar: "Dokumen",
    bold: "Tebal",
    italic: "Miring",
    share: "Bagikan",
    title: "Bagikan draf",
    body: "Siapa pun yang punya link bisa membacanya.",
    comments: "Izinkan komentar",
    caption: "Atau buka dari",
    settings: "pengaturan berbagi",
    arrow: "Dengan panah",
    plain: "Tanpa panah",
    light: "Terang",
    dark: "Gelap",
  },
  en: {
    bar: "Document",
    bold: "Bold",
    italic: "Italic",
    share: "Share",
    title: "Share the draft",
    body: "Anyone with the link can read it.",
    comments: "Allow comments",
    caption: "Or open it from",
    settings: "sharing settings",
    arrow: "With arrow",
    plain: "No arrow",
    light: "Light",
    dark: "Dark",
  },
} satisfies Record<Lang, Record<string, string>>;

type Side = "top" | "right" | "bottom" | "left";
type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { side: "bottom", arrow: "on", bg: "", fg: "" };
type Cfg = typeof initial;

/**
 * Popovers portal into the demo itself, so they take the stage's theme and scale, and Inspect
 * finds them: into an empty box out of the layout. A container from state: Base UI waits while
 * it is null.
 */
function usePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, box: <div ref={setContainer} className="demo-portal" /> };
}

/** Pinned open without taking focus from the page, so the narrative keeps the keyboard. */
const pinned = { open: true } as const;

function tokens(cfg: Cfg) {
  return {
    "--ow-panel": cfg.bg || undefined,
    "--ow-fg": cfg.fg || undefined,
  } as CSSProperties;
}

/** The panel's content: a title, a line, the link, and a toggle. */
function Content({ lang, arrow }: { lang: Lang; arrow: boolean }) {
  const t = TEXT[lang];
  return (
    <>
      {arrow ? <Popover.Arrow /> : null}
      <Popover.Title>{t.title}</Popover.Title>
      <Popover.Description>{t.body}</Popover.Description>
      <p className="demo-popover-link">
        <Icon name="link" />
        owsem.dev/d/42
      </p>
      <Toggle size="sm" startIcon={<Icon name="message-square" />} data-demo="comments">
        {t.comments}
      </Toggle>
    </>
  );
}

/** One popover, its panel placed by the controls. */
function Panel({
  cfg,
  lang,
  container,
  initialFocus,
}: {
  cfg: Cfg;
  lang: Lang;
  container: HTMLElement | null;
  initialFocus?: boolean;
}) {
  return (
    <Popover.Portal container={container}>
      <Popover.Positioner side={cfg.side as Side}>
        <Popover.Popup
          style={tokens(cfg)}
          {...(initialFocus === false ? { initialFocus: false } : {})}
          data-demo="panel"
        >
          <Content lang={lang} arrow={cfg.arrow === "on"} />
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

/** A document's toolbar whose Share button opens the popover; `open` pins it for Inspect. */
function Demo({ cfg, lang, open }: { cfg: Cfg; lang: Lang; open?: boolean }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const [format, setFormat] = useState<Record<string, boolean>>({ bold: true });
  const mark = (key: "bold" | "italic") => (
    <Toolbar.Button
      render={
        <Toggle
          pressed={format[key] ?? false}
          onPressedChange={(on) => setFormat((current) => ({ ...current, [key]: on }))}
        />
      }
      aria-label={t[key]}
      startIcon={<Icon name={key} />}
    />
  );
  return (
    <div className="demo-popover">
      <Toolbar.Root aria-label={t.bar}>
        {mark("bold")}
        {mark("italic")}
        <Toolbar.Separator />
        <Popover.Root {...(open ? pinned : {})}>
          <Toolbar.Button
            render={<Popover.Trigger />}
            startIcon={<Icon name="share-2" />}
            data-demo="share"
          >
            {t.share}
          </Toolbar.Button>
          <Panel
            cfg={cfg}
            lang={lang}
            container={portal.container}
            {...(open ? { initialFocus: false } : {})}
          />
        </Popover.Root>
      </Toolbar.Root>
      {portal.box}
    </div>
  );
}

/** Two triggers for one popover: the toolbar's Share and a link in the line under it. */
function Detached({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const [handle] = useState(() => Popover.createHandle());
  return (
    <div className="demo-popover">
      <Toolbar.Root aria-label={t.bar}>
        <Toolbar.Button
          render={<Popover.Trigger handle={handle} />}
          startIcon={<Icon name="share-2" />}
          data-demo="share"
        >
          {t.share}
        </Toolbar.Button>
      </Toolbar.Root>
      <p className="demo-caption">
        {t.caption}{" "}
        <Popover.Trigger handle={handle} className="demo-popover-link-button" data-demo="settings">
          {t.settings}
        </Popover.Trigger>
      </p>
      <Popover.Root handle={handle}>
        <Panel cfg={cfg} lang={lang} container={portal.container} />
      </Popover.Root>
      {portal.box}
    </div>
  );
}

/** A matrix cell: a trigger with its popover pinned open under it, in the cell's theme. */
function Cell({ theme, arrow, lang }: { theme: Theme; arrow: boolean; lang: Lang }) {
  const portal = usePortal();
  return (
    <div data-theme={theme} className="demo-cell demo-popover-cell">
      <Popover.Root {...pinned}>
        <Popover.Trigger
          render={<Toggle aria-label={TEXT[lang].share} startIcon={<Icon name="share-2" />} />}
        />
        <Popover.Portal container={portal.container}>
          <Popover.Positioner align="start">
            <Popover.Popup initialFocus={false}>
              {arrow ? <Popover.Arrow /> : null}
              <Popover.Title>{TEXT[lang].title}</Popover.Title>
              <Popover.Description>{TEXT[lang].body}</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {portal.box}
    </div>
  );
}

/** The panel in both themes, with and without its arrow. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={[true, false].map((arrow) => ({
        label: arrow ? t.arrow : t.plain,
        cells: THEMES.map((theme) => <Cell key={theme} theme={theme} arrow={arrow} lang={lang} />),
      }))}
    />
  );
}

// Opens Share: the panel grows from the button, its arrow on it. Turns comments on and off,
// then shuts it from the button.
const panel: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="share"]'));
  await stage.wait(800);
  const comments = stage.get('[data-demo="comments"]');
  await stage.click(comments);
  await stage.wait(700);
  await stage.click(comments);
  await stage.wait(600);
  await stage.click(stage.get('[data-demo="share"]'));
};

// One panel, two triggers: it opens under Share, moves under the link, then shuts.
const detached: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="share"]'));
  await stage.wait(1000);
  await stage.click(stage.get('[data-demo="settings"]'));
  await stage.wait(1000);
  await stage.click(stage.get('[data-demo="settings"]'));
};

const popoverLab = defineLab({
  initial,
  controls: [
    {
      key: "side",
      type: "choice",
      label: { id: "Sisi", en: "Side" },
      options: (
        [
          ["top", "Atas", "Top"],
          ["right", "Kanan", "Right"],
          ["bottom", "Bawah", "Bottom"],
          ["left", "Kiri", "Left"],
        ] as const
      ).map(([value, id, en]) => ({ value, label: { id, en } })),
    },
    {
      key: "arrow",
      type: "choice",
      label: { id: "Panah", en: "Arrow" },
      options: [
        { value: "on", label: { id: "Ada", en: "On" } },
        { value: "off", label: { id: "Tidak", en: "Off" } },
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
        id: "Tombol pembuka; di sini Toolbar.Button yang merender Popover.Trigger.",
        en: "The button that opens it; here a Toolbar.Button that renders Popover.Trigger.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-popover-popup",
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
      name: "Arrow",
      selector: ".ow-popover-arrow",
      note: {
        id: "Opsional: permukaan dan bayangan panel, di tepinya, tepat di atas trigger.",
        en: "Optional: the panel's surface and shadow, on its edge, over the trigger.",
      },
      tokens: { "--ow-panel": "--_bg", "--ow-popup-shadow": "--_shadow" },
    },
    {
      name: "Title",
      selector: ".ow-popover-title",
      note: {
        id: "h2 yang menamai dialog untuk teknologi asistif.",
        en: "An h2 that names the dialog for assistive technology.",
      },
    },
    {
      name: "Description",
      selector: ".ow-popover-description",
      note: {
        id: "Baris muted yang mendeskripsikan dialog.",
        en: "A muted line that describes the dialog.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Popover, Toggle, Toolbar } from "owsem-ui/base";']
      : [
          'import { Popover } from "@/components/owsem/popover";',
          'import { Toggle } from "@/components/owsem/toggle";',
          'import { Toolbar } from "@/components/owsem/toolbar";',
        ];
    const custom = cfg.bg || cfg.fg;
    const side = cfg.side === "bottom" ? "" : ` side="${cfg.side}"`;
    const usage = [
      ...imports,
      'import { Link, MessageSquare, Share2 } from "lucide-react";',
      "",
      "export function SharePopover() {",
      "  return (",
      "    <Popover.Root>",
      "      <Toolbar.Button render={<Popover.Trigger />} startIcon={<Share2 />}>",
      "        Share",
      "      </Toolbar.Button>",
      "      <Popover.Portal>",
      `        <Popover.Positioner${side}>`,
      `          <Popover.Popup${custom ? ' className="share"' : ""}>`,
      ...(cfg.arrow === "on" ? ["            <Popover.Arrow />"] : []),
      "            <Popover.Title>Share the draft</Popover.Title>",
      "            <Popover.Description>Anyone with the link can read it.</Popover.Description>",
      '            <p className="link">',
      "              <Link /> owsem.dev/d/42",
      "            </p>",
      '            <Toggle size="sm" startIcon={<MessageSquare />}>',
      "              Allow comments",
      "            </Toggle>",
      "          </Popover.Popup>",
      "        </Popover.Positioner>",
      "      </Popover.Portal>",
      "    </Popover.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "share-popover.tsx", code: usage.join("\n") }];
    if (custom) {
      files.push({
        name: "share.css",
        code: [
          "/* The popup itself: popovers render in a portal, outside the trigger's subtree. */",
          ".share {",
          ...(cfg.bg ? [`  --${setup.prefix}-panel: ${cfg.bg};`] : []),
          ...(cfg.fg ? [`  --${setup.prefix}-fg: ${cfg.fg};`] : []),
          "}",
        ].join("\n"),
      });
    }
    return files;
  },

  scenes: {
    panel: { play: panel },
    placement: { controls: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} open /> },
    detached: { demo: (cfg, lang) => <Detached cfg={cfg} lang={lang} />, play: detached },
    anatomy: { inspect: true, demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} open /> },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function PopoverLab(props: LabProps) {
  return <LabShell lab={popoverLab} {...props} />;
}
