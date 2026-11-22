"use client";

import { CodeBlock } from "owsem-ui/owsem";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Highlighted } from "@/components/component-page/highlighted";
import { Icon, type IconName } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: { files: "File", copy: "Salin", copied: "Tersalin" },
  en: { files: "Files", copy: "Copy", copied: "Copied" },
} satisfies Record<Lang, Record<string, string>>;

const LONG = `<Button variant="outline" size="sm" startIcon={<Copy />} onClick={() => copy(url)}>Copy link</Button>`;

const SNIPPETS = [
  {
    value: "tsx",
    name: "Button.tsx",
    icon: "atom",
    code: [
      'import { Button } from "owsem-ui/base";',
      "",
      "export function Save() {",
      "  return <Button>Save</Button>;",
      "}",
    ].join("\n"),
  },
  {
    value: "css",
    name: "theme.css",
    icon: "palette",
    code: [":root {", "  --ow-accent: #7c6ab8;", "  --ow-radius: 10px;", "}"].join("\n"),
  },
  {
    value: "sh",
    name: "Terminal",
    icon: "terminal",
    code: "pnpm add owsem-ui",
  },
] as const satisfies readonly { value: string; name: string; icon: IconName; code: string }[];

/** One snippet's code: highlighted, or a shell command whose prompt CSS draws, so Copy skips it. */
function Code({
  snippet,
  long,
}: {
  snippet: (typeof SNIPPETS)[number];
  long?: boolean | undefined;
}) {
  if (snippet.value === "sh") {
    return (
      <pre>
        <code className="demo-code-shell">
          <span className="tk-fn">pnpm</span> add <span className="tk-str">owsem-ui</span>
        </code>
      </pre>
    );
  }
  const code = long && snippet.value === "tsx" ? `${snippet.code}\n\n${LONG}` : snippet.code;
  return <Highlighted file={{ name: snippet.name, code }} />;
}

/** Snippets in tabs: the icon morphs and the height glides as another file comes on show. */
function Tabbed({ lang, label }: { lang: Lang; label?: boolean }) {
  const t = TEXT[lang];
  return (
    <CodeBlock.Root className="demo-code" defaultValue="tsx">
      <CodeBlock.Header>
        <CodeBlock.List aria-label={t.files}>
          {SNIPPETS.map((snippet) => (
            <CodeBlock.Tab
              key={snippet.value}
              value={snippet.value}
              icon={<Icon name={snippet.icon} />}
            >
              {snippet.name}
            </CodeBlock.Tab>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy labels={{ copy: t.copy, copied: t.copied }} showLabel={label} />
      </CodeBlock.Header>
      {SNIPPETS.map((snippet) => (
        <CodeBlock.Panel key={snippet.value} value={snippet.value}>
          <Code snippet={snippet} />
        </CodeBlock.Panel>
      ))}
    </CodeBlock.Root>
  );
}

/** One file: an icon and its name, then the code. */
function Single({ lang, long }: { lang: Lang; long?: boolean }) {
  const t = TEXT[lang];
  const [first] = SNIPPETS;
  return (
    <CodeBlock.Root className="demo-code">
      <CodeBlock.Header>
        <CodeBlock.Title icon={<Icon name={first.icon} />}>{first.name}</CodeBlock.Title>
        <CodeBlock.Copy labels={{ copy: t.copy, copied: t.copied }} />
      </CodeBlock.Header>
      <CodeBlock.Panel>
        <Code snippet={first} long={long} />
      </CodeBlock.Panel>
    </CodeBlock.Root>
  );
}

/** Any other setup comes from the owsem CLI, which copies the component into the project. */
const importLine = (setup: TokenSetup) =>
  `import { CodeBlock } from "${
    isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/code-block"
  }";`;

const tabbedBody = (copy: string) => [
  '<CodeBlock.Root defaultValue="tsx">',
  "  <CodeBlock.Header>",
  '    <CodeBlock.List aria-label="Files">',
  '      <CodeBlock.Tab value="tsx" icon={<Atom />}>Button.tsx</CodeBlock.Tab>',
  '      <CodeBlock.Tab value="css" icon={<Palette />}>theme.css</CodeBlock.Tab>',
  '      <CodeBlock.Tab value="sh" icon={<Terminal />}>Terminal</CodeBlock.Tab>',
  "    </CodeBlock.List>",
  `    ${copy}`,
  "  </CodeBlock.Header>",
  '  <CodeBlock.Panel value="tsx">{code.tsx}</CodeBlock.Panel>',
  '  <CodeBlock.Panel value="css">{code.css}</CodeBlock.Panel>',
  '  <CodeBlock.Panel value="sh">{code.sh}</CodeBlock.Panel>',
  "</CodeBlock.Root>",
];

const tabbedFile = (setup: TokenSetup, name: string, copy: string) => ({
  ...exampleFile(
    name,
    [
      importLine(setup),
      'import { Atom, Palette, Terminal } from "lucide-react";',
      'import type { ReactNode } from "react";',
    ],
    tabbedBody(copy),
  ),
});

const singleFile = (setup: TokenSetup, name: string) =>
  exampleFile(
    name,
    [importLine(setup), 'import { Atom } from "lucide-react";'],
    [
      "<CodeBlock.Root>",
      "  <CodeBlock.Header>",
      "    <CodeBlock.Title icon={<Atom />}>Button.tsx</CodeBlock.Title>",
      "    <CodeBlock.Copy />",
      "  </CodeBlock.Header>",
      "  <CodeBlock.Panel>{code}</CodeBlock.Panel>",
      "</CodeBlock.Root>",
    ],
  );

export const codeBlockDefinition = defineComponent({
  item: "code-block",
  imports: ["CodeBlock"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Satu tab per file: ikon di depan berubah bentuk, tinggi kotak meluncur ke kode berikutnya, dan Salin menyalin yang tampil.",
        en: "One tab per file: the leading icon morphs, the box's height glides to the next code, and Copy copies what is on show.",
      },
      uses: ["CodeBlock"],
      demo: (lang) => <Tabbed lang={lang} />,
      code: (setup) => [tabbedFile(setup, "ButtonSnippets", "<CodeBlock.Copy />")],
    },
    {
      id: "single",
      title: { id: "Satu file", en: "One file" },
      description: {
        id: "Tanpa tab, Title menamai kodenya dan ikon tetap diam.",
        en: "Without tabs, a Title names the code and the icon stays still.",
      },
      uses: ["CodeBlock"],
      demo: (lang) => <Single lang={lang} />,
      code: (setup) => [singleFile(setup, "FileSnippet")],
    },
    {
      id: "label",
      title: { id: "Label Salin", en: "Copy label" },
      description: {
        id: "showLabel menaruh kata Salin di samping ikon, tanpa Tooltip.",
        en: "showLabel puts the word Copy beside the icon, with no Tooltip.",
      },
      uses: ["CodeBlock"],
      demo: (lang) => <Tabbed lang={lang} label />,
      code: (setup) => [tabbedFile(setup, "LabeledSnippets", "<CodeBlock.Copy showLabel />")],
    },
    {
      id: "long",
      title: { id: "Baris panjang", en: "Long line" },
      description: {
        id: "Baris yang lebih panjang dari kotaknya digulir ke samping di dalam panel; keyboard bisa menggulirnya.",
        en: "A line longer than the box scrolls sideways inside the panel, and the keyboard can scroll it.",
      },
      uses: ["CodeBlock"],
      demo: (lang) => <Single lang={lang} long />,
      code: (setup) => [singleFile(setup, "LongSnippet")],
    },
  ],
  anatomy: {
    specimen: (lang) => <Tabbed lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-code-block",
      note: {
        id: "Satu permukaan: isian panel dengan bayangan permukaan, tanpa tepi. Dengan tab, ia root Tabs Base UI.",
        en: "One surface: the panel fill with the surface shadow and no edge. With tabs, Base UI's Tabs root.",
      },
      tokens: {
        "--ow-panel": "--_panel",
        "--ow-surface-shadow": "--_shadow",
        "--ow-radius": "--_corner",
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Icon",
      selector: ".ow-code-block__icon",
      note: {
        id: "Satu ikon di depan, digambar oleh Title atau List. Ia berubah (Icon Morph) saat tab berganti.",
        en: "The one leading icon, drawn by Title or List. It morphs (Icon Morph) as the tab changes.",
      },
    },
    {
      name: "List",
      selector: ".ow-code-block__list",
      note: {
        id: "Tab-nya, list Tabs Base UI: panah memilih sambil bergerak. Bergulir ke samping kalau tidak muat.",
        en: "The tabs, Base UI's Tabs list: the arrows pick as they move. Scrolls sideways when it does not fit.",
      },
    },
    {
      name: "Tab",
      selector: '.ow-code-block__tab[aria-selected="true"]',
      note: {
        id: "Satu snippet. Thumb ada di bawah yang aktif; yang disorot diterangi Glide.",
        en: "One snippet. The thumb sits under the active one; the hovered one is lit by Glide.",
      },
    },
    {
      name: "Copy",
      selector: ".ow-code-block__copy",
      note: {
        id: "Copy Button: menyalin snippet yang tampil, atau value-nya sendiri. Ikon yang selalu terlihat, dinamai Tooltip-nya.",
        en: "Copy Button: copies the snippet on show, or its own value. An icon, always in view, named by its Tooltip.",
      },
    },
    {
      name: "Panel",
      selector: ".ow-code-block__panel",
      note: {
        id: "Kodenya, di bawah header pada permukaan yang sama, tanpa isian sendiri. Ia bergulir ke samping di dalamnya.",
        en: "The code, under the header on the same surface, with no fill of its own. It scrolls sideways inside.",
      },
    },
  ],
});

export default function CodeBlockPage(props: ExamplePageProps) {
  return <ComponentPage definition={codeBlockDefinition} {...props} />;
}
