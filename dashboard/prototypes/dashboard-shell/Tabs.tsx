import { useState } from "react";
import { Plus } from "lucide-react";
import { AddDevicePane, Avatar, OfflineNote, SaveStatus, SECTIONS, SectionBody, type Section } from "./shared";
import { ago, useFamily } from "./store";
import { Topbar } from "./Topbar";

export default function Tabs() {
  const { kids, requests } = useFamily();
  const [kidId, setKidId] = useState<number | "add">(kids[0].id);
  const [section, setSection] = useState<Section>("requests");

  const kid = kids.find(k => k.id === kidId);
  const pending = (id: number) => requests.filter(r => r.deviceId === id && !r.leaving).length;

  return (
    <div className="v-tabs">
      <Topbar />
      <div className="t-kids-wrap">
        <div className="t-kids" role="tablist" aria-label="Devices">
          {kids.map(k => (
            <button
              key={k.id}
              role="tab"
              aria-selected={k.id === kidId}
              className="t-kid"
              onClick={() => setKidId(k.id)}
            >
              <Avatar kid={k} size={34} />
              <span className="t-kid-text">
                <strong>{k.name}</strong>
                <small className={k.online ? "on" : ""}><i />{k.online ? "Online" : `Offline · ${ago(k.lastSeen)}`}</small>
              </span>
              {pending(k.id) > 0 && <span className="p-count">{pending(k.id)}</span>}
            </button>
          ))}
          <button role="tab" aria-selected={kidId === "add"} className="t-kid t-add" onClick={() => setKidId("add")}>
            <Plus size={18} /> Add device
          </button>
        </div>
      </div>

      {kid ? (
        <>
          <nav className="t-sections" aria-label="Controls">
            <div className="t-sections-inner">
              {SECTIONS.map(({ id, label }) => (
                <button key={id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}>
                  {label}
                  {id === "requests" && pending(kid.id) > 0 && <span className="p-count">{pending(kid.id)}</span>}
                </button>
              ))}
            </div>
          </nav>
          <main className="t-content">
            <div className="panel">
              <div className="t-head">
                <p className="p-blurb">{SECTIONS.find(s => s.id === section)!.blurb}</p>
                <SaveStatus />
              </div>
              <OfflineNote kid={kid} />
              <SectionBody key={`${kid.id}-${section}`} kid={kid} section={section} />
            </div>
          </main>
        </>
      ) : (
        <main className="t-content">
          <div className="panel"><AddDevicePane /></div>
        </main>
      )}
    </div>
  );
}
