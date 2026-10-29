// Local preview of the build: serves dist/client, falling back to the SPA shell (index.html) for every route
// (/e/1/state/25, /methodology, ...). Production hosts need the same fallback and the headers in headers.mjs.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { IMMUTABLE, isImmutable, root, securityHeaders } from "./headers.mjs";

const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

async function resolveFile(urlPath) {
  const path = join(root, normalize(decodeURIComponent(urlPath)));
  if (!path.startsWith(root)) return null;
  for (const candidate of [path, join(path, "index.html")]) {
    if ((await stat(candidate).catch(() => null))?.isFile()) return candidate;
  }
  return null;
}

createServer(async (req, res) => {
  const urlPath = new URL(req.url, "http://localhost").pathname;
  const file = (await resolveFile(urlPath)) ?? (extname(urlPath) ? null : join(root, "index.html"));
  if (!file) return res.writeHead(404, securityHeaders()).end("Not found");
  const body = await readFile(file);
  const html = extname(file) === ".html" ? body.toString("utf8") : undefined;
  res.writeHead(200, {
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
    "Cache-Control": isImmutable(urlPath) ? IMMUTABLE : "no-cache",
    ...securityHeaders(html),
  });
  res.end(body);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
