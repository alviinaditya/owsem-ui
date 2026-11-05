import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import {
  Children,
  type ForwardRefExoticComponent,
  forwardRef,
  isValidElement,
  type ReactNode,
  type RefAttributes,
} from "react";
import { withClassName } from "../../core/class-name";
import "./scroll-area.css";

const cls = {
  root: "ow-scroll-area",
  viewport: "ow-scroll-area__viewport",
  content: "ow-scroll-area__content",
  scrollbar: "ow-scroll-area__scrollbar",
  thumb: "ow-scroll-area__thumb",
  corner: "ow-scroll-area__corner",
} as const;

// No "use client" in this file: Root and Viewport compare their children with the parts below, and
// a client boundary would hide those from them in a Server Component's children.
const hasPart = (children: ReactNode, part: unknown) =>
  Children.toArray(children).some((child) => isValidElement(child) && child.type === part);

export type ScrollAreaContentProps = Omit<BaseScrollArea.Content.Props, "ref">;

/** Holds the content, and tells Base UI when its size changes. */
export const ScrollAreaContent: ForwardRefExoticComponent<
  ScrollAreaContentProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaContentProps>(function ScrollAreaContent(
  { className, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Content
      ref={ref}
      className={withClassName(cls.content, className)}
      {...props}
    />
  );
});

export type ScrollAreaViewportProps = Omit<BaseScrollArea.Viewport.Props, "ref">;

/** The element that scrolls; its native scrollbars are hidden. Draws Content if you leave it out. */
export const ScrollAreaViewport: ForwardRefExoticComponent<
  ScrollAreaViewportProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaViewportProps>(function ScrollAreaViewport(
  { className, children, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Viewport
      ref={ref}
      className={withClassName(cls.viewport, className)}
      {...props}
    >
      {hasPart(children, ScrollAreaContent) ? (
        children
      ) : (
        <ScrollAreaContent>{children}</ScrollAreaContent>
      )}
    </BaseScrollArea.Viewport>
  );
});

export type ScrollAreaThumbProps = Omit<BaseScrollArea.Thumb.Props, "ref">;

/** A pill that shows the position, with a press area of at least 24px each way (FR-14). */
export const ScrollAreaThumb: ForwardRefExoticComponent<
  ScrollAreaThumbProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaThumbProps>(function ScrollAreaThumb(
  { className, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Thumb ref={ref} className={withClassName(cls.thumb, className)} {...props} />
  );
});

export type ScrollAreaScrollbarProps = Omit<BaseScrollArea.Scrollbar.Props, "ref">;

/** Floats over the content, so it takes no room; shown on hover and while scrolling. Draws Thumb. */
export const ScrollAreaScrollbar: ForwardRefExoticComponent<
  ScrollAreaScrollbarProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(function ScrollAreaScrollbar(
  { className, children, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Scrollbar
      ref={ref}
      className={withClassName(cls.scrollbar, className)}
      {...props}
    >
      {children ?? <ScrollAreaThumb />}
    </BaseScrollArea.Scrollbar>
  );
});

export type ScrollAreaCornerProps = Omit<BaseScrollArea.Corner.Props, "ref">;

/** The square where two scrollbars meet, which keeps them apart. Empty by default. */
export const ScrollAreaCorner: ForwardRefExoticComponent<
  ScrollAreaCornerProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaCornerProps>(function ScrollAreaCorner(
  { className, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Corner ref={ref} className={withClassName(cls.corner, className)} {...props} />
  );
});

export type ScrollAreaRootProps = Omit<BaseScrollArea.Root.Props, "ref"> & {
  /** Fades an edge while there is more to scroll that way; `--fade-size` sets how far. */
  fade?: boolean;
};

/**
 * Sized by your CSS. With only content inside, it draws the other parts for both axes. With a
 * Viewport among its direct children, those children are the parts, as in Base UI.
 */
export const ScrollAreaRoot: ForwardRefExoticComponent<
  ScrollAreaRootProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, ScrollAreaRootProps>(function ScrollAreaRoot(
  { className, fade, children, ...props },
  ref,
) {
  return (
    <BaseScrollArea.Root
      ref={ref}
      className={withClassName(cls.root, className)}
      data-fade={fade ? "" : undefined}
      {...props}
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
});
