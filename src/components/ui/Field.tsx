import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import styles from "./Field.module.css";

/*
 * Form field frame (DESIGN.md §4.9): label above (Estedad 600), optional hint, the control, then
 * the error (icon + words, role="alert") — never colour alone. Hint and error are linked to the
 * control through aria-describedby. Pass a render function to receive the wiring props:
 *
 *   <Field id="phone" label="شمارهٔ موبایل" hint="…" error={err}>
 *     {(control) => <TextInput {...control} numeric autoComplete="tel" />}
 *   </Field>
 */

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
};

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Adds «(اختیاری)» after the label. */
  optional?: boolean;
  className?: string;
  children: ReactNode | ((control: FieldControlProps) => ReactNode);
};

export function fieldControlProps(id: string, { hint, error, required }: { hint?: ReactNode; error?: ReactNode; required?: boolean }): FieldControlProps {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : undefined,
    required: required || undefined,
  };
}

export function Field({ id, label, hint, error, required, optional, className, children }: FieldProps) {
  const control = fieldControlProps(id, { hint, error, required });
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ms-1 font-normal text-muted">(اختیاری)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {typeof children === "function" ? children(control) : children}
      {error ? (
        <p id={`${id}-error`} role="alert" className={cn("flex items-start gap-1.5 text-sm text-danger", styles.error)}>
          <Icon name="warning" className="mt-0.5 size-[1.15em]" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
