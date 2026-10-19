"use client";

import {
  type ComponentPropsWithoutRef,
  type JSX,
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createGlide, type Glide, type GlideOptions } from "./glide";
import "./glide.css";

export interface UseGlide<T extends HTMLElement> {
  /** For the container: the items and the highlight go inside it. */
  ref: RefCallback<T>;
  /** For the highlight; `GlideHighlight` takes the whole object instead. */
  highlightRef: RefObject<HTMLSpanElement | null>;
  /** Lights an item (or none) without a pointer, e.g. for keyboard highlight. */
  setActive: (item: HTMLElement | null) => void;
  /** Re-reads positions after items move under a still pointer. */
  refresh: () => void;
}

/**
 * Glide for a container: render `<GlideHighlight glide={glide} />` inside it and mark
 * the items (`data-glide-item`, or `options.items`). Options are read on every event.
 */
export function useGlide<T extends HTMLElement = HTMLElement>(
  options: GlideOptions = {},
): UseGlide<T> {
  const [container, setContainer] = useState<T | null>(null);
  const highlightRef = useRef<HTMLSpanElement | null>(null);
  const instance = useRef<Glide | null>(null);
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    const highlight = highlightRef.current;
    if (!container || !highlight) return;
    const glide = createGlide(container, highlight, () => latest.current);
    instance.current = glide;
    return () => {
      glide.destroy();
      instance.current = null;
    };
  }, [container]);

  const setActive = useCallback(
    (item: HTMLElement | null) => instance.current?.setActive(item),
    [],
  );
  const refresh = useCallback(() => instance.current?.refresh(), []);
  return { ref: setContainer, highlightRef, setActive, refresh };
}

/** The highlight; decorative, so hidden from assistive technology. */
export function GlideHighlight({
  glide,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  glide: Pick<UseGlide<HTMLElement>, "highlightRef">;
}): JSX.Element {
  return (
    <span
      {...props}
      ref={glide.highlightRef}
      aria-hidden="true"
      className={className ? `ow-glide ${className}` : "ow-glide"}
    />
  );
}
