// No "use client" here: the namespace object must be readable from Server Components (FR-5).

export type {
  ScrollAreaContentProps,
  ScrollAreaCornerProps,
  ScrollAreaRootProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaViewportProps,
} from "./scroll-area";
export {
  ScrollAreaContent as Content,
  ScrollAreaCorner as Corner,
  ScrollAreaRoot as Root,
  ScrollAreaScrollbar as Scrollbar,
  ScrollAreaThumb as Thumb,
  ScrollAreaViewport as Viewport,
} from "./scroll-area";
