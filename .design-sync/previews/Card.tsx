import { Card, ParentsSurface, Toggle } from "wonderly-ds";

export const WithHint = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Browsing hours" hint="Outside these hours every website is blocked and open pages close.">
      <Toggle checked label="Limit browsing hours" hint="Uses the clock on your child's computer." onChange={() => {}} />
    </Card>
  </ParentsSurface>
);

export const TitleOnly = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Website requests">
      <p className="empty-note">No pending requests.</p>
    </Card>
  </ParentsSurface>
);
