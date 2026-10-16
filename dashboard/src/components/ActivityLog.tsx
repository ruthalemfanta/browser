import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { api } from "../api";
import type { BlockReason, LogEntry } from "../types";
import { Card } from "./ui";

const REASON_LABEL: Record<BlockReason, string> = {
  "not-allowed": "Not on allowed list",
  "blocked-site": "Blocked site",
  "blocked-word": "Blocked word in address",
  "blocked-content": "Blocked word on page",
  schedule: "Outside browsing hours",
  insecure: "Not HTTPS",
  "ip-address": "IP / local address",
  invalid: "Invalid address",
  download: "Download blocked",
  unreachable: "Failed / filtered by DNS",
  setup: "Not paired"
};

type Filter = "blocked" | "visit" | "admin" | "all";

const FILTER_LABEL: Record<Filter, string> = { blocked: "Blocked", visit: "Visited", admin: "Changes", all: "All" };

export default function ActivityLog({ deviceId }: { deviceId: number }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("blocked");

  function load() {
    api.log(deviceId).then(setEntries).catch(() => {});
  }

  useEffect(load, [deviceId]);

  async function clear() {
    if (!confirm("Clear all activity for this device?")) return;
    await api.clearLog(deviceId).catch(() => {});
    setEntries([]);
  }

  const visible = entries.filter(entry =>
    filter === "all" ||
    entry.type === filter ||
    (filter === "admin" && entry.type === "tamper")
  );

  return (
    <Card title="Activity" hint="Recent visits, blocked attempts and setting changes. Updates whenever the browser syncs.">
      <div className="log-toolbar">
        {(Object.keys(FILTER_LABEL) as Filter[]).map(f => (
          <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>
            {FILTER_LABEL[f]}
          </button>
        ))}
        <button className="push" onClick={load} aria-label="Refresh"><RotateCw size={13} /></button>
        <button className="danger" onClick={clear}>Clear</button>
      </div>

      {visible.length === 0 && <p className="empty-note">Nothing here yet.</p>}
      <ul className="log-list">
        {visible.map((entry, i) => (
          <li key={`${entry.ts}-${i}`} className={`log-${entry.type}`}>
            <time>{new Date(entry.ts).toLocaleString()}</time>
            <span className="log-main">
              {entry.url && <span className="log-url">{entry.url}</span>}
              <span className="log-detail">
                {entry.reason ? REASON_LABEL[entry.reason] ?? entry.reason : ""}
                {entry.reason && entry.detail ? " · " : ""}
                {entry.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
