// src/lib/observers.ts - What an observer's dates add up to. The API stores timestamps; the console names the state
import type { AdminObserver } from "./types";

/**
 * - revoked: the device key is cut off (lost phone); a new code may already be out
 * - enrolled: a phone holds the observer's key
 * - pending: a code is out and hasn't been used
 * - expired: never enrolled, and the code ran out (re-issue to try again)
 */
export type ObserverState = "revoked" | "enrolled" | "pending" | "expired";

export function observerState(o: AdminObserver, now = Date.now()): ObserverState {
  if (o.revoked_at) return "revoked";
  if (o.enrolled_at) return "enrolled";
  return hasLiveCode(o, now) ? "pending" : "expired";
}

/** An unused code is out there: for an enrolled or revoked observer, that's a replacement phone waiting to enroll */
export const hasLiveCode = (o: AdminObserver, now = Date.now()) => !!o.code_expires_at && Date.parse(o.code_expires_at) > now;
