"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import { forwardRef } from "react";
import { withClassName } from "../../core/class-name";
import { ARMED_ATTR, INVALID } from "../../core/shake";
import "./form.css";

const cls = { root: "ow-form" } as const;

type Props = Omit<BaseForm.Props, "ref">;

/**
 * A submit that leaves a field invalid shakes the first one again. A field shakes by CSS when it
 * becomes invalid, so one that already is invalid (even from the start) gets its animation restarted: data-shake="off"
 * stops it, a reflow commits that, and removing the attribute plays it from the start.
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
// forwardRef keeps refs working on React 18; the cast keeps Base UI's generic form values.
export const Form: typeof BaseForm = forwardRef<HTMLFormElement, Props>(function Form(
  { className, onSubmitCapture, ...props },
  ref,
) {
  return (
    <BaseForm
      ref={ref}
      className={withClassName(cls.root, className)}
      // Base UI validates in its own submit handler; after it, the invalid fields show.
      onSubmitCapture={(event) => {
        onSubmitCapture?.(event);
        const form = event.currentTarget;
        requestAnimationFrame(() => shakeFirstInvalid(form));
      }}
      {...props}
    />
  );
}) as typeof BaseForm;

export declare namespace Form {
  type Props<Values extends Record<string, unknown> = Record<string, unknown>> =
    BaseForm.Props<Values>;
  type State = BaseForm.State;
  type Actions = BaseForm.Actions;
  type ValidationMode = BaseForm.ValidationMode;
  type SubmitEventDetails = BaseForm.SubmitEventDetails;
}
