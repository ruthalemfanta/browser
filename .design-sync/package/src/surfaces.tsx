import type { CSSProperties, ReactNode } from "react";

type SurfaceProps = { children: ReactNode; className?: string; style?: CSSProperties };

/** Root for anything from the kids' browser (BrowserApp, HomePage, BlockedPage, BackgroundPicker, PairSetup). Carries its tokens and styles; without it those components render unstyled. */
export function BrowserSurface({ children, className, style }: SurfaceProps) {
  return <div className={`wonderly-browser${className ? ` ${className}` : ""}`} style={style}>{children}</div>;
}

/** Root for anything from the parent site (Dashboard, DevicePanel, AuthPage, Landing, Card, Toggle, ListEditor…). Carries its tokens and styles; without it those components render unstyled. */
export function ParentsSurface({ children, className, style }: SurfaceProps) {
  return <div className={`wonderly-parents${className ? ` ${className}` : ""}`} style={style}>{children}</div>;
}
