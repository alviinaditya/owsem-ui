"use client";

import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import {
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type ReactNode,
  type RefAttributes,
  useContext,
} from "react";
import { withClassName } from "../../core/class-name";
import "./toolbar.css";

const cls = {
  root: "ow-toolbar",
  group: "ow-toolbar-group",
  button: "ow-toolbar-button",
  link: "ow-toolbar-link",
  icon: "ow-toolbar-icon",
  input: "ow-toolbar-input",
  separator: "ow-toolbar-separator",
} as const;

export type ToolbarSize = "sm" | "md" | "lg";

// The toolbar's size, for items that do not set their own. (Context.Provider: React 18.2 is a
// supported peer.)
const SizeContext = createContext<ToolbarSize>("md");

interface ItemProps {
  /** Button's sizes (FR-11). @default the toolbar's size */
  size?: ToolbarSize | undefined;
  /** An icon before the label, the font size plus 2px. Decorative: the item needs a name. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
}

const icon = (node: ReactNode, side: "start" | "end") =>
  node == null ? null : (
    <span className={cls.icon} data-side={side} aria-hidden="true">
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

export interface ToolbarRootProps extends Omit<BaseToolbar.Root.Props, "ref"> {
  /** The size of every item that does not set its own. @default "md" */
  size?: ToolbarSize | undefined;
}

/** The toolbar: one Tab stop, then arrow keys move between its items (Base UI). */
export const ToolbarRoot: ForwardRefExoticComponent<
  ToolbarRootProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ToolbarRootProps>(function ToolbarRoot(
  { className, size = "md", ...props },
  ref,
) {
  return (
    <SizeContext.Provider value={size}>
      <BaseToolbar.Root
        ref={ref}
        className={withClassName(cls.root, className)}
        data-size={size}
        {...props}
      />
    </SizeContext.Provider>
  );
});

export type ToolbarGroupProps = Omit<BaseToolbar.Group.Props, "ref">;

/** Items that belong together, such as text formatting. */
export const ToolbarGroup: ForwardRefExoticComponent<
  ToolbarGroupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ToolbarGroupProps>(function ToolbarGroup(
  { className, ...props },
  ref,
) {
  return <BaseToolbar.Group ref={ref} className={withClassName(cls.group, className)} {...props} />;
});

export interface ToolbarButtonProps extends Omit<BaseToolbar.Button.Props, "ref">, ItemProps {}

/**
 * A quiet ghost button. Its styles have no specificity, so a Toggle or a popup's trigger passed
 * to `render` keeps its own look.
 */
export const ToolbarButton: ForwardRefExoticComponent<
  ToolbarButtonProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
  { className, size, startIcon, endIcon, children, ...props },
  ref,
) {
  const toolbarSize = useContext(SizeContext);
  const content = itemContent({ startIcon, endIcon, children });
  return (
    <BaseToolbar.Button
      ref={ref}
      className={withClassName(cls.button, className)}
      data-size={size ?? toolbarSize}
      {...content.attrs}
      {...props}
    >
      {content.children}
    </BaseToolbar.Button>
  );
});

export interface ToolbarLinkProps extends Omit<BaseToolbar.Link.Props, "ref">, ItemProps {}

/** A link that looks like the toolbar's buttons. */
export const ToolbarLink: ForwardRefExoticComponent<
  ToolbarLinkProps & RefAttributes<HTMLAnchorElement>
> = forwardRef<HTMLAnchorElement, ToolbarLinkProps>(function ToolbarLink(
  { className, size, startIcon, endIcon, children, ...props },
  ref,
) {
  const toolbarSize = useContext(SizeContext);
  const content = itemContent({ startIcon, endIcon, children });
  return (
    <BaseToolbar.Link
      ref={ref}
      className={withClassName(cls.link, className)}
      data-size={size ?? toolbarSize}
      {...content.attrs}
      {...props}
    >
      {content.children}
    </BaseToolbar.Link>
  );
});

// `size` is the type scale here, not the input's width in characters; set `inline-size` instead.
export interface ToolbarInputProps extends Omit<BaseToolbar.Input.Props, "ref" | "size"> {
  /** Button's sizes (FR-11). @default the toolbar's size */
  size?: ToolbarSize | undefined;
}

/** A sunken field, as tall as the buttons. Arrow keys move the caret, so put it last. */
export const ToolbarInput: ForwardRefExoticComponent<
  ToolbarInputProps & RefAttributes<HTMLInputElement>
> = forwardRef<HTMLInputElement, ToolbarInputProps>(function ToolbarInput(
  { className, size, ...props },
  ref,
) {
  const toolbarSize = useContext(SizeContext);
  return (
    <BaseToolbar.Input
      ref={ref}
      className={withClassName(cls.input, className)}
      data-size={size ?? toolbarSize}
      {...props}
    />
  );
});

export type ToolbarSeparatorProps = Omit<BaseToolbar.Separator.Props, "ref">;

/** An etched groove between groups, across the toolbar's direction. */
export const ToolbarSeparator: ForwardRefExoticComponent<
  ToolbarSeparatorProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(function ToolbarSeparator(
  { className, ...props },
  ref,
) {
  return (
    <BaseToolbar.Separator
      ref={ref}
      className={withClassName(cls.separator, className)}
      {...props}
    />
  );
});
