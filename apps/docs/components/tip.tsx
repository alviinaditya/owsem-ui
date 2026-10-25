"use client";

import { Tooltip, type TooltipRootProps } from "owsem-ui/base";
import type { ReactElement } from "react";

interface TipProps {
  /** The button the tooltip labels; it keeps its own accessible name. */
  trigger: ReactElement<Record<string, unknown>>;
  label: string;
  /** A stage shortcut key, shown after the label. */
  shortcut?: string | undefined;
  /** The stage's theme, which the portaled tooltip would otherwise leave. */
  theme?: "light" | "dark" | undefined;
  /** Opening can be cancelled here, for a button whose label shows. */
  onOpenChange?: TooltipRootProps["onOpenChange"];
}

/**
 * A docs icon button's tooltip, under it: its name and shortcut, for the pointer and the keyboard
 * (touch shows none). Inside a Tooltip.Provider, tooltips after the first open at once.
 */
export function Tip({ trigger, label, shortcut, theme, onOpenChange }: TipProps) {
  return (
    <Tooltip.Root onOpenChange={onOpenChange}>
      <Tooltip.Trigger render={trigger} />
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" data-theme={theme}>
          <Tooltip.Popup>
            <Tooltip.Arrow />
            {label}
            {shortcut ? <kbd>{shortcut}</kbd> : null}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
