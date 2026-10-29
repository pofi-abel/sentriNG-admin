// Reference data: add an election for some states, re-scope it, then import a parties CSV, read its dry-run diff, apply
// it, and see that the same file now changes nothing
import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const run = Date.now().toString(36);
const ELECTION = `E2E Governorship ${run}`;
// A date no earlier run used: (race, date) is unique
const HELD_ON = new Date(Date.UTC(2030, 0, 1) + (Date.now() % 3650) * 86_400_000).toISOString().slice(0, 10);
const PARTY = `E${run}`.toUpperCase();

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await loginAsAdmin(page);
  await page.getByRole("link", { name: "Reference data" }).click();
});

test("adds an election held in one state, then adds a second", async () => {
  await page.getByRole("button", { name: "Add election" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(ELECTION);
  await dialog.getByRole("combobox", { name: "Race" }).click();
  await page.getByRole("option", { name: "Governorship" }).click();
  await dialog.getByLabel("Date").fill(HELD_ON);
  await dialog.getByRole("checkbox", { name: /Lagos/ }).check();
  await dialog.getByRole("button", { name: "Add election" }).click();

  const row = page.getByRole("row", { name: new RegExp(ELECTION) });
  await expect(row).toContainText("Lagos");

  await row.getByRole("button", { name: `Edit ${ELECTION}` }).click();
  await page.getByRole("dialog").getByRole("checkbox", { name: /FCT/ }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(row).toContainText("FCT, Lagos");
});

test("a parties CSV shows what it would change, applies, and then changes nothing", async () => {
  await page.getByRole("combobox", { name: "What to import" }).click();
  await page.getByRole("option", { name: "Parties" }).click();
  const csv = Buffer.from(`code,name\n${PARTY},E2E Party ${run}\n`);
  const pick = () => page.locator("#reference-file").setInputFiles({ name: "parties.csv", mimeType: "text/csv", buffer: csv });

  await pick();
  await expect(page.getByText("Applying this file will change:")).toBeVisible();
  await expect(page.getByText("1 new party", { exact: true })).toBeVisible();
  await expect(page.getByText(`${PARTY} E2E Party ${run}`)).toBeVisible();
  // E2E_PRINT_OUT=<dir> keeps a picture of the page with the diff, at the desk minimum width (1280 px)
  if (process.env.E2E_PRINT_OUT) await page.screenshot({ path: `${process.env.E2E_PRINT_OUT}/reference.png`, fullPage: true });
  await page.getByRole("button", { name: "Apply these changes" }).click();
  await expect(page.getByText("Imported 1 row. This changed:")).toBeVisible();

  await pick();
  await expect(page.getByText("nothing to change")).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply these changes" })).toHaveCount(0);
});

test("the election and the import are in the audit log", async () => {
  await page.goto("/audit?entity=election");
  await expect(page.getByRole("row", { name: new RegExp(ELECTION) })).toHaveCount(2); // created, updated
  await page.goto("/audit?entity=reference");
  await expect(page.getByRole("row", { name: /Parties imported/ }).first()).toContainText("1 new party");
});
