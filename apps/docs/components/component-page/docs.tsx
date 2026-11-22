"use client";

import { Tabs } from "owsem-ui/base";
import { CodeBlock } from "owsem-ui/owsem";
import { useState } from "react";
import { importPath } from "@/lib/examples";
import { Icon } from "../icons/icon";
import { CodeLine, InstallTabs } from "../install";
import { TokenChip, useTokenSetup } from "../token-setup";
import { usePage } from "./component-page";
import { Highlighted } from "./highlighted";
import { loadManual, ManualInstall } from "./manual-install";

/**
 * The MDX components of a component page's Docs (content/components/<lang>/<name>.mdx): each one
 * reads the page, so its examples, parts, and commands are the preview's own.
 */

/** A part's name in the anatomy table: it outlines the part on the preview (Inspect). */
export function Part({ name }: { name: string }) {
  const page = usePage();
  if (!page.definition.parts.some((part) => part.name === name)) {
    throw new Error(`Part "${name}" is not in this component's parts (examples/).`);
  }
  return (
    <button
      type="button"
      className="cp-part"
      aria-pressed={page.inspectedPart === name}
      title={page.common.inspectPart}
      onClick={() => page.inspectPart(name)}
    >
      {name}
    </button>
  );
}

/** Turns Inspect on or off; the CSS lays it on the row of the heading just above it. */
export function InspectButton() {
  const page = usePage();
  return (
    <div className="cp-inspect">
      <button
        type="button"
        className="cp-ghost cp-inspect__button"
        aria-pressed={page.inspecting}
        onClick={() => page.setInspect(!page.inspecting)}
      >
        <Icon name="scan" />
        {page.labels.inspect}
      </button>
    </div>
  );
}

/** The install commands and the import, as in the toolbar's Install popover. */
export function Install() {
  const page = usePage();
  const setup = useTokenSetup();
  const { definition, common } = page;
  const names = definition.imports.join(", ");
  const [tab, setTab] = useState<string | number | null>("command");
  // The Manual files load on the first open; hovering or focusing the tab starts it early.
  const [opened, setOpened] = useState(false);
  const warm = () => void loadManual(page.install.name).catch(() => {});
  return (
    <Tabs.Root
      value={tab}
      onValueChange={(next) => {
        setTab(next);
        if (next === "manual") setOpened(true);
      }}
      className="cp-docs-install"
    >
      <Tabs.List size="sm" aria-label={page.labels.installMode}>
        <Tabs.Tab value="command">{page.labels.installCommand}</Tabs.Tab>
        <Tabs.Tab value="manual" onPointerEnter={warm} onFocus={warm}>
          {page.labels.installManual}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="command" keepMounted className="cp-docs-install__panel">
        <InstallTabs item={definition.item} labels={common} />
        <CodeLine
          text={`import { ${names} } from "${importPath(setup, definition.item)}";`}
          labels={common}
          lang="tsx"
        />
      </Tabs.Panel>
      <Tabs.Panel value="manual" keepMounted className="cp-docs-install__panel">
        <ManualInstall active={opened} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

/** The token setup chip, in the page's language. */
export function Tokens() {
  return <TokenChip lang={usePage().lang} />;
}

/** Every example: its title, a sentence, a button that shows it in the preview, and its code, on one card. */
export function Examples() {
  const page = usePage();
  const setup = useTokenSetup();
  const { lang, labels, common, definition } = page;
  return (
    <div className="cp-examples">
      {definition.examples.map((example) => (
        <section key={example.id} id={`example-${example.id}`} className="cp-example">
          <div className="cp-example__head" data-active={page.activeId === example.id || undefined}>
            <div className="cp-example__row">
              <h3>{example.title[lang]}</h3>
              <button
                type="button"
                className="cp-ghost cp-example__show"
                aria-label={labels.showInPreview}
                aria-pressed={page.activeId === example.id}
                onClick={() => page.showExample(example.id)}
              >
                {page.activeId === example.id ? (
                  <>
                    <span className="cp-example__dot" aria-hidden="true" />
                    {labels.inPreview}
                  </>
                ) : (
                  <>
                    <Icon name="play" />
                    {labels.preview}
                  </>
                )}
              </button>
            </div>
            <p>{example.description[lang]}</p>
          </div>
          {example.code(setup, lang).map((file) => (
            <CodeBlock.Root key={file.name} className="docs-code">
              <CodeBlock.Header>
                <CodeBlock.Title icon={<Icon name="atom" />}>{file.name}</CodeBlock.Title>
                <CodeBlock.Copy
                  labels={{ copy: common.copy, copied: common.copied }}
                  value={file.code}
                />
              </CodeBlock.Header>
              <CodeBlock.Panel>
                <Highlighted file={file} />
              </CodeBlock.Panel>
            </CodeBlock.Root>
          ))}
        </section>
      ))}
    </div>
  );
}
