import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

// Separate from vite.config.ts: no Start/Redact plugins, component tests run on plain React
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  // e2e/ is Playwright's
  test: { environment: "jsdom", setupFiles: ["./src/test-setup.ts"], exclude: ["node_modules", "dist", "e2e"] },
});
