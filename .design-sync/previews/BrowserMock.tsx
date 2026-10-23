import { BrowserMock, ParentsSurface } from "wonderly-ds";

const STILL = `.ds-still .lp *, .ds-still .lp *::before, .ds-still .lp *::after { animation: none !important; transition: none !important; }
.ds-still .lp-typed { max-width: none; }`;

export const SearchResults = () => (
  <ParentsSurface className="ds-still" style={{ padding: 32, background: "var(--sky)" }}>
    <style>{STILL}</style>
    <div className="lp" style={{ background: "transparent", maxWidth: 560 }}>
      <BrowserMock />
    </div>
  </ParentsSurface>
);
