"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Popover } from "@base-ui/react/popover";
import { Slider } from "@base-ui/react/slider";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  createContext,
  type ForwardRefExoticComponent,
  forwardRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefAttributes,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import {
  type ColorFormat,
  type ColorResult,
  clamp,
  formatColor,
  type HSVA,
  hslaToHsva,
  hsvaToHsla,
  hsvaToRgba,
  keepHue,
  parseColor,
  rgbaToHex,
  rgbaToHsva,
  toColorResult,
} from "./color";
import "./color-picker.css";

const cls = {
  root: "ow-color-picker",
  area: "ow-color-picker__area",
  thumb: "ow-color-picker__thumb",
  tools: "ow-color-picker__tools",
  tool: "ow-color-picker__tool",
  sliders: "ow-color-picker__sliders",
  slider: "ow-color-picker__slider",
  control: "ow-color-picker__control",
  track: "ow-color-picker__track",
  preview: "ow-color-picker__preview",
  inputs: "ow-color-picker__inputs",
  format: "ow-color-picker__format",
  field: "ow-color-picker__field",
  input: "ow-color-picker__input",
  label: "ow-color-picker__label",
  swatches: "ow-color-picker__swatches",
  swatch: "ow-color-picker__swatch",
  icon: "ow-color-picker__icon",
  trigger: "ow-color-picker__trigger",
  chip: "ow-color-picker__chip",
  value: "ow-color-picker__value",
  positioner: "ow-color-picker__positioner",
  popup: "ow-color-picker__popup",
} as const;

/** Every text the picker shows or announces, for translation (FR-17). */
export interface ColorPickerLabels {
  /** The popover's dialog. */
  picker: string;
  /** The saturation and brightness area. */
  area: string;
  saturation: string;
  brightness: string;
  hue: string;
  /** The alpha slider and field. */
  alpha: string;
  eyeDropper: string;
  /** The format switch, before the format it shows. */
  format: string;
  hex: string;
  red: string;
  green: string;
  blue: string;
  lightness: string;
  swatches: string;
}

export const colorPickerLabels: ColorPickerLabels = {
  picker: "Color picker",
  area: "Saturation and brightness",
  saturation: "Saturation",
  brightness: "Brightness",
  hue: "Hue",
  alpha: "Opacity",
  eyeDropper: "Pick a color from the screen",
  format: "Format",
  hex: "Hex",
  red: "Red",
  green: "Green",
  blue: "Blue",
  lightness: "Lightness",
  swatches: "Swatches",
};

/** A preset: a color, or a color with a name to announce instead of its value. */
export type ColorSwatch = string | { color: string; label: string };

const SWATCHES: readonly ColorSwatch[] = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#ffffff",
  "#000000",
];

const FORMATS: readonly ColorFormat[] = ["hex", "rgb", "hsl"];
const DEFAULT_COLOR = "#7c6ab8";
const BLACK: HSVA = { h: 0, s: 0, v: 0, a: 1 };

// Layout effects run before paint on the client; the server has no layout.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The element CSS colors resolve against (a popover's trigger), when not the picker itself. */
const ScopeContext = createContext<Element | null>(null);

/**
 * Any CSS color the browser knows, such as a name, `oklch()`, or `var(--ow-accent)`, read in
 * `scope` so tokens and themes apply. Colors outside sRGB are read back through a canvas pixel.
 */
function resolveColor(value: string, scope: Element): HSVA | null {
  const probe = document.createElement("i");
  probe.style.color = value;
  if (!probe.style.color) return null;
  scope.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  const parsed = parseColor(color);
  if (parsed) return parsed;
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 255] = context.getImageData(0, 0, 1, 1).data;
  return rgbaToHsva({ r, g, b, a: a / 255 });
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className={cls.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

// Lucide icons (ISC): pipette, chevrons-up-down, check.
const PIPETTE = (
  <Icon>
    <path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12" />
    <path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z" />
    <path d="m2 22 .414-.414" />
  </Icon>
);
const CHEVRONS = (
  <Icon>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </Icon>
);
const CHECK = (
  <Icon>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
};

/** The saturation and brightness area: a 2D slider of its own, by pointer and keyboard. */
function Area({
  hsva,
  labels,
  disabled,
  onMove,
  onStep,
  onEnd,
}: {
  hsva: HSVA;
  labels: ColorPickerLabels;
  disabled: boolean;
  onMove: (s: number, v: number) => void;
  /** Keyboard steps, in saturation and brightness points. */
  onStep: (ds: number, dv: number) => void;
  onEnd: () => void;
}) {
  const rtl = useDirection() === "rtl";
  const pressed = useRef(false);
  const [dragging, setDragging] = useState(false);
  const { r, g, b } = hsvaToRgba(hsva);
  const s = Math.round(hsva.s);
  const v = Math.round(hsva.v);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - box.left) / box.width);
    const y = clamp((event.clientY - box.top) / box.height);
    onMove((rtl ? 1 - x : x) * 100, (1 - y) * 100);
  };
  const end = () => {
    if (!pressed.current) return;
    pressed.current = false;
    setDragging(false);
    onEnd();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const x = rtl ? -step : step;
    const delta = {
      ArrowLeft: [-x, 0],
      ArrowRight: [x, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
      PageUp: [0, 10],
      PageDown: [0, -10],
      Home: [-100, 0],
      End: [100, 0],
    }[event.key];
    if (!delta || disabled) return;
    event.preventDefault();
    onStep(delta[0] ?? 0, delta[1] ?? 0);
  };

  return (
    <div
      className={cls.area}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={labels.area}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={s}
      aria-valuetext={`${labels.saturation} ${s}%, ${labels.brightness} ${v}%`}
      aria-disabled={disabled || undefined}
      data-dragging={dragging ? "" : undefined}
      style={{ backgroundColor: `hsl(${hsva.h} 100% 50%)` }}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return;
        // No text selection or scrolling; focus moves by hand instead.
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        pressed.current = true;
        setDragging(true);
        move(event);
      }}
      onPointerMove={(event) => {
        if (pressed.current) move(event);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onKeyDown={onKeyDown}
    >
      <span
        className={cls.thumb}
        style={{
          insetInlineStart: `${hsva.s}%`,
          insetBlockStart: `${100 - hsva.v}%`,
          backgroundColor: `rgb(${r} ${g} ${b})`,
        }}
      />
    </div>
  );
}

/** Hue or alpha: a Base UI Slider, which brings the keyboard, ARIA, and right to left. */
function Channel({
  channel,
  value,
  max,
  label,
  unit,
  disabled,
  thumb,
  trackStyle,
  onValue,
  onCommit,
}: {
  channel: "hue" | "alpha";
  value: number;
  max: number;
  label: string;
  unit: string;
  disabled: boolean;
  thumb: string;
  trackStyle?: CSSProperties | undefined;
  onValue: (value: number) => void;
  onCommit: () => void;
}) {
  return (
    <Slider.Root
      className={cls.slider}
      data-channel={channel}
      value={value}
      max={max}
      disabled={disabled}
      onValueChange={onValue}
      onValueCommitted={onCommit}
    >
      <Slider.Control className={cls.control}>
        <Slider.Track className={cls.track} style={trackStyle}>
          <Slider.Thumb
            className={cls.thumb}
            aria-label={label}
            getAriaValueText={(_, n) => `${n}${unit}`}
            style={{ backgroundColor: thumb }}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

/**
 * One text field. Numbers apply as you type and step with the arrow keys (Shift: 10); hex applies
 * on Enter or blur, and anything it cannot read reverts. Escape drops an edit.
 */
function Field({
  label,
  short,
  value,
  range,
  disabled,
  onInput,
  onCommit,
}: {
  label: string;
  short: string;
  value: string;
  /** A numeric field's limits. */
  range?: readonly [number, number];
  disabled: boolean;
  /** A number typed, applied while editing; returns whether it could be read. */
  onInput?: (text: string) => boolean;
  /** The edit is done. */
  onCommit: (text: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Whether typing applied a number since the field was last committed.
  const applied = useRef(false);
  const shown = draft ?? value;
  const finish = () => {
    if (range ? applied.current : draft !== null && draft !== value) onCommit(draft ?? value);
    applied.current = false;
    setDraft(null);
  };

  return (
    <label className={cls.field} data-wide={range ? undefined : ""}>
      <input
        className={cls.input}
        value={shown}
        aria-label={label}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        inputMode={range ? "numeric" : "text"}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const text = event.currentTarget.value;
          setDraft(text);
          if (onInput?.(text)) applied.current = true;
        }}
        onBlur={finish}
        onKeyDown={(event) => {
          if (event.key === "Enter") finish();
          else if (event.key === "Escape" && draft !== null && draft !== value) {
            // The first Escape drops the edit; the next one may close a popover.
            event.stopPropagation();
            setDraft(null);
          } else if (range && onInput && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
            event.preventDefault();
            const base = Number.parseFloat(shown);
            const step = (event.shiftKey ? 10 : 1) * (event.key === "ArrowUp" ? 1 : -1);
            const next = String(clamp((Number.isNaN(base) ? 0 : base) + step, ...range));
            onInput(next);
            applied.current = true;
            finish();
          }
        }}
      />
      <span className={cls.label} aria-hidden="true">
        {short}
      </span>
    </label>
  );
}

const toNumber = (text: string): number | null => {
  const trimmed = text.trim().replace(/%$/, "");
  const n = trimmed === "" ? Number.NaN : Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

export interface ColorPickerProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange" | "defaultValue" | "children"> {
  /** The color, controlled: hex, `rgb()`, `hsl()`, or any CSS color the browser can resolve. */
  value?: string | undefined;
  /** The first color, uncontrolled. Default `#7c6ab8`. */
  defaultValue?: string | undefined;
  /** Every change: while dragging, typing, or stepping. */
  onChange?: ((value: string, color: ColorResult) => void) | undefined;
  /** When a change is done: a drag let go, a key, a swatch, an edit committed. */
  onChangeComplete?: ((value: string, color: ColorResult) => void) | undefined;
  /** The format of the value passed to the callbacks, and the fields shown first. Default `"hex"`. */
  format?: ColorFormat | undefined;
  /** The opacity slider and field. Default true. */
  alpha?: boolean | undefined;
  /** The hex, RGB, and HSL fields. Default true. */
  inputs?: boolean | undefined;
  /** Preset colors, or false for none. */
  swatches?: readonly ColorSwatch[] | false | undefined;
  /** The screen color picker, where the browser has one (the EyeDropper API). Default true. */
  eyeDropper?: boolean | undefined;
  disabled?: boolean | undefined;
  labels?: Partial<ColorPickerLabels> | undefined;
}

/** The picker: an area, hue and opacity sliders, fields, and swatches. */
export const ColorPicker: ForwardRefExoticComponent<
  ColorPickerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ColorPickerProps>(function ColorPicker(
  {
    value,
    defaultValue = DEFAULT_COLOR,
    onChange,
    onChangeComplete,
    format = "hex",
    alpha = true,
    inputs = true,
    swatches = SWATCHES,
    eyeDropper = true,
    disabled = false,
    labels: labelsProp,
    className,
    ...props
  },
  ref,
) {
  const labels = { ...colorPickerLabels, ...labelsProp };
  const scope = useContext(ScopeContext);
  const root = useRef<HTMLDivElement | null>(null);
  const opaque = (color: HSVA): HSVA => (alpha ? color : { ...color, a: 1 });
  const [hsva, setHsva] = useState(() => opaque(parseColor(value ?? defaultValue) ?? BLACK));
  // The latest color for event handlers, ahead of the next render.
  const latest = useRef(hsva);
  useBeforePaint(() => {
    latest.current = hsva;
  });
  // A controlled value is read again only when it differs from the one last seen or sent, so
  // the area keeps its precision while the app echoes our own values back.
  const [seen, setSeen] = useState(value);
  if (value !== undefined && value !== seen) {
    setSeen(value);
    const parsed = parseColor(value);
    if (parsed) setHsva(opaque(keepHue(parsed, hsva)));
  }
  const source = value ?? defaultValue;
  // Read again whenever the value changes.
  useBeforePaint(() => {
    const el = scope ?? root.current;
    if (parseColor(source) || !el) return;
    const resolved = resolveColor(source, el);
    if (resolved) setHsva(opaque(keepHue(resolved, latest.current)));
  }, [value]);

  // The fields shown: the format at first, then the switch's; a new format prop shows its own.
  const [mode, setMode] = useState(format);
  const [shownFormat, setShownFormat] = useState(format);
  if (format !== shownFormat) {
    setShownFormat(format);
    setMode(format);
  }
  const [canPick, setCanPick] = useState(false);
  useEffect(() => setCanPick("EyeDropper" in window), []);

  const emit = (input: HSVA, complete = false) => {
    const next = opaque(input);
    const prev = latest.current;
    const out = formatColor(next, format, alpha);
    if (next.h !== prev.h || next.s !== prev.s || next.v !== prev.v || next.a !== prev.a) {
      latest.current = next;
      setHsva(next);
      setSeen(out);
      onChange?.(out, toColorResult(next));
    }
    if (complete) onChangeComplete?.(out, toColorResult(next));
  };
  const patch = (part: Partial<HSVA>, complete = false) =>
    emit({ ...latest.current, ...part }, complete);
  const done = () => emit(latest.current, true);

  const rgba = hsvaToRgba(hsva);
  const hsla = hsvaToHsla(hsva);
  const rgb = `${rgba.r} ${rgba.g} ${rgba.b}`;
  const hex8 = rgbaToHex(rgba, true);

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      root.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const pick = async () => {
    const EyeDropper = (window as EyeDropperWindow).EyeDropper;
    if (!EyeDropper) return;
    try {
      const { sRGBHex } = await new EyeDropper().open();
      const parsed = parseColor(sRGBHex);
      if (parsed) emit(keepHue({ ...parsed, a: latest.current.a }, latest.current), true);
    } catch {
      // Cancelled with Escape.
    }
  };

  // Numeric fields: a channel of rgb or hsl, or the alpha percentage.
  const numeric = (
    key: string,
    label: string,
    shown: number,
    max: number,
    apply: (n: number) => HSVA,
  ) => (
    <Field
      key={key}
      label={label}
      short={key.toUpperCase()}
      value={String(Math.round(shown))}
      range={[0, max]}
      disabled={disabled}
      onInput={(text) => {
        const n = toNumber(text);
        if (n !== null) emit(apply(clamp(n, 0, max)));
        return n !== null;
      }}
      onCommit={done}
    />
  );
  let fields: ReactNode;
  if (mode === "hex") {
    fields = (
      <Field
        label={labels.hex}
        short="HEX"
        value={rgbaToHex(rgba, false).slice(1).toUpperCase()}
        disabled={disabled}
        onCommit={(text) => {
          const parsed = parseColor(text);
          if (!parsed) return;
          // Three or six digits keep the opacity; four or eight set it.
          const a = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(text.trim())
            ? latest.current.a
            : parsed.a;
          emit(keepHue({ ...parsed, a }, latest.current), true);
        }}
      />
    );
  } else if (mode === "rgb") {
    fields = (["r", "g", "b"] as const).map((key, i) =>
      numeric(key, [labels.red, labels.green, labels.blue][i] ?? key, rgba[key], 255, (n) =>
        keepHue(rgbaToHsva({ ...hsvaToRgba(latest.current), [key]: n }), latest.current),
      ),
    );
  } else {
    fields = (["h", "s", "l"] as const).map((key, i) =>
      numeric(
        key,
        [labels.hue, labels.saturation, labels.lightness][i] ?? key,
        hsla[key],
        key === "h" ? 360 : 100,
        (n) => hslaToHsva({ ...hsvaToHsla(latest.current), [key]: n }),
      ),
    );
  }

  const presets = (swatches || []).flatMap((swatch, i) => {
    const color = typeof swatch === "string" ? swatch : swatch.color;
    const parsed = parseColor(color);
    if (!parsed) return [];
    const own = hsvaToRgba(opaque(parsed));
    return [
      {
        key: `${i}:${color}`,
        color: rgbaToHex(own),
        hex8: rgbaToHex(own, true),
        label: typeof swatch === "string" ? color : swatch.label,
        parsed,
        // A dark check on light colors (perceived brightness).
        light: (own.r * 299 + own.g * 587 + own.b * 114) / 255000 > 0.6,
      },
    ];
  });
  const active = presets.find((preset) => preset.hex8 === hex8)?.key;

  return (
    <div
      ref={setRef}
      className={className ? `${cls.root} ${className}` : cls.root}
      data-disabled={disabled ? "" : undefined}
      {...props}
    >
      <Area
        hsva={hsva}
        labels={labels}
        disabled={disabled}
        onMove={(s, v) => patch({ s, v })}
        onStep={(ds, dv) => {
          const { s, v } = latest.current;
          patch({ s: clamp(s + ds, 0, 100), v: clamp(v + dv, 0, 100) }, true);
        }}
        onEnd={done}
      />
      <div className={cls.tools} data-stack={alpha ? "" : undefined}>
        {canPick && eyeDropper ? (
          <button
            type="button"
            className={cls.tool}
            aria-label={labels.eyeDropper}
            disabled={disabled}
            onClick={pick}
          >
            {PIPETTE}
          </button>
        ) : null}
        <div className={cls.sliders}>
          <Channel
            channel="hue"
            value={Math.round(hsva.h)}
            max={360}
            label={labels.hue}
            unit="°"
            disabled={disabled}
            thumb={`hsl(${hsva.h} 100% 50%)`}
            onValue={(h) => patch({ h })}
            onCommit={done}
          />
          {alpha ? (
            <Channel
              channel="alpha"
              value={Math.round(hsva.a * 100)}
              max={100}
              label={labels.alpha}
              unit="%"
              disabled={disabled}
              thumb={`rgb(${rgb} / ${hsva.a})`}
              trackStyle={{ "--_alpha": `rgb(${rgb})` } as CSSProperties}
              onValue={(a) => patch({ a: a / 100 })}
              onCommit={done}
            />
          ) : null}
        </div>
        <span
          className={cls.preview}
          style={{ "--_color": `rgb(${rgb} / ${hsva.a})` } as CSSProperties}
          aria-hidden="true"
        />
      </div>
      {inputs ? (
        <div className={cls.inputs}>
          <button
            type="button"
            className={cls.format}
            aria-label={`${labels.format}: ${mode.toUpperCase()}`}
            disabled={disabled}
            onClick={() => setMode(FORMATS[(FORMATS.indexOf(mode) + 1) % FORMATS.length] ?? "hex")}
          >
            {mode.toUpperCase()}
            {CHEVRONS}
          </button>
          {fields}
          {alpha
            ? numeric("a", labels.alpha, hsva.a * 100, 100, (n) => ({
                ...latest.current,
                a: n / 100,
              }))
            : null}
        </div>
      ) : null}
      {presets.length ? (
        <ToggleGroup
          className={cls.swatches}
          aria-label={labels.swatches}
          value={active ? [active] : []}
          disabled={disabled}
        >
          {presets.map((preset) => (
            <Toggle
              key={preset.key}
              value={preset.key}
              className={cls.swatch}
              aria-label={preset.label}
              data-alpha={preset.parsed.a < 1 && alpha ? "" : undefined}
              data-light={preset.light ? "" : undefined}
              style={{ "--_color": preset.color } as CSSProperties}
              onClick={() => emit(keepHue(preset.parsed, latest.current), true)}
            >
              {CHECK}
            </Toggle>
          ))}
        </ToggleGroup>
      ) : null}
    </div>
  );
});

export interface ColorPickerPopoverProps
  extends Pick<
      ColorPickerProps,
      | "value"
      | "defaultValue"
      | "onChange"
      | "onChangeComplete"
      | "format"
      | "alpha"
      | "inputs"
      | "swatches"
      | "eyeDropper"
      | "labels"
    >,
    Omit<Popover.Trigger.Props, "value" | "defaultValue" | "onChange" | "children" | "ref"> {
  open?: Popover.Root.Props["open"];
  defaultOpen?: Popover.Root.Props["defaultOpen"];
  onOpenChange?: Popover.Root.Props["onOpenChange"];
  side?: Popover.Positioner.Props["side"];
  align?: Popover.Positioner.Props["align"];
  sideOffset?: Popover.Positioner.Props["sideOffset"];
  /** The trigger's size (FR-11). Default `"md"`. */
  size?: "sm" | "md" | "lg" | undefined;
  /** `"field"` shows the color and its value; `"swatch"` is a square of the color. */
  variant?: "field" | "swatch" | undefined;
  /** Replaces the trigger's content. */
  children?: ReactNode;
}

/**
 * A trigger that opens the picker in a popover. The trigger paints the color, so a value Color
 * Picker cannot parse, such as `var(--ow-accent)`, still shows and follows its theme.
 */
export const ColorPickerPopover: ForwardRefExoticComponent<
  ColorPickerPopoverProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, ColorPickerPopoverProps>(function ColorPickerPopover(
  {
    value,
    defaultValue = DEFAULT_COLOR,
    onChange,
    onChangeComplete,
    format = "hex",
    alpha = true,
    inputs,
    swatches,
    eyeDropper,
    labels,
    open,
    defaultOpen,
    onOpenChange,
    side = "bottom",
    align = "start",
    sideOffset = 8,
    size = "md",
    variant = "field",
    className,
    children,
    ...props
  },
  ref,
) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const direction = useDirection();
  const parsed = parseColor(current);

  const setRef = useCallback(
    (el: HTMLButtonElement | null) => {
      setTrigger(el);
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  return (
    <Popover.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger
        ref={setRef}
        className={withClassName(cls.trigger, className)}
        data-size={size}
        data-variant={variant}
        {...props}
      >
        {children === undefined ? (
          <>
            <span
              className={cls.chip}
              data-alpha={parsed && parsed.a < 1 && alpha ? "" : undefined}
              style={
                {
                  "--_color": parsed ? rgbaToHex(hsvaToRgba(parsed)) : current,
                } as CSSProperties
              }
            />
            {variant === "field" ? (
              <span className={cls.value}>
                {parsed ? formatColor(parsed, format, alpha) : current}
              </span>
            ) : null}
          </>
        ) : (
          children
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className={cls.positioner}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          // Portaled to the body: keep the trigger's direction (FR-16) and theme.
          dir={direction}
          data-theme={trigger?.closest("[data-theme]")?.getAttribute("data-theme") ?? undefined}
        >
          <Popover.Popup
            className={cls.popup}
            aria-label={labels?.picker ?? colorPickerLabels.picker}
          >
            <ScopeContext.Provider value={trigger}>
              <ColorPicker
                value={current}
                format={format}
                alpha={alpha}
                inputs={inputs}
                swatches={swatches}
                eyeDropper={eyeDropper}
                labels={labels}
                onChange={(next, color) => {
                  if (value === undefined) setInner(next);
                  onChange?.(next, color);
                }}
                onChangeComplete={onChangeComplete}
              />
            </ScopeContext.Provider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
});
