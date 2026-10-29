// src/core/schemas/election.schema.ts - An election and where it's held. No states ticked = nationwide
import { z } from "zod";
import { RACES } from "@/lib/types";

export const ElectionSchema = z.object({
  name: z.string().trim().min(1, "Name the election, e.g. 2027 Presidential").max(200, "Keep the name under 200 characters"),
  race: z.string().pipe(z.enum(RACES, "Choose the race")), // the form starts empty
  held_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the election date"),
  state_codes: z.array(z.string()),
});

export type ElectionForm = z.infer<typeof ElectionSchema>;
