const { app, safeStorage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { normalizeDomain } = require("./filter.cjs");

const OUTBOX_LIMIT = 500;
const MAX_LIST = 2000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DEFAULT_POLICY = {
  mode: "allowlist",
  allowedSites: ["google.com", "wikipedia.org", "kids.nationalgeographic.com", "pbskids.org"],
  blockedSites: [],
  blockedWords: ["porn", "porno", "xxx", "nsfw", "nude", "nudes", "hentai", "gore", "onlyfans", "camgirl", "escort"],
  safeSearch: true,
  familyDns: "cleanbrowsing",
  scanPageText: true,
  blockDownloads: true,
  schedule: { enabled: false, start: "07:00", end: "20:00" }
};

let state = null;
let saveTimer = null;

function file() {
  return path.join(app.getPath("userData"), "guardian.dat");
}

function freshState() {
  return {
    policy: structuredClone(DEFAULT_POLICY),
    device: null,
    requests: [],
    outbox: { requests: [], log: [] }
  };
}

function load() {
  state = freshState();

  let raw;
  try {
    raw = fs.readFileSync(file(), "utf8");
  } catch {
    return;
  }

  try {
    const json = raw.startsWith("enc:")
      ? safeStorage.decryptString(Buffer.from(raw.slice(4), "base64"))
      : raw.replace(/^raw:/, "");
    const parsed = JSON.parse(json);

    state = {
      ...freshState(),
      policy: sanitizePolicy(parsed.policy),
      device: validDevice(parsed.device) ? parsed.device : null,
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      outbox: {
        requests: Array.isArray(parsed.outbox?.requests) ? parsed.outbox.requests : [],
        log: Array.isArray(parsed.outbox?.log) ? parsed.outbox.log : []
      }
    };
  } catch {
    flush();
  }
}

function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;

  const json = JSON.stringify(state);
  const body = safeStorage.isEncryptionAvailable()
    ? `enc:${safeStorage.encryptString(json).toString("base64")}`
    : `raw:${json}`;

  const target = file();
  const tmp = `${target}.tmp`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(tmp, body, { mode: 0o600 });
  fs.renameSync(tmp, target);
}

function save() {
  if (!saveTimer) saveTimer = setTimeout(flush, 500);
}

function domainList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeDomain).filter(Boolean))].slice(0, MAX_LIST);
}

function wordList(value) {
  if (!Array.isArray(value)) return [];
  const words = value
    .filter(word => typeof word === "string")
    .map(word => word.trim().toLowerCase().slice(0, 60))
    .filter(word => word.length >= 2);
  return [...new Set(words)].slice(0, MAX_LIST);
}

function sanitizePolicy(input = {}) {
  const base = structuredClone(DEFAULT_POLICY);
  const p = input && typeof input === "object" ? input : {};
  const schedule = p.schedule && typeof p.schedule === "object" ? p.schedule : {};

  return {
    mode: p.mode === "blocklist" ? "blocklist" : "allowlist",
    allowedSites: "allowedSites" in p ? domainList(p.allowedSites) : base.allowedSites,
    blockedSites: "blockedSites" in p ? domainList(p.blockedSites) : base.blockedSites,
    blockedWords: "blockedWords" in p ? wordList(p.blockedWords) : base.blockedWords,
    safeSearch: p.safeSearch !== false,
    familyDns: ["cleanbrowsing", "cloudflare", "off"].includes(p.familyDns) ? p.familyDns : base.familyDns,
    scanPageText: p.scanPageText !== false,
    blockDownloads: p.blockDownloads !== false,
    schedule: {
      enabled: schedule.enabled === true,
      start: TIME_PATTERN.test(schedule.start) ? schedule.start : base.schedule.start,
      end: TIME_PATTERN.test(schedule.end) ? schedule.end : base.schedule.end
    }
  };
}

function validDevice(device) {
  return Boolean(device && typeof device.token === "string" && Number.isInteger(device.id));
}

function addLog(entry) {
  state.outbox.log.push({ ts: Date.now(), ...entry });
  if (state.outbox.log.length > OUTBOX_LIMIT) state.outbox.log.splice(0, state.outbox.log.length - OUTBOX_LIMIT);
  save();
}

function addRequest(host) {
  const domain = normalizeDomain(host);
  if (!domain || state.requests.includes(domain)) return false;
  state.requests.push(domain);
  state.outbox.requests.push(domain);
  save();
  return true;
}

function pair({ device, token, policy }) {
  state.device = { id: device.id, name: device.name, token };
  state.policy = sanitizePolicy(policy);
  state.requests = [];
  state.outbox = { requests: [], log: [] };
  flush();
}

function unpair() {
  state.device = null;
  state.requests = [];
  state.outbox = { requests: [], log: [] };
  flush();
}

function takeOutbox() {
  return {
    requests: state.outbox.requests.slice(0, 300),
    log: state.outbox.log.slice(0, 300)
  };
}

function applySync(sent, { name, policy, requests }) {
  state.outbox.requests = state.outbox.requests.slice(sent.requests.length);
  state.outbox.log = state.outbox.log.slice(sent.log.length);
  state.device.name = typeof name === "string" ? name : state.device.name;
  state.policy = sanitizePolicy(policy);
  state.requests = [...new Set([
    ...(Array.isArray(requests) ? requests.map(normalizeDomain).filter(Boolean) : []),
    ...state.outbox.requests
  ])];
  save();
}

module.exports = {
  load,
  flush,
  sanitizePolicy,
  addLog,
  addRequest,
  pair,
  unpair,
  takeOutbox,
  applySync,
  get policy() {
    return state.policy;
  },
  get requests() {
    return state.requests;
  },
  get device() {
    return state.device;
  },
  isPaired() {
    return Boolean(state.device);
  }
};
