const REPO = (import.meta.env.VITE_GITHUB_REPO || "ruthalemfanta/browser")
  .trim()
  .replace(/^(https?:\/\/)?github\.com\//, "")
  .replace(/(\.git)?\/*$/, "");
const BASE = `https://github.com/${REPO}/releases/latest/download`;

export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;

export type Platform = "mac" | "windows" | "linux";

export const DOWNLOADS: { platform: Platform; label: string; href: string }[] = [
  { platform: "mac", label: "macOS (Apple Silicon)", href: `${BASE}/Wonderly-mac-arm64.dmg` },
  { platform: "mac", label: "macOS (Intel)", href: `${BASE}/Wonderly-mac-x64.dmg` },
  { platform: "windows", label: "Windows", href: `${BASE}/Wonderly-windows-setup.exe` },
  { platform: "linux", label: "Linux (AppImage)", href: `${BASE}/Wonderly-linux.AppImage` }
];

export function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad/i.test(ua)) return null;
  if (/Mac/i.test(ua)) return "mac";
  if (/Win/i.test(ua)) return "windows";
  if (/Linux|X11/i.test(ua)) return "linux";
  return null;
}
