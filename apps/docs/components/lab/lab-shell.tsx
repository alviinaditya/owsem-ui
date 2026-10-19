"use client";

import { Separator } from "owsem-ui/base";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Dictionary, format } from "@/lib/dictionaries";
import type { Lang } from "@/lib/i18n";
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
  register: (id: string) => (el: HTMLElement | null) => void;
}

const LabContext = createContext<LabContextValue | null>(null);

function useLab(): LabContextValue {
  const lab = useContext(LabContext);
  if (!lab) throw new Error("Scene must be rendered inside LabShell.");
  return lab;
}

const SETTLE_MS = 250; // a scene applies to the stage once scrolling stops on it
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

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

  const context = useMemo(
    () => ({ scenes, active, intro, register }),
    [scenes, active, intro, register],
  );

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
        <>
          <Separator />
          <p className="lab-scene-n">{String(index).padStart(2, "0")}</p>
        </>
      )}
      {children}
    </section>
  );
}
