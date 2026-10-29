import { createHmac, generateKeyPairSync } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./global-setup";

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits), as the authenticator app computes it */
export function totp(secret: string, now = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.replace(/=+$/, "").toUpperCase()].map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** What the field app sends on first launch: the code plus the public half of a keypair made on the phone */
export function enrollBody(code: string) {
  const { publicKey } = generateKeyPairSync("ed25519");
  const der = publicKey.export({ format: "der", type: "spki" });
  return { code, public_key: der.subarray(der.length - 32).toString("base64") };
}

/** Signs in to the console as the E2E admin (global-setup creates it) */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByLabel("Authenticator code").fill(totp(process.env.E2E_TOTP_SECRET!));
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Observers" })).toBeVisible();
}
