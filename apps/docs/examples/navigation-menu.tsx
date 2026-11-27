"use client";

import { NavigationMenu, type NavigationMenuSize } from "owsem-ui/base";
import { type ReactNode, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    nav: "Utama",
    products: "Produk",
    resources: "Sumber daya",
    pricing: "Harga",
    components: "Komponen",
    componentsBody: "Tiga puluh lebih bagian siap pakai.",
    tokens: "Token",
    tokensBody: "Satu tema untuk semuanya.",
    glide: "Glide",
    glideBody: "Satu sorotan yang meluncur antar item.",
    install: "Pasang",
    installBody: "Dari npm atau registry.",
    guides: "Panduan",
    guidesBody: "Mulai dari awal.",
    changelog: "Catatan rilis",
    changelogBody: "Yang baru di tiap versi.",
    accessibility: "Aksesibilitas",
    accessibilityBody: "Keyboard dan pembaca layar.",
  },
  en: {
    nav: "Main",
    products: "Products",
    resources: "Resources",
    pricing: "Pricing",
    components: "Components",
    componentsBody: "Thirty-some parts, ready to use.",
    tokens: "Tokens",
    tokensBody: "One theme for all of them.",
    glide: "Glide",
    glideBody: "One highlight that slides between items.",
    install: "Install",
    installBody: "From npm or the registry.",
    guides: "Guides",
    guidesBody: "Start from the beginning.",
    changelog: "Changelog",
    changelogBody: "What is new in each version.",
    accessibility: "Accessibility",
    accessibilityBody: "Keyboard and screen readers.",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly NavigationMenuSize[] = ["sm", "md", "lg"];

/** A link in a panel: a title, then a line of text. */
function Card({ title, body, demo }: { title: string; body: string; demo?: string }) {
  return (
    <NavigationMenu.Link href="#" {...(demo ? { "data-demo": demo } : {})}>
      <strong>{title}</strong>
      <span>{body}</span>
    </NavigationMenu.Link>
  );
}

function Products({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <ul className="demo-navigation-menu-grid">
      <li>
        <Card title={t.components} body={t.componentsBody} demo="card" />
      </li>
      <li>
        <Card title={t.tokens} body={t.tokensBody} />
      </li>
      <li>
        <Card title={t.glide} body={t.glideBody} />
      </li>
      <li>
        <Card title={t.install} body={t.installBody} />
      </li>
    </ul>
  );
}

function Resources({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <ul className="demo-navigation-menu-list">
      <li>
        <Card title={t.guides} body={t.guidesBody} />
      </li>
      <li>
        <Card title={t.changelog} body={t.changelogBody} />
      </li>
      <li>
        <Card title={t.accessibility} body={t.accessibilityBody} />
      </li>
    </ul>
  );
}

/** The list: two items with a panel, and a link. */
function Items({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <NavigationMenu.List>
      <NavigationMenu.Item value="products">
        <NavigationMenu.Trigger data-demo="products">{t.products}</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <Products lang={lang} />
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item value="resources">
        <NavigationMenu.Trigger data-demo="resources">{t.resources}</NavigationMenu.Trigger>
        <NavigationMenu.Content>
          <Resources lang={lang} />
        </NavigationMenu.Content>
      </NavigationMenu.Item>
      <NavigationMenu.Item>
        <NavigationMenu.Link href="#" data-demo="pricing">
          {t.pricing}
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    </NavigationMenu.List>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <NavigationMenu.Root aria-label={TEXT[lang].nav}>
      <Items lang={lang} />
      <NavigationMenu.Portal />
    </NavigationMenu.Root>
  );
}

function WithArrow({ lang }: { lang: Lang }) {
  return (
    <NavigationMenu.Root aria-label={TEXT[lang].nav}>
      <Items lang={lang} />
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Arrow />
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-navigation-menu-sizes">
      {SIZES.map((size) => (
        <NavigationMenu.Root key={size} size={size} aria-label={`${t.nav} ${size}`}>
          <NavigationMenu.List>
            <NavigationMenu.Item value="resources">
              <NavigationMenu.Trigger data-demo={`resources-${size}`}>
                {t.resources}
              </NavigationMenu.Trigger>
              <NavigationMenu.Content>
                <Resources lang={lang} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link href="#">{t.pricing}</NavigationMenu.Link>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <NavigationMenu.Portal />
        </NavigationMenu.Root>
      ))}
    </div>
  );
}

/**
 * The navigation with its first panel held open: it lands in its own box, `inert`, so Inspect can
 * magnify the list and the panel together.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-navigation-menu-specimen">
      <NavigationMenu.Root value="products" aria-label={t.nav}>
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger data-demo="products">{t.products}</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <Products lang={lang} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="resources">
            <NavigationMenu.Trigger>{t.resources}</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <Resources lang={lang} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#">{t.pricing}</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal container={box}>
          <NavigationMenu.Positioner positionMethod="absolute">
            <NavigationMenu.Popup inert>
              <NavigationMenu.Arrow />
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
    </div>
  );
}

const imports = (setup: TokenSetup) =>
  isDefaultSetup(setup)
    ? ['import { NavigationMenu } from "owsem-ui/base";']
    : [`import { NavigationMenu } from "${importPath(setup, "navigation-menu")}";`];

const card = (title: string, body: string) => [
  '<NavigationMenu.Link href="#">',
  `  <strong>${title}</strong>`,
  `  <span>${body}</span>`,
  "</NavigationMenu.Link>",
];

/** The list, then the portal: `portal` replaces the one-line shortest use. */
const navigation = (lang: Lang, portal: string[] = ["<NavigationMenu.Portal />"]) => {
  const t = TEXT[lang];
  return [
    `<NavigationMenu.Root aria-label="${t.nav}">`,
    "  <NavigationMenu.List>",
    '    <NavigationMenu.Item value="products">',
    `      <NavigationMenu.Trigger>${t.products}</NavigationMenu.Trigger>`,
    "      <NavigationMenu.Content>",
    '        <ul className="grid">',
    ...[
      [t.components, t.componentsBody],
      [t.tokens, t.tokensBody],
      [t.glide, t.glideBody],
      [t.install, t.installBody],
    ].flatMap(([title, body]) => [
      "          <li>",
      ...card(title ?? "", body ?? "").map((l) => `            ${l}`),
      "          </li>",
    ]),
    "        </ul>",
    "      </NavigationMenu.Content>",
    "    </NavigationMenu.Item>",
    '    <NavigationMenu.Item value="resources">',
    `      <NavigationMenu.Trigger>${t.resources}</NavigationMenu.Trigger>`,
    "      <NavigationMenu.Content>",
    "        <ul>",
    ...[
      [t.guides, t.guidesBody],
      [t.changelog, t.changelogBody],
    ].flatMap(([title, body]) => [
      "          <li>",
      ...card(title ?? "", body ?? "").map((l) => `            ${l}`),
      "          </li>",
    ]),
    "        </ul>",
    "      </NavigationMenu.Content>",
    "    </NavigationMenu.Item>",
    "    <NavigationMenu.Item>",
    `      <NavigationMenu.Link href="/pricing">${t.pricing}</NavigationMenu.Link>`,
    "    </NavigationMenu.Item>",
    "  </NavigationMenu.List>",
    ...portal.map((l) => `  ${l}`),
    "</NavigationMenu.Root>",
  ];
};

export const navigationMenuDefinition = defineComponent({
  item: "navigation-menu",
  imports: ["NavigationMenu"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Dua item dengan panel dan satu link. Satu panel dipakai bersama: ia berpindah ke trigger berikutnya, berubah ukuran mengikuti isinya, dan isinya meluncur dari arah datangnya pointer. Portal kosong menggambar Positioner, Popup, dan Viewport.",
        en: "Two items with a panel and a link. One panel is shared: it moves to the next trigger, resizes to its content, and the content slides in from the side the pointer came from. An empty Portal draws the Positioner, Popup, and Viewport.",
      },
      uses: ["NavigationMenu"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [exampleFile("SiteNavigation", imports(setup), navigation(lang))],
    },
    {
      id: "arrow",
      title: { id: "Dengan panah", en: "With an arrow" },
      description: {
        id: "Arrow di dalam Popup, sebelum Viewport, menunjuk trigger yang terbuka dan ikut bergeser saat panel berpindah.",
        en: "An Arrow in the Popup, before the Viewport, points at the open trigger and moves with it as the panel moves.",
      },
      uses: ["NavigationMenu"],
      demo: (lang) => <WithArrow lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SiteNavigationArrow",
          imports(setup),
          navigation(lang, [
            "<NavigationMenu.Portal>",
            "  <NavigationMenu.Positioner>",
            "    <NavigationMenu.Popup>",
            "      <NavigationMenu.Arrow />",
            "      <NavigationMenu.Viewport />",
            "    </NavigationMenu.Popup>",
            "  </NavigationMenu.Positioner>",
            "</NavigationMenu.Portal>",
          ]),
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Root mengatur tinggi trigger dan tipe panel: 32, 40, atau 48px. Panel di portal membacanya dari Root.",
        en: "size on the Root sets the triggers' height and the panel's type: 32, 40, or 48px. The panel in the portal reads it from the Root.",
      },
      uses: ["NavigationMenu"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => {
        const t = TEXT[lang];
        return [
          exampleFile(
            "NavigationSizes",
            imports(setup),
            SIZES.flatMap((size) => [
              `<NavigationMenu.Root size="${size}" aria-label="${t.nav}">`,
              "  <NavigationMenu.List>",
              '    <NavigationMenu.Item value="resources">',
              `      <NavigationMenu.Trigger>${t.resources}</NavigationMenu.Trigger>`,
              "      <NavigationMenu.Content>",
              "        {/* links */}",
              "      </NavigationMenu.Content>",
              "    </NavigationMenu.Item>",
              "  </NavigationMenu.List>",
              "  <NavigationMenu.Portal />",
              "</NavigationMenu.Root>",
            ]),
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
      selector: ".demo-navigation-menu-specimen",
      note: {
        id: "Elemen nav yang memuat list, dan lewat konteks, panel di portal. size mengatur tinggi trigger dan tipe panel. Inspect menandai kotak yang memuat keduanya.",
        en: "The nav that holds the list and, through context, the panel in the portal. size sets the triggers' height and the panel's type. Inspect outlines the box that holds both.",
      },
    },
    {
      name: "List",
      selector: ".ow-navigation-menu__list",
      note: {
        id: "Baris item; membungkus di layar sempit agar semua trigger tetap terjangkau.",
        en: "The row of items; it wraps on a narrow screen so every trigger stays reachable.",
      },
    },
    {
      name: "Trigger",
      selector: '[data-demo="products"]',
      note: {
        id: "Tombol ghost dengan geometri Button; digambar bersama Icon chevron yang berputar saat panelnya terbuka.",
        en: "A ghost button on Button's geometry; it draws its chevron Icon, which turns over while its panel is open.",
      },
      tokens: { "--ow-hover": "--_hover", "--ow-pressed-bg": "--_open", "--ow-focus": "--_focus" },
    },
    {
      name: "Popup",
      selector: ".ow-navigation-menu__popup",
      note: {
        id: "Panel bersama: material raised dengan bayangan popup. Base UI mengukur ukurannya mengikuti konten; OwsemUI menganimasikannya.",
        en: "The shared panel: the raised material with the popup shadow. Base UI sizes it to the content; OwsemUI animates it.",
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
      selector: ".ow-navigation-menu__arrow",
      note: {
        id: "Panah opsional ke trigger yang terbuka, dengan tepi dan bayangan panel.",
        en: "An optional arrow toward the open trigger, with the panel's edge and shadow.",
      },
    },
    {
      name: "Viewport",
      selector: ".ow-navigation-menu__viewport",
      note: {
        id: "Jendela yang memotong konten saat meluncur; panel berubah ukuran mengikuti isinya.",
        en: "The window that clips the contents as they slide; the panel resizes to what it holds.",
      },
    },
    {
      name: "Content",
      selector: ".ow-navigation-menu__content",
      note: {
        id: "Isi satu item. Meluncur masuk dari sisi trigger asal pointer, hanya dengan transform dan opacity; Glide menyalakan link-nya.",
        en: "One item's content. It slides in from the side of the trigger the pointer came from, on transform and opacity only; Glide lights its links.",
      },
    },
    {
      name: "Link",
      selector: '[data-demo="card"]',
      note: {
        id: "Link kartu: judul, lalu teks muted. Glide menyalakan yang ada di bawah pointer.",
        en: "A card link: a title, then muted text. Glide lights the one under the pointer.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-muted": "--_muted", "--ow-hover": "--_hover" },
    },
  ],
});

export default function NavigationMenuPage(props: ExamplePageProps): ReactNode {
  return <ComponentPage definition={navigationMenuDefinition} {...props} />;
}
