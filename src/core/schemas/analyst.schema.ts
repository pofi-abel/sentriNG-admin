// src/core/schemas/analyst.schema.ts - A new desk analyst. No password field: the API generates one and returns it once
import { z } from "zod";

export const CreateAnalystSchema = z.object({
  name: z.string().trim().min(1, "Enter the analyst's name").max(100, "Keep the name under 100 characters"),
  email: z.string().trim().min(1, "Enter their email address").pipe(z.email("Enter a valid email address")),
});

export type CreateAnalyst = z.infer<typeof CreateAnalystSchema>;
