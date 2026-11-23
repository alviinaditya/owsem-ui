"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Select as BaseSelect } from "@base-ui/react/select";
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "../../core/cn";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { trackPointerType, useScrollLock } from "../../core/scroll-lock";
import { useShakeGate } from "../../core/shake";
import {
  type SelectSize,
  type SelectVariantProps,
  selectPopupVariants,
  selectSlots,
  selectTriggerVariants,
} from "./select-variants";
import "./select.css";

const ITEMS = '[role="option"]';

// Lucide icons (ISC): chevrons-up-down, chevron-up, chevron-down, check.
const glyph = (shape: "chevrons" | "up" | "down" | "check") => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {shape === "chevrons" ? (
      <>
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </>
    ) : null}
    {shape === "up" ? <path d="m18 15-6-6-6 6" /> : null}
    {shape === "down" ? <path d="m6 9 6 6 6-6" /> : null}
    {shape === "check" ? <path d="M20 6 9 17l-5-5" /> : null}
  </svg>
);

/** Whether children hold one of these parts directly, fragments aside. */
const holds = (children: ReactNode, ...parts: unknown[]): boolean =>
  Children.toArray(children).some(
    (child) =>
      isValidElement<{ children?: ReactNode }>(child) &&
      (parts.includes(child.type) ||
        (child.type === Fragment && holds(child.props.children, ...parts))),
  );

/** What the trigger and the popup share, the popup being in a portal. */
const SelectContext = createContext({
  size: "md" as SelectSize,
  multiple: false,
  instant: false,
  modal: false,
  open: false,
});
/**
 * Inside a Positioner, and whether it lays the popup over the trigger; a Popup outside one draws
 * its own.
 */
const PlacedContext = createContext<false | { overlay: boolean }>(false);

// Parts without a look of their own come straight from Base UI.

export type SelectBackdropProps = BaseSelect.Backdrop.Props;
export type SelectArrowProps = BaseSelect.Arrow.Props;
export type SelectGroupProps = BaseSelect.Group.Props;

export interface SelectPortalProps extends Omit<BaseSelect.Portal.Props, "className"> {
  className?: string | undefined;
}

/** Base UI's Portal; for a modal select it puts a clear backdrop under the popup for outside presses. */
export function SelectPortal({ children, ...props }: SelectPortalProps): ReactElement {
  const { modal } = useContext(SelectContext);
  return (
    <BaseSelect.Portal data-slot="select-portal" {...props}>
      {modal ? (
        <BaseSelect.Backdrop data-slot="select-backdrop" className={selectSlots.backdrop} />
      ) : null}
      {children}
    </BaseSelect.Portal>
  );
}
export const SelectBackdrop: typeof BaseSelect.Backdrop = BaseSelect.Backdrop;
export const SelectArrow: typeof BaseSelect.Arrow = BaseSelect.Arrow;
export const SelectGroup: typeof BaseSelect.Group = BaseSelect.Group;

export type SelectRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = BaseSelect.Root.Props<Value, Multiple> & SelectVariantProps;

/** The keyboard's own press, or the click a browser makes from one (detail 0). */
const fromKeyboard = (event: Event) =>
  event instanceof KeyboardEvent || (event.type === "click" && (event as MouseEvent).detail === 0);

/**
 * Base UI's Root, with one `size` for the trigger and the popup, so the selected item's text lands
 * on the trigger's. Base UI's Select has no `data-instant`, so it sets that for the Popup here.
 * `modal` (default true) works as Base UI's: a press outside only shuts the popup, and the page
 * does not scroll. The lock is OwsemUI's (core/scroll-lock), which leaves the page's overflow
 * alone, so its text is not drawn again while the popup is open.
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>({
  size = "md",
  modal = true,
  onOpenChange,
  ...props
}: SelectRootProps<Value, Multiple>): ReactElement {
  const [instant, setInstant] = useState(false);
  // Base UI mounts the popup ahead, on the trigger's focus, so the lock follows `open`.
  const [opened, setOpened] = useState(props.defaultOpen ?? false);
  const open = props.open ?? opened;
  useEffect(trackPointerType, []);
  const multiple = Boolean(props.multiple);
  const shared = useMemo(
    () => ({ size, multiple, instant, modal, open }),
    [size, multiple, instant, modal, open],
  );
  return (
    <SelectContext.Provider value={shared}>
      <BaseSelect.Root
        {...props}
        modal={false}
        onOpenChange={(next, details) => {
          setInstant(fromKeyboard(details.event));
          onOpenChange?.(next, details);
          if (!details.isCanceled) setOpened(next);
        }}
      />
    </SelectContext.Provider>
  );
}

export interface SelectLabelProps extends Omit<BaseSelect.Label.Props, "className"> {
  className?: string | undefined;
}

/** Names the trigger, and focuses it when pressed. */
export function SelectLabel({ className, ...props }: SelectLabelProps): ReactElement {
  return (
    <BaseSelect.Label
      data-slot="select-label"
      {...props}
      className={cn(selectSlots.label, className)}
    />
  );
}

export interface SelectValueProps extends Omit<BaseSelect.Value.Props, "className"> {
  className?: string | undefined;
}

/** The selected item's label, or the muted placeholder; a long one ends in an ellipsis. */
export function SelectValue({ className, ...props }: SelectValueProps): ReactElement {
  return (
    <BaseSelect.Value
      data-slot="select-value"
      {...props}
      className={cn(selectSlots.value, className)}
    />
  );
}

export interface SelectIconProps extends Omit<BaseSelect.Icon.Props, "className"> {
  className?: string | undefined;
}

/** Up and down chevrons, icon-sized; children replace them. */
export function SelectIcon({
  className,
  children = glyph("chevrons"),
  ...props
}: SelectIconProps): ReactElement {
  return (
    <BaseSelect.Icon data-slot="select-icon" {...props} className={cn(selectSlots.icon, className)}>
      {children}
    </BaseSelect.Icon>
  );
}

export interface SelectTriggerProps extends Omit<BaseSelect.Trigger.Props, "className"> {
  className?: string | undefined;
  /** The size of an outer part that renders this one, such as Toolbar.Button. */
  "data-size"?: SelectSize | undefined;
  /** Shown while nothing is selected, by the Value drawn when the trigger has no children. */
  placeholder?: ReactNode;
}

/** The field. Without children it draws a Value and an Icon. */
export function SelectTrigger({
  "data-size": outerSize,
  className,
  placeholder,
  children,
  ref,
  ...props
}: SelectTriggerProps): ReactElement {
  const { size: rootSize } = useContext(SelectContext);
  const size = outerSize ?? rootSize;
  const gate = useShakeGate(ref);
  return (
    <BaseSelect.Trigger
      data-slot="select-trigger"
      {...props}
      ref={gate}
      className={cn(selectTriggerVariants({ size }), className)}
      data-size={size}
    >
      {children ?? (
        <>
          <SelectValue placeholder={placeholder} />
          <SelectIcon />
        </>
      )}
    </BaseSelect.Trigger>
  );
}

export interface SelectPositionerProps extends Omit<BaseSelect.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Lays the selected item's text over the trigger's, as Base UI does, so the popup covers the
 * trigger at its width. Where that cannot work, on touch and near the screen's edges, the popup
 * hangs 6px from the trigger's start instead. With `multiple` it always does, so the trigger stays
 * in view as it adds up the picks. It takes the text direction from DirectionProvider, since the
 * portal leaves the subtree that sets `dir`.
 */
export function SelectPositioner({
  className,
  sideOffset = 6,
  align = "start",
  alignItemWithTrigger,
  children,
  ...props
}: SelectPositionerProps): ReactElement {
  const direction = useDirection();
  const { multiple } = useContext(SelectContext);
  const overlay = alignItemWithTrigger ?? !multiple;
  const placed = useMemo(() => ({ overlay }), [overlay]);
  return (
    <BaseSelect.Positioner
      data-slot="select-positioner"
      dir={direction}
      {...props}
      className={cn(selectSlots.positioner, className)}
      sideOffset={sideOffset}
      align={align}
      alignItemWithTrigger={overlay}
    >
      <PlacedContext.Provider value={placed}>{children}</PlacedContext.Provider>
    </BaseSelect.Positioner>
  );
}

export interface SelectScrollUpArrowProps
  extends Omit<BaseSelect.ScrollUpArrow.Props, "className"> {
  className?: string | undefined;
}

/** Shows while the list has more above; the pointer resting on it scrolls. */
export function SelectScrollUpArrow({
  className,
  children = glyph("up"),
  ...props
}: SelectScrollUpArrowProps): ReactElement {
  return (
    <BaseSelect.ScrollUpArrow
      data-slot="select-scroll-up-arrow"
      {...props}
      className={cn(selectSlots.scrollUpArrow, className)}
    >
      {children}
    </BaseSelect.ScrollUpArrow>
  );
}

export interface SelectScrollDownArrowProps
  extends Omit<BaseSelect.ScrollDownArrow.Props, "className"> {
  className?: string | undefined;
}

/** Shows while the list has more below; the pointer resting on it scrolls. */
export function SelectScrollDownArrow({
  className,
  children = glyph("down"),
  ...props
}: SelectScrollDownArrowProps): ReactElement {
  return (
    <BaseSelect.ScrollDownArrow
      data-slot="select-scroll-down-arrow"
      {...props}
      className={cn(selectSlots.scrollDownArrow, className)}
    >
      {children}
    </BaseSelect.ScrollDownArrow>
  );
}

export interface SelectListProps extends Omit<BaseSelect.List.Props, "className"> {
  className?: string | undefined;
}

/**
 * The scrolling list, which holds the Glide highlight so it scrolls with the items. Glide lights
 * the item nearest the pointer; the keyboard's highlight (focus) moves it too.
 */
export function SelectList({
  className,
  onFocus,
  children,
  ref,
  ...props
}: SelectListProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({ axis: "y", items: ITEMS });
  const merged = useMergedRefs(glide.ref, ref);
  const follow = (event: Parameters<NonNullable<SelectListProps["onFocus"]>>[0]) => {
    onFocus?.(event);
    const item = event.target as HTMLElement;
    // Base UI focuses a disabled item under the pointer too; Glide passes those by.
    if (item.matches(ITEMS) && !item.matches("[data-disabled]:hover")) glide.setActive(item);
  };
  return (
    <BaseSelect.List
      data-slot="select-list"
      onFocus={follow}
      {...props}
      ref={merged}
      className={cn(selectSlots.list, className)}
    >
      <GlideHighlight glide={glide} />
      {children}
    </BaseSelect.List>
  );
}

export interface SelectPopupProps extends Omit<BaseSelect.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel with the popup shadow. Without a Positioner around it, it draws a Portal and a
 * Positioner; without a List directly inside it, a List and the scroll arrows around its children.
 */
export function SelectPopup({
  className,
  children,
  ref,
  ...props
}: SelectPopupProps): ReactElement {
  const { size, instant, modal, open, multiple } = useContext(SelectContext);
  const placed = useContext(PlacedContext);
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  // Over its trigger Base UI locks the page even when not modal, since the popup cannot follow a
  // scroll; this lock takes that over, so the page is not drawn again.
  const overlay = placed ? placed.overlay : !multiple;
  useScrollLock(self, open && (modal || overlay));
  const merged = useMergedRefs(setSelf, ref);
  const popup = (
    <BaseSelect.Popup
      data-slot="select-popup"
      data-size={size}
      data-instant={instant ? "" : undefined}
      {...props}
      ref={merged}
      className={cn(selectPopupVariants({ size }), className)}
    >
      {holds(children, SelectList) ? (
        children
      ) : (
        <>
          <SelectScrollUpArrow />
          <SelectList>{children}</SelectList>
          <SelectScrollDownArrow />
        </>
      )}
    </BaseSelect.Popup>
  );
  if (placed) return popup;
  return (
    <SelectPortal>
      <SelectPositioner>{popup}</SelectPositioner>
    </SelectPortal>
  );
}

export interface SelectItemTextProps extends Omit<BaseSelect.ItemText.Props, "className"> {
  className?: string | undefined;
}

/** The label: what lands on the trigger's text, and what typing matches. */
export function SelectItemText({ className, ...props }: SelectItemTextProps): ReactElement {
  return (
    <BaseSelect.ItemText
      data-slot="select-item-text"
      {...props}
      className={cn(selectSlots.itemText, className)}
    />
  );
}

export interface SelectItemIndicatorProps
  extends Omit<BaseSelect.ItemIndicator.Props, "className"> {
  className?: string | undefined;
}

/** A check, icon-sized. It keeps its room while unselected, so labels stay in line. */
export function SelectItemIndicator({
  className,
  keepMounted = true,
  children = glyph("check"),
  ...props
}: SelectItemIndicatorProps): ReactElement {
  return (
    <BaseSelect.ItemIndicator
      data-slot="select-item-indicator"
      {...props}
      className={cn(selectSlots.itemIndicator, className)}
      keepMounted={keepMounted}
    >
      {children}
    </BaseSelect.ItemIndicator>
  );
}

export interface SelectItemProps extends Omit<BaseSelect.Item.Props, "className"> {
  className?: string | undefined;
}

/**
 * An option. Plain children go in an ItemText, then an ItemIndicator at the end, where the
 * trigger's icon is; explicit parts stay in your order.
 */
export function SelectItem({ className, children, ...props }: SelectItemProps): ReactElement {
  return (
    <BaseSelect.Item data-slot="select-item" {...props} className={cn(selectSlots.item, className)}>
      {holds(children, SelectItemText, SelectItemIndicator) ? (
        children
      ) : (
        <>
          <SelectItemText>{children}</SelectItemText>
          <SelectItemIndicator />
        </>
      )}
    </BaseSelect.Item>
  );
}

export interface SelectGroupLabelProps extends Omit<BaseSelect.GroupLabel.Props, "className"> {
  className?: string | undefined;
}

/** A group's name, small and muted; it labels the group for assistive technology too. */
export function SelectGroupLabel({ className, ...props }: SelectGroupLabelProps): ReactElement {
  return (
    <BaseSelect.GroupLabel
      data-slot="select-group-label"
      {...props}
      className={cn(selectSlots.groupLabel, className)}
    />
  );
}

export interface SelectSeparatorProps extends Omit<BaseSelect.Separator.Props, "className"> {
  className?: string | undefined;
}

/** A hairline between groups. */
export function SelectSeparator({ className, ...props }: SelectSeparatorProps): ReactElement {
  return (
    <BaseSelect.Separator
      data-slot="select-separator"
      {...props}
      className={cn(selectSlots.separator, className)}
    />
  );
}
