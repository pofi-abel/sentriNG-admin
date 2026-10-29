// src/core/services/reference.service.ts - Reference data: CSV imports with a dry run, elections and their states
import type { Election, ReferenceImportResult, ReferenceKind, State } from "@/lib/types";
import { http } from "../helpers/axios.helper";

/** The body is the CSV itself. dryRun: report what would change and change nothing. 400: the file's problem, by line */
export const importReference = ({ kind, csv, dryRun }: { kind: ReferenceKind; csv: string; dryRun: boolean }) =>
  http
    .post<ReferenceImportResult>(`/admin/reference/${kind}`, csv, { params: dryRun ? { dry_run: true } : undefined, headers: { "Content-Type": "text/csv" } })
    .then((r) => r.data);

/** Newest first, never cached (unlike the public list) so an edit shows at once */
export const listElections = (signal?: AbortSignal) => http.get<Election[]>("/admin/elections", { signal }).then((r) => r.data);

export const listStates = (signal?: AbortSignal) => http.get<State[]>("/admin/states", { signal }).then((r) => r.data);

/** 409: an election for this race on this date exists. 400: an unknown state code */
export const createElection = (body: { name: string; race: string; held_on: string; state_codes: string[] }) =>
  http.post<{ id: number }>("/admin/elections", body).then((r) => r.data);

/** Name and states only: race and date are the election's identity */
export const updateElection = ({ id, ...body }: { id: number; name?: string; state_codes?: string[] }) =>
  http.patch<void>(`/admin/elections/${id}`, body).then(() => undefined);
