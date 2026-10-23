import { BlockedPage, BrowserSurface } from "wonderly-ds";

const noop = () => {};

export const NeedsApproval = () => (
  <BrowserSurface>
    <BlockedPage info={{ url: "https://minecraft.net/", host: "minecraft.net", reason: "not-allowed" }} onBack={noop} onHome={noop} />
  </BrowserSurface>
);

export const BlockedWord = () => (
  <BrowserSurface>
    <BlockedPage info={{ url: "https://www.google.com/search?q=casino", host: "google.com", reason: "blocked-word" }} onBack={noop} onHome={noop} />
  </BrowserSurface>
);

export const OutsideBrowsingHours = () => (
  <BrowserSurface>
    <BlockedPage info={{ url: "https://pbskids.org/", host: "", reason: "schedule" }} onBack={noop} onHome={noop} />
  </BrowserSurface>
);

export const Offline = () => (
  <BrowserSurface>
    <BlockedPage info={{ url: "https://wikipedia.org/", host: "wikipedia.org", reason: "unreachable" }} onBack={noop} onHome={noop} />
  </BrowserSurface>
);
