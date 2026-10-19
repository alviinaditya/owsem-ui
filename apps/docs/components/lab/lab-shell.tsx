"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { Icon } from "../icons/icon";
import { useTokenNames } from "../token-setup";
import { PANE_CHROME, paneOpenHeight, SIDE_BY_SIDE } from "./layout";
import { setActiveScene } from "./scene-store";
import { Stage, type StageState } from "./stage";
import type { Config, LabDefinition } from "./types";
import { usePane } from "./use-pane";

export interface SceneInfo {
  id: string;
  title: ReactNode;
}

interface LabContextValue {
  scenes: SceneInfo[];
  active: string;
  intro: ReactNode;
  labels: Dictionary["lab"];
  register: (id: string) => (el: HTMLElement | null) => void;
  /** Scenes with a script, and the one playing now. */
  playable: ReadonlySet<string>;
  playing: string | undefined;
  playScene: (id: string) => void;
  parts: readonly string[];
  /** The part Inspect outlines, when it is on. */
  inspected: string | undefined;
  inspectPart: (name: string) => void;
  hoverPart: (name: string) => void;
}

const LabContext = createContext<LabContextValue | null>(null);

function useLab(): LabContextValue {
  const lab = useContext(LabContext);
  if (!lab) throw new Error("Scene must be rendered inside LabShell.");
  return lab;
}

const SETTLE_MS = 250; // a scene applies to the stage once scrolling stops on it
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(listener: () => void): () => void {
  const query = matchMedia(REDUCED);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Whether the visitor prefers reduced motion; true on the server, so nothing plays before it knows. */
const useReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribeReduced,
    () => matchMedia(REDUCED).matches,
    () => true,
  );

/** The site's color scheme at this moment: <html data-theme>, else the system preference. */
function siteScheme(): "light" | "dark" {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export interface LabShellProps {
  lab: LabDefinition<Config>;
  /** The component's display name, shown on the stage during the overview. */
  title: string;
  lang: Lang;
  scenes: SceneInfo[];
  intro: ReactNode;
  footer: ReactNode;
  labels: Dictionary["lab"];
  /** The registry item, for the install tab. */
  item: string;
  children: ReactNode;
}

/** What a page passes to a component's Lab (apps/docs/labs/<name>.tsx). */
export type LabProps = Omit<LabShellProps, "lab">;

/**
 * The Lab page (DS-2): the narrative scrolls beside, or under, a sticky stage. The scene at the
 * reading line becomes active; once scrolling settles, its SceneSpec shapes the stage.
 */
export function LabShell({
  lab,
  title: componentTitle,
  lang,
  scenes,
  intro,
  footer,
  labels,
  item,
  children,
}: LabShellProps) {
  // Runs during the static build too, so a stray scene key fails the build.
  for (const key of Object.keys(lab.scenes ?? {})) {
    if (!scenes.some((scene) => scene.id === key)) {
      throw new Error(`Lab "${componentTitle}" sets up scene "${key}", which has no section.`);
    }
  }

  const first = scenes[0]?.id ?? "overview";
  const last = scenes.at(-1)?.id ?? first;
  // The scene at the reading line, whether the narrative's start or end is in view, and a scene
  // picked by link: together they decide the active scene (see `active` below).
  const [atLine, setAtLine] = useState(first);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const active = picked ?? (atStart && !atEnd ? first : atEnd && !atStart ? last : atLine);
  const [settled, setSettled] = useState(active);
  const start = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const refs = useRef(new Map<string, (el: HTMLElement | null) => void>());
  const stageFrame = useRef<HTMLDivElement>(null);
  const narrative = useRef<HTMLDivElement>(null);
  useTokenNames(narrative);
  const [paneHidden, togglePane] = usePane();

  const register = useCallback((id: string) => {
    let ref = refs.current.get(id);
    if (!ref) {
      ref = (el) => {
        if (el) sections.current.set(id, el);
        else sections.current.delete(id);
      };
      refs.current.set(id, ref);
    }
    return ref;
  }, []);

  // The reading line: 40% down the window when the stage sits beside the text, else 30% into
  // the area under the open pane. It ignores folding, so a fold moves neither text nor scene.
  // A 1px band there tells which scene is being read. Scenes take their natural height, so a
  // short one may never cross the line: the page's start and end select the first and last
  // scene, and a scene picked by link (sidebar, hash) holds until the visitor scrolls.
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      const height = window.innerHeight;
      const frame = stageFrame.current?.getBoundingClientRect().top ?? 0;
      const top = matchMedia(SIDE_BY_SIDE).matches ? 0 : frame + paneOpenHeight() + PANE_CHROME;
      const line = Math.round(top + (height - top) * (top ? 0.3 : 0.4));
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.scene;
            if (entry.isIntersecting && id) setAtLine(id);
          }
        },
        { rootMargin: `${-line}px 0px ${line + 1 - height}px 0px` },
      );
      for (const section of sections.current.values()) observer.observe(section);
    };
    setup();
    const edges = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === start.current) setAtStart(entry.isIntersecting);
        if (entry.target === end.current) setAtEnd(entry.isIntersecting);
      }
    });
    if (start.current) edges.observe(start.current);
    if (end.current) edges.observe(end.current);
    window.addEventListener("resize", setup);
    return () => {
      observer?.disconnect();
      edges.disconnect();
      window.removeEventListener("resize", setup);
    };
  }, []);

  useEffect(() => {
    const ids = new Set(scenes.map((scene) => scene.id));
    const fromHash = () => {
      const id = decodeURIComponent(location.hash).replace(/^#scene-/, "");
      if (ids.has(id)) setPicked(id);
    };
    // Any scroll the visitor starts lets the reading line decide again.
    const release = (event: Event) => {
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
      setPicked(undefined);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    for (const type of ["wheel", "touchstart", "keydown"]) {
      window.addEventListener(type, release, { passive: true });
    }
    return () => {
      window.removeEventListener("hashchange", fromHash);
      for (const type of ["wheel", "touchstart", "keydown"]) {
        window.removeEventListener(type, release);
      }
    };
  }, [scenes]);

  useEffect(() => {
    setActiveScene(active);
  }, [active]);
  useEffect(() => () => setActiveScene(""), []);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(active), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [active]);

  // Visitor state, and what they changed during the settled scene: those keys win over the scene.
  const [cfg, setCfg] = useState<Config>(lab.initial);
  const [code, setCode] = useState(false);
  const [controls, setControls] = useState(false);
  const [lastOpened, setLastOpened] = useState<"code" | "controls">("code");
  const [theme, setTheme] = useState<"light" | "dark" | undefined>(undefined);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [touchedIn, setTouchedIn] = useState(settled);
  if (touchedIn !== settled) {
    setTouchedIn(settled);
    setTouched(new Set());
  }
  const touch = (key: string) => setTouched((keys) => new Set(keys).add(key));
  const [inspect, setInspect] = useState(false);
  const [part, setPart] = useState(lab.parts?.[0]?.name ?? "");

  const spec = lab.scenes?.[settled] ?? {};
  const stageCfg: Config = { ...cfg };
  for (const [key, value] of Object.entries(spec.cfg ?? {})) {
    if (!touched.has(key) && value !== undefined) stageCfg[key] = value;
  }
  const pick = <T,>(key: string, own: T, scene: T | undefined) =>
    touched.has(key) || scene === undefined ? own : scene;
  const userPicked = touched.has("code") || touched.has("controls");
  const scenePick = spec.code ? "code" : spec.controls ? "controls" : undefined;
  const stageTheme = pick("theme", theme, spec.theme);
  const stageInspect = pick("inspect", inspect, spec.inspect);

  // Scene scripts (DS-11): a scene's script plays once the scene settles, unless the visitor
  // prefers reduced motion; Play scene and Replay play it on request, Stop ends it.
  const reduced = useReducedMotion();
  const [request, setRequest] = useState({ scene: "", n: 0, stop: false });
  const [playing, setPlaying] = useState(false);
  const script = spec.play;
  const asked = request.scene === settled;
  const playToken =
    !script || (asked ? request.stop : reduced)
      ? undefined
      : `${settled}:${asked ? request.n : "auto"}`;
  const replay = (scene: string) => setRequest((r) => ({ scene, n: r.n + 1, stop: false }));
  const stop = () => setRequest((r) => ({ ...r, scene: settled, stop: true }));

  const state: StageState = {
    cfg: stageCfg,
    setValue: (key, value) => {
      setCfg((current) => ({ ...current, [key]: value }));
      touch(key);
    },
    // Back to the defaults, as the current scene shows them.
    reset: () => {
      setCfg(lab.initial);
      setTouched((keys) => new Set([...keys].filter((key) => !(key in lab.initial))));
    },
    code: pick("code", code, spec.code),
    setCode: (open) => {
      setCode(open);
      if (open) setLastOpened("code");
      touch("code");
    },
    controls: pick("controls", controls, spec.controls),
    setControls: (open) => {
      setControls(open);
      if (open) setLastOpened("controls");
      touch("controls");
    },
    // Where code and controls share one slot: the visitor's latest pick in this scene, else the
    // scene's, else the last one opened.
    prefer: (userPicked ? undefined : scenePick) ?? lastOpened,
    theme: stageTheme,
    toggleTheme: () => {
      setTheme((stageTheme ?? siteScheme()) === "dark" ? "light" : "dark");
      touch("theme");
    },
    inspect: stageInspect,
    setInspect: (on) => {
      setInspect(on);
      touch("inspect");
    },
    part,
    setPart,
    view: spec.demo ? settled : undefined,
    script,
    playToken,
    playing,
    setPlaying,
    replay: () => replay(settled),
    stop,
  };

  const index = Math.max(
    0,
    scenes.findIndex((scene) => scene.id === active),
  );
  const current = scenes[index];
  const title =
    index === 0 ? (
      <>
        {labels.live} · {componentTitle}
      </>
    ) : (
      <>
        {format(labels.scene, { n: String(index).padStart(2, "0") })} · {current?.title}
      </>
    );

  const playable = useMemo(
    () => new Set(Object.keys(lab.scenes ?? {}).filter((id) => lab.scenes?.[id]?.play)),
    [lab],
  );
  const parts = useMemo(() => (lab.parts ?? []).map((p) => p.name), [lab]);

  // Play scene (DS-11): picks the scene, plays it once it settles, and on a narrow screen opens
  // the pane and brings the scene up under it. Pressed while that scene plays, it stops it.
  const playScene = (id: string) => {
    if (playing && id === settled) {
      stop();
      return;
    }
    setPicked(id);
    replay(id);
    if (matchMedia(SIDE_BY_SIDE).matches) return;
    if (paneHidden) togglePane();
    sections.current.get(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  };
  // A part's name picks the part, and turns Inspect on (the visitor's choice) only if it is off.
  const inspectPart = (name: string) => {
    setPart(name);
    if (stageInspect) return;
    setInspect(true);
    touch("inspect");
  };
  const hoverPart = (name: string) => {
    if (stageInspect) setPart(name);
  };

  const context: LabContextValue = {
    scenes,
    active,
    intro,
    labels,
    register,
    playable,
    playing: playing ? settled : undefined,
    playScene,
    parts,
    inspected: stageInspect ? part : undefined,
    inspectPart,
    hoverPart,
  };

  return (
    <LabContext value={context}>
      <div className="lab">
        <div className="lab-stage-column">
          <div ref={stageFrame} className="lab-stage-frame">
            <Stage
              lab={lab}
              lang={lang}
              labels={labels}
              title={title}
              state={state}
              item={item}
              pane={[paneHidden, togglePane]}
            />
          </div>
        </div>
        <div ref={narrative} className="lab-narrative">
          <div ref={start} />
          {children}
          {footer}
          <div ref={end} />
        </div>
      </div>
    </LabContext>
  );
}

/** MDX `section` (see rehypeScenes): one scene of the narrative. */
export function Scene({
  "data-scene": id = "",
  children,
}: {
  "data-scene"?: string;
  children?: ReactNode;
}) {
  const lab = useLab();
  const index = lab.scenes.findIndex((scene) => scene.id === id);
  const playing = lab.playing === id;
  return (
    <section
      ref={lab.register(id)}
      id={`scene-${id}`}
      className="lab-scene"
      data-scene={id}
      data-active={lab.active === id ? "" : undefined}
    >
      {index === 0 ? (
        lab.intro
      ) : (
        <div className="lab-scene-head">
          <p className="lab-scene-n">{String(index).padStart(2, "0")}</p>
          {lab.playable.has(id) ? (
            <button
              type="button"
              className="lab-play"
              data-playing={playing ? "" : undefined}
              onClick={() => lab.playScene(id)}
            >
              <Icon name={playing ? "square" : "play"} size={13} />
              {playing ? lab.labels.stop : lab.labels.playScene}
            </button>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * The stage's shortcuts, each with its name, in the page header: only the ones this Lab has (R
 * needs a scene with an animation; H, the narrow screen's pane). They work while focus is in the
 * stage (WCAG 2.1.4), and a click anywhere on the stage puts it there.
 */
export function StageShortcuts() {
  const { labels, parts, playable } = useLab();
  const keys = [
    ...(parts.length ? [["I", labels.inspect]] : []),
    ["T", labels.theme],
    ["P", labels.controls],
    ["C", labels.code],
    ...(playable.size ? [["R", labels.replay]] : []),
  ];
  return (
    <p className="lab-hint">
      <span className="lab-hint-lead">{labels.shortcuts}</span>
      {keys.map(([key, name]) => (
        <span key={key} className="lab-hint-key">
          <kbd>{key}</kbd> {name}
        </span>
      ))}
      <span className="lab-hint-key" data-narrow="">
        <kbd>H</kbd> {labels.preview}
      </span>
    </p>
  );
}

/** MDX: a part's name in the anatomy table, which outlines that part on the stage (Inspect). */
export function Part({ name }: { name: string }) {
  const lab = useLab();
  if (!lab.parts.includes(name)) {
    throw new Error(`Part "${name}" is not in this Lab's parts (apps/docs/labs).`);
  }
  return (
    <button
      type="button"
      className="lab-part"
      aria-pressed={lab.inspected === name}
      title={lab.labels.inspectPart}
      onClick={() => lab.inspectPart(name)}
      onPointerEnter={() => lab.hoverPart(name)}
    >
      {name}
    </button>
  );
}
