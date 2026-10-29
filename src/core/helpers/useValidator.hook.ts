// src/core/helpers/useValidator.hook.ts - Zod-backed form validation for controlled state (docs/form-validation.md)
import { useCallback, useState } from "react";
import type { z } from "zod";

type Errors<T> = Partial<Record<keyof T | "root", string>>;

/** First message per top-level field; a form-level refine without a path lands on "root" */
function collectErrors<T>(error: z.ZodError): Errors<T> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "root");
    errors[field] ??= issue.message;
  }
  return errors as Errors<T>;
}

/**
 * `store` is the form's controlled state (the schema's input type); `validate`'s callback gets the parsed output
 * (trimmed strings, empty fields dropped), which is what goes to the mutation.
 */
export function useValidator<S extends z.ZodType>({ schema, store }: { schema: S; store: z.input<S> }) {
  type Input = z.input<S>;
  const [errors, setErrors] = useState<Errors<Input>>({});

  /** On submit: shows every error at once; runs `callback` and returns true only when the form is valid */
  const validate = useCallback(
    (callback?: (data: z.output<S>) => void) => {
      const result = schema.safeParse(store);
      if (!result.success) {
        setErrors(collectErrors<Input>(result.error));
        return false;
      }
      setErrors({});
      callback?.(result.data);
      return true;
    },
    [schema, store],
  );

  /** On change: updates only this field's error (and a form-level one), so it clears as soon as the value is valid */
  const revalidate = useCallback(
    (field: keyof Input, value: unknown) => {
      const result = schema.safeParse({ ...(store as object), [field]: value });
      const next: Errors<Input> = result.success ? {} : collectErrors<Input>(result.error);
      setErrors((prev) => ({ ...prev, [field]: next[field], root: prev.root && next.root }));
    },
    [schema, store],
  );

  return { validate, revalidate, errors };
}
