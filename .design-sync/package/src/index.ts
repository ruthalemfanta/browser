import "./fonts.css";
import "../../../src/styles.css";
import "../../../dashboard/src/styles.css";

export { BrowserSurface, ParentsSurface } from "./surfaces";
export { DemoBackend, configureDemoBackend, type DemoBackendProps } from "./demo-backend";

export { default as BrowserApp } from "../../../src/App";
export { default as HomePage } from "../../../src/components/HomePage";
export { default as BlockedPage } from "../../../src/components/BlockedPage";
export { default as BackgroundPicker } from "../../../src/components/BackgroundPicker";
export { default as PairSetup } from "../../../src/components/PairSetup";

export { default as Dashboard } from "../../../dashboard/src/components/Dashboard";
export { default as DevicePanel } from "../../../dashboard/src/components/DevicePanel";
export { default as AddDevice } from "../../../dashboard/src/components/AddDevice";
export { default as DeviceSettings } from "../../../dashboard/src/components/DeviceSettings";
export { default as ActivityLog } from "../../../dashboard/src/components/ActivityLog";
export { default as ListEditor } from "../../../dashboard/src/components/ListEditor";
export { default as AuthPage } from "../../../dashboard/src/components/AuthPage";
export { default as Link } from "../../../dashboard/src/components/Link";
export { Card, Toggle } from "../../../dashboard/src/components/ui";
export { default as Landing } from "../../../dashboard/src/components/landing/Landing";
export { BrowserMock } from "../../../dashboard/src/components/landing/Mocks";
