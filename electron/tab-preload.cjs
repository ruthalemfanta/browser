const { ipcRenderer } = require("electron");

const MAX_TEXT = 300_000;
let timer = null;
let lastSent = "";

function pageText() {
  const body = document.body;
  if (!body) return "";
  const alt = [...document.querySelectorAll("img[alt], [aria-label]")]
    .slice(0, 500)
    .map(el => el.getAttribute("alt") || el.getAttribute("aria-label"))
    .join(" ");
  return `${document.title} ${body.innerText} ${alt}`.slice(0, MAX_TEXT);
}

function scan(initial) {
  const text = pageText();
  if (!initial && text === lastSent) return;
  lastSent = text;
  ipcRenderer.send("guard:scan", { text, initial });
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => scan(false), 700);
}

window.addEventListener("DOMContentLoaded", () => {
  scan(true);
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
});
