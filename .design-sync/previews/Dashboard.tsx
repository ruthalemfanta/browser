import { Dashboard, DemoBackend, ParentsSurface } from "wonderly-ds";

export const TwoDevices = () => (
  <DemoBackend>
    <ParentsSurface>
      <Dashboard email="sam.parent@example.com" onSignOut={() => {}} />
    </ParentsSurface>
  </DemoBackend>
);

export const FirstDevice = () => (
  <DemoBackend devices={[]}>
    <ParentsSurface>
      <Dashboard email="sam.parent@example.com" onSignOut={() => {}} />
    </ParentsSurface>
  </DemoBackend>
);
