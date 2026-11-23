// No "use client": the classes of Command Menu can be used from Server Components.
import { cn } from "../../core/cn";

export type CommandMenuSize = "sm" | "md" | "lg";

export interface CommandMenuVariantProps {
  /** The type scale and row height: 13, 14, or 16px. @default "md" */
  size?: CommandMenuSize | undefined;
}

const triggerSizeClass: Record<CommandMenuSize, string> = {
  sm: "ow-command-menu__trigger--sm",
  md: "ow-command-menu__trigger--md",
  lg: "ow-command-menu__trigger--lg",
};

const popupSizeClass: Record<CommandMenuSize, string> = {
  sm: "ow-command-menu__popup--sm",
  md: "ow-command-menu__popup--md",
  lg: "ow-command-menu__popup--lg",
};

/** The trigger's classes. */
export function commandMenuTriggerVariants({ size = "md" }: CommandMenuVariantProps = {}): string {
  return cn("ow-command-menu__trigger", triggerSizeClass[size]);
}

/** The popup's classes. */
export function commandMenuPopupVariants({ size = "md" }: CommandMenuVariantProps = {}): string {
  return cn("ow-command-menu__popup", popupSizeClass[size]);
}

/** The classes of the other parts. */
export const commandMenuSlots = {
  icon: "ow-command-menu__icon",
  backdrop: "ow-command-menu__backdrop",
  viewport: "ow-command-menu__viewport",
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
