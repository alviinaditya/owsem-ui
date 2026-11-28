"use client";

import { Sidebar } from "owsem-ui/owsem";
import { type CSSProperties, type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    nav: "Dokumentasi",
    brand: "Dokumentasi",
    start: "Mulai",
    overview: "Ikhtisar",
    install: "Instalasi",
    theming: "Tema",
    components: "Komponen",
    button: "Button",
    dialog: "Dialog",
    menu: "Menu",
    select: "Select",
    switch: "Switch",
    tabs: "Tabs",
    tooltip: "Tooltip",
    more: "Lainnya",
    changelog: "Changelog",
    roadmap: "Peta jalan",
    badge: "Baru",
    version: "Versi 0.1",
    page: "Halaman",
    pageText: "Tombol di sudut membuka dan menutup sidebar.",
    open: "Buka menu",
  },
  en: {
    nav: "Documentation",
    brand: "Documentation",
    start: "Get started",
    overview: "Overview",
    install: "Installation",
    theming: "Theming",
    components: "Components",
    button: "Button",
    dialog: "Dialog",
    menu: "Menu",
    select: "Select",
    switch: "Switch",
    tabs: "Tabs",
    tooltip: "Tooltip",
    more: "More",
    changelog: "Changelog",
    roadmap: "Roadmap",
    badge: "New",
    version: "Version 0.1",
    page: "Page",
    pageText: "The button in the corner opens and closes the sidebar.",
    open: "Open menu",
  },
} satisfies Record<Lang, Record<string, string>>;

type Page = Exclude<
  keyof (typeof TEXT)["en"],
  | "nav"
  | "brand"
  | "start"
  | "components"
  | "more"
  | "badge"
  | "version"
  | "page"
  | "pageText"
  | "open"
>;

const GROUPS: { label: "start" | "components" | "more"; pages: Page[] }[] = [
  { label: "start", pages: ["overview", "install", "theming"] },
  {
    label: "components",
    pages: ["button", "dialog", "menu", "select", "switch", "tabs", "tooltip"],
  },
  { label: "more", pages: ["changelog", "roadmap"] },
];

/** The column the demos sit in: a card about 240px wide and 360px tall, so the fades show. */
const COLUMN = {
  inlineSize: 240,
  maxInlineSize: "100%",
  blockSize: 360,
  borderRadius: "var(--ow-radius)",
  backgroundColor: "var(--docs-surface)",
} as CSSProperties;

/** The inline demos stay a column on a phone too: no query matches. */
const INLINE = "(max-width: 0px)";

const ROOT_FILL = { inlineSize: "100%" } as CSSProperties;

/** The rows, with their own current page: a click picks it, so the Indicator drips there. */
function Rows({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [current, setCurrent] = useState<Page>("install");
  return (
    <Sidebar.Content>
      <Sidebar.Indicator />
      {GROUPS.map((group) => (
        <Sidebar.Group key={group.label}>
          <Sidebar.GroupLabel>{t[group.label]}</Sidebar.GroupLabel>
          <Sidebar.List>
            {group.pages.map((page) => (
              <Sidebar.Item
                key={page}
                href={`#${page}`}
                active={current === page}
                disabled={page === "roadmap"}
                onClick={(event) => {
                  event.preventDefault();
                  setCurrent(page);
                }}
              >
                {t[page]}
                {page === "tabs" ? <Sidebar.ItemBadge>{t.badge}</Sidebar.ItemBadge> : null}
              </Sidebar.Item>
            ))}
          </Sidebar.List>
        </Sidebar.Group>
      ))}
    </Sidebar.Content>
  );
}

function Default({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Sidebar.Provider shortcut={false} mobileQuery={INLINE} style={COLUMN}>
      <Sidebar.Root aria-label={t.nav} style={ROOT_FILL}>
        <Sidebar.Header>
          <strong>{t.brand}</strong>
        </Sidebar.Header>
        <Rows lang={lang} />
      </Sidebar.Root>
    </Sidebar.Provider>
  );
}

function Collapsing({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [open, setOpen] = useState(true);
  return (
    <Sidebar.Provider
      shortcut={false}
      mobileQuery={INLINE}
      open={open}
      onOpenChange={setOpen}
      style={{ ...COLUMN, inlineSize: 400, overflow: "hidden", alignItems: "stretch" }}
    >
      <Sidebar.Root aria-label={t.nav} space="release" style={{ inlineSize: 200 }}>
        <Sidebar.Header>
          <strong>{t.brand}</strong>
        </Sidebar.Header>
        <Rows lang={lang} />
        <Sidebar.Footer>{t.version}</Sidebar.Footer>
      </Sidebar.Root>
      <div style={{ flex: "1 1 0", minInlineSize: 0, padding: 12 }}>
        <Sidebar.Trigger />
        <p style={{ margin: "12px 0 0" }}>{t.pageText}</p>
      </div>
    </Sidebar.Provider>
  );
}

/** A phone-sized window: the drawer opens inside it, over its page, not over the docs. */
function Drawer({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  return (
    <div ref={setFrame} className="demo-sidebar-frame">
      <Sidebar.Provider shortcut={false} mobileQuery="(min-width: 0px)" style={{ padding: 12 }}>
        <Sidebar.Trigger aria-label={t.open} />
        <Sidebar.Root aria-label={t.nav} container={frame}>
          <Sidebar.Header>
            <strong>{t.brand}</strong>
          </Sidebar.Header>
          <Rows lang={lang} />
        </Sidebar.Root>
      </Sidebar.Provider>
    </div>
  );
}

/** One complete instance for Inspect: every part, short enough to fit the sheet. */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const icon = (name: "monitor" | "code-xml"): ReactNode => (
    <Sidebar.ItemIcon>
      <Icon name={name} size={16} />
    </Sidebar.ItemIcon>
  );
  return (
    <Sidebar.Provider
      shortcut={false}
      mobileQuery={INLINE}
      style={{ ...COLUMN, blockSize: 300, backgroundColor: "transparent" }}
    >
      <Sidebar.Root aria-label={t.nav} style={ROOT_FILL}>
        <Sidebar.Header>
          <Sidebar.Trigger />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Indicator />
          <Sidebar.Group>
            <Sidebar.GroupLabel>{t.start}</Sidebar.GroupLabel>
            <Sidebar.List>
              <Sidebar.Item href="#overview">
                {icon("monitor")}
                {t.overview}
              </Sidebar.Item>
              <Sidebar.Item href="#install" active>
                {icon("code-xml")}
                {t.install}
                <Sidebar.ItemBadge>{t.badge}</Sidebar.ItemBadge>
              </Sidebar.Item>
            </Sidebar.List>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>{t.version}</Sidebar.Footer>
      </Sidebar.Root>
    </Sidebar.Provider>
  );
}

const imp = (setup: TokenSetup, hooks = false) => [
  ...(hooks ? ['import { useState } from "react";'] : []),
  `import { Sidebar } from "${isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/sidebar"}";`,
];

interface Variant {
  provider?: string;
  header?: boolean;
  footer?: boolean;
  trigger?: boolean;
  drawer?: boolean;
  /** The page takes the room of a closed sidebar. */
  collapse?: boolean;
}

const rows = (lang: Lang, pad: string) => {
  const t = TEXT[lang];
  return [
    `${pad}<Sidebar.Content>`,
    `${pad}  <Sidebar.Indicator />`,
    `${pad}  <Sidebar.Group>`,
    `${pad}    <Sidebar.GroupLabel>${t.start}</Sidebar.GroupLabel>`,
    `${pad}    <Sidebar.List>`,
    `${pad}      {item("/", "${t.overview}")}`,
    `${pad}      {item("/install", "${t.install}")}`,
    `${pad}      {item("/theming", "${t.theming}")}`,
    `${pad}    </Sidebar.List>`,
    `${pad}  </Sidebar.Group>`,
    `${pad}  <Sidebar.Group>`,
    `${pad}    <Sidebar.GroupLabel>${t.components}</Sidebar.GroupLabel>`,
    `${pad}    <Sidebar.List>`,
    `${pad}      {item("/button", "${t.button}")}`,
    `${pad}      {item("/dialog", "${t.dialog}")}`,
    `${pad}      {/* ... */}`,
    `${pad}    </Sidebar.List>`,
    `${pad}  </Sidebar.Group>`,
    `${pad}</Sidebar.Content>`,
  ];
};

const ITEM_HELPER = [
  "  const item = (href: string, label: string) => (",
  "    <Sidebar.Item href={href} active={path === href}>",
  "      {label}",
  "    </Sidebar.Item>",
  "  );",
];

const sidebarFile = (
  setup: TokenSetup,
  lang: Lang,
  v: Variant = {},
): ReturnType<typeof exampleFile> => {
  const t = TEXT[lang];
  const root = v.collapse
    ? [`  <Sidebar.Root aria-label="${t.nav}" space="release">`]
    : [`  <Sidebar.Root aria-label="${t.nav}"${v.drawer ? " container={frame}" : ""}>`];
  const body = [
    ...(v.drawer ? ["<div ref={setFrame}>"] : []),
    `<Sidebar.Provider${v.provider ?? ""}>`,
    ...(v.drawer ? ["  <Sidebar.Trigger />"] : []),
    ...root,
    ...(v.header ? [`    <Sidebar.Header>${t.brand}</Sidebar.Header>`] : []),
    ...rows(lang, "    "),
    ...(v.footer ? [`    <Sidebar.Footer>${t.version}</Sidebar.Footer>`] : []),
    "  </Sidebar.Root>",
    ...(v.trigger
      ? ["  <main>", "    <Sidebar.Trigger />", `    <p>${t.pageText}</p>`, "  </main>"]
      : []),
    "</Sidebar.Provider>",
    ...(v.drawer ? ["</div>"] : []),
  ];
  const state = v.collapse
    ? ["  const [open, setOpen] = useState(true);"]
    : v.drawer
      ? ["  const [frame, setFrame] = useState<HTMLElement | null>(null);"]
      : [];
  const file = exampleFile("AppSidebar", imp(setup, state.length > 0), body, [
    ...state,
    ...ITEM_HELPER,
  ]);
  return {
    name: "app-sidebar.tsx",
    code: file.code.replace("AppSidebar()", "AppSidebar({ path }: { path: string })"),
  };
};

export const sidebarDefinition = defineComponent({
  item: "sidebar",
  imports: ["Sidebar"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Grup dengan item dan penanda halaman saat ini; ujung konten memudar saat masih bisa digulir.",
        en: "Groups of items with the current-page Indicator; the edges of the content fade while there is more to scroll.",
      },
      uses: ["Sidebar"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [sidebarFile(setup, lang, { header: true })],
    },
    {
      id: "collapsible",
      title: { id: "Bisa ditutup", en: "Collapsible" },
      description: {
        id: 'Trigger di mana saja di bawah Provider menutup sidebar; halaman di sampingnya mengambil ruangnya (space="release" pada Root).',
        en: 'A Trigger anywhere under the Provider closes the sidebar; the page beside it takes its room (space="release" on the Root).',
      },
      uses: ["Sidebar"],
      demo: (lang) => <Collapsing lang={lang} />,
      code: (setup, lang) => [
        sidebarFile(setup, lang, {
          header: true,
          footer: true,
          trigger: true,
          collapse: true,
          provider: " open={open} onOpenChange={setOpen}",
        }),
      ],
    },
    {
      id: "drawer",
      title: { id: "Laci seluler", en: "Mobile drawer" },
      description: {
        id: "Di bawah mobileQuery sidebar menjadi laci modal dari sisi awal; contoh ini memaksanya selalu aktif dan memakai container agar laci tetap di jendelanya.",
        en: "Under mobileQuery the sidebar becomes a modal drawer from the inline start; this example forces it on, and sets container to keep the drawer in its window.",
      },
      uses: ["Sidebar"],
      demo: (lang) => <Drawer lang={lang} />,
      code: (setup, lang) => [
        sidebarFile(setup, lang, {
          header: true,
          drawer: true,
          provider: ' mobileQuery="(max-width: 767px)"',
        }),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Provider",
      selector: ".ow-sidebar__provider",
      note: {
        id: "Memegang status kedua mode, jadi Trigger bisa di mana saja di bawahnya. Kotak flex yang membawa data-sidebar-state.",
        en: "Holds the state of both modes, so a Trigger can sit anywhere under it. A flex box that carries data-sidebar-state.",
      },
    },
    {
      name: "Root",
      selector: ".ow-sidebar",
      note: {
        id: "nav sidebar. Tertutup, ia bergeser keluar dan memudar; di seluler ia laci modal.",
        en: "The sidebar nav. Closed, it slides out and fades; on mobile it is a modal drawer.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Header",
      selector: ".ow-sidebar__header",
      note: {
        id: "Tetap di atas Content: logo, kolom cari, atau Trigger.",
        en: "Fixed above Content: a logo, a search field, or a Trigger.",
      },
    },
    {
      name: "Content",
      selector: ".ow-sidebar__content",
      note: {
        id: "Bagian tengah yang digulir, dengan highlight hover (Glide) dan tepi yang memudar.",
        en: "The scrolling middle, with the hover highlight (Glide) and fading edges.",
      },
    },
    {
      name: "Group",
      selector: ".ow-sidebar__group",
      note: {
        id: "Satu bagian dari Content, dengan label dan daftarnya.",
        en: "One section of Content, with its label and its list.",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-sidebar__group-label",
      note: {
        id: "Judul kecil di atas daftar, huruf kapital.",
        en: "A small heading over a list, in capitals.",
      },
    },
    {
      name: "List",
      selector: ".ow-sidebar__list",
      note: {
        id: "ul item. Indentasinya adalah talang tempat Indicator tinggal.",
        en: "The ul of items. Its indent is the gutter the Indicator lives in.",
      },
    },
    {
      name: "Item",
      selector: ".ow-sidebar__link[data-active]",
      note: {
        id: "Satu entri: li berisi tautan. active memasang aria-current dan data-active.",
        en: "One entry: an li holding a link. active sets aria-current and data-active.",
      },
    },
    {
      name: "ItemIcon",
      selector: ".ow-sidebar__icon",
      note: {
        id: "Ikon dekoratif di awal, seukuran 1rem.",
        en: "A decorative leading icon, 1rem.",
      },
      size: true,
    },
    {
      name: "ItemBadge",
      selector: ".ow-sidebar__badge",
      note: {
        id: "Label kecil di ujung item, seperti Baru.",
        en: "A small tag at the end of an item, such as New.",
      },
    },
    {
      name: "Indicator",
      selector: ".ow-sidebar__indicator rect",
      note: {
        id: "Latar berwarna di belakang item aktif dengan titik di talang; menetes ke item baru saat diklik.",
        en: "A tinted background behind the active item with a dot in the gutter; it drips to a new item when one is clicked.",
      },
    },
    {
      name: "Footer",
      selector: ".ow-sidebar__footer",
      note: {
        id: "Tetap di bawah Content.",
        en: "Fixed below Content.",
      },
    },
    {
      name: "Trigger",
      selector: ".ow-sidebar__trigger",
      note: {
        id: "Tombol yang membuka dan menutup sidebar mode saat ini.",
        en: "A button that toggles the sidebar of the current mode.",
      },
    },
  ],
});

export default function SidebarPage(props: ExamplePageProps) {
  return <ComponentPage definition={sidebarDefinition} {...props} />;
}
