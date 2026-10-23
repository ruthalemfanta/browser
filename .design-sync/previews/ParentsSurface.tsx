import { Card, ParentsSurface, Toggle } from "wonderly-ds";

export const WrapsParentScreens = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Page scanning">
      <Toggle checked label="Scan page text" hint="Pages are hidden until checked, and blocked if a blocked word appears." onChange={() => {}} />
    </Card>
  </ParentsSurface>
);
