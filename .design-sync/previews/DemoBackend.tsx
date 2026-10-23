import { DemoBackend, DevicePanel, ParentsSurface } from "wonderly-ds";

const device = { id: 7, name: "Ava's Chromebook", lastSeen: Date.now() - 60_000, createdAt: Date.now() - 3 * 86_400_000, pending: 3, online: true };

export const CustomRequests = () => (
  <DemoBackend devices={[device]} requests={["roblox.com", "nasa.gov", "duolingo.com"]}>
    <ParentsSurface style={{ padding: 24 }}>
      <DevicePanel device={device} section="requests" onDevicesChanged={() => {}} />
    </ParentsSurface>
  </DemoBackend>
);
