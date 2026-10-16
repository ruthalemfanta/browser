const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("browserAPI", {
  getState: () => ipcRenderer.invoke("browser:get-state"),
  newTab: () => ipcRenderer.invoke("browser:new-tab"),
  activateTab: id => ipcRenderer.invoke("browser:activate-tab", id),
  closeTab: id => ipcRenderer.invoke("browser:close-tab", id),
  navigate: url => ipcRenderer.invoke("browser:navigate", url),
  back: () => ipcRenderer.invoke("browser:back"),
  forward: () => ipcRenderer.invoke("browser:forward"),
  reload: () => ipcRenderer.invoke("browser:reload"),
  showHome: () => ipcRenderer.invoke("browser:show-home"),
  dismissBlock: () => ipcRenderer.invoke("browser:dismiss-block"),
  setOverlay: value => ipcRenderer.invoke("browser:set-overlay", value),
  requestSite: domain => ipcRenderer.invoke("browser:request-site", domain),
  pair: code => ipcRenderer.invoke("browser:pair", code),

  onTabsChanged: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("browser:tabs", listener);
    return () => ipcRenderer.removeListener("browser:tabs", listener);
  }
});
