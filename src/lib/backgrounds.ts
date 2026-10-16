export const BACKGROUNDS = [
  { id: "sky", label: "Sky", css: "#7CCBF4" },
  { id: "lime", label: "Lime", css: "#D9F45F" },
  { id: "pink", label: "Bubblegum", css: "#F3A9E9" },
  { id: "sun", label: "Sunshine", css: "#FFD84D" },
  { id: "dots", label: "Dots", css: "radial-gradient(#11111140 1.6px, transparent 1.8px) 0 0/22px 22px, #7CCBF4" },
  { id: "grid", label: "Grid", css: "linear-gradient(#1111111a 2px, transparent 2px) 0 0/40px 40px, linear-gradient(90deg, #1111111a 2px, transparent 2px) 0 0/40px 40px, #D9F45F" },
  { id: "stripes", label: "Stripes", css: "repeating-linear-gradient(45deg, #F3A9E9 0 24px, #f8c9f1 24px 48px)" },
  { id: "checks", label: "Checks", css: "conic-gradient(#FFD84D 25%, #fff0b0 0 50%, #FFD84D 0 75%, #fff0b0 0) 0 0/60px 60px" }
];

const KEY = "wonderly-bg";
const CUSTOM_KEY = "wonderly-bg-custom";
const MAX_CUSTOM = 3_000_000;

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadBackground() {
  return { id: read(KEY) ?? "sky", custom: read(CUSTOM_KEY) };
}

export function saveBackground(id: string) {
  write(KEY, id);
}

export function saveCustomBackground(dataUrl: string) {
  if (dataUrl.length > MAX_CUSTOM || !dataUrl.startsWith("data:image/")) return false;
  return write(CUSTOM_KEY, dataUrl) && write(KEY, "custom");
}

export function backgroundCss(id: string, custom: string | null) {
  if (id === "custom" && custom) return `url("${custom}") center/cover`;
  return (BACKGROUNDS.find(b => b.id === id) ?? BACKGROUNDS[0]).css;
}
