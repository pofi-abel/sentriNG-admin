// Production headers for Live (public plan §12), shared by the Cloudflare Pages build and the local preview.
// Run after `vite build` (pnpm build does): writes dist/client/_headers with the CSP hashes of this build's shell.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(import.meta.dirname, "../dist/client");

// The API the build talks to (VITE_API_URL, as at build time). Public reads are CORS-open, no credentials
const apiOrigin = new URL(process.env.VITE_API_URL ?? "http://localhost:8080").origin;

/**
 * default-src 'self', connect only to the API, no third-party anything (no trackers, fonts or tiles).
 * The shell's own inline scripts (TanStack's router state) are allowed by hash, so injected scripts can't run.
 */
export function securityHeaders(html) {
  const scriptHashes = html
    ? [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
        .filter(([, attributes]) => !/\bsrc=/.test(attributes))
        // Hash what the browser runs: the HTML parser turns NUL into U+FFFD and CRLF/CR into LF
        .map(([, , body]) => body.replace(/\0/g, "�").replace(/\r\n?/g, "\n"))
        .map((body) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`)
    : [];
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(" ")}`.trim(),
    "style-src 'self'",
    "font-src 'self'",
    "img-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
  return {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}

// Hashed bundles and versioned boundary files never change under the same URL. The shell keeps Pages' default
// (revalidate at the edge), so a deploy shows up at once
export const IMMUTABLE = "public, max-age=31536000, immutable";
export const isImmutable = (path) => path.startsWith("/assets/") || path.startsWith("/geo/");

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = await readFile(join(root, "index.html"), "utf8");
  const lines = (headers) => Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`);
  const file = ["/*", ...lines(securityHeaders(html)), "/assets/*", ...lines({ "Cache-Control": IMMUTABLE }), "/geo/*", ...lines({ "Cache-Control": IMMUTABLE })];
  await writeFile(join(root, "_headers"), file.join("\n") + "\n");
  console.log(`wrote ${join(root, "_headers")} (CSP for ${apiOrigin})`);
}
