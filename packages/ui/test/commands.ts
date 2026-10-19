import type { BrowserCommand } from "vitest/node";

// Run in Node; called as `commands.<name>(...)` from "vitest/browser".

// Playwright defaults to "light"; "no-preference" is deprecated.
export const setColorScheme: BrowserCommand<[scheme: "light" | "dark"]> = async (ctx, scheme) => {
  if (ctx.provider.name !== "playwright") throw new Error("requires the playwright provider");
  await ctx.page.emulateMedia({ colorScheme: scheme });
};

// Windows High Contrast emulation (DP-8). Chromium applies the forced palette, not just the query.
export const setForcedColors: BrowserCommand<[mode: "active" | "none"]> = async (ctx, mode) => {
  if (ctx.provider.name !== "playwright") throw new Error("requires the playwright provider");
  await ctx.page.emulateMedia({ forcedColors: mode });
};

// FR-20: motion has a prefers-reduced-motion version.
export const setReducedMotion: BrowserCommand<[mode: "reduce" | "no-preference"]> = async (
  ctx,
  mode,
) => {
  if (ctx.provider.name !== "playwright") throw new Error("requires the playwright provider");
  await ctx.page.emulateMedia({ reducedMotion: mode });
};

declare module "vitest/browser" {
  interface BrowserCommands {
    setColorScheme: (scheme: "light" | "dark") => Promise<void>;
    setForcedColors: (mode: "active" | "none") => Promise<void>;
    setReducedMotion: (mode: "reduce" | "no-preference") => Promise<void>;
  }
}
