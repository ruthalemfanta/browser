import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { AddDevicePane, Avatar, OfflineNote, SaveStatus, SECTIONS, SectionBody, Status, type Section } from "./shared";
import { useFamily } from "./store";
import { Topbar } from "./Topbar";

export default function Console() {
  const { kids, requests } = useFamily();
  const [kidId, setKidId] = useState(kids[0].id);
  const [section, setSection] = useState<Section>("requests");
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const kid = kids.find(k => k.id === kidId)!;
  const pending = (id: number) => requests.filter(r => r.deviceId === id && !r.leaving).length;
  const otherPending = kids.filter(k => k.id !== kidId).reduce((n, k) => n + pending(k.id), 0);
  const meta = SECTIONS.find(s => s.id === section)!;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  return (
    <div className="v-console">
      <Topbar />
      <div className="c-layout">
        <aside className="c-rail">
          <div className="c-switch" ref={menuRef}>
            <button className="c-switch-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
              <Avatar kid={kid} size={32} />
              <span className="c-switch-text">
                <strong>{adding ? "New device" : kid.name}</strong>
                {!adding && <Status kid={kid} />}
              </span>
              {otherPending > 0 && <span className="p-count" title="Requests on other devices">{otherPending}</span>}
              <ChevronsUpDown size={15} className="c-chev" />
            </button>
            {menuOpen && (
              <div className="c-menu" role="menu">
                {kids.map(k => (
                  <button
                    key={k.id}
                    role="menuitem"
                    onClick={() => {
                      setKidId(k.id);
                      setAdding(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Avatar kid={k} size={22} />
                    <span className="c-menu-name">{k.name}</span>
                    {pending(k.id) > 0 && <span className="p-count">{pending(k.id)}</span>}
                    {k.id === kidId && !adding && <Check size={14} />}
                  </button>
                ))}
                <hr />
                <button role="menuitem" onClick={() => { setAdding(true); setMenuOpen(false); }}>
                  <Plus size={16} /> Add device
                </button>
              </div>
            )}
          </div>

          <nav className="c-nav" aria-label="Controls" data-disabled={adding || undefined}>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                aria-current={!adding && section === id ? "page" : undefined}
                onClick={() => { setSection(id); setAdding(false); }}
              >
                <Icon size={16} /> {label}
                {id === "requests" && pending(kid.id) > 0 && <span className="p-count">{pending(kid.id)}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className="c-content">
          <div className="panel">
            {adding ? (
              <>
                <header className="p-head"><h1>Add a device</h1></header>
                <AddDevicePane />
              </>
            ) : (
              <>
                <header className="p-head">
                  <span className="p-eyebrow"><Avatar kid={kid} size={18} /> {kid.name}</span>
                  <div className="p-title-row">
                    <h1>{meta.label}</h1>
                    <SaveStatus />
                  </div>
                  <p className="p-blurb">{meta.blurb}</p>
                </header>
                <OfflineNote kid={kid} />
                <SectionBody key={`${kid.id}-${section}`} kid={kid} section={section} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
