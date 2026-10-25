import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "owsem-ui/owsem";
import { type ComponentProps, isValidElement } from "react";
import { getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { Icon, type IconName } from "./icons/icon";

// Each language's icon, and its name for a block without a title of its own.
const LANGUAGES: Record<string, { icon: IconName; name: string }> = {
  tsx: { icon: "atom", name: "TSX" },
  jsx: { icon: "atom", name: "JSX" },
  ts: { icon: "file-code", name: "TypeScript" },
  js: { icon: "file-code", name: "JavaScript" },
  css: { icon: "palette", name: "CSS" },
  sh: { icon: "terminal", name: "Terminal" },
  bash: { icon: "terminal", name: "Terminal" },
  html: { icon: "code-xml", name: "HTML" },
  json: { icon: "braces", name: "JSON" },
};

/** A highlighted block's language, from its code's `language-*` class (source.config.ts). */
function languageOf(children: unknown): string | undefined {
  if (!isValidElement<{ className?: string }>(children)) return undefined;
  return /\blanguage-(\S+)/.exec(children.props.className ?? "")?.[1];
}

/** MDX code blocks as Code Blocks: the language's icon, the meta's title or its name, and Copy. */
function codeBlock(lang: Lang) {
  const { copy, copied } = getDictionary(lang).lab;
  return function Pre({ title, style, tabIndex: _, children, ...props }: ComponentProps<"pre">) {
    const language = languageOf(children) ?? "text";
    const { icon, name } = LANGUAGES[language] ?? {
      icon: "file-text",
      name: language.toUpperCase(),
    };
    // The panel is the card; the code keeps only its text color. The panel takes focus too.
    const { backgroundColor: __, ...color } = style ?? {};
    return (
      <CodeBlock.Root className="docs-code">
        <CodeBlock.Header>
          <CodeBlock.Title icon={<Icon name={icon} />}>{title ?? name}</CodeBlock.Title>
          <CodeBlock.Copy labels={{ copy, copied }} />
        </CodeBlock.Header>
        <CodeBlock.Panel>
          <pre {...props} style={color}>
            {children}
          </pre>
        </CodeBlock.Panel>
      </CodeBlock.Root>
    );
  };
}

export function getMDXComponents(lang: Lang, components?: MDXComponents): MDXComponents {
  return { pre: codeBlock(lang), ...components };
}
