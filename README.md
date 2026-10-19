# Kids Browser + Parent Dashboard

| Folder       | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `electron/`  | Kid browser main process: filtering, tabs, policy sync with the server     |
| `src/`       | Kid browser UI (React)                                                     |
| `server/`    | Parent API + hosts the dashboard (Node 24, Turso / libSQL)                 |
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

## Deploying the parent server (free, no credit card)

The server stores data in [Turso](https://turso.tech) (hosted SQLite) and runs on [Render](https://render.com)'s free tier.

1. Create a Turso database and copy its URL (`libsql://…`) and an auth token.
2. On Render, choose **New → Blueprint** and select this repo (it reads `render.yaml`).
3. Set `DATABASE_URL`, `DATABASE_AUTH_TOKEN` and `VITE_GITHUB_REPO` (`owner/repo`, for the download buttons).
4. Use the `https://…onrender.com` URL as the `SERVER_URL` repo variable below.

Without `DATABASE_URL` the server uses a local file at `DATA_DIR/guardian.db` (default `server/data`), which is what `npm run dev` uses.
Run `npm --prefix server install` once after cloning.

## Releasing the desktop app

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds the macOS (`.dmg`, arm64 + x64), Windows (`.exe`) and Linux (`.AppImage`) installers and attaches them to a GitHub Release.

- Set the repo variable `SERVER_URL` (Settings → Secrets and variables → Actions → Variables) to the parent server's `https://` URL; it is baked into the app.
- Build the dashboard with `VITE_GITHUB_REPO=owner/repo` so the landing page download buttons point at `releases/latest`.
- Builds are unsigned, so macOS and Windows show a warning on first launch.

```bash
git tag v1.0.0 && git push origin v1.0.0
```
