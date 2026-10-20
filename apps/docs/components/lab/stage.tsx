"use client";

import {
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Dictionary } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { Icon, type IconName } from "../icons/icon";
import { InstallPane } from "../install";
import { ScrollFade } from "../scroll-fade";
import { useTokenSetup } from "../token-setup";
import { ColorField } from "./color-field";
import { CopyButton } from "./copy-button";
import { Inspect } from "./inspect";
import {
  INSPECT_CARD,
  INSPECT_CARD_GAP,
  INSPECT_CARD_MIN,
  INSPECT_CHIPS,
  SIDE_BY_SIDE,
  SIDE_PANEL_MIN,
  SIDE_PANEL_WIDTH,
} from "./layout";
import { LiveCode } from "./live-code";
import { createScriptStage } from "./script-stage";
import type { CodeFile, Config, LabDefinition, SceneScript } from "./types";

type CardPlace = "side" | "below" | "none";

/** A script starts this long after its scene settles, once the stage has taken the scene's shape. */
const SCRIPT_LEAD_MS = 400;

export interface StageState {
  cfg: Config;
  setValue: (key: string, value: string) => void;
  reset: () => void;
  code: boolean;
  setCode: (open: boolean) => void;
  controls: boolean;
  setControls: (open: boolean) => void;
  /** Which of code and controls shows when a narrow stage has room for one. */
  prefer: "code" | "controls";
  /** Set only when the visitor or a scene picks one; otherwise the stage follows the site. */
  theme: "light" | "dark" | undefined;
  toggleTheme: () => void;
  inspect: boolean;
  setInspect: (on: boolean) => void;
  /** The part Inspect shows in its card. */
  part: string;
  setPart: (name: string) => void;
  /** The settled scene, when it shows its own demo. */
  view: string | undefined;
  /** The settled scene's script, if it has one. */
  script: SceneScript | undefined;
  /** A new value starts a run; undefined ends one. */
  playToken: string | undefined;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  replay: () => void;
  stop: () => void;
}

interface StageProps {
  lab: LabDefinition<Config>;
  lang: Lang;
  labels: Dictionary["lab"];
  title: ReactNode;
  state: StageState;
  /** The registry item, for the install tab. */
  item: string;
  pane: [hidden: boolean, toggle: () => void];
}

interface Shortcut {
  run: () => void;
  /** The region this shortcut may hide; if focus is inside it, focus moves to `focus`. */
  hides?: Element | null | undefined;
  focus?: HTMLElement | null | undefined;
}

export function Stage({ lab, lang, labels, title, state, item, pane }: StageProps) {
  const id = useId();
  const stageRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const paneToggleRef = useRef<HTMLButtonElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const toolRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const [paneHidden, togglePane] = pane;
  // Whether the stage is wide enough for the controls beside the demo (same as the container query).
  const [wide, setWide] = useState(true);
  // Where Inspect's part card has room, and the height it keeps for it (its tallest card).
  const [card, setCard] = useState<CardPlace>("none");
  const [cardHeight, setCardHeight] = useState(0);
  const inspect = state.inspect && Boolean(lab.parts?.length);

  // A narrow stage has one slot for the controls and the code.
  const both = state.code && state.controls && !wide;
  const code = state.code && (!both || state.prefer === "code");
  const controls = state.controls && (!both || state.prefer === "controls");
  const toggleCode = () => {
    if (!code && !wide) state.setControls(false);
    state.setCode(!code);
  };
  const toggleControls = () => {
    if (!controls && !wide) state.setCode(false);
    state.setControls(!controls);
  };

  // Fit the demo into the room the panels leave: transform only, never a relayout.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const fit = fitRef.current;
    const demo = demoRef.current;
    if (!body || !fit || !demo) return;
    const apply = () => {
      const isWide = body.clientWidth >= SIDE_PANEL_MIN;
      setWide(isWide);
      if (!demo.offsetWidth || !demo.offsetHeight) return;
      const style = getComputedStyle(body);
      const padX = Number.parseFloat(style.paddingInlineStart) * 2;
      const padY = Number.parseFloat(style.paddingBlockStart) * 2;
      const side = controls && isWide ? SIDE_PANEL_WIDTH : 0;
      const lower = code || (controls && !isWide);
      // Inspect keeps a column for the part names on the end side. Its part card goes on the
      // start side when the stage is wide enough, else under the demo when that leaves the demo
      // most of its size, else nowhere.
      const chips = inspect ? INSPECT_CHIPS : 0;
      const free = inspect && !lower && cardHeight > 0;
      const below = cardHeight + INSPECT_CARD_GAP;
      const place: CardPlace =
        free && body.clientWidth - side >= INSPECT_CARD_MIN
          ? "side"
          : free && body.clientHeight - padY - below >= demo.offsetHeight * 0.6
            ? "below"
            : "none";
      setCard(place);
      const start = place === "side" ? INSPECT_CARD : 0;
      const under = place === "below" ? below : 0;
      const width = body.clientWidth - padX - side - chips - start;
      const height = (lower ? body.clientHeight * 0.52 : body.clientHeight) - padY - under;
      const scale = Math.max(
        0.4,
        Math.min(1, (width - 24) / demo.offsetWidth, (height - 16) / demo.offsetHeight),
      );
      const x = (start - side - chips) / 2;
      const y = lower ? -body.clientHeight * 0.24 : -under / 2;
      fit.style.transform = `translate(${x}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(body);
    observer.observe(demo);
    return () => observer.disconnect();
  }, [code, controls, inspect, cardHeight]);

  // Single-key shortcuts only while focus is inside the stage (WCAG 2.1.4). A shortcut that
  // hides the focused element hands focus to its own button, so the next press still works.
  const shortcuts = useRef<Record<string, Shortcut>>({});
  const replay = state.playing ? state.stop : state.replay;
  useLayoutEffect(() => {
    shortcuts.current = {
      ...(lab.parts?.length ? { i: { run: () => state.setInspect(!inspect) } } : {}),
      ...(state.script ? { r: { run: replay } } : {}),
      t: { run: state.toggleTheme },
      p: {
        run: toggleControls,
        hides: controls ? controlsRef.current : null,
        focus: toolRefs.current.get("P"),
      },
      c: {
        run: toggleCode,
        hides: code ? drawerRef.current : null,
        focus: toolRefs.current.get("C"),
      },
      h: {
        run: togglePane,
        hides: paneHidden ? null : stageRef.current,
        focus: paneToggleRef.current,
      },
    };
  });
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if ((event.target as Element).closest("input, select, textarea, [role='tab']")) return;
      const key = event.key.toLowerCase();
      // The pane only exists when the stage sits above the narrative.
      if (key === "h" && matchMedia(SIDE_BY_SIDE).matches) return;
      const shortcut = shortcuts.current[key];
      if (!shortcut) return;
      event.preventDefault();
      const lost = shortcut.hides?.contains(document.activeElement) ?? false;
      shortcut.run();
      if (lost) shortcut.focus?.focus({ preventScroll: true });
    };
    stage.addEventListener("keydown", onKey);
    return () => stage.removeEventListener("keydown", onKey);
  }, []);

  // Scene scripts (DS-11), one run per token. The visitor's own press or key stops a run where it
  // is; a new token (another scene, Replay, Stop) stops it and remounts the demo as it was.
  const [mount, setMount] = useState(0);
  const player = useRef({ script: state.script, setPlaying: state.setPlaying });
  useLayoutEffect(() => {
    player.current = { script: state.script, setPlaying: state.setPlaying };
  });
  const runs = useRef(0);
  const { playToken } = state;
  useEffect(() => {
    const body = bodyRef.current;
    const demo = demoRef.current;
    const ghost = ghostRef.current;
    const { script, setPlaying } = player.current;
    if (!playToken || !script || !body || !demo || !ghost) return;
    const run = ++runs.current;
    const controller = new AbortController();
    let done = false;
    const onVisitor = (event: Event) => {
      if (event.isTrusted) controller.abort();
    };
    body.addEventListener("pointerdown", onVisitor, true);
    body.addEventListener("keydown", onVisitor, true);
    const stage = createScriptStage(body, demo, ghost, controller.signal);
    setPlaying(true);
    stage
      .wait(SCRIPT_LEAD_MS)
      .then(() => script(stage))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) throw error;
      })
      .finally(() => {
        done = true;
        stage.release();
        if (runs.current === run) player.current.setPlaying(false);
      });
    return () => {
      body.removeEventListener("pointerdown", onVisitor, true);
      body.removeEventListener("keydown", onVisitor, true);
      if (!done) {
        controller.abort();
        setMount((n) => n + 1);
      }
    };
  }, [playToken]);

  const setup = useTokenSetup();
  const files = lab.code(state.cfg, setup);
  const tools: {
    key: string;
    label: string;
    icon: IconName;
    pressed?: boolean;
    controls?: string;
    act: () => void;
  }[] = [
    ...(lab.parts?.length
      ? [
          {
            key: "I",
            label: labels.inspect,
            icon: "scan" as const,
            pressed: inspect,
            act: () => state.setInspect(!inspect),
          },
        ]
      : []),
    { key: "T", label: labels.theme, icon: "contrast", act: state.toggleTheme },
    {
      key: "P",
      label: labels.controls,
      icon: "sliders-horizontal",
      pressed: controls,
      controls: `${id}-controls`,
      act: toggleControls,
    },
    {
      key: "C",
      label: labels.code,
      icon: "code-xml",
      pressed: code,
      controls: `${id}-code`,
      act: toggleCode,
    },
    ...(state.script
      ? [
          state.playing
            ? { key: "R", label: labels.stop, icon: "square" as const, act: replay }
            : { key: "R", label: labels.replay, icon: "rotate-ccw" as const, act: replay },
        ]
      : []),
  ];

  return (
    // tabIndex -1: a click anywhere on the stage focuses it, so its shortcuts work right away;
    // it stays out of the tab order.
    // The stage theme covers the whole preview: its toolbar, controls, and code too.
    <section
      ref={stageRef}
      className="lab-stage"
      aria-label={labels.stage}
      tabIndex={-1}
      data-theme={state.theme}
    >
      <div className="lab-stage-bar">
        <p className="lab-stage-title">
          <span className="lab-live" aria-hidden="true" />
          <span className="lab-stage-title-text">{title}</span>
        </p>
        <fieldset className="lab-tools">
          <legend className="visually-hidden">{labels.tools}</legend>
          {tools.map((tool) => (
            <button
              key={tool.key}
              ref={(el) => {
                toolRefs.current.set(tool.key, el);
              }}
              type="button"
              className="lab-tool"
              aria-pressed={tool.pressed}
              aria-controls={tool.controls}
              aria-keyshortcuts={tool.key}
              title={`${tool.label} (${tool.key})`}
              onClick={tool.act}
            >
              <Icon name={tool.icon} size={15} />
              <span className="lab-tool-label">{tool.label}</span>
            </button>
          ))}
          <button
            ref={paneToggleRef}
            type="button"
            className="lab-pane-toggle"
            aria-expanded={!paneHidden}
            aria-keyshortcuts="H"
            // The full name; the visible text is its start, so voice control finds it (2.5.3).
            aria-label={paneHidden ? labels.show : labels.hide}
            onClick={togglePane}
          >
            {paneHidden ? labels.show : labels.hideShort}
            <Icon name="chevron-down" size={15} />
          </button>
        </fieldset>
      </div>

      <div
        ref={bodyRef}
        className="lab-stage-body"
        data-code={code ? "" : undefined}
        data-controls={controls ? "" : undefined}
      >
        <div ref={fitRef} className="lab-fit">
          <div ref={demoRef} className="lab-demo">
            <Fragment key={`${state.view ?? ""}:${mount}`}>
              {(state.view && lab.scenes?.[state.view]?.demo?.(state.cfg, lang)) ||
                lab.demo(state.cfg, lang)}
            </Fragment>
          </div>
        </div>

        {inspect && lab.parts ? (
          <Inspect
            parts={lab.parts}
            lang={lang}
            labels={labels}
            selected={state.part}
            onSelect={state.setPart}
            bodyRef={bodyRef}
            demoRef={demoRef}
            card={card}
            onCardHeight={setCardHeight}
          />
        ) : null}

        <span ref={ghostRef} className="lab-ghost" aria-hidden="true">
          <svg
            className="lab-ghost-arrow"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path d="M4 3v15.5l4.2-4 2.7 6.2 2.7-1.2-2.7-6.1H16.6z" />
          </svg>
        </span>

        <aside
          ref={controlsRef}
          id={`${id}-controls`}
          className="lab-controls"
          aria-label={labels.controls}
          inert={!controls}
        >
          <ScrollFade className="lab-sheet-scroll">
            <ControlsPanel lab={lab} lang={lang} labels={labels} state={state} />
          </ScrollFade>
        </aside>

        <section
          ref={drawerRef}
          id={`${id}-code`}
          className="lab-drawer"
          aria-label={labels.code}
          inert={!code}
        >
          <CodeDrawer files={files} item={item} labels={labels} />
        </section>
      </div>
    </section>
  );
}

function ControlsPanel({ lab, lang, labels, state }: Omit<StageProps, "title" | "item" | "pane">) {
  return (
    <div className="lab-controls-inner">
      {lab.controls.map((control) =>
        control.type === "choice" ? (
          <fieldset key={control.key} className="lab-field">
            <legend>{control.label[lang]}</legend>
            <div className="seg">
              {control.options.map((option) => (
                <label
                  key={option.value}
                  className="seg-item"
                  data-selected={state.cfg[control.key] === option.value ? "" : undefined}
                >
                  <input
                    type="radio"
                    name={control.key}
                    value={option.value}
                    checked={state.cfg[control.key] === option.value}
                    onChange={() => state.setValue(control.key, option.value)}
                  />
                  {option.label[lang]}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <ColorField
            key={control.key}
            label={control.label[lang]}
            value={state.cfg[control.key] ?? ""}
            token={control.token}
            labels={labels}
            onChange={(value) => state.setValue(control.key, value)}
          />
        ),
      )}
      <button type="button" className="ghost-button" onClick={state.reset}>
        {labels.reset}
      </button>
    </div>
  );
}

interface DrawerTab {
  key: string;
  label: string;
  /** Absent for the install tab. */
  file?: CodeFile;
}

function CodeDrawer({
  files,
  item,
  labels,
}: {
  files: CodeFile[];
  item: string;
  labels: Dictionary["lab"];
}) {
  const id = useId();
  // The code files, then how to install the component.
  const all: DrawerTab[] = [
    ...files.map((file) => ({ key: file.name, label: file.name, file })),
    { key: "#install", label: labels.install },
  ];
  const [selected, setSelected] = useState(all[0]?.key ?? "");
  const current = all.find((tab) => tab.key === selected) ?? all[0];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (!current) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = all.indexOf(current);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: all.length - 1 }[
      event.key
    ];
    if (next === undefined) return;
    event.preventDefault();
    const target = all[(next + all.length) % all.length];
    if (!target) return;
    setSelected(target.key);
    tabs.current[all.indexOf(target)]?.focus();
  };

  return (
    <>
      <div className="lab-drawer-bar">
        <div role="tablist" aria-label={labels.files} className="lab-tabs" onKeyDown={onKeyDown}>
          {all.map((tab, i) => (
            <button
              key={tab.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-selected={tab === current}
              aria-controls={`${id}-panel`}
              tabIndex={tab === current ? 0 : -1}
              onClick={() => setSelected(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Each install command has its own Copy. */}
        {current.file ? <CopyButton text={current.file.code} labels={labels} /> : null}
      </div>
      <ScrollFade
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${all.indexOf(current)}`}
        className="lab-sheet-scroll"
        // Focusable, so the keyboard can scroll it.
        tabIndex={0}
      >
        {current.file ? (
          <LiveCode file={current.file} />
        ) : (
          <InstallPane item={item} labels={labels} />
        )}
      </ScrollFade>
    </>
  );
}
