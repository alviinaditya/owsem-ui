"use client";

import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { type ReactElement, useContext, useMemo, useRef, useState } from "react";
import {
  ComboboxArrow,
  type ComboboxArrowProps,
  ComboboxBackdrop,
  type ComboboxBackdropProps,
  ComboboxClear,
  type ComboboxClearProps,
  ComboboxEmpty,
  type ComboboxEmptyProps,
  ComboboxGroup,
  ComboboxGroupLabel,
  type ComboboxGroupLabelProps,
  type ComboboxGroupProps,
  ComboboxIcon,
  type ComboboxIconProps,
  ComboboxInput,
  ComboboxInputGroup,
  type ComboboxInputGroupProps,
  type ComboboxInputProps,
  ComboboxItem,
  type ComboboxItemProps,
  ComboboxList,
  type ComboboxListProps,
  ComboboxPlacedContext,
  ComboboxPopup,
  type ComboboxPopupProps,
  ComboboxPortal,
  type ComboboxPortalProps,
  ComboboxPositioner,
  type ComboboxPositionerProps,
  ComboboxRow,
  type ComboboxRowProps,
  ComboboxSeparator,
  type ComboboxSeparatorProps,
  ComboboxSizeContext,
  ComboboxStatus,
  type ComboboxStatusProps,
  ComboboxTrigger,
  type ComboboxTriggerProps,
} from "../combobox/combobox";
import type { AutocompleteVariantProps } from "./autocomplete-variants";
import "./autocomplete.css";

// Base UI's Autocomplete is its Combobox with the selection taken out, so these parts are
// Combobox's: the same elements and classes, with their own `data-slot`.

export type AutocompleteRootProps<ItemValue> = BaseAutocomplete.Root.Props<ItemValue> &
  AutocompleteVariantProps;

/**
 * Base UI's Root, with one `size` for the field and the popup. The value is the input's text.
 * `mode` is Base UI's: `list` filters, `both` filters and fills the input with the highlighted
 * item, `inline` only fills it, `none` does neither.
 */
export function AutocompleteRoot<Items extends readonly { items: readonly unknown[] }[]>(
  props: Omit<AutocompleteRootProps<Items[number]["items"][number]>, "items"> & { items: Items },
): ReactElement;
export function AutocompleteRoot<ItemValue>(
  props: Omit<AutocompleteRootProps<ItemValue>, "items"> & {
    items?: readonly ItemValue[] | undefined;
  },
): ReactElement;
export function AutocompleteRoot({
  size = "md",
  filter,
  locale,
  value,
  onValueChange,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: Omit<AutocompleteRootProps<unknown>, "items"> & {
  items?: readonly unknown[] | undefined;
}): ReactElement {
  const { contains } = BaseAutocomplete.useFilter({ locale });
  // Picking fills the input with the item's text, which would filter the list down to that item
  // while the popup closes. The query the list showed is kept until the popup is gone.
  const [held, setHeld] = useState<string | null>(null);
  const latest = useRef(props.defaultValue ?? "");
  const base = filter === undefined ? contains : filter;
  const holding = useMemo(
    () =>
      base && held !== null
        ? (item: unknown, _query: string, label?: (item: unknown) => string) =>
            base(item, held, label)
        : base,
    [base, held],
  );
  return (
    <ComboboxSizeContext.Provider value={size}>
      <BaseAutocomplete.Root
        {...props}
        filter={holding}
        locale={locale}
        value={value}
        onValueChange={(next, details) => {
          if (details.reason === "item-press") {
            setHeld(String(value ?? latest.current));
          }
          latest.current = next;
          onValueChange?.(next, details);
        }}
        onOpenChange={(open, details) => {
          if (open) {
            setHeld(null);
          }
          onOpenChange?.(open, details);
        }}
        onOpenChangeComplete={(open) => {
          if (!open) {
            setHeld(null);
          }
          onOpenChangeComplete?.(open);
        }}
      />
    </ComboboxSizeContext.Provider>
  );
}

export type AutocompleteValueProps = BaseAutocomplete.Value.Props;
/** The input's text; it renders no element of its own. */
export const AutocompleteValue: typeof BaseAutocomplete.Value = BaseAutocomplete.Value;
export type AutocompleteCollectionProps = BaseAutocomplete.Collection.Props;
export const AutocompleteCollection: typeof BaseAutocomplete.Collection =
  BaseAutocomplete.Collection;

export type AutocompleteInputGroupProps = ComboboxInputGroupProps;

/** A field that holds the input and the Clear and Trigger buttons; without one, Input is the field. */
export function AutocompleteInputGroup(props: AutocompleteInputGroupProps): ReactElement {
  return <ComboboxInputGroup data-slot="autocomplete-input-group" {...props} />;
}

export type AutocompleteInputProps = ComboboxInputProps;

/** The text field, with free text as its value. Alone it looks like an Input. */
export function AutocompleteInput(props: AutocompleteInputProps): ReactElement {
  return <ComboboxInput data-slot="autocomplete-input" {...props} />;
}

export type AutocompleteIconProps = ComboboxIconProps;

/** A chevron, icon-sized; children replace it. */
export function AutocompleteIcon(props: AutocompleteIconProps): ReactElement {
  return <ComboboxIcon data-slot="autocomplete-icon" {...props} />;
}

export type AutocompleteTriggerProps = ComboboxTriggerProps;

/** Opens and closes the list. Without children it draws the chevron Icon. */
export function AutocompleteTrigger(props: AutocompleteTriggerProps): ReactElement {
  return (
    <ComboboxTrigger data-slot="autocomplete-trigger" {...props}>
      {props.children ?? <AutocompleteIcon />}
    </ComboboxTrigger>
  );
}

export type AutocompleteClearProps = ComboboxClearProps;

/** Empties the input; it shows while there is text. Without children it draws an ×. */
export function AutocompleteClear(props: AutocompleteClearProps): ReactElement {
  return <ComboboxClear data-slot="autocomplete-clear" {...props} />;
}

export type AutocompletePortalProps = ComboboxPortalProps;

/** Base UI's Portal. */
export function AutocompletePortal(props: AutocompletePortalProps): ReactElement {
  return <ComboboxPortal data-slot="autocomplete-portal" {...props} />;
}

export type AutocompleteBackdropProps = ComboboxBackdropProps;

/** A clear layer under the popup that takes presses outside it. */
export function AutocompleteBackdrop(props: AutocompleteBackdropProps): ReactElement {
  return <ComboboxBackdrop data-slot="autocomplete-backdrop" {...props} />;
}

export type AutocompletePositionerProps = ComboboxPositionerProps;

/** Places the popup under the field, 6px away and starting where it starts. */
export function AutocompletePositioner(props: AutocompletePositionerProps): ReactElement {
  return <ComboboxPositioner data-slot="autocomplete-positioner" {...props} />;
}

export type AutocompletePopupProps = ComboboxPopupProps;

/**
 * The panel, Combobox's. Without a Positioner around it, it draws a Portal and a Positioner. With
 * nothing to show, no match and no Empty text, it is hidden.
 */
export function AutocompletePopup(props: AutocompletePopupProps): ReactElement {
  const popup = <ComboboxPopup data-slot="autocomplete-popup" {...props} />;
  if (useContext(ComboboxPlacedContext)) return popup;
  return (
    <AutocompletePortal>
      <AutocompletePositioner>{popup}</AutocompletePositioner>
    </AutocompletePortal>
  );
}

export type AutocompleteArrowProps = ComboboxArrowProps;

/** Base UI's Arrow; it has no look until you give it one. */
export function AutocompleteArrow(props: AutocompleteArrowProps): ReactElement {
  return <ComboboxArrow data-slot="autocomplete-arrow" {...props} />;
}

export type AutocompleteStatusProps = ComboboxStatusProps;

/** A line over the list for loading or errors; announced politely. It shows only with text. */
export function AutocompleteStatus(props: AutocompleteStatusProps): ReactElement {
  return <ComboboxStatus data-slot="autocomplete-status" {...props} />;
}

export type AutocompleteEmptyProps = ComboboxEmptyProps;

/** What shows when no suggestion matches; with no text, nothing shows. */
export function AutocompleteEmpty(props: AutocompleteEmptyProps): ReactElement {
  return <ComboboxEmpty data-slot="autocomplete-empty" {...props} />;
}

export type AutocompleteListProps = ComboboxListProps;

/** The scrolling list, with Glide's highlight; the keyboard's highlight moves it too. */
export function AutocompleteList(props: AutocompleteListProps): ReactElement {
  return <ComboboxList data-slot="autocomplete-list" {...props} />;
}

export type AutocompleteRowProps = ComboboxRowProps;

/** A row of items, for a grid list. */
export function AutocompleteRow(props: AutocompleteRowProps): ReactElement {
  return <ComboboxRow data-slot="autocomplete-row" {...props} />;
}

export type AutocompleteItemProps = ComboboxItemProps;

/** A suggestion. Pressing it fills the input with its text. */
export function AutocompleteItem(props: AutocompleteItemProps): ReactElement {
  return <ComboboxItem data-slot="autocomplete-item" {...props} />;
}

export type AutocompleteGroupProps = ComboboxGroupProps;

/** Suggestions under one GroupLabel. */
export function AutocompleteGroup(props: AutocompleteGroupProps): ReactElement {
  return <ComboboxGroup data-slot="autocomplete-group" {...props} />;
}

export type AutocompleteGroupLabelProps = ComboboxGroupLabelProps;

/** A group's name, small and muted; it labels the group for assistive technology too. */
export function AutocompleteGroupLabel(props: AutocompleteGroupLabelProps): ReactElement {
  return <ComboboxGroupLabel data-slot="autocomplete-group-label" {...props} />;
}

export type AutocompleteSeparatorProps = ComboboxSeparatorProps;

/** A hairline between groups. */
export function AutocompleteSeparator(props: AutocompleteSeparatorProps): ReactElement {
  return <ComboboxSeparator data-slot="autocomplete-separator" {...props} />;
}

/** Base UI's filter hooks, as they are. */
export const useAutocompleteFilter: typeof BaseAutocomplete.useFilter = BaseAutocomplete.useFilter;
export const useAutocompleteFilteredItems: typeof BaseAutocomplete.useFilteredItems =
  BaseAutocomplete.useFilteredItems;

export declare namespace AutocompleteRoot {
  type Props<ItemValue> = AutocompleteRootProps<ItemValue>;
  type State = BaseAutocomplete.Root.State;
  type Actions = BaseAutocomplete.Root.Actions;
  type ChangeEventDetails = BaseAutocomplete.Root.ChangeEventDetails;
  type OpenChangeEventDetails = BaseAutocomplete.Root.OpenChangeEventDetails;
}
