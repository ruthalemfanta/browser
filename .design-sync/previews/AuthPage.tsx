import { AuthPage, DemoBackend, ParentsSurface } from "wonderly-ds";

export const SignIn = () => (
  <DemoBackend account={null}>
    <ParentsSurface>
      <AuthPage onSignedIn={() => {}} />
    </ParentsSurface>
  </DemoBackend>
);
