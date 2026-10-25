"use client";

import { Popover } from "owsem-ui/base";
import { CodeBlock, type CopyButtonLabels } from "owsem-ui/owsem";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Dictionary, format, getDictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { TOKEN_SETUP_STORAGE_KEY } from "@/lib/theme";
import {
  DEFAULT_TOKEN_SETUP,
  isDefaultSetup,
  isValidPrefix,
  parseTokenSetup,
  TOKEN_MODES,
  type TokenMode,
  type TokenSetup,
  withPrefix,
} from "@/lib/token-setup";
import { Icon } from "./icons/icon";

type Labels = Dictionary["tokens"];

/** Where a trigger wants the panel; triggers without a place get it under themselves. */
export interface TokenSetupPlace {
  /** The panel opens under this element, at its end: a Lab stage's toolbar. */
  anchor: RefObject<HTMLElement | null>;
  /** Where focus goes back once it shuts: `true` for the trigger itself. */
  finalFocus: () => HTMLElement | true | null;
}

/** Opens the panel from any `Popover.Trigger` given this handle, or from code. */
export const tokenSetupHandle = Popover.createHandle<TokenSetupPlace>();

// Stored as JSON, kept across visits and shared by every tab. The raw string is the snapshot, so
// it stays the same value until the setup changes.
const listeners = new Set<() => void>();

function readStored(): string {
  try {
    return localStorage.getItem(TOKEN_SETUP_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_SETUP_STORAGE_KEY) listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

export function setTokenSetup(setup: TokenSetup): void {
  try {
    if (isDefaultSetup(setup)) localStorage.removeItem(TOKEN_SETUP_STORAGE_KEY);
    else localStorage.setItem(TOKEN_SETUP_STORAGE_KEY, JSON.stringify(setup));
  } catch {
    // Storage blocked: nothing to keep the setup in, so the default stays.
  }
  for (const listener of listeners) listener();
}

/** The server renders the default; a stored setup arrives after hydration. */
export function useTokenSetup(): TokenSetup {
  const stored = useSyncExternalStore(subscribe, readStored, () => "");
  return useMemo(() => (stored ? parseTokenSetup(stored) : DEFAULT_TOKEN_SETUP), [stored]);
}

// Text nodes rewritten so far, with their text as rendered.
const originals = new WeakMap<Text, string>();

/**
 * Renames public tokens in the code under `root` (MDX that React never re-renders) to the setup's
 * prefix. Code that React renders from the setup already, and literal names, are left alone.
 */
export function useTokenNames(root: RefObject<HTMLElement | null>): void {
  const { mode, prefix } = useTokenSetup();
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new mode lets ForMode swap in code with the default names
  useEffect(() => {
    if (!root.current) return;
    const walker = document.createTreeWalker(root.current, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node as Text;
      const parent = text.parentElement;
      if (!parent?.closest("code") || parent.closest(".live-code, [data-token-literal]")) continue;
      const original = originals.get(text) ?? text.data;
      if (!original.includes("--ow-")) continue;
      originals.set(text, original);
      text.data = withPrefix(original, prefix);
    }
  }, [root, mode, prefix]);
}

/** Its children only under one token mode; the server renders the default mode's. */
export function ForMode({ mode, children }: { mode: TokenMode; children: ReactNode }) {
  return useTokenSetup().mode === mode ? children : null;
}

/** owsem.json's token part in a Code Block, colored like the docs' code. */
function OwsemJson({ setup, labels }: { setup: TokenSetup; labels: CopyButtonLabels }) {
  const entry = (key: string, value: string, comma: boolean) => (
    <>
      {"    "}
      <span className="tk-attr">"{key}"</span>
      <span className="tk-punct">: </span>
      <span className="tk-str">"{value}"</span>
      <span className="tk-punct">{comma ? "," : ""}</span>
      {"\n"}
    </>
  );
  return (
    <CodeBlock.Root className="token-setup-json">
      <CodeBlock.Header>
        <CodeBlock.Title icon={<Icon name="braces" />}>owsem.json</CodeBlock.Title>
        <CodeBlock.Copy labels={labels} />
      </CodeBlock.Header>
      <CodeBlock.Panel>
        <pre>
          <code>
            <span className="tk-punct">{"{"}</span>
            {"\n  "}
            <span className="tk-attr">"tokens"</span>
            <span className="tk-punct">{": {"}</span>
            {"\n"}
            {entry("mode", setup.mode, true)}
            {entry("prefix", setup.prefix, false)}
            <span className="tk-punct">{"  }\n}"}</span>
          </code>
        </pre>
      </CodeBlock.Panel>
    </CodeBlock.Root>
  );
}

function PrefixField({ setup, labels }: { setup: TokenSetup; labels: Labels }) {
  const id = useId();
  const [draft, setDraft] = useState(setup.prefix);
  const [shown, setShown] = useState(setup.prefix);
  // Reset, or another tab, changed the prefix: show it, unless the draft already is it.
  if (setup.prefix !== shown) {
    setShown(setup.prefix);
    if (setup.prefix !== draft) setDraft(setup.prefix);
  }
  const valid = isValidPrefix(draft);
  return (
    <div className="lab-field">
      <label htmlFor={id}>{labels.prefix}</label>
      <div className="prefix-field" data-invalid={valid ? undefined : ""}>
        <span aria-hidden="true">--</span>
        <input
          id={id}
          value={draft}
          maxLength={16}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          aria-invalid={!valid || undefined}
          aria-describedby={`${id}-help`}
          onChange={(event) => {
            const next = event.currentTarget.value.toLowerCase().replace(/\s+/g, "-");
            setDraft(next);
            if (isValidPrefix(next)) setTokenSetup({ ...setup, prefix: next });
          }}
        />
        <span aria-hidden="true">
          {setup.mode === "theme" ? "-accent" : "-separator-line-dark"}
        </span>
      </div>
      <p id={`${id}-help`} className="prefix-help" aria-live="polite">
        {valid ? labels.prefixHelp : format(labels.prefixError, { prefix: draft })}
      </p>
    </div>
  );
}

/**
 * The panel a Lab stage's Token button and every Token chip open (a Popover: Escape and a click
 * outside close it, and focus goes back). Rendered once in the site shell, so every page shares it.
 */
export function TokenSetupPanel({
  labels,
  copyLabels,
}: {
  labels: Labels;
  copyLabels: CopyButtonLabels;
}) {
  const setup = useTokenSetup();
  const modes = useId();
  const popup = useRef<HTMLDivElement>(null);
  const names = ["accent", "bg", "line-dark"];
  return (
    <Popover.Root handle={tokenSetupHandle}>
      {({ payload }) => (
        <Popover.Portal>
          <Popover.Positioner
            anchor={payload?.anchor}
            align={payload ? "end" : "start"}
            sideOffset={8}
            collisionPadding={8}
            // Above or below only, scrolling when short of room; slid back on screen rather than
            // flipped to the other end.
            collisionAvoidance={{ align: "shift", fallbackAxisSide: "none" }}
          >
            {/* Content mounts on each open, so a half-typed prefix does not outlive the panel. */}
            <Popover.Popup
              ref={popup}
              className="token-setup"
              initialFocus={() =>
                popup.current?.querySelector<HTMLElement>("input:checked") ?? true
              }
              finalFocus={payload?.finalFocus ?? true}
            >
              <div className="token-setup-head">
                <Popover.Title>{labels.title}</Popover.Title>
                <Popover.Description>{labels.scope}</Popover.Description>
              </div>
              <fieldset className="seg">
                <legend className="visually-hidden">{labels.mode}</legend>
                {TOKEN_MODES.map((mode) => (
                  <label
                    key={mode}
                    className="seg-item"
                    data-selected={setup.mode === mode ? "" : undefined}
                  >
                    <input
                      type="radio"
                      name={modes}
                      value={mode}
                      checked={setup.mode === mode}
                      onChange={() => setTokenSetup({ ...setup, mode })}
                    />
                    {labels[mode]}
                  </label>
                ))}
              </fieldset>
              <p className="token-setup-note">
                {setup.mode === "theme" ? labels.themeNote : labels.isolatedNote}
              </p>
              <PrefixField setup={setup} labels={labels} />
              <OwsemJson setup={setup} labels={copyLabels} />
              <h3 className="token-setup-names">{labels.names}</h3>
              <ul className="token-names">
                {names.map((name) => (
                  <li key={name}>
                    <code>
                      --{setup.prefix}-{name}
                    </code>
                  </li>
                ))}
              </ul>
              {isDefaultSetup(setup) ? null : <p className="token-setup-note">{labels.cli}</p>}
              <button
                type="button"
                className="text-button"
                onClick={() => setTokenSetup(DEFAULT_TOKEN_SETUP)}
              >
                {labels.reset}
              </button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}

/** "Theme tokens · --ow-*", with a button that opens the panel. */
export function TokenChip({ lang }: { lang: Lang }) {
  const setup = useTokenSetup();
  const labels = getDictionary(lang).tokens;
  const names = `--${setup.prefix}-*`;
  return (
    <p className="token-chip">
      {labels[setup.mode]} · <code data-token-literal="">{names}</code>
      <Popover.Trigger handle={tokenSetupHandle} className="text-button">
        {labels.change}
        <span className="visually-hidden"> {labels.title}</span>
      </Popover.Trigger>
    </p>
  );
}
