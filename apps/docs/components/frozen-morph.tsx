"use client";

import { IconMorph } from "owsem-ui/owsem";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icons/icon";

/**
 * An Icon Morph swap from one icon to another, held at `at` ms (null: at rest). The swap starts
 * after a paint, so the old icon has a style to leave from; then its transitions pause there.
 */
export function FrozenMorph({
  from,
  to,
  at,
  size,
  style,
}: {
  from: IconName;
  to: IconName;
  at: number | null;
  size: number;
  style?: CSSProperties;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const [swapped, setSwapped] = useState(false);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setSwapped(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!swapped || at === null) return;
    // A frame later: the new icon leaves its starting style after this effect, so only then do
    // both icons have their transitions.
    const frame = requestAnimationFrame(() => {
      for (const animation of root.current?.getAnimations({ subtree: true }) ?? []) {
        animation.pause();
        animation.currentTime = at;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [swapped, at]);
  return (
    <IconMorph ref={root} style={style}>
      {swapped ? (
        <Icon key={to} name={to} size={size} />
      ) : (
        <Icon key={from} name={from} size={size} />
      )}
    </IconMorph>
  );
}
