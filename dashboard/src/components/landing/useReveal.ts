import { useEffect, type RefObject } from "react";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp(el: HTMLElement) {
  const to = Number(el.textContent), from = Number(el.dataset.count), start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / 1400);
    el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    el.classList.add("lp-fx");
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const target = entry.target as HTMLElement;
      target.classList.add("in");
      io.unobserve(target);
      if (!reducedMotion()) target.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
    }), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    el.querySelectorAll(".lp-reveal").forEach(node => io.observe(node));
    return () => io.disconnect();
  }, [root]);
}
