# design-sync notes

## How this repo is synced

- This is an app (Electron browser plus parent dashboard), not a component library. `.design-sync/package/` is a small wrapper package that re-exports the real components from `src/` and `dashboard/src/`. It is built with the repo's own Vite: `cfg.buildCmd`, then `vite build` + `tsc` declarations into `.design-sync/package/dist/`. Run `cfg.buildCmd` before the converter on every re-sync.
- Why not the converter's src-synth mode: the bundler's loaders choke on `.jpg`/`.webp` (Landing), and `import.meta.env` (`dashboard/src/lib/downloads.ts`) is only resolved by Vite.
- The two global stylesheets clash (`.primary`, `.brand`, `.form-error`, `--line`), so `vite.config.ts` scopes `src/styles.css` under `.wonderly-browser` and `dashboard/src/styles.css` under `.wonderly-parents`, via a postcss plugin keyed by file path. In that rewrite, `:root`/`html`/`body` become the scope class; `min-width`/`min-height` from those rules are dropped (they are viewport concerns of the Electron window); remote `@import`s are stripped and replaced by one fonts import in `package/src/fonts.css`. Landing's `landing.css`/`motion.css` are `lp-` prefixed and stay global.
- `BrowserSurface`, `ParentsSurface` and `DemoBackend` exist only in `.design-sync/package/src/`. They are design-time glue, not app code. `DemoBackend` fakes `window.browserAPI` and `/api/*` (fetch is patched for `/api/` paths only), installing defaults when the bundle loads.
- Every component's group comes from a `docsMap` entry pointing at a category stub in `.design-sync/groups/`. This is an enumeration on purpose: there is no src folder structure or JSDoc to derive groups from. Add new components there.
- `dtsPropsFor` inlines the global ambient types (`BlockInfo`, `BrowserState`, `Device`, `Policy`), which ts-morph can't resolve from the emitted declarations.
- Render check: playwright 1.63.0 matches the cached chromium-1243 (`~/Library/Caches/ms-playwright`).

## Preview gotchas

- `DemoBackend` is global state. Cells with different fixtures in one card overwrite each other, so `BrowserApp`, `Dashboard`, `AuthPage` and `DemoBackend` use `cardMode: single`. Captures are per-cell, so grading is unaffected.
- Landing and BrowserMock previews inline the page's own `prefers-reduced-motion` rules (under `.ds-still`), otherwise captures freeze mid-entrance animation.
- With six or more approved sites, HomePage and BrowserApp previews clip at the cell height. They use five.

## Known render warns

- None open. The DevicePanel `Protection`/`Websites` cells clip at the cell height. That is the long real panel, not a render fault.

## Re-sync risks

- `DemoBackend` mirrors the `/api` routes in `dashboard/src/api.ts` and the `window.browserAPI` shape in `src/vite-env.d.ts`. If either changes, update `package/src/demo-backend.tsx`, or screens render empty.
- `dtsPropsFor` hand-copies `BlockReason`, `Device`, `Policy` and `LogEntry`. These go stale silently when the types change.
- New components must be added to `package/src/index.ts`, `cfg.docsMap` and `.design-sync/previews/`.
- The scope plugin keys on exact stylesheet paths. Moving or renaming `src/styles.css` or `dashboard/src/styles.css` ships them unscoped.
- Fonts load at runtime from Google Fonts (`[FONT_REMOTE]`). Nothing is bundled.
