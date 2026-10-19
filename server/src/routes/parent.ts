import crypto from "node:crypto";
import { checkPassword, endSession, hashPassword, requireParent, startSession } from "../auth.ts";
import { all, db, get, run, transaction, type Executor } from "../db.ts";
import { body, clientIp, HttpError, rateLimiter, send, type Req, type Router } from "../http.ts";
import { normalizeDomain, sanitizePolicy, type Policy } from "../policy.ts";
import { addLog } from "./device.ts";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_TTL = 10 * 60_000;
const LOG_PAGE = 500;
const ONLINE_WINDOW = 60_000;

const loginLimit = rateLimiter(10, 15 * 60_000);
const signupLimit = rateLimiter(5, 60 * 60_000);

type DeviceRow = { id: number; name: string; policy: string; last_seen: number | null; created_at: number };

function credentials(req: Req) {
  const { email, password } = body<{ email: string; password: string }>(req);
  if (typeof email !== "string" || typeof password !== "string") throw new HttpError(400, "Email and password are required");
  return { email: email.trim().toLowerCase(), password };
}

async function ownedDevice(req: Req) {
  const parent = await requireParent(req);
  const id = Number(req.params.id);
  const device = await get<DeviceRow>("SELECT id, name, policy, last_seen, created_at FROM devices WHERE id = ? AND parent_id = ?", [id, parent.id]);
  if (!device) throw new HttpError(404, "Device not found");
  return device;
}

function savePolicy(deviceId: number, policy: Policy, exec: Executor = db) {
  return run("UPDATE devices SET policy = ? WHERE id = ?", [JSON.stringify(policy), deviceId], exec);
}

function pairingCode() {
  const bytes = crypto.randomBytes(8);
  return [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function parentRoutes(router: Router) {
  router.post("/api/auth/signup", async (req, res) => {
    signupLimit(clientIp(req));
    const { email, password } = credentials(req);
    if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, "Enter a valid email");
    if (password.length < 10 || password.length > 200) throw new HttpError(400, "Password must be at least 10 characters");

    const exists = await get("SELECT 1 FROM parents WHERE email = ?", [email]);
    if (exists) throw new HttpError(409, "An account with this email already exists");

    const { lastInsertRowid } = await run("INSERT INTO parents (email, password_hash, created_at) VALUES (?, ?, ?)",
      [email, hashPassword(password), Date.now()]);
    await startSession(req, res, Number(lastInsertRowid));
    send(res, 201, { email });
  });

  router.post("/api/auth/login", async (req, res) => {
    const { email, password } = credentials(req);
    loginLimit(`${clientIp(req)}:${email}`);

    const parent = await get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM parents WHERE email = ?", [email]);
    if (!checkPassword(password, parent?.password_hash) || !parent) throw new HttpError(401, "Wrong email or password");

    await startSession(req, res, parent.id);
    send(res, 200, { email });
  });

  router.post("/api/auth/logout", async (req, res) => {
    await endSession(req, res);
    send(res, 204);
  });

  router.get("/api/auth/me", async (req, res) => {
    const { email } = await requireParent(req);
    send(res, 200, { email });
  });

  router.get("/api/devices", async (req, res) => {
    const parent = await requireParent(req);
    const rows = await all<{ lastSeen: number | null }>(`
      SELECT d.id, d.name, d.last_seen AS lastSeen, d.created_at AS createdAt,
        (SELECT COUNT(*) FROM requests r WHERE r.device_id = d.id) AS pending
      FROM devices d WHERE d.parent_id = ? ORDER BY d.created_at
    `, [parent.id]);
    const now = Date.now();
    send(res, 200, rows.map(row => ({ ...row, online: row.lastSeen !== null && now - row.lastSeen < ONLINE_WINDOW })));
  });

  router.post("/api/devices/pairing", async (req, res) => {
    const parent = await requireParent(req);
    const { name } = body<{ name: string }>(req);
    const deviceName = typeof name === "string" && name.trim() ? name.trim().slice(0, 60) : "Kid's computer";
    const code = pairingCode();
    const expiresAt = Date.now() + CODE_TTL;

    await run("INSERT INTO pairing_codes (code, parent_id, device_name, expires_at) VALUES (?, ?, ?, ?)",
      [code, parent.id, deviceName, expiresAt]);
    send(res, 201, { code, expiresAt });
  });

  router.patch("/api/devices/:id", async (req, res) => {
    const device = await ownedDevice(req);
    const { name } = body<{ name: string }>(req);
    if (typeof name !== "string" || !name.trim()) throw new HttpError(400, "Name is required");
    await run("UPDATE devices SET name = ? WHERE id = ?", [name.trim().slice(0, 60), device.id]);
    send(res, 204);
  });

  router.delete("/api/devices/:id", async (req, res) => {
    const device = await ownedDevice(req);
    await db.batch([
      { sql: "DELETE FROM logs WHERE device_id = ?", args: [device.id] },
      { sql: "DELETE FROM requests WHERE device_id = ?", args: [device.id] },
      { sql: "DELETE FROM devices WHERE id = ?", args: [device.id] }
    ], "write");
    send(res, 204);
  });

  router.get("/api/devices/:id/policy", async (req, res) => {
    send(res, 200, sanitizePolicy(JSON.parse((await ownedDevice(req)).policy)));
  });

  router.put("/api/devices/:id/policy", async (req, res) => {
    const device = await ownedDevice(req);
    const current = sanitizePolicy(JSON.parse(device.policy));
    const next = sanitizePolicy({ ...current, ...body<Policy>(req) });
    await savePolicy(device.id, next);
    await addLog(device.id, { type: "admin", detail: "Settings updated" });
    send(res, 200, next);
  });

  router.get("/api/devices/:id/requests", async (req, res) => {
    const device = await ownedDevice(req);
    const rows = await all<{ domain: string }>("SELECT domain FROM requests WHERE device_id = ? ORDER BY created_at DESC", [device.id]);
    send(res, 200, rows.map(r => r.domain));
  });

  router.post("/api/devices/:id/requests", async (req, res) => {
    const device = await ownedDevice(req);
    const { domain: raw, approve } = body<{ domain: string; approve: boolean }>(req);
    const domain = normalizeDomain(raw);
    if (!domain) throw new HttpError(400, "Invalid domain");

    const policy = await transaction(async tx => {
      let policy = sanitizePolicy(JSON.parse(device.policy));
      if (approve === true) {
        policy = sanitizePolicy({
          ...policy,
          allowedSites: [...policy.allowedSites, domain],
          blockedSites: policy.blockedSites.filter(d => d !== domain)
        });
        await savePolicy(device.id, policy, tx);
      }
      await run("DELETE FROM requests WHERE device_id = ? AND domain = ?", [device.id, domain], tx);
      await addLog(device.id, { type: "admin", detail: `${approve === true ? "Approved" : "Denied"} ${domain}` }, tx);
      return policy;
    });

    send(res, 200, policy);
  });

  router.get("/api/devices/:id/log", async (req, res) => {
    const device = await ownedDevice(req);
    const rows = await all<Record<string, unknown>>(`
      SELECT ts, type, url, reason, detail FROM logs WHERE device_id = ? ORDER BY ts DESC, id DESC LIMIT ?
    `, [device.id, LOG_PAGE]);
    send(res, 200, rows.map(row => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))));
  });

  router.delete("/api/devices/:id/log", async (req, res) => {
    const device = await ownedDevice(req);
    await run("DELETE FROM logs WHERE device_id = ?", [device.id]);
    send(res, 204);
  });
}
