export type BlockReason =
  | "setup"
  | "schedule"
  | "insecure"
  | "invalid"
  | "ip-address"
  | "blocked-site"
  | "blocked-word"
  | "blocked-content"
  | "not-allowed"
  | "download"
  | "unreachable";

export interface Policy {
  mode: "allowlist" | "blocklist";
  allowedSites: string[];
  blockedSites: string[];
  blockedWords: string[];
  safeSearch: boolean;
  familyDns: "cleanbrowsing" | "cloudflare" | "off";
  scanPageText: boolean;
  blockDownloads: boolean;
  schedule: { enabled: boolean; start: string; end: string };
}

export interface LogEntry {
  ts: number;
  type: "visit" | "blocked" | "admin" | "tamper";
  url?: string;
  reason?: BlockReason;
  detail?: string;
}

export interface Device {
  id: number;
  name: string;
  lastSeen: number | null;
  createdAt: number;
  pending: number;
  online: boolean;
}
