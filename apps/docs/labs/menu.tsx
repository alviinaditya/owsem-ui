"use client";

import { Menu, type MenuSize, Toolbar } from "owsem-ui/base";
import { type CSSProperties, type ReactNode, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    bar: "Dokumen",
    edit: "Edit",
    view: "Tampilan",
    cut: "Potong",
    copy: "Salin",
    paste: "Tempel",
    share: "Bagikan",
    email: "Email",
    link: "Salin link",
    wrap: "Bungkus baris",
    numbers: "Nomor baris",
    theme: "Tema",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    lightCol: "Terang",
    darkCol: "Gelap",
  },
  en: {
    bar: "Document",
    edit: "Edit",
    view: "View",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    share: "Share",
    email: "Email",
    link: "Copy link",
    wrap: "Word wrap",
    numbers: "Line numbers",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    lightCol: "Light",
    darkCol: "Dark",
  },
} satisfies Record<Lang, Record<string, string>>;

type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];
const SIZES: readonly MenuSize[] = ["sm", "md", "lg"];

const initial = { size: "md", bg: "", fg: "" };
type Cfg = typeof initial;

/**
 * Menus portal into the demo itself, so they take the stage's theme and scale, and Inspect finds
 * them: into an empty box out of the layout. A container from state: Base UI waits while null.
 */
function usePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, box: <div ref={setContainer} className="demo-portal" /> };
}

/**
 * Anatomy and the matrix pin their menus open, without taking focus from the page (Base UI's
 * undocumented `initialFocus`), so the narrative keeps the keyboard. Lab menus are not modal.
 */
const pinned = { modal: false, open: true } as const;
const keepFocus = { initialFocus: false } as object;

function tokens(cfg: Cfg) {
  return {
    "--ow-panel": cfg.bg || undefined,
    "--ow-fg": cfg.fg || undefined,
  } as CSSProperties;
}

/** Edit's items: actions with icons and shortcuts, a disabled one, and the Share submenu. */
function EditItems({
  cfg,
  lang,
  container,
}: {
  cfg: Cfg;
  lang: Lang;
  container: HTMLElement | null;
}) {
  const t = TEXT[lang];
  const size = cfg.size as MenuSize;
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
      <Menu.Separator />
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger data-demo="share">
          <Icon name="share-2" />
          {t.share}
        </Menu.SubmenuTrigger>
        <Menu.Portal container={container}>
          <Menu.Positioner>
            <Menu.Popup size={size} style={tokens(cfg)} data-demo="share-menu">
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
    </>
  );
}

/** View's items: two checkbox items, and a theme picked in a radio group. */
function ViewItems({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [wrap, setWrap] = useState(true);
  const [numbers, setNumbers] = useState(false);
  const [theme, setTheme] = useState("system");
  return (
    <>
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
          {(["light", "dark", "system"] as const).map((value) => (
            <Menu.RadioItem key={value} value={value} data-demo={value}>
              <Menu.RadioItemIndicator />
              {t[value]}
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Group>
    </>
  );
}

/** A document's toolbar with an Edit and a View menu. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const size = cfg.size as MenuSize;
  const menu = (key: "edit" | "view", items: ReactNode) => (
    <Menu.Root modal={false}>
      <Toolbar.Button
        render={<Menu.Trigger />}
        endIcon={<Icon name="chevron-down" />}
        data-demo={key}
      >
        {t[key]}
      </Toolbar.Button>
      <Menu.Portal container={portal.container}>
        <Menu.Positioner align="start">
          <Menu.Popup size={size} style={tokens(cfg)}>
            {items}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
  return (
    <div className="demo-menu">
      <Toolbar.Root aria-label={t.bar}>
        {menu("edit", <EditItems cfg={cfg} lang={lang} container={portal.container} />)}
        {menu("view", <ViewItems lang={lang} />)}
      </Toolbar.Root>
      {portal.box}
    </div>
  );
}

/** A popup per size and theme, pinned open in the middle of its cell. */
function Cell({ theme, size, lang }: { theme: Theme; size: MenuSize; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <div data-theme={theme} data-cell={`${theme}-${size}`} className="demo-cell demo-menu-cell">
      <span ref={setAnchor} className="demo-menu-anchor" />
      {anchor ? (
        <Menu.Root {...pinned}>
          <Menu.Portal container={portal.container}>
            {/* The cell holds the popup's full height, so it never flips or shifts. */}
            <Menu.Positioner
              anchor={anchor}
              align="center"
              sideOffset={0}
              collisionAvoidance={{ side: "none", align: "none" }}
            >
              <Menu.Popup size={size} aria-label={t.edit} {...keepFocus}>
                <Menu.Item data-demo="copy">
                  <Icon name="copy" />
                  {t.copy}
                  <kbd>⌘C</kbd>
                </Menu.Item>
                <Menu.Item disabled>
                  <Icon name="clipboard" />
                  {t.paste}
                </Menu.Item>
                <Menu.CheckboxItem defaultChecked>
                  <Menu.CheckboxItemIndicator />
                  {t.wrap}
                </Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ) : null}
      {portal.box}
    </div>
  );
}

/** Each size in both themes: an item with a shortcut, a disabled one, and a checked one. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme === "light" ? "lightCol" : "darkCol"])}
      rows={SIZES.map((size) => ({
        label: size,
        cells: THEMES.map((theme) => <Cell key={theme} theme={theme} size={size} lang={lang} />),
      }))}
    />
  );
}

/** One part of every kind in one pinned menu, for Inspect. */
function Anatomy({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  return (
    <div className="demo-menu">
      <Toolbar.Root aria-label={t.bar}>
        <Menu.Root {...pinned}>
          <Toolbar.Button
            render={<Menu.Trigger />}
            endIcon={<Icon name="chevron-down" />}
            data-demo="edit"
          >
            {t.edit}
          </Toolbar.Button>
          <Menu.Portal container={portal.container}>
            <Menu.Positioner align="start">
              <Menu.Popup size={cfg.size as MenuSize} style={tokens(cfg)} {...keepFocus}>
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
      </Toolbar.Root>
      {portal.box}
    </div>
  );
}

// Opens Edit and runs the pointer down its items: the highlight glides between them, and skips
// the disabled one.
const glide: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="edit"]'));
  await stage.wait(500);
  for (const key of ["cut", "copy", "paste", "share", "copy", "cut"]) {
    await stage.point(stage.get(`[data-demo="${key}"]`));
    await stage.wait(key === "share" ? 300 : 550);
  }
  await stage.click(stage.get('[data-demo="edit"]'));
};

// Opens Share from Edit, goes into it and back out, then shuts Edit.
const submenu: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="edit"]'));
  await stage.wait(500);
  await stage.point(stage.get('[data-demo="copy"]'));
  await stage.wait(400);
  await stage.point(stage.get('[data-demo="share"]'));
  await stage.wait(700);
  await stage.point(stage.get('[data-demo="email"]'));
  await stage.wait(500);
  await stage.point(stage.get('[data-demo="link"]'));
  await stage.wait(800);
  await stage.point(stage.get('[data-demo="cut"]'));
  await stage.wait(700);
  await stage.click(stage.get('[data-demo="edit"]'));
};

// Opens View, turns Line numbers on, picks Dark, then puts both back.
const choices: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="view"]'));
  await stage.wait(500);
  for (const key of ["numbers", "dark", "numbers", "system"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(700);
  }
  await stage.click(stage.get('[data-demo="view"]'));
};

const menuLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    { key: "bg", type: "color", label: { id: "Permukaan", en: "Surface" }, token: "--ow-panel" },
    { key: "fg", type: "color", label: { id: "Teks", en: "Text" }, token: "--ow-fg" },
  ],

  parts: [
    {
      name: "Trigger",
      selector: '[data-demo="edit"]',
      note: {
        id: "Tombol pembuka; di sini Toolbar.Button yang merender Menu.Trigger.",
        en: "The button that opens it; here a Toolbar.Button that renders Menu.Trigger.",
      },
    },
    {
      name: "Popup",
      selector: ".ow-menu__popup",
      note: {
        id: "Material panel dengan bayangan popup: tepi 1px yang tegas. Radiusnya radius item ditambah padding 4px.",
        en: "The panel material with the popup shadow: a crisp 1px edge. Its radius is the item's plus the 4px padding.",
      },
      tokens: {
        "--ow-panel": "--_bg",
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
        id: "Datar; Glide yang menyalakannya. Aturan --py, dengan ikon di depan.",
        en: "Flat; Glide lights it. Button's --py rule, with an icon first.",
      },
    },
    {
      name: "Shortcut",
      selector: '[data-demo="copy"] kbd',
      note: {
        id: "kbd terakhir di item: di ujung, muted.",
        en: "A kbd last in the item: at its end, muted.",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-menu__group-label",
      note: {
        id: "Nama grup, kecil dan muted; juga menamai grup untuk teknologi asistif.",
        en: "A group's name, small and muted; it names the group for assistive technology too.",
      },
    },
    {
      name: "CheckboxItem",
      selector: '[data-demo="wrap"]',
      note: {
        id: "Item menyala atau mati, dengan indikator di kolom ikon.",
        en: "An on/off item, its indicator in the icon column.",
      },
    },
    {
      name: "Indicator",
      selector: '[data-demo="wrap"] .ow-menu__indicator',
      note: {
        id: "Centang (atau titik untuk radio). Tetap menyimpan tempatnya saat mati.",
        en: "A check (or a dot for radios). It keeps its room while off.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-menu__separator",
      note: {
        id: "Alur terukir di antara grup.",
        en: "An etched groove between groups.",
      },
      tokens: { "--ow-line-dark": "--_dark", "--ow-line-light": "--_light" },
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

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? ['import { Menu, Toolbar } from "owsem-ui/base";']
      : [
          'import { Menu } from "@/components/owsem/menu";',
          'import { Toolbar } from "@/components/owsem/toolbar";',
        ];
    const custom = cfg.bg || cfg.fg;
    const popup = `<Menu.Popup${cfg.size === "md" ? "" : ` size="${cfg.size}"`}${custom ? ' className="menu"' : ""}>`;
    const usage = [
      ...imports,
      'import { ChevronDown, Clipboard, Copy, Link, Mail, Scissors, Share2 } from "lucide-react";',
      "",
      "export function EditMenu() {",
      "  return (",
      "    <Menu.Root>",
      "      <Toolbar.Button render={<Menu.Trigger />} endIcon={<ChevronDown />}>",
      "        Edit",
      "      </Toolbar.Button>",
      "      <Menu.Portal>",
      "        <Menu.Positioner>",
      `          ${popup}`,
      "            <Menu.Item onClick={cut}>",
      "              <Scissors />",
      "              Cut",
      "              <kbd>⌘X</kbd>",
      "            </Menu.Item>",
      "            <Menu.Item onClick={copy}>",
      "              <Copy />",
      "              Copy",
      "              <kbd>⌘C</kbd>",
      "            </Menu.Item>",
      "            <Menu.Item disabled>",
      "              <Clipboard />",
      "              Paste",
      "              <kbd>⌘V</kbd>",
      "            </Menu.Item>",
      "            <Menu.Separator />",
      "            <Menu.SubmenuRoot>",
      "              <Menu.SubmenuTrigger>",
      "                <Share2 />",
      "                Share",
      "              </Menu.SubmenuTrigger>",
      "              <Menu.Portal>",
      "                <Menu.Positioner>",
      `                  ${popup}`,
      "                    <Menu.Item>",
      "                      <Mail />",
      "                      Email",
      "                    </Menu.Item>",
      "                    <Menu.Item>",
      "                      <Link />",
      "                      Copy link",
      "                    </Menu.Item>",
      "                  </Menu.Popup>",
      "                </Menu.Positioner>",
      "              </Menu.Portal>",
      "            </Menu.SubmenuRoot>",
      "          </Menu.Popup>",
      "        </Menu.Positioner>",
      "      </Menu.Portal>",
      "    </Menu.Root>",
      "  );",
      "}",
      "",
      "export function ViewMenu() {",
      "  const [wrap, setWrap] = useState(true);",
      '  const [theme, setTheme] = useState("system");',
      "  return (",
      "    <Menu.Root>",
      "      <Toolbar.Button render={<Menu.Trigger />} endIcon={<ChevronDown />}>",
      "        View",
      "      </Toolbar.Button>",
      "      <Menu.Portal>",
      "        <Menu.Positioner>",
      `          ${popup}`,
      "            <Menu.CheckboxItem checked={wrap} onCheckedChange={setWrap}>",
      "              <Menu.CheckboxItemIndicator />",
      "              Word wrap",
      "            </Menu.CheckboxItem>",
      "            <Menu.Separator />",
      "            <Menu.Group>",
      "              <Menu.GroupLabel>Theme</Menu.GroupLabel>",
      "              <Menu.RadioGroup value={theme} onValueChange={setTheme}>",
      '                <Menu.RadioItem value="light">',
      "                  <Menu.RadioItemIndicator />",
      "                  Light",
      "                </Menu.RadioItem>",
      '                <Menu.RadioItem value="dark">',
      "                  <Menu.RadioItemIndicator />",
      "                  Dark",
      "                </Menu.RadioItem>",
      '                <Menu.RadioItem value="system">',
      "                  <Menu.RadioItemIndicator />",
      "                  System",
      "                </Menu.RadioItem>",
      "              </Menu.RadioGroup>",
      "            </Menu.Group>",
      "          </Menu.Popup>",
      "        </Menu.Positioner>",
      "      </Menu.Portal>",
      "    </Menu.Root>",
      "  );",
      "}",
      "",
      "export function DocumentBar() {",
      "  return (",
      '    <Toolbar.Root aria-label="Document">',
      "      <EditMenu />",
      "      <ViewMenu />",
      "    </Toolbar.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "document-bar.tsx", code: usage.join("\n") }];
    if (custom) {
      files.push({
        name: "menu.css",
        code: [
          "/* The popups themselves: menus render in a portal, outside the trigger's subtree. */",
          ".menu {",
          ...(cfg.bg ? [`  --${setup.prefix}-panel: ${cfg.bg};`] : []),
          ...(cfg.fg ? [`  --${setup.prefix}-fg: ${cfg.fg};`] : []),
          "}",
        ].join("\n"),
      });
    }
    return files;
  },

  scenes: {
    glide: { demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} />, play: glide },
    submenu: { demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} />, play: submenu },
    choices: { demo: (cfg, lang) => <Demo cfg={cfg} lang={lang} />, play: choices },
    anatomy: { inspect: true, demo: (cfg, lang) => <Anatomy cfg={cfg} lang={lang} /> },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function MenuLab(props: LabProps) {
  return <LabShell lab={menuLab} {...props} />;
}
