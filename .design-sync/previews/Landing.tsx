import { Landing, ParentsSurface } from "wonderly-ds";

// The page's own prefers-reduced-motion rules, so the card shows the settled layout instead of a mid-entrance frame.
const STILL = `.ds-still .lp *, .ds-still .lp *::before, .ds-still .lp *::after { animation: none !important; transition: none !important; }
.ds-still .lp-fx .lp-reveal { opacity: 1; transform: none; }
.ds-still .lp-typed { max-width: none; }
.ds-still .lp-shield .check { stroke-dashoffset: 0; }
.ds-still .lp-lead b { background-size: 100% 40%; }`;

export const SignedOut = () => (
  <ParentsSurface className="ds-still">
    <style>{STILL}</style>
    <Landing signedIn={false} />
  </ParentsSurface>
);

export const SignedIn = () => (
  <ParentsSurface className="ds-still">
    <style>{STILL}</style>
    <Landing signedIn />
  </ParentsSurface>
);
