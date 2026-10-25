"use client";

import {
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  useEffect,
  useState,
} from "react";
import { withClassName } from "../../core/class-name";
import { Button, type ButtonProps } from "../button/button";
import { IconMorph } from "../icon-morph/icon-morph";
import "./copy-button.css";

const cls = {
  root: "ow-copy-button",
  icon: "ow-copy-button__icon",
  check: "ow-copy-button__check",
  label: "ow-copy-button__label",
  labelText: "ow-copy-button__label-text",
  status: "ow-copy-button__status",
} as const;

export interface CopyButtonLabels {
  /** @default "Copy" */
  copy?: string | undefined;
  /** @default "Copied" */
  copied?: string | undefined;
}

export interface CopyButtonProps
  extends Omit<
    ButtonProps,
    "value" | "onCopy" | "onError" | "children" | "startIcon" | "endIcon" | "loading"
  > {
  /** The text to copy, or a function that returns it, read at the moment of the click. */
  value: string | (() => string);
  /** How long the button shows it copied, in ms. @default 1600 */
  timeout?: number | undefined;
  /** The words it shows and announces, for translation. */
  labels?: CopyButtonLabels | undefined;
  /** Shows the label beside the icon. Without it the button is an icon, named by the label. */
  showLabel?: boolean | undefined;
  /** After the text is on the clipboard. */
  onCopy?: ((text: string) => void) | undefined;
  /** When the browser refuses, or has no Clipboard API; the button does not show it copied. */
  onError?: ((error: unknown) => void) | undefined;
}

// Lucide icons (ISC): copy and check. The check draws its stroke in as it enters.
const COPY = (
  <svg key="copy" className={cls.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
const CHECK = (
  <svg
    key="check"
    className={`${cls.icon} ${cls.check}`}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6 9 17l-5-5" pathLength={1} />
  </svg>
);

/**
 * A Button that copies `value`: its copy icon morphs into a check that draws itself in, and back
 * after `timeout`. A visually hidden status region announces the copy.
 */
export const CopyButton: ForwardRefExoticComponent<CopyButtonProps & RefAttributes<HTMLElement>> =
  forwardRef<HTMLElement, CopyButtonProps>(function CopyButton(
    {
      value,
      timeout = 1600,
      labels,
      showLabel = false,
      onCopy,
      onError,
      onClick,
      variant = "ghost",
      className,
      ...props
    },
    ref,
  ) {
    const copy = labels?.copy ?? "Copy";
    const copied = labels?.copied ?? "Copied";
    // Counts copies, so each one restarts the timer.
    const [done, setDone] = useState(0);
    useEffect(() => {
      if (!done) return;
      const timer = setTimeout(() => setDone(0), timeout);
      return () => clearTimeout(timer);
    }, [done, timeout]);
    const on = done > 0;

    return (
      <>
        <Button
          aria-label={showLabel ? undefined : copy}
          {...props}
          ref={ref}
          variant={variant}
          className={withClassName(cls.root, className)}
          data-copied={on ? "" : undefined}
          data-icon-only={showLabel ? undefined : ""}
          startIcon={<IconMorph>{on ? CHECK : COPY}</IconMorph>}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            const text = typeof value === "function" ? value() : value;
            // Missing outside secure contexts (http), so that fails like a refusal.
            const write = navigator.clipboard?.writeText(text);
            (write ?? Promise.reject(new Error("The Clipboard API is not available.")))
              .then(() => {
                setDone((n) => n + 1);
                onCopy?.(text);
              })
              .catch((error: unknown) => onError?.(error));
          }}
        >
          {showLabel ? (
            // Both words share one cell, so the width holds; the hidden one is not read.
            <span className={cls.label}>
              <span className={cls.labelText} data-visible={on ? undefined : ""}>
                {copy}
              </span>
              <span className={cls.labelText} data-visible={on ? "" : undefined}>
                {copied}
              </span>
            </span>
          ) : null}
        </Button>
        <span role="status" className={cls.status}>
          {on ? copied : ""}
        </span>
      </>
    );
  });

export declare namespace CopyButton {
  type Props = CopyButtonProps;
}
