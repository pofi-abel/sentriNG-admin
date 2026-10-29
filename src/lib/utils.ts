// src/lib/utils.ts - Utility functions
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const numberFormat = new Intl.NumberFormat("en-NG");
export const formatNumber = (n: number | null | undefined) => (n == null ? "—" : numberFormat.format(n));

/** "45 s", "12 min", "3 h 05 min", "2 d": how long something has waited */
export function formatAge(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
  return `${Math.floor(hours / 24)} d`;
}

const watFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
/** "20 Feb, 09:41 WAT": election times are always read in Nigerian time, whatever the analyst's machine says */
export const formatWAT = (iso: string | null | undefined) => (iso ? `${watFormat.format(new Date(iso))} WAT` : "—");

/** "42%" of a whole; "—" when there is nothing to divide by */
export const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");

/** "vote_buying" → "Vote buying" */
export const humanize = (value: string) => (value.charAt(0).toUpperCase() + value.slice(1)).replaceAll("_", " ");

/**
 * A day range picked in date inputs, as RFC3339 bounds in Nigerian time: [from 00:00 WAT, the day after `to` 00:00 WAT).
 * WAT is UTC+1 all year (no daylight saving), so the offset is fixed
 */
export function watDayRange(from?: string, to?: string) {
  const nextDay = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  return {
    from: from ? `${from}T00:00:00+01:00` : undefined,
    to: to ? `${nextDay(to)}T00:00:00+01:00` : undefined,
  };
}

const dayFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
/** "20 Feb 2027" for a date-only value (election day), which the API sends as midnight UTC */
export const formatDay = (iso: string) => dayFormat.format(new Date(iso));
