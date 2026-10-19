"use client";

import { type CSSProperties, useId, useRef, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { Icon } from "../icons/icon";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#f00", "F00", and "#ff0000" all become "#ff0000"; anything else is not a color yet. */
export function normalizeHex(text: string): string | undefined {
  const digits = HEX.exec(text.trim())?.[1]?.toLowerCase();
  if (!digits) return undefined;
  return `#${digits.length === 3 ? [...digits].map((d) => d + d).join("") : digits}`;
}

/** An element's background as #rrggbb, whatever color syntax the token uses. */
function backgroundHex(el: Element | null): string {
  const context = document.createElement("canvas").getContext("2d");
  if (!el || !context) return "#000000";
  context.fillStyle = getComputedStyle(el).backgroundColor;
  return normalizeHex(context.fillStyle) ?? "#000000";
}

/**
 * A color control: a swatch that opens the browser's picker, a hex field to type or paste into,
 * and a button back to the theme's own color. Empty means the theme token, shown live in the
 * swatch, so it follows the stage theme.
 */
export function ColorField({
  label,
  value,
  token,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  /** The token used while the value is empty, such as --ow-line-dark. */
  token: string;
  labels: Dictionary["lab"];
  onChange: (value: string) => void;
}) {
  const id = useId();
  const swatch = useRef<HTMLSpanElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  // The picker opens on the color in use, the theme's included.
  const [picked, setPicked] = useState("#000000");
  // A scene, Reset, or the picker changed the value: show it, unless the draft already means it.
  if (value !== shown) {
    setShown(value);
    if (value !== (normalizeHex(draft) ?? "")) setDraft(value);
  }
  const invalid = draft.trim() !== "" && !normalizeHex(draft);
  const syncPicker = () => {
    if (!value) setPicked(backgroundHex(swatch.current));
  };

  return (
    <div className="lab-field">
      <label htmlFor={id}>{label}</label>
      <div className="color-field">
        <span
          ref={swatch}
          className="color-swatch"
          style={{ "--swatch": value || `var(${token})` } as CSSProperties}
        >
          <input
            type="color"
            aria-label={`${label} (${labels.colorPicker})`}
            value={value || picked}
            onPointerDown={syncPicker}
            onFocus={syncPicker}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </span>
        <input
          ref={field}
          id={id}
          className="color-hex"
          type="text"
          value={draft}
          placeholder={labels.themeDefault}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid || undefined}
          onChange={(event) => {
            const text = event.currentTarget.value;
            setDraft(text);
            const color = text.trim() === "" ? "" : normalizeHex(text);
            if (color !== undefined) onChange(color);
          }}
          onBlur={() => setDraft(value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setDraft(value);
          }}
        />
        {value ? (
          <button
            type="button"
            className="color-clear"
            aria-label={`${label}: ${labels.useDefault}`}
            title={labels.useDefault}
            onClick={() => {
              onChange("");
              // The button goes away; focus stays in the control.
              field.current?.focus();
            }}
          >
            <Icon name="rotate-ccw" size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
