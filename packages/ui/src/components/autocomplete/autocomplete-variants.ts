// No "use client": an Autocomplete's classes can be used from Server Components.
// It is a Combobox whose value is free text, so the look, and its classes, are Combobox's.

export type {
  ComboboxSize as AutocompleteSize,
  ComboboxVariantProps as AutocompleteVariantProps,
} from "../combobox/combobox-variants";
export {
  comboboxInputGroupVariants as autocompleteInputGroupVariants,
  comboboxInputVariants as autocompleteInputVariants,
  comboboxPopupVariants as autocompletePopupVariants,
  comboboxSlots as autocompleteSlots,
} from "../combobox/combobox-variants";
