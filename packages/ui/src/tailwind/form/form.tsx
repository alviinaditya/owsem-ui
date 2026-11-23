// Generated from components/form by scripts/build-tailwind.ts; do not edit.
"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import type { ReactElement } from "react";
import { cn } from "../lib/cn";
import { ARMED_ATTR, INVALID } from "../lib/shake";
import { formSlots } from "./form-variants";

// Base UI's constraint on the form values.
// biome-ignore lint/suspicious/noExplicitAny: matches Base UI
type FormValues = Record<string, any>;

export interface FormProps<Values extends FormValues = FormValues>
  extends Omit<BaseForm.Props<Values>, "className"> {
  className?: string | undefined;
}

/**
 * A submit that leaves a field invalid shakes the first one again. A field shakes by CSS when it
 * becomes invalid, so one that already is invalid (even from the start) gets its animation
 * restarted: data-shake="off" stops it, a reflow commits that, and removing the attribute plays it
 * from the start.
 */
function shakeFirstInvalid(form: HTMLFormElement) {
  for (const el of form.querySelectorAll<HTMLElement>(INVALID)) {
    // A field invalid from the start was never armed; a submit arms it.
    const armed = el.hasAttribute(ARMED_ATTR);
    el.setAttribute(ARMED_ATTR, "");
    if (getComputedStyle(el).animationName === "none") {
      if (!armed) el.removeAttribute(ARMED_ATTR);
      continue;
    }
    el.setAttribute("data-shake", "off");
    void el.offsetWidth;
    el.removeAttribute("data-shake");
    return;
  }
}

/**
 * A native form with Base UI's validation: it checks its fields, takes server errors through
 * `errors`, and focuses the first invalid field. It draws only the gap between them.
 */
export function Form<Values extends FormValues = FormValues>({
  className,
  onSubmitCapture,
  ...props
}: FormProps<Values>): ReactElement {
  return (
    <BaseForm
      data-slot="form"
      {...props}
      className={cn(formSlots.root, className)}
      // Base UI validates in its own submit handler; after it, the invalid fields show.
      onSubmitCapture={(event) => {
        onSubmitCapture?.(event);
        const form = event.currentTarget;
        requestAnimationFrame(() => shakeFirstInvalid(form));
      }}
    />
  );
}

export declare namespace Form {
  type Props<Values extends FormValues = FormValues> = FormProps<Values>;
  type State = BaseForm.State;
  type Actions = BaseForm.Actions;
  type ValidationMode = BaseForm.ValidationMode;
  type SubmitEventDetails = BaseForm.SubmitEventDetails;
}
