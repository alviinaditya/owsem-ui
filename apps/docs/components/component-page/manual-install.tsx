"use client";

import { Button, ToggleGroup } from "owsem-ui/base";
import { CodeBlock } from "owsem-ui/owsem";
import {
  memo,
  type ReactNode,
  startTransition,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Flavor, InstallFile } from "@/lib/component-files";
import type { Token } from "@/lib/highlight";
import { INSTALL_FLAVOR_STORAGE_KEY } from "@/lib/theme";
import { isDefaultSetup } from "@/lib/token-setup";
import { Icon } from "../icons/icon";
import { ADD, InstallBlock } from "../install";
import { useTokenSetup } from "../token-setup";
import { usePage } from "./component-page";
import { Highlighted, HighlightedLines } from "./highlighted";
import type { ManualData, ManualFiles } from "./types";

/** Files taller than about this many lines start collapsed. */
const COLLAPSE_LINES = 12;
/** A collapsed file's height (globals.css), and a little less than a line's. */
const COLLAPSED_PX = 240;
const LINE_PX = 20;
/** A collapsed file draws only these lines: its window shows about 12. */
const COLLAPSED_RENDER = 16;

// The height is measured before it is painted; the server has no layout.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// The files load from /api/manual/<component> on the first open, or when the tab is hovered or
// focused; the promise is kept per component, so reopening and switching are instant.
const requests = new Map<string, Promise<ManualData>>();

export function loadManual(name: string): Promise<ManualData> {
  let request = requests.get(name);
  if (!request) {
    request = fetch(`/api/manual/${name}`).then((response) => {
      if (!response.ok) throw new Error(`Manual files of ${name}: ${response.status}`);
      return response.json() as Promise<ManualData>;
    });
    // A failed load is dropped, so the next open tries again.
    request.catch(() => requests.delete(name));
    requests.set(name, request);
  }
  return request;
}

type Loaded = { state: "loading" } | { state: "error" } | { state: "ready"; data: ManualData };

function useManualData(name: string, active: boolean): Loaded {
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  useEffect(() => {
    if (!active) return;
    let current = true;
    setLoaded((now) => (now.state === "ready" ? now : { state: "loading" }));
    loadManual(name).then(
      (data) => current && setLoaded({ state: "ready", data }),
      () => current && setLoaded({ state: "error" }),
    );
    return () => {
      current = false;
    };
  }, [name, active]);
  return loaded;
}

const FLAVORS: readonly Flavor[] = ["css", "tailwind"];

// The visitor's flavor, kept across visits like the package manager.
const listeners = new Set<() => void>();

function readFlavor(): Flavor {
  try {
    const stored = localStorage.getItem(INSTALL_FLAVOR_STORAGE_KEY);
    return FLAVORS.find((flavor) => flavor === stored) ?? "css";
  } catch {
    return "css";
  }
}

function chooseFlavor(flavor: Flavor): void {
  try {
    localStorage.setItem(INSTALL_FLAVOR_STORAGE_KEY, flavor);
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === INSTALL_FLAVOR_STORAGE_KEY) listener();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    removeEventListener("storage", onStorage);
  };
}

// The server cannot know the stored choice: null there, and CSS in the steps.
const useStoredFlavor = () => useSyncExternalStore(subscribe, readFlavor, () => null);

/** The folder of a path, with its slash: `components/owsem/button/`. */
const folderOf = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);

/**
 * One file in a Code Block with Copy (the whole file), collapsed to a fixed height when long. The
 * header shows its name; the folder is the group's, and read out with the name.
 */
function FileBlock({ file, lines }: { file: InstallFile; lines: Token[][] }) {
  const { common, labels } = usePage();
  const long = file.code.split("\n").length > COLLAPSE_LINES;
  const [expanded, setExpanded] = useState(false);
  const collapsed = long && !expanded;
  const panel = useRef<HTMLDivElement>(null);
  // While it moves, the lines a screen can show; the rest of a long file is drawn once it rests.
  const [moving, setMoving] = useState(0);
  // The height it is toggled at, mid-way when a toggle is turned around.
  const from = useRef<number | null>(null);

  useBeforePaint(() => {
    const el = panel.current;
    const start = from.current;
    from.current = null;
    if (!el || start === null) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMoving(0);
      return;
    }
    // Past the screen nothing is seen, so a long file moves no further than that.
    const reach = (height: number) => `${Math.min(height, COLLAPSED_PX + innerHeight)}px`;
    const animation = el.animate(
      { maxBlockSize: [reach(start), reach(el.getBoundingClientRect().height)] },
      { duration: 360, easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    );
    animation.onfinish = () => startTransition(() => setMoving(0));
    return () => animation.cancel();
  }, [expanded]);

  return (
    <CodeBlock.Root
      className="docs-code manual-file"
      data-long={long || undefined}
      data-collapsed={collapsed || undefined}
    >
      <CodeBlock.Header>
        <CodeBlock.Title
          className="manual-file__name"
          icon={<Icon name="file-code" />}
          title={file.path}
        >
          <span className="visually-hidden">{folderOf(file.path)}</span>
          {file.path.slice(folderOf(file.path).length)}
        </CodeBlock.Title>
        {/* Beside Copy, so the file's actions sit together. */}
        {long ? (
          <Button
            variant="ghost"
            size="sm"
            className="manual-file__toggle"
            aria-expanded={expanded}
            onClick={() => {
              from.current = panel.current?.getBoundingClientRect().height ?? null;
              setMoving(Math.ceil((COLLAPSED_PX + innerHeight) / LINE_PX));
              setExpanded(!expanded);
            }}
          >
            {expanded ? labels.collapse : labels.expand}
          </Button>
        ) : null}
        <CodeBlock.Copy labels={common} value={file.code} />
      </CodeBlock.Header>
      <CodeBlock.Panel
        ref={panel}
        className="manual-file__code"
        data-collapsed={collapsed || undefined}
      >
        <HighlightedLines
          lines={lines}
          limit={moving || (collapsed ? COLLAPSED_RENDER : undefined)}
        />
      </CodeBlock.Panel>
    </CodeBlock.Root>
  );
}

/** Files under the folder they go in, which is named once, above them. */
function Folder({ path, children }: { path: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="manual-folder" aria-labelledby={id}>
      <h4 id={id} className="manual-folder__path">
        <Icon name="folder" />
        <span>{path}</span>
      </h4>
      {children}
    </section>
  );
}

/** The files in their folders, in the order the folders come. */
function Files({ files, lines }: { files: InstallFile[]; lines: ManualFiles["lines"] }) {
  const folders = new Map<string, InstallFile[]>();
  for (const file of files) {
    const path = folderOf(file.path);
    folders.set(path, [...(folders.get(path) ?? []), file]);
  }
  return [...folders].map(([path, inside]) => (
    <Folder key={path} path={path}>
      {inside.map((file) => (
        <FileBlock key={file.path} file={file} lines={lines[file.path] ?? []} />
      ))}
    </Folder>
  ));
}

/** The lines for the app's global CSS, as one block with one Copy. */
function GlobalCss({ lines }: { lines: string[] }) {
  const { common, labels } = usePage();
  const code = lines.join("\n");
  return (
    <CodeBlock.Root className="docs-code manual-file">
      <CodeBlock.Header>
        <CodeBlock.Title icon={<Icon name="palette" />}>{labels.manualGlobalCss}</CodeBlock.Title>
        <CodeBlock.Copy labels={common} value={code} />
      </CodeBlock.Header>
      <CodeBlock.Panel className="manual-file__code">
        <Highlighted file={{ name: "global.css", code }} />
      </CodeBlock.Panel>
    </CodeBlock.Root>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="manual-step">
      <h3 className="manual-step__title">{title}</h3>
      <div className="manual-step__body">{children}</div>
    </li>
  );
}

/** The numbered steps for one flavor; memoized, so the other flavor's switch does not redraw it. */
const StepsBody = memo(function StepsBody({
  files,
  flavor,
}: {
  files: ManualFiles;
  flavor: Flavor;
}) {
  const { labels, common } = usePage();
  const packages = files.dependencies.join(" ");
  return (
    <>
      {packages ? (
        <Step title={labels.manualDependencies}>
          {flavor === "tailwind" ? (
            <p className="install-note">{labels.manualFlavorTailwindNote}</p>
          ) : null}
          <InstallBlock labels={common} commands={(pm) => [`${ADD[pm]} ${packages}`]} />
        </Step>
      ) : null}
      <Step title={labels.manualTokens}>
        <p className="install-note">{labels.manualTokensNote}</p>
        <Files files={files.setup} lines={files.lines} />
        <GlobalCss lines={files.globalCss} />
      </Step>
      <Step title={labels.manualFiles}>
        <p className="install-note">{labels.manualFilesNote}</p>
        <Files files={files.files} lines={files.lines} />
      </Step>
      <Step title={labels.manualImports}>
        <p className="install-note">{labels.manualImportsNote}</p>
      </Step>
    </>
  );
});

function Steps({ hidden, ...props }: { files: ManualFiles; flavor: Flavor; hidden: boolean }) {
  return (
    <ol className="manual-steps" hidden={hidden}>
      <StepsBody {...props} />
    </ol>
  );
}

/**
 * The Manual tab: copy the files into the project, in numbered steps (CSS or Tailwind v4). The
 * files load once the tab is opened; both flavors then stay mounted and one is hidden, so
 * switching the flavor mounts nothing.
 */
export function ManualInstall({ active }: { active: boolean }) {
  const { labels, install } = usePage();
  const setup = useTokenSetup();
  const stored = useStoredFlavor();
  const loaded = useManualData(install.name, active);
  const hasTailwind = install.tailwind;
  const flavor: Flavor = hasTailwind && stored ? stored : "css";
  const [before, after] = labels.manualTokenSetup.split("{token}");
  return (
    <div className="manual">
      {hasTailwind ? (
        <ToggleGroup.Root
          aria-label={labels.manualFlavor}
          className="docs-choice manual-flavor"
          // None is pressed until hydration reads the stored choice; CSS raises the first one.
          value={stored && hasTailwind ? [stored] : []}
          onValueChange={([next]) => next && chooseFlavor(next as Flavor)}
        >
          <ToggleGroup.Item value="css" data-option="css">
            {labels.manualFlavorCss}
          </ToggleGroup.Item>
          <ToggleGroup.Item value="tailwind" data-option="tailwind">
            {labels.manualFlavorTailwind}
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      ) : (
        <p className="install-note">{labels.manualTailwindSoon}</p>
      )}
      {!isDefaultSetup(setup) ? (
        <p className="install-note">
          {before}
          <code data-token-literal="">--ow-</code>
          {after}
        </p>
      ) : null}
      {loaded.state === "ready" ? (
        <>
          <Steps files={loaded.data.css} flavor="css" hidden={flavor !== "css"} />
          {loaded.data.tailwind ? (
            <Steps files={loaded.data.tailwind} flavor="tailwind" hidden={flavor !== "tailwind"} />
          ) : null}
        </>
      ) : (
        <p className="install-note manual-status" role="status" aria-live="polite">
          {loaded.state === "error" ? labels.manualError : labels.manualLoading}
        </p>
      )}
    </div>
  );
}
