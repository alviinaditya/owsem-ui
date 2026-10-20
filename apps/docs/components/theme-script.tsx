"use client";

import { useSyncExternalStore } from "react";
import { themeScript } from "@/lib/theme";

const subscribe = () => () => {};

/**
 * The theme script, in the server HTML only, where it runs before the first paint. After hydration
 * it renders nothing: switching language mounts the root layout again on the client, where React
 * would not run a script (and warns about one); RootState puts the attributes back instead.
 */
export function ThemeScript() {
  const server = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return server ? (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static theme script, no user input
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  ) : null;
}
