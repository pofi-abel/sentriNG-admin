// Analyst accounts: add one (password + authenticator QR shown once), then reset, disable and enable it, checking each
// step against the real desk login. Admin accounts stay read-only in the console
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin, totp } from "./helpers";

const run = Date.now().toString(36);
const NAME = `E2E Analyst ${run}`;
const EMAIL = `e2e-${run}@desk.test`;

test.describe.configure({ mode: "serial" });

let page: Page;
let secret = "";
const api = () => process.env.E2E_API_URL!;
const deskLogin = (password: string) =>
  page.request.post(`${api()}/v1/auth/login`, { data: { email: EMAIL, password, totp_code: totp(secret) } });
const deskMe = (token: string) => page.request.get(`${api()}/v1/me`, { headers: { Authorization: `Bearer ${token}` } });
const slipPassword = () => page.locator(".sn-card p.font-mono.text-lg").innerText();

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await loginAsAdmin(page);
});

let token = "";
let password = "";

test("adds an analyst who can then log in to the desk", async () => {
  await page.getByRole("link", { name: "Analysts" }).click();
  await page.getByRole("button", { name: "Add analyst" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(NAME);
  await dialog.getByLabel("Email").fill(EMAIL);
  await dialog.getByRole("button", { name: "Add analyst" }).click();

  await expect(page.getByRole("img", { name: `Authenticator QR code for ${EMAIL}` })).toBeVisible();
  password = await slipPassword();
  // E2E_PRINT_OUT=<dir> keeps a picture of the screen with the slip, to look at by eye
  if (process.env.E2E_PRINT_OUT) await page.screenshot({ path: `${process.env.E2E_PRINT_OUT}/credentials.png` });
  secret = (await page.locator(".sn-card p.font-mono.text-xs").last().innerText()).replace(/\s/g, "");

  const res = await deskLogin(password);
  expect(res.status()).toBe(200);
  token = (await res.json()).token;
  expect((await deskMe(token)).status()).toBe(200);

  await page.getByRole("button", { name: "Done, clear" }).click();
  await page.getByRole("link", { name: NAME }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Active");
});

test("a password reset ends their sessions and replaces the password", async () => {
  await page.getByRole("button", { name: "Reset password" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reset password" }).click();
  const fresh = await slipPassword();
  expect(fresh).not.toBe(password);
  await page.getByRole("button", { name: "Done, clear" }).click();

  expect((await deskMe(token)).status()).toBe(401);
  expect((await deskLogin(password)).status()).toBe(401);
  expect((await deskLogin(fresh)).status()).toBe(200);
  password = fresh;
});

test("disable locks them out; enable lets them back in", async () => {
  await page.getByRole("button", { name: "Disable" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(`Type ${EMAIL} to confirm`).fill(EMAIL);
  await dialog.getByRole("button", { name: "Disable" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Disabled");
  expect((await deskLogin(password)).status()).toBe(401);

  await page.getByRole("button", { name: "Enable" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Enable" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Active");
});

test("admin accounts are read-only, and every change is in the audit log", async () => {
  await page.goto("/analysts");
  await page.getByRole("link", { name: "E2E Admin" }).click();
  await expect(page.getByText("Admin accounts change only from the command line")).toBeVisible();
  await expect(page.getByRole("button", { name: "Disable" })).toHaveCount(0);

  await page.goto("/audit?entity=analyst");
  const rows = page.getByRole("row", { name: new RegExp(EMAIL) });
  await expect(rows).toHaveCount(4); // created, password reset, disabled, enabled
  await expect(rows.first()).toContainText("Disabled");
  await expect(rows.first()).toContainText("Enabled");
});
