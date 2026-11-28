// Generated from core/placed.tsx by scripts/build-tailwind.ts; do not edit.
import {
  type ComponentType,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";

/** Whether a Positioner, or for a modal layer a Portal, is around the Popup that reads this. */
const PlacedContext = createContext(false);

/** Wrap a Positioner's (or a modal Portal's) content in this: the Popup in it is placed. */
export function Placed({ children }: { children?: ReactNode }): ReactElement {
  return <PlacedContext value>{children}</PlacedContext>;
}

/** Wrap a Popup's children in this: a popup nested there is not placed by this one's Positioner. */
export function Unplaced({ children }: { children?: ReactNode }): ReactElement {
  return <PlacedContext value={false}>{children}</PlacedContext>;
}

interface PlacementProps {
  portal: ComponentType<{ children?: ReactNode }>;
  /** Left out for a modal layer, whose Portal alone places it. */
  positioner?: ComponentType<{ children?: ReactNode }>;
  children: ReactNode;
}

/** A Popup's frame: as it is inside a Positioner, else in a Portal and Positioner of its own. */
export function Placement({
  portal: Portal,
  positioner: Positioner,
  children,
}: PlacementProps): ReactNode {
  if (useContext(PlacedContext)) return children;
  return <Portal>{Positioner ? <Positioner>{children}</Positioner> : children}</Portal>;
}
