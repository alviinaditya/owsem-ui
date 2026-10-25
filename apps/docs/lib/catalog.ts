/**
 * Every v1.0 component, in PRD order: Base phases 1 to 3, then Owsem components. Base is a Base UI
 * component with OwsemUI's styling; Owsem is OwsemUI's own, beyond Base UI (PRD, principle 3). The docs
 * sidebar, index, and Lab routes and the registry build read it. Descriptions live in the
 * dictionaries. Run by Node too (build-registry.ts): erasable TypeScript only.
 */

export type Family = "base" | "owsem";
export type Category = "action" | "form" | "overlay" | "navigation" | "disclosure" | "display";
export type Expression = "lumen" | "kinetic" | "tactile" | "surface";

export interface CatalogEntry {
  /** URL slug and registry item name. */
  name: string;
  title: string;
  family: Family;
  category: Category;
  /** Base phase; Owsem components have none. */
  phase?: 1 | 2 | 3;
  /** Expressions (PRD, Owsem scope): Base may have Tactile and Kinetic; Lumen and Surface are Owsem's. */
  expressions?: readonly Expression[];
  /** "planned" shows a Coming soon page; the others need a Lab and a packages/ui folder. */
  status: "planned" | "prototype" | "done";
}

export const CATEGORIES: readonly Category[] = [
  "action",
  "form",
  "overlay",
  "navigation",
  "disclosure",
  "display",
];

// biome-ignore format: one row per component reads like the PRD tables
export const catalog = [
  { name: "button", title: "Button", family: "base", category: "action", phase: 1, expressions: ["tactile"], status: "prototype" },
  { name: "separator", title: "Separator", family: "base", category: "display", phase: 1, status: "prototype" },
  { name: "kbd", title: "Kbd", family: "base", category: "display", phase: 1, status: "prototype" },
  { name: "field", title: "Field", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "fieldset", title: "Fieldset", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "form", title: "Form", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "input", title: "Input", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "checkbox", title: "Checkbox", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "radio-group", title: "Radio Group", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "switch", title: "Switch", family: "base", category: "form", phase: 1, expressions: ["tactile"], status: "planned" },
  { name: "select", title: "Select", family: "base", category: "form", phase: 1, status: "planned" },
  { name: "dialog", title: "Dialog", family: "base", category: "overlay", phase: 1, status: "planned" },
  { name: "popover", title: "Popover", family: "base", category: "overlay", phase: 1, status: "prototype" },
  { name: "tooltip", title: "Tooltip", family: "base", category: "overlay", phase: 1, status: "prototype" },
  { name: "menu", title: "Menu", family: "base", category: "navigation", phase: 1, status: "prototype" },
  { name: "tabs", title: "Tabs", family: "base", category: "navigation", phase: 1, expressions: ["kinetic"], status: "planned" },
  { name: "scroll-area", title: "Scroll Area", family: "base", category: "display", phase: 1, status: "planned" },
  { name: "toggle", title: "Toggle", family: "base", category: "action", phase: 2, status: "prototype" },
  { name: "toggle-group", title: "Toggle Group", family: "base", category: "action", phase: 2, expressions: ["tactile", "kinetic"], status: "planned" },
  { name: "toolbar", title: "Toolbar", family: "base", category: "action", phase: 2, status: "prototype" },
  { name: "checkbox-group", title: "Checkbox Group", family: "base", category: "form", phase: 2, status: "planned" },
  { name: "number-field", title: "Number Field", family: "base", category: "form", phase: 2, status: "planned" },
  { name: "slider", title: "Slider", family: "base", category: "form", phase: 2, expressions: ["tactile", "kinetic"], status: "planned" },
  { name: "combobox", title: "Combobox", family: "base", category: "form", phase: 2, status: "planned" },
  { name: "autocomplete", title: "Autocomplete", family: "base", category: "form", phase: 2, status: "planned" },
  { name: "alert-dialog", title: "Alert Dialog", family: "base", category: "overlay", phase: 2, status: "planned" },
  { name: "toast", title: "Toast", family: "base", category: "overlay", phase: 2, expressions: ["kinetic"], status: "planned" },
  { name: "accordion", title: "Accordion", family: "base", category: "disclosure", phase: 2, expressions: ["kinetic"], status: "planned" },
  { name: "collapsible", title: "Collapsible", family: "base", category: "disclosure", phase: 2, status: "planned" },
  { name: "otp-field", title: "OTP Field", family: "base", category: "form", phase: 3, status: "planned" },
  { name: "drawer", title: "Drawer", family: "base", category: "overlay", phase: 3, status: "planned" },
  { name: "preview-card", title: "Preview Card", family: "base", category: "overlay", phase: 3, status: "planned" },
  { name: "context-menu", title: "Context Menu", family: "base", category: "navigation", phase: 3, status: "planned" },
  { name: "menubar", title: "Menubar", family: "base", category: "navigation", phase: 3, status: "planned" },
  { name: "navigation-menu", title: "Navigation Menu", family: "base", category: "navigation", phase: 3, status: "planned" },
  { name: "avatar", title: "Avatar", family: "base", category: "display", phase: 3, status: "planned" },
  { name: "progress", title: "Progress", family: "base", category: "display", phase: 3, status: "planned" },
  { name: "meter", title: "Meter", family: "base", category: "display", phase: 3, status: "planned" },
  { name: "tree-rail-nav", title: "Tree Rail Nav", family: "owsem", category: "navigation", expressions: ["kinetic"], status: "prototype" },
  { name: "lumen-rail-nav", title: "Lumen Rail Nav", family: "owsem", category: "navigation", expressions: ["lumen", "kinetic"], status: "planned" },
  { name: "command-menu", title: "Command Menu", family: "owsem", category: "navigation", expressions: ["kinetic", "surface"], status: "prototype" },
  { name: "number-ticker", title: "Number Ticker", family: "owsem", category: "display", expressions: ["kinetic"], status: "planned" },
  { name: "spotlight-card", title: "Spotlight Card", family: "owsem", category: "display", expressions: ["surface", "lumen"], status: "planned" },
] as const satisfies readonly CatalogEntry[];

export type ComponentName = (typeof catalog)[number]["name"];

/** The order the sidebar lists components in: by category, then PRD order. Previous and next follow it. */
export const readingOrder = CATEGORIES.flatMap((category) =>
  catalog.filter((entry) => entry.category === category),
);

export const isAvailable = (entry: CatalogEntry): boolean => entry.status !== "planned";

/** Base UI docs for components built on a Base UI counterpart. */
export const baseUiUrl = (entry: CatalogEntry): string | undefined =>
  entry.family === "owsem" ? undefined : `https://base-ui.com/react/components/${entry.name}`;
