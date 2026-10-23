import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../src/styles.css";
import "./proto.css";
import Console from "./Console";
import Home from "./Home";
import { ToastHost } from "./shared";
import { FamilyProvider } from "./store";
import Tabs from "./Tabs";

const VARIANTS = [
  { name: "Console", Component: Console },
  { name: "Tabs", Component: Tabs },
  { name: "Home", Component: Home }
];

function initial() {
  const v = parseInt(new URLSearchParams(location.search).get("v") ?? "", 10);
  return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
}

function Harness() {
  const [current, setCurrent] = useState(initial);
  const [mountKey, setMountKey] = useState(0);
  const [ready, setReady] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const highlightRef = useRef<HTMLSpanElement>(null);

  function select(i: number) {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setMountKey(k => k + 1);
    const url = new URL(location.href);
    url.searchParams.set("v", String(i + 1));
    history.replaceState(null, "", url);
  }

  useLayoutEffect(() => {
    const move = () => {
      const el = itemRefs.current[current];
      const hl = highlightRef.current;
      if (!el || !hl) return;
      hl.style.width = `${el.offsetWidth}px`;
      hl.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [current]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) select(num - 1);
      else if (e.key === "ArrowRight") select((current + 1) % VARIANTS.length);
      else if (e.key === "ArrowLeft") select((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === "r" || e.key === "R") setMountKey(k => k + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current]);

  const { Component } = VARIANTS[current];

  return (
    <>
      <Component key={mountKey} />
      <ToastHost />
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready || undefined}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlightRef} />
        {VARIANTS.map((v, i) => (
          <button
            key={v.name}
            ref={el => { itemRefs.current[i] = el; }}
            className="proto-picker-item"
            data-active={i === current || undefined}
            aria-current={i === current ? "true" : undefined}
            onClick={() => select(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setMountKey(k => k + 1)}>↻</button>
      </nav>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <FamilyProvider>
    <Harness />
  </FamilyProvider>
);
