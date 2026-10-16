import crypto from "node:crypto";
import { checkPassword, endSession, hashPassword, requireParent, startSession } from "../auth.ts";
import { db, transaction } from "../db.ts";
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

function ownedDevice(req: Req) {
  const parent = requireParent(req);
  const id = Number(req.params.id);
  const device = db.prepare("SELECT id, name, policy, last_seen, created_at FROM devices WHERE id = ? AND parent_id = ?")
    .get(id, parent.id) as DeviceRow | undefined;
  if (!device) throw new HttpError(404, "Device not found");
  return device;
}

function savePolicy(deviceId: number, policy: Policy) {
  db.prepare("UPDATE devices SET policy = ? WHERE id = ?").run(JSON.stringify(policy), deviceId);
}

function pairingCode() {
  const bytes = crypto.randomBytes(8);
  return [...bytes].map(b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function parentRoutes(router: Router) {
  router.post("/api/auth/signup", (req, res) => {
    signupLimit(clientIp(req));
    const { email, password } = credentials(req);
    if (!EMAIL.test(email) || email.length > 254) throw new HttpError(400, "Enter a valid email");
    if (password.length < 10 || password.length > 200) throw new HttpError(400, "Password must be at least 10 characters");

    const exists = db.prepare("SELECT 1 FROM parents WHERE email = ?").get(email);
    if (exists) throw new HttpError(409, "An account with this email already exists");

    const { lastInsertRowid } = db.prepare("INSERT INTO parents (email, password_hash, created_at) VALUES (?, ?, ?)")
      .run(email, hashPassword(password), Date.now());
    startSession(req, res, Number(lastInsertRowid));
    send(res, 201, { email });
  });

  router.post("/api/auth/login", (req, res) => {
    const { email, password } = credentials(req);
    loginLimit(`${clientIp(req)}:${email}`);

    const parent = db.prepare("SELECT id, password_hash FROM parents WHERE email = ?")
      .get(email) as { id: number; password_hash: string } | undefined;
    if (!checkPassword(password, parent?.password_hash) || !parent) throw new HttpError(401, "Wrong email or password");

    startSession(req, res, parent.id);
    send(res, 200, { email });
  });

  router.post("/api/auth/logout", (req, res) => {
    endSession(req, res);
    send(res, 204);
  });

  router.get("/api/auth/me", (req, res) => {
    const { email } = requireParent(req);
    send(res, 200, { email });
  });

  router.get("/api/devices", (req, res) => {
    const parent = requireParent(req);
    const rows = db.prepare(`
      SELECT d.id, d.name, d.last_seen AS lastSeen, d.created_at AS createdAt,
        (SELECT COUNT(*) FROM requests r WHERE r.device_id = d.id) AS pending
      FROM devices d WHERE d.parent_id = ? ORDER BY d.created_at
    `).all(parent.id) as { lastSeen: number | null }[];
    const now = Date.now();
    send(res, 200, rows.map(row => ({ ...row, online: row.lastSeen !== null && now - row.lastSeen < ONLINE_WINDOW })));
  });

  router.post("/api/devices/pairing", (req, res) => {
    const parent = requireParent(req);
    const { name } = body<{ name: string }>(req);
    const deviceName = typeof name === "string" && name.trim() ? name.trim().slice(0, 60) : "Kid's computer";
    const code = pairingCode();
    const expiresAt = Date.now() + CODE_TTL;

    db.prepare("INSERT INTO pairing_codes (code, parent_id, device_name, expires_at) VALUES (?, ?, ?, ?)")
      .run(code, parent.id, deviceName, expiresAt);
    send(res, 201, { code, expiresAt });
  });

  router.patch("/api/devices/:id", (req, res) => {
    const device = ownedDevice(req);
    const { name } = body<{ name: string }>(req);
    if (typeof name !== "string" || !name.trim()) throw new HttpError(400, "Name is required");
    db.prepare("UPDATE devices SET name = ? WHERE id = ?").run(name.trim().slice(0, 60), device.id);
    send(res, 204);
  });

  router.delete("/api/devices/:id", (req, res) => {
    const device = ownedDevice(req);
    db.prepare("DELETE FROM devices WHERE id = ?").run(device.id);
    send(res, 204);
  });

  router.get("/api/devices/:id/policy", (req, res) => {
    send(res, 200, sanitizePolicy(JSON.parse(ownedDevice(req).policy)));
  });

  router.put("/api/devices/:id/policy", (req, res) => {
    const device = ownedDevice(req);
    const current = sanitizePolicy(JSON.parse(device.policy));
    const next = sanitizePolicy({ ...current, ...body<Policy>(req) });
    savePolicy(device.id, next);
    addLog(device.id, { type: "admin", detail: "Settings updated" });
    send(res, 200, next);
  });

  router.get("/api/devices/:id/requests", (req, res) => {
    const device = ownedDevice(req);
    const rows = db.prepare("SELECT domain FROM requests WHERE device_id = ? ORDER BY created_at DESC")
      .all(device.id) as { domain: string }[];
    send(res, 200, rows.map(r => r.domain));
  });

  router.post("/api/devices/:id/requests", (req, res) => {
    const device = ownedDevice(req);
    const { domain: raw, approve } = body<{ domain: string; approve: boolean }>(req);
    const domain = normalizeDomain(raw);
    if (!domain) throw new HttpError(400, "Invalid domain");

    const policy = transaction(() => {
      let policy = sanitizePolicy(JSON.parse(device.policy));
      if (approve === true) {
        policy = sanitizePolicy({
          ...policy,
          allowedSites: [...policy.allowedSites, domain],
          blockedSites: policy.blockedSites.filter(d => d !== domain)
        });
        savePolicy(device.id, policy);
      }
      db.prepare("DELETE FROM requests WHERE device_id = ? AND domain = ?").run(device.id, domain);
      addLog(device.id, { type: "admin", detail: `${approve === true ? "Approved" : "Denied"} ${domain}` });
      return policy;
    });

    send(res, 200, policy);
  });

  router.get("/api/devices/:id/log", (req, res) => {
    const device = ownedDevice(req);
    const rows = db.prepare(`
      SELECT ts, type, url, reason, detail FROM logs WHERE device_id = ? ORDER BY ts DESC, id DESC LIMIT ?
    `).all(device.id, LOG_PAGE);
    send(res, 200, rows.map(row => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null))));
  });

  router.delete("/api/devices/:id/log", (req, res) => {
    const device = ownedDevice(req);
    db.prepare("DELETE FROM logs WHERE device_id = ?").run(device.id);
    send(res, 204);
  });
}
