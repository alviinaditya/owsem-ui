"use client";

import { animate } from "motion/react";
import { TableOfContents } from "owsem-ui/owsem";
import { type CSSProperties, type MouseEvent, useEffect, useRef } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript, type ScriptStage } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

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

const TEXT = {
  id: {
    toc: "Di halaman ini",
    article: "Contoh artikel",
    title: "Memulai",
    intro:
      "Pasang paketnya, pilih tema, lalu pakai komponen pertama Anda. Setiap bagian di bawah ini singkat, dan daftar di sampingnya ikut membaca.",
    line: "Garis baca",
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
        "Setiap komponen punya Lab: stage langsung di samping dokumentasinya.",
      ],
      changelog: ["Changelog", "Setiap rilis, yang terbaru di atas."],
    },
    top: "Di awal",
    nested: "Di sub-bagian",
    end: "Di akhir",
    light: "Terang",
    dark: "Gelap",
  },
  en: {
    toc: "On this page",
    article: "Sample article",
    title: "Getting started",
    intro:
      "Install the package, pick a theme, and use your first component. Each part below is short, and the list beside it reads along.",
    line: "Reading line",
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
      components: ["Components", "Each component has a Lab: a live stage beside its docs."],
      changelog: ["Changelog", "Every release, newest first."],
    },
    top: "At the top",
    nested: "In a sub-section",
    end: "At the end",
    light: "Light",
    dark: "Dark",
  },
} satisfies Record<Lang, unknown>;

const REDUCED = "(prefers-reduced-motion: reduce)";
// Where a link takes its section: just under the article's top edge.
const ABOVE = 8;

/** Scrolls the article to a section, or to its very end. */
const scrollFor = (article: HTMLElement, at: string, prefix: string) => {
  if (at === "end") return article.scrollHeight - article.clientHeight;
  const heading = at ? article.querySelector<HTMLElement>(`#${prefix}-${at}`) : null;
  return heading ? heading.offsetTop - ABOVE : 0;
};

/**
 * A small article that scrolls in its frame, beside its table of contents. A link scrolls the
 * article, not the page.
 */
function Demo({
  lang,
  style,
  at = "",
  line = false,
  prefix = "toc",
  compact = false,
}: {
  lang: Lang;
  style?: CSSProperties;
  at?: string;
  line?: boolean;
  prefix?: string;
  compact?: boolean;
}) {
  const t = TEXT[lang];
  const article = useRef<HTMLElement>(null);
  // Where a scene last put the article: the visitor's own scrolling stays until a scene moves it.
  const placed = useRef("");

  useEffect(() => {
    const el = article.current;
    if (!el || at === placed.current) return;
    placed.current = at;
    el.scrollTop = scrollFor(el, at, prefix);
  }, [at, prefix]);

  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const el = article.current;
    if (!el) return;
    el.scrollTo({
      top: scrollFor(el, event.currentTarget.hash.slice(prefix.length + 2), prefix),
      behavior: matchMedia(REDUCED).matches ? "auto" : "smooth",
    });
  };

  const link = (id: Section) => (
    <TableOfContents.Link href={`#${prefix}-${id}`} onClick={go}>
      {t.sections[id][0]}
    </TableOfContents.Link>
  );

  return (
    <div className="demo-toc" data-compact={compact ? "" : undefined} style={style}>
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
          {SECTIONS.map((id) => {
            const Heading = NESTED.has(id) ? "h4" : "h3";
            return (
              <section key={id}>
                <Heading id={`${prefix}-${id}`}>{t.sections[id][0]}</Heading>
                <p>{t.sections[id][1]}</p>
              </section>
            );
          })}
        </article>
        {line ? (
          <div className="demo-toc-line" aria-hidden="true">
            <span className="demo-toc-line-label">{t.line}</span>
          </div>
        ) : null}
      </div>
      <TableOfContents.Root aria-label={t.toc} className="demo-toc-nav">
        <p className="demo-toc-heading">{t.toc}</p>
        <TableOfContents.List>
          {TREE.map(({ id, nested }) => (
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

const THEMES = ["light", "dark"] as const;
const ROWS = [
  { key: "top", at: "" },
  { key: "nested", at: "recolor" },
  { key: "end", at: "end" },
] as const;

/** Where the article is read (top, a sub-section, the end) by theme. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={ROWS.map((row) => ({
        label: t[row.key],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme}>
            <Demo lang={lang} at={row.at} prefix={`${theme}-${row.key}`} compact />
          </div>
        )),
      }))}
    />
  );
}

/**
 * Scrolls the article as a visitor's wheel would: the wheel event first, which lets go of a
 * clicked link, then the scroll. The event does not bubble, so the Lab keeps its own scene.
 */
async function wheel(stage: ScriptStage, article: HTMLElement, to: number, ms: number) {
  article.dispatchEvent(new WheelEvent("wheel", { deltaY: to - article.scrollTop }));
  if (!matchMedia(REDUCED).matches) {
    const move = animate(article.scrollTop, to, {
      duration: ms / 1000,
      ease: "easeInOut",
      onUpdate: (top) => {
        article.scrollTop = top;
      },
    });
    try {
      await stage.wait(ms);
    } finally {
      move.stop();
    }
  }
  article.scrollTop = to;
}

// Reads down the article a section at a time, to its end, then goes back to the top.
const reading: SceneScript = async (stage) => {
  const article = stage.get(".demo-toc-article");
  await stage.point(article);
  const line = article.clientHeight * 0.3;
  const max = article.scrollHeight - article.clientHeight;
  for (const heading of article.querySelectorAll<HTMLElement>("h3, h4")) {
    const to = Math.min(max, heading.offsetTop - line + 6);
    if (to <= article.scrollTop) continue;
    await wheel(stage, article, to, 800);
    await stage.wait(700);
    if (to >= max) break;
  }
  await wheel(stage, article, max, 600);
  await stage.wait(900);
  await wheel(stage, article, 0, 1100);
};

// Picks a sub-section, then Components, too short to reach the line: it stays current at the
// end. A wheel lets go of it, and the article goes back to the top.
const links: SceneScript = async (stage) => {
  for (const id of ["light-dark", "components"]) {
    await stage.click(stage.get(`a[href="#toc-${id}"]`));
    await stage.wait(1600);
  }
  const article = stage.get(".demo-toc-article");
  await stage.point(article);
  await wheel(stage, article, article.scrollTop - 40, 500);
  await stage.wait(1200);
  await wheel(stage, article, 0, 1000);
};

const initial = { marker: "", rail: "", at: "", line: "" };

const tableOfContentsLab = defineLab({
  initial,
  controls: [
    {
      key: "marker",
      type: "color",
      label: { id: "Penanda", en: "Marker" },
      token: "--ow-accent",
    },
    {
      key: "rail",
      type: "color",
      label: { id: "Rail", en: "Rail" },
      token: "--ow-line",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-table-of-contents",
      note: {
        id: "nav yang melacak bagian yang sedang dibaca dan memuat penandanya. Token tema yang dipasang di sini hanya berlaku untuknya.",
        en: "The nav: it tracks the section being read and holds the marker. Theme tokens set here apply to it alone.",
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
        id: "Daftar bagian. List teratas menggambar rail; list bersarang menjorok ke dalam.",
        en: "A list of sections. The top List draws the rail; a nested one indents.",
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
      selector: 'a[href="#toc-light-dark"]',
      note: {
        id: "Link ke bagian lewat hash-nya. Link yang aktif mendapat aria-current dan data-current.",
        en: "A link to a section by its hash. The current one gets aria-current and data-current.",
      },
    },
    {
      name: "Marker",
      selector: ".ow-table-of-contents__marker",
      note: {
        id: "Digambar oleh Root di atas rail, setinggi link yang aktif, dan meluncur ke link berikutnya.",
        en: "Drawn by Root on the rail, as tall as the current link, and slides to the next one.",
      },
    },
  ],

  demo(cfg, lang) {
    const style = {
      "--ow-accent": cfg.marker || undefined,
      "--ow-line": cfg.rail || undefined,
    } as CSSProperties;
    return <Demo lang={lang} style={style} at={cfg.at} line={cfg.line === "on"} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/table-of-contents";
    const custom = cfg.marker || cfg.rail;
    const scope = custom ? ' className="on-this-page"' : "";
    const usage = [
      `import { TableOfContents } from "${from}";`,
      "",
      "type Heading = { id: string; title: string; children?: Heading[] };",
      "",
      "export function OnThisPage({ headings }: { headings: Heading[] }) {",
      "  const list = (items: Heading[]) => (",
      "    <TableOfContents.List>",
      "      {items.map((heading) => (",
      "        <TableOfContents.Item key={heading.id}>",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the template literal is in the code shown
      "          <TableOfContents.Link href={`#${heading.id}`}>{heading.title}</TableOfContents.Link>",
      "          {heading.children?.length ? list(heading.children) : null}",
      "        </TableOfContents.Item>",
      "      ))}",
      "    </TableOfContents.List>",
      "  );",
      "  return (",
      `    <TableOfContents.Root aria-label="On this page"${scope}>`,
      "      {list(headings)}",
      "    </TableOfContents.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "on-this-page.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}`;
      // Isolated values sit on each nav's root, so set them there too.
      const lines = [
        setup.mode === "isolated" ? ".on-this-page.ow-table-of-contents {" : ".on-this-page {",
        ...(cfg.marker ? [`  ${token}-accent: ${cfg.marker};`] : []),
        ...(cfg.rail ? [`  ${token}-line: ${cfg.rail};`] : []),
        "}",
      ];
      files.push({ name: "on-this-page.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    reading: { cfg: { line: "on" }, play: reading },
    links: { play: links },
    anatomy: { inspect: true, cfg: { at: "light-dark" } },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true, cfg: { at: "theming" } },
    ship: { code: true },
  },
});

export default function TableOfContentsLab(props: LabProps) {
  return <LabShell lab={tableOfContentsLab} {...props} />;
}
