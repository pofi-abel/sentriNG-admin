// src/lib/types.ts - JSON shapes of the SentriNG API /v1/admin endpoints (from the Go models in models/admin.model.go;
// they win over the docs). Lists are bare arrays, errors are { error }, times are RFC3339 strings, nullable fields are
// always present.

export interface LoginResponse {
  token: string;
  expires_at: string;
  analyst_id: number;
}

export interface Analyst {
  id: number;
  name: string;
  email: string;
}

// --- Observers -----------------------------------------------------------------------------------------------------

/** The list's ?status= filter. "unassigned" is about polling units, the rest about the device */
export const OBSERVER_FILTERS = ["pending", "enrolled", "revoked", "expired", "unassigned"] as const;
export type ObserverFilter = (typeof OBSERVER_FILTERS)[number];

export interface AdminObserver {
  ref: string;
  cso: string | null;
  enrolled_at: string | null;
  revoked_at: string | null;
  /** When the unused code runs out; null once it has been used, voided by a revoke, or never issued */
  code_expires_at: string | null;
  assigned_pu_count: number;
  created_at: string;
}

export interface AssignedPollingUnit {
  code: string;
  name: string;
  ward_name: string;
  lga_name: string;
  state_name: string;
  assigned_at: string;
}

export interface AdminObserverDetail extends AdminObserver {
  polling_units: AssignedPollingUnit[];
}

export interface ObserverListParams {
  q?: string;
  status?: ObserverFilter;
  limit: number;
  offset: number;
}

/** A one-time enrollment code. Only ever returned once, by an import or a re-issue: never cache or log it */
export interface IssuedCode {
  ref: string;
  cso: string | null;
  code: string;
  expires_at: string;
  enroll_uri: string;
  /** The observer already existed: any code it had before no longer works */
  reissued: boolean;
}

// --- Imports -------------------------------------------------------------------------------------------------------

export interface RosterRow {
  ref: string;
  cso: string | null;
}

export interface AssignmentRow {
  observer_ref: string;
  pu_code: string;
}

export interface ImportAssignmentsResult {
  added: number;
  skipped: number;
}

// --- Oversight -----------------------------------------------------------------------------------------------------

export const AUDIT_ENTITIES = ["observer", "result", "incident", "escalation"] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

/** One audit_log row, newest first. entity_label: observer ref, the result's PU code, incident uuid or "#12" */
export interface AuditLogRow {
  id: number;
  entity_type: AuditEntity;
  entity_id: number;
  entity_label: string | null;
  from_status: string | null;
  to_status: string;
  actor_analyst_id: number | null;
  actor_name: string | null;
  reason: string | null;
  created_at: string;
}

export interface AuditParams {
  actor?: number;
  entity_type?: AuditEntity;
  /** RFC3339, [from, to) */
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}

/** Device states are exclusive, as on the status chips: revoked, else enrolled, else pending, else expired */
export interface OnboardingCounts {
  observers: number;
  pending: number;
  enrolled: number;
  revoked: number;
  expired: number;
}

export interface OnboardingByCSO extends OnboardingCounts {
  cso: string | null;
  unassigned: number;
}

/** Observers with at least one polling unit in the state; someone covering two states counts in both */
export interface OnboardingByState extends OnboardingCounts {
  state_code: string;
  state_name: string;
}

export interface OnboardingSummary {
  totals: OnboardingByCSO;
  by_cso: OnboardingByCSO[];
  by_state: OnboardingByState[];
}
