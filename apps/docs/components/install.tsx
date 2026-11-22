"use client";

import { Menu, ScrollArea, ToggleGroup } from "owsem-ui/base";
import { CodeBlock, CopyButton } from "owsem-ui/owsem";
import { Fragment, useSyncExternalStore } from "react";
import { type Dictionary, getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { PACKAGE_MANAGER_STORAGE_KEY } from "@/lib/theme";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";
import { HighlightedLine } from "./component-page/highlighted";
import { Icon } from "./icons/icon";
import { TokenChip, useTokenSetup } from "./token-setup";

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

const ADD: Record<PackageManager, string> = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
};
const DLX: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx",
};
const REGISTRY = "@owsem=https://owsem.dev/r/{name}.json";
const CLI = "owsem@latest";

type Labels = Dictionary["common"];

// The visitor's package manager, shared by every command on the page and kept across visits.
const listeners = new Set<() => void>();

function read(): PackageManager {
  try {
    const stored = localStorage.getItem(PACKAGE_MANAGER_STORAGE_KEY);
    return PACKAGE_MANAGERS.find((pm) => pm === stored) ?? "pnpm";
  } catch {
    return "pnpm";
  }
}

function choose(pm: PackageManager): void {
  try {
    localStorage.setItem(PACKAGE_MANAGER_STORAGE_KEY, pm);
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PACKAGE_MANAGER_STORAGE_KEY) listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

// The server cannot know the stored choice: null there, and pnpm in the commands.
const useStoredPackageManager = () => useSyncExternalStore(subscribe, read, () => null);
const usePackageManager = () => useStoredPackageManager() ?? "pnpm";

/**
 * A Toggle Group, one always pressed. None is pressed until hydration, while pnpm is raised in
 * CSS, so the thumb appears in place instead of sliding from pnpm to a stored choice.
 */
function Picker({ labels }: { labels: Labels }) {
  const current = useStoredPackageManager();
  return (
    <ToggleGroup.Root
      aria-label={labels.packageManager}
      className="docs-choice pm-picker"
      value={current ? [current] : []}
      onValueChange={([next]) => next && choose(next)}
    >
      {PACKAGE_MANAGERS.map((pm) => (
        <ToggleGroup.Item key={pm} value={pm} data-option={pm}>
          {pm}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/** A command's words, colored like the docs' code: the program, then the package or the item. */
function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => {
    const tone =
      i === 0 || word === "shadcn" || word === CLI
        ? "tk-fn"
        : word.startsWith("@owsem") || word === "owsem-ui"
          ? "tk-str"
          : undefined;
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: words are positional
      <span key={i} className={tone}>
        {i > 0 ? " " : ""}
        {word}
      </span>
    );
  });
}

const Prompt = () => (
  <span className="command-prompt" aria-hidden="true">
    $
  </span>
);

/** One shell command with its own Copy; the prompt is not part of the copied text. */
function Command({ text, labels }: { text: string; labels: Labels }) {
  return (
    <div className="command">
      {/* No Scrollbar: over one line of text it would only get in the way. */}
      <ScrollArea.Root className="command-text" fade>
        <ScrollArea.Viewport>
          <code>
            <Prompt />
            <Words text={text} />
          </code>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
      <CopyButton value={text} labels={labels} showLabel variant="ghost" size="sm" />
    </div>
  );
}

/**
 * Commands in a Code Block with a tab per package manager: the visitor's choice, kept across
 * visits and shared by every command on the page. Copy takes them all, without the prompts.
 */
function InstallBlock({
  commands,
  labels,
  className,
}: {
  commands: (pm: PackageManager) => string[];
  labels: Labels;
  className?: string;
}) {
  const pm = usePackageManager();
  return (
    <CodeBlock.Root
      className={className}
      value={pm}
      onValueChange={(next) => choose(next as PackageManager)}
    >
      <CodeBlock.Header>
        <CodeBlock.List aria-label={labels.packageManager}>
          {PACKAGE_MANAGERS.map((option) => (
            // One terminal icon for every tab: it stays still as they change.
            <CodeBlock.Tab
              key={option}
              value={option}
              icon={<Icon key="terminal" name="terminal" />}
            >
              {option}
            </CodeBlock.Tab>
          ))}
        </CodeBlock.List>
        <CodeBlock.Copy labels={labels} value={() => commands(pm).join("\n")} />
      </CodeBlock.Header>
      {PACKAGE_MANAGERS.map((option) => (
        <CodeBlock.Panel key={option} value={option}>
          <pre>
            <code>
              {commands(option).map((text, i) => (
                <Fragment key={text}>
                  {i > 0 ? "\n" : ""}
                  <Prompt />
                  <Words text={text} />
                </Fragment>
              ))}
            </code>
          </pre>
        </CodeBlock.Panel>
      ))}
    </CodeBlock.Root>
  );
}

/** Getting Started's install command: the npm package, by package manager. */
export function PackageInstall({ lang }: { lang: Lang }) {
  return (
    <InstallBlock
      className="docs-code"
      labels={getDictionary(lang).common}
      commands={(pm) => [`${ADD[pm]} owsem-ui`]}
    />
  );
}

/** Any setup but the default needs the owsem CLI (TK-6): init once, then add. */
const cliSteps = (setup: TokenSetup, item: string, pm: PackageManager) => [
  `${DLX[pm]} ${CLI} init --tokens ${setup.mode} --prefix ${setup.prefix}`,
  `${DLX[pm]} ${CLI} add ${item}`,
];

/** Under the owsem CLI's commands: it is not released yet. */
function CliNote({ labels }: { labels: Labels }) {
  const [before, after] = labels.cliSoon.split("{token}");
  return (
    <p className="install-note">
      {before}
      <code data-token-literal="">--ow-</code>
      {after}
    </p>
  );
}

/**
 * One line: the package manager as a small menu (kept across visits), the command, and Copy. The
 * menu shows pnpm until hydration reads the stored choice.
 */
function InstallLine({ labels }: { labels: Labels }) {
  const pm = usePackageManager();
  const text = `${ADD[pm]} owsem-ui`;
  return (
    <div className="install-line">
      <Menu.Root>
        <Menu.Trigger className="install-pm" aria-label={labels.packageManager}>
          <Icon name="terminal" size={14} />
          <span>{pm}</span>
          <Icon name="chevron-down" size={12} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="start" sideOffset={6}>
            <Menu.Popup className="install-pm-menu">
              <Menu.RadioGroup value={pm} onValueChange={(next) => choose(next as PackageManager)}>
                {PACKAGE_MANAGERS.map((option) => (
                  <Menu.RadioItem key={option} value={option} closeOnClick>
                    <Menu.RadioItemIndicator />
                    {option}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <ScrollArea.Root className="install-text" fade>
        <ScrollArea.Viewport>
          <code>
            <Words text={text} />
          </code>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
      <CopyButton value={text} labels={labels} variant="ghost" size="sm" className="install-copy" />
    </div>
  );
}

/** The page header's install command: one line for the npm package; the owsem CLI's steps for
 * another setup. */
export function InstallCommand({ item, labels }: { item: string; labels: Labels }) {
  const setup = useTokenSetup();
  const cli = !isDefaultSetup(setup);
  if (!cli) return <InstallLine labels={labels} />;
  return (
    <div className="install">
      <InstallBlock labels={labels} commands={(pm) => cliSteps(setup, item, pm)} />
      <CliNote labels={labels} />
    </div>
  );
}

/**
 * The Install popover's commands: a tab per package manager for the npm package, or the owsem
 * CLI's steps for another token setup.
 */
export function InstallTabs({ item, labels }: { item: string; labels: Labels }) {
  const setup = useTokenSetup();
  if (isDefaultSetup(setup)) {
    return <InstallBlock labels={labels} commands={(pm) => [`${ADD[pm]} owsem-ui`]} />;
  }
  return (
    <>
      <InstallBlock labels={labels} commands={(pm) => cliSteps(setup, item, pm)} />
      <CliNote labels={labels} />
    </>
  );
}

/** A line of code with its own Copy, such as an import. */
export function CodeLine({
  text,
  labels,
  lang,
}: {
  text: string;
  labels: Labels;
  /** Highlights the line as this language, such as an import as `tsx`. */
  lang?: "tsx" | "css";
}) {
  return (
    <div className="command">
      <ScrollArea.Root className="command-text" fade>
        <ScrollArea.Viewport>
          <code>{lang ? <HighlightedLine code={text} lang={lang} /> : text}</code>
        </ScrollArea.Viewport>
      </ScrollArea.Root>
      <CopyButton value={text} labels={labels} variant="ghost" size="sm" />
    </div>
  );
}

/**
 * The code drawer's install tab: the npm package, or the source through the shadcn CLI. Another
 * token setup needs the owsem CLI (TK-6).
 */
export function InstallPane({ item, labels, lang }: { item: string; labels: Labels; lang: Lang }) {
  const pm = usePackageManager();
  const setup = useTokenSetup();
  if (!isDefaultSetup(setup)) {
    return (
      <div className="install-pane">
        <div className="install-pane-head">
          <Picker labels={labels} />
          <TokenChip lang={lang} />
        </div>
        <section>
          <h3>{labels.installCli}</h3>
          <p>{labels.installCliNote}</p>
          {cliSteps(setup, item, pm).map((text) => (
            <Command key={text} text={text} labels={labels} />
          ))}
          <CliNote labels={labels} />
        </section>
      </div>
    );
  }
  return (
    <div className="install-pane">
      <div className="install-pane-head">
        <Picker labels={labels} />
        <TokenChip lang={lang} />
      </div>
      <section>
        <h3>{labels.installPackage}</h3>
        <p>{labels.installPackageNote}</p>
        <Command text={`${ADD[pm]} owsem-ui`} labels={labels} />
      </section>
      <section>
        <h3>{labels.installSource}</h3>
        <p>{labels.installSourceNote}</p>
        <Command text={`${DLX[pm]} shadcn registry add ${REGISTRY}`} labels={labels} />
        <Command text={`${DLX[pm]} shadcn add @owsem/${item}`} labels={labels} />
      </section>
    </div>
  );
}
