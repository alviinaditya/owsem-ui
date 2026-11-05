import type { ComponentType } from "react";
import type { LabProps } from "@/components/lab/lab-shell";
import type { ComponentName } from "@/lib/catalog";
import ButtonLab from "./button";
import CodeBlockLab from "./code-block";
import CheckboxLab from "./checkbox";
import ColorPickerLab from "./color-picker";
import CommandMenuLab from "./command-menu";
import CopyButtonLab from "./copy-button";
import IconMorphLab from "./icon-morph";
import DialogLab from "./dialog";
import KbdLab from "./kbd";
import MenuLab from "./menu";
import PopoverLab from "./popover";
import ScrollAreaLab from "./scroll-area";
import RadioGroupLab from "./radio-group";
import SelectLab from "./select";
import SeparatorLab from "./separator";
import SwitchLab from "./switch";
import TableOfContentsLab from "./table-of-contents";
import TabsLab from "./tabs";
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
  "code-block": CodeBlockLab,
  checkbox: CheckboxLab,
  "color-picker": ColorPickerLab,
  "command-menu": CommandMenuLab,
  "copy-button": CopyButtonLab,
  "icon-morph": IconMorphLab,
  dialog: DialogLab,
  kbd: KbdLab,
  menu: MenuLab,
  popover: PopoverLab,
  "scroll-area": ScrollAreaLab,
  "radio-group": RadioGroupLab,
  select: SelectLab,
  separator: SeparatorLab,
  switch: SwitchLab,
  "table-of-contents": TableOfContentsLab,
  tabs: TabsLab,
  toggle: ToggleLab,
  "toggle-group": ToggleGroupLab,
  toolbar: ToolbarLab,
  tooltip: TooltipLab,
  "tree-rail-nav": TreeRailNavLab,
};
