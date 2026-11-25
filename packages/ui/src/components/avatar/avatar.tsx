"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { createContext, type ReactElement, useContext } from "react";
import { cn } from "../../core/cn";
import {
  type AvatarSize,
  type AvatarVariantProps,
  avatarSlots,
  avatarVariants,
} from "./avatar-variants";
import "./avatar.css";

// The size an Avatar.Group gives the avatars in it.
const GroupSize = createContext<AvatarSize | undefined>(undefined);

export interface AvatarImageProps extends Omit<BaseAvatar.Image.Props, "className"> {
  className?: string | undefined;
}

/**
 * The picture. It covers the circle and fades in over the tint once it has loaded: Base UI renders
 * the fallback only while the picture is not loaded, so the fallback is gone by then.
 */
export function AvatarImage({ className, ...props }: AvatarImageProps): ReactElement | null {
  return (
    <BaseAvatar.Image
      data-slot="avatar-image"
      {...props}
      className={cn(avatarSlots.image, className)}
    />
  );
}

export interface AvatarFallbackProps extends Omit<BaseAvatar.Fallback.Props, "className"> {
  className?: string | undefined;
}

/** Initials or an icon, shown until the image has loaded and when there is none. */
export function AvatarFallback({ className, ...props }: AvatarFallbackProps): ReactElement | null {
  return (
    <BaseAvatar.Fallback
      data-slot="avatar-fallback"
      {...props}
      className={cn(avatarSlots.fallback, className)}
    />
  );
}

export interface AvatarRootProps
  extends Omit<BaseAvatar.Root.Props, "className">,
    AvatarVariantProps {
  className?: string | undefined;
}

/** The circle. Put an Image and a Fallback in it; render it as a link to make it focusable. */
export function AvatarRoot({ size: ownSize, className, ...props }: AvatarRootProps): ReactElement {
  const inherited = useContext(GroupSize);
  const size = ownSize ?? inherited ?? "md";
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      {...props}
      className={cn(avatarVariants({ size }), className)}
      data-size={size}
    />
  );
}

export interface AvatarGroupProps extends Omit<useRender.ComponentProps<"div">, "className"> {
  className?: string | undefined;
  /** The size of the avatars in it; an avatar's own `size` wins. */
  size?: AvatarSize | undefined;
}

/** Avatars side by side, each cut out of the one before it. Give it an `aria-label`. */
export function AvatarGroup({
  size,
  className,
  render,
  ref,
  ...props
}: AvatarGroupProps): ReactElement {
  const defaults = {
    "data-slot": "avatar-group",
    role: "group",
    className: cn(avatarSlots.group, className),
    "data-size": size,
  };
  const element = useRender({
    defaultTagName: "div",
    render,
    ref,
    props: mergeProps<"div">(defaults, props),
  });
  return <GroupSize value={size}>{element}</GroupSize>;
}

export declare namespace AvatarRoot {
  type Props = AvatarRootProps;
  type State = BaseAvatar.Root.State;
}

export declare namespace AvatarImage {
  type Props = AvatarImageProps;
  type State = BaseAvatar.Image.State;
}

export declare namespace AvatarFallback {
  type Props = AvatarFallbackProps;
  type State = BaseAvatar.Fallback.State;
}

export declare namespace AvatarGroup {
  type Props = AvatarGroupProps;
}
