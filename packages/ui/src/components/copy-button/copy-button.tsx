"use client";

import {
  type ForwardRefExoticComponent,
  forwardRef,
  type RefAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { joinClass } from "../../core/class-name";
import { Button, type ButtonProps } from "../button/button";
import { IconMorph } from "../icon-morph/icon-morph";
import {
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipRoot,
  TooltipTrigger,
} from "../tooltip/tooltip";
import "./copy-button.css";

const cls = {
  root: "ow-copy-button",
  icon: "ow-copy-button__icon",
  check: "ow-copy-button__check",
  label: "ow-copy-button__label",
  labelText: "ow-copy-button__label-text",
  tip: "ow-copy-button__tip",
  tipText: "ow-copy-button__tip-text",
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
  /**
   * Shows the label beside the icon. Without it the button is an icon, named by the label, with a
   * Tooltip that says it and turns to the copied label on a click.
   */
  showLabel?: boolean | undefined;
  /** The icon swap's length, as a CSS time such as `"300ms"`. @default the settle spring's */
  duration?: string | undefined;
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

// The popup is mounted only while open; layout effects are skipped on the server.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Sizes the Tooltip's words to the one on show, so the popup's width follows it (and eases, in
 * CSS) when the label changes while it is open. The Positioner keeps the popup centered on the
 * trigger as it resizes.
 */
function useTipWidth(deps: readonly unknown[]) {
  const tip = useRef<HTMLSpanElement | null>(null);
  const fit = useCallback(() => {
    const el = tip.current;
    const active = el?.querySelector<HTMLElement>("[data-visible]");
    if (el && active) el.style.inlineSize = `${active.getBoundingClientRect().width}px`;
  }, []);
  const ref = useCallback(
    (el: HTMLSpanElement | null) => {
      tip.current = el;
      fit();
    },
    [fit],
  );
  useBeforePaint(fit, deps);
  return ref;
}

/**
 * A Button that copies `value`: its copy icon morphs into a check that draws itself in, and back
 * after `timeout`. Until then it does not copy again. A visually hidden status region announces
 * the copy. Icon only, its Tooltip names it and, on a click, turns its words to the copied label in
 * place, and back when the icon is.
 */
export const CopyButton: ForwardRefExoticComponent<
  CopyButtonProps & RefAttributes<HTMLButtonElement>
> = forwardRef<HTMLButtonElement, CopyButtonProps>(function CopyButton(
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
    duration,
    style,
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
  // The Tooltip's own open state (hover or focus). While copied it stays open; once the icon is
  // back it stays only as far as the pointer or focus does.
  const [hint, setHint] = useState(false);
  const tip = useTipWidth([on, copy, copied]);
  const timing = duration ? ({ ...style, "--_duration": duration } as ButtonProps["style"]) : style;

  const button = (
    <Button
      aria-label={showLabel ? undefined : copy}
      {...props}
      ref={ref}
      style={timing}
      variant={variant}
      className={joinClass(cls.root, className)}
      data-copied={on ? "" : undefined}
      // Busy until the icon is back: it says so, without the disabled look.
      aria-disabled={on || props["aria-disabled"] || undefined}
      data-icon-only={showLabel ? undefined : ""}
      startIcon={<IconMorph duration={duration}>{on ? CHECK : COPY}</IconMorph>}
      onClick={(event) => {
        onClick?.(event);
        // Busy until the icon is back.
        if (event.defaultPrevented || on) return;
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
  );

  return (
    <>
      {showLabel ? (
        button
      ) : (
        <TooltipRoot
          open={on || hint}
          onOpenChange={(open, details) => {
            // The press is the click that copies: the same Tooltip stays and changes its words.
            if (!open && details.reason === "trigger-press") return;
            setHint(open);
          }}
        >
          <TooltipTrigger render={button} />
          <TooltipPortal>
            <TooltipPositioner>
              <TooltipPopup>
                <TooltipArrow />
                <span ref={tip} className={cls.tip}>
                  <span
                    className={cls.tipText}
                    data-visible={on ? undefined : ""}
                    aria-hidden={on ? "true" : undefined}
                  >
                    {copy}
                  </span>
                  <span
                    className={cls.tipText}
                    data-visible={on ? "" : undefined}
                    aria-hidden={on ? undefined : "true"}
                  >
                    {copied}
                  </span>
                </span>
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </TooltipRoot>
      )}
      <span role="status" className={cls.status}>
        {on ? copied : ""}
      </span>
    </>
  );
});

export declare namespace CopyButton {
  type Props = CopyButtonProps;
}
