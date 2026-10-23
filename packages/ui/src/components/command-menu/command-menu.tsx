"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type JSX,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import { createGlide } from "../../core/glide/glide";
import { GlideHighlight } from "../../core/glide/use-glide";
import "./command-menu.css";

const cls = {
  trigger: "ow-command-menu__trigger",
  icon: "ow-command-menu__icon",
  backdrop: "ow-command-menu__backdrop",
  viewport: "ow-command-menu__viewport",
  popup: "ow-command-menu__popup",
  close: "ow-command-menu__close",
  field: "ow-command-menu__field",
  input: "ow-command-menu__input",
  list: "ow-command-menu__list",
  empty: "ow-command-menu__empty",
  group: "ow-command-menu__group",
  groupLabel: "ow-command-menu__group-label",
  item: "ow-command-menu__item",
  itemIcon: "ow-command-menu__item-icon",
  itemLabel: "ow-command-menu__item-label",
  itemDescription: "ow-command-menu__item-description",
  shortcut: "ow-command-menu__shortcut",
  footer: "ow-command-menu__footer",
} as const;

const join = (base: string, className: string | undefined) =>
  className ? `${base} ${className}` : base;

export type CommandMenuSize = "sm" | "md" | "lg";

// Icons from Lucide (https://lucide.dev), ISC License: search and x.
function SearchIcon({ className }: { className: string }): JSX.Element {
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
): JSX.Element;
export function CommandMenuRoot<Item = unknown>(props: CommandMenuRootProps<Item>): JSX.Element;
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
}: CommandMenuRootProps<unknown>): JSX.Element {
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
    <RootContext.Provider value={{ list, shortcut: key, close }}>
      <Dialog.Root handle={dialog} {...props}>
        {children}
      </Dialog.Root>
    </RootContext.Provider>
  );
}

export interface CommandMenuTriggerProps extends Omit<Dialog.Trigger.Props, "ref"> {
  /** Default `"md"`. */
  size?: CommandMenuSize | undefined;
}

/**
 * A button that looks like a search field: a flat well with a search icon. Put the prompt
 * inside, and the shortcut as a `Shortcut`; inside Root, Root's shortcut is announced with
 * aria-keyshortcuts. Outside Root, pass the Root's `handle`.
 */
export const CommandMenuTrigger: ForwardRefExoticComponent<
  CommandMenuTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, CommandMenuTriggerProps>(function CommandMenuTrigger(
  { className, size = "md", children, ...props },
  ref,
) {
  const key = useContext(RootContext)?.shortcut?.toUpperCase();
  return (
    <Dialog.Trigger
      ref={ref}
      className={withClassName(cls.trigger, className)}
      data-size={size}
      aria-keyshortcuts={key ? `Meta+${key} Control+${key}` : undefined}
      {...props}
    >
      <SearchIcon className={cls.icon} />
      {children}
    </Dialog.Trigger>
  );
});

export interface CommandMenuPopupProps extends Omit<Dialog.Popup.Props, "ref"> {
  /** Default `"md"`. */
  size?: CommandMenuSize | undefined;
  /** Where the popup is rendered. Default: `document.body`. */
  container?: Dialog.Portal.Props["container"];
  /** The name of the close button, for screen readers on touch screens (FR-17). Default `"Close"`. */
  closeLabel?: string | undefined;
}

/**
 * The glass panel over a dimmed page (Surface): Base UI Dialog's portal, backdrop, viewport, and
 * popup, holding the Autocomplete that filters the list. It opens and closes at once: a palette
 * opened from the keyboard many times a day does not animate.
 */
export const CommandMenuPopup: ForwardRefExoticComponent<
  CommandMenuPopupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuPopupProps>(function CommandMenuPopup(
  { className, size = "md", container, closeLabel = "Close", children, ...props },
  ref,
) {
  const { list } = useRootContext("Popup");
  // Portaled to the body: the text direction comes from Base UI's DirectionProvider (FR-16).
  const direction = useDirection();
  return (
    <Dialog.Portal container={container}>
      <Dialog.Backdrop className={cls.backdrop} />
      <Dialog.Viewport className={cls.viewport} dir={direction}>
        <Dialog.Popup
          ref={ref}
          className={withClassName(cls.popup, className)}
          data-size={size}
          {...props}
        >
          <Autocomplete.Root open inline autoHighlight="always" keepHighlight {...list}>
            {children}
          </Autocomplete.Root>
          {/* Touch screen readers have no Escape key (Base UI Dialog). Shown when focused. */}
          <Dialog.Close className={cls.close} aria-label={closeLabel}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  );
});

export type CommandMenuInputProps = Omit<Autocomplete.Input.Props, "ref">;

/** The search field at the top of the popup, after a search icon. Give it an aria-label. */
export const CommandMenuInput: ForwardRefExoticComponent<
  CommandMenuInputProps & RefAttributes<HTMLInputElement>
> = forwardRef<HTMLInputElement, CommandMenuInputProps>(function CommandMenuInput(
  { className, ...props },
  ref,
) {
  return (
    <Autocomplete.InputGroup className={cls.field}>
      <SearchIcon className={cls.icon} />
      <Autocomplete.Input ref={ref} className={withClassName(cls.input, className)} {...props} />
    </Autocomplete.InputGroup>
  );
});

const HIGHLIGHTED = "[data-highlighted]";
const GLIDE = {
  // Glide lights only the item Base UI highlights, so what shows is what Enter runs.
  items: HIGHLIGHTED,
  gapClick: false,
  // Base UI keeps the highlight when the pointer leaves (keepHighlight), and so does Glide: the
  // longest delay a timer takes.
  hideDelay: 2 ** 31 - 1,
};

export type CommandMenuListProps = Omit<Autocomplete.List.Props, "ref">;

/**
 * The results, a listbox that scrolls. One highlight glides to the item Base UI highlights, from
 * the keyboard, the pointer, or the query (Glide, Kinetic). A function child renders each item.
 */
export const CommandMenuList: ForwardRefExoticComponent<
  CommandMenuListProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuListProps>(function CommandMenuList(
  { className, children, ...props },
  ref,
) {
  const list = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = list.current;
    const highlight = highlightRef.current;
    if (!el || !highlight) return;
    const glide = createGlide(el, highlight, GLIDE);
    const sync = () => glide.setActive(el.querySelector<HTMLElement>(HIGHLIGHTED));
    // Base UI moves data-highlighted; items come and go as the query changes.
    const changes = new MutationObserver(sync);
    changes.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-highlighted"],
    });
    sync();
    return () => {
      changes.disconnect();
      glide.destroy();
    };
  }, []);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      list.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  return (
    <Autocomplete.List ref={setRef} className={withClassName(cls.list, className)} {...props}>
      <GlideHighlight glide={{ highlightRef }} />
      {typeof children === "function" ? (
        <Autocomplete.Collection>{children}</Autocomplete.Collection>
      ) : (
        children
      )}
    </Autocomplete.List>
  );
});

export type CommandMenuEmptyProps = Omit<Autocomplete.Empty.Props, "ref">;

/** Shown when nothing matches the query; announced to screen readers. */
export const CommandMenuEmpty: ForwardRefExoticComponent<
  CommandMenuEmptyProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuEmptyProps>(function CommandMenuEmpty(
  { className, ...props },
  ref,
) {
  return (
    <Autocomplete.Empty ref={ref} className={withClassName(cls.empty, className)} {...props} />
  );
});

export type CommandMenuGroupProps = Omit<Autocomplete.Group.Props, "ref">;

/** A group of items with its `GroupLabel`; `items` feeds the `Collection` inside it. */
export const CommandMenuGroup: ForwardRefExoticComponent<
  CommandMenuGroupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuGroupProps>(function CommandMenuGroup(
  { className, ...props },
  ref,
) {
  return (
    <Autocomplete.Group ref={ref} className={withClassName(cls.group, className)} {...props} />
  );
});

export type CommandMenuGroupLabelProps = Omit<Autocomplete.GroupLabel.Props, "ref">;

/** A group's name, which labels the group for screen readers. */
export const CommandMenuGroupLabel: ForwardRefExoticComponent<
  CommandMenuGroupLabelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuGroupLabelProps>(function CommandMenuGroupLabel(
  { className, ...props },
  ref,
) {
  return (
    <Autocomplete.GroupLabel
      ref={ref}
      className={withClassName(cls.groupLabel, className)}
      {...props}
    />
  );
});

/** Renders the filtered items of the group it is in (or of the list): a function per item. */
export const CommandMenuCollection: typeof Autocomplete.Collection = Autocomplete.Collection;
export type CommandMenuCollectionProps = Autocomplete.Collection.Props;

export interface CommandMenuItemProps extends Omit<Autocomplete.Item.Props, "ref"> {
  /** Close the menu once the item runs, unless its onClick prevented the default. Default `true`. */
  closeOnClick?: boolean | undefined;
}

/**
 * A command. Its onClick runs on a click and on Enter while it is highlighted; then the menu
 * closes. Lay it out with `ItemIcon`, `ItemLabel`, `ItemDescription`, and `Shortcut`.
 */
export const CommandMenuItem: ForwardRefExoticComponent<
  CommandMenuItemProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuItemProps>(function CommandMenuItem(
  { className, closeOnClick = true, onClick, ...props },
  ref,
) {
  const { close } = useRootContext("Item");
  return (
    <Autocomplete.Item
      ref={ref}
      className={withClassName(cls.item, className)}
      onClick={(event) => {
        onClick?.(event);
        if (closeOnClick && !event.defaultPrevented) close();
      }}
      {...props}
    />
  );
});

export type CommandMenuItemIconProps = ComponentPropsWithoutRef<"span">;

/** An item's icon (decorative), the item's font size plus 2px. */
export const CommandMenuItemIcon: ForwardRefExoticComponent<
  CommandMenuItemIconProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, CommandMenuItemIconProps>(function CommandMenuItemIcon(
  { className, ...props },
  ref,
) {
  return <span ref={ref} aria-hidden="true" className={join(cls.itemIcon, className)} {...props} />;
});

export type CommandMenuItemLabelProps = ComponentPropsWithoutRef<"span">;

/** An item's name, on one line. */
export const CommandMenuItemLabel: ForwardRefExoticComponent<
  CommandMenuItemLabelProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, CommandMenuItemLabelProps>(function CommandMenuItemLabel(
  { className, ...props },
  ref,
) {
  return <span ref={ref} className={join(cls.itemLabel, className)} {...props} />;
});

export type CommandMenuItemDescriptionProps = ComponentPropsWithoutRef<"span">;

/** A muted line after the label, on the same row; it gives way first when space runs out. */
export const CommandMenuItemDescription: ForwardRefExoticComponent<
  CommandMenuItemDescriptionProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, CommandMenuItemDescriptionProps>(
  function CommandMenuItemDescription({ className, ...props }, ref) {
    return <span ref={ref} className={join(cls.itemDescription, className)} {...props} />;
  },
);

export type CommandMenuShortcutProps = ComponentPropsWithoutRef<"kbd">;

/** Small keycaps: an item's shortcut (at its end), the Trigger's, or a hint in the Footer. */
export const CommandMenuShortcut: ForwardRefExoticComponent<
  CommandMenuShortcutProps & RefAttributes<HTMLElement>
> = forwardRef<HTMLElement, CommandMenuShortcutProps>(function CommandMenuShortcut(
  { className, ...props },
  ref,
) {
  return <kbd ref={ref} className={join(cls.shortcut, className)} {...props} />;
});

export type CommandMenuFooterProps = ComponentPropsWithoutRef<"div">;

/** A row under the list, past an etched line, for hints such as which key does what. */
export const CommandMenuFooter: ForwardRefExoticComponent<
  CommandMenuFooterProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, CommandMenuFooterProps>(function CommandMenuFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={join(cls.footer, className)} {...props} />;
});

/** A handle to open and close a Root from anywhere, such as a button outside it. */
export const createCommandMenuHandle: typeof Dialog.createHandle = Dialog.createHandle;
