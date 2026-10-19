import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

/** Text for every docs language; the type check fails until each one exists. */
export type Localized = Record<Lang, string>;

export type Config = Record<string, string>;

export type Control<C extends Config> =
  | {
      key: keyof C & string;
      type: "choice";
      label: Localized;
      options: readonly { value: string; label: Localized }[];
    }
  | {
      key: keyof C & string;
      type: "color";
      label: Localized;
      /** The theme token the component uses until a color is chosen, such as --ow-line-dark. */
      token: string;
    };

/**
 * What a scene does to the stage while it is the settled scene. The visitor's own changes win
 * and stay after the scene ends; nothing has to be restored by hand.
 */
export interface SceneSpec<C extends Config> {
  cfg?: Partial<C>;
  code?: boolean;
  controls?: boolean;
  theme?: "light" | "dark";
}

export interface CodeFile {
  name: string;
  code: string;
}

/**
 * Everything component-specific in a Lab; the narrative lives in content/labs/<lang>/. Methods
 * (not function properties) keep labs with different configs assignable to LabDefinition<Config>.
 */
export interface LabDefinition<C extends Config> {
  initial: C;
  controls: readonly Control<C>[];
  /** The live demo on the stage. */
  demo(cfg: C, lang: Lang): ReactNode;
  /** Files for the code drawer, from the stage config and the visitor's token setup (DS-4). */
  code(cfg: C, setup: TokenSetup): CodeFile[];
  scenes?: Partial<Record<string, SceneSpec<C>>>;
}

/**
 * Checks a Lab against its own config, then erases the config type so the registry can hold labs
 * with different configs (the `keyof C` in controls makes C invariant).
 */
export const defineLab = <C extends Config>(lab: LabDefinition<C>): LabDefinition<Config> =>
  lab as unknown as LabDefinition<Config>;
