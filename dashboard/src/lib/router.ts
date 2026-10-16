import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

export function navigate(to: string, { replace = false } = {}) {
  if (to === window.location.pathname) return;
  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  window.scrollTo(0, 0);
  listeners.forEach(listener => listener());
}

export function usePath() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}
