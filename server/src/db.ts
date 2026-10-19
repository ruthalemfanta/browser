import fs from "node:fs";
import { createClient, type InArgs, type Transaction } from "@libsql/client";
import { config } from "./config.ts";

if (config.databaseUrl.startsWith("file:")) fs.mkdirSync(config.dataDir, { recursive: true });

export const db = createClient({ url: config.databaseUrl, authToken: config.databaseAuthToken, intMode: "number" });

export type Executor = Pick<Transaction, "execute">;

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    policy TEXT NOT NULL,
    last_seen INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pairing_codes (
    code TEXT PRIMARY KEY,
    parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (device_id, domain)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    ts INTEGER NOT NULL,
    type TEXT NOT NULL,
    url TEXT,
    reason TEXT,
    detail TEXT
  );

  CREATE INDEX IF NOT EXISTS logs_device_ts ON logs (device_id, ts DESC);
`);

export async function run(sql: string, args: InArgs = [], exec: Executor = db) {
  return exec.execute({ sql, args });
}

export async function all<T>(sql: string, args: InArgs = [], exec: Executor = db) {
  return (await run(sql, args, exec)).rows as unknown as T[];
}

export async function get<T>(sql: string, args: InArgs = [], exec: Executor = db) {
  return (await all<T>(sql, args, exec))[0] as T | undefined;
}

export async function transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const tx = await db.transaction("write");
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } finally {
    tx.close();
  }
}

setInterval(() => {
  const now = Date.now();
  db.batch([
    { sql: "DELETE FROM sessions WHERE expires_at <= ?", args: [now] },
    { sql: "DELETE FROM pairing_codes WHERE expires_at <= ?", args: [now] }
  ], "write").catch(error => console.error(error));
}, 60 * 60_000).unref();
