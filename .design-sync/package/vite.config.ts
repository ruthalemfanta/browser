import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const REPO = resolve(import.meta.dirname, "../..");

// The browser and parent apps each ship a global stylesheet with clashing
// selectors (.primary, .brand, --line). Scope each under its surface class.
const SCOPES: Record<string, string> = {
  [resolve(REPO, "src/styles.css")]: ".wonderly-browser",
  [resolve(REPO, "dashboard/src/styles.css")]: ".wonderly-parents"
};

type Node = { type: string; selectors?: string[]; parent?: Node & { name?: string }; params?: string; prop?: string; remove(): void };

const scopePlugin = {
  postcssPlugin: "wonderly-scope",
  Once(root: { source?: { input?: { file?: string } }; walkAtRules(cb: (n: Node) => void): void; walkRules(cb: (n: Node) => void): void }) {
    const scope = SCOPES[root.source?.input?.file ?? ""];
    if (!scope) return;
    root.walkAtRules(rule => {
      if ((rule as unknown as { name: string }).name === "import") rule.remove();
    });
    root.walkRules(rule => {
      if (rule.parent?.type === "atrule" && /keyframes$/.test(rule.parent.name ?? "")) return;
      rule.selectors = rule.selectors!.map(sel => {
        if (/^(:root|html|body)$/.test(sel)) {
          (rule as unknown as { walkDecls(cb: (d: Node) => void): void }).walkDecls(d => {
            if (d.prop === "min-width" || d.prop === "min-height") d.remove();
          });
          return scope;
        }
        return `${scope} ${sel}`;
      });
    });
  }
};

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react() as Plugin[]],
  css: { postcss: { plugins: [scopePlugin] } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    cssMinify: false,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "style"
    },
    rolldownOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"]
    }
  }
});
