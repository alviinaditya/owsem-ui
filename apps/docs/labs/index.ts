import type { ComponentType } from "react";
import type { LabProps } from "@/components/lab/lab-shell";
import type { ComponentName } from "@/lib/catalog";
import ButtonLab from "./button";
import ColorPickerLab from "./color-picker";
import CommandMenuLab from "./command-menu";
import CopyButtonLab from "./copy-button";
import IconMorphLab from "./icon-morph";
import KbdLab from "./kbd";
import MenuLab from "./menu";
import PopoverLab from "./popover";
import SeparatorLab from "./separator";
import TableOfContentsLab from "./table-of-contents";
import ToggleLab from "./toggle";
import ToggleGroupLab from "./toggle-group";
import ToolbarLab from "./toolbar";
import TooltipLab from "./tooltip";
import TreeRailNavLab from "./tree-rail-nav";

/**
 * One client component per available component, so a Lab page loads only its own stage. The
 * build fails if an available component has none (see the component page).
 */
export const labs: Partial<Record<ComponentName, ComponentType<LabProps>>> = {
  button: ButtonLab,
  "color-picker": ColorPickerLab,
  "command-menu": CommandMenuLab,
  "copy-button": CopyButtonLab,
  "icon-morph": IconMorphLab,
  kbd: KbdLab,
  menu: MenuLab,
  popover: PopoverLab,
  separator: SeparatorLab,
  "table-of-contents": TableOfContentsLab,
  toggle: ToggleLab,
  "toggle-group": ToggleGroupLab,
  toolbar: ToolbarLab,
  tooltip: TooltipLab,
  "tree-rail-nav": TreeRailNavLab,
};
