"use client";

import { Button, ContextMenu, Menu, type MenuSize } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    area: "Klik kanan di sini",
    areaTouch: "Tekan lama di sini",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    selectAll: "Pilih semua",
    share: "Bagikan",
    email: "Email",
    link: "Salin link",
    view: "Tampilan",
    wrap: "Bungkus baris",
    numbers: "Nomor baris",
    theme: "Tema",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    photo: "Stasiun Hofplein",
    photoInfo: "JPG, 2,4 MB",
    actions: "Aksi foto",
    preview: "Pratinjau",
    download: "Unduh",
    rename: "Ganti nama",
    delete: "Hapus",
  },
  en: {
    area: "Right click here",
    areaTouch: "Long press here",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    selectAll: "Select all",
    share: "Share",
    email: "Email",
    link: "Copy link",
    view: "View",
    wrap: "Word wrap",
    numbers: "Line numbers",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    photo: "Station Hofplein",
    photoInfo: "JPG, 2.4 MB",
    actions: "Photo actions",
    preview: "Preview",
    download: "Download",
    rename: "Rename",
    delete: "Delete",
  },
} satisfies Record<Lang, Record<string, string>>;

const THEMES = ["light", "dark", "system"] as const;
const SIZES: readonly MenuSize[] = ["sm", "md", "lg"];

/** The area every menu opens from: the page draws it, the library does not. */
function Area({ lang, demo = "area" }: { lang: Lang; demo?: string }) {
  const t = TEXT[lang];
  return (
    <ContextMenu.Trigger className="demo-context-menu-area" data-demo={demo}>
      <span className="demo-context-menu-hint demo-context-menu-hint--mouse">{t.area}</span>
      <span className="demo-context-menu-hint demo-context-menu-hint--touch">{t.areaTouch}</span>
    </ContextMenu.Trigger>
  );
}

/** Portal, Positioner, and Popup around the items. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <ContextMenu.Portal>
      <ContextMenu.Positioner>
        <ContextMenu.Popup>{children}</ContextMenu.Popup>
      </ContextMenu.Positioner>
    </ContextMenu.Portal>
  );
}

/** Actions with an icon first and a shortcut last, one of them disabled. */
function Actions({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <ContextMenu.Item data-demo="cut">
        <Icon name="scissors" />
        {t.cut}
        <kbd>⌘X</kbd>
      </ContextMenu.Item>
      <ContextMenu.Item data-demo="copy">
        <Icon name="copy" />
        {t.copy}
        <kbd>⌘C</kbd>
      </ContextMenu.Item>
      <ContextMenu.Item disabled data-demo="paste">
        <Icon name="clipboard" />
        {t.paste}
        <kbd>⌘V</kbd>
      </ContextMenu.Item>
    </>
  );
}

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <ContextMenu.Root>
      <Area lang={lang} />
      <Panel>
        <Actions lang={lang} />
        <ContextMenu.Separator />
        <ContextMenu.Item data-demo="select-all">{t.selectAll}</ContextMenu.Item>
      </Panel>
    </ContextMenu.Root>
  );
}

function Submenu({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <ContextMenu.Root>
      <Area lang={lang} />
      <Panel>
        <Actions lang={lang} />
        <ContextMenu.Separator />
        <ContextMenu.SubmenuRoot>
          <ContextMenu.SubmenuTrigger data-demo="share">
            <Icon name="share-2" />
            {t.share}
          </ContextMenu.SubmenuTrigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Popup>
                <ContextMenu.Item data-demo="email">
                  <Icon name="mail" />
                  {t.email}
                </ContextMenu.Item>
                <ContextMenu.Item data-demo="link">
                  <Icon name="link" />
                  {t.link}
                </ContextMenu.Item>
              </ContextMenu.Popup>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu.SubmenuRoot>
      </Panel>
    </ContextMenu.Root>
  );
}

/** Two checkbox items, and a theme picked in a radio group under its label. */
function Choices({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [wrap, setWrap] = useState(true);
  const [numbers, setNumbers] = useState(false);
  const [theme, setTheme] = useState("system");
  return (
    <ContextMenu.Root>
      <Area lang={lang} />
      <Panel>
        <ContextMenu.CheckboxItem checked={wrap} onCheckedChange={setWrap} data-demo="wrap">
          <ContextMenu.CheckboxItemIndicator />
          {t.wrap}
        </ContextMenu.CheckboxItem>
        <ContextMenu.CheckboxItem
          checked={numbers}
          onCheckedChange={setNumbers}
          data-demo="numbers"
        >
          <ContextMenu.CheckboxItemIndicator />
          {t.numbers}
        </ContextMenu.CheckboxItem>
        <ContextMenu.Separator />
        <ContextMenu.Group>
          <ContextMenu.GroupLabel>{t.theme}</ContextMenu.GroupLabel>
          <ContextMenu.RadioGroup value={theme} onValueChange={setTheme}>
            {THEMES.map((value) => (
              <ContextMenu.RadioItem key={value} value={value} data-demo={value}>
                <ContextMenu.RadioItemIndicator />
                {t[value]}
              </ContextMenu.RadioItem>
            ))}
          </ContextMenu.RadioGroup>
        </ContextMenu.Group>
      </Panel>
    </ContextMenu.Root>
  );
}

/** One area per size: `size` on the Root reaches the popup and its submenus. */
function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-context-menu-sizes">
      {SIZES.map((size) => (
        <ContextMenu.Root key={size} size={size}>
          <ContextMenu.Trigger
            className="demo-context-menu-area demo-context-menu-area--small"
            data-demo={`area-${size}`}
          >
            {size}
          </ContextMenu.Trigger>
          <Panel>
            <Actions lang={lang} />
          </Panel>
        </ContextMenu.Root>
      ))}
    </div>
  );
}

/** The same actions behind a visible Menu button and the context menu: the one is not the only way. */
function Card({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const names = [t.preview, t.download, t.rename];
  return (
    <div className="demo-context-menu-card">
      <ContextMenu.Root>
        <ContextMenu.Trigger className="demo-context-menu-photo" data-demo="area">
          <span className="demo-context-menu-picture" aria-hidden="true" />
          <strong>{t.photo}</strong>
          <span>{t.photoInfo}</span>
        </ContextMenu.Trigger>
        <Panel>
          {names.map((name) => (
            <ContextMenu.Item key={name}>{name}</ContextMenu.Item>
          ))}
        </Panel>
      </ContextMenu.Root>
      <Menu.Root>
        <Menu.Trigger
          className="demo-context-menu-more"
          render={<Button variant="ghost" size="sm" aria-label={t.actions} />}
          data-demo="more"
        >
          <Icon name="ellipsis" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup>
              {names.map((name) => (
                <Menu.Item key={name}>{name}</Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

/**
 * The area and the menu held open. A context menu is always modal, and a modal one held open would
 * lock the page Inspect is on, so the popup here is Menu's, which looks and is built the same, pinned
 * beside an area that wears the Trigger's class. It lands in its own box, `inert`, with no focus
 * taken, so Inspect can magnify all of it.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-context-menu-specimen">
      <Menu.Root open modal={false}>
        <Menu.Trigger
          nativeButton={false}
          render={<div />}
          className="ow-context-menu__trigger demo-context-menu-area demo-context-menu-area--small"
          data-demo="area"
        >
          <span className="demo-context-menu-hint">{t.area}</span>
        </Menu.Trigger>
        <Menu.Portal container={box}>
          <Menu.Positioner side="bottom" align="start" sideOffset={-40} positionMethod="absolute">
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

const imports = (setup: TokenSetup, icons: string[], extra: string[] = []) => [
  ...(isDefaultSetup(setup)
    ? [`import { ${[...extra, "ContextMenu"].sort().join(", ")} } from "owsem-ui/base";`]
    : [
        ...extra.map(
          (name) => `import { ${name} } from "${importPath(setup, name.toLowerCase())}";`,
        ),
        `import { ContextMenu } from "${importPath(setup, "context-menu")}";`,
      ]),
  ...(icons.length ? [`import { ${icons.join(", ")} } from "lucide-react";`] : []),
];

/** Root, the area, Portal, Positioner, and Popup around some lines. */
const menu = (area: string, items: string[]) => [
  "<ContextMenu.Root>",
  `  <ContextMenu.Trigger className="area">${area}</ContextMenu.Trigger>`,
  "  <ContextMenu.Portal>",
  "    <ContextMenu.Positioner>",
  "      <ContextMenu.Popup>",
  ...items.map((l) => `        ${l}`),
  "      </ContextMenu.Popup>",
  "    </ContextMenu.Positioner>",
  "  </ContextMenu.Portal>",
  "</ContextMenu.Root>",
];

const actions = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    "<ContextMenu.Item>",
    "  <Scissors />",
    `  ${t.cut}`,
    "  <kbd>⌘X</kbd>",
    "</ContextMenu.Item>",
    "<ContextMenu.Item>",
    "  <Copy />",
    `  ${t.copy}`,
    "  <kbd>⌘C</kbd>",
    "</ContextMenu.Item>",
    "<ContextMenu.Item disabled>",
    "  <Clipboard />",
    `  ${t.paste}`,
    "  <kbd>⌘V</kbd>",
    "</ContextMenu.Item>",
  ];
};

export const contextMenuDefinition = defineComponent({
  item: "context-menu",
  imports: ["ContextMenu"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Klik kanan atau tekan lama pada area membuka menu di pointer. Area digambar halaman; pustaka tidak memberinya tampilan.",
        en: "A right click or a long press on the area opens the menu at the pointer. The page draws the area; the library gives it no look.",
      },
      uses: ["ContextMenu"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "EditArea",
          imports(setup, ["Clipboard", "Copy", "Scissors"]),
          menu(TEXT[lang].area, [
            ...actions(lang),
            "<ContextMenu.Separator />",
            `<ContextMenu.Item>${TEXT[lang].selectAll}</ContextMenu.Item>`,
          ]),
        ),
      ],
    },
    {
      id: "submenu",
      title: { id: "Submenu", en: "Submenu" },
      description: {
        id: "SubmenuRoot dengan SubmenuTrigger membuka menu di sisi item; panah kanan, Enter, atau hover membukanya.",
        en: "A SubmenuRoot with a SubmenuTrigger opens a menu beside its item; the right arrow, Enter, or hover opens it.",
      },
      uses: ["ContextMenu"],
      demo: (lang) => <Submenu lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ShareArea",
            imports(setup, ["Clipboard", "Copy", "Link", "Mail", "Scissors", "Share2"]),
            menu(t.area, [
              ...actions(lang),
              "<ContextMenu.Separator />",
              "<ContextMenu.SubmenuRoot>",
              "  <ContextMenu.SubmenuTrigger>",
              "    <Share2 />",
              `    ${t.share}`,
              "  </ContextMenu.SubmenuTrigger>",
              "  <ContextMenu.Portal>",
              "    <ContextMenu.Positioner>",
              "      <ContextMenu.Popup>",
              "        <ContextMenu.Item>",
              "          <Mail />",
              `          ${t.email}`,
              "        </ContextMenu.Item>",
              "        <ContextMenu.Item>",
              "          <Link />",
              `          ${t.link}`,
              "        </ContextMenu.Item>",
              "      </ContextMenu.Popup>",
              "    </ContextMenu.Positioner>",
              "  </ContextMenu.Portal>",
              "</ContextMenu.SubmenuRoot>",
            ]),
          ),
        ];
      },
    },
    {
      id: "choices",
      title: { id: "Pilihan", en: "Choices" },
      description: {
        id: "CheckboxItem menyalakan dan mematikan; RadioItem di RadioGroup memilih satu. Keduanya menjaga menu tetap terbuka.",
        en: "A CheckboxItem turns a setting on and off; a RadioItem in a RadioGroup picks one. Both keep the menu open.",
      },
      uses: ["ContextMenu"],
      demo: (lang) => <Choices lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ViewArea",
            [...imports(setup, []), 'import { useState } from "react";'],
            menu(t.area, [
              "<ContextMenu.CheckboxItem checked={wrap} onCheckedChange={setWrap}>",
              "  <ContextMenu.CheckboxItemIndicator />",
              `  ${t.wrap}`,
              "</ContextMenu.CheckboxItem>",
              "<ContextMenu.CheckboxItem checked={numbers} onCheckedChange={setNumbers}>",
              "  <ContextMenu.CheckboxItemIndicator />",
              `  ${t.numbers}`,
              "</ContextMenu.CheckboxItem>",
              "<ContextMenu.Separator />",
              "<ContextMenu.Group>",
              `  <ContextMenu.GroupLabel>${t.theme}</ContextMenu.GroupLabel>`,
              "  <ContextMenu.RadioGroup value={theme} onValueChange={setTheme}>",
              ...THEMES.flatMap((value) => [
                `    <ContextMenu.RadioItem value="${value}">`,
                "      <ContextMenu.RadioItemIndicator />",
                `      ${t[value]}`,
                "    </ContextMenu.RadioItem>",
              ]),
              "  </ContextMenu.RadioGroup>",
              "</ContextMenu.Group>",
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
        id: "size di Root mengatur font dan tinggi item popup dan submenunya: 13, 14, atau 16px, seperti Menu.",
        en: "size on the Root sets the type scale and height of the items in the popup and its submenus: 13, 14, or 16px, as Menu's.",
      },
      uses: ["ContextMenu"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SizedAreas",
          imports(setup, ["Clipboard", "Copy", "Scissors"]),
          SIZES.flatMap((size) => [
            `<ContextMenu.Root size="${size}">`,
            `  <ContextMenu.Trigger className="area">${size}</ContextMenu.Trigger>`,
            "  <ContextMenu.Popup>",
            ...actions(lang).map((l) => `    ${l}`),
            "  </ContextMenu.Popup>",
            "</ContextMenu.Root>",
          ]),
        ),
      ],
    },
    {
      id: "card",
      title: { id: "Dengan tombol menu", en: "With a menu button" },
      description: {
        id: "Menu konteks hanya tambahan: kartu ini memberi aksi yang sama lewat tombol Menu yang terlihat, untuk sentuhan dan teknologi asistif.",
        en: "A context menu only supplements: this card offers the same actions through a visible Menu button, for touch and assistive technology.",
      },
      uses: ["ContextMenu", "Menu", "Button"],
      demo: (lang) => <Card lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        const items = (part: string) => [
          `<${part}.Item>${t.preview}</${part}.Item>`,
          `<${part}.Item>${t.download}</${part}.Item>`,
          `<${part}.Item>${t.rename}</${part}.Item>`,
        ];
        return [
          exampleFile(
            "PhotoCard",
            [
              ...(isDefaultSetup(setup)
                ? ['import { Button, ContextMenu, Menu } from "owsem-ui/base";']
                : [
                    `import { Button } from "${importPath(setup, "button")}";`,
                    `import { ContextMenu } from "${importPath(setup, "context-menu")}";`,
                    `import { Menu } from "${importPath(setup, "menu")}";`,
                  ]),
              'import { Ellipsis } from "lucide-react";',
            ],
            [
              "<ContextMenu.Root>",
              '  <ContextMenu.Trigger className="card">',
              `    <strong>${t.photo}</strong>`,
              "  </ContextMenu.Trigger>",
              "  <ContextMenu.Portal>",
              "    <ContextMenu.Positioner>",
              "      <ContextMenu.Popup>",
              ...items("ContextMenu").map((l) => `        ${l}`),
              "      </ContextMenu.Popup>",
              "    </ContextMenu.Positioner>",
              "  </ContextMenu.Portal>",
              "</ContextMenu.Root>",
              "<Menu.Root>",
              `  <Menu.Trigger render={<Button variant="ghost" size="sm" aria-label="${t.actions}" />}>`,
              "    <Ellipsis />",
              "  </Menu.Trigger>",
              "  <Menu.Portal>",
              '    <Menu.Positioner align="end">',
              "      <Menu.Popup>",
              ...items("Menu").map((l) => `        ${l}`),
              "      </Menu.Popup>",
              "    </Menu.Positioner>",
              "  </Menu.Portal>",
              "</Menu.Root>",
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
      name: "Root",
      selector: ".demo-context-menu-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state (open, onOpenChange). Inspect menandai kotak yang memuat area dan menunya.",
        en: "Renders no element: it holds the state (open, onOpenChange). Inspect outlines the box that holds the area and its menu.",
      },
    },
    {
      name: "Trigger",
      selector: ".ow-context-menu__trigger",
      note: {
        id: "Area yang membuka menu dengan klik kanan atau tekan lama. Tanpa tampilan sendiri; halaman yang menggambarnya.",
        en: "The area that opens the menu on a right click or a long press. No look of its own; the page draws it.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-menu__popup",
      note: {
        id: "Popup milik Menu: material raised dengan bayangan popup. Tumbuh dari pointer.",
        en: "Menu's popup: the raised material with the popup shadow. It grows from the pointer.",
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
        id: "Datar; Glide yang menyalakannya, seperti Menu. Ikon di depan dan shortcut (kbd) di ujung.",
        en: "Flat; Glide lights it, as in Menu. An icon first and a shortcut (kbd) at the end.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "GroupLabel",
      selector: ".ow-menu__group-label",
      note: {
        id: "Nama grup sebagai judul kecil, muted, kapital; juga menamai grup untuk teknologi asistif.",
        en: "A group's name as a small, muted, capitalized heading; it names the group for assistive technology too.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "CheckboxItem",
      selector: '[data-demo="wrap"]',
      note: {
        id: "Item menyala atau mati, dengan indikator di kolom ikon yang menyimpan tempatnya saat mati.",
        en: "An on/off item, its indicator in the icon column, which keeps its room while off.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-menu__separator",
      note: { id: "Garis tipis di antara grup.", en: "A hairline between groups." },
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

export default function ContextMenuPage(props: ExamplePageProps) {
  return <ComponentPage definition={contextMenuDefinition} {...props} />;
}
