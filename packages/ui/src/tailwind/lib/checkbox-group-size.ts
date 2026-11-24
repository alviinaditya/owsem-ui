// Generated from core/checkbox-group-size.ts by scripts/build-tailwind.ts; do not edit.
"use client";

import { type Context, createContext, type Provider, useContext } from "react";

export type CheckboxGroupSize = "sm" | "md" | "lg";

// The group's size reaches the Checkboxes in it; outside a group there is none.
const SizeContext: Context<CheckboxGroupSize | undefined> = createContext<
  CheckboxGroupSize | undefined
>(undefined);

export const CheckboxGroupSizeProvider: Provider<CheckboxGroupSize | undefined> =
  SizeContext.Provider;

/** The size of the Checkbox Group around, if any. */
export function useCheckboxGroupSize(): CheckboxGroupSize | undefined {
  return useContext(SizeContext);
}
