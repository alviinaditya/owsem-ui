"use client";

import { TableOfContents } from "owsem-ui/owsem";
import { type CSSProperties, type MouseEvent, useEffect, useRef } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const SECTIONS = [
  "install",
  "theming",
  "light-dark",
  "recolor",
  "components",
  "changelog",
] as const;
type Section = (typeof SECTIONS)[number];
// Sub-sections, under the section before them.
const NESTED: ReadonlySet<Section> = new Set(["light-dark", "recolor"]);
const TREE = SECTIONS.reduce<{ id: Section; nested: Section[] }[]>((tree, id) => {
  if (NESTED.has(id)) tree.at(-1)?.nested.push(id);
  else tree.push({ id, nested: [] });
  return tree;
}, []);
const FLAT = SECTIONS.filter((id) => !NESTED.has(id)).map((id) => ({
  id,
  nested: [] as Section[],
}));

const TEXT = {
  id: {
    toc: "Di halaman ini",
    article: "Contoh artikel",
    title: "Memulai",
    intro:
      "Pasang paketnya, pilih tema, lalu pakai komponen pertama Anda. Setiap bagian di bawah ini singkat, dan daftar di sampingnya ikut membaca.",
    sections: {
      install: [
        "Instalasi",
        "Tambahkan paket dengan package manager Anda, lalu impor gayanya sekali, di akar aplikasi. Semua komponen membaca token tema yang sama, jadi tidak ada lagi yang perlu diatur.",
      ],
      theming: [
        "Tema",
        "Tema mengatur nilai token; komponen hanya membacanya. Mengganti tema tidak pernah menyentuh CSS komponen.",
      ],
      "light-dark": [
        "Terang dan gelap",
        "Tanpa atribut, token mengikuti pengaturan sistem. Pasang data-theme di elemen mana pun untuk memaksakan tema bagi semua isinya.",
      ],
      recolor: [
        "Mewarnai ulang dengan token tema",
        "Pasang token di sebuah elemen untuk mewarnai ulang isinya, misalnya aksen di sidebar. Satu token mengubah setiap komponen yang membacanya.",
      ],
      components: [
        "Komponen",
        "Setiap komponen punya halamannya sendiri: pratinjau langsung di samping dokumentasinya.",
      ],
      changelog: ["Changelog", "Setiap rilis, yang terbaru di atas."],
    },
  },
  en: {
    toc: "On this page",
    article: "Sample article",
    title: "Getting started",
    intro:
      "Install the package, pick a theme, and use your first component. Each part below is short, and the list beside it reads along.",
    sections: {
      install: [
        "Installation",
        "Add the package with your package manager, then import its styles once, at the root of your app. Components read the same theme tokens, so there is nothing else to set up.",
      ],
      theming: [
        "Theming",
        "Themes set the token values; components only read them. Switching themes never touches component CSS.",
      ],
      "light-dark": [
        "Light and dark",
        "Without an attribute, tokens follow the system setting. Set data-theme on any element to force a theme for everything inside it.",
      ],
      recolor: [
        "Recoloring with theme tokens",
        "Set a token on an element to recolor what is inside it, such as the accent of a sidebar. One token changes every component that reads it.",
      ],
      components: [
        "Components",
        "Each component has its own page: a live preview beside its docs.",
      ],
      changelog: ["Changelog", "Every release, newest first."],
    },
  },
} satisfies Record<Lang, unknown>;

const REDUCED = "(prefers-reduced-motion: reduce)";
// Where a link takes its section: just under the article's top edge.
const ABOVE = 8;

/** Scrolls the article to a section. */
const scrollFor = (article: HTMLElement, id: string, prefix: string) => {
  const heading = id ? article.querySelector<HTMLElement>(`#${prefix}-${id}`) : null;
  return heading ? heading.offsetTop - ABOVE : 0;
};

/**
 * A small article that scrolls in its frame, beside its table of contents. A link scrolls the
 * article, not the page. `at` puts the article at a section when it mounts.
 */
function Demo({
  lang,
  style,
  at = "",
  flat = false,
  prefix = "toc",
}: {
  lang: Lang;
  style?: CSSProperties;
  at?: string;
  flat?: boolean;
  prefix?: string;
}) {
  const t = TEXT[lang];
  const article = useRef<HTMLElement>(null);
  const tree = flat ? FLAT : TREE;
  const sections = flat ? FLAT.map(({ id }) => id) : SECTIONS;

  useEffect(() => {
    const el = article.current;
    if (el && at) el.scrollTop = scrollFor(el, at, prefix);
  }, [at, prefix]);

  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    article.current?.scrollTo({
      top: scrollFor(article.current, event.currentTarget.hash.slice(prefix.length + 2), prefix),
      behavior: matchMedia(REDUCED).matches ? "auto" : "smooth",
    });
  };

  const link = (id: Section) => (
    <TableOfContents.Link href={`#${prefix}-${id}`} onClick={go}>
      {t.sections[id][0]}
    </TableOfContents.Link>
  );

  return (
    <div className="demo-toc" style={style}>
      <div className="demo-toc-frame">
        <article
          ref={article}
          className="demo-toc-article"
          aria-label={t.article}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable, so the keyboard can scroll it
          tabIndex={0}
        >
          <p className="demo-toc-title">{t.title}</p>
          <p>{t.intro}</p>
          {sections.map((id) => {
            const Heading = !flat && NESTED.has(id) ? "h4" : "h3";
            return (
              <section key={id}>
                <Heading id={`${prefix}-${id}`}>{t.sections[id][0]}</Heading>
                <p>{t.sections[id][1]}</p>
              </section>
            );
          })}
        </article>
      </div>
      <TableOfContents.Root aria-label={t.toc} className="demo-toc-nav">
        <p className="demo-toc-heading">{t.toc}</p>
        <TableOfContents.List>
          {tree.map(({ id, nested }) => (
            <TableOfContents.Item key={id} data-demo={id}>
              {link(id)}
              {nested.length ? (
                <TableOfContents.List>
                  {nested.map((sub) => (
                    <TableOfContents.Item key={sub}>{link(sub)}</TableOfContents.Item>
                  ))}
                </TableOfContents.List>
              ) : null}
            </TableOfContents.Item>
          ))}
        </TableOfContents.List>
      </TableOfContents.Root>
    </div>
  );
}

const RECOLOR = { "--ow-accent": "var(--ow-good)", "--ow-line": "var(--ow-edge)" } as CSSProperties;

const from = (setup: TokenSetup) =>
  isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/table-of-contents";

const imp = (setup: TokenSetup) => [`import { TableOfContents } from "${from(setup)}";`];

const link = (lang: Lang, id: Section, indent = "") =>
  `${indent}<TableOfContents.Item>\n${indent}  <TableOfContents.Link href="#${id}">${TEXT[lang].sections[id][0]}</TableOfContents.Link>\n${indent}</TableOfContents.Item>`;

/** The flat list as written out, one link per section. */
const flatBody = (lang: Lang, rootProps = "") => [
  `<TableOfContents.Root aria-label="${TEXT[lang].toc}"${rootProps}>`,
  "  <TableOfContents.List>",
  ...FLAT.flatMap(({ id }) => link(lang, id, "    ").split("\n")),
  "  </TableOfContents.List>",
  "</TableOfContents.Root>",
];

export const tableOfContentsDefinition = defineComponent({
  item: "table-of-contents",
  imports: ["TableOfContents"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Daftar bagian dengan sub-bagian bersarang; rail menikung mengikuti tingkatnya, dan penanda meluncur di atasnya ke bagian yang sedang dibaca.",
        en: "A list of sections with nested sub-sections; the rail bends with the levels, and a marker travels along it to the section being read.",
      },
      uses: ["TableOfContents"],
      demo: (lang) => <Demo lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "OnThisPage",
          [...imp(setup)],
          [
            `<TableOfContents.Root aria-label="${TEXT[lang].toc}">`,
            "  <TableOfContents.List>",
            ...TREE.flatMap(({ id, nested }) => [
              "    <TableOfContents.Item>",
              `      <TableOfContents.Link href="#${id}">${TEXT[lang].sections[id][0]}</TableOfContents.Link>`,
              ...(nested.length
                ? [
                    "      <TableOfContents.List>",
                    ...nested.flatMap((sub) => link(lang, sub, "        ").split("\n")),
                    "      </TableOfContents.List>",
                  ]
                : []),
              "    </TableOfContents.Item>",
            ]),
            "  </TableOfContents.List>",
            "</TableOfContents.Root>",
          ],
        ),
      ],
    },
    {
      id: "flat",
      title: { id: "Datar", en: "Flat" },
      description: {
        id: "Satu tingkat saja: cocok untuk halaman pendek.",
        en: "A single level: enough for a short page.",
      },
      uses: ["TableOfContents"],
      demo: (lang) => <Demo lang={lang} flat prefix="flat" />,
      code: (setup, lang) => [exampleFile("OnThisPage", imp(setup), flatBody(lang))],
    },
    {
      id: "recolor",
      title: { id: "Warna", en: "Recolor" },
      description: {
        id: "Pasang --ow-accent dan --ow-line di navnya untuk mewarnai penanda dan rail.",
        en: "Set --ow-accent and --ow-line on the nav to recolor the marker and the rail.",
      },
      uses: ["TableOfContents"],
      demo: (lang) => <Demo lang={lang} style={RECOLOR} prefix="recolor" at="theming" />,
      code: (setup, lang) => {
        const token = `--${setup.prefix}`;
        return [
          exampleFile("OnThisPage", imp(setup), flatBody(lang, ' className="on-this-page"')),
          {
            name: "on-this-page.css",
            code: [
              setup.mode === "isolated"
                ? ".on-this-page.ow-table-of-contents {"
                : ".on-this-page {",
              `  ${token}-accent: var(${token}-good);`,
              `  ${token}-line: var(${token}-edge);`,
              "}",
            ].join("\n"),
          },
        ];
      },
    },
  ],
  anatomy: {
    specimen: (lang) => <Demo lang={lang} at="light-dark" prefix="spec" />,
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-table-of-contents",
      note: {
        id: "nav yang melacak bagian yang sedang dibaca dan menggambar rail serta penandanya. Token tema yang dipasang di sini hanya berlaku untuknya.",
        en: "The nav: it tracks the section being read and draws the rail and the marker. Theme tokens set here apply to it alone.",
      },
      tokens: {
        "--ow-accent": "--_marker",
        "--ow-line": "--_rail",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "List",
      selector: ".ow-table-of-contents__list",
      note: {
        id: "Daftar bagian. List bersarang, di dalam Item, menjorok ke dalam, dan rail menikung masuk bersamanya.",
        en: "A list of sections. A nested List, inside an Item, indents, and the rail bends in with it.",
      },
    },
    {
      name: "Item",
      selector: '[data-demo="theming"]',
      note: {
        id: "Satu bagian: Link-nya, plus List untuk sub-bagiannya.",
        en: "One section: its Link, and a List for its sub-sections.",
      },
    },
    {
      name: "Link",
      selector: 'a[href="#spec-light-dark"]',
      note: {
        id: "Link ke bagian lewat hash-nya. Link yang aktif mendapat aria-current dan data-current.",
        en: "A link to a section by its hash. The current one gets aria-current and data-current.",
      },
    },
    {
      name: "Rail",
      selector: ".ow-table-of-contents__rail",
      note: {
        id: "Satu SVG di atas nav, digambar Root: satu path melewati semua link, dengan tikungan di tempat tingkatnya berubah.",
        en: "One SVG over the nav, drawn by Root: a single path through the links, with a bend where the level changes.",
      },
    },
    {
      name: "Marker",
      selector: ".ow-table-of-contents__marker",
      note: {
        id: "Garis aksen 2px di atas rail, sepanjang bagian rail di samping link yang aktif; berjalan di sepanjang rail, melewati tikungannya, ke link berikutnya.",
        en: "The 2px accent stroke on the rail, along the current link's part of it; it travels along the rail, bends included, to the next link.",
      },
    },
  ],
});

export default function TableOfContentsPage(props: ExamplePageProps) {
  return <ComponentPage definition={tableOfContentsDefinition} {...props} />;
}
