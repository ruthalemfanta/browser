import { DeviceSettings, ParentsSurface } from "wonderly-ds";

export const RenameOrDisconnect = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <DeviceSettings
      device={{ id: 2, name: "Leo's desktop", lastSeen: Date.now() - 26 * 3_600_000, createdAt: Date.now() - 12 * 86_400_000, pending: 0, online: false }}
      onChanged={() => {}}
    />
  </ParentsSurface>
);
