import { DevicePanel, ParentsSurface } from "wonderly-ds";

const device = { id: 1, name: "Maya's laptop", lastSeen: Date.now() - 4 * 60_000, createdAt: Date.now() - 30 * 86_400_000, pending: 2, online: true };
const noop = () => {};

const Panel = ({ section }: { section: "requests" | "sites" | "words" | "protection" | "activity" | "device" }) => (
  <ParentsSurface style={{ padding: 24 }}>
    <DevicePanel device={device} section={section} onDevicesChanged={noop} />
  </ParentsSurface>
);

export const Requests = () => <Panel section="requests" />;
export const Websites = () => <Panel section="sites" />;
export const BlockedWords = () => <Panel section="words" />;
export const Protection = () => <Panel section="protection" />;
export const Activity = () => <Panel section="activity" />;
export const DeviceSection = () => <Panel section="device" />;
