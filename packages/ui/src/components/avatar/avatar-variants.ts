// No "use client": an Avatar's classes can be used from Server Components.
import { cn } from "../../core/cn";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarVariantProps {
  /** 32, 40, or 48 px, the heights of Button. Inside an Avatar.Group, the group's. @default "md" */
  size?: AvatarSize | undefined;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: "ow-avatar--sm",
  md: "ow-avatar--md",
  lg: "ow-avatar--lg",
};

/** The root's classes. */
export function avatarVariants({ size = "md" }: AvatarVariantProps = {}): string {
  return cn("ow-avatar", sizeClass[size]);
}

/** The classes of the inner parts. */
export const avatarSlots = {
  image: "ow-avatar__image",
  fallback: "ow-avatar__fallback",
  group: "ow-avatar__group",
} as const;
