import { describe, expect, it } from "vitest";
import { parseCSV, readAssignments, readRoster } from "./csv";
import { hasLiveCode, observerState } from "./observers";
import type { AdminObserver } from "./types";
import { watDayRange } from "./utils";

describe("parseCSV", () => {
  it("handles quotes, escaped quotes, commas and line breaks in fields, CRLF, a BOM and blank lines", () => {
    const text = '﻿ref,cso\r\nOBS-1,"YIAGA Africa, Lagos"\r\n\r\nOBS-2,"The ""Situation"" Room"\nOBS-3,"two\nlines"\n';
    expect(parseCSV(text)).toEqual([
      ["ref", "cso"],
      ["OBS-1", "YIAGA Africa, Lagos"],
      ["OBS-2", 'The "Situation" Room'],
      ["OBS-3", "two\nlines"],
    ]);
  });

  it("keeps a last line without a newline", () => {
    expect(parseCSV("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("readRoster", () => {
  it("reads columns by name in any order and case, and empties CSO to null", () => {
    expect(readRoster("CSO,Ref,extra\nYIAGA, OBS-1 ,x\n,OBS-2,y\n")).toEqual({
      rows: [
        { ref: "OBS-1", cso: "YIAGA" },
        { ref: "OBS-2", cso: null },
      ],
      problems: [],
    });
  });

  it("numbers problems the way the API does: row 1 is the first after the header", () => {
    const { problems } = readRoster("ref,cso\nOBS-1,A\n,B\nOBS-1,C\n");
    expect(problems).toEqual(["row 2: empty ref", "row 3: OBS-1 repeats row 1"]);
  });

  it("needs the header", () => {
    expect(readRoster("observer,cso\nOBS-1,x\n")).toEqual({ rows: [], problems: ["The header must name the column ref"] });
  });
});

describe("readAssignments", () => {
  it("needs both columns and flags empty cells", () => {
    expect(readAssignments("observer_ref\nOBS-1\n").problems).toEqual(["The header must name the column pu_code"]);
    expect(readAssignments("observer_ref,pu_code\nOBS-1,\n").problems).toEqual(["row 1: empty pu_code"]);
  });
});

describe("observerState", () => {
  const now = Date.parse("2027-02-20T08:00:00Z");
  const base: AdminObserver = { ref: "OBS-1", cso: null, enrolled_at: null, revoked_at: null, code_expires_at: null, assigned_pu_count: 0, created_at: "2027-01-01T00:00:00Z" };
  const later = "2027-03-01T00:00:00Z";
  const earlier = "2027-02-01T00:00:00Z";

  it("names the state from the dates, revoked first", () => {
    expect(observerState({ ...base, code_expires_at: later }, now)).toBe("pending");
    expect(observerState({ ...base, code_expires_at: earlier }, now)).toBe("expired");
    expect(observerState({ ...base, enrolled_at: earlier }, now)).toBe("enrolled");
    expect(observerState({ ...base, enrolled_at: earlier, revoked_at: earlier, code_expires_at: later }, now)).toBe("revoked");
  });

  it("spots a replacement code waiting to be used", () => {
    expect(hasLiveCode({ ...base, enrolled_at: earlier, code_expires_at: later }, now)).toBe(true);
    expect(hasLiveCode({ ...base, enrolled_at: earlier, code_expires_at: earlier }, now)).toBe(false);
  });
});

describe("watDayRange", () => {
  it("turns picked days into [00:00 WAT, the next day 00:00 WAT), across a month end", () => {
    expect(watDayRange("2027-02-20", "2027-02-28")).toEqual({ from: "2027-02-20T00:00:00+01:00", to: "2027-03-01T00:00:00+01:00" });
    expect(watDayRange(undefined, undefined)).toEqual({ from: undefined, to: undefined });
  });
});
