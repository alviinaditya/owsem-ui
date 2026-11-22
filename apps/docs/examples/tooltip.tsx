"use client";

import { IconButton, Toolbar, Tooltip } from "owsem-ui/base";
import { type ReactElement, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    toolbar: "Format",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    undo: "Urungkan",
    pin: "Sematkan",
  },
  en: {
    toolbar: "Formatting",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    undo: "Undo",
    pin: "Pin",
  },
} satisfies Record<Lang, Record<string, string>>;

type ToolKey = "bold" | "italic" | "underline" | "undo";

const TOOLS: readonly { key: ToolKey; icon: IconName; lucide: string; shortcut: string }[] = [
  { key: "bold", icon: "bold", lucide: "Bold", shortcut: "⌘B" },
  { key: "italic", icon: "italic", lucide: "Italic", shortcut: "⌘I" },
  { key: "underline", icon: "underline", lucide: "Underline", shortcut: "⌘U" },
  { key: "undo", icon: "undo-2", lucide: "Undo2", shortcut: "⌘Z" },
];

/** A tooltip around any trigger: the label, and its shortcut when it has one. */
function Tip({
  trigger,
  label,
  shortcut,
  side,
}: {
  trigger: ReactElement<Record<string, unknown>>;
  label: string;
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={trigger} />
      <Tooltip.Portal>
        <Tooltip.Positioner {...(side ? { side } : {})}>
          <Tooltip.Popup>
            <Tooltip.Arrow />
            {label}
            {shortcut ? <kbd>{shortcut}</kbd> : null}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** The toolbar: each button has its tooltip. */
function Bar({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Toolbar.Root aria-label={t.toolbar}>
      {TOOLS.map((tool) => (
        <Tip
          key={tool.key}
          label={t[tool.key]}
          shortcut={tool.shortcut}
          trigger={
            <Toolbar.Button
              aria-label={t[tool.key]}
              startIcon={<Icon name={tool.icon} />}
              data-demo={tool.key}
            />
          }
        />
      ))}
    </Toolbar.Root>
  );
}

/** One Provider shares the delay: after the first opens, its neighbours open at once. */
function Default({ lang }: { lang: Lang }) {
  return (
    <Tooltip.Provider>
      <Bar lang={lang} />
    </Tooltip.Provider>
  );
}

/** No Provider: each trigger waits out the delay on its own. */
function Each({ lang }: { lang: Lang }) {
  return <Bar lang={lang} />;
}

function Single({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Tip
      label={t.pin}
      trigger={<IconButton aria-label={t.pin} icon={<Icon name="pin" />} data-demo="pin" />}
    />
  );
}

function Side({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Tip
      label={t.undo}
      shortcut="⌘Z"
      side="right"
      trigger={<IconButton aria-label={t.undo} icon={<Icon name="undo-2" />} data-demo="undo" />}
    />
  );
}

/**
 * One tooltip held open in its own box, `inert`, so Inspect can magnify it: the trigger, the
 * popup, its arrow, and the shortcut.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-tooltip-specimen">
      <Tooltip.Root open>
        <Tooltip.Trigger
          render={<IconButton aria-label={t.bold} icon={<Icon name="bold" />} data-demo="bold" />}
        />
        <Tooltip.Portal container={box}>
          <Tooltip.Positioner positionMethod="absolute">
            <Tooltip.Popup inert>
              <Tooltip.Arrow />
              {t.bold}
              <kbd>⌘B</kbd>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
}

const imports = (
  setup: TokenSetup,
  parts: { toolbar?: boolean; iconButton?: boolean },
  icons: string[],
) => [
  ...(isDefaultSetup(setup)
    ? [
        `import { ${[parts.iconButton ? "IconButton" : "", parts.toolbar ? "Toolbar" : "", "Tooltip"].filter(Boolean).join(", ")} } from "owsem-ui/base";`,
      ]
    : [
        ...(parts.iconButton
          ? [`import { IconButton } from "${importPath(setup, "button")}";`]
          : []),
        ...(parts.toolbar ? [`import { Toolbar } from "${importPath(setup, "toolbar")}";`] : []),
        `import { Tooltip } from "${importPath(setup, "tooltip")}";`,
      ]),
  `import { ${icons.join(", ")} } from "lucide-react";`,
];

/** A tooltip's Root, Trigger, and Portal around the label lines. */
const tip = (trigger: string, label: string, shortcut?: string, side?: string) => [
  "<Tooltip.Root>",
  `  <Tooltip.Trigger render={${trigger}} />`,
  "  <Tooltip.Portal>",
  `    <Tooltip.Positioner${side ? ` side="${side}"` : ""}>`,
  "      <Tooltip.Popup>",
  "        <Tooltip.Arrow />",
  `        ${label}`,
  ...(shortcut ? [`        <kbd>${shortcut}</kbd>`] : []),
  "      </Tooltip.Popup>",
  "    </Tooltip.Positioner>",
  "  </Tooltip.Portal>",
  "</Tooltip.Root>",
];

/** The shared component of the toolbar examples: `Tool` and the bar that holds four of them. */
const barCode = (lang: Lang, provider: boolean) => {
  const t = TEXT[lang];
  const bar = [
    `<Toolbar.Root aria-label="${t.toolbar}">`,
    ...TOOLS.map(
      (tool) =>
        `  <Tool label="${t[tool.key]}" shortcut="${tool.shortcut}" icon={<${tool.lucide} />} />`,
    ),
    "</Toolbar.Root>",
  ];
  return provider
    ? ["<Tooltip.Provider>", ...bar.map((l) => `  ${l}`), "</Tooltip.Provider>"]
    : bar;
};

/** `Tool`, the component the bar repeats: a button with its tooltip. */
const toolCode = (): string[] => [
  "interface ToolProps {",
  "  label: string;",
  "  shortcut: string;",
  "  icon: ReactElement;",
  "}",
  "",
  "function Tool({ label, shortcut, icon }: ToolProps) {",
  "  return (",
  "    <Tooltip.Root>",
  "      <Tooltip.Trigger",
  "        render={<Toolbar.Button aria-label={label} startIcon={icon} />}",
  "      />",
  "      <Tooltip.Portal>",
  "        <Tooltip.Positioner>",
  "          <Tooltip.Popup>",
  "            <Tooltip.Arrow />",
  "            {label}",
  "            <kbd>{shortcut}</kbd>",
  "          </Tooltip.Popup>",
  "        </Tooltip.Positioner>",
  "      </Tooltip.Portal>",
  "    </Tooltip.Root>",
  "  );",
  "}",
];

const barFile = (setup: TokenSetup, lang: Lang, name: string, provider: boolean) => {
  const file = exampleFile(
    name,
    [
      ...imports(
        setup,
        { toolbar: true },
        TOOLS.map((tool) => tool.lucide),
      ),
      'import type { ReactElement } from "react";',
    ],
    barCode(lang, provider),
  );
  // `Tool` sits above the component that uses it.
  return {
    ...file,
    code: file.code.replace(
      `export function ${name}`,
      `${toolCode().join("\n")}\n\nexport function ${name}`,
    ),
  };
};

export const tooltipDefinition = defineComponent({
  item: "tooltip",
  imports: ["Tooltip"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Tooltip.Provider memberi satu delay untuk semua trigger di dalamnya: yang pertama menunggu 600 ms, tetangganya terbuka seketika tanpa animasi.",
        en: "A Tooltip.Provider gives every trigger inside it one delay: the first waits 600 ms, its neighbours open at once with no animation.",
      },
      uses: ["Tooltip", "Toolbar"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [barFile(setup, lang, "FormattingBar", true)],
    },
    {
      id: "each",
      title: { id: "Per tombol", en: "Each" },
      description: {
        id: "Tanpa Provider, tiap trigger menunggu delay-nya sendiri, jadi menyusuri toolbar membuka satu tooltip tiap kali.",
        en: "Without a Provider, each trigger waits out the delay on its own, so moving along the toolbar opens one tooltip at a time.",
      },
      uses: ["Tooltip", "Toolbar"],
      demo: (lang) => <Each lang={lang} />,
      code: (setup, lang) => [barFile(setup, lang, "FormattingBar", false)],
    },
    {
      id: "single",
      title: { id: "Satu", en: "Single" },
      description: {
        id: "Satu tombol ikon dengan label saja. Nama aksesibelnya tetap milik tombol; tooltip hanya visual.",
        en: "One icon button with a label alone. Its accessible name stays the button's own; the tooltip is visual only.",
      },
      uses: ["Tooltip", "IconButton"],
      demo: (lang) => <Single lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "PinButton",
          imports(setup, { iconButton: true }, ["Pin"]),
          tip(`<IconButton aria-label="${TEXT[lang].pin}" icon={<Pin />} />`, TEXT[lang].pin),
        ),
      ],
    },
    {
      id: "side",
      title: { id: "Sisi", en: "Side" },
      description: {
        id: "side di Positioner memilih sisi, dan panah mengikutinya. Tooltip berbalik ke sisi lain saat tak muat.",
        en: "side on the Positioner picks the edge, and the arrow follows. The tooltip flips to the other side when it does not fit.",
      },
      uses: ["Tooltip", "IconButton"],
      demo: (lang) => <Side lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "UndoButton",
          imports(setup, { iconButton: true }, ["Undo2"]),
          tip(
            `<IconButton aria-label="${TEXT[lang].undo}" icon={<Undo2 />} />`,
            TEXT[lang].undo,
            "⌘Z",
            "right",
          ),
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-tooltip-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state (open, disabled). Inspect menandai kotak yang memuat trigger dan tooltipnya. Provider juga tanpa elemen.",
        en: "Renders no element: it holds the state (open, disabled). Inspect outlines the box that holds the trigger and its tooltip. The Provider has none either.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="bold"]',
      note: {
        id: "Tombol yang diberi label. Nama aksesibelnya tetap miliknya; tooltip hanya visual.",
        en: "The button it labels. Its accessible name stays its own; the tooltip is visual only.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-tooltip__popup",
      note: {
        id: "Permukaan gelap solid tanpa material, setinggi 24px untuk satu baris.",
        en: "A solid dark surface with no material, 24px tall for one line.",
      },
      tokens: { "--ow-tooltip-bg": "--_bg", "--ow-tooltip-fg": "--_fg" },
    },
    {
      name: "Arrow",
      selector: ".ow-tooltip__arrow",
      note: {
        id: "Segitiga ke arah trigger, dijaga Base UI tetap di tengah trigger.",
        en: "A triangle toward the trigger, kept on the trigger's center by Base UI.",
      },
    },
    {
      name: "Shortcut",
      selector: ".ow-tooltip__popup kbd",
      note: {
        id: "kbd di dalam popup: shortcut setelah label, sedikit lebih redup.",
        en: "A kbd inside the popup: the shortcut after the label, a little dimmer.",
      },
    },
  ],
});

export default function TooltipPage(props: ExamplePageProps) {
  return <ComponentPage definition={tooltipDefinition} {...props} />;
}
