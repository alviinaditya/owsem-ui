"use client";

import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { useDirection } from "@base-ui/react/direction-provider";
import {
  type Context,
  createContext,
  type ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "../../core/cn";
import { GlideHighlight, useGlide } from "../../core/glide/use-glide";
import { useMergedRefs } from "../../core/merge-refs";
import { useShakeGate } from "../../core/shake";
import {
  type ComboboxSize,
  type ComboboxVariantProps,
  comboboxInputGroupVariants,
  comboboxInputVariants,
  comboboxPopupVariants,
  comboboxSlots,
} from "./combobox-variants";
import "./combobox.css";

const ITEMS = '[role="option"]';

// Lucide icons (ISC): chevron-down, x, check.
const glyph = (shape: "chevron" | "x" | "check") => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {shape === "chevron" ? <path d="m6 9 6 6 6-6" /> : null}
    {shape === "x" ? <path d="M18 6 6 18M6 6l12 12" /> : null}
    {shape === "check" ? <path d="M20 6 9 17l-5-5" /> : null}
  </svg>
);

/** The size the Root sets, for the parts in the field and in the popup (which is in a portal). */
export const ComboboxSizeContext: Context<ComboboxSize> = createContext<ComboboxSize>("md");
/** Whether an Input sits in an InputGroup, which draws the field; alone, the Input is the field. */
const InGroupContext = createContext(false);
/** Inside a Positioner; a Popup outside one draws its own. */
export const ComboboxPlacedContext: Context<boolean> = createContext(false);

export type ComboboxRootProps<
  Value,
  Multiple extends boolean | undefined = false,
  Item = Value,
> = BaseCombobox.Root.Props<Value, Multiple, Item> & ComboboxVariantProps;

/** Base UI's Root, with one `size` for the field and the popup. */
export function ComboboxRoot<Value, Multiple extends boolean | undefined = false, Item = Value>({
  size = "md",
  ...props
}: ComboboxRootProps<Value, Multiple, Item>): ReactElement {
  return (
    <ComboboxSizeContext.Provider value={size}>
      <BaseCombobox.Root {...props} />
    </ComboboxSizeContext.Provider>
  );
}

export type ComboboxValueProps = BaseCombobox.Value.Props;
/** The selected value's label, or the placeholder; it renders no element of its own. */
export const ComboboxValue: typeof BaseCombobox.Value = BaseCombobox.Value;
export type ComboboxCollectionProps = BaseCombobox.Collection.Props;
export const ComboboxCollection: typeof BaseCombobox.Collection = BaseCombobox.Collection;

export interface ComboboxLabelProps extends Omit<BaseCombobox.Label.Props, "className"> {
  className?: string | undefined;
}

/** Names the trigger, for the input inside the popup; an input outside needs a label or Field. */
export function ComboboxLabel({ className, ...props }: ComboboxLabelProps): ReactElement {
  return (
    <BaseCombobox.Label
      data-slot="combobox-label"
      {...props}
      className={cn(comboboxSlots.label, className)}
    />
  );
}

export interface ComboboxInputGroupProps extends Omit<BaseCombobox.InputGroup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The field: a tint with the input, and the Clear and Trigger buttons or the Chips, inside it. A
 * press on it anywhere focuses the input. It is as tall as an Input of the size.
 */
export function ComboboxInputGroup({
  className,
  ref,
  ...props
}: ComboboxInputGroupProps): ReactElement {
  const size = useContext(ComboboxSizeContext);
  const gate = useShakeGate(ref);
  return (
    <InGroupContext.Provider value={true}>
      <BaseCombobox.InputGroup
        data-slot="combobox-input-group"
        {...props}
        ref={gate}
        className={cn(comboboxInputGroupVariants({ size }), className)}
        data-size={size}
      />
    </InGroupContext.Provider>
  );
}

export interface ComboboxInputProps extends Omit<BaseCombobox.Input.Props, "className"> {
  className?: string | undefined;
}

/** The text field. In an InputGroup it is bare; alone it looks like an Input. */
export function ComboboxInput({ className, ref, ...props }: ComboboxInputProps): ReactElement {
  const size = useContext(ComboboxSizeContext);
  const grouped = useContext(InGroupContext);
  const gate = useShakeGate(ref);
  return (
    <BaseCombobox.Input
      data-slot="combobox-input"
      {...props}
      ref={gate}
      className={cn(
        grouped ? comboboxSlots.inputGroupInput : comboboxInputVariants({ size }),
        className,
      )}
      data-size={size}
    />
  );
}

export interface ComboboxIconProps extends Omit<BaseCombobox.Icon.Props, "className"> {
  className?: string | undefined;
}

/** A chevron, icon-sized; children replace it. */
export function ComboboxIcon({
  className,
  children = glyph("chevron"),
  ...props
}: ComboboxIconProps): ReactElement {
  return (
    <BaseCombobox.Icon
      data-slot="combobox-icon"
      {...props}
      className={cn(comboboxSlots.icon, className)}
    >
      {children}
    </BaseCombobox.Icon>
  );
}

export interface ComboboxTriggerProps extends Omit<BaseCombobox.Trigger.Props, "className"> {
  className?: string | undefined;
}

/** Opens and closes the list. Without children it draws the chevron Icon. */
export function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxTriggerProps): ReactElement {
  return (
    <BaseCombobox.Trigger
      data-slot="combobox-trigger"
      aria-label="Open"
      {...props}
      className={cn(comboboxSlots.trigger, className)}
    >
      {children ?? <ComboboxIcon />}
    </BaseCombobox.Trigger>
  );
}

export interface ComboboxClearProps extends Omit<BaseCombobox.Clear.Props, "className"> {
  className?: string | undefined;
}

/** Empties the selection and the input; it shows while there is something to clear. */
export function ComboboxClear({ className, children, ...props }: ComboboxClearProps): ReactElement {
  return (
    <BaseCombobox.Clear
      data-slot="combobox-clear"
      aria-label="Clear"
      {...props}
      className={cn(comboboxSlots.clear, className)}
    >
      {children ?? glyph("x")}
    </BaseCombobox.Clear>
  );
}

export interface ComboboxChipsProps extends Omit<BaseCombobox.Chips.Props, "className"> {
  className?: string | undefined;
}

/** Holds the Chips and the Input of a `multiple` combobox, inside the InputGroup. */
export function ComboboxChips({ className, ...props }: ComboboxChipsProps): ReactElement {
  return (
    <BaseCombobox.Chips
      data-slot="combobox-chips"
      {...props}
      className={cn(comboboxSlots.chips, className)}
    />
  );
}

export interface ComboboxChipProps extends Omit<BaseCombobox.Chip.Props, "className"> {
  className?: string | undefined;
}

/** One selected value as a pill; put a ChipRemove last. Backspace in the input removes the last. */
export function ComboboxChip({ className, ...props }: ComboboxChipProps): ReactElement {
  return (
    <BaseCombobox.Chip
      data-slot="combobox-chip"
      {...props}
      className={cn(comboboxSlots.chip, className)}
    />
  );
}

export interface ComboboxChipRemoveProps extends Omit<BaseCombobox.ChipRemove.Props, "className"> {
  className?: string | undefined;
}

/** Removes its chip: a 24px target with an ×; children replace it. */
export function ComboboxChipRemove({
  className,
  children,
  ...props
}: ComboboxChipRemoveProps): ReactElement {
  return (
    <BaseCombobox.ChipRemove
      data-slot="combobox-chip-remove"
      aria-label="Remove"
      {...props}
      className={cn(comboboxSlots.chipRemove, className)}
    >
      {children ?? glyph("x")}
    </BaseCombobox.ChipRemove>
  );
}

export interface ComboboxPortalProps extends Omit<BaseCombobox.Portal.Props, "className"> {
  className?: string | undefined;
}

/** Base UI's Portal. */
export function ComboboxPortal(props: ComboboxPortalProps): ReactElement {
  return <BaseCombobox.Portal data-slot="combobox-portal" {...props} />;
}

export interface ComboboxBackdropProps extends Omit<BaseCombobox.Backdrop.Props, "className"> {
  className?: string | undefined;
}

/** A clear layer under the popup that takes presses outside it. */
export function ComboboxBackdrop({ className, ...props }: ComboboxBackdropProps): ReactElement {
  return (
    <BaseCombobox.Backdrop
      data-slot="combobox-backdrop"
      {...props}
      className={cn(comboboxSlots.backdrop, className)}
    />
  );
}

export interface ComboboxPositionerProps extends Omit<BaseCombobox.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Places the popup under the field, 6px away and starting where it starts. It takes the text
 * direction from DirectionProvider, since the portal leaves the subtree that sets `dir`.
 */
export function ComboboxPositioner({
  className,
  sideOffset = 6,
  align = "start",
  ...props
}: ComboboxPositionerProps): ReactElement {
  const direction = useDirection();
  return (
    <ComboboxPlacedContext.Provider value={true}>
      <BaseCombobox.Positioner
        data-slot="combobox-positioner"
        dir={direction}
        {...props}
        className={cn(comboboxSlots.positioner, className)}
        sideOffset={sideOffset}
        align={align}
      />
    </ComboboxPlacedContext.Provider>
  );
}

export interface ComboboxPopupProps extends Omit<BaseCombobox.Popup.Props, "className"> {
  className?: string | undefined;
}

/**
 * The panel, Select's: a raised fill with the popup shadow. Without a Positioner around it, it
 * draws a Portal and a Positioner. With nothing to show, no match and no Empty text, it is hidden.
 */
export function ComboboxPopup({ className, ...props }: ComboboxPopupProps): ReactElement {
  const size = useContext(ComboboxSizeContext);
  const placed = useContext(ComboboxPlacedContext);
  const popup = (
    <BaseCombobox.Popup
      data-slot="combobox-popup"
      data-size={size}
      {...props}
      className={cn(comboboxPopupVariants({ size }), className)}
    />
  );
  if (placed) return popup;
  return (
    <ComboboxPortal>
      <ComboboxPositioner>{popup}</ComboboxPositioner>
    </ComboboxPortal>
  );
}

export interface ComboboxArrowProps extends Omit<BaseCombobox.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** Base UI's Arrow; it has no look until you give it one. */
export function ComboboxArrow({ className, ...props }: ComboboxArrowProps): ReactElement {
  return <BaseCombobox.Arrow data-slot="combobox-arrow" {...props} className={className} />;
}

export interface ComboboxStatusProps extends Omit<BaseCombobox.Status.Props, "className"> {
  className?: string | undefined;
}

/** A line over the list for loading or errors; announced politely. It shows only with text. */
export function ComboboxStatus({ className, ...props }: ComboboxStatusProps): ReactElement {
  return (
    <BaseCombobox.Status
      data-slot="combobox-status"
      {...props}
      className={cn(comboboxSlots.status, className)}
    />
  );
}

export interface ComboboxEmptyProps extends Omit<BaseCombobox.Empty.Props, "className"> {
  className?: string | undefined;
}

/** What shows when no item matches; with no text, nothing shows. */
export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps): ReactElement {
  return (
    <BaseCombobox.Empty
      data-slot="combobox-empty"
      {...props}
      className={cn(comboboxSlots.empty, className)}
    />
  );
}

export interface ComboboxListProps extends Omit<BaseCombobox.List.Props, "className"> {
  className?: string | undefined;
}

/**
 * The scrolling list, which holds the Glide highlight so it scrolls with the items. Focus stays in
 * the input, so Glide follows Base UI's highlight (`data-highlighted`) as well as the pointer.
 */
export function ComboboxList({
  className,
  children,
  ref,
  ...props
}: ComboboxListProps): ReactElement {
  const glide = useGlide<HTMLDivElement>({ axis: "y", items: ITEMS });
  const { setActive, refresh } = glide;
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const own = useMergedRefs(glide.ref, setList);
  const merged = useMergedRefs(own, ref);
  useEffect(() => {
    if (!list) return;
    const follow = () => {
      const item = list.querySelector<HTMLElement>(`${ITEMS}[data-highlighted]`);
      // Items that come and go under the pointer move the highlight with them.
      if (item) setActive(item);
      else refresh();
    };
    follow();
    const watch = new MutationObserver(follow);
    watch.observe(list, {
      attributes: true,
      attributeFilter: ["data-highlighted"],
      childList: true,
      subtree: true,
    });
    return () => watch.disconnect();
  }, [list, setActive, refresh]);
  return (
    <BaseCombobox.List
      data-slot="combobox-list"
      // The items may come from a function child, so the highlight goes in through `render`.
      render={(renderProps) => (
        <div {...renderProps}>
          <GlideHighlight glide={glide} />
          {renderProps.children}
        </div>
      )}
      {...props}
      ref={merged}
      className={cn(comboboxSlots.list, className)}
    >
      {children}
    </BaseCombobox.List>
  );
}

export interface ComboboxRowProps extends Omit<BaseCombobox.Row.Props, "className"> {
  className?: string | undefined;
}

/** A row of items, for a grid list. */
export function ComboboxRow({ className, ...props }: ComboboxRowProps): ReactElement {
  return <BaseCombobox.Row data-slot="combobox-row" {...props} className={className} />;
}

export interface ComboboxItemProps extends Omit<BaseCombobox.Item.Props, "className"> {
  className?: string | undefined;
}

/** An option. Put an ItemIndicator last: it draws a check at the end, where the chevron is. */
export function ComboboxItem({ className, ...props }: ComboboxItemProps): ReactElement {
  return (
    <BaseCombobox.Item
      data-slot="combobox-item"
      {...props}
      className={cn(comboboxSlots.item, className)}
    />
  );
}

export interface ComboboxItemIndicatorProps
  extends Omit<BaseCombobox.ItemIndicator.Props, "className"> {
  className?: string | undefined;
}

/** A check, icon-sized. It keeps its room while unselected, so labels stay in line. */
export function ComboboxItemIndicator({
  className,
  keepMounted = true,
  children,
  ...props
}: ComboboxItemIndicatorProps): ReactElement {
  return (
    <BaseCombobox.ItemIndicator
      data-slot="combobox-item-indicator"
      {...props}
      className={cn(comboboxSlots.itemIndicator, className)}
      keepMounted={keepMounted}
    >
      {children ?? glyph("check")}
    </BaseCombobox.ItemIndicator>
  );
}

export interface ComboboxGroupProps extends Omit<BaseCombobox.Group.Props, "className"> {
  className?: string | undefined;
}

/** Items under one GroupLabel. */
export function ComboboxGroup({ className, ...props }: ComboboxGroupProps): ReactElement {
  return <BaseCombobox.Group data-slot="combobox-group" {...props} className={className} />;
}

export interface ComboboxGroupLabelProps extends Omit<BaseCombobox.GroupLabel.Props, "className"> {
  className?: string | undefined;
}

/** A group's name, small and muted; it labels the group for assistive technology too. */
export function ComboboxGroupLabel({ className, ...props }: ComboboxGroupLabelProps): ReactElement {
  return (
    <BaseCombobox.GroupLabel
      data-slot="combobox-group-label"
      {...props}
      className={cn(comboboxSlots.groupLabel, className)}
    />
  );
}

export interface ComboboxSeparatorProps extends Omit<BaseCombobox.Separator.Props, "className"> {
  className?: string | undefined;
}

/** A hairline between groups. */
export function ComboboxSeparator({ className, ...props }: ComboboxSeparatorProps): ReactElement {
  return (
    <BaseCombobox.Separator
      data-slot="combobox-separator"
      {...props}
      className={cn(comboboxSlots.separator, className)}
    />
  );
}

/** Base UI's filter hooks, as they are. */
export const useComboboxFilter: typeof BaseCombobox.useFilter = BaseCombobox.useFilter;
export const useComboboxFilteredItems: typeof BaseCombobox.useFilteredItems =
  BaseCombobox.useFilteredItems;
export const createComboboxItems: typeof BaseCombobox.createItems = BaseCombobox.createItems;

export declare namespace ComboboxRoot {
  type Props<Value, Multiple extends boolean | undefined = false, Item = Value> = ComboboxRootProps<
    Value,
    Multiple,
    Item
  >;
  type State = BaseCombobox.Root.State;
  type Actions = BaseCombobox.Root.Actions;
  type ChangeEventDetails = BaseCombobox.Root.ChangeEventDetails;
  type OpenChangeEventDetails = BaseCombobox.Root.OpenChangeEventDetails;
}
