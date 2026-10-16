export type Policy = {
  mode: "allowlist" | "blocklist";
  allowedSites: string[];
  blockedSites: string[];
  blockedWords: string[];
  safeSearch: boolean;
  familyDns: "cleanbrowsing" | "cloudflare" | "off";
  scanPageText: boolean;
  blockDownloads: boolean;
  schedule: { enabled: boolean; start: string; end: string };
};

const MAX_LIST = 2000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOST = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

export const DEFAULT_POLICY: Policy = {
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

export function normalizeDomain(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase().slice(0, 300);
  try {
    const host = new URL(/^[a-z]+:\/\//.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, "");
    return HOST.test(host) ? host : null;
  } catch {
    return null;
  }
}

function domainList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeDomain).filter((d): d is string => Boolean(d)))].slice(0, MAX_LIST);
}

function wordList(value: unknown) {
  if (!Array.isArray(value)) return [];
  const words = value
    .filter((word): word is string => typeof word === "string")
    .map(word => word.trim().toLowerCase().slice(0, 60))
    .filter(word => word.length >= 2);
  return [...new Set(words)].slice(0, MAX_LIST);
}

export function sanitizePolicy(input: unknown): Policy {
  const base = DEFAULT_POLICY;
  const p = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const schedule = (p.schedule && typeof p.schedule === "object" ? p.schedule : {}) as Record<string, unknown>;
  const familyDns = p.familyDns as Policy["familyDns"];

  return {
    mode: p.mode === "blocklist" ? "blocklist" : "allowlist",
    allowedSites: "allowedSites" in p ? domainList(p.allowedSites) : [...base.allowedSites],
    blockedSites: "blockedSites" in p ? domainList(p.blockedSites) : [...base.blockedSites],
    blockedWords: "blockedWords" in p ? wordList(p.blockedWords) : [...base.blockedWords],
    safeSearch: p.safeSearch !== false,
    familyDns: ["cleanbrowsing", "cloudflare", "off"].includes(familyDns) ? familyDns : base.familyDns,
    scanPageText: p.scanPageText !== false,
    blockDownloads: p.blockDownloads !== false,
    schedule: {
      enabled: schedule.enabled === true,
      start: TIME_PATTERN.test(String(schedule.start)) ? String(schedule.start) : base.schedule.start,
      end: TIME_PATTERN.test(String(schedule.end)) ? String(schedule.end) : base.schedule.end
    }
  };
}
