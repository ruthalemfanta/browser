import { randomToken, requireDevice, sha256 } from "../auth.ts";
import type { InStatement } from "@libsql/client";
import { all, db, get, run, transaction, type Executor } from "../db.ts";
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

function logStatement(deviceId: number, entry: LogInput): InStatement | null {
  if (!LOG_TYPES.has(String(entry.type))) return null;
  const ts = Number(entry.ts);
  return {
    sql: "INSERT INTO logs (device_id, ts, type, url, reason, detail) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      deviceId,
      Number.isFinite(ts) && ts > 0 ? Math.min(ts, Date.now()) : Date.now(),
      String(entry.type),
      text(entry.url, 2048),
      text(entry.reason, 40),
      text(entry.detail, 300)
    ]
  };
}

export async function addLog(deviceId: number, entry: LogInput, exec: Executor = db) {
  const stmt = logStatement(deviceId, entry);
  if (stmt) await exec.execute(stmt);
}

async function pendingRequests(deviceId: number) {
  const rows = await all<{ domain: string }>("SELECT domain FROM requests WHERE device_id = ? ORDER BY created_at", [deviceId]);
  return rows.map(r => r.domain);
}

export function deviceRoutes(router: Router) {
  router.post("/api/device/pair", async (req, res) => {
    pairLimit(clientIp(req));
    const { code } = body<{ code: string }>(req);
    const normalized = typeof code === "string" ? code.replace(/[\s-]/g, "").toUpperCase() : "";

    const result = await transaction(async tx => {
      const pairing = await get<{ parent_id: number; device_name: string }>(
        "SELECT parent_id, device_name FROM pairing_codes WHERE code = ? AND expires_at > ?", [normalized, Date.now()], tx);
      if (!pairing) throw new HttpError(400, "That code is invalid or expired");

      await run("DELETE FROM pairing_codes WHERE code = ?", [normalized], tx);

      const token = randomToken();
      const policy = sanitizePolicy(DEFAULT_POLICY);
      const { lastInsertRowid } = await run(`
        INSERT INTO devices (parent_id, name, token_hash, policy, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?)
      `, [pairing.parent_id, pairing.device_name, sha256(token), JSON.stringify(policy), Date.now(), Date.now()], tx);

      const id = Number(lastInsertRowid);
      await addLog(id, { type: "admin", detail: "Browser paired" }, tx);
      return { token, device: { id, name: pairing.device_name }, policy };
    });

    send(res, 201, result);
  });

  router.post("/api/device/sync", async (req, res) => {
    const device = await requireDevice(req);
    const { requests, log } = body<{ requests: unknown[]; log: LogInput[] }>(req);
    const now = Date.now();

    const statements: InStatement[] = [{ sql: "UPDATE devices SET last_seen = ? WHERE id = ?", args: [now, device.id] }];

    for (const raw of Array.isArray(requests) ? requests.slice(0, MAX_BATCH) : []) {
      const domain = normalizeDomain(raw);
      if (domain) statements.push({ sql: "INSERT OR IGNORE INTO requests (device_id, domain, created_at) VALUES (?, ?, ?)", args: [device.id, domain, now] });
    }

    for (const entry of Array.isArray(log) ? log.slice(0, MAX_BATCH) : []) {
      const stmt = entry && typeof entry === "object" && entry.type !== "admin" ? logStatement(device.id, entry) : null;
      if (stmt) statements.push(stmt);
    }

    statements.push({
      sql: `
        DELETE FROM logs WHERE device_id = ? AND id NOT IN (
          SELECT id FROM logs WHERE device_id = ? ORDER BY ts DESC, id DESC LIMIT ?
        )
      `,
      args: [device.id, device.id, LOG_KEEP]
    });

    await db.batch(statements, "write");

    send(res, 200, {
      name: device.name,
      policy: sanitizePolicy(JSON.parse(device.policy)),
      requests: await pendingRequests(device.id)
    });
  });
}
