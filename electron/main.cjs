const {
  app,
  BrowserWindow,
  Menu,
  WebContentsView,
  ipcMain,
  session
} = require("electron");

const path = require("node:path");
const filter = require("./filter.cjs");
const store = require("./store.cjs");
const { createSync } = require("./sync.cjs");

const DEV_URL = "http://127.0.0.1:5173";
const TOOLBAR_HEIGHT = 108;
const BOTTOM_NAV_HEIGHT = 0;
const PARTITION = "explore";
const DNS_SERVERS = {
  cleanbrowsing: "https://doh.cleanbrowsing.org/doh/family-filter/",
  cloudflare: "https://family.cloudflare-dns.com/dns-query"
};
const IGNORED_LOAD_ERRORS = new Set([-3, -20, -27]);

if (!app.requestSingleInstanceLock()) app.quit();

let win;
let activeTabId = null;
let nextTabId = 1;
let overlay = false;

const tabs = new Map();

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function minutesOf(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function withinSchedule() {
  const { schedule } = store.policy;
  if (!schedule.enabled) return true;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = minutesOf(schedule.start);
  const end = minutesOf(schedule.end);

  return start <= end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end;
}

function evaluateNavigation(url) {
  if (!store.isPaired()) return { allowed: false, reason: "setup", host: hostOf(url) };
  if (!withinSchedule()) return { allowed: false, reason: "schedule", host: hostOf(url) };
  return filter.checkNavigation(url, store.policy);
}

function isShowingPage(tab) {
  return Boolean(
    !tab.home &&
    !tab.blocked &&
    tab.screened &&
    tab.url.startsWith("https:")
  );
}

function serializeTab(tab) {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.home ? "" : tab.url,
    loading: tab.loading,
    showingPage: isShowingPage(tab),
    blocked: tab.blocked
  };
}

function snapshot() {
  return {
    tabs: [...tabs.values()].map(serializeTab),
    activeTabId,
    pendingSites: [...store.requests],
    approvedSites: [...store.policy.allowedSites],
    mode: store.policy.mode,
    setupRequired: !store.isPaired()
  };
}

function publishTabs() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send("browser:tabs", snapshot());
}

function layoutViews() {
  if (!win || win.isDestroyed()) return;

  const { width, height } = win.getContentBounds();

  for (const tab of tabs.values()) {
    tab.view.setBounds({
      x: 0,
      y: TOOLBAR_HEIGHT,
      width,
      height: Math.max(0, height - TOOLBAR_HEIGHT - BOTTOM_NAV_HEIGHT)
    });

    const visible = tab.id === activeTabId && !overlay && isShowingPage(tab);
    tab.view.setVisible(visible);
    tab.view.webContents.setAudioMuted(!isShowingPage(tab));
  }
}

function refresh() {
  layoutViews();
  publishTabs();
}

function tabForWebContents(id) {
  for (const tab of tabs.values()) {
    if (tab.view.webContents.id === id) return tab;
  }
  return null;
}

function blockTab(tab, url, verdict) {
  if (!tab) return;

  tab.blocked = {
    url,
    host: verdict.host || hostOf(url),
    reason: verdict.reason,
    detail: verdict.detail
  };
  tab.loading = false;

  if (verdict.reason === "not-allowed" && store.addRequest(tab.blocked.host)) sync.soon();
  store.addLog({ type: "blocked", url, reason: verdict.reason, detail: verdict.detail });

  refresh();
}

function evictPage(tab) {
  const wc = tab.view.webContents;
  wc.stop();
  if (wc.navigationHistory.canGoBack()) {
    wc.navigationHistory.goBack();
  } else {
    wc.loadURL("about:blank");
  }
}

function recheckOpenTabs() {
  for (const tab of tabs.values()) {
    if (tab.blocked || !tab.url.startsWith("https:")) continue;

    const verdict = evaluateNavigation(tab.url);
    if (!verdict.allowed) {
      blockTab(tab, tab.url, verdict);
      evictPage(tab);
    }
  }
}

function normalizeInput(input) {
  const value = String(input || "").trim().slice(0, 2048);
  if (!value) return null;

  try {
    return new URL(
      /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
        ? value
        : /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#].*)?$/.test(value)
          ? `https://${value}`
          : `https://www.google.com/search?q=${encodeURIComponent(value)}&safe=active`
    );
  } catch {
    return null;
  }
}

function createTab() {
  const id = nextTabId++;

  const view = new WebContentsView({
    webPreferences: {
      partition: PARTITION,
      preload: path.join(__dirname, "tab-preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: false,
      spellcheck: false,
      safeDialogs: true,
      navigateOnDragDrop: false,
      webviewTag: false
    }
  });

  const tab = {
    id,
    view,
    url: "",
    title: "New Tab",
    loading: false,
    screened: false,
    home: true,
    blocked: null
  };

  tabs.set(id, tab);

  const wc = view.webContents;
  wc.setWindowOpenHandler(({ url }) => {
    const verdict = evaluateNavigation(url);
    if (verdict.allowed) wc.loadURL(url);
    else blockTab(tab, url, verdict);
    return { action: "deny" };
  });

  wc.on("did-start-navigation", details => {
    if (!details.isMainFrame || details.isSameDocument) return;
    tab.screened = false;
    tab.home = false;
    layoutViews();
  });

  wc.on("page-title-updated", (_event, title) => {
    const word = store.policy.scanPageText && filter.findBlockedWord(title, store.policy.blockedWords);
    if (word) {
      blockTab(tab, wc.getURL(), { reason: "blocked-content", detail: word });
      evictPage(tab);
      return;
    }
    tab.title = title;
    publishTabs();
  });

  wc.on("did-start-loading", () => {
    tab.loading = true;
    publishTabs();
  });

  wc.on("did-stop-loading", () => {
    tab.loading = false;
    tab.screened = true;
    refresh();
  });

  wc.on("did-fail-load", (_event, code, description, url, isMainFrame) => {
    if (!isMainFrame || IGNORED_LOAD_ERRORS.has(code)) return;
    blockTab(tab, url, { reason: "unreachable", host: hostOf(url), detail: description });
  });

  wc.on("did-navigate", (_event, url) => {
    tab.url = url;
    if (url.startsWith("https:")) store.addLog({ type: "visit", url });
    publishTabs();
  });

  wc.on("did-navigate-in-page", (_event, url, isMainFrame) => {
    if (isMainFrame) tab.url = url;
    publishTabs();
  });

  wc.on("render-process-gone", () => {
    tab.loading = false;
    publishTabs();
  });

  win.contentView.addChildView(view);
  activeTabId = id;
  refresh();

  return tab;
}

async function navigate(tab, input) {
  const url = normalizeInput(input);
  if (!url) {
    blockTab(tab, String(input), { reason: "invalid" });
    return;
  }

  const verdict = evaluateNavigation(url.href);
  if (!verdict.allowed) {
    blockTab(tab, url.href, verdict);
    return;
  }

  tab.blocked = null;
  tab.home = false;
  tab.loading = true;
  refresh();

  try {
    await tab.view.webContents.loadURL(url.href);
  } catch {
    tab.loading = false;
    publishTabs();
  }
}

function applyDns() {
  const server = DNS_SERVERS[store.policy.familyDns];
  app.configureHostResolver(
    server
      ? { secureDnsMode: "secure", secureDnsServers: [server] }
      : { secureDnsMode: "automatic" }
  );

  const ses = session.fromPartition(PARTITION);
  ses.clearHostResolverCache();
  ses.closeAllConnections();
}

function denyPermissions(ses) {
  ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
  ses.setDevicePermissionHandler(() => false);
  ses.setDisplayMediaRequestHandler((_request, callback) => callback({}));
}

function installGuards(ses) {
  denyPermissions(ses);

  ses.on("will-download", (event, item, wc) => {
    if (!store.policy.blockDownloads) return;
    event.preventDefault();
    const tab = tabForWebContents(wc?.id);
    blockTab(tab, item.getURL(), { reason: "download", host: hostOf(item.getURL()), detail: item.getFilename() });
  });

  ses.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
    const { resourceType, url } = details;
    const isFrame = resourceType === "mainFrame" || resourceType === "subFrame";
    const verdict = isFrame ? evaluateNavigation(url) : filter.checkResource(url, store.policy);

    if (!verdict.allowed) {
      if (resourceType === "mainFrame") {
        blockTab(tabForWebContents(details.webContentsId), url, verdict);
      }
      return callback({ cancel: true });
    }

    if (resourceType === "mainFrame" && store.policy.safeSearch) {
      const safe = filter.enforceSafeSearch(url);
      if (safe) return callback({ redirectURL: safe });
    }

    callback({});
  });

  ses.webRequest.onBeforeSendHeaders({ urls: ["https://*/*"] }, (details, callback) => {
    const headers = details.requestHeaders;
    if (store.policy.safeSearch && filter.isYouTube(hostOf(details.url))) {
      headers["YouTube-Restrict"] = "Strict";
    }
    headers["DNT"] = "1";
    headers["Sec-GPC"] = "1";
    callback({ requestHeaders: headers });
  });
}

function fromShell(event) {
  return Boolean(
    win &&
    !win.isDestroyed() &&
    event.sender === win.webContents &&
    event.senderFrame === win.webContents.mainFrame
  );
}

function shellHandle(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!fromShell(event)) throw new Error("Forbidden");
    return handler(...args);
  });
}

function onPolicyChanged(previous) {
  if (store.policy.familyDns !== previous.familyDns) applyDns();
  recheckOpenTabs();
  publishTabs();
}

const sync = createSync({ onPolicyChanged, onUnpaired: () => onPolicyChanged(store.policy) });

function registerIpc() {
  const getActiveTab = () => tabs.get(activeTabId);

  shellHandle("browser:get-state", snapshot);

  shellHandle("browser:new-tab", () => createTab().id);

  shellHandle("browser:activate-tab", id => {
    if (!tabs.has(id)) return false;
    activeTabId = id;
    refresh();
    return true;
  });

  shellHandle("browser:close-tab", id => {
    const tab = tabs.get(id);
    if (!tab) return false;

    win.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    tabs.delete(id);

    if (activeTabId === id) {
      activeTabId = [...tabs.keys()].at(-1) ?? null;
      if (activeTabId === null) createTab();
    }

    refresh();
    return true;
  });

  shellHandle("browser:navigate", async input => {
    const tab = getActiveTab();
    if (!tab) return false;
    await navigate(tab, input);
    return true;
  });

  shellHandle("browser:show-home", () => {
    const tab = getActiveTab();
    if (!tab) return false;
    tab.home = true;
    tab.blocked = null;
    refresh();
    return true;
  });

  shellHandle("browser:dismiss-block", () => {
    const tab = getActiveTab();
    if (!tab) return false;
    tab.blocked = null;
    if (!tab.url.startsWith("https:")) tab.home = true;
    refresh();
    return true;
  });

  shellHandle("browser:set-overlay", value => {
    overlay = value === true;
    layoutViews();
  });

  shellHandle("browser:request-site", domain => {
    if (store.addRequest(domain)) sync.soon();
    publishTabs();
    return true;
  });

  shellHandle("browser:pair", code => sync.pair(code));

  shellHandle("browser:back", () => {
    const tab = getActiveTab();
    if (!tab) return;
    tab.blocked = null;
    if (tab.view.webContents.navigationHistory.canGoBack()) {
      tab.view.webContents.navigationHistory.goBack();
    }
    refresh();
  });

  shellHandle("browser:forward", () => {
    const wc = getActiveTab()?.view.webContents;
    if (wc?.navigationHistory.canGoForward()) wc.navigationHistory.goForward();
  });

  shellHandle("browser:reload", () => {
    const tab = getActiveTab();
    if (tab?.url.startsWith("https:")) tab.view.webContents.reload();
  });

  ipcMain.on("guard:scan", (event, payload) => {
    const tab = tabForWebContents(event.sender.id);
    if (!tab || event.senderFrame !== event.sender.mainFrame) return;

    const text = String(payload?.text ?? "").slice(0, 300_000);
    const word = store.policy.scanPageText && filter.findBlockedWord(text, store.policy.blockedWords);

    if (word) {
      blockTab(tab, event.sender.getURL(), { reason: "blocked-content", detail: word });
      evictPage(tab);
      return;
    }

    if (payload?.initial && !tab.screened) {
      tab.screened = true;
      refresh();
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#f6f4ef",
    title: "Wonderly",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged,
      webviewTag: false
    }
  });

  win.webContents.on("will-navigate", event => event.preventDefault());

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    win.loadURL(DEV_URL);
  }

  win.on("resize", layoutViews);

  win.webContents.on("did-finish-load", () => {
    if (tabs.size === 0) createTab();
    refresh();
  });

  win.on("closed", () => {
    win = null;
    tabs.clear();
    activeTabId = null;
  });
}

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", event => event.preventDefault());
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
});

app.on("second-instance", () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  store.load();
  if (process.platform === "darwin" && !app.isPackaged) app.dock.setIcon(path.join(__dirname, "icon.png"));

  if (app.isPackaged) {
    Menu.setApplicationMenu(
      process.platform === "darwin"
        ? Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { role: "windowMenu" }])
        : null
    );
  }

  denyPermissions(session.defaultSession);
  installGuards(session.fromPartition(PARTITION));
  applyDns();
  registerIpc();
  createWindow();
  sync.start();

  setInterval(recheckOpenTabs, 30_000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => store.flush());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
