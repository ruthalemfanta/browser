import { ActivityLog, ParentsSurface } from "wonderly-ds";

export const RecentActivity = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <ActivityLog deviceId={1} />
  </ParentsSurface>
);
