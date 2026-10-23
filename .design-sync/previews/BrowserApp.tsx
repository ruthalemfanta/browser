import { BrowserApp, BrowserSurface, DemoBackend } from "wonderly-ds";

const blank = { loading: false, showingPage: false, blocked: null };

const places = { approvedSites: ["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "khanacademy.org", "scratch.mit.edu"] };

export const NewTab = () => (
  <DemoBackend browser={places}>
    <BrowserSurface>
      <BrowserApp />
    </BrowserSurface>
  </DemoBackend>
);

export const SeveralTabs = () => (
  <DemoBackend
    browser={{
      ...places,
      activeTabId: 3,
      tabs: [
        { id: 1, title: "PBS KIDS Games", url: "https://pbskids.org/games", ...blank, showingPage: true },
        { id: 2, title: "Animals – National Geographic Kids", url: "https://kids.nationalgeographic.com/animals", ...blank, showingPage: true },
        { id: 3, title: "New Tab", url: "", ...blank }
      ]
    }}
  >
    <BrowserSurface>
      <BrowserApp />
    </BrowserSurface>
  </DemoBackend>
);

export const BlockedTab = () => (
  <DemoBackend
    browser={{
      activeTabId: 2,
      tabs: [
        { id: 1, title: "Scratch – Imagine, Program, Share", url: "https://scratch.mit.edu/", ...blank, showingPage: true },
        { id: 2, title: "minecraft.net", url: "https://minecraft.net/", ...blank, blocked: { url: "https://minecraft.net/", host: "minecraft.net", reason: "not-allowed" } }
      ]
    }}
  >
    <BrowserSurface>
      <BrowserApp />
    </BrowserSurface>
  </DemoBackend>
);

export const CheckingPage = () => (
  <DemoBackend
    browser={{
      activeTabId: 1,
      tabs: [{ id: 1, title: "wikipedia.org", url: "https://wikipedia.org/wiki/Dinosaur", ...blank }]
    }}
  >
    <BrowserSurface>
      <BrowserApp />
    </BrowserSurface>
  </DemoBackend>
);

export const PairingLock = () => (
  <DemoBackend browser={{ setupRequired: true }}>
    <BrowserSurface>
      <BrowserApp />
    </BrowserSurface>
  </DemoBackend>
);
