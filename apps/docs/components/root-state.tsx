"use client";

import { useEffect, useLayoutEffect } from "react";
import { restoreRootState } from "@/lib/theme";
import { followOtherTabs } from "./site-theme";

/**
 * Puts the stored theme and pane state back on <html> when the root layout mounts again, and
 * follows a theme chosen in another tab.
 */
export function RootState() {
  useLayoutEffect(() => restoreRootState(), []);
  useEffect(followOtherTabs, []);
  return null;
}
