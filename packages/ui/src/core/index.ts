// Re-exported so apps share OwsemUI's Base UI copy (React context does not cross copies).
export { CSPProvider } from "@base-ui/react/csp-provider";
export { DirectionProvider, useDirection } from "@base-ui/react/direction-provider";
export {
  ACTIVE_ATTR as GLIDE_ACTIVE_ATTR,
  createGlide,
  type Glide,
  type GlideAxis,
  type GlideOptions,
} from "./glide/glide";
export { GlideHighlight, type UseGlide, useGlide } from "./glide/use-glide";
