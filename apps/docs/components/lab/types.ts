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

/** A named part, outlined by Inspect (DS-3) with its public tokens. */
export interface Part {
  name: string;
  /** Finds the part in the demo; the first match is the one outlined. */
  selector: string;
  note: Localized;
  /**
   * Its public tokens, each with the private property the part resolves it into: a public token
   * is unset until someone sets it, so the card shows the value in use.
   */
  tokens?: Readonly<Record<string, string>>;
}

/** What a scene script can do on the stage. Every step rejects once the script is stopped. */
export interface ScriptStage {
  /** The demo element, or the first match of a selector in the demo. */
  get(selector: string): HTMLElement;
  wait(ms: number): Promise<void>;
  /** Moves the shown pointer onto an element, sending real pointer events on the way. */
  point(target: Element): Promise<void>;
  /** Points at an element and clicks it. Focus stays where the visitor left it. */
  click(target: Element): Promise<void>;
  /**
   * Presses on an element, drags through `path` (points in its box, from 0 to 1 on each axis),
   * and lets go. Start on a thumb, so the press does not jump. Focus stays put here too.
   */
  drag(target: Element, path: readonly { x: number; y: number }[]): Promise<void>;
}

/** An animation on the demo (DS-11); it should end with the demo as it found it. */
export type SceneScript = (stage: ScriptStage) => Promise<void>;

/**
 * What a scene does to the stage while it is the settled scene. The visitor's own changes win
 * and stay after the scene ends; nothing has to be restored by hand.
 */
export interface SceneSpec<C extends Config> {
  cfg?: Partial<C>;
  code?: boolean;
  controls?: boolean;
  theme?: "light" | "dark";
  inspect?: boolean;
  /** Plays once the scene settles (not under reduced motion), and again on Replay. */
  play?: SceneScript;
  /** Shows instead of the Lab's demo during the scene, such as a Matrix of states and variants. */
  demo?(cfg: C, lang: Lang): ReactNode;
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
  /** The parts Inspect outlines, in the anatomy table's order. */
  parts?: readonly Part[];
  scenes?: Partial<Record<string, SceneSpec<C>>>;
}

/**
 * Checks a Lab against its own config, then erases the config type so the registry can hold labs
 * with different configs (the `keyof C` in controls makes C invariant).
 */
export const defineLab = <C extends Config>(lab: LabDefinition<C>): LabDefinition<Config> =>
  lab as unknown as LabDefinition<Config>;
