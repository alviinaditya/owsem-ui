"use client";

import { useLayoutEffect } from "react";
import { restoreRootState } from "@/lib/theme";

/** Puts the stored theme and pane state back on <html> when the root layout mounts again. */
export function RootState() {
  useLayoutEffect(() => restoreRootState(), []);
  return null;
}
