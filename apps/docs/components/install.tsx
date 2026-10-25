"use client";

import { ToggleGroup } from "owsem-ui/base";
import { useSyncExternalStore } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { PACKAGE_MANAGER_STORAGE_KEY } from "@/lib/theme";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";
import { CopyButton } from "./lab/copy-button";
import { ScrollFade } from "./scroll-fade";
import { useTokenSetup } from "./token-setup";

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

type Labels = Dictionary["lab"];

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

/** One shell command with its own Copy; the prompt is not part of the copied text. */
function Command({ text, labels }: { text: string; labels: Labels }) {
  return (
    <div className="command">
      <ScrollFade className="command-text">
        <code>
          <span className="command-prompt" aria-hidden="true">
            $
          </span>
          {text.split(" ").map((word, i) => {
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
          })}
        </code>
      </ScrollFade>
      <CopyButton text={text} labels={labels} />
    </div>
  );
}

/** Any setup but the default needs the owsem CLI (TK-6): init once, then add. */
function CliSteps({
  setup,
  item,
  pm,
  labels,
}: {
  setup: TokenSetup;
  item: string;
  pm: PackageManager;
  labels: Labels;
}) {
  const [before, after] = labels.cliSoon.split("{token}");
  return (
    <>
      <Command
        text={`${DLX[pm]} ${CLI} init --tokens ${setup.mode} --prefix ${setup.prefix}`}
        labels={labels}
      />
      <Command text={`${DLX[pm]} ${CLI} add ${item}`} labels={labels} />
      <p className="install-note">
        {before}
        <code data-token-literal="">--ow-</code>
        {after}
      </p>
    </>
  );
}

/** The page header's install command: the npm package, or the owsem CLI for another setup. */
export function InstallCommand({ item, labels }: { item: string; labels: Labels }) {
  const pm = usePackageManager();
  const setup = useTokenSetup();
  return (
    <div className="install">
      <div className="install-head">
        <Picker labels={labels} />
      </div>
      {isDefaultSetup(setup) ? (
        <Command text={`${ADD[pm]} owsem-ui`} labels={labels} />
      ) : (
        <CliSteps setup={setup} item={item} pm={pm} labels={labels} />
      )}
    </div>
  );
}

/**
 * The code drawer's install tab: the npm package, or the source through the shadcn CLI. Another
 * token setup needs the owsem CLI (TK-6).
 */
export function InstallPane({ item, labels }: { item: string; labels: Labels }) {
  const pm = usePackageManager();
  const setup = useTokenSetup();
  if (!isDefaultSetup(setup)) {
    return (
      <div className="install-pane">
        <Picker labels={labels} />
        <section>
          <h3>{labels.installCli}</h3>
          <p>{labels.installCliNote}</p>
          <CliSteps setup={setup} item={item} pm={pm} labels={labels} />
        </section>
      </div>
    );
  }
  return (
    <div className="install-pane">
      <Picker labels={labels} />
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
