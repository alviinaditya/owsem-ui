import type { ComponentType } from "react";
import type { LabProps } from "@/components/lab/lab-shell";
import type { ComponentName } from "@/lib/catalog";
import SeparatorLab from "./separator";
import TreeRailNavLab from "./tree-rail-nav";

/**
 * One client component per available component, so a Lab page loads only its own stage. The
 * build fails if an available component has none (see the component page).
 */
export const labs: Partial<Record<ComponentName, ComponentType<LabProps>>> = {
  separator: SeparatorLab,
  "tree-rail-nav": TreeRailNavLab,
};
