// No "use client": the classes of Copy Button can be used from Server Components.

/**
 * The classes of the parts. The root is a Button, so it also carries `ow-copy-button`, which
 * Copy Button adds to Button's own.
 */
export const copyButtonSlots = {
  root: "ow-copy-button",
  icon: "ow-copy-button__icon",
  check: "ow-copy-button__check",
  label: "ow-copy-button__label",
  labelText: "ow-copy-button__label-text",
  tip: "ow-copy-button__tip",
  tipText: "ow-copy-button__tip-text",
  status: "ow-copy-button__status",
} as const;
