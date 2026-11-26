"use client";

import { Button, Menu, type MenuSize } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    edit: "Edit",
    view: "Tampilan",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    selectAll: "Pilih semua",
    share: "Bagikan",
    email: "Email",
    link: "Salin link",
    wrap: "Bungkus baris",
    numbers: "Nomor baris",
    theme: "Tema",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
  },
  en: {
    edit: "Edit",
    view: "View",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    selectAll: "Select all",
    share: "Share",
    email: "Email",
    link: "Copy link",
    wrap: "Word wrap",
    numbers: "Line numbers",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly MenuSize[] = ["sm", "md", "lg"];
const THEMES = ["light", "dark", "system"] as const;

/** The trigger every menu opens from: your button, through render. */
const trigger = (label: string, size?: MenuSize) => (
  <Button variant="outline" size={size} endIcon={<Icon name="chevron-down" />}>
    {label}
  </Button>
);

/** Root, Trigger, Portal, Positioner, and Popup around the items. */
function Dropdown({
  label,
  size,
  demo,
  children,
}: {
  label: string;
  size?: MenuSize;
  demo: string;
  children: ReactNode;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger(label, size)} data-demo={demo} />
      <Menu.Portal>
        <Menu.Positioner align="start">
          <Menu.Popup {...(size ? { size } : {})}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** Actions with an icon first and a shortcut last, one of them disabled. */
function Actions({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Menu.Item data-demo="cut">
        <Icon name="scissors" />
        {t.cut}
        <kbd>⌘X</kbd>
      </Menu.Item>
      <Menu.Item data-demo="copy">
        <Icon name="copy" />
        {t.copy}
        <kbd>⌘C</kbd>
      </Menu.Item>
      <Menu.Item disabled data-demo="paste">
        <Icon name="clipboard" />
        {t.paste}
        <kbd>⌘V</kbd>
      </Menu.Item>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Dropdown label={t.edit} demo="edit">
      <Actions lang={lang} />
      <Menu.Separator />
      <Menu.Item data-demo="select-all">{t.selectAll}</Menu.Item>
    </Dropdown>
  );
}

function Submenu({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Dropdown label={t.edit} demo="edit">
      <Actions lang={lang} />
      <Menu.Separator />
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger data-demo="share">
          <Icon name="share-2" />
          {t.share}
        </Menu.SubmenuTrigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item data-demo="email">
                <Icon name="mail" />
                {t.email}
              </Menu.Item>
              <Menu.Item data-demo="link">
                <Icon name="link" />
                {t.link}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    </Dropdown>
  );
}

/** Two checkbox items, and a theme picked in a radio group under its label. */
function Choices({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [wrap, setWrap] = useState(true);
  const [numbers, setNumbers] = useState(false);
  const [theme, setTheme] = useState("system");
  return (
    <Dropdown label={t.view} demo="view">
      <Menu.CheckboxItem checked={wrap} onCheckedChange={setWrap} data-demo="wrap">
        <Menu.CheckboxItemIndicator />
        {t.wrap}
      </Menu.CheckboxItem>
      <Menu.CheckboxItem checked={numbers} onCheckedChange={setNumbers} data-demo="numbers">
        <Menu.CheckboxItemIndicator />
        {t.numbers}
      </Menu.CheckboxItem>
      <Menu.Separator />
      <Menu.Group>
        <Menu.GroupLabel>{t.theme}</Menu.GroupLabel>
        <Menu.RadioGroup value={theme} onValueChange={setTheme}>
          {THEMES.map((value) => (
            <Menu.RadioItem key={value} value={value} data-demo={value}>
              <Menu.RadioItemIndicator />
              {t[value]}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Group>
    </Dropdown>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-menu-row">
      {SIZES.map((size) => (
        <Dropdown key={size} label={t.edit} size={size} demo={`edit-${size}`}>
          <Actions lang={lang} />
        </Dropdown>
      ))}
    </div>
  );
}

/**
 * One part of every kind in one menu held open: it lands in its own box, `inert`, non-modal,
 * with no focus taken, so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-menu-specimen">
      <Menu.Root open modal={false}>
        <Menu.Trigger render={trigger(t.edit)} data-demo="edit" />
        <Menu.Portal container={box}>
          <Menu.Positioner align="start" positionMethod="absolute">
            <Menu.Popup inert {...({ initialFocus: false } as object)}>
              <Menu.Item data-demo="copy">
                <Icon name="copy" />
                {t.copy}
                <kbd>⌘C</kbd>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Group>
                <Menu.GroupLabel>{t.view}</Menu.GroupLabel>
                <Menu.CheckboxItem defaultChecked data-demo="wrap">
                  <Menu.CheckboxItemIndicator />
                  {t.wrap}
                </Menu.CheckboxItem>
              </Menu.Group>
              <Menu.Separator />
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger data-demo="share">
                  <Icon name="share-2" />
                  {t.share}
                </Menu.SubmenuTrigger>
              </Menu.SubmenuRoot>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

const imports = (setup: TokenSetup, icons: string[]) => [
  ...(isDefaultSetup(setup)
    ? ['import { Button, Menu } from "owsem-ui/base";']
    : [
        `import { Button } from "${importPath(setup, "button")}";`,
        `import { Menu } from "${importPath(setup, "menu")}";`,
      ]),
  `import { ${icons.join(", ")} } from "lucide-react";`,
];

/** The trigger, Portal, Positioner, and Popup around some lines. */
const dropdown = (label: string, items: string[], size?: MenuSize) => {
  const prop = size ? ` size="${size}"` : "";
  return [
    "<Menu.Root>",
    `  <Menu.Trigger render={<Button variant="outline"${prop} endIcon={<ChevronDown />} />}>`,
    `    ${label}`,
    "  </Menu.Trigger>",
    "  <Menu.Portal>",
    '    <Menu.Positioner align="start">',
    `      <Menu.Popup${prop}>`,
    ...items.map((l) => `        ${l}`),
    "      </Menu.Popup>",
    "    </Menu.Positioner>",
    "  </Menu.Portal>",
    "</Menu.Root>",
  ];
};

const item = (icon: string, label: string, shortcut: string, props = "") => [
  `<Menu.Item${props}>`,
  `  <${icon} />`,
  `  ${label}`,
  `  <kbd>${shortcut}</kbd>`,
  "</Menu.Item>",
];

const actions = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    ...item("Scissors", t.cut, "⌘X"),
    ...item("Copy", t.copy, "⌘C"),
    ...item("Clipboard", t.paste, "⌘V", " disabled"),
  ];
};

export const menuDefinition = defineComponent({
  item: "menu",
  imports: ["Menu"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Item dengan ikon di depan dan shortcut di ujung, satu nonaktif. Glide menyalakan item di bawah pointer atau fokus keyboard.",
        en: "Items with an icon first and a shortcut last, one disabled. Glide lights the item under the pointer or the keyboard's focus.",
      },
      uses: ["Menu", "Button"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "EditMenu",
          imports(setup, ["ChevronDown", "Clipboard", "Copy", "Scissors"]),
          dropdown(TEXT[lang].edit, [
            ...actions(lang),
            "<Menu.Separator />",
            `<Menu.Item>${TEXT[lang].selectAll}</Menu.Item>`,
          ]),
        ),
      ],
    },
    {
      id: "submenu",
      title: { id: "Submenu", en: "Submenu" },
      description: {
        id: "SubmenuRoot dengan SubmenuTrigger dan Portal, Positioner, serta Popup-nya sendiri. Terbuka saat pointer berhenti di atasnya, atau dengan Arrow Right.",
        en: "A SubmenuRoot with a SubmenuTrigger and its own Portal, Positioner, and Popup. It opens when the pointer rests on it, or with Arrow Right.",
      },
      uses: ["Menu", "Button"],
      demo: (lang) => <Submenu lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "EditMenu",
            imports(setup, [
              "ChevronDown",
              "Clipboard",
              "Copy",
              "Link",
              "Mail",
              "Scissors",
              "Share2",
            ]),
            dropdown(t.edit, [
              ...actions(lang),
              "<Menu.Separator />",
              "<Menu.SubmenuRoot>",
              "  <Menu.SubmenuTrigger>",
              "    <Share2 />",
              `    ${t.share}`,
              "  </Menu.SubmenuTrigger>",
              "  <Menu.Portal>",
              "    <Menu.Positioner>",
              "      <Menu.Popup>",
              "        <Menu.Item>",
              "          <Mail />",
              `          ${t.email}`,
              "        </Menu.Item>",
              "        <Menu.Item>",
              "          <Link />",
              `          ${t.link}`,
              "        </Menu.Item>",
              "      </Menu.Popup>",
              "    </Menu.Positioner>",
              "  </Menu.Portal>",
              "</Menu.SubmenuRoot>",
            ]),
          ),
        ];
      },
    },
    {
      id: "choices",
      title: { id: "Pilihan", en: "Choices" },
      description: {
        id: "CheckboxItem menyalakan dan mematikan; RadioItem di RadioGroup memilih satu. Keduanya menjaga menu tetap terbuka, dan Group dengan GroupLabel menamai kelompoknya.",
        en: "A CheckboxItem turns a setting on and off; a RadioItem in a RadioGroup picks one. Both keep the menu open, and a Group with a GroupLabel names the set.",
      },
      uses: ["Menu", "Button"],
      demo: (lang) => <Choices lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ViewMenu",
            [...imports(setup, ["ChevronDown"]), 'import { useState } from "react";'],
            dropdown(t.view, [
              "<Menu.CheckboxItem checked={wrap} onCheckedChange={setWrap}>",
              "  <Menu.CheckboxItemIndicator />",
              `  ${t.wrap}`,
              "</Menu.CheckboxItem>",
              "<Menu.CheckboxItem checked={numbers} onCheckedChange={setNumbers}>",
              "  <Menu.CheckboxItemIndicator />",
              `  ${t.numbers}`,
              "</Menu.CheckboxItem>",
              "<Menu.Separator />",
              "<Menu.Group>",
              `  <Menu.GroupLabel>${t.theme}</Menu.GroupLabel>`,
              "  <Menu.RadioGroup value={theme} onValueChange={setTheme}>",
              ...THEMES.flatMap((value) => [
                `    <Menu.RadioItem value="${value}">`,
                "      <Menu.RadioItemIndicator />",
                `      ${t[value]}`,
                "    </Menu.RadioItem>",
              ]),
              "  </Menu.RadioGroup>",
              "</Menu.Group>",
            ]),
            [
              "  const [wrap, setWrap] = useState(true);",
              "  const [numbers, setNumbers] = useState(false);",
              '  const [theme, setTheme] = useState("system");',
            ],
          ),
        ];
      },
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Popup mengatur font dan tinggi item: 13, 14, atau 16px, dengan aturan --py milik Button.",
        en: "size on the Popup sets the items' type scale and height: 13, 14, or 16px, on Button's --py rule.",
      },
      uses: ["Menu", "Button"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imports(setup, ["ChevronDown", "Clipboard", "Copy", "Scissors"]),
          SIZES.flatMap((size) => dropdown(TEXT[lang].edit, actions(lang), size)),
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
      selector: ".demo-menu-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state (open, modal). Inspect menandai kotak yang memuat trigger dan menunya.",
        en: "Renders no element: it holds the state (open, modal). Inspect outlines the box that holds the trigger and its menu.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="edit"]',
      note: {
        id: "Tombol pembuka, lewat render; Menu.Trigger menambah perilaku dan ARIA.",
        en: "The button that opens it, through render; Menu.Trigger adds behavior and ARIA.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-menu__popup",
      note: {
        id: "Material raised dengan bayangan popup, tanpa tepi. Radiusnya --ow-radius; item memakainya dikurangi padding 4px.",
        en: "The raised material with the popup shadow, with no edge. Its radius is --ow-radius; items take it less the 4px padding.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-hover": "--_highlight",
      },
    },
    {
      name: "Item",
      selector: '[data-demo="copy"]',
      note: {
        id: "Datar; Glide yang menyalakannya. Aturan --py milik Button, dengan ikon di depan dan shortcut (kbd) di ujung.",
        en: "Flat; Glide lights it. Button's --py rule, with an icon first and a shortcut (kbd) at the end.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "GroupLabel",
      selector: ".ow-menu__group-label",
      note: {
        id: "Nama grup sebagai judul: huruf kapital kecil, muted, dengan jarak huruf, seperti Select dan Sidebar; juga menamai grup untuk teknologi asistif.",
        en: "A group's name as a heading: small, muted capitals with tracking, like Select and Sidebar; it names the group for assistive technology too.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "CheckboxItem",
      selector: '[data-demo="wrap"]',
      note: {
        id: "Item menyala atau mati, dengan indikator (centang; titik untuk radio) di kolom ikon yang tetap menyimpan tempatnya saat mati.",
        en: "An on/off item, its indicator (a check; a dot for radios) in the icon column, which keeps its room while off.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-menu__separator",
      note: {
        id: "Garis tipis di antara grup.",
        en: "A hairline between groups.",
      },
      tokens: { "--ow-line": "--ow-line" },
    },
    {
      name: "SubmenuTrigger",
      selector: '[data-demo="share"]',
      note: {
        id: "Item yang membuka submenu, dengan chevron di ujungnya.",
        en: "An item that opens a submenu, with a chevron at its end.",
      },
    },
  ],
});

export default function MenuPage(props: ExamplePageProps) {
  return <ComponentPage definition={menuDefinition} {...props} />;
}
