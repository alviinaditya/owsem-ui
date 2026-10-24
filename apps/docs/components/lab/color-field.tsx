"use client";

import { ColorPickerPopover } from "owsem-ui/owsem";
import { type CSSProperties, useId, useRef } from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { Icon } from "../icons/icon";

/**
 * A color control: a button that shows the color and opens Color Picker, where its Hex field takes
 * typed or pasted colors, and a button back to the theme's own color. Empty means the theme token:
 * the chip paints it, so it follows the stage theme, and the picker opens on it.
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
  const trigger = useRef<HTMLButtonElement>(null);
  const color = value || `var(${token})`;

  return (
    <div className="lab-field">
      <span id={`${id}-label`} className="lab-field-label">
        {label}
      </span>
      <div className="color-field">
        <ColorPickerPopover
          ref={trigger}
          className="color-trigger"
          aria-labelledby={`${id}-label ${id}-value`}
          value={color}
          alpha={false}
          labels={{ ...labels.picker, picker: label }}
          onChange={onChange}
        >
          <span className="ow-color-picker__chip" style={{ "--_color": color } as CSSProperties} />
          <span id={`${id}-value`} className="color-value" data-empty={value ? undefined : ""}>
            {value || labels.themeDefault}
          </span>
        </ColorPickerPopover>
        {value ? (
          <button
            type="button"
            className="color-clear"
            aria-label={`${label}: ${labels.useDefault}`}
            title={labels.useDefault}
            onClick={() => {
              onChange("");
              // The button goes away; focus stays in the control.
              trigger.current?.focus();
            }}
          >
            <Icon name="rotate-ccw" size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
