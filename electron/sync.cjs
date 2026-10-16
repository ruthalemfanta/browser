const { app } = require("electron");
const store = require("./store.cjs");

const PRODUCTION_SERVER_URL = require("../package.json").serverUrl || "";
const SYNC_INTERVAL = 15_000;
const REQUEST_TIMEOUT = 10_000;

class ConfigError extends Error {}

function serverUrl() {
  const value = process.env.GUARDIAN_SERVER_URL || (app.isPackaged ? PRODUCTION_SERVER_URL : "http://127.0.0.1:8787");
  if (!URL.canParse(value)) throw new ConfigError("No parent server is configured for this browser.");
  const url = new URL(value);
  const local = ["127.0.0.1", "localhost"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) throw new ConfigError("The parent server must use https.");
  return url.origin;
}

async function call(path, body, token) {
  const response = await fetch(`${serverUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT)
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

function createSync({ onPolicyChanged, onUnpaired }) {
  let inflight = null;
  let soonTimer = null;

  async function run() {
    const device = store.device;
    if (!device) return;

    const sent = store.takeOutbox();
    const previous = store.policy;

    try {
      const { status, ok, data } = await call("/api/device/sync", sent, device.token);
      if (store.device !== device) return;

      if (status === 401) {
        store.unpair();
        onUnpaired();
        return;
      }
      if (!ok) return;

      store.applySync(sent, data);
      onPolicyChanged(previous);
    } catch {
      // Offline: keep enforcing the cached policy and retry on the next tick.
    }
  }

  function now() {
    if (!inflight) inflight = run().finally(() => { inflight = null; });
    return inflight;
  }

  function soon() {
    clearTimeout(soonTimer);
    soonTimer = setTimeout(now, 1000);
  }

  async function pair(code) {
    try {
      const { ok, data } = await call("/api/device/pair", { code: String(code ?? "").slice(0, 32) });
      if (!ok) return { ok: false, error: data.error || "Pairing failed" };
      const previous = store.policy;
      store.pair(data);
      onPolicyChanged(previous);
      return { ok: true };
    } catch (error) {
      if (error instanceof ConfigError) return { ok: false, error: error.message };
      return { ok: false, error: "Couldn't reach the parent server. Check the internet connection." };
    }
  }

  function start() {
    now();
    setInterval(now, SYNC_INTERVAL);
  }

  return { start, now, soon, pair };
}

module.exports = { createSync };
