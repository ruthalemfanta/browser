import fs from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import path from "node:path";
import { config } from "./config.ts";
import { createRouter, HttpError, readJson, send, type Req } from "./http.ts";
import { deviceRoutes } from "./routes/device.ts";
import { parentRoutes } from "./routes/parent.ts";

const router = createRouter();
parentRoutes(router);
deviceRoutes(router);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json"
};

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'"
].join("; ");

function securityHeaders(res: ServerResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", CSP);
  if (config.production) res.setHeader("Strict-Transport-Security", "max-age=31536000");
}

function sameOrigin(req: Req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const expectedHost = (config.trustProxy && req.headers["x-forwarded-host"])
      ? String(req.headers["x-forwarded-host"]).split(",")[0].trim()
      : req.headers.host;

    if (originUrl.host === expectedHost) return true;

    if (!config.production) {
      const isLocal =
        (originUrl.hostname === "127.0.0.1" || originUrl.hostname === "localhost") &&
        (originUrl.port === "5174" || originUrl.port === "8787");
      if (isLocal) return true;
    }

    return false;
  } catch {
    return false;
  }
}

function serveStatic(pathname: string, res: ServerResponse) {
  const root = config.dashboardDir;
  const resolved = path.resolve(root, `.${pathname}`);
  const inside = resolved.startsWith(root + path.sep);
  const file = inside && fs.existsSync(resolved) && fs.statSync(resolved).isFile()
    ? resolved
    : path.join(root, "index.html");

  if (!fs.existsSync(file)) return send(res, 404, { error: "Dashboard not built" });

  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache"
  });
  fs.createReadStream(file).pipe(res);
}

const server = createServer(async (incoming, res) => {
  const req = incoming as Req;
  const url = new URL(req.url ?? "/", "http://localhost");
  securityHeaders(res);

  try {
    if (!url.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405);
      return serveStatic(url.pathname, res);
    }

    const found = router.match(req.method ?? "GET", url.pathname);
    if (!found) return send(res, 404, { error: "Not found" });
    if (req.method !== "GET" && !sameOrigin(req)) throw new HttpError(403, "Cross-origin request blocked");

    req.params = found.params;
    req.body = await readJson(req);
    await found.handler(req, res);
  } catch (error) {
    if (error instanceof HttpError) return send(res, error.status, { error: error.message });
    console.error(error);
    send(res, 500, { error: "Something went wrong" });
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Parent dashboard server on http://${config.host}:${config.port}`);
});
