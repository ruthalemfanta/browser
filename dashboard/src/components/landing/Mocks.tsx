import icon from "../../../../brand/wonderly-icon.svg";

const RESULTS = [
  { letter: "N", color: "#FFD84D", title: "Dinosaurs: Amazing Facts", url: "kids.nationalgeographic.com" },
  { letter: "P", color: "#7CCBF4", title: "Dino Games & Videos", url: "pbskids.org" },
  { letter: "S", color: "#F3A9E9", title: "Code Your Own T-Rex", url: "scratch.mit.edu" }
];

export function BrowserMock() {
  return (
    <div className="lp-mock lp-mock-browser lp-demo" aria-hidden="true">
      <div className="lp-mock-tabs"><b><img src={icon} alt="" />Wonderly</b><span>Dinosaurs – Search</span></div>
      <div className="lp-mock-bar"><i className="lp-pulse">● SAFE</i><span>search.wonderly.kids</span></div>
      <div className="lp-mock-body lp-demo-body">
        <div className="lp-mock-search">
          <span><b className="lp-typed">dinosaurs</b><i className="lp-caret" /></span>
          <em>Search</em>
        </div>
        {RESULTS.map((r, i) => (
          <div key={r.url} className={`lp-demo-res r${i + 1}`}>
            <b style={{ background: r.color }}>{r.letter}</b>
            <div><strong>{r.title}</strong><small>{r.url}</small></div>
          </div>
        ))}
        <div className="lp-demo-stamp">Kid-safe ✓</div>
        <svg className="lp-demo-cursor" viewBox="0 0 24 24">
          <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.5 L11 13.5 L18 13.5 Z" fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
