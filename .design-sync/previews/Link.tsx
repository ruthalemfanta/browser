import { Link, ParentsSurface } from "wonderly-ds";

export const InlineAndButton = () => (
  <ParentsSurface style={{ padding: 24, display: "grid", gap: 16, justifyItems: "start" }}>
    <p style={{ margin: 0 }}>
      Already paired a browser? <Link to="/dashboard">Open the parent dashboard</Link>.
    </p>
    <div className="lp">
      <Link to="/login" className="lp-btn lp-lime">Parent Sign In</Link>
    </div>
  </ParentsSurface>
);
