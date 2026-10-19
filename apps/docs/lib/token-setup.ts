/**
 * The visitor's token setup (DS-4): how their project names OwsemUI tokens. The code in every Lab
 * follows it. Anything but theme tokens with `ow` comes from the owsem CLI (TK-6).
 */
export type TokenMode = "theme" | "isolated";

export const TOKEN_MODES: readonly TokenMode[] = ["theme", "isolated"];

export interface TokenSetup {
  mode: TokenMode;
  prefix: string;
}

export const DEFAULT_TOKEN_SETUP: TokenSetup = { mode: "theme", prefix: "ow" };

// TK-1: a letter first, then lowercase letters and numbers, single hyphens between words.
const PREFIX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const isValidPrefix = (prefix: string): boolean =>
  prefix.length <= 16 && PREFIX.test(prefix);

export const isDefaultSetup = (setup: TokenSetup): boolean =>
  setup.mode === DEFAULT_TOKEN_SETUP.mode && setup.prefix === DEFAULT_TOKEN_SETUP.prefix;

/** Stored JSON back to a setup; anything unreadable is the default. */
export function parseTokenSetup(stored: string | null): TokenSetup {
  try {
    const value = JSON.parse(stored ?? "null") as Partial<TokenSetup> | null;
    if (
      value &&
      TOKEN_MODES.includes(value.mode as TokenMode) &&
      typeof value.prefix === "string" &&
      isValidPrefix(value.prefix)
    ) {
      return { mode: value.mode as TokenMode, prefix: value.prefix };
    }
  } catch {}
  return DEFAULT_TOKEN_SETUP;
}

/** Public tokens take the prefix; private ones (`--_*`) and class names (`.ow-*`) keep theirs (TK-2). */
export const withPrefix = (code: string, prefix: string): string =>
  prefix === DEFAULT_TOKEN_SETUP.prefix ? code : code.replace(/--ow-(?=[a-z0-9])/g, `--${prefix}-`);
