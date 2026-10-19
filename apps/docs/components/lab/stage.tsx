"use client";

import {
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
import { SIDE_BY_SIDE, SIDE_PANEL_MIN, SIDE_PANEL_WIDTH } from "./layout";
import { LiveCode } from "./live-code";
import type { CodeFile, Config, LabDefinition } from "./types";

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
  const toolRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const [paneHidden, togglePane] = pane;
  // Whether the stage is wide enough for the controls beside the demo (same as the container query).
  const [wide, setWide] = useState(true);

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
      const width = body.clientWidth - padX - side;
      const height = (lower ? body.clientHeight * 0.52 : body.clientHeight) - padY;
      const scale = Math.max(
        0.4,
        Math.min(1, (width - 24) / demo.offsetWidth, (height - 16) / demo.offsetHeight),
      );
      const x = -side / 2;
      const y = lower ? -body.clientHeight * 0.24 : 0;
      fit.style.transform = `translate(${x}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(body);
    observer.observe(demo);
    return () => observer.disconnect();
  }, [code, controls]);

  // Single-key shortcuts only while focus is inside the stage (WCAG 2.1.4). A shortcut that
  // hides the focused element hands focus to its own button, so the next press still works.
  const shortcuts = useRef<Record<string, Shortcut>>({});
  useLayoutEffect(() => {
    shortcuts.current = {
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
  ];

  return (
    <section ref={stageRef} className="lab-stage" aria-label={labels.stage}>
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
            onClick={togglePane}
          >
            <span className="visually-hidden">{paneHidden ? labels.show : labels.hide}</span>
            <Icon name="chevron-down" size={15} />
          </button>
        </fieldset>
      </div>

      <div
        ref={bodyRef}
        className="lab-stage-body"
        data-theme={state.theme}
        data-code={code ? "" : undefined}
        data-controls={controls ? "" : undefined}
      >
        <div ref={fitRef} className="lab-fit">
          <div ref={demoRef} className="lab-demo">
            {lab.demo(state.cfg, lang)}
          </div>
        </div>

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
