// No "use client" here: the namespace object must be readable from Server Components (FR-5).
export {
  CommandMenuCollection as Collection,
  CommandMenuEmpty as Empty,
  CommandMenuFooter as Footer,
  CommandMenuGroup as Group,
  CommandMenuGroupLabel as GroupLabel,
  CommandMenuInput as Input,
  CommandMenuItem as Item,
  CommandMenuItemDescription as ItemDescription,
  CommandMenuItemIcon as ItemIcon,
  CommandMenuItemLabel as ItemLabel,
  CommandMenuList as List,
  CommandMenuPopup as Popup,
  CommandMenuRoot as Root,
  CommandMenuShortcut as Shortcut,
  CommandMenuTrigger as Trigger,
  createCommandMenuHandle as createHandle,
} from "./command-menu";
