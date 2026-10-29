// src/core/services/observers.service.ts - Observer onboarding: roster import, codes, revocation, polling-unit assignments
import type {
  AdminObserver,
  AdminObserverDetail,
  AssignmentRow,
  ImportAssignmentsResult,
  IssuedCode,
  ObserverListParams,
  RosterRow,
} from "@/lib/types";
import { http } from "../helpers/axios.helper";

const path = (ref: string) => `/admin/observers/${encodeURIComponent(ref)}`;

/** By ref. `status` filters by device state or "unassigned"; `q` matches ref or CSO */
export const listObservers = (params: ObserverListParams, signal?: AbortSignal) =>
  http.get<AdminObserver[]>("/admin/observers", { params, signal }).then((r) => r.data);

export const getObserver = (ref: string, signal?: AbortSignal) => http.get<AdminObserverDetail>(path(ref), { signal }).then((r) => r.data);

/** All or nothing. Returns each observer's code, once: an existing ref gets a new code and its old one stops working */
export const importRoster = (observers: RosterRow[]) => http.post<IssuedCode[]>("/admin/observers/import", { observers }).then((r) => r.data);

/** A replacement phone: a fresh code, once. The previous code stops working */
export const reissueCode = (ref: string) => http.post<IssuedCode>(`${path(ref)}/code`).then((r) => r.data);

/** A lost phone: cuts off the device key and voids any unused code */
export const revokeObserver = (ref: string) => http.post<void>(`${path(ref)}/revoke`).then(() => undefined);

export const assignPollingUnit = (ref: string, puCode: string) =>
  http.post<void>(`${path(ref)}/assignments`, { pu_code: puCode }).then(() => undefined);

export const unassignPollingUnit = (ref: string, puCode: string) =>
  http.delete<void>(`${path(ref)}/assignments/${encodeURIComponent(puCode)}`).then(() => undefined);

/** All or nothing; rows already assigned are skipped */
export const importAssignments = (assignments: AssignmentRow[]) =>
  http.post<ImportAssignmentsResult>("/admin/assignments/import", { assignments }).then((r) => r.data);
