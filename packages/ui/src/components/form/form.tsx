"use client";

import { Form as BaseForm } from "@base-ui/react/form";
import { forwardRef } from "react";
import { withClassName } from "../../core/class-name";
import "./form.css";

const cls = { root: "ow-form" } as const;

type Props = Omit<BaseForm.Props, "ref">;

/**
 * A native form with Base UI's validation: it checks its fields, takes server errors through
 * `errors`, and focuses the first invalid field. It draws only the gap between them.
 */
// forwardRef keeps refs working on React 18; the cast keeps Base UI's generic form values.
export const Form: typeof BaseForm = forwardRef<HTMLFormElement, Props>(function Form(
  { className, ...props },
  ref,
) {
  return <BaseForm ref={ref} className={withClassName(cls.root, className)} {...props} />;
}) as typeof BaseForm;

export declare namespace Form {
  type Props<Values extends Record<string, unknown> = Record<string, unknown>> =
    BaseForm.Props<Values>;
  type State = BaseForm.State;
  type Actions = BaseForm.Actions;
  type ValidationMode = BaseForm.ValidationMode;
  type SubmitEventDetails = BaseForm.SubmitEventDetails;
}
