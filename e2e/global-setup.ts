// Loads the sample polling units and (re)creates the E2E admin with a fresh TOTP secret, through the API's own CLIs.
// Both are idempotent, so every run starts the same way
import { execFileSync } from "node:child_process";

const api = new URL("../../sentriNG-api", import.meta.url).pathname;

export const E2E_ADMIN = { email: "e2e-admin@sentring.test", password: "e2e-only-password-1" };

export default function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.E2E_DATABASE_URL! };
  const go = (...args: string[]) => execFileSync("go", ["run", ...args], { cwd: api, env, encoding: "utf8" });

  go("./cmd/seed", "-polling-units", "seed/sample/polling_units.csv");
  const out = go("./cmd/createanalyst", "-email", E2E_ADMIN.email, "-name", "E2E Admin", "-password", E2E_ADMIN.password, "-admin");
  const secret = out.match(/manual secret: (\w+)/)?.[1];
  if (!secret) throw new Error(`createanalyst printed no TOTP secret:\n${out}`);
  process.env.E2E_TOTP_SECRET = secret; // globalSetup's env reaches the tests
}
