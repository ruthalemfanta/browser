import { useEffect, useState } from "react";
import { Activity, Ban, Check, Globe, Inbox, ListChecks, Settings, ShieldCheck, Type, X } from "lucide-react";
import ListEditor from "../../src/components/ListEditor";
import { Card, Toggle } from "../../src/components/ui";
import { normalizeDomain } from "../../src/lib/domain";
import type { BlockReason, LogEntry } from "../../src/types";
import { ago, useFamily, type Kid, type Request } from "./store";

export type Section = "requests" | "sites" | "words" | "protection" | "activity" | "device";

export const SECTIONS: { id: Section; label: string; blurb: string; icon: typeof Globe }[] = [
  { id: "requests", label: "Requests", blurb: "Sites waiting for your OK.", icon: Inbox },
  { id: "sites", label: "Websites", blurb: "What can and can't be opened.", icon: Globe },
  { id: "words", label: "Blocked words", blurb: "Words that block a search or page.", icon: Type },
  { id: "protection", label: "Protection", blurb: "SafeSearch, family DNS and browsing hours.", icon: ShieldCheck },
  { id: "activity", label: "Activity", blurb: "Recent visits and blocked attempts.", icon: Activity },
  { id: "device", label: "Device", blurb: "Name, pairing and removal.", icon: Settings }
];

const DNS_OPTIONS = [
  ["cleanbrowsing", "CleanBrowsing Family", "Blocks adult, mixed content, proxies/VPNs; enforces SafeSearch."],
  ["cloudflare", "Cloudflare for Families", "Blocks adult content and malware."],
  ["off", "Off", "Use the computer's normal DNS."]
] as const;

const REASON: Partial<Record<BlockReason, string>> = {
  "not-allowed": "Not on allowed list",
  "blocked-site": "Blocked site",
  "blocked-word": "Blocked word",
  unreachable: "Filtered by family DNS"
};

export function Avatar({ kid, size = 28 }: { kid: Kid; size?: number }) {
  return (
    <span className="p-avatar" style={{ background: kid.color, width: size, height: size, fontSize: size * 0.42 }}>
      {kid.child[0]}
    </span>
  );
}

export function Status({ kid }: { kid: Kid }) {
  return (
    <span className={`p-status ${kid.online ? "on" : ""}`}>
      <i />
      <span>{kid.online ? "Online" : "Offline"} · synced {ago(kid.lastSeen)}</span>
    </span>
  );
}

export function OfflineNote({ kid }: { kid: Kid }) {
  if (kid.online) return null;
  return (
    <p className="p-offline">
      {kid.name} is offline. Changes you make here apply the next time it connects.
    </p>
  );
}

export function SaveStatus() {
  const { savedAt } = useFamily();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1600);
    return () => window.clearTimeout(t);
  }, [savedAt]);
  return (
    <span className="p-saved" data-visible={visible || undefined} aria-live="polite">
      <Check size={13} /> Saved
    </span>
  );
}

export function ToastHost() {
  const { toast, dismissToast } = useFamily();
  if (!toast) return null;
  return (
    <div className="p-toast" key={toast.id} role="status">
      <span>{toast.message}</span>
      {toast.undo && <button onClick={toast.undo}>Undo</button>}
      <button className="p-toast-x" aria-label="Dismiss" onClick={dismissToast}><X size={14} /></button>
    </div>
  );
}

export function RequestRows({ requests, showKid }: { requests: Request[]; showKid?: boolean }) {
  const { kids, resolve } = useFamily();
  return (
    <div className="p-requests">
      {requests.map(r => {
        const kid = kids.find(k => k.id === r.deviceId)!;
        return (
          <div className="p-req" data-leaving={r.leaving || undefined} key={`${r.deviceId}-${r.domain}`}>
            <div className="p-req-inner">
              {showKid && <Avatar kid={kid} size={26} />}
              <span className="p-req-text">
                <strong>{r.domain}</strong>
                <small>{showKid ? `${kid.child} · ` : ""}asked {ago(r.ts)}</small>
              </span>
              <button className="p-btn primary-sm" onClick={() => resolve(r, true)}><Check size={15} /> Allow</button>
              <button className="p-btn quiet" onClick={() => resolve(r, false)}>Deny</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LogRows({ entries, showKid, limit }: { entries: (LogEntry & { kid?: Kid })[]; showKid?: boolean; limit?: number }) {
  return (
    <ul className="p-log">
      {entries.slice(0, limit).map((e, i) => (
        <li key={i} className={`p-log-${e.type}`}>
          {showKid && e.kid && <Avatar kid={e.kid} size={20} />}
          <span className="p-log-main">
            <span className="p-log-url">{e.url ? new URL(e.url).hostname.replace(/^www\./, "") : e.detail}</span>
            <small>
              {e.type === "blocked" ? REASON[e.reason!] ?? "Blocked" : e.type === "visit" ? "Visited" : e.type === "tamper" ? "Tamper attempt" : "Setting changed"}
              {e.type === "blocked" && e.detail ? ` · “${e.detail}”` : ""}
            </small>
          </span>
          <time>{ago(e.ts)}</time>
        </li>
      ))}
    </ul>
  );
}

export function SectionBody({ kid, section }: { kid: Kid; section: Section }) {
  const { policies, requests, logs, update } = useFamily();
  const policy = policies[kid.id];
  const set = (patch: Parameters<typeof update>[1]) => update(kid.id, patch);
  const mine = requests.filter(r => r.deviceId === kid.id);
  const [filter, setFilter] = useState<"blocked" | "all">("blocked");

  if (section === "requests") {
    return (
      <Card title="Waiting for you" hint="Sites your child tried to open that aren't allowed yet.">
        {mine.length === 0 ? <p className="empty-note">You're all caught up.</p> : <RequestRows requests={mine} />}
      </Card>
    );
  }

  if (section === "sites") {
    return (
      <>
        <Card title="Filtering mode">
          <div className="mode-grid">
            <button className={`mode-card ${policy.mode === "allowlist" ? "selected" : ""}`} onClick={() => set({ mode: "allowlist" })}>
              <ListChecks size={20} />
              <strong>Approved sites only</strong>
              <small>Safest. Every other website needs your approval.</small>
            </button>
            <button className={`mode-card ${policy.mode === "blocklist" ? "selected" : ""}`} onClick={() => set({ mode: "blocklist" })}>
              <Ban size={20} />
              <strong>Block specific sites</strong>
              <small>Everything is open except blocked sites and words.</small>
            </button>
          </div>
        </Card>
        {policy.mode === "allowlist" && (
          <Card title="Allowed websites" hint="Only these sites (and their subdomains) can be opened.">
            {policy.allowedSites.length === 0 && <p className="p-warn">Nothing can be opened until you add a site.</p>}
            <ListEditor
              items={policy.allowedSites}
              onChange={allowedSites => set({ allowedSites })}
              normalize={normalizeDomain}
              placeholder="e.g. pbskids.org"
              emptyText=""
            />
          </Card>
        )}
        <Card title="Blocked websites" hint="Always blocked, in every mode.">
          <ListEditor
            items={policy.blockedSites}
            onChange={blockedSites => set({ blockedSites })}
            normalize={normalizeDomain}
            placeholder="e.g. example.com"
            emptyText="No blocked sites."
          />
        </Card>
      </>
    );
  }

  if (section === "words") {
    return (
      <Card title="Blocked words" hint="Searches and addresses containing these are blocked. Ignores capitals, accents and tricks like “p0rn”.">
        <ListEditor
          items={policy.blockedWords}
          onChange={blockedWords => set({ blockedWords })}
          placeholder="Add a word or phrase"
          emptyText="No blocked words."
        />
        <Toggle
          checked={policy.scanPageText}
          onChange={scanPageText => set({ scanPageText })}
          label="Also scan page text"
          hint="Pages stay hidden until checked, and are blocked if a word appears in the text or image descriptions."
        />
      </Card>
    );
  }

  if (section === "protection") {
    return (
      <>
        <Card title="Search & downloads">
          <Toggle checked={policy.safeSearch} onChange={safeSearch => set({ safeSearch })} label="Force SafeSearch" hint="Strict SafeSearch on Google, Bing, DuckDuckGo, Yahoo; YouTube Restricted Mode." />
          <Toggle checked={policy.blockDownloads} onChange={blockDownloads => set({ blockDownloads })} label="Block downloads" hint="Prevents saving files or installers from websites." />
        </Card>
        <Card title="Family DNS filter" hint="Catches adult, malware and phishing sites you haven't listed.">
          <div className="p-choice">
            {DNS_OPTIONS.map(([value, label, hint]) => (
              <button key={value} className={policy.familyDns === value ? "selected" : ""} onClick={() => set({ familyDns: value })}>
                <strong>{label}</strong>
                <small>{hint}</small>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Browsing hours" hint="Outside these hours every website is blocked.">
          <Toggle
            checked={policy.schedule.enabled}
            onChange={enabled => set({ schedule: { ...policy.schedule, enabled } })}
            label="Limit browsing hours"
            hint="Uses the clock on your child's computer."
          />
          {policy.schedule.enabled && (
            <div className="time-row">
              {(["start", "end"] as const).map(key => (
                <label key={key}>
                  {key === "start" ? "From" : "Until"}
                  <input
                    type="time"
                    defaultValue={policy.schedule[key]}
                    onBlur={e => e.target.value !== policy.schedule[key] && set({ schedule: { ...policy.schedule, [key]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          )}
        </Card>
      </>
    );
  }

  if (section === "activity") {
    const entries = logs[kid.id].filter(e => filter === "all" || e.type === "blocked");
    return (
      <Card title="Activity" hint="Updates whenever the browser syncs.">
        <div className="log-toolbar">
          <button className={filter === "blocked" ? "selected" : ""} onClick={() => setFilter("blocked")}>Blocked</button>
          <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Everything</button>
        </div>
        <LogRows entries={entries} />
      </Card>
    );
  }

  return (
    <Card title="This device">
      <label className="p-field">
        Name
        <input defaultValue={kid.name} />
      </label>
      <p className="empty-note">Paired {new Date(Date.now() - 41 * 864e5).toLocaleDateString()} · Wonderly 1.4.2</p>
      <div><button className="danger-button">Remove device</button></div>
    </Card>
  );
}

export function AddDevicePane() {
  return (
    <Card title="Add a device" hint="Open Wonderly on your child's computer and enter this code.">
      <div className="p-pair">
        <span className="pair-code">482 913</span>
        <span className="p-waiting"><i /> Waiting for the browser…</span>
      </div>
    </Card>
  );
}
