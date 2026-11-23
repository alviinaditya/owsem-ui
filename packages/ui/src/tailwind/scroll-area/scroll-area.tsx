// Generated from components/scroll-area by scripts/build-tailwind.ts; do not edit.
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { scrollAreaSlots } from "./scroll-area-variants";

// No "use client" in this file: Root and Viewport compare their children with the parts below, and
// a client boundary would hide those from them in a Server Component's children.
const hasPart = (children: ReactNode, part: unknown) =>
  Children.toArray(children).some((child) => isValidElement(child) && child.type === part);

export interface ScrollAreaContentProps extends Omit<BaseScrollArea.Content.Props, "className"> {
  className?: string | undefined;
}

/** Holds the content, and tells Base UI when its size changes. */
export function ScrollAreaContent({ className, ...props }: ScrollAreaContentProps): ReactElement {
  return (
    <BaseScrollArea.Content
      data-slot="scroll-area-content"
      {...props}
      className={cn(scrollAreaSlots.content, className)}
    />
  );
}

export interface ScrollAreaViewportProps extends Omit<BaseScrollArea.Viewport.Props, "className"> {
  className?: string | undefined;
}

/** The element that scrolls; its native scrollbars are hidden. Draws Content if you leave it out. */
export function ScrollAreaViewport({
  className,
  children,
  ...props
}: ScrollAreaViewportProps): ReactElement {
  return (
    <BaseScrollArea.Viewport
      data-slot="scroll-area-viewport"
      {...props}
      className={cn(scrollAreaSlots.viewport, className)}
    >
      {hasPart(children, ScrollAreaContent) ? (
        children
      ) : (
        <ScrollAreaContent>{children}</ScrollAreaContent>
      )}
    </BaseScrollArea.Viewport>
  );
}

export interface ScrollAreaThumbProps extends Omit<BaseScrollArea.Thumb.Props, "className"> {
  className?: string | undefined;
}

/** A pill that shows the position, with a press area of at least 24px each way. */
export function ScrollAreaThumb({ className, ...props }: ScrollAreaThumbProps): ReactElement {
  return (
    <BaseScrollArea.Thumb
      data-slot="scroll-area-thumb"
      {...props}
      className={cn(scrollAreaSlots.thumb, className)}
    />
  );
}

export interface ScrollAreaScrollbarProps
  extends Omit<BaseScrollArea.Scrollbar.Props, "className"> {
  className?: string | undefined;
}

/** Floats over the content, so it takes no room; shown on hover and while scrolling. Draws Thumb. */
export function ScrollAreaScrollbar({
  className,
  children,
  ...props
}: ScrollAreaScrollbarProps): ReactElement {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      {...props}
      className={cn(scrollAreaSlots.scrollbar, className)}
    >
      {children ?? <ScrollAreaThumb />}
    </BaseScrollArea.Scrollbar>
  );
}

export interface ScrollAreaCornerProps extends Omit<BaseScrollArea.Corner.Props, "className"> {
  className?: string | undefined;
}

/** The square where two scrollbars meet, which keeps them apart. Empty by default. */
export function ScrollAreaCorner({ className, ...props }: ScrollAreaCornerProps): ReactElement {
  return (
    <BaseScrollArea.Corner
      data-slot="scroll-area-corner"
      {...props}
      className={cn(scrollAreaSlots.corner, className)}
    />
  );
}

export interface ScrollAreaRootProps extends Omit<BaseScrollArea.Root.Props, "className"> {
  className?: string | undefined;
  /** Fades an edge while there is more to scroll that way; `--fade-size` sets how far. */
  fade?: boolean;
}

/**
 * Sized by your CSS. With only content inside, it draws the other parts for both axes. With a
 * Viewport among its direct children, those children are the parts, as in Base UI.
 */
export function ScrollAreaRoot({
  className,
  fade,
  children,
  ...props
}: ScrollAreaRootProps): ReactElement {
  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      data-fade={fade ? "" : undefined}
      {...props}
      className={cn(scrollAreaSlots.root, className)}
    >
      {hasPart(children, ScrollAreaViewport) ? (
        children
      ) : (
        <>
          <ScrollAreaViewport>{children}</ScrollAreaViewport>
          <ScrollAreaScrollbar />
          <ScrollAreaScrollbar orientation="horizontal" />
          <ScrollAreaCorner />
        </>
      )}
    </BaseScrollArea.Root>
  );
}
