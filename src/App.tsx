import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, House, Loader, Plus, RotateCw, X } from "lucide-react";
import BlockedPage from "./components/BlockedPage";
import HomePage from "./components/HomePage";
import PairSetup from "./components/PairSetup";
import { siteColor } from "./lib/places";
import logo from "../brand/wonderly-logo.svg";

export default function App() {
  const [state, setState] = useState<BrowserState>({
    tabs: [],
    activeTabId: null,
    pendingSites: [],
    approvedSites: [],
    mode: "allowlist",
    setupRequired: false
  });
  const [address, setAddress] = useState("");

  useEffect(() => {
    window.browserAPI.getState().then(setState);
    return window.browserAPI.onTabsChanged(setState);
  }, []);

  useEffect(() => {
    window.browserAPI.setOverlay(state.setupRequired);
  }, [state.setupRequired]);

  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId);

  async function navigate(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setAddress(trimmed);
    await window.browserAPI.navigate(trimmed);
  }

  async function newTab() {
    await window.browserAPI.newTab();
    setAddress("");
  }

  async function activateTab(id: number) {
    await window.browserAPI.activateTab(id);
    setAddress("");
  }

  async function goHome() {
    await window.browserAPI.showHome();
    setAddress("");
  }

  if (state.setupRequired) return <PairSetup />;

  return (
    <div className="app-shell">
      <header className="browser-header">
        <div className="tab-strip">
          <span className="brand"><img src={logo} alt="Wonderly" /></span>
          {state.tabs.map(tab => (
            <button
              className={`tab ${tab.id === state.activeTabId ? "active" : ""}`}
              key={tab.id}
              onClick={() => activateTab(tab.id)}
              title={tab.title}
            >
              <span className="tab-dot" style={{ background: tab.url ? siteColor(tab.url) : undefined }} />
              <span className="tab-title">{tab.title || "New Tab"}</span>
              <span
                className="tab-close"
                onClick={event => {
                  event.stopPropagation();
                  window.browserAPI.closeTab(tab.id);
                }}
              >
                <X size={14} />
              </span>
            </button>
          ))}
          <button className="new-tab" onClick={newTab} title="New tab" aria-label="New tab">
            <Plus size={18} />
          </button>
        </div>

        <div className="toolbar">
          <button className="nav-button" onClick={() => window.browserAPI.back()} title="Back" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <button className="nav-button" onClick={() => window.browserAPI.forward()} title="Forward" aria-label="Forward">
            <ArrowRight size={18} />
          </button>
          <button className="nav-button" onClick={() => window.browserAPI.reload()} title="Reload" aria-label="Reload">
            <RotateCw size={16} />
          </button>
          <button className="nav-button" onClick={goHome} title="Home" aria-label="Home">
            <House size={17} />
          </button>

          <form
            className="address-bar"
            onSubmit={event => {
              event.preventDefault();
              navigate(address);
            }}
          >
            <span className="safe-badge">● SAFE</span>
            <input
              value={address}
              onChange={event => setAddress(event.target.value)}
              placeholder={activeTab?.url || "Search or type a website"}
              aria-label="Search or enter a website"
            />
          </form>
        </div>
      </header>

      <main className="app-content">
        {activeTab?.blocked && (
          <BlockedPage info={activeTab.blocked} onBack={() => window.browserAPI.back()} onHome={goHome} />
        )}

        {!activeTab?.blocked && activeTab?.url && !activeTab.showingPage && (
          <section className="checking-page">
            <Loader size={28} className="spin" />
            <p>Checking this page is safe…</p>
          </section>
        )}

        {!activeTab?.blocked && !activeTab?.url && (
          <HomePage
            mode={state.mode}
            approvedSites={state.approvedSites}
            onSearch={navigate}
            onOpen={domain => navigate(`https://${domain}`)}
          />
        )}
      </main>
    </div>
  );
}
