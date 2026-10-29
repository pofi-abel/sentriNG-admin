// Import → print → enroll (as the field app would) → assign → re-issue → revoke, then the audit log and onboarding
// progress show it all. One run of what an operator does at a training session and on election morning
import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";
import { enrollBody, totp } from "./helpers";

const run = Date.now().toString(36);
const CSO = `E2E CSO ${run}`;
const REF = `E2E-${run}-1`;
const PU = "25-01-01-001"; // from the API's sample polling units

test.describe.configure({ mode: "serial" });

let page: Page;
const api = () => process.env.E2E_API_URL!;
const enroll = (code: string) => page.request.post(`${api()}/v1/observer/enroll`, { data: enrollBody(code) });
const cardCode = (ref: string) => page.locator(".sn-card", { hasText: ref }).locator("p.font-mono").nth(1).innerText();

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test("logs in with password and authenticator code", async () => {
  await page.goto("/observers");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByLabel("Authenticator code").fill(totp(process.env.E2E_TOTP_SECRET!));
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Observers" })).toBeVisible();
  await expect(page.getByText("Restricted")).toBeVisible();
});

test("imports a roster and prints its cards", async () => {
  await page.getByRole("link", { name: "Import roster" }).click();
  const csv = `ref,cso\n${REF},"${CSO}"\nE2E-${run}-2,"${CSO}"\n`;
  await page.locator("#roster-file").setInputFiles({ name: "roster.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByRole("cell", { name: REF })).toBeVisible();
  await page.getByRole("button", { name: "Issue 2 codes" }).click();

  await expect(page.locator(".sn-card")).toHaveCount(2);
  await expect(page.locator(".sn-card", { hasText: REF })).toContainText("Single-use code");

  // Printed: only the cards, two per row, no app chrome
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("banner")).toBeHidden();
  await expect(page.locator(".sn-card").first()).toBeVisible();
  // E2E_PRINT_OUT=<dir> keeps the sheet as a PDF and as a picture at A4 width, to look at the layout by eye
  const out = process.env.E2E_PRINT_OUT;
  if (out) {
    await page.pdf({ path: `${out}/cards.pdf`, format: "A4", preferCSSPageSize: true });
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: 794, height: 1123 }); // A4 at 96 dpi
    await page.screenshot({ path: `${out}/cards.png`, fullPage: true });
    await page.setViewportSize(viewport);
  }
  await page.emulateMedia({ media: "screen" });
});

test("a printed code enrolls a phone, and leaving the sheet asks first", async () => {
  expect((await enroll(await cardCode(REF))).status()).toBe(200);

  await page.getByRole("link", { name: "Observers" }).click();
  await expect(page.getByRole("dialog", { name: "Leave without printing?" })).toBeVisible();
  await page.getByRole("button", { name: "Leave and discard codes" }).click();

  await page.getByRole("searchbox", { name: "Search by ref or CSO" }).fill(REF);
  await page.getByRole("searchbox", { name: "Search by ref or CSO" }).press("Enter");
  await page.getByRole("link", { name: REF }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Enrolled"); // the status chip, not the facts label
});

test("assigns a polling unit, rejecting an unknown one", async () => {
  const input = page.getByLabel("Assign a polling unit");
  await input.fill("99-99-99-999");
  await input.press("Enter");
  await expect(page.getByText("No polling unit has the code 99-99-99-999")).toBeVisible();

  await input.fill(PU);
  await input.press("Enter");
  await expect(page.getByRole("cell", { name: PU, exact: true })).toBeVisible();
});

test("re-issue then revoke: the unused replacement code stops working", async () => {
  await page.getByRole("button", { name: "Re-issue code" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Re-issue code" }).click();
  await expect(page.locator(".sn-card")).toHaveCount(1);
  const replacement = await cardCode(REF);
  await page.getByRole("button", { name: "Done, clear code" }).click();

  await page.getByRole("button", { name: "Revoke" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Revoke" })).toBeDisabled();
  await dialog.getByLabel(`Type ${REF} to confirm`).fill(REF);
  await dialog.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Revoked");

  expect((await enroll(replacement)).status()).toBe(401);
});

test("the audit log and onboarding progress show what happened", async () => {
  await page.goto("/audit?entity=observer");
  const rows = page.getByRole("row", { name: new RegExp(REF) });
  await expect(rows).toHaveCount(4); // code issued, assigned, code issued (re-issue), revoked
  await expect(rows.first()).toContainText("Revoked");
  await expect(rows.first()).toContainText("E2E Admin");

  await page.goto("/onboarding");
  const cso = page.getByRole("row", { name: new RegExp(CSO) });
  await expect(cso.getByRole("cell").nth(1)).toHaveText("2"); // observers
  // The second observer: code issued, no polling unit. The first: revoked
  await expect(cso.getByRole("link", { name: "1", exact: true })).toHaveCount(3);
});
