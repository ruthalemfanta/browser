import { BlockedPage, BrowserSurface } from "wonderly-ds";

export const WrapsBrowserScreens = () => (
  <BrowserSurface>
    <BlockedPage info={{ url: "https://reddit.com/", host: "reddit.com", reason: "blocked-site" }} onBack={() => {}} onHome={() => {}} />
  </BrowserSurface>
);
