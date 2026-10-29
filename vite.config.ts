import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { redact } from "@tanstack/redact/vite";

export default defineConfig({
  // Bundle server deps so Redact can redirect their React imports too. axios stays external: its Node build pulls in
  // CommonJS form-data, which the dev module runner can't evaluate, and it never imports React
  ssr: { noExternal: true, external: ["axios"] },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // SPA: one shell written to index.html; every route renders in the browser (hosts need the usual SPA fallback)
      spa: { enabled: true, prerender: { outputPath: "/index" } },
    }),
    viteReact(),
    // Default "full" preset: Start needs hydration, context, Suspense, lazy, memo (the maps are lazy chunks)
    redact(),
  ],
  server: {
    // Dev talks to the local API through the proxy (API ADDR default :8080). Dropping the browser's Origin makes the
    // call same-origin for the API, so dev works on any port without touching its ALLOWED_ORIGINS
    proxy: {
      "/v1": {
        target: process.env.API_PROXY_TARGET || "http://localhost:8080",
        changeOrigin: true,
        configure: (proxy) => proxy.on("proxyReq", (req) => req.removeHeader("origin")),
      },
    },
  },
});
