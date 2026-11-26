import type { ComponentType } from "react";
import type { ExamplePageProps } from "@/components/component-page/component-page";
import type { ComponentName } from "@/lib/catalog";
import AccordionPage from "./accordion";
import AlertDialogPage from "./alert-dialog";
import AvatarPage from "./avatar";
import ButtonPage from "./button";
import CheckboxPage from "./checkbox";
import CheckboxGroupPage from "./checkbox-group";
import CodeBlockPage from "./code-block";
import CollapsiblePage from "./collapsible";
import ColorPickerPage from "./color-picker";
import CommandMenuPage from "./command-menu";
import CopyButtonPage from "./copy-button";
import DialogPage from "./dialog";
import DrawerPage from "./drawer";
import FieldPage from "./field";
import FieldsetPage from "./fieldset";
import FormPage from "./form";
import IconMorphPage from "./icon-morph";
import InputPage from "./input";
import KbdPage from "./kbd";
import MenuPage from "./menu";
import MeterPage from "./meter";
import NumberFieldPage from "./number-field";
import OTPFieldPage from "./otp-field";
import PopoverPage from "./popover";
import PreviewCardPage from "./preview-card";
import ProgressPage from "./progress";
import RadioGroupPage from "./radio-group";
import ScrollAreaPage from "./scroll-area";
import SelectPage from "./select";
import SeparatorPage from "./separator";
import SidebarPage from "./sidebar";
import SliderPage from "./slider";
import SwitchPage from "./switch";
import TablePage from "./table";
import TableOfContentsPage from "./table-of-contents";
import TabsPage from "./tabs";
import TogglePage from "./toggle";
import ToggleGroupPage from "./toggle-group";
import ToolbarPage from "./toolbar";
import TooltipPage from "./tooltip";
import TreeRailNavPage from "./tree-rail-nav";

/**
 * Components on the preview-first page (components/component-page). Every available component is
 * listed here, with its examples in examples/<name>.tsx and its Docs in
 * content/components/<lang>/<name>.mdx. One client component each, so a page loads only its own
 * demos.
 */
export const examples: Partial<Record<ComponentName, ComponentType<ExamplePageProps>>> = {
  button: ButtonPage,
  switch: SwitchPage,
  table: TablePage,
  checkbox: CheckboxPage,
  field: FieldPage,
  fieldset: FieldsetPage,
  form: FormPage,
  input: InputPage,
  "color-picker": ColorPickerPage,
  "command-menu": CommandMenuPage,
  "copy-button": CopyButtonPage,
  dialog: DialogPage,
  kbd: KbdPage,
  menu: MenuPage,
  popover: PopoverPage,
  "radio-group": RadioGroupPage,
  select: SelectPage,
  separator: SeparatorPage,
  toggle: TogglePage,
  "toggle-group": ToggleGroupPage,
  toolbar: ToolbarPage,
  "table-of-contents": TableOfContentsPage,
  sidebar: SidebarPage,
  "tree-rail-nav": TreeRailNavPage,
  tooltip: TooltipPage,
  tabs: TabsPage,
  "scroll-area": ScrollAreaPage,
  accordion: AccordionPage,
  collapsible: CollapsiblePage,
  avatar: AvatarPage,
  progress: ProgressPage,
  meter: MeterPage,
  "checkbox-group": CheckboxGroupPage,
  "number-field": NumberFieldPage,
  slider: SliderPage,
  "otp-field": OTPFieldPage,
  "alert-dialog": AlertDialogPage,
  drawer: DrawerPage,
  "preview-card": PreviewCardPage,
  "icon-morph": IconMorphPage,
  "code-block": CodeBlockPage,
};
