# Design System: SentriNG Admin

The admin console uses the desk's visual language (`sentriNG-desk/docs/DESIGN.md`): the same tokens, type, icons,
components, motion rules and anti-patterns. The brand guide (`sentriNG-api/docs/05-brand-system.md`) is the source of
truth. This file lists only what is different here and why.

## 1. Atmosphere

Same dark operations-room feel as the desk, with one extra signal: **operators must always know they are in the
console that issues credentials** (brand §3).

- **Cyan header rule.** The header has a 2 px Signal Cyan bottom border instead of a hairline.
- **Restricted mark.** Beside the Admin lockup: an uppercase 12 px "Restricted" label in cyan with a cyan outline. It
  appears in the header and on the login screen. No icon: the brand icon map has no "restricted" concept, and the
  word is clearer than a padlock.
- **Density: Calm (5).** Lists are long, but operators act on one observer at a time, so it is less dense than the desk.
- **No hotkeys.** Operators use the console for occasional, deliberate work, not twelve-hour queue shifts.
- **Five sections in the header** (Observers, Analysts, Onboarding, Audit log, Reference data), so it fits at 1280 px.
  Roster import and assignments are observer tasks: outline buttons on the Observers page, with a back arrow on theirs.

## 2. Status

Observer state uses the brand's status colours with fixed meanings, always shown as icon + label:

| State | Meaning | Look |
|---|---|---|
| Code issued | A code is out, not yet used | Fog, `HourglassIcon` (pending) |
| Enrolled | A phone holds the key | Verified green, `CheckmarkCircle02Icon` (brand: "enrolled") |
| Revoked | The key is cut off | Critical red, `UserBlock01Icon` (brand map: Revoke) |
| Code expired | Never enrolled, code ran out | Warning amber, `Alert02Icon` |

"New code out" (muted, `QrCodeIcon`) sits beside Enrolled or Revoked when a replacement phone has a code waiting.
An observer with no polling units shows "None" in amber: results from them are refused.

## 3. Enrollment cards

- Printed on **Paper with Ink text** whatever the screen theme (brand §6). On screen they preview exactly what prints.
- Each card holds the **Field lockup** (the observer installs SentriNG Field, not Admin), the QR, the observer ref in
  mono, the CSO, "Single-use code" with the code in mono (for a camera that can't scan), and "Scan in SentriNG Field
  before <date>".
- The QR is drawn as SVG paths, Ink on Paper, with the 4-module quiet zone and error correction M.
- Print: A4, 10 mm margins, 2 × 4 cards per page, and a card never splits across pages. The app chrome is hidden.
- The card's border and muted text use the light theme's values (`#D6D0C2`, `#545E69`) directly, because the semantic
  tokens follow the dark screen.

## 4. Credential actions

- Anything that changes what a printed card is worth asks first, and says what stops working:
  - **Re-issue** confirms in a dialog.
  - **Revoke** makes the operator type the observer ref.
- A page showing codes guards against leaving: an accent banner says to print now, and leaving opens a dialog,
  "Leave without printing?". Log out, idle lock and session end never wait on it.
- Imports always preview first:
  - the file name and row count;
  - the first 10 rows;
  - every problem, numbered "row N" the way the API numbers them.
  - Apply stays off until the file is clean. The server is all or nothing too.

## 5. Oversight

- **Onboarding** is two tables, by CSO and by state, with a totals footer. There are no charts or stat cards: operators
  read exact numbers and act on a row.
  - Status columns repeat the chips' icon and colour.
  - A count of zero is muted, and non-zero counts keep their status colour (expired amber, revoked red, no polling
    units amber).
  - Every count that the observer list can filter opens it with that filter.
  - "as of hh:mm WAT" in mono, refreshed every minute.
- **Audit log** is one table, newest first, columns When · Who · What · Change · Detail.
  - "Change" reads `Pending → In review`, with the arrow muted.
  - Observer refs link to the observer. Results show their PU code, incidents their uuid, escalations `#id`.
  - Filters sit on the right of the title: what, who, from, to. Days are WAT days.

## 6. Analyst accounts

- Status chips: Active (verified green, `CheckmarkCircle02Icon`), Disabled (critical red, `UserBlock01Icon`, the
  brand's Revoke), "Can't log in" (warning amber, `Alert02Icon`, when the password or authenticator is missing). The
  "Admin" chip is a role, not a status: neutral, no icon.
- Actions sit on the right of the title: log out everywhere (`Logout01Icon`), reset password (`ResetPasswordIcon`,
  added to the brand icon map), reset authenticator (`QrCodeIcon`: it hands out a QR), then Disable (reject style; the
  operator types the email) or Enable (approve style). Admin accounts show none of these, and say why.
- The **credential slip** is Paper like the enrollment cards. It shows the Desk lockup (the analyst uses SentriNG Desk),
  name, email, the password large in mono, the authenticator QR, and the key in groups of four for typing. It has the
  same accent banner, print button and leave-page guard as codes.

## 7. Reference data

- One page: **Elections** first (table, newest first, "Held in" lists state names or a muted "Nationwide"), then
  **Import CSV**.
- The election dialog takes name, race and date, plus a checkbox grid of states (none ticked = nationwide). Editing
  locks race and date and says why. Taking a state out warns, in amber, that results already sent from it stay.
- An import is checked as soon as the file is chosen. The diff is one line per kind of change ("312 new polling units",
  "4 polling units renamed"), with up to five examples in mono and "and N more". It says that nothing is deleted.
  "Apply these changes" shows only when something would change; a file that changes nothing says so.

## 8. Copy

Plain and specific, as on the desk:
- Say what happened and what to do next ("No polling unit has the code 99-99-99-999").
- Never tell anyone to send codes by email or message: codes are handed over in person (admin plan §8).
