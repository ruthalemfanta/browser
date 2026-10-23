import { useState, type ReactNode } from "react";
import type { Device, LogEntry, Policy } from "../../../dashboard/src/types";

// The real components talk to Electron (window.browserAPI) and the parent
// server (/api/*). Neither exists inside a design, so this in-memory fake
// stands in for both. Installed with defaults on load; <DemoBackend> reseeds it.

export type DemoBackendProps = {
  /** Kids' browser state (tabs, approved sites, setup lock). Merged over the defaults. */
  browser?: Partial<BrowserState>;
  /** Parent account email; null renders signed-out flows. */
  account?: string | null;
  devices?: Device[];
  /** Policy applied to every device. Merged over the defaults. */
  policy?: Partial<Policy>;
  /** Pending website requests for every device. */
  requests?: string[];
  log?: LogEntry[];
  children?: ReactNode;
};

const HOUR = 3_600_000;

function defaults() {
  const now = Date.now();
  return {
    browser: {
      tabs: [{ id: 1, title: "New Tab", url: "", loading: false, showingPage: false, blocked: null }],
      activeTabId: 1,
      pendingSites: [],
      approvedSites: ["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "khanacademy.org", "scratch.mit.edu", "starfall.com"],
      mode: "allowlist",
      setupRequired: false
    } as BrowserState,
    account: "sam.parent@example.com" as string | null,
    devices: [
      { id: 1, name: "Maya's laptop", lastSeen: now - 4 * 60_000, createdAt: now - 30 * 24 * HOUR, pending: 2, online: true },
      { id: 2, name: "Leo's desktop", lastSeen: now - 26 * HOUR, createdAt: now - 12 * 24 * HOUR, pending: 0, online: false }
    ] as Device[],
    policy: {
      mode: "allowlist",
      allowedSites: ["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "khanacademy.org", "scratch.mit.edu", "starfall.com"],
      blockedSites: ["tiktok.com", "reddit.com"],
      blockedWords: ["violence", "gambling", "casino"],
      safeSearch: true,
      familyDns: "cleanbrowsing",
      scanPageText: true,
      blockDownloads: true,
      schedule: { enabled: true, start: "07:00", end: "19:30" }
    } as Policy,
    requests: ["minecraft.net", "coolmathgames.com"],
    log: [
      { ts: now - 5 * 60_000, type: "blocked", url: "https://minecraft.net/", reason: "not-allowed" },
      { ts: now - 18 * 60_000, type: "visit", url: "https://pbskids.org/games" },
      { ts: now - 42 * 60_000, type: "blocked", url: "https://www.google.com/search?q=casino+games", reason: "blocked-word", detail: "casino" },
      { ts: now - 2 * HOUR, type: "admin", detail: "Allowed scratch.mit.edu" },
      { ts: now - 3 * HOUR, type: "visit", url: "https://kids.nationalgeographic.com/animals" }
    ] as LogEntry[]
  };
}

let store = defaults();
const listeners = new Set<(state: BrowserState) => void>();
let nextTabId = 2;

function emit() {
  const snapshot = structuredClone(store.browser);
  listeners.forEach(fn => fn(snapshot));
}

function activeTab() {
  return store.browser.tabs.find(t => t.id === store.browser.activeTabId);
}

function hostOf(url: string) {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const browserAPI: Window["browserAPI"] = {
  getState: async () => structuredClone(store.browser),
  newTab: async () => {
    const id = nextTabId++;
    store.browser.tabs.push({ id, title: "New Tab", url: "", loading: false, showingPage: false, blocked: null });
    store.browser.activeTabId = id;
    emit();
    return id;
  },
  activateTab: async id => {
    store.browser.activeTabId = id;
    emit();
    return true;
  },
  closeTab: async id => {
    store.browser.tabs = store.browser.tabs.filter(t => t.id !== id);
    if (store.browser.activeTabId === id) store.browser.activeTabId = store.browser.tabs.at(-1)?.id ?? null;
    emit();
    return true;
  },
  navigate: async value => {
    const tab = activeTab();
    if (!tab) return false;
    const isUrl = /\.[a-z]{2,}/i.test(value) && !/\s/.test(value);
    const url = isUrl ? (value.includes("://") ? value : `https://${value}`) : `https://search.wonderly.kids/?q=${encodeURIComponent(value)}`;
    const host = hostOf(url);
    const allowed = !isUrl || store.browser.mode === "blocklist" || store.browser.approvedSites.some(s => host === s || host.endsWith(`.${s}`));
    Object.assign(tab, {
      url,
      title: isUrl ? host : `${value} – Search`,
      showingPage: false,
      blocked: allowed ? null : { url, host, reason: "not-allowed" }
    });
    emit();
    if (allowed) setTimeout(() => { tab.showingPage = true; emit(); }, 900);
    return true;
  },
  back: async () => {},
  forward: async () => {},
  reload: async () => {},
  showHome: async () => {
    const tab = activeTab();
    if (tab) Object.assign(tab, { url: "", title: "New Tab", showingPage: false, blocked: null });
    emit();
    return true;
  },
  dismissBlock: async () => true,
  setOverlay: async () => {},
  requestSite: async domain => {
    store.browser.pendingSites.push(domain);
    return true;
  },
  pair: async code => {
    if (code.replace(/\s/g, "").length < 8) return { ok: false, error: "That code doesn't look right." };
    store.browser.setupRequired = false;
    emit();
    return { ok: true };
  },
  onTabsChanged: callback => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }
};

function json(body: unknown, status = 200) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: body === undefined ? 204 : status,
    headers: { "Content-Type": "application/json" }
  });
}

function handle(method: string, path: string, body: Record<string, unknown>) {
  if (path === "/auth/me") return store.account ? json({ email: store.account }) : json({ error: "Not signed in" }, 401);
  if (path === "/auth/login" || path === "/auth/signup") {
    store.account = String(body.email || "parent@example.com");
    return json({ email: store.account });
  }
  if (path === "/auth/logout") {
    store.account = null;
    return json(undefined);
  }
  if (path === "/devices") return json(store.devices);
  if (path === "/devices/pairing") {
    return json({ code: "K7QM4XPA", expiresAt: Date.now() + 10 * 60_000 });
  }
  const match = /^\/devices\/(\d+)(?:\/(\w+))?$/.exec(path);
  if (!match) return json({ error: "Not found" }, 404);
  const id = Number(match[1]);
  const device = store.devices.find(d => d.id === id);
  switch (`${method} ${match[2] ?? ""}`) {
    case "PATCH ":
      if (device) device.name = String(body.name);
      return json(undefined);
    case "DELETE ":
      store.devices = store.devices.filter(d => d.id !== id);
      return json(undefined);
    case "GET policy":
      return json(store.policy);
    case "PUT policy":
      store.policy = { ...store.policy, ...body } as Policy;
      return json(store.policy);
    case "GET requests":
      return json(store.requests);
    case "POST requests": {
      const domain = String(body.domain);
      store.requests = store.requests.filter(d => d !== domain);
      if (body.approve) store.policy = { ...store.policy, allowedSites: [...store.policy.allowedSites, domain] };
      if (device) device.pending = store.requests.length;
      return json(store.policy);
    }
    case "GET log":
      return json(store.log);
    case "DELETE log":
      store.log = [];
      return json(undefined);
  }
  return json({ error: "Not found" }, 404);
}

function install() {
  if (typeof window === "undefined" || (window as { __wonderlyDemo?: boolean }).__wonderlyDemo) return;
  (window as { __wonderlyDemo?: boolean }).__wonderlyDemo = true;
  window.browserAPI = browserAPI;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const path = url.startsWith("/api/") ? url.slice(4) : null;
    if (path === null) return realFetch(input, init);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    return handle((init?.method ?? "GET").toUpperCase(), path, body);
  };
}

install();

/** Reseeds the in-memory fake behind window.browserAPI and /api/* with your own data. */
export function configureDemoBackend(options: Omit<DemoBackendProps, "children"> = {}) {
  const base = defaults();
  store = {
    browser: { ...base.browser, ...options.browser },
    account: options.account === undefined ? base.account : options.account,
    devices: options.devices ?? base.devices,
    policy: { ...base.policy, ...options.policy },
    requests: options.requests ?? base.requests,
    log: options.log ?? base.log
  };
  emit();
}

/** Seeds the fake browser + parent-server data the components read on mount. Optional: sensible defaults load automatically. Use one per screen; it is global state. */
export function DemoBackend({ children, ...options }: DemoBackendProps) {
  useState(() => configureDemoBackend(options));
  return <>{children}</>;
}
