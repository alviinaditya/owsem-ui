"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Select as BaseSelect } from "@base-ui/react/select";
import {
  Children,
  createContext,
  type ForwardRefExoticComponent,
  Fragment,
  forwardRef,
  isValidElement,
  type JSX,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { trackPointerType, useScrollLock } from "../../core/scroll-lock";
import { useShakeGate } from "../../core/shake";
import "./select.css";

const cls = {
  backdrop: "ow-select__backdrop",
  label: "ow-select__label",
  trigger: "ow-select__trigger",
  value: "ow-select__value",
  icon: "ow-select__icon",
  positioner: "ow-select__positioner",
  popup: "ow-select__popup",
  scrollUpArrow: "ow-select__scroll-up-arrow",
  scrollDownArrow: "ow-select__scroll-down-arrow",
  list: "ow-select__list",
  item: "ow-select__item",
  itemText: "ow-select__item-text",
  itemIndicator: "ow-select__item-indicator",
  groupLabel: "ow-select__group-label",
  separator: "ow-select__separator",
} as const;

const ITEMS = '[role="option"]';

export type SelectSize = "sm" | "md" | "lg";

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

export type SelectPortalProps = BaseSelect.Portal.Props;
export type SelectBackdropProps = BaseSelect.Backdrop.Props;
export type SelectArrowProps = BaseSelect.Arrow.Props;
export type SelectGroupProps = BaseSelect.Group.Props;

/** Base UI's Portal; for a modal select it puts a clear backdrop under the popup for outside presses. */
export const SelectPortal: ForwardRefExoticComponent<
  Omit<SelectPortalProps, "ref"> & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, Omit<SelectPortalProps, "ref">>(function SelectPortal(
  { children, ...props },
  ref,
) {
  const { modal } = useContext(SelectContext);
  return (
    <BaseSelect.Portal ref={ref} {...props}>
      {modal ? <BaseSelect.Backdrop className={cls.backdrop} /> : null}
      {children}
    </BaseSelect.Portal>
  );
});
export const SelectBackdrop: typeof BaseSelect.Backdrop = BaseSelect.Backdrop;
export const SelectArrow: typeof BaseSelect.Arrow = BaseSelect.Arrow;
export const SelectGroup: typeof BaseSelect.Group = BaseSelect.Group;

export type SelectRootProps<
  Value,
  Multiple extends boolean | undefined = false,
> = BaseSelect.Root.Props<Value, Multiple> & {
  /** The trigger's and the items' type scale: 13, 14, or 16px. @default "md" */
  size?: SelectSize | undefined;
};

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
}: SelectRootProps<Value, Multiple>): JSX.Element {
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
        {...(props as BaseSelect.Root.Props<Value, Multiple>)}
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

export type SelectLabelProps = Omit<BaseSelect.Label.Props, "ref">;

/** Names the trigger, and focuses it when pressed. */
export const SelectLabel: ForwardRefExoticComponent<
  SelectLabelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectLabelProps>(function SelectLabel(
  { className, ...props },
  ref,
) {
  return <BaseSelect.Label ref={ref} className={withClassName(cls.label, className)} {...props} />;
});

export type SelectValueProps = Omit<BaseSelect.Value.Props, "ref">;

/** The selected item's label, or the muted placeholder; a long one ends in an ellipsis. */
export const SelectValue: ForwardRefExoticComponent<
  SelectValueProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SelectValueProps>(function SelectValue(
  { className, ...props },
  ref,
) {
  return <BaseSelect.Value ref={ref} className={withClassName(cls.value, className)} {...props} />;
});

export type SelectIconProps = Omit<BaseSelect.Icon.Props, "ref">;

/** Up and down chevrons, icon-sized; children replace them. */
export const SelectIcon: ForwardRefExoticComponent<
  SelectIconProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SelectIconProps>(function SelectIcon(
  { className, children = glyph("chevrons"), ...props },
  ref,
) {
  return (
    <BaseSelect.Icon ref={ref} className={withClassName(cls.icon, className)} {...props}>
      {children}
    </BaseSelect.Icon>
  );
});

export interface SelectTriggerProps extends Omit<BaseSelect.Trigger.Props, "ref"> {
  /** Shown while nothing is selected, by the Value drawn when the trigger has no children. */
  placeholder?: ReactNode;
}

/** The field. Without children it draws a Value and an Icon. */
export const SelectTrigger: ForwardRefExoticComponent<
  SelectTriggerProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, SelectTriggerProps>(function SelectTrigger(
  { className, placeholder, children, ...props },
  ref,
) {
  const { size } = useContext(SelectContext);
  const gate = useShakeGate(ref);
  return (
    <BaseSelect.Trigger
      ref={gate}
      className={withClassName(cls.trigger, className)}
      data-size={size}
      {...props}
    >
      {children ?? (
        <>
          <SelectValue placeholder={placeholder} />
          <SelectIcon />
        </>
      )}
    </BaseSelect.Trigger>
  );
});

export type SelectPositionerProps = Omit<BaseSelect.Positioner.Props, "ref">;

/**
 * Lays the selected item's text over the trigger's, as Base UI does, so the popup covers the
 * trigger at its width. Where that cannot work, on touch and near the screen's edges, the popup
 * hangs 6px from the trigger's start instead. With `multiple` it always does, so the trigger stays
 * in view as it adds up the picks. It takes the text direction from DirectionProvider, since the
 * portal leaves the subtree that sets `dir`.
 */
export const SelectPositioner: ForwardRefExoticComponent<
  SelectPositionerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectPositionerProps>(function SelectPositioner(
  { className, sideOffset = 6, align = "start", alignItemWithTrigger, children, ...props },
  ref,
) {
  const direction = useDirection();
  const { multiple } = useContext(SelectContext);
  const overlay = alignItemWithTrigger ?? !multiple;
  const placed = useMemo(() => ({ overlay }), [overlay]);
  return (
    <BaseSelect.Positioner
      ref={ref}
      className={withClassName(cls.positioner, className)}
      sideOffset={sideOffset}
      align={align}
      alignItemWithTrigger={overlay}
      dir={direction}
      {...props}
    >
      <PlacedContext.Provider value={placed}>{children}</PlacedContext.Provider>
    </BaseSelect.Positioner>
  );
});

export type SelectScrollUpArrowProps = Omit<BaseSelect.ScrollUpArrow.Props, "ref">;

/** Shows while the list has more above; the pointer resting on it scrolls. */
export const SelectScrollUpArrow: ForwardRefExoticComponent<
  SelectScrollUpArrowProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectScrollUpArrowProps>(function SelectScrollUpArrow(
  { className, children = glyph("up"), ...props },
  ref,
) {
  return (
    <BaseSelect.ScrollUpArrow
      ref={ref}
      className={withClassName(cls.scrollUpArrow, className)}
      {...props}
    >
      {children}
    </BaseSelect.ScrollUpArrow>
  );
});

export type SelectScrollDownArrowProps = Omit<BaseSelect.ScrollDownArrow.Props, "ref">;

/** Shows while the list has more below; the pointer resting on it scrolls. */
export const SelectScrollDownArrow: ForwardRefExoticComponent<
  SelectScrollDownArrowProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectScrollDownArrowProps>(function SelectScrollDownArrow(
  { className, children = glyph("down"), ...props },
  ref,
) {
  return (
    <BaseSelect.ScrollDownArrow
      ref={ref}
      className={withClassName(cls.scrollDownArrow, className)}
      {...props}
    >
      {children}
    </BaseSelect.ScrollDownArrow>
  );
});

export type SelectListProps = Omit<BaseSelect.List.Props, "ref">;

/**
 * The scrolling list, which holds the Glide highlight so it scrolls with the items. Glide lights
 * the item nearest the pointer; the keyboard's highlight (focus) moves it too.
 */
export const SelectList: ForwardRefExoticComponent<
  SelectListProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectListProps>(function SelectList(
  { className, onFocus, children, ...props },
  ref,
) {
  const glide = useGlide<HTMLDivElement>({ axis: "y", items: ITEMS });
  const { ref: glideRef, setActive } = glide;
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      glideRef(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [glideRef, ref],
  );
  const follow = (event: Parameters<NonNullable<SelectListProps["onFocus"]>>[0]) => {
    onFocus?.(event);
    const item = event.target as HTMLElement;
    // Base UI focuses a disabled item under the pointer too; Glide passes those by.
    if (item.matches(ITEMS) && !item.matches("[data-disabled]:hover")) setActive(item);
  };
  return (
    <BaseSelect.List
      ref={setRef}
      className={withClassName(cls.list, className)}
      onFocus={follow}
      {...props}
    >
      <GlideHighlight glide={glide} />
      {children}
    </BaseSelect.List>
  );
});

export type SelectPopupProps = Omit<BaseSelect.Popup.Props, "ref">;

/**
 * The panel with the popup shadow. Without a Positioner around it, it draws a Portal and a
 * Positioner; without a List directly inside it, a List and the scroll arrows around its children.
 */
export const SelectPopup: ForwardRefExoticComponent<
  SelectPopupProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectPopupProps>(function SelectPopup(
  { className, children, ...props },
  ref,
) {
  const { size, instant, modal, open, multiple } = useContext(SelectContext);
  const placed = useContext(PlacedContext);
  const [self, setSelf] = useState<HTMLDivElement | null>(null);
  // Over its trigger Base UI locks the page even when not modal, since the popup cannot follow a
  // scroll; this lock takes that over, so the page is not drawn again.
  const overlay = placed ? placed.overlay : !multiple;
  useScrollLock(self, open && (modal || overlay));
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      setSelf(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  const popup = (
    <BaseSelect.Popup
      ref={setRef}
      className={withClassName(cls.popup, className)}
      data-size={size}
      data-instant={instant ? "" : undefined}
      {...props}
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
});

export type SelectItemTextProps = Omit<BaseSelect.ItemText.Props, "ref">;

/** The label: what lands on the trigger's text, and what typing matches. */
export const SelectItemText: ForwardRefExoticComponent<
  SelectItemTextProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectItemTextProps>(function SelectItemText(
  { className, ...props },
  ref,
) {
  return (
    <BaseSelect.ItemText ref={ref} className={withClassName(cls.itemText, className)} {...props} />
  );
});

export type SelectItemIndicatorProps = Omit<BaseSelect.ItemIndicator.Props, "ref">;

/** A check, icon-sized. It keeps its room while unselected, so labels stay in line. */
export const SelectItemIndicator: ForwardRefExoticComponent<
  SelectItemIndicatorProps & RefAttributes<HTMLSpanElement>
> = forwardRef<HTMLSpanElement, SelectItemIndicatorProps>(function SelectItemIndicator(
  { className, keepMounted = true, children = glyph("check"), ...props },
  ref,
) {
  return (
    <BaseSelect.ItemIndicator
      ref={ref}
      className={withClassName(cls.itemIndicator, className)}
      keepMounted={keepMounted}
      {...props}
    >
      {children}
    </BaseSelect.ItemIndicator>
  );
});

export type SelectItemProps = Omit<BaseSelect.Item.Props, "ref">;

/**
 * An option. Plain children go in an ItemText, then an ItemIndicator at the end, where the
 * trigger's icon is; explicit parts stay in your order.
 */
export const SelectItem: ForwardRefExoticComponent<SelectItemProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, SelectItemProps>(function SelectItem(
    { className, children, ...props },
    ref,
  ) {
    return (
      <BaseSelect.Item ref={ref} className={withClassName(cls.item, className)} {...props}>
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
  });

export type SelectGroupLabelProps = Omit<BaseSelect.GroupLabel.Props, "ref">;

/** A group's name, small and muted; it labels the group for assistive technology too. */
export const SelectGroupLabel: ForwardRefExoticComponent<
  SelectGroupLabelProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectGroupLabelProps>(function SelectGroupLabel(
  { className, ...props },
  ref,
) {
  return (
    <BaseSelect.GroupLabel
      ref={ref}
      className={withClassName(cls.groupLabel, className)}
      {...props}
    />
  );
});

export type SelectSeparatorProps = Omit<BaseSelect.Separator.Props, "ref">;

/** A hairline between groups. */
export const SelectSeparator: ForwardRefExoticComponent<
  SelectSeparatorProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, SelectSeparatorProps>(function SelectSeparator(
  { className, ...props },
  ref,
) {
  return (
    <BaseSelect.Separator
      ref={ref}
      className={withClassName(cls.separator, className)}
      {...props}
    />
  );
});
