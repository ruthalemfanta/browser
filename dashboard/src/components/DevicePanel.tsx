import { useCallback, useEffect, useState } from "react";
import { Ban, Check, ListChecks, X } from "lucide-react";
import { api } from "../api";
import { normalizeDomain } from "../lib/domain";
import type { Device, Policy } from "../types";
import ActivityLog from "./ActivityLog";
import DeviceSettings from "./DeviceSettings";
import ListEditor from "./ListEditor";
import { Card, Toggle } from "./ui";

export type Section = "requests" | "sites" | "words" | "protection" | "activity" | "device";

const DNS_OPTIONS = [
  ["cleanbrowsing", "CleanBrowsing Family", "Blocks adult, mixed content, proxies/VPNs; enforces SafeSearch."],
  ["cloudflare", "Cloudflare for Families", "Blocks adult content and malware."],
  ["off", "Off", "Use the computer's normal DNS."]
] as const;

export default function DevicePanel({ device, section, onDevicesChanged }: {
  device: Device;
  section: Section;
  onDevicesChanged: () => void;
}) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [requests, setRequests] = useState<string[]>([]);
  const [error, setError] = useState("");

  const loadRequests = useCallback(() => {
    api.requests(device.id).then(setRequests).catch(() => {});
  }, [device.id]);

  useEffect(() => {
    api.policy(device.id).then(setPolicy).catch(() => setError("Couldn't load settings."));
    loadRequests();
  }, [device.id, loadRequests]);

  useEffect(() => {
    if (device.pending !== requests.length) loadRequests();
  }, [device.pending, requests.length, loadRequests]);

  async function update(patch: Partial<Policy>) {
    if (!policy) return;
    const previous = policy;
    setPolicy({ ...policy, ...patch });
    try {
      setPolicy(await api.updatePolicy(device.id, patch));
      setError("");
    } catch {
      setPolicy(previous);
      setError("Couldn't save. Check your connection and try again.");
    }
  }

  async function resolve(domain: string, approve: boolean) {
    setRequests(list => list.filter(d => d !== domain));
    const next = await api.resolveRequest(device.id, domain, approve).catch(() => null);
    if (next) setPolicy(next);
    onDevicesChanged();
  }

  if (!policy) return <div className="panel">{error && <p className="form-error">{error}</p>}</div>;

  return (
    <div className="panel">
      <h1>{device.name}</h1>
      <p className="lead">
        {device.lastSeen ? `Last synced ${new Date(device.lastSeen).toLocaleString()}` : "Not synced yet"}
      </p>
      {error && <p className="form-error">{error}</p>}

      {section === "requests" && (
        <Card title="Website requests" hint="Sites your child tried to open that aren't on the allowed list.">
          {requests.length === 0 && <p className="empty-note">No pending requests.</p>}
          {requests.map(domain => (
            <div className="list-row" key={domain}>
              <strong>{domain}</strong>
              <span className="row-actions">
                <button onClick={() => resolve(domain, true)}><Check size={15} /> Approve</button>
                <button className="danger" onClick={() => resolve(domain, false)}><X size={15} /> Deny</button>
              </span>
            </div>
          ))}
        </Card>
      )}

      {section === "sites" && (
        <>
          <Card title="Filtering mode">
            <div className="mode-grid">
              <button
                className={`mode-card ${policy.mode === "allowlist" ? "selected" : ""}`}
                onClick={() => update({ mode: "allowlist" })}
              >
                <ListChecks size={20} />
                <strong>Approved sites only</strong>
                <small>Safest. Every other website needs your approval.</small>
              </button>
              <button
                className={`mode-card ${policy.mode === "blocklist" ? "selected" : ""}`}
                onClick={() => update({ mode: "blocklist" })}
              >
                <Ban size={20} />
                <strong>Block specific sites</strong>
                <small>Everything is open except blocked sites and words.</small>
              </button>
            </div>
          </Card>

          <Card
            title="Allowed websites"
            hint={policy.mode === "allowlist"
              ? "Only these sites (and their subdomains) can be opened."
              : "Not used in “Block specific sites” mode."}
          >
            <ListEditor
              items={policy.allowedSites}
              onChange={allowedSites => update({ allowedSites })}
              normalize={normalizeDomain}
              placeholder="e.g. pbskids.org"
              emptyText="No allowed sites — nothing can be opened."
            />
          </Card>

          <Card title="Blocked websites" hint="Always blocked, in every mode, including images and videos they serve.">
            <ListEditor
              items={policy.blockedSites}
              onChange={blockedSites => update({ blockedSites })}
              normalize={normalizeDomain}
              placeholder="e.g. example.com"
              emptyText="No blocked sites."
            />
          </Card>
        </>
      )}

      {section === "words" && (
        <>
          <Card
            title="Blocked words"
            hint="Searches and addresses containing these words are blocked. Matching ignores capitals, accents and tricks like “p0rn”."
          >
            <ListEditor
              items={policy.blockedWords}
              onChange={blockedWords => update({ blockedWords })}
              placeholder="Add a word or phrase (comma-separate several)"
              emptyText="No blocked words."
            />
          </Card>
          <Card title="Page scanning">
            <Toggle
              checked={policy.scanPageText}
              onChange={scanPageText => update({ scanPageText })}
              label="Scan page text"
              hint="Pages are hidden until checked, and blocked if a blocked word appears in the text, title or image descriptions."
            />
          </Card>
        </>
      )}

      {section === "protection" && (
        <>
          <Card title="Search & video">
            <Toggle
              checked={policy.safeSearch}
              onChange={safeSearch => update({ safeSearch })}
              label="Force SafeSearch"
              hint="Locks Google, Bing, DuckDuckGo and Yahoo to strict SafeSearch and YouTube to Restricted Mode."
            />
            <Toggle
              checked={policy.blockDownloads}
              onChange={blockDownloads => update({ blockDownloads })}
              label="Block downloads"
              hint="Prevents saving files or installers from websites."
            />
          </Card>

          <Card
            title="Family DNS filter"
            hint="Encrypted DNS that blocks adult, malware and phishing sites at the network level — catches sites you haven't listed."
          >
            {DNS_OPTIONS.map(([value, label, hint]) => (
              <label key={value} className="setting-row">
                <span>
                  <strong>{label}</strong>
                  <small>{hint}</small>
                </span>
                <input
                  type="radio"
                  name="family-dns"
                  checked={policy.familyDns === value}
                  onChange={() => update({ familyDns: value })}
                />
              </label>
            ))}
          </Card>

          <Card title="Browsing hours" hint="Outside these hours every website is blocked and open pages close.">
            <Toggle
              checked={policy.schedule.enabled}
              onChange={enabled => update({ schedule: { ...policy.schedule, enabled } })}
              label="Limit browsing hours"
              hint="Uses the clock on your child's computer."
            />
            {policy.schedule.enabled && (
              <div className="time-row">
                <label>
                  From
                  <input
                    type="time"
                    value={policy.schedule.start}
                    onChange={e => update({ schedule: { ...policy.schedule, start: e.target.value } })}
                  />
                </label>
                <label>
                  Until
                  <input
                    type="time"
                    value={policy.schedule.end}
                    onChange={e => update({ schedule: { ...policy.schedule, end: e.target.value } })}
                  />
                </label>
              </div>
            )}
          </Card>
        </>
      )}

      {section === "activity" && <ActivityLog deviceId={device.id} />}

      {section === "device" && <DeviceSettings device={device} onChanged={onDevicesChanged} />}
    </div>
  );
}
