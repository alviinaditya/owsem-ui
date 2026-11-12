"use client";

import {
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  forwardRef,
  isValidElement,
  type ReactElement,
  type RefAttributes,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import "./icon-morph.css";

const cls = { root: "ow-icon-morph", item: "ow-icon-morph__item" } as const;

// Before the first paint, so an icon is never drawn in the wrong state; the server has no layout,
// so it falls back without React 18's warning.
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface IconMorphProps extends Omit<ComponentPropsWithoutRef<"span">, "children"> {
  /**
   * One icon element. A new `key` swaps it: the old icon leaves as the new one enters, in the
   * same place. Nothing animates on the first render; `null` shows none.
   */
  children?: ReactElement | null | false | undefined;
}

interface Leaving {
  key: string;
  element: ReactElement;
  id: number;
}

interface State {
  /** The key on show, or null for none. */
  key: string | null;
  /** The icon on its way out; at most one. */
  leaving: Leaving | null;
  /** Whether the leaving icon is first in the DOM. Nodes never move: that would cancel their transitions. */
  leavingFirst: boolean;
  /** The key that just mounted, in its starting style until it is applied. */
  entering: string | null;
}

const keyOf = (child: unknown): string | null =>
  isValidElement(child) ? String(child.key ?? "") : null;

/**
 * Swaps one icon for another: when the child's `key` changes, the old icon shrinks, blurs, and
 * fades out while the new one grows in, both in one grid cell, so nothing around them moves. CSS
 * transitions only, so a change mid-swap turns around where it is, and nothing runs at rest.
 */
export const IconMorph: ForwardRefExoticComponent<IconMorphProps & RefAttributes<HTMLSpanElement>> =
  forwardRef<HTMLSpanElement, IconMorphProps>(function IconMorph(
    { children, className, ...props },
    ref,
  ) {
    const icon = isValidElement(children) ? children : null;
    const key = keyOf(icon);
    const root = useRef<HTMLSpanElement | null>(null);
    // The icon last committed, which becomes the leaving one when the key changes.
    const shown = useRef<ReactElement | null>(icon);
    const ids = useRef(0);
    const [state, setState] = useState<State>({
      key,
      leaving: null,
      leavingFirst: false,
      entering: null,
    });

    if (key !== state.key) {
      // The icon on show leaves, and one that was already leaving goes at once, unless the new key
      // is that one coming back: it turns around where it is.
      const back = state.leaving?.key === key;
      const leaving =
        state.key !== null && shown.current
          ? { key: state.key, element: shown.current, id: ++ids.current }
          : back
            ? null
            : state.leaving;
      setState({
        key,
        leaving,
        leavingFirst: back ? !state.leavingFirst : true,
        entering: back ? null : key,
      });
    }

    useBeforePaint(() => {
      shown.current = icon;
    });

    // The new icon mounted in its starting style: apply it, then take it off, so it transitions in.
    const { entering } = state;
    useBeforePaint(() => {
      if (entering === null) return;
      const el = root.current?.querySelector(":scope > [data-starting-style]");
      if (el) getComputedStyle(el).opacity;
      setState((s) => (s.entering === entering ? { ...s, entering: null } : s));
    }, [entering]);

    // The leaving icon goes once its transitions end, or at once without any (hidden, or none set).
    const leavingId = state.leaving?.id;
    useBeforePaint(() => {
      if (leavingId === undefined) return;
      const done = () =>
        setState((s) => (s.leaving?.id === leavingId ? { ...s, leaving: null } : s));
      const el = root.current?.querySelector(":scope > [data-ending-style]");
      // getAnimations() applies the ending style first, so its transitions are there.
      const animations = el?.getAnimations() ?? [];
      if (!animations.length) {
        done();
        return;
      }
      let live = true;
      // A transition that turns around rejects; the state check keeps an icon that came back.
      void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (live) done();
      });
      return () => {
        live = false;
      };
    }, [leavingId]);

    const setRef = useCallback(
      (el: HTMLSpanElement | null) => {
        root.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );

    const item = (itemKey: string, element: ReactElement, leaving: boolean) => (
      <span
        key={itemKey}
        className={cls.item}
        data-starting-style={!leaving && itemKey === state.entering ? "" : undefined}
        data-ending-style={leaving ? "" : undefined}
        aria-hidden={leaving || undefined}
      >
        {element}
      </span>
    );
    const current = key === null || !icon ? null : item(key, icon, false);
    const leaving = state.leaving ? item(state.leaving.key, state.leaving.element, true) : null;

    return (
      <span ref={setRef} className={className ? `${cls.root} ${className}` : cls.root} {...props}>
        {state.leavingFirst ? leaving : current}
        {state.leavingFirst ? current : leaving}
      </span>
    );
  });
