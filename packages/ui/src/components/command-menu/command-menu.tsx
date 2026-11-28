"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../core/cn";
import { createGlide } from "../../core/glide/glide";
import { GlideHighlight } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { useOpenState, useScrollLock } from "../../core/scroll-lock";
import { useBeforePaint } from "../../core/use-before-paint";
import { Kbd } from "../kbd/kbd";
import {
  type CommandMenuSize,
  commandMenuPopupVariants,
  commandMenuSlots,
  commandMenuTriggerVariants,
} from "./command-menu-variants";
import "./command-menu.css";

// Icons from Lucide (https://lucide.dev), ISC License: search and x.
function SearchIcon({ className }: { className: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

// The item list's own props, which Root holds for the Autocomplete inside the Popup.
type ListProps<Item> = Pick<
  Autocomplete.Root.Props<Item>,
  | "items"
  | "filteredItems"
  | "filter"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "limit"
  | "locale"
  | "itemToStringValue"
  | "onItemHighlighted"
  | "loopFocus"
>;

interface RootContextValue {
  list: ListProps<unknown>;
  /** The shortcut's key, for the Trigger's aria-keyshortcuts. */
  shortcut: string | undefined;
  close: () => void;
  /** Whether the open menu holds the page's scroll. */
  lock: boolean;
}

const RootContext = createContext<RootContextValue | null>(null);

function useRootContext(part: string): RootContextValue {
  const context = useContext(RootContext);
  if (!context) throw new Error(`CommandMenu.${part} must be placed inside CommandMenu.Root.`);
  return context;
}

export interface CommandMenuRootProps<Item = unknown>
  extends Omit<Dialog.Root.Props, "children">,
    ListProps<Item> {
  /**
   * The key that, with ⌘ or Ctrl, opens and closes the menu from anywhere in the document, such
   * as `"k"`. `false` turns it off, for a second menu on the page. Default `"k"`.
   */
  shortcut?: string | false | undefined;
  children?: ReactNode;
}

/**
 * Groups all parts and holds the state: whether the menu is open (a Base UI Dialog) and what the
 * list shows (the items and the query, for the Autocomplete inside the Popup). ⌘K or Ctrl K
 * opens and closes it, unless something else handled the key first. As in Base UI, grouped
 * `items` give the item type through their groups.
 */
export function CommandMenuRoot<Groups extends readonly { items: readonly unknown[] }[]>(
  props: Omit<CommandMenuRootProps<Groups[number]["items"][number]>, "items"> & { items: Groups },
): ReactElement;
export function CommandMenuRoot<Item = unknown>(props: CommandMenuRootProps<Item>): ReactElement;
export function CommandMenuRoot({
  shortcut = "k",
  handle,
  items,
  filteredItems,
  filter,
  value,
  defaultValue,
  onValueChange,
  limit,
  locale,
  itemToStringValue,
  onItemHighlighted,
  loopFocus,
  children,
  ...props
}: CommandMenuRootProps<unknown>): ReactElement {
  const { open, onOpenChange } = useOpenState(props);
  const [ownHandle] = useState(() => Dialog.createHandle());
  const dialog = handle ?? ownHandle;
  const key = shortcut ? shortcut.toLowerCase() : undefined;

  useEffect(() => {
    if (!key) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== key) return;
      event.preventDefault();
      if (dialog.isOpen) dialog.close();
      else dialog.open(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, dialog]);

  const close = useCallback(() => dialog.close(), [dialog]);
  const list: ListProps<unknown> = {
    items,
    filteredItems,
    filter,
    value,
    defaultValue,
    onValueChange,
    limit,
    locale,
    itemToStringValue,
    onItemHighlighted,
    loopFocus,
  };

  return (
    <RootContext.Provider
      value={{ list, shortcut: key, close, lock: open && (props.modal ?? true) === true }}
    >
      <Dialog.Root handle={dialog} {...props} onOpenChange={onOpenChange}>
        {children}
      </Dialog.Root>
    </RootContext.Provider>
  );
}

export interface CommandMenuTriggerProps extends Omit<Dialog.Trigger.Props, "className"> {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: CommandMenuSize | undefined;
  /** Default `"md"`. */
  size?: CommandMenuSize | undefined;
}

/**
 * A button that looks like a search field: a flat well with a search icon. Put the prompt
 * inside, and the shortcut as a `Shortcut`; inside Root, Root's shortcut is announced with
 * aria-keyshortcuts. Outside Root, pass the Root's `handle`.
 */
export function CommandMenuTrigger({
  "data-size": outerSize,
  className,
  size = outerSize ?? "md",
  children,
  ...props
}: CommandMenuTriggerProps): ReactElement {
  const key = useContext(RootContext)?.shortcut?.toUpperCase();
  return (
    <Dialog.Trigger
      data-slot="command-menu-trigger"
      aria-keyshortcuts={key ? `Meta+${key} Control+${key}` : undefined}
      {...props}
      className={cn(commandMenuTriggerVariants({ size }), className)}
      data-size={size}
    >
      <SearchIcon className={commandMenuSlots.icon} />
      {children}
    </Dialog.Trigger>
  );
}

export interface CommandMenuPopupProps extends Omit<Dialog.Popup.Props, "className"> {
  className?: string | undefined;
  /** Default `"md"`. */
  size?: CommandMenuSize | undefined;
  /** The scrim over the page: `"dim"`, or `"blur"` to blur the page under it too. Default `"dim"`. */
  backdrop?: "dim" | "blur" | undefined;
  /** Where the popup is rendered. Default: `document.body`. */
  container?: Dialog.Portal.Props["container"];
  /** The name of the close button, for screen readers on touch screens. Default `"Close"`. */
  closeLabel?: string | undefined;
}

/**
 * The glass panel over a dimmed page (Surface): Base UI Dialog's portal, backdrop, viewport, and
 * popup, holding the Autocomplete that filters the list. It opens and closes at once: a palette
 * opened from the keyboard many times a day does not animate.
 */
export function CommandMenuPopup({
  className,
  size = "md",
  backdrop = "dim",
  container,
  closeLabel = "Close",
  children,
  ref,
  ...props
}: CommandMenuPopupProps): ReactElement {
  const { list, lock } = useRootContext("Popup");
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  useScrollLock(self, lock);
  const merged = useMergedRefs(setSelf, ref);
  // Portaled to the body: the text direction comes from Base UI's DirectionProvider.
  const direction = useDirection();
  return (
    <Dialog.Portal container={container}>
      <Dialog.Backdrop
        data-slot="command-menu-backdrop"
        className={commandMenuSlots.backdrop}
        data-blur={backdrop === "blur" ? "" : undefined}
      />
      <Dialog.Viewport
        data-slot="command-menu-viewport"
        className={commandMenuSlots.viewport}
        dir={direction}
      >
        <Dialog.Popup
          data-slot="command-menu-popup"
          data-size={size}
          {...props}
          ref={merged}
          className={cn(commandMenuPopupVariants({ size }), className)}
        >
          <Autocomplete.Root open inline autoHighlight="always" keepHighlight {...list}>
            {children}
          </Autocomplete.Root>
          {/* Touch screen readers have no Escape key (Base UI Dialog). Shown when focused. */}
          <Dialog.Close
            data-slot="command-menu-close"
            className={commandMenuSlots.close}
            aria-label={closeLabel}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
}

export interface CommandMenuInputProps extends Omit<Autocomplete.Input.Props, "className"> {
  className?: string | undefined;
}

/** The search field at the top of the popup, after a search icon. Give it an aria-label. */
export function CommandMenuInput({ className, ...props }: CommandMenuInputProps): ReactElement {
  return (
    <Autocomplete.InputGroup data-slot="command-menu-field" className={commandMenuSlots.field}>
      <SearchIcon className={commandMenuSlots.icon} />
      <Autocomplete.Input
        data-slot="command-menu-input"
        {...props}
        className={cn(commandMenuSlots.input, className)}
      />
    </Autocomplete.InputGroup>
  );
}

const HIGHLIGHTED = "[data-highlighted]";
const GLIDE = {
  // Glide lights only the item Base UI highlights, so what shows is what Enter runs.
  items: HIGHLIGHTED,
  gapClick: false,
  // Base UI keeps the highlight when the pointer leaves (keepHighlight), and so does Glide: the
  // longest delay a timer takes.
  hideDelay: 2 ** 31 - 1,
};

export interface CommandMenuListProps extends Omit<Autocomplete.List.Props, "className"> {
  className?: string | undefined;
}

/**
 * The results, a listbox that scrolls, its edges fading while there is more that way. One
 * highlight glides to the item Base UI highlights, from the keyboard, the pointer, or the query
 * (Glide, Kinetic). A function child renders each item.
 */
export function CommandMenuList({
  className,
  children,
  ref,
  ...props
}: CommandMenuListProps): ReactElement {
  const list = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLSpanElement | null>(null);
  const merged = useMergedRefs(list, ref);

  useBeforePaint(() => {
    const el = list.current;
    const highlight = highlightRef.current;
    if (!el || !highlight) return;
    const glide = createGlide(el, highlight, GLIDE);
    // How far the list runs past each edge, for its fades.
    const fade = () => {
      const below = el.scrollHeight - el.clientHeight - el.scrollTop;
      el.style.setProperty("--_above", `${el.scrollTop}px`);
      el.style.setProperty("--_below", `${Math.max(0, below)}px`);
    };
    const sync = () => {
      glide.setActive(el.querySelector<HTMLElement>(HIGHLIGHTED));
      fade();
    };
    // Base UI moves data-highlighted; items come and go as the query changes.
    const changes = new MutationObserver(sync);
    changes.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-highlighted"],
    });
    // The list grows and shrinks with the window.
    const sizes = new ResizeObserver(fade);
    sizes.observe(el);
    el.addEventListener("scroll", fade, { passive: true });
    sync();
    return () => {
      el.removeEventListener("scroll", fade);
      sizes.disconnect();
      changes.disconnect();
      glide.destroy();
    };
  }, []);

  return (
    <Autocomplete.List
      data-slot="command-menu-list"
      {...props}
      ref={merged}
      className={cn(commandMenuSlots.list, className)}
    >
      <GlideHighlight glide={{ highlightRef }} />
      {typeof children === "function" ? (
        <Autocomplete.Collection>{children}</Autocomplete.Collection>
      ) : (
        children
      )}
    </Autocomplete.List>
  );
}

export interface CommandMenuEmptyProps extends Omit<Autocomplete.Empty.Props, "className"> {
  className?: string | undefined;
}

/** Shown when nothing matches the query; announced to screen readers. */
export function CommandMenuEmpty({ className, ...props }: CommandMenuEmptyProps): ReactElement {
  return (
    <Autocomplete.Empty
      data-slot="command-menu-empty"
      {...props}
      className={cn(commandMenuSlots.empty, className)}
    />
  );
}

export interface CommandMenuGroupProps extends Omit<Autocomplete.Group.Props, "className"> {
  className?: string | undefined;
}

/** A group of items with its `GroupLabel`; `items` feeds the `Collection` inside it. */
export function CommandMenuGroup({ className, ...props }: CommandMenuGroupProps): ReactElement {
  return (
    <Autocomplete.Group
      data-slot="command-menu-group"
      {...props}
      className={cn(commandMenuSlots.group, className)}
    />
  );
}

export interface CommandMenuGroupLabelProps
  extends Omit<Autocomplete.GroupLabel.Props, "className"> {
  className?: string | undefined;
}

/** A group's name, which labels the group for screen readers. */
export function CommandMenuGroupLabel({
  className,
  ...props
}: CommandMenuGroupLabelProps): ReactElement {
  return (
    <Autocomplete.GroupLabel
      data-slot="command-menu-group-label"
      {...props}
      className={cn(commandMenuSlots.groupLabel, className)}
    />
  );
}

/** Renders the filtered items of the group it is in (or of the list): a function per item. */
export const CommandMenuCollection: typeof Autocomplete.Collection = Autocomplete.Collection;
export type CommandMenuCollectionProps = Autocomplete.Collection.Props;

export interface CommandMenuItemProps extends Omit<Autocomplete.Item.Props, "className"> {
  className?: string | undefined;
  /** Close the menu once the item runs, unless its onClick prevented the default. Default `true`. */
  closeOnClick?: boolean | undefined;
}

/**
 * A command. Its onClick runs on a click and on Enter while it is highlighted; then the menu
 * closes. Lay it out with `ItemIcon`, `ItemLabel`, `ItemDescription`, and `Shortcut`.
 */
export function CommandMenuItem({
  className,
  closeOnClick = true,
  onClick,
  ...props
}: CommandMenuItemProps): ReactElement {
  const { close } = useRootContext("Item");
  return (
    <Autocomplete.Item
      data-slot="command-menu-item"
      {...props}
      className={cn(commandMenuSlots.item, className)}
      onClick={(event) => {
        onClick?.(event);
        if (closeOnClick && !event.defaultPrevented) close();
      }}
    />
  );
}

export interface CommandMenuItemIconProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** An item's icon (decorative), the item's font size plus 2px. */
export function CommandMenuItemIcon({
  className,
  ...props
}: CommandMenuItemIconProps): ReactElement {
  return (
    <span
      data-slot="command-menu-item-icon"
      aria-hidden="true"
      {...props}
      className={cn(commandMenuSlots.itemIcon, className)}
    />
  );
}

export interface CommandMenuItemLabelProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** An item's name, on one line. */
export function CommandMenuItemLabel({
  className,
  ...props
}: CommandMenuItemLabelProps): ReactElement {
  return (
    <span
      data-slot="command-menu-item-label"
      {...props}
      className={cn(commandMenuSlots.itemLabel, className)}
    />
  );
}

export interface CommandMenuItemDescriptionProps extends Omit<ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

/** A muted line after the label, on the same row; it gives way first when space runs out. */
export function CommandMenuItemDescription({
  className,
  ...props
}: CommandMenuItemDescriptionProps): ReactElement {
  return (
    <span
      data-slot="command-menu-item-description"
      {...props}
      className={cn(commandMenuSlots.itemDescription, className)}
    />
  );
}

export type CommandMenuShortcutProps = Kbd.Props;

/** A Kbd keycap: an item's shortcut (at its end), the Trigger's, or a hint in the Footer. */
export function CommandMenuShortcut({
  className,
  ...props
}: CommandMenuShortcutProps): ReactElement {
  return (
    <Kbd
      data-slot="command-menu-shortcut"
      {...props}
      className={cn(commandMenuSlots.shortcut, className)}
    />
  );
}

export interface CommandMenuFooterProps extends Omit<ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/** A row under the list, past a hairline, for hints such as which key does what. */
export function CommandMenuFooter({ className, ...props }: CommandMenuFooterProps): ReactElement {
  return (
    <div
      data-slot="command-menu-footer"
      {...props}
      className={cn(commandMenuSlots.footer, className)}
    />
  );
}

/** A handle to open and close a Root from anywhere, such as a button outside it. */
export const createCommandMenuHandle: typeof Dialog.createHandle = Dialog.createHandle;
