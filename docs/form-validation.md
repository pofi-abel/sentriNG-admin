# Form Validation Guidelines

This project uses a **custom `useValidator` hook** backed by **Zod schemas** for all form validation. The approach deliberately avoids heavy form libraries (e.g., React Hook Form) in favour of a lightweight, controlled-input pattern that integrates naturally with our Redux slice-driven form state.

---

## The Three-Part Pattern

Every form in this project is built from three distinct parts working together:

### Part 1: The Zod Schema
**Location:** `src/core/schemas/*.schema.ts`

The schema is the **single source of truth** for what a valid form payload looks like. It is entirely decoupled from the UI.

**Rules:**
- Group all schemas for a domain into one file (e.g., `fraud.schema.ts`, `role.schema.ts`).
- Always export both the **schema** and the inferred **TypeScript type** from the same file.
- Use descriptive Zod error messages so they can be rendered directly in the UI without transformation.
- For nested/complex objects, define sub-schemas as private `const`s in the same file and compose them into the exported schema.

```typescript
// src/core/schemas/role.schema.ts
import { z } from "zod";

// Private sub-schema — not exported
const PermissionSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  actions: z.array(z.string()).min(1, "At least one action is required"),
});

// Public schema
export const CreateRoleSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  roleCode: z.string().optional(),
  permissions: z.array(PermissionSchema).min(1, "At least one permission is required"),
  menuComponents: z.array(MenuComponentSchema).optional(),
});

// Always export the inferred type alongside the schema
export type CreateRole = z.infer<typeof CreateRoleSchema>;
```

---

### Part 2: The `useValidator` Hook
**Location:** `src/core/helpers/useValidator.hook.ts`

This hook accepts the current form `store` (state object) and a `schema`, and returns three things:

| Return value | Purpose |
|---|---|
| `validate(callback?)` | Runs a full schema parse. Populates all errors at once. If valid, executes the optional `callback` and returns `true`. |
| `revalidate(field, value)` | Runs a targeted parse for a **single field** on every keystroke. Clears the field's error as soon as it becomes valid, giving instant positive feedback. |
| `errors` | A `Partial<Record<keyof T, string>>` object mapping field names to their error messages. |

```typescript
const { validate, revalidate, errors } = useValidator({
  schema: CreateRoleSchema,
  store: formData, // your controlled state object
});
```

**Key behaviours:**
- `validate()` is called **on submit**. It runs the full parse, populates all field errors simultaneously, and blocks submission if invalid.
- `revalidate(field, value)` is called **on change** for each field. It only updates the error for the affected field, providing non-intrusive, real-time feedback.
- `validate(callback)` — passing a callback is the standard pattern: the callback only fires if validation passes. This removes the need for an `if` check at the call site.

---

### Part 3: The Form Component
**Location:** `src/components/**/*.tsx`

The form component wires everything together. It manages a local (or Redux) state object as the form store, passes it to the hook, and pipes `errors.*` down to individual input fields.

**Standard wiring pattern:**

```tsx
import { useState } from "react";
import { useValidator } from "#/core/helpers/useValidator.hook";
import { CreateRoleSchema, type CreateRole } from "#/core/schemas/role.schema";
import { useCreateRoleMutation } from "#/core/queries/roles.q";

function CreateRoleForm() {
  const [form, setForm] = useState<CreateRole>({
    roleName: "",
    permissions: [],
  });

  const { mutateAsync: createRole, isPending } = useCreateRoleMutation({
    onSuccessCallback: () => toast.success("Role created!"),
  });

  // 1. Initialise the hook with the live form state and the schema
  const { validate, revalidate, errors } = useValidator({
    schema: CreateRoleSchema,
    store: form,
  });

  // 2. Revalidate a single field on every change
  const handleChange = (field: keyof CreateRole, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    revalidate(field, value);
  };

  // 3. Validate everything on submit — callback only fires if valid
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validate(() => createRole(form));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        placeholder="Role Name"
        value={form.roleName}
        onChange={(e) => handleChange("roleName", e.target.value)}
        error={errors.roleName}   // <-- pipe the error string directly to the input
      />
      <Button loading={isPending}>Create Role</Button>
    </form>
  );
}
```

---

## Complete Flow Diagram

```
User types in a field
        │
        ▼
   handleChange(field, value)
        │
        ├── setForm(...)         — updates controlled state
        └── revalidate(...)      — silently clears field error if now valid

User clicks Submit
        │
        ▼
   validate(callback)
        │
        ├── [FAIL] setErrors({ field: "message", ... })  — all errors shown at once
        └── [PASS] callback()   — executes the mutation / API call
```

---

## Rules & Conventions

1. **One schema per domain file.** Do not define schemas inline inside components.
2. **Always export the inferred type.** Every schema export (`XyzSchema`) must have a corresponding type export (`type Xyz = z.infer<typeof XyzSchema>`).
3. **Compose, don't duplicate.** Shared sub-schemas (e.g., `PermissionSchema`) should be defined once in the domain file and reused across `CreateXyzSchema` / `UpdateXyzSchema`.
4. **`validate` on submit, `revalidate` on change.** Never call `validate` on every keystroke (it shows all errors at once which is jarring); reserve it for the submission event.
5. **Error messages live in the schema.** Do not hardcode error strings in the UI. The schema's `.min(1, "Role name is required")` message is what the user will see.

---

## How the admin console applies this

- **Form state** is local `useState` (no Redux). The import alias is `@/`, not `#/`.
- **`validate(callback)` passes the parsed output** to the callback: trimmed strings, empty optional fields dropped.
  Send that to the mutation, not the raw `form`. The store is typed as the schema's input (`z.input`).
- **Form-level rules** (`.refine` without a path, like "exactly one escalation target") come back as `errors.root`.
- **`<Field>`** (`src/components/ui/field.tsx`) renders the label, the control and the schema's error line.
- **Server errors** (400 / 409 / 422 `{ error }`) are shown beside the form from the mutation's `error`. They are
  answers about state the schema can't know (a duplicate ticket, a decision someone else already made).
