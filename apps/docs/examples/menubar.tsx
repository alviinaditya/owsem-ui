"use client";

import { Menu, Menubar, type MenubarSize } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    bar: "Aplikasi",
    file: "Berkas",
    edit: "Edit",
    view: "Tampilan",
    new: "Baru",
    open: "Buka",
    save: "Simpan",
    export: "Ekspor",
    pdf: "PDF",
    png: "PNG",
    print: "Cetak",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    wrap: "Bungkus baris",
    numbers: "Nomor baris",
    theme: "Tema",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
  },
  en: {
    bar: "Application",
    file: "File",
    edit: "Edit",
    view: "View",
    new: "New",
    open: "Open",
    save: "Save",
    export: "Export",
    pdf: "PDF",
    png: "PNG",
    print: "Print",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    wrap: "Word wrap",
    numbers: "Line numbers",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly MenubarSize[] = ["sm", "md", "lg"];
const THEMES = ["light", "dark", "system"] as const;

/** One menu of the bar: its trigger, then Portal, Positioner, and Popup around the items. */
function Dropdown({ label, demo, children }: { label: string; demo: string; children: ReactNode }) {
  return (
    <Menu.Root>
      <Menubar.Trigger data-demo={demo}>{label}</Menubar.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start">
          <Menu.Popup>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function FileMenu({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Dropdown label={t.file} demo="file">
      <Menu.Item data-demo="new">
        {t.new}
        <kbd>⌘N</kbd>
      </Menu.Item>
      <Menu.Item>
        {t.open}
        <kbd>⌘O</kbd>
      </Menu.Item>
      <Menu.Item>
        {t.save}
        <kbd>⌘S</kbd>
      </Menu.Item>
      <Menu.Separator />
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger data-demo="export">{t.export}</Menu.SubmenuTrigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>{t.pdf}</Menu.Item>
              <Menu.Item>{t.png}</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
      <Menu.Separator />
      <Menu.Item>
        {t.print}
        <kbd>⌘P</kbd>
      </Menu.Item>
    </Dropdown>
  );
}

function EditMenu({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Dropdown label={t.edit} demo="edit">
      <Menu.Item>
        <Icon name="scissors" />
        {t.cut}
        <kbd>⌘X</kbd>
      </Menu.Item>
      <Menu.Item>
        <Icon name="copy" />
        {t.copy}
        <kbd>⌘C</kbd>
      </Menu.Item>
      <Menu.Item disabled>
        <Icon name="clipboard" />
        {t.paste}
        <kbd>⌘V</kbd>
      </Menu.Item>
    </Dropdown>
  );
}

/** Two checkbox items, and a theme picked in a radio group under its label. */
function ViewMenu({ lang }: { lang: Lang }) {
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
      <Menu.CheckboxItem checked={numbers} onCheckedChange={setNumbers}>
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

function Default({ lang }: { lang: Lang }) {
  return (
    <Menubar.Root aria-label={TEXT[lang].bar} data-demo="bar">
      <FileMenu lang={lang} />
      <EditMenu lang={lang} />
      <ViewMenu lang={lang} />
    </Menubar.Root>
  );
}

function Choices({ lang }: { lang: Lang }) {
  return (
    <Menubar.Root aria-label={TEXT[lang].bar}>
      <ViewMenu lang={lang} />
    </Menubar.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-menubar-sizes">
      {SIZES.map((size) => (
        <Menubar.Root key={size} size={size} aria-label={`${TEXT[lang].bar} ${size}`}>
          <FileMenu lang={lang} />
          <EditMenu lang={lang} />
          <ViewMenu lang={lang} />
        </Menubar.Root>
      ))}
    </div>
  );
}

/**
 * The bar with the Edit menu held open: it lands in its own box, `inert`, with no focus taken, so
 * Inspect can magnify all of it. A modal bar would put a backdrop over the box, so this one is not.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  // A menu held open inside a Menubar is shut by Base UI when nothing in the bar has focus, so the
  // specimen is the bar's look made of its classes, with a plain Menu open under one trigger.
  return (
    <div ref={setBox} className="demo-menubar-specimen">
      <div className="ow-menubar ow-menubar--md" data-demo="bar">
        <span className="ow-menubar__trigger ow-menubar__trigger--md" data-demo="file">
          {t.file}
        </span>
        <Menu.Root open modal={false}>
          <Menu.Trigger
            nativeButton={false}
            render={<span />}
            className="ow-menubar__trigger ow-menubar__trigger--md"
            data-demo="edit"
          >
            {t.edit}
          </Menu.Trigger>
          <Menu.Portal container={box}>
            <Menu.Positioner align="start" positionMethod="absolute">
              <Menu.Popup inert {...({ initialFocus: false } as object)}>
                <Menu.Item data-demo="copy">
                  <Icon name="copy" />
                  {t.copy}
                  <kbd>⌘C</kbd>
                </Menu.Item>
                <Menu.Separator />
                <Menu.CheckboxItem defaultChecked data-demo="wrap">
                  <Menu.CheckboxItemIndicator />
                  {t.wrap}
                </Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <span className="ow-menubar__trigger ow-menubar__trigger--md" data-demo="view">
          {t.view}
        </span>
      </div>
    </div>
  );
}

const imports = (setup: TokenSetup, icons: string[] = []) => [
  ...(isDefaultSetup(setup)
    ? ['import { Menu, Menubar } from "owsem-ui/base";']
    : [
        `import { Menu } from "${importPath(setup, "menu")}";`,
        `import { Menubar } from "${importPath(setup, "menubar")}";`,
      ]),
  ...(icons.length ? [`import { ${icons.join(", ")} } from "lucide-react";`] : []),
];

/** One menu: its trigger, then Portal, Positioner, and Popup around some lines. */
const dropdown = (label: string, items: string[]) => {
  return [
    "<Menu.Root>",
    `  <Menubar.Trigger>${label}</Menubar.Trigger>`,
    "  <Menu.Portal>",
    '    <Menu.Positioner align="start">',
    "      <Menu.Popup>",
    ...items.map((l) => `        ${l}`),
    "      </Menu.Popup>",
    "    </Menu.Positioner>",
    "  </Menu.Portal>",
    "</Menu.Root>",
  ];
};

const fileItems = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    "<Menu.Item>",
    `  ${t.new}`,
    "  <kbd>⌘N</kbd>",
    "</Menu.Item>",
    "<Menu.Item>",
    `  ${t.open}`,
    "  <kbd>⌘O</kbd>",
    "</Menu.Item>",
    "<Menu.Separator />",
    "<Menu.SubmenuRoot>",
    `  <Menu.SubmenuTrigger>${t.export}</Menu.SubmenuTrigger>`,
    "  <Menu.Portal>",
    "    <Menu.Positioner>",
    "      <Menu.Popup>",
    `        <Menu.Item>${t.pdf}</Menu.Item>`,
    `        <Menu.Item>${t.png}</Menu.Item>`,
    "      </Menu.Popup>",
    "    </Menu.Positioner>",
    "  </Menu.Portal>",
    "</Menu.SubmenuRoot>",
  ];
};

const editItems = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    "<Menu.Item>",
    "  <Scissors />",
    `  ${t.cut}`,
    "  <kbd>⌘X</kbd>",
    "</Menu.Item>",
    "<Menu.Item>",
    "  <Copy />",
    `  ${t.copy}`,
    "  <kbd>⌘C</kbd>",
    "</Menu.Item>",
    "<Menu.Item disabled>",
    "  <Clipboard />",
    `  ${t.paste}`,
    "  <kbd>⌘V</kbd>",
    "</Menu.Item>",
  ];
};

const viewItems = (lang: Lang) => {
  const t = TEXT[lang];
  return [
    "<Menu.CheckboxItem checked={wrap} onCheckedChange={setWrap}>",
    "  <Menu.CheckboxItemIndicator />",
    `  ${t.wrap}`,
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
  ];
};

const viewHooks = [
  "  const [wrap, setWrap] = useState(true);",
  '  const [theme, setTheme] = useState("system");',
];

const bar = (lang: Lang, body: string[], props = "") => [
  `<Menubar.Root aria-label="${TEXT[lang].bar}"${props}>`,
  ...body.map((l) => `  ${l}`),
  "</Menubar.Root>",
];

export const menubarDefinition = defineComponent({
  item: "menubar",
  imports: ["Menubar"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu Menu.Root per menu, masing-masing dengan Menubar.Trigger. Panah kiri dan kanan berpindah antar menu; saat satu menu terbuka, hover juga memindahkannya.",
        en: "One Menu.Root per menu, each with a Menubar.Trigger. Left and right arrows move between the menus; while one is open, hover moves it too.",
      },
      uses: ["Menubar", "Menu"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "AppMenubar",
            [
              ...imports(setup, ["Clipboard", "Copy", "Scissors"]),
              'import { useState } from "react";',
            ],
            bar(lang, [
              ...dropdown(t.file, fileItems(lang)),
              ...dropdown(t.edit, editItems(lang)),
              ...dropdown(t.view, viewItems(lang)),
            ]),
            viewHooks,
          ),
        ];
      },
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Menubar.Root mengatur tinggi bar dan tipe pemicu: 32, 40, atau 48px. Popup menunya, dan submenunya, ikut ukuran itu.",
        en: "size on Menubar.Root sets the bar's height and the triggers' type: 32, 40, or 48px. Each menu's Popup, and its submenus, follow it.",
      },
      uses: ["Menubar", "Menu"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "MenubarSizes",
            [...imports(setup, ["Clipboard", "Copy", "Scissors"])],
            SIZES.flatMap((size) =>
              bar(lang, dropdown(t.edit, editItems(lang)), ` size="${size}"`),
            ),
          ),
        ];
      },
    },
    {
      id: "choices",
      title: { id: "Pilihan", en: "Choices" },
      description: {
        id: "CheckboxItem dan RadioItem di menu bar: centang menyalakan dan mematikan, radio memilih satu, dan menu tetap terbuka selama dipilih.",
        en: "CheckboxItem and RadioItem in a bar menu: a check turns a setting on and off, a radio picks one, and the menu stays open while you choose.",
      },
      uses: ["Menubar", "Menu"],
      demo: (lang) => <Choices lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "ViewMenubar",
            imports(setup).concat('import { useState } from "react";'),
            bar(lang, dropdown(t.view, viewItems(lang))),
            viewHooks,
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
      selector: ".demo-menubar-specimen",
      note: {
        id: "Bar di atas panel tenang milik Toolbar: 32, 40, atau 48px. Satu perhentian Tab, lalu panah berpindah antar menu. Inspect menandai kotak yang memuat bar dan menu yang terbuka.",
        en: "The bar on Toolbar's quiet panel: 32, 40, or 48px. One Tab stop, then the arrows move between the menus. Inspect outlines the box that holds the bar and its open menu.",
      },
      tokens: { "--ow-panel": "--_bg", "--ow-surface-shadow": "--_shadow", "--ow-fg": "--ow-fg" },
    },
    {
      name: "Trigger",
      selector: '[data-demo="edit"]',
      note: {
        id: "Tombol ghost dengan geometri Button; tetap diberi tint selama menunya terbuka.",
        en: "A ghost button on Button's geometry; it stays tinted while its menu is open.",
      },
      tokens: { "--ow-hover": "--_hover", "--ow-pressed-bg": "--_open", "--ow-focus": "--_focus" },
    },
    {
      name: "Popup",
      selector: ".ow-menu__popup",
      note: {
        id: "Popup milik Menu: material raised dengan bayangan popup. Menu dipasang lewat Menu.Root, Portal, Positioner, dan Popup.",
        en: "Menu's popup: the raised material with the popup shadow. Each menu is a Menu.Root with Portal, Positioner, and Popup.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "Item",
      selector: '[data-demo="copy"]',
      note: {
        id: "Datar; Glide yang menyalakannya, seperti Menu.",
        en: "Flat; Glide lights it, as in Menu.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "CheckboxItem",
      selector: '[data-demo="wrap"]',
      note: {
        id: "Item menyala atau mati, dengan indikator di kolom ikon.",
        en: "An on/off item, its indicator in the icon column.",
      },
    },
  ],
});

export default function MenubarPage(props: ExamplePageProps) {
  return <ComponentPage definition={menubarDefinition} {...props} />;
}
