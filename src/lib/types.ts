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

// --- Analysts ------------------------------------------------------------------------------------------------------

/** Every account, admins included. Admin accounts are read-only here: they change only through the API's CLI */
export interface AdminAnalyst {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  disabled: boolean;
  /** A password and an authenticator secret are both set, so the account can log in */
  mfa_enrolled: boolean;
  created_at: string;
}

/** New sign-in details, returned once: never cache or log them. Create sets both; a reset sets one */
export interface AnalystCredentials {
  analyst: AdminAnalyst;
  password?: string;
  otpauth_uri?: string;
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

export const AUDIT_ENTITIES = ["observer", "analyst", "result", "incident", "escalation", "election", "reference"] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

/** One audit_log row, newest first. entity_label: observer ref, analyst email, election name, the result's PU code,
 * incident uuid or "#12". A reference import has none (to_status names the kind, reason sums up the diff) */
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

// --- Reference data ------------------------------------------------------------------------------------------------

export const RACES = ["presidential", "senate", "reps", "governorship", "state_assembly"] as const;
export type Race = (typeof RACES)[number];

export interface Election {
  id: number;
  name: string;
  race: Race;
  /** A date at midnight UTC, as RFC3339 */
  held_on: string;
  /** INEC state codes; [] = nationwide */
  state_codes: string[];
}

export interface State {
  code: string;
  name: string;
}

/** Same columns as the API's cmd/seed */
export const REFERENCE_KINDS = ["polling-units", "parties", "elections"] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

export interface ReferenceChange {
  noun: string;
  change: string;
  count: number;
  /** "312 new polling units" */
  text: string;
  /** Up to five of the changed rows */
  examples: string[];
}

/** What an import changed (applied) or would change (dry run). Imports only add and update, never delete */
export interface ReferenceImportResult {
  kind: ReferenceKind;
  applied: boolean;
  rows: number;
  changes: ReferenceChange[];
}
