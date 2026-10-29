// src/lib/csv.ts - Reads the roster and assignments CSVs in the browser, so the operator sees every row and every
// problem before anything is sent. Same columns as the CLI (admin plan §3.2)
import { IMPORT_MAX_ROWS } from "./constants";
import type { AssignmentRow, RosterRow } from "./types";

/** RFC 4180: quoted fields (with "" for a quote, commas and line breaks inside), CRLF or LF, a leading BOM */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') field += src[i++];
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") (row.push(field), (field = ""));
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field), rows.push(row), (row = []), (field = "");
    } else field += ch;
  }
  if (field || row.length) row.push(field), rows.push(row);
  // Blank lines (an empty last line, spacer rows) are not rows
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

export interface CsvRead<T> {
  rows: T[];
  /** "row 3: empty ref". Rows are numbered from 1 after the header, as the API numbers them */
  problems: string[];
}

/** Columns by header name (any order, any case), so files with extra columns still work */
function readColumns(text: string, required: string[], optional: string[] = []) {
  const [header = [], ...body] = parseCSV(text);
  const names = header.map((h) => h.trim().toLowerCase());
  const missing = required.filter((c) => !names.includes(c));
  const at = (row: string[], name: string) => (row[names.indexOf(name)] ?? "").trim();
  const problems = missing.length ? [`The header must name the column${missing.length > 1 ? "s" : ""} ${missing.join(", ")}`] : [];
  if (body.length > IMPORT_MAX_ROWS) problems.push(`${body.length} rows: one import takes at most ${IMPORT_MAX_ROWS}. Split the file`);
  const cells = missing.length ? [] : body.map((row) => Object.fromEntries([...required, ...optional].map((c) => [c, at(row, c)])));
  return { cells, problems };
}

/** A CSO roster: ref[,cso] */
export function readRoster(text: string): CsvRead<RosterRow> {
  const { cells, problems } = readColumns(text, ["ref"], ["cso"]);
  const seen = new Map<string, number>();
  const rows = cells.map((c, i) => {
    if (!c.ref) problems.push(`row ${i + 1}: empty ref`);
    else if (seen.has(c.ref)) problems.push(`row ${i + 1}: ${c.ref} repeats row ${seen.get(c.ref)}`);
    else seen.set(c.ref, i + 1);
    return { ref: c.ref, cso: c.cso || null };
  });
  return { rows, problems };
}

/** Assignments: observer_ref,pu_code. Repeats are harmless (assigning twice is a no-op) */
export function readAssignments(text: string): CsvRead<AssignmentRow> {
  const { cells, problems } = readColumns(text, ["observer_ref", "pu_code"]);
  const rows = cells.map((c, i) => {
    if (!c.observer_ref) problems.push(`row ${i + 1}: empty observer_ref`);
    if (!c.pu_code) problems.push(`row ${i + 1}: empty pu_code`);
    return { observer_ref: c.observer_ref, pu_code: c.pu_code };
  });
  return { rows, problems };
}
