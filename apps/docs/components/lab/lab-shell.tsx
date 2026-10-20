"use client";

import { Kbd } from "owsem-ui/base";
import {
  type CSSProperties,
  createContext,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
import { siteScheme } from "@/lib/theme";
import { Icon } from "../icons/icon";
import { ScrollFade } from "../scroll-fade";
import { Tip } from "../tip";
import { useTokenNames } from "../token-setup";
import { SHEET_FULL_GAP, SHEET_HALF, SIDE_BY_SIDE } from "./layout";
import { setActiveScene } from "./scene-store";
import { Stage, type StageState } from "./stage";
import type { Config, LabDefinition } from "./types";

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
const DRAG_SLOP = 4; // px a handle press may move and still count as a tap
const SHUT_BELOW = 0.25; // a drag let go under this share of the screen shuts the sheet

/** The narrow screen's documentation sheet: shut, half the screen, or nearly all of it. */
type Sheet = "closed" | "half" | "full";
/** How the sheet last moved: rising from shut waits for the stage's caption to fade first. */
type SheetMove = "open" | "resize" | "close";
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const REDUCED = "(prefers-reduced-motion: reduce)";

const subscribeMedia = (query: string) => (listener: () => void) => {
  const list = matchMedia(query);
  list.addEventListener("change", listener);
  return () => list.removeEventListener("change", listener);
};
const subscribeReduced = subscribeMedia(REDUCED);
const subscribeSideBySide = subscribeMedia(SIDE_BY_SIDE);

/** Whether the visitor prefers reduced motion; true on the server, so nothing plays before it knows. */
const useReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribeReduced,
    () => matchMedia(REDUCED).matches,
    () => true,
  );

/** Whether the stage sits beside the narrative; true on the server (CSS covers narrow screens). */
const useSideBySide = (): boolean =>
  useSyncExternalStore(
    subscribeSideBySide,
    () => matchMedia(SIDE_BY_SIDE).matches,
    () => true,
  );

export interface LabShellProps {
  lab: LabDefinition<Config>;
  /** The component's display name, shown on the stage during the overview. */
  title: string;
  lang: Lang;
  scenes: SceneInfo[];
  intro: ReactNode;
  /** Under the narrow screen's stage while the sheet is shut: category, name, line, badges. */
  caption: ReactNode;
  footer: ReactNode;
  labels: Dictionary["lab"];
  /** The registry item, for the install tab. */
  item: string;
  children: ReactNode;
}

/** What a page passes to a component's Lab (apps/docs/labs/<name>.tsx). */
export type LabProps = Omit<LabShellProps, "lab">;

/**
 * The Lab page (DS-2): the narrative scrolls beside a sticky stage. Below SIDE_BY_SIDE the stage
 * fills the screen and the narrative is a sheet over it, opened from the stage's toolbar. The scene
 * at the reading line becomes active; once scrolling settles, its SceneSpec shapes the stage.
 */
export function LabShell({
  lab,
  title: componentTitle,
  lang,
  scenes,
  intro,
  caption,
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
  const narrative = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sheetTitle = useRef<HTMLParagraphElement>(null);
  const sceneNav = useRef<HTMLElement>(null);
  useTokenNames(narrative);
  const [sheetState, setSheetState] = useState<{ at: Sheet; move: SheetMove }>({
    at: "closed",
    move: "close",
  });
  const sheet = sheetState.at;
  const setSheet = useCallback((next: Sheet | ((current: Sheet) => Sheet)) => {
    setSheetState((current) => {
      const at = typeof next === "function" ? next(current.at) : next;
      if (at === current.at) return current;
      const move = at === "closed" ? "close" : current.at === "closed" ? "open" : "resize";
      return { at, move };
    });
  }, []);
  // The sheet's height while its handle is dragged; null otherwise.
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ y: number; height: number; moved: boolean } | null>(null);
  const sheetId = useId();
  const docsButtonId = `${sheetId}-docs`;

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

  // The reading line: 40% down the window when the stage sits beside the text, else 30% into the
  // sheet's text. A 1px band there tells which scene is being read. Scenes take their natural
  // height, so a short one may never cross the line: the narrative's start and end select the
  // first and last scene, and a scene picked by link (sidebar, hash) holds until the visitor
  // scrolls.
  useEffect(() => {
    let lines: IntersectionObserver | undefined;
    let edges: IntersectionObserver | undefined;
    const setup = () => {
      lines?.disconnect();
      edges?.disconnect();
      const root = matchMedia(SIDE_BY_SIDE).matches ? null : scroller.current;
      const height = root ? root.clientHeight : window.innerHeight;
      if (!height) return;
      const line = Math.round(height * (root ? 0.3 : 0.4));
      lines = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.scene;
            if (entry.isIntersecting && id) setAtLine(id);
          }
        },
        { root, rootMargin: `${-line}px 0px ${line + 1 - height}px 0px` },
      );
      for (const section of sections.current.values()) lines.observe(section);
      edges = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === start.current) setAtStart(entry.isIntersecting);
            if (entry.target === end.current) setAtEnd(entry.isIntersecting);
          }
        },
        { root },
      );
      if (start.current) edges.observe(start.current);
      if (end.current) edges.observe(end.current);
    };
    setup();
    // The sheet's height changes the line; so does the window.
    const sizes = new ResizeObserver(setup);
    if (scroller.current) sizes.observe(scroller.current);
    window.addEventListener("resize", setup);
    return () => {
      lines?.disconnect();
      edges?.disconnect();
      sizes.disconnect();
      window.removeEventListener("resize", setup);
    };
  }, []);

  // On a narrow screen a scene picked by link opens the sheet (at half height, or as it is) and
  // comes up under its tabs. Play scene always wants the stage in view: half height. The sheet
  // and the stage's panels share the room under the demo, so one shuts the other.
  const showInSheet = useCallback(
    (id: string, { smooth = false, half = false } = {}) => {
      if (matchMedia(SIDE_BY_SIDE).matches) return;
      setSheet((current) => (half || current === "closed" ? "half" : current));
      setCode(false);
      setControls(false);
      requestAnimationFrame(() =>
        sections.current
          .get(id)
          ?.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" }),
      );
    },
    [setSheet],
  );

  useEffect(() => {
    const ids = new Set(scenes.map((scene) => scene.id));
    const fromHash = () => {
      const id = decodeURIComponent(location.hash).replace(/^#scene-/, "");
      if (!ids.has(id)) return;
      setPicked(id);
      showInSheet(id);
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
  }, [scenes, showInSheet]);

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
  // Narrow, the sheet covers the stage's panels, so scenes leave them shut: only the visitor
  // opens them there.
  const sideBySide = useSideBySide();
  const sceneCode = sideBySide ? spec.code : undefined;
  const sceneControls = sideBySide ? spec.controls : undefined;
  const scenePick = sceneCode ? "code" : sceneControls ? "controls" : undefined;
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
    code: pick("code", code, sceneCode),
    codeFromScene: !touched.has("code") && sceneCode !== undefined,
    setCode: (open) => {
      setCode(open);
      if (open) {
        setLastOpened("code");
        setSheet("closed");
      }
      touch("code");
    },
    controls: pick("controls", controls, sceneControls),
    controlsFromScene: !touched.has("controls") && sceneControls !== undefined,
    setControls: (open) => {
      setControls(open);
      if (open) {
        setLastOpened("controls");
        setSheet("closed");
      }
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

  // Play scene (DS-11): picks the scene, plays it once it settles, and on a narrow screen sets
  // the sheet at half height, so the stage shows above it. Pressed while that scene plays, it
  // stops it.
  const playScene = (id: string) => {
    if (playing && id === settled) {
      stop();
      return;
    }
    setPicked(id);
    replay(id);
    showInSheet(id, { smooth: !reduced, half: true });
  };

  // The sheet: the stage's Docs button opens it at half height and moves focus to its title;
  // closing (its button, Escape) hands focus back to that button.
  const toggleSheet = () => {
    if (sheet !== "closed") {
      setSheet("closed");
      return;
    }
    setSheet("half");
    setCode(false);
    setControls(false);
    requestAnimationFrame(() => sheetTitle.current?.focus({ preventScroll: true }));
  };
  const closeSheet = useCallback(() => {
    setSheet("closed");
    document.getElementById(docsButtonId)?.focus({ preventScroll: true });
  }, [setSheet, docsButtonId]);
  // Escape inside the open sheet shuts it.
  useEffect(() => {
    const el = narrative.current;
    if (!el || sheet === "closed") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || matchMedia(SIDE_BY_SIDE).matches) return;
      event.stopPropagation();
      closeSheet();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [sheet, closeSheet]);
  // The active scene's link stays in view in the sheet's row of scenes.
  useEffect(() => {
    const row = sceneNav.current?.querySelector<HTMLElement>(".scroll-fade");
    const link = row?.querySelector<HTMLElement>(`[href="#scene-${CSS.escape(active)}"]`);
    if (!row || !link || matchMedia(SIDE_BY_SIDE).matches) return;
    row.scrollTo({ left: link.offsetLeft - 20, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);
  // A scene's link scrolls the sheet to it; the scene holds until the visitor scrolls.
  const onSceneLink = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setPicked(id);
    history.replaceState(null, "", `#scene-${id}`);
    sections.current
      .get(id)
      ?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  };
  // The handle: a tap (or Enter) switches half and full height; a drag sets the height, then
  // settles on the nearest height when let go, or shuts the sheet when dragged low enough.
  const onHandleDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !narrative.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      y: event.clientY,
      height: narrative.current.getBoundingClientRect().height,
      moved: false,
    };
  };
  const onHandleMove = (event: PointerEvent<HTMLButtonElement>) => {
    const from = drag.current;
    if (!from) return;
    const dy = from.y - event.clientY;
    if (!from.moved && Math.abs(dy) < DRAG_SLOP) return;
    from.moved = true;
    setDragHeight(Math.max(0, Math.min(innerHeight - SHEET_FULL_GAP, from.height + dy)));
  };
  const onHandleUp = () => {
    const from = drag.current;
    if (!from?.moved || dragHeight === null) return;
    const half = innerHeight * SHEET_HALF;
    const full = innerHeight - SHEET_FULL_GAP;
    setSheet(
      dragHeight < innerHeight * SHUT_BELOW
        ? "closed"
        : dragHeight > (half + full) / 2
          ? "full"
          : "half",
    );
    setDragHeight(null);
  };
  const onHandleClick = () => {
    const from = drag.current;
    drag.current = null;
    if (from?.moved) return;
    setSheet((current) => (current === "full" ? "half" : "full"));
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
      <div
        className="lab"
        data-sheet={sheet}
        data-sheet-move={sheetState.move}
        data-dragging={dragHeight === null ? undefined : ""}
        style={
          dragHeight === null ? undefined : ({ "--sheet-drag": `${dragHeight}px` } as CSSProperties)
        }
      >
        <div className="lab-stage-column">
          <div className="lab-stage-frame">
            <Stage
              lab={lab}
              lang={lang}
              labels={labels}
              title={title}
              state={state}
              item={item}
              caption={caption}
              docs={{
                open: sheet !== "closed",
                toggle: toggleSheet,
                sheetId,
                buttonId: docsButtonId,
              }}
            />
          </div>
        </div>
        {/* Wide: the narrative beside the stage, scrolled by the window. Narrow: a sheet. */}
        <div ref={narrative} id={sheetId} className="lab-narrative">
          <button
            type="button"
            className="lab-sheet-handle"
            aria-label={labels.dragSheet}
            aria-controls={sheetId}
            onPointerDown={onHandleDown}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
            onClick={onHandleClick}
          />
          <div className="lab-sheet-head">
            <p ref={sheetTitle} className="lab-sheet-title" tabIndex={-1}>
              {format(labels.sheetTitle, { name: componentTitle })}
            </p>
            <Tip
              trigger={
                <button
                  type="button"
                  className="lab-sheet-close"
                  aria-label={labels.close}
                  onClick={closeSheet}
                >
                  <Icon name="x" size={16} />
                </button>
              }
              label={labels.close}
            />
          </div>
          {/* Outside the text's scroller, so its scrollbar runs beside the text alone. */}
          <nav ref={sceneNav} className="lab-scene-nav" aria-label={labels.scenes}>
            <ScrollFade wheelX>
              {scenes.map((scene, index) => (
                <a
                  key={scene.id}
                  href={`#scene-${scene.id}`}
                  aria-current={scene.id === active ? "true" : undefined}
                  onClick={(event) => onSceneLink(event, scene.id)}
                >
                  <span>{String(index).padStart(2, "0")}</span>
                  {scene.title}
                </a>
              ))}
            </ScrollFade>
          </nav>
          <div ref={scroller} className="lab-narrative-scroll">
            <div ref={start} />
            {children}
            {footer}
            <div ref={end} />
          </div>
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
 * needs a scene with an animation). They work while focus is in the stage (WCAG 2.1.4), and a
 * click anywhere on the stage puts it there.
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
          <Kbd>{key}</Kbd> {name}
        </span>
      ))}
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
