import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "./config.ts";

export type Req = IncomingMessage & { params: Record<string, string>; body: unknown };
export type Handler = (req: Req, res: ServerResponse) => unknown | Promise<unknown>;

type Route = { method: string; pattern: RegExp; keys: string[]; handler: Handler };

const MAX_BODY = 1_000_000;

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function createRouter() {
  const routes: Route[] = [];

  function add(method: string, path: string, handler: Handler) {
    const keys: string[] = [];
    const source = path.replace(/:(\w+)/g, (_, key: string) => {
      keys.push(key);
      return "([^/]+)";
    });
    routes.push({ method, pattern: new RegExp(`^${source}$`), keys, handler });
  }

  function match(method: string, path: string) {
    for (const route of routes) {
      if (route.method !== method) continue;
      const found = route.pattern.exec(path);
      if (!found) continue;
      const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(found[i + 1])]));
      return { handler: route.handler, params };
    }
    return null;
  }

  return {
    get: (path: string, h: Handler) => add("GET", path, h),
    post: (path: string, h: Handler) => add("POST", path, h),
    put: (path: string, h: Handler) => add("PUT", path, h),
    patch: (path: string, h: Handler) => add("PATCH", path, h),
    delete: (path: string, h: Handler) => add("DELETE", path, h),
    match
  };
}

export type Router = ReturnType<typeof createRouter>;

export async function readJson(req: IncomingMessage): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;

  const type = req.headers["content-type"] ?? "";
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, "Body too large");
    chunks.push(chunk);
  }

  if (size === 0) return undefined;
  if (!type.startsWith("application/json")) throw new HttpError(415, "Expected JSON");

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function send(res: ServerResponse, status: number, data?: unknown) {
  if (res.headersSent) return;
  if (data === undefined) {
    res.writeHead(status).end();
    return;
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

export function clientIp(req: IncomingMessage) {
  if (config.trustProxy) {
    const forwarded = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    if (forwarded) return forwarded;
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function isSecure(req: IncomingMessage) {
  if (config.trustProxy && req.headers["x-forwarded-proto"] === "https") return true;
  return "encrypted" in req.socket && Boolean(req.socket.encrypted);
}

export function body<T extends object>(req: Req): Partial<T> {
  return req.body && typeof req.body === "object" ? (req.body as Partial<T>) : {};
}

export function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (key: string) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    entry.count += 1;
    if (entry.count > limit) throw new HttpError(429, "Too many attempts. Try again later.");
  };
}
