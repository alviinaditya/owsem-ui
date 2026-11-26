"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { Toast as BaseToast } from "@base-ui/react/toast";
import {
  type ComponentPropsWithRef,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";
import { cn } from "../../core/cn";
import { Button } from "../button/button";
import { toastSlots } from "./toast-variants";
import "./toast.css";

// Parts without a look of their own come straight from Base UI.

export type ToastProviderProps = BaseToast.Provider.Props;
export type ToastPortalProps = BaseToast.Portal.Props;

/** The types that draw a mark; any other type looks like the default. */
export type ToastType = "success" | "error" | "warning" | "info" | "loading";

/** The toast a Root renders, for the Mark. */
const ToastContext = createContext<BaseToast.Root.ToastObject | null>(null);

/** Whether the part is inside a Positioner, which makes the toast a popup at its anchor. */
const AnchoredContext = createContext(false);

/** Holds the toasts and their timers: put it around the app, once. */
export const ToastProvider: typeof BaseToast.Provider = BaseToast.Provider;
/** Moves the viewport to the end of the body, or into `container`. */
export const ToastPortal: typeof BaseToast.Portal = BaseToast.Portal;
/** Reads the toasts and adds, updates, closes, or tracks a promise with them. */
export const useToastManager: typeof BaseToast.useToastManager = BaseToast.useToastManager;
/** A manager that lives outside React, to add toasts from code; pass it to the Provider. */
export const createToastManager: typeof BaseToast.createToastManager = BaseToast.createToastManager;

export interface ToastViewportProps extends Omit<BaseToast.Viewport.Props, "className"> {
  className?: string | undefined;
}

/**
 * The region that holds the stack, at the bottom end of the window (bottom right, bottom left
 * in RTL); F6 moves focus to it. Left without children it draws every toast: its title, its
 * description, an action when the toast has `actionProps`, and a close button. Write the
 * children to draw them your way. It takes the text direction from DirectionProvider, since the
 * portal leaves the subtree that sets `dir`.
 */
export function ToastViewport({
  className,
  children,
  ref,
  ...props
}: ToastViewportProps): ReactElement {
  const direction = useDirection();
  return (
    <BaseToast.Viewport
      data-slot="toast-viewport"
      dir={direction}
      {...props}
      ref={ref}
      className={cn(toastSlots.viewport, className)}
    >
      {children ?? <ToastList />}
    </BaseToast.Viewport>
  );
}

/** Every toast of the manager, newest first, anchored ones at their anchor. */
function ToastList(): ReactElement {
  const { toasts } = BaseToast.useToastManager();
  return (
    <>
      {toasts.map((toast) =>
        toast.positionerProps ? (
          <ToastPositioner key={toast.id} toast={toast}>
            <ToastRoot toast={toast}>
              <ToastArrow />
              <ToastBody />
            </ToastRoot>
          </ToastPositioner>
        ) : (
          <ToastRoot key={toast.id} toast={toast} />
        ),
      )}
    </>
  );
}

/** What a toast holds when its Root has no children. */
function ToastBody(): ReactElement {
  return (
    <ToastContent>
      <ToastMark />
      <div data-slot="toast-text" className={toastSlots.text}>
        <ToastTitle />
        <ToastDescription />
        <ToastAction />
      </div>
      <ToastClose />
    </ToastContent>
  );
}

export interface ToastRootProps extends Omit<BaseToast.Root.Props, "className"> {
  className?: string | undefined;
}

/**
 * One toast: a raised card with the popup shadow, newest in front, the older ones peeking behind
 * it. The stack opens into a list on hover or focus. It slides in from the edge, follows a
 * swipe, and leaves in the swipe's direction; by default it is swiped down or toward the end
 * (right, or left in RTL). Without children it draws its mark, title, description, action, and
 * close button.
 */
export function ToastRoot({
  className,
  children,
  toast,
  swipeDirection,
  ref,
  ...props
}: ToastRootProps): ReactElement {
  const direction = useDirection();
  const anchored = useContext(AnchoredContext);
  return (
    <ToastContext.Provider value={toast}>
      <BaseToast.Root
        data-slot="toast"
        {...props}
        ref={ref}
        toast={toast}
        swipeDirection={swipeDirection ?? ["down", direction === "rtl" ? "left" : "right"]}
        data-anchored={anchored ? "" : undefined}
        className={cn(toastSlots.root, className)}
      >
        {children ?? <ToastBody />}
      </BaseToast.Root>
    </ToastContext.Provider>
  );
}

export interface ToastContentProps extends Omit<BaseToast.Content.Props, "className"> {
  className?: string | undefined;
}

/** The toast's inside. It is hidden while the toast is behind another one in a closed stack. */
export function ToastContent({ className, ...props }: ToastContentProps): ReactElement {
  return (
    <BaseToast.Content
      data-slot="toast-content"
      {...props}
      className={cn(toastSlots.content, className)}
    />
  );
}

const MARKS: Record<ToastType, ReactNode> = {
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16.2 9.5" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.9v.1" />
    </>
  ),
  loading: (
    <>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </>
  ),
};

export interface ToastMarkProps extends ComponentPropsWithRef<"span"> {
  className?: string | undefined;
}

/**
 * A small mark for the toast's `type` (success, error, warning, info, or loading) in its tone;
 * loading is a quiet spinner. Any other type draws nothing. Read out by the title, not by itself.
 */
export function ToastMark({ className, ref, ...props }: ToastMarkProps): ReactElement | null {
  const type = useContext(ToastContext)?.type;
  if (!type || !Object.hasOwn(MARKS, type)) return null;
  return (
    <span
      data-slot="toast-mark"
      aria-hidden="true"
      {...props}
      ref={ref}
      className={cn(toastSlots.mark, className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {MARKS[type as ToastType]}
      </svg>
    </span>
  );
}

export interface ToastTitleProps extends Omit<BaseToast.Title.Props, "className"> {
  className?: string | undefined;
}

/** The toast's title; without children it shows the toast's `title`. */
export function ToastTitle({ className, ...props }: ToastTitleProps): ReactElement {
  return (
    <BaseToast.Title
      data-slot="toast-title"
      {...props}
      className={cn(toastSlots.title, className)}
    />
  );
}

export interface ToastDescriptionProps extends Omit<BaseToast.Description.Props, "className"> {
  className?: string | undefined;
}

/** A muted line under the title; without children it shows the toast's `description`. */
export function ToastDescription({ className, ...props }: ToastDescriptionProps): ReactElement {
  return (
    <BaseToast.Description
      data-slot="toast-description"
      {...props}
      className={cn(toastSlots.description, className)}
    />
  );
}

export interface ToastActionProps extends Omit<BaseToast.Action.Props, "className"> {
  className?: string | undefined;
}

/**
 * The toast's action, a small Button; it shows only when the toast has `actionProps`, whose
 * `children` are its label. Pass your own button to `render` to change it.
 */
export function ToastAction({
  className,
  render = <Button variant="secondary" size="sm" />,
  ...props
}: ToastActionProps): ReactElement {
  return (
    <BaseToast.Action
      data-slot="toast-action"
      {...props}
      render={render}
      className={cn(toastSlots.action, className)}
    />
  );
}

export interface ToastCloseProps extends Omit<BaseToast.Close.Props, "className"> {
  className?: string | undefined;
}

/**
 * A small quiet button in the end corner that dismisses the toast. It draws a cross, and its
 * label is "Close": set `aria-label` to translate it.
 */
export function ToastClose({
  className,
  children,
  "aria-label": label = "Close",
  ...props
}: ToastCloseProps): ReactElement {
  return (
    <BaseToast.Close
      data-slot="toast-close"
      {...props}
      aria-label={label}
      className={cn(toastSlots.close, className)}
    >
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )}
    </BaseToast.Close>
  );
}

export interface ToastPositionerProps extends Omit<BaseToast.Positioner.Props, "className"> {
  className?: string | undefined;
}

/**
 * Anchors a toast to an element, for a toast added with `positionerProps: { anchor }`: it then
 * looks like a Popover and leaves the stack. It sits 10px from the anchor, room for the arrow,
 * and keeps the arrow off the rounded corners. Give an anchored toast its own Provider.
 */
export function ToastPositioner({
  className,
  children,
  sideOffset = 10,
  arrowPadding = 12,
  ref,
  ...props
}: ToastPositionerProps): ReactElement {
  const direction = useDirection();
  return (
    <BaseToast.Positioner
      data-slot="toast-positioner"
      dir={direction}
      {...props}
      ref={ref}
      className={cn(toastSlots.positioner, className)}
      sideOffset={sideOffset}
      arrowPadding={arrowPadding}
    >
      <AnchoredContext.Provider value>{children}</AnchoredContext.Provider>
    </BaseToast.Positioner>
  );
}

export interface ToastArrowProps extends Omit<BaseToast.Arrow.Props, "className"> {
  className?: string | undefined;
}

/** An arrow toward the anchor, with the toast's edge; place it first inside the Root. */
export function ToastArrow({ className, ...props }: ToastArrowProps): ReactElement {
  return (
    <BaseToast.Arrow
      data-slot="toast-arrow"
      {...props}
      className={cn(toastSlots.arrow, className)}
    />
  );
}
