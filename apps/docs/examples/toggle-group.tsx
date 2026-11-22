"use client";

import { ToggleGroup, type ToggleGroupSize } from "owsem-ui/base";
import { type CSSProperties, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const VIEWS = ["list", "board", "calendar"] as const;
const FORMATS = ["bold", "italic", "underline", "strikethrough"] as const;
type View = (typeof VIEWS)[number];
type Format = (typeof FORMATS)[number];

const ICONS: Record<View | Format, IconName> = {
  list: "list",
  board: "square-kanban",
  calendar: "calendar",
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
};

// Lucide's React names, for the code.
const LUCIDE: Record<View | Format, string> = {
  list: "List",
  board: "SquareKanban",
  calendar: "Calendar",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
};

const TEXT = {
  id: {
    view: "Tampilan",
    list: "Daftar",
    board: "Papan",
    calendar: "Kalender",
    formatting: "Format",
    bold: "Tebal",
    italic: "Miring",
    underline: "Garis bawah",
    strikethrough: "Coret",
    sample: "Rapat tim pindah ke Kamis pagi.",
    disabled: "Nonaktif",
  },
  en: {
    view: "View",
    list: "List",
    board: "Board",
    calendar: "Calendar",
    formatting: "Formatting",
    bold: "Bold",
    italic: "Italic",
    underline: "Underline",
    strikethrough: "Strikethrough",
    sample: "The team meeting moves to Thursday morning.",
    disabled: "Disabled",
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly ToggleGroupSize[] = ["sm", "md", "lg"];

/** One view at a time, and never none: pressing the current one changes nothing. */
function Views({
  lang,
  size,
  equal,
  disabled,
  content = "text",
}: {
  lang: Lang;
  size?: ToggleGroupSize;
  equal?: boolean;
  disabled?: boolean;
  content?: "text" | "icon";
}) {
  const t = TEXT[lang];
  const [view, setView] = useState<View>("list");
  return (
    <div className="demo-toggle-stack">
      <ToggleGroup.Root
        aria-label={t.view}
        size={size}
        equal={equal}
        disabled={disabled}
        value={[view]}
        onValueChange={([next]) => next && setView(next)}
      >
        {VIEWS.map((value) =>
          content === "icon" ? (
            <ToggleGroup.Item key={value} value={value} aria-label={t[value]}>
              <Icon name={ICONS[value]} />
            </ToggleGroup.Item>
          ) : (
            <ToggleGroup.Item key={value} value={value}>
              {t[value]}
            </ToggleGroup.Item>
          ),
        )}
      </ToggleGroup.Root>
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-toggle-stack">
      {SIZES.map((size) => (
        <Views key={size} lang={lang} size={size} />
      ))}
    </div>
  );
}

function Formats({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [formats, setFormats] = useState<Format[]>(["bold"]);
  const on = (format: Format) => formats.includes(format);
  const lines = [on("underline") && "underline", on("strikethrough") && "line-through"];
  const style: CSSProperties = {
    fontWeight: on("bold") ? 600 : 400,
    fontStyle: on("italic") ? "italic" : "normal",
    textDecorationLine: lines.filter(Boolean).join(" ") || "none",
  };
  return (
    <div className="demo-toggle-stack">
      <ToggleGroup.Root
        aria-label={t.formatting}
        multiple
        value={formats}
        onValueChange={setFormats}
      >
        {FORMATS.map((value) => (
          <ToggleGroup.Item key={value} value={value} aria-label={t[value]}>
            <Icon name={ICONS[value]} />
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <p style={style}>{t.sample}</p>
    </div>
  );
}

const viewItems = (lang: Lang, content: "text" | "icon" = "text") =>
  VIEWS.flatMap((value) =>
    content === "icon"
      ? [
          `<ToggleGroup.Item value="${value}" aria-label="${TEXT[lang][value]}">`,
          `  <${LUCIDE[value]} />`,
          "</ToggleGroup.Item>",
        ]
      : [`<ToggleGroup.Item value="${value}">${TEXT[lang][value]}</ToggleGroup.Item>`],
  );

/** A Views component's JSX: the group with its props, around the items. */
const viewGroup = (lang: Lang, props: string[], content: "text" | "icon" = "text") => [
  "<ToggleGroup.Root",
  `  aria-label="${TEXT[lang].view}"`,
  ...props.map((prop) => `  ${prop}`),
  "  value={[view]}",
  "  onValueChange={([next]) => next && setView(next)}",
  ">",
  ...viewItems(lang, content).map((line) => `  ${line}`),
  "</ToggleGroup.Root>",
];

const viewImports = (setup: Parameters<typeof importPath>[0], icons = false) => [
  ...(icons
    ? [
        `import { ${VIEWS.map((v) => LUCIDE[v])
          .sort()
          .join(", ")} } from "lucide-react";`,
      ]
    : []),
  'import { useState } from "react";',
  `import { ToggleGroup } from "${importPath(setup, "toggle-group")}";`,
];

const viewState = ['  const [view, setView] = useState("list");'];

export const toggleGroupDefinition = defineComponent({
  item: "toggle-group",
  imports: ["ToggleGroup"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Kontrol tersegmentasi: satu pilihan, dan thumb meluncur ke item yang ditekan.",
        en: "A segmented control: one choice, and the thumb slides to the pressed item.",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Views lang={lang} />,
      code: (setup, lang) => [
        exampleFile("ViewSwitcher", viewImports(setup), viewGroup(lang, []), viewState),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg: grup setinggi Button seukuran itu (32, 40, 48px).",
        en: "sm, md, and lg: the group is as tall as a Button of that size (32, 40, 48px).",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          viewImports(setup),
          SIZES.flatMap((size) => viewGroup(lang, [`size="${size}"`])),
          viewState,
        ),
      ],
    },
    {
      id: "icons",
      title: { id: "Ikon", en: "Icons" },
      description: {
        id: "Item hanya berisi ikon menjadi persegi dan butuh aria-label.",
        en: "An item with only an icon is square, and needs an aria-label.",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Views lang={lang} content="icon" />,
      code: (setup, lang) => [
        exampleFile("ViewIcons", viewImports(setup, true), viewGroup(lang, [], "icon"), viewState),
      ],
    },
    {
      id: "multiple",
      title: { id: "Banyak pilihan", en: "Multiple" },
      description: {
        id: "Dengan multiple, tiap item menyala sendiri; tanpa thumb.",
        en: "With multiple, each item toggles on its own; there is no thumb.",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Formats lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "TextFormat",
            [
              `import { ${FORMATS.map((f) => LUCIDE[f])
                .sort()
                .join(", ")} } from "lucide-react";`,
              'import { useState } from "react";',
              `import { ToggleGroup } from "${importPath(setup, "toggle-group")}";`,
            ],
            [
              "<ToggleGroup.Root",
              `  aria-label="${t.formatting}"`,
              "  multiple",
              "  value={formats}",
              "  onValueChange={setFormats}",
              ">",
              ...FORMATS.flatMap((f) => [
                `  <ToggleGroup.Item value="${f}" aria-label="${t[f]}">`,
                `    <${LUCIDE[f]} />`,
                "  </ToggleGroup.Item>",
              ]),
              "</ToggleGroup.Root>",
              `<p style={{ fontWeight: formats.includes("bold") ? 600 : 400 }}>${t.sample}</p>`,
            ],
            ['  const [formats, setFormats] = useState(["bold"]);'],
          ),
        ];
      },
    },
    {
      id: "equal",
      title: { id: "Lebar sama", en: "Equal" },
      description: {
        id: "equal membuat tiap item selebar yang terlebar.",
        en: "equal gives every item the width of the widest.",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Views lang={lang} equal />,
      code: (setup, lang) => [
        exampleFile("EqualViews", viewImports(setup), viewGroup(lang, ["equal"]), viewState),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled meredupkan seluruh grup; panah dan Glide melewatinya.",
        en: "disabled dims the whole group; the arrow keys and Glide skip it.",
      },
      uses: ["ToggleGroup"],
      demo: (lang) => <Views lang={lang} disabled />,
      code: (setup, lang) => [
        exampleFile("LockedViews", viewImports(setup), viewGroup(lang, ["disabled"]), viewState),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <ToggleGroup.Root aria-label={TEXT[lang].view} defaultValue={["board"]}>
        {VIEWS.map((value) => (
          <ToggleGroup.Item key={value} value={value}>
            {TEXT[lang][value]}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-toggle-group",
      note: {
        id: "Track datar tanpa tepi, tint 6% dari warna teks, dengan role group. Memuat item, thumb, dan highlight hover (Glide).",
        en: "The flat track with no edge, a 6% tint of the text color, with the group role. Holds the items, the thumb, and Glide's hover highlight.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Item",
      selector: ".ow-toggle-group__item:not([data-pressed])",
      note: {
        id: "Toggle dari Base UI: button dengan aria-pressed. Ukurannya mengikuti aturan --py.",
        en: "Base UI's Toggle: a button with aria-pressed. Sized by the --py rule.",
      },
    },
    {
      name: "Thumb",
      selector: ".ow-toggle-group__thumb",
      note: {
        id: "Tint aksen di atas warna raised, tanpa tepi dan bayangan, di bawah item yang ditekan; labelnya berubah menjadi aksen. Dekoratif; hanya di pilihan tunggal.",
        en: "A tint of the accent over the raised color, with no edge or shadow, under the pressed item, whose label turns accent. Decorative; single selection only.",
      },
      tokens: {
        "--ow-accent": "--_thumb",
        "--ow-raised-bg": "--_thumb",
      },
    },
  ],
});

export default function ToggleGroupPage(props: ExamplePageProps) {
  return <ComponentPage definition={toggleGroupDefinition} {...props} />;
}
