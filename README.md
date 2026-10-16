# Kids Browser + Parent Dashboard

| Folder       | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `electron/`  | Kid browser main process: filtering, tabs, policy sync with the server     |
| `src/`       | Kid browser UI (React)                                                     |
| `server/`    | Parent API + hosts the dashboard (Node 24, built-in SQLite, no deps)       |
| `dashboard/` | Parent dashboard website (React)                                           |

## How it works

1. A parent signs up on the dashboard and clicks **Add device** to get an 8-character pairing code (valid 10 min).
2. The kid browser shows a pairing screen until the code is entered. Browsing is locked until then.
3. The browser syncs every 15s: it uploads site requests and activity, and downloads the latest policy.
   If the server is unreachable, it keeps enforcing the last policy it received.
4. When a device is disconnected from the dashboard, the browser locks again on its next sync.

## Development

```bash
npm install
npm run dev
```

This starts the API (`:8787`), the dashboard (`http://127.0.0.1:5174`), the kid browser UI (`:5173`) and Electron.
Changes under `src/` and `dashboard/` hot-reload; changes under `electron/` restart Electron, and changes under `server/` restart the API.

## Deploying the parent server

```bash
npm run build:dashboard
cd server && NODE_ENV=production PORT=8787 DATA_DIR=/var/lib/guardian TRUST_PROXY=1 node src/index.ts
```

- Run it behind HTTPS (e.g. a reverse proxy). Set `TRUST_PROXY=1` only when a proxy sets `X-Forwarded-For` / `X-Forwarded-Proto`.
- `DATA_DIR` holds `guardian.db` (SQLite). Back it up.
- Before packaging the browser, set `PRODUCTION_SERVER_URL` in `electron/sync.cjs` (must be `https://`),
  or provide `GUARDIAN_SERVER_URL` at runtime.

## Releasing the desktop app

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds the macOS (`.dmg`, arm64 + x64), Windows (`.exe`) and Linux (`.AppImage`) installers and attaches them to a GitHub Release.

- Set the repo variable `SERVER_URL` (Settings → Secrets and variables → Actions → Variables) to the parent server's `https://` URL; it is baked into the app.
- Build the dashboard with `VITE_GITHUB_REPO=owner/repo` so the landing page download buttons point at `releases/latest`.
- Builds are unsigned, so macOS and Windows show a warning on first launch.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The server also ships as a Docker image: `docker build --build-arg VITE_GITHUB_REPO=owner/repo -t wonderly . && docker run -p 8787:8787 -v wonderly-data:/data wonderly`.
