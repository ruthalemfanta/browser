import { useState, type CSSProperties } from "react";
import { ArrowLeft, ChevronRight, Clock, Plus, Search, ShieldCheck } from "lucide-react";
import { Card } from "../../src/components/ui";
import { AddDevicePane, Avatar, LogRows, OfflineNote, RequestRows, SaveStatus, SECTIONS, SectionBody, Status, type Section } from "./shared";
import { todayStats, useFamily, type Kid } from "./store";
import { Topbar } from "./Topbar";

type View = { kind: "home" } | { kind: "kid"; id: number; section: Section } | { kind: "add" };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const order = (i: number) => ({ "--i": i }) as CSSProperties;

const DNS_LABEL = { cleanbrowsing: "CleanBrowsing", cloudflare: "Cloudflare Families", off: "No DNS filter" };

export default function Home() {
  const [view, setView] = useState<View>({ kind: "home" });
  const { kids } = useFamily();
  const home = () => setView({ kind: "home" });

  return (
    <div className="v-home">
      <Topbar onBrand={home} />
      <main className="h-content">
        {view.kind === "home" && <Overview open={id => setView({ kind: "kid", id, section: "sites" })} add={() => setView({ kind: "add" })} />}
        {view.kind === "add" && (
          <div className="panel">
            <BackLink onClick={home} />
            <header className="p-head"><h1>Add a device</h1></header>
            <AddDevicePane />
          </div>
        )}
        {view.kind === "kid" && (
          <KidDetail
            kid={kids.find(k => k.id === view.id)!}
            section={view.section}
            setSection={section => setView({ ...view, section })}
            back={home}
          />
        )}
      </main>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button className="h-back" onClick={onClick}><ArrowLeft size={15} /> All devices</button>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Overview({ open, add }: { open: (id: number) => void; add: () => void }) {
  const { kids, requests, logs } = useFamily();
  const live = requests.filter(r => !r.leaving);
  const devicesWaiting = new Set(live.map(r => r.deviceId)).size;
  const blocked = kids
    .flatMap(kid => logs[kid.id].filter(e => e.type === "blocked" || e.type === "tamper").map(e => ({ ...e, kid })))
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className="h-overview">
      <header className="h-hello h-stagger" style={order(0)}>
        <h1>{greeting()}, Sam</h1>
        <p>
          {live.length === 0
            ? "Nothing needs you right now."
            : `${live.length} ${live.length === 1 ? "request is" : "requests are"} waiting across ${devicesWaiting} ${devicesWaiting === 1 ? "device" : "devices"}.`}
        </p>
      </header>

      <section className="h-stagger" style={order(1)}>
        <Card title="Waiting for you" hint="Allowing a site adds it to that device's allowed list.">
          {requests.length === 0 ? <p className="empty-note">You're all caught up.</p> : <RequestRows requests={requests} showKid />}
        </Card>
      </section>

      <div className="h-section-head h-stagger" style={order(2)}>
        <h2>Devices</h2>
        <button className="ghost" onClick={add}><Plus size={15} /> Add device</button>
      </div>

      <section className="h-kids">
        {kids.map((kid, i) => <KidCard key={kid.id} kid={kid} index={i + 3} onOpen={() => open(kid.id)} />)}
      </section>

      <section className="h-stagger" style={order(kids.length + 3)}>
        <Card title="Recently blocked" hint="Across all devices.">
          <LogRows entries={blocked} showKid limit={5} />
        </Card>
      </section>
    </div>
  );
}

function KidCard({ kid, index, onOpen }: { kid: Kid; index: number; onOpen: () => void }) {
  const { policies, requests, logs } = useFamily();
  const p = policies[kid.id];
  const stats = todayStats(logs[kid.id]);
  const waiting = requests.filter(r => r.deviceId === kid.id && !r.leaving).length;

  return (
    <button className="h-kid h-stagger" style={order(index)} onClick={onOpen}>
      <span className="h-kid-top">
        <Avatar kid={kid} size={40} />
        <span className="h-kid-name">
          <strong>{kid.name}</strong>
          <Status kid={kid} />
        </span>
        <ChevronRight size={18} className="h-kid-chev" />
      </span>
      <span className="h-kid-mode">
        {p.mode === "allowlist" ? `Approved sites only · ${plural(p.allowedSites.length, "site")}` : `Open web · ${plural(p.blockedSites.length, "blocked site")}`}
      </span>
      <span className="h-pills">
        <span className={p.safeSearch ? "on" : ""}><Search size={12} /> SafeSearch {p.safeSearch ? "on" : "off"}</span>
        <span className={p.familyDns !== "off" ? "on" : ""}><ShieldCheck size={12} /> {DNS_LABEL[p.familyDns]}</span>
        <span className={p.schedule.enabled ? "on" : ""}><Clock size={12} /> {p.schedule.enabled ? `${p.schedule.start}–${p.schedule.end}` : "Any time"}</span>
      </span>
      <span className="h-stats">
        <span><b>{stats.visits}</b> {stats.visits === 1 ? "visit" : "visits"} today</span>
        <span><b>{stats.blocked}</b> blocked</span>
        {waiting > 0 && <span className="h-waiting"><b>{waiting}</b> waiting</span>}
      </span>
    </button>
  );
}

function KidDetail({ kid, section, setSection, back }: { kid: Kid; section: Section; setSection: (s: Section) => void; back: () => void }) {
  const tabs = SECTIONS.filter(s => s.id !== "requests");
  return (
    <div className="panel">
      <BackLink onClick={back} />
      <header className="h-kid-head">
        <Avatar kid={kid} size={44} />
        <span className="h-kid-title">
          <h1>{kid.name}</h1>
          <Status kid={kid} />
        </span>
        <SaveStatus />
      </header>
      <OfflineNote kid={kid} />
      <nav className="h-seg" aria-label="Settings">
        {tabs.map(({ id, label }) => (
          <button key={id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}>{label}</button>
        ))}
      </nav>
      <SectionBody key={`${kid.id}-${section}`} kid={kid} section={section} />
    </div>
  );
}
