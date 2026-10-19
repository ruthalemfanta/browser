import crypto from "node:crypto";
import type { ServerResponse } from "node:http";
import { get, run } from "./db.ts";
import { HttpError, isSecure, type Req } from "./http.ts";

const SESSION_COOKIE = "sid";
const SESSION_TTL = 30 * 24 * 60 * 60_000;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "base64");
  const actual = crypto.scryptSync(password, Buffer.from(salt, "base64"), 64, SCRYPT);
  return crypto.timingSafeEqual(expected, actual);
}

const DUMMY_HASH = hashPassword(randomToken());

export function checkPassword(password: string, stored: string | undefined) {
  const ok = verifyPassword(password, stored ?? DUMMY_HASH);
  return Boolean(stored) && ok;
}

function cookies(req: Req) {
  const header = req.headers.cookie ?? "";
  return Object.fromEntries(
    header.split(";").map(part => {
      const i = part.indexOf("=");
      return [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
    })
  );
}

function setCookie(req: Req, res: ServerResponse, value: string, maxAgeMs: number) {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`
  ];
  if (isSecure(req)) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export async function startSession(req: Req, res: ServerResponse, parentId: number) {
  const token = randomToken();
  await run("INSERT INTO sessions (token_hash, parent_id, expires_at) VALUES (?, ?, ?)", [sha256(token), parentId, Date.now() + SESSION_TTL]);
  setCookie(req, res, token, SESSION_TTL);
}

export async function endSession(req: Req, res: ServerResponse) {
  const token = cookies(req)[SESSION_COOKIE];
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
  setCookie(req, res, "", 0);
}

export async function requireParent(req: Req) {
  const token = cookies(req)[SESSION_COOKIE];
  if (!token) throw new HttpError(401, "Not signed in");

  const row = await get<{ id: number; email: string }>(`
    SELECT p.id, p.email FROM sessions s JOIN parents p ON p.id = s.parent_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `, [sha256(token), Date.now()]);

  if (!row) throw new HttpError(401, "Not signed in");
  return row;
}

export async function requireDevice(req: Req) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Missing device token");

  const row = await get<{ id: number; name: string; policy: string }>(
    "SELECT id, name, policy FROM devices WHERE token_hash = ?", [sha256(token)]);

  if (!row) throw new HttpError(401, "Device not paired");
  return row;
}
