import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { LogEntry, Policy } from "../../src/types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const now = Date.now();

export type Kid = {
  id: number;
  name: string;
  child: string;
  color: string;
  online: boolean;
  lastSeen: number;
};

export type Request = { deviceId: number; domain: string; ts: number; leaving?: boolean };

const KIDS: Kid[] = [
  { id: 1, name: "Maya's MacBook", child: "Maya", color: "var(--sky)", online: true, lastSeen: now - 2 * MIN },
  { id: 2, name: "Leo's laptop", child: "Leo", color: "var(--pink)", online: false, lastSeen: now - 3 * HOUR },
  { id: 3, name: "Living room PC", child: "Family", color: "var(--sun)", online: true, lastSeen: now - 30_000 }
];

const BASE: Policy = {
  mode: "blocklist",
  allowedSites: [],
  blockedSites: [],
  blockedWords: ["casino", "vape", "gore"],
  safeSearch: true,
  familyDns: "cleanbrowsing",
  scanPageText: true,
  blockDownloads: true,
  schedule: { enabled: false, start: "07:00", end: "20:30" }
};

const POLICIES: Record<number, Policy> = {
  1: {
    ...BASE,
    mode: "allowlist",
    allowedSites: ["pbskids.org", "wikipedia.org", "duolingo.com", "code.org", "nationalgeographic.com", "brainpop.com"],
    blockedSites: ["tiktok.com"],
    schedule: { enabled: true, start: "07:00", end: "20:30" }
  },
  2: {
    ...BASE,
    blockedSites: ["tiktok.com", "discord.com", "twitch.tv"],
    familyDns: "cloudflare",
    scanPageText: false,
    blockDownloads: false
  },
  3: { ...BASE, blockedSites: ["tiktok.com"] }
};

const REQUESTS: Request[] = [
  { deviceId: 1, domain: "scratch.mit.edu", ts: now - 12 * MIN },
  { deviceId: 1, domain: "khanacademy.org", ts: now - 41 * MIN },
  { deviceId: 2, domain: "minecraft.net", ts: now - 3 * HOUR - 5 * MIN }
];

const LOGS: Record<number, LogEntry[]> = {
  1: [
    { ts: now - 12 * MIN, type: "blocked", url: "https://scratch.mit.edu/projects/editor", reason: "not-allowed" },
    { ts: now - 18 * MIN, type: "visit", url: "https://www.duolingo.com/learn" },
    { ts: now - 26 * MIN, type: "visit", url: "https://en.wikipedia.org/wiki/Octopus" },
    { ts: now - 41 * MIN, type: "blocked", url: "https://www.khanacademy.org/math", reason: "not-allowed" },
    { ts: now - 55 * MIN, type: "blocked", url: "https://www.google.com/search?q=free+vape", reason: "blocked-word", detail: "vape" },
    { ts: now - 2 * HOUR, type: "visit", url: "https://pbskids.org/games" },
    { ts: now - 5 * HOUR, type: "admin", detail: "Browsing hours set to 07:00–20:30" }
  ],
  2: [
    { ts: now - 3 * HOUR - 5 * MIN, type: "blocked", url: "https://www.minecraft.net/en-us", reason: "unreachable" },
    { ts: now - 3 * HOUR - 20 * MIN, type: "visit", url: "https://www.youtube.com/watch?v=lego" },
    { ts: now - 3 * HOUR - 32 * MIN, type: "blocked", url: "https://discord.com/app", reason: "blocked-site" },
    { ts: now - 4 * HOUR, type: "tamper", detail: "Tried to change system DNS" }
  ],
  3: [
    { ts: now - 4 * MIN, type: "visit", url: "https://www.bbc.co.uk/bitesize" },
    { ts: now - 20 * MIN, type: "blocked", url: "https://www.tiktok.com/", reason: "blocked-site" },
    { ts: now - 90 * MIN, type: "visit", url: "https://www.recipetineats.com/" }
  ]
};

export type Toast = { id: number; message: string; undo?: () => void };

function useFamilyState() {
  const [kids] = useState(KIDS);
  const [policies, setPolicies] = useState(POLICIES);
  const [requests, setRequests] = useState(REQUESTS);
  const [logs] = useState(LOGS);
  const [toast, setToast] = useState<Toast | null>(null);
  const [savedAt, setSavedAt] = useState(0);
  const toastTimer = useRef<number>(undefined);

  const showToast = useCallback((message: string, undo?: () => void) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  const update = useCallback((deviceId: number, patch: Partial<Policy>) => {
    setPolicies(all => ({ ...all, [deviceId]: { ...all[deviceId], ...patch } }));
    setSavedAt(Date.now());
  }, []);

  const resolve = useCallback((request: Request, approve: boolean) => {
    const before = policies[request.deviceId];
    const match = (r: Request) => r.deviceId === request.deviceId && r.domain === request.domain;
    setRequests(list => list.map(r => (match(r) ? { ...r, leaving: true } : r)));
    window.setTimeout(() => setRequests(list => list.filter(r => !match(r))), 200);
    if (approve) {
      setPolicies(all => ({
        ...all,
        [request.deviceId]: { ...before, allowedSites: [...new Set([...before.allowedSites, request.domain])] }
      }));
    }
    showToast(`${approve ? "Approved" : "Denied"} ${request.domain}`, () => {
      setPolicies(all => ({ ...all, [request.deviceId]: before }));
      setRequests(list => [...list.filter(r => !match(r)), { ...request, leaving: false }].sort((a, b) => b.ts - a.ts));
      setToast(null);
    });
  }, [policies, showToast]);

  return { kids, policies, requests, logs, toast, savedAt, update, resolve, dismissToast: () => setToast(null) };
}

export type Family = ReturnType<typeof useFamilyState>;

const FamilyContext = createContext<Family | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  return <FamilyContext.Provider value={useFamilyState()}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  return useContext(FamilyContext)!;
}

export function ago(ts: number) {
  const diff = Date.now() - ts;
  if (diff < MIN) return "just now";
  if (diff < HOUR) return `${Math.round(diff / MIN)} min ago`;
  if (diff < 24 * HOUR) return `${Math.round(diff / HOUR)} h ago`;
  return new Date(ts).toLocaleDateString();
}

export function todayStats(entries: LogEntry[]) {
  return {
    visits: entries.filter(e => e.type === "visit").length,
    blocked: entries.filter(e => e.type === "blocked").length
  };
}
