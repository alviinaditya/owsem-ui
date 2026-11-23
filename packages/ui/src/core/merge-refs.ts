import { type Ref, type RefCallback, useCallback } from "react";

function assign<T>(ref: Ref<T> | undefined, value: T | null): (() => void) | undefined {
  if (typeof ref === "function") {
    const cleanup = ref(value);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = value;
    return () => {
      ref.current = null;
    };
  }
  return undefined;
}

/** One ref callback that sets both refs, for a part that needs its element and the caller's ref. */
export function useMergedRefs<T>(a: Ref<T> | undefined, b: Ref<T> | undefined): RefCallback<T> {
  return useCallback(
    (el: T | null) => {
      if (el === null) return;
      const cleanups = [assign(a, el), assign(b, el)];
      return () => {
        for (const cleanup of cleanups) cleanup?.();
      };
    },
    [a, b],
  );
}
