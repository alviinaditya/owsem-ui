// Generated from components/meter by scripts/build-tailwind.ts; do not edit.
"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { Meter as BaseMeter } from "@base-ui/react/meter";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "../lib/cn";
import {
  type MeterSize,
  type MeterTone,
  type MeterVariantProps,
  meterLegendItemVariants,
  meterLegendVariants,
  meterSegmentVariants,
  meterSlots,
  meterVariants,
} from "./meter-variants";

/** What a Group shares with its Root, Segments, and Legend. */
interface GroupState {
  /** The part that was picked. */
  active: string | null;
  /** The part under the pointer, else the active one. */
  shown: string | null;
  size: MeterSize | undefined;
  /** Makes a part active, or clears it when it already is. */
  toggle: (name: string) => void;
  /** The part under the mouse pointer; null once it leaves. */
  hover: (name: string | null) => void;
}

const GroupContext = createContext<GroupState | null>(null);

/** The range a Root draws, for the Segments in it. */
const RangeContext = createContext({ min: 0, max: 100 });

export interface MeterGroupProps
  extends Omit<ComponentPropsWithRef<"div">, "className" | "children"> {
  className?: string | undefined;
  /** The part that is active; with `onActiveChange`, controls it. */
  active?: string | null | undefined;
  /** The part that starts active, when uncontrolled. @default null */
  defaultActive?: string | null | undefined;
  onActiveChange?: ((name: string | null) => void) | undefined;
  /** The size of the Root and the Legend inside, unless they have their own. */
  size?: MeterSize | undefined;
  /** A node, or a function of the part being shown (under the pointer, else the active one). */
  children?: ReactNode | ((shown: string | null) => ReactNode);
}

/**
 * A meter and its legend, side by side. It holds which part is active and which is under the
 * pointer, so a Legend item and its Segment answer each other. The Legend sits outside the
 * Root: a meter's children are not read by screen readers, and the legend's buttons must be.
 */
export function MeterGroup({
  active,
  defaultActive = null,
  onActiveChange,
  size,
  className,
  children,
  ...props
}: MeterGroupProps): ReactElement {
  const [own, setOwn] = useState<string | null>(defaultActive);
  const [over, setOver] = useState<string | null>(null);
  const current = active === undefined ? own : active;
  const shown = over ?? current;
  const toggle = useCallback(
    (name: string) => {
      const next = name === current ? null : name;
      if (active === undefined) setOwn(next);
      onActiveChange?.(next);
    },
    [active, current, onActiveChange],
  );
  const state = useMemo(
    () => ({ active: current, shown, size, toggle, hover: setOver }),
    [current, shown, size, toggle],
  );
  return (
    <GroupContext.Provider value={state}>
      <div data-slot="meter-group" {...props} className={className}>
        {typeof children === "function" ? children(shown) : children}
      </div>
    </GroupContext.Provider>
  );
}

export interface MeterSegmentProps extends Omit<ComponentPropsWithRef<"span">, "className"> {
  className?: string | undefined;
  /** What a Legend item and a Group refer to it by. */
  name?: string | undefined;
  /** How much of the range it takes; a value outside it is clamped. */
  value: number;
  /** Its color, instead of the one its position gives. */
  tone?: MeterTone | undefined;
}

/** A part's share of a range, as a number from 0 to 100. */
function shareOf(value: number, min: number, max: number): number {
  const percent = (value / (max - min)) * 100;
  return Number.isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));
}

/**
 * A part of a whole, in a Track: a pill as wide as its share of the Root's range. Its color
 * follows its position, from the accent toward the text color.
 */
export function MeterSegment({
  name,
  value,
  tone,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  ...props
}: MeterSegmentProps): ReactElement {
  const { min, max } = useContext(RangeContext);
  const group = useContext(GroupContext);
  const share = shareOf(value, min, max);
  const shown = group?.shown ?? null;
  return (
    <span
      data-slot="meter-segment"
      {...props}
      className={cn(meterSegmentVariants({ tone }), className)}
      data-active={name !== undefined && name === shown ? "" : undefined}
      data-dimmed={shown !== null && name !== shown ? "" : undefined}
      data-empty={share === 0 ? "" : undefined}
      data-tone={tone}
      style={{ "--_share": share, ...style } as CSSProperties}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (name !== undefined && event.pointerType === "mouse") group?.hover(name);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (name !== undefined && event.pointerType === "mouse") group?.hover(null);
      }}
    />
  );
}

export interface MeterLegendProps extends Omit<ComponentPropsWithRef<"div">, "className"> {
  className?: string | undefined;
  /** The text size, as the Root's. Defaults to the Group's, else `md`. */
  size?: MeterSize | undefined;
}

/** The buttons that name the parts, in a wrapping row. Put it beside the Root, not inside. */
export function MeterLegend({
  size: ownSize,
  className,
  ...props
}: MeterLegendProps): ReactElement {
  const group = useContext(GroupContext);
  const size = ownSize ?? group?.size ?? "md";
  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset brings a border and a layout of its own
    <div
      data-slot="meter-legend"
      role="group"
      {...props}
      className={cn(meterLegendVariants({ size }), className)}
      data-size={size}
    />
  );
}

export interface MeterLegendItemProps extends Omit<BaseButton.Props, "className"> {
  className?: string | undefined;
  /** The part it picks: the `name` of a Segment. */
  name: string;
  /** The tone of its Segment, so the dot matches; leave it out for a Segment without one. */
  tone?: MeterTone | undefined;
}

/** A button with a dot in its part's color. Pressing it makes the part active; again clears it. */
export function MeterLegendItem({
  name,
  tone,
  className,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ...props
}: MeterLegendItemProps): ReactElement {
  const group = useContext(GroupContext);
  return (
    <BaseButton
      data-slot="meter-legend-item"
      {...props}
      className={cn(meterLegendItemVariants({ tone }), className)}
      aria-pressed={group?.active === name}
      data-tone={tone}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) group?.toggle(name);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType === "mouse") group?.hover(name);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (event.pointerType === "mouse") group?.hover(null);
      }}
    />
  );
}

export interface MeterLegendValueProps extends Omit<ComponentPropsWithRef<"span">, "className"> {
  className?: string | undefined;
}

/** A figure at the end of a legend item, muted and tabular. */
export function MeterLegendValue({ className, ...props }: MeterLegendValueProps): ReactElement {
  return (
    <span
      data-slot="meter-legend-value"
      {...props}
      className={cn(meterSlots.legendValue, className)}
    />
  );
}

export interface MeterIndicatorProps extends Omit<BaseMeter.Indicator.Props, "className"> {
  className?: string | undefined;
}

/** The fill. It moves with a transform, in the tone of the Root. */
export function MeterIndicator({ className, style, ...props }: MeterIndicatorProps): ReactElement {
  // Base UI writes a width and a height inline; leaving them out lets the class size the fill.
  const own = { width: undefined, height: undefined };
  return (
    <BaseMeter.Indicator
      data-slot="meter-indicator"
      {...props}
      className={cn(meterSlots.indicator, className)}
      style={
        typeof style === "function"
          ? (state) => ({ ...own, ...style(state) })
          : { ...own, ...style }
      }
    />
  );
}

export interface MeterTrackProps extends Omit<BaseMeter.Track.Props, "className"> {
  className?: string | undefined;
}

/** The groove. Without children it draws its own Indicator. */
export function MeterTrack({ className, children, ...props }: MeterTrackProps): ReactElement {
  return (
    <BaseMeter.Track data-slot="meter-track" {...props} className={cn(meterSlots.track, className)}>
      {children ?? <MeterIndicator />}
    </BaseMeter.Track>
  );
}

export interface MeterValueProps extends Omit<BaseMeter.Value.Props, "className"> {
  className?: string | undefined;
}

/** The formatted value, in tabular figures. It is hidden from screen readers: Root says it. */
export function MeterValue({ className, ...props }: MeterValueProps): ReactElement {
  return (
    <BaseMeter.Value
      data-slot="meter-value"
      {...props}
      className={cn(meterSlots.value, className)}
    />
  );
}

export interface MeterLabelProps extends Omit<BaseMeter.Label.Props, "className"> {
  className?: string | undefined;
}

/** The name of the meter, at the start of the line above it. */
export function MeterLabel({ className, ...props }: MeterLabelProps): ReactElement {
  return (
    <BaseMeter.Label
      data-slot="meter-label"
      {...props}
      className={cn(meterSlots.label, className)}
    />
  );
}

export interface MeterRootProps extends Omit<BaseMeter.Root.Props, "className">, MeterVariantProps {
  className?: string | undefined;
}

/** How far along the fill is, as a number from 0 to 100 that the fill reads. */
function fillOf(value: number, min: number, max: number): number {
  const percent = ((value - min) / (max - min)) * 100;
  return Number.isNaN(percent) ? 0 : Math.min(100, Math.max(0, percent));
}

/**
 * A value within a range, with the label and value above its bar. Without children it draws its
 * own Track. It needs a name, from a Label or an aria-label. The page picks the tone.
 */
export function MeterRoot({
  size: ownSize,
  tone = "accent",
  className,
  children,
  style,
  ...props
}: MeterRootProps): ReactElement {
  const group = useContext(GroupContext);
  const size = ownSize ?? group?.size ?? "md";
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const range = useMemo(() => ({ min, max }), [min, max]);
  const filled = fillOf(props.value, min, max);
  // Base UI sets the Indicator's width inline; the fill reads this and moves with a transform.
  const fill = {
    "--_value": filled,
  } as CSSProperties;
  return (
    <BaseMeter.Root
      data-slot="meter"
      {...props}
      className={cn(meterVariants({ size, tone }), className)}
      data-size={size}
      data-tone={tone}
      data-full={filled === 100 ? "" : undefined}
      style={
        typeof style === "function"
          ? (state) => ({ ...fill, ...style(state) })
          : { ...fill, ...style }
      }
    >
      <RangeContext.Provider value={range}>{children ?? <MeterTrack />}</RangeContext.Provider>
    </BaseMeter.Root>
  );
}

export declare namespace MeterRoot {
  type Props = MeterRootProps;
  type State = BaseMeter.Root.State;
}

export declare namespace MeterTrack {
  type Props = MeterTrackProps;
  type State = BaseMeter.Track.State;
}

export declare namespace MeterIndicator {
  type Props = MeterIndicatorProps;
  type State = BaseMeter.Indicator.State;
}

export declare namespace MeterValue {
  type Props = MeterValueProps;
  type State = BaseMeter.Value.State;
}

export declare namespace MeterGroup {
  type Props = MeterGroupProps;
}

export declare namespace MeterSegment {
  type Props = MeterSegmentProps;
}

export declare namespace MeterLegend {
  type Props = MeterLegendProps;
}

export declare namespace MeterLegendItem {
  type Props = MeterLegendItemProps;
  type State = BaseButton.State;
}

export declare namespace MeterLegendValue {
  type Props = MeterLegendValueProps;
}

export declare namespace MeterLabel {
  type Props = MeterLabelProps;
  type State = BaseMeter.Label.State;
}
