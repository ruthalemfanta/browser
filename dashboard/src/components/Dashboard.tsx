import { useCallback, useEffect, useState } from "react";
import {
  Activity, Globe, Inbox, LogOut, Monitor, Plus, Settings, ShieldCheck, Type
} from "lucide-react";
import { api } from "../api";
import Link from "./Link";
import logo from "../../../brand/wonderly-logo.svg";
import type { Device } from "../types";
import AddDevice from "./AddDevice";
import DevicePanel, { type Section } from "./DevicePanel";

const SECTIONS: { id: Section; label: string; icon: typeof Globe }[] = [
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "sites", label: "Websites", icon: Globe },
  { id: "words", label: "Blocked words", icon: Type },
  { id: "protection", label: "Protection", icon: ShieldCheck },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "device", label: "Device", icon: Settings }
];

export default function Dashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [section, setSection] = useState<Section>("requests");
  const [adding, setAdding] = useState(false);

  const loadDevices = useCallback(() => api.devices().then(list => {
    setDevices(list);
    setSelectedId(current => (current && list.some(d => d.id === current) ? current : list[0]?.id ?? null));
  }).catch(() => {}), []);

  useEffect(() => {
    loadDevices();
    const poll = setInterval(loadDevices, 15_000);
    return () => clearInterval(poll);
  }, [loadDevices]);

  const device = devices?.find(d => d.id === selectedId) ?? null;

  if (!devices) return null;

  return (
    <div className="dashboard">
      <header className="topbar">
        <Link to="/" className="brand"><img src={logo} alt="Wonderly" /> <small>Parents</small></Link>
        <span className="account">
          {email}
          <button className="ghost" onClick={onSignOut}><LogOut size={15} /> Sign out</button>
        </span>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-group">
            <span className="sidebar-label">Devices</span>
            {devices.map(d => (
              <button
                key={d.id}
                className={`device-item ${d.id === selectedId ? "selected" : ""}`}
                onClick={() => {
                  setSelectedId(d.id);
                  setAdding(false);
                }}
              >
                <Monitor size={16} />
                <span className="device-name">{d.name}</span>
                <span className={`status-dot ${d.online ? "online" : ""}`} title={d.online ? "Online" : "Offline"} />
              </button>
            ))}
            <button className={`device-item add ${adding ? "selected" : ""}`} onClick={() => setAdding(true)}>
              <Plus size={16} /> Add device
            </button>
          </div>

          {device && !adding && (
            <div className="sidebar-group">
              <span className="sidebar-label">Controls</span>
              {SECTIONS.map(({ id, label, icon: Icon }) => (
                <button key={id} className={section === id ? "selected" : ""} onClick={() => setSection(id)}>
                  <Icon size={16} /> {label}
                  {id === "requests" && device.pending > 0 && <span className="nav-count">{device.pending}</span>}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="content">
          {adding || !device ? (
            <AddDevice
              firstDevice={devices.length === 0}
              onPaired={() => {
                setAdding(false);
                loadDevices();
              }}
              knownIds={devices.map(d => d.id)}
            />
          ) : (
            <DevicePanel
              key={device.id}
              device={device}
              section={section}
              onDevicesChanged={loadDevices}
            />
          )}
        </main>
      </div>
    </div>
  );
}
