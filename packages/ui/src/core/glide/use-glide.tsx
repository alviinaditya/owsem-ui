"use client";

import {
  type ComponentProps,
  type ReactElement,
  type RefCallback,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../cn";
import { createGlide, type Glide, type GlideOptions } from "./glide";
import { glideSlots } from "./glide-variants";
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

export interface GlideHighlightProps
  extends Omit<ComponentProps<"span">, "children" | "className" | "ref"> {
  /** What `useGlide` returned. */
  glide: Pick<UseGlide<HTMLElement>, "highlightRef">;
  className?: string | undefined;
}

/** The highlight; decorative, so hidden from assistive technology. */
export function GlideHighlight({ glide, className, ...props }: GlideHighlightProps): ReactElement {
  return (
    <span
      data-slot="glide"
      {...props}
      ref={glide.highlightRef}
      aria-hidden="true"
      className={cn(glideSlots.root, className)}
    />
  );
}
