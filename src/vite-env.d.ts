export {};

declare global {
  type BlockReason =
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

  interface BlockInfo {
    url: string;
    host: string;
    reason: BlockReason;
    detail?: string;
  }

  interface BrowserTab {
    id: number;
    title: string;
    url: string;
    loading: boolean;
    showingPage: boolean;
    blocked: BlockInfo | null;
  }

  interface BrowserState {
    tabs: BrowserTab[];
    activeTabId: number | null;
    pendingSites: string[];
    approvedSites: string[];
    mode: "allowlist" | "blocklist";
    setupRequired: boolean;
  }

  interface Window {
    browserAPI: {
      getState: () => Promise<BrowserState>;
      newTab: () => Promise<number>;
      activateTab: (id: number) => Promise<boolean>;
      closeTab: (id: number) => Promise<boolean>;
      navigate: (url: string) => Promise<boolean>;
      back: () => Promise<void>;
      forward: () => Promise<void>;
      reload: () => Promise<void>;
      showHome: () => Promise<boolean>;
      dismissBlock: () => Promise<boolean>;
      setOverlay: (value: boolean) => Promise<void>;
      requestSite: (domain: string) => Promise<boolean>;
      pair: (code: string) => Promise<{ ok: boolean; error?: string }>;
      onTabsChanged: (callback: (state: BrowserState) => void) => () => void;
    };
  }
}
