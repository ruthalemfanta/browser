export const PALETTE = ["#7CCBF4", "#FFD84D", "#D9F45F", "#F3A9E9", "#FF9B6A"];

const KNOWN: Record<string, string> = {
  "google.com": "Google",
  "wikipedia.org": "Wikipedia",
  "kids.nationalgeographic.com": "NatGeo Kids",
  "pbskids.org": "PBS Kids",
  "khanacademy.org": "Khan Academy",
  "scratch.mit.edu": "Scratch",
  "starfall.com": "Starfall",
  "abcya.com": "ABCya",
  "duolingo.com": "Duolingo",
  "youtube.com": "YouTube"
};

const DEFAULT_PLACES = ["pbskids.org", "kids.nationalgeographic.com", "wikipedia.org", "google.com"];

function hostOf(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function siteColor(value: string) {
  const host = hostOf(value);
  let hash = 0;
  for (const char of host) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function siteName(domain: string) {
  if (KNOWN[domain]) return KNOWN[domain];
  const label = domain.split(".").at(-2) ?? domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function places(mode: "allowlist" | "blocklist", approved: string[]) {
  const list = mode === "allowlist" && approved.length > 0 ? approved : DEFAULT_PLACES;
  return list.slice(0, 12).map(domain => ({
    domain,
    name: siteName(domain),
    letter: siteName(domain).charAt(0).toUpperCase(),
    color: siteColor(domain)
  }));
}
