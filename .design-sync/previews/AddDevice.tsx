import { AddDevice, ParentsSurface } from "wonderly-ds";

export const FirstDevice = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <AddDevice firstDevice knownIds={[]} onPaired={() => {}} />
  </ParentsSurface>
);

export const AnotherDevice = () => (
  <ParentsSurface style={{ padding: 24 }}>
    <AddDevice firstDevice={false} knownIds={[1, 2]} onPaired={() => {}} />
  </ParentsSurface>
);
