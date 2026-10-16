const net = require("node:net");

const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s" };
const HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

const SAFE_SEARCH = [
  { host: /(^|\.)google\.[a-z.]+$/, path: /^\/(search|images|webhp)?$/, param: ["safe", "active"] },
  { host: /(^|\.)bing\.com$/, path: /^\/(search|images|videos)/, param: ["adlt", "strict"] },
  { host: /(^|\.)duckduckgo\.com$/, path: /^\/$/, param: ["kp", "1"] },
  { host: /(^|\.)search\.yahoo\.com$/, path: /^\/search/, param: ["vm", "r"] }
];

function normalizeText(text) {
  return String(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function deLeet(text) {
  return text.replace(/[013457@$]/g, c => LEET[c]);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const regexCache = new Map();

function wordRegex(words) {
  const key = words.join("\n");
  if (regexCache.has(key)) return regexCache.get(key);

  const alternatives = words
    .map(word => normalizeText(word).trim())
    .filter(Boolean)
    .map(word => word.split(/\s+/).map(escapeRegex).join("[\\s\\W_]+"));

  const regex = alternatives.length
    ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join("|")})(?![\\p{L}\\p{N}])`, "u")
    : null;

  regexCache.clear();
  regexCache.set(key, regex);
  return regex;
}

function findBlockedWord(text, words) {
  const regex = wordRegex(words);
  if (!regex) return null;

  const normalized = normalizeText(text);
  const match = regex.exec(normalized) || regex.exec(deLeet(normalized));
  return match ? match[0] : null;
}

function findBlockedWordInUrl(url, words) {
  let decoded = `${url.pathname} ${url.search}`;
  try {
    decoded = decodeURIComponent(decoded.replace(/\+/g, " "));
  } catch {}

  const host = normalizeText(url.hostname);
  const hostHit = words
    .map(word => normalizeText(word).replace(/\s+/g, ""))
    .find(word => word.length >= 4 && (host.includes(word) || deLeet(host).includes(word)));

  return hostHit || findBlockedWord(decoded.replace(/[/?=&#._-]/g, " "), words);
}

function normalizeDomain(input) {
  const value = String(input || "").trim().toLowerCase();
  if (!value) return null;

  try {
    const host = new URL(/^[a-z]+:\/\//.test(value) ? value : `https://${value}`)
      .hostname.replace(/^www\./, "").replace(/\.$/, "");
    return HOST_PATTERN.test(host) ? host : null;
  } catch {
    return null;
  }
}

function hostMatches(hostname, domains) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
}

function isPrivateHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "");
  return net.isIP(host) !== 0 || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local");
}

function checkNavigation(urlString, policy) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { allowed: false, reason: "invalid" };
  }

  if (url.protocol !== "https:") return { allowed: false, reason: "insecure", host: url.hostname };
  if (url.username || url.password) return { allowed: false, reason: "invalid", host: url.hostname };
  if (isPrivateHost(url.hostname)) return { allowed: false, reason: "ip-address", host: url.hostname };

  if (hostMatches(url.hostname, policy.blockedSites)) {
    return { allowed: false, reason: "blocked-site", host: url.hostname };
  }

  const word = findBlockedWordInUrl(url, policy.blockedWords);
  if (word) return { allowed: false, reason: "blocked-word", host: url.hostname, detail: word };

  if (policy.mode === "allowlist" && !hostMatches(url.hostname, policy.allowedSites)) {
    return { allowed: false, reason: "not-allowed", host: url.hostname };
  }

  return { allowed: true, host: url.hostname };
}

function checkResource(urlString, policy) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { allowed: false };
  }

  if (["data:", "blob:"].includes(url.protocol)) return { allowed: true };
  if (!["https:", "wss:"].includes(url.protocol)) return { allowed: false };
  return { allowed: !hostMatches(url.hostname, policy.blockedSites) };
}

function enforceSafeSearch(urlString) {
  const url = new URL(urlString);
  const rule = SAFE_SEARCH.find(r => r.host.test(url.hostname) && r.path.test(url.pathname));
  if (!rule) return null;

  const [key, value] = rule.param;
  if (url.searchParams.get(key) === value) return null;

  url.searchParams.set(key, value);
  return url.href;
}

function isYouTube(hostname) {
  return hostMatches(hostname, ["youtube.com", "youtube-nocookie.com", "youtubei.googleapis.com", "youtube.googleapis.com"]);
}

module.exports = {
  checkNavigation,
  checkResource,
  enforceSafeSearch,
  findBlockedWord,
  hostMatches,
  isYouTube,
  normalizeDomain
};
