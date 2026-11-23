"use client";

import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { createContext, type ReactElement, type ReactNode, useContext } from "react";
import { cn } from "../../core/cn";
import {
  type ToolbarSize,
  type ToolbarVariantProps,
  toolbarButtonVariants,
  toolbarInputVariants,
  toolbarLinkVariants,
  toolbarSlots,
  toolbarVariants,
} from "./toolbar-variants";
import "./toolbar.css";

// The toolbar's size, for items that do not set their own.
const SizeContext = createContext<ToolbarSize>("md");

interface ItemProps {
  /** Button's sizes. @default the toolbar's size */
  size?: ToolbarSize | undefined;
  /** The size of an outer part that renders this one. */
  "data-size"?: ToolbarSize | undefined;
  /** An icon before the label, the font size plus 2px. Decorative: the item needs a name. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span
      data-slot="toolbar-icon"
      data-side={side}
      aria-hidden="true"
      className={toolbarSlots.icon}
    >
      {node}
    </span>
  );

/**
 * An item's children with its icons, and `data-icon-only` when it has nothing else. Neither is
 * set when there are no icons, so an element passed to `render` (such as a Toggle) keeps its own.
 */
function itemContent({ startIcon, endIcon, children }: ItemProps & { children?: ReactNode }) {
  if (startIcon == null && endIcon == null) return { children, attrs: undefined };
  return {
    children: (
      <>
        {icon(startIcon, "start")}
        {children}
        {icon(endIcon, "end")}
      </>
    ),
    attrs: children == null ? { "data-icon-only": "" } : undefined,
  };
}

export interface ToolbarRootProps
  extends Omit<BaseToolbar.Root.Props, "className">,
    ToolbarVariantProps {
  className?: string | undefined;
}

/** The toolbar: one Tab stop, then arrow keys move between its items (Base UI). */
export function ToolbarRoot({ size = "md", className, ...props }: ToolbarRootProps): ReactElement {
  return (
    <SizeContext.Provider value={size}>
      <BaseToolbar.Root
        data-slot="toolbar"
        {...props}
        className={cn(toolbarVariants({ size }), className)}
        data-size={size}
      />
    </SizeContext.Provider>
  );
}

export interface ToolbarGroupProps extends Omit<BaseToolbar.Group.Props, "className"> {
  className?: string | undefined;
}

/** Items that belong together, such as text formatting. */
export function ToolbarGroup({ className, ...props }: ToolbarGroupProps): ReactElement {
  return (
    <BaseToolbar.Group
      data-slot="toolbar-group"
      {...props}
      className={cn(toolbarSlots.group, className)}
    />
  );
}

export interface ToolbarButtonProps extends Omit<BaseToolbar.Button.Props, "className">, ItemProps {
  className?: string | undefined;
}

/**
 * A quiet ghost button. Its styles have no specificity, so a Toggle or a popup's trigger passed
 * to `render` keeps its own look.
 */
export function ToolbarButton({
  "data-size": outerSize,
  size,
  startIcon,
  endIcon,
  className,
  children,
  ...props
}: ToolbarButtonProps): ReactElement {
  const toolbarSize = useContext(SizeContext);
  const resolved = size ?? outerSize ?? toolbarSize;
  const content = itemContent({ startIcon, endIcon, children });
  return (
    <BaseToolbar.Button
      data-slot="toolbar-button"
      {...content.attrs}
      {...props}
      className={cn(toolbarButtonVariants({ size: resolved }), className)}
      data-size={resolved}
    >
      {content.children}
    </BaseToolbar.Button>
  );
}

export interface ToolbarLinkProps extends Omit<BaseToolbar.Link.Props, "className">, ItemProps {
  className?: string | undefined;
}

/** A link that looks like the toolbar's buttons. */
export function ToolbarLink({
  "data-size": outerSize,
  size,
  startIcon,
  endIcon,
  className,
  children,
  ...props
}: ToolbarLinkProps): ReactElement {
  const toolbarSize = useContext(SizeContext);
  const resolved = size ?? outerSize ?? toolbarSize;
  const content = itemContent({ startIcon, endIcon, children });
  return (
    <BaseToolbar.Link
      data-slot="toolbar-link"
      {...content.attrs}
      {...props}
      className={cn(toolbarLinkVariants({ size: resolved }), className)}
      data-size={resolved}
    >
      {content.children}
    </BaseToolbar.Link>
  );
}

// `size` is the type scale here, not the input's width in characters; set `inline-size` instead.
export interface ToolbarInputProps extends Omit<BaseToolbar.Input.Props, "className" | "size"> {
  className?: string | undefined;
  /** Button's sizes. @default the toolbar's size */
  size?: ToolbarSize | undefined;
  /** The size of an outer part that renders this one. */
  "data-size"?: ToolbarSize | undefined;
}

/** A flat field with a 3:1 edge, as tall as the buttons. Arrow keys move the caret: put it last. */
export function ToolbarInput({
  "data-size": outerSize,
  size,
  className,
  ...props
}: ToolbarInputProps): ReactElement {
  const toolbarSize = useContext(SizeContext);
  const resolved = size ?? outerSize ?? toolbarSize;
  return (
    <BaseToolbar.Input
      data-slot="toolbar-input"
      {...props}
      className={cn(toolbarInputVariants({ size: resolved }), className)}
      data-size={resolved}
    />
  );
}

export interface ToolbarSeparatorProps extends Omit<BaseToolbar.Separator.Props, "className"> {
  className?: string | undefined;
}

/** A hairline between groups, across the toolbar's direction. */
export function ToolbarSeparator({ className, ...props }: ToolbarSeparatorProps): ReactElement {
  return (
    <BaseToolbar.Separator
      data-slot="toolbar-separator"
      {...props}
      className={cn(toolbarSlots.separator, className)}
    />
  );
}
