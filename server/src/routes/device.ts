import { randomToken, requireDevice, sha256 } from "../auth.ts";
import { db, transaction } from "../db.ts";
import { body, clientIp, HttpError, rateLimiter, send, type Router } from "../http.ts";
import { DEFAULT_POLICY, normalizeDomain, sanitizePolicy } from "../policy.ts";

const LOG_TYPES = new Set(["visit", "blocked", "admin", "tamper"]);
const LOG_KEEP = 2000;
const MAX_BATCH = 300;

const pairLimit = rateLimiter(10, 15 * 60_000);

type LogInput = { ts?: unknown; type?: unknown; url?: unknown; reason?: unknown; detail?: unknown };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : null;
}

export function addLog(deviceId: number, entry: LogInput) {
  if (!LOG_TYPES.has(String(entry.type))) return;
  const ts = Number(entry.ts);
  db.prepare("INSERT INTO logs (device_id, ts, type, url, reason, detail) VALUES (?, ?, ?, ?, ?, ?)").run(
    deviceId,
    Number.isFinite(ts) && ts > 0 ? Math.min(ts, Date.now()) : Date.now(),
    String(entry.type),
    text(entry.url, 2048),
    text(entry.reason, 40),
    text(entry.detail, 300)
  );
}

function pendingRequests(deviceId: number) {
  const rows = db.prepare("SELECT domain FROM requests WHERE device_id = ? ORDER BY created_at")
    .all(deviceId) as { domain: string }[];
  return rows.map(r => r.domain);
}

export function deviceRoutes(router: Router) {
  router.post("/api/device/pair", (req, res) => {
    pairLimit(clientIp(req));
    const { code } = body<{ code: string }>(req);
    const normalized = typeof code === "string" ? code.replace(/[\s-]/g, "").toUpperCase() : "";

    const result = transaction(() => {
      const pairing = db.prepare("SELECT parent_id, device_name FROM pairing_codes WHERE code = ? AND expires_at > ?")
        .get(normalized, Date.now()) as { parent_id: number; device_name: string } | undefined;
      if (!pairing) throw new HttpError(400, "That code is invalid or expired");

      db.prepare("DELETE FROM pairing_codes WHERE code = ?").run(normalized);

      const token = randomToken();
      const policy = sanitizePolicy(DEFAULT_POLICY);
      const { lastInsertRowid } = db.prepare(`
        INSERT INTO devices (parent_id, name, token_hash, policy, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?)
      `).run(pairing.parent_id, pairing.device_name, sha256(token), JSON.stringify(policy), Date.now(), Date.now());

      addLog(Number(lastInsertRowid), { type: "admin", detail: "Browser paired" });
      return { token, device: { id: Number(lastInsertRowid), name: pairing.device_name }, policy };
    });

    send(res, 201, result);
  });

  router.post("/api/device/sync", (req, res) => {
    const device = requireDevice(req);
    const { requests, log } = body<{ requests: unknown[]; log: LogInput[] }>(req);

    transaction(() => {
      db.prepare("UPDATE devices SET last_seen = ? WHERE id = ?").run(Date.now(), device.id);

      const insertRequest = db.prepare("INSERT OR IGNORE INTO requests (device_id, domain, created_at) VALUES (?, ?, ?)");
      for (const raw of Array.isArray(requests) ? requests.slice(0, MAX_BATCH) : []) {
        const domain = normalizeDomain(raw);
        if (domain) insertRequest.run(device.id, domain, Date.now());
      }

      for (const entry of Array.isArray(log) ? log.slice(0, MAX_BATCH) : []) {
        if (entry && typeof entry === "object" && entry.type !== "admin") addLog(device.id, entry);
      }

      db.prepare(`
        DELETE FROM logs WHERE device_id = ? AND id NOT IN (
          SELECT id FROM logs WHERE device_id = ? ORDER BY ts DESC, id DESC LIMIT ?
        )
      `).run(device.id, device.id, LOG_KEEP);
    });

    send(res, 200, {
      name: device.name,
      policy: sanitizePolicy(JSON.parse(device.policy)),
      requests: pendingRequests(device.id)
    });
  });
}
