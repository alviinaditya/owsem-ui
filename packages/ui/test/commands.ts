import type { CDPSession } from "playwright";
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

// Surface's opaque version. Playwright has no option for it, so Chromium emulates it over CDP;
// "no-preference" lets Playwright send its own media state again, which leaves it out.
let transparency: CDPSession | undefined;
export const setReducedTransparency: BrowserCommand<[mode: "reduce" | "no-preference"]> = async (
  ctx,
  mode,
) => {
  if (ctx.provider.name !== "playwright") throw new Error("requires the playwright provider");
  if (mode === "reduce") {
    transparency ??= await ctx.page.context().newCDPSession(ctx.page);
    await transparency.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
    });
    return;
  }
  await transparency?.detach();
  transparency = undefined;
  await ctx.page.emulateMedia({});
};

declare module "vitest/browser" {
  interface BrowserCommands {
    setColorScheme: (scheme: "light" | "dark") => Promise<void>;
    setForcedColors: (mode: "active" | "none") => Promise<void>;
    setReducedMotion: (mode: "reduce" | "no-preference") => Promise<void>;
    setReducedTransparency: (mode: "reduce" | "no-preference") => Promise<void>;
  }
}
