import { BrowserSurface, HomePage } from "wonderly-ds";

const noop = () => {};

export const ApprovedPlaces = () => (
  <BrowserSurface>
    <HomePage
      mode="allowlist"
      approvedSites={["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "khanacademy.org", "scratch.mit.edu"]}
      onSearch={noop}
      onOpen={noop}
    />
  </BrowserSurface>
);

export const DefaultPlaces = () => (
  <BrowserSurface>
    <HomePage mode="blocklist" approvedSites={[]} onSearch={noop} onOpen={noop} />
  </BrowserSurface>
);
