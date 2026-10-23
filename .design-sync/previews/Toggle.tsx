import { useState } from "react";
import { Card, ParentsSurface, Toggle } from "wonderly-ds";

function Row({ initial, label, hint }: { initial: boolean; label: string; hint: string }) {
  const [on, setOn] = useState(initial);
  return <Toggle checked={on} onChange={setOn} label={label} hint={hint} />;
}

export const SettingsGroup = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <Card title="Search & video">
      <Row initial label="Force SafeSearch" hint="Locks Google, Bing, DuckDuckGo and Yahoo to strict SafeSearch and YouTube to Restricted Mode." />
      <Row initial={false} label="Block downloads" hint="Prevents saving files or installers from websites." />
    </Card>
  </ParentsSurface>
);
