import { useEffect, useRef } from "react";

const WORDS = ["Dinosaurs?", "Outer space?", "Ocean animals?"];

export default function Mascot() {
  const pupils = useRef<SVGGElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = pupils.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260) * 5;
      el.style.setProperty("--px", `${(dx / d * k).toFixed(2)}px`);
      el.style.setProperty("--py", `${(dy / d * k).toFixed(2)}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="lp-box lp-buddy" aria-hidden="true">
      <div className="lp-bubble">
        <span className="ghost">{WORDS[2]}</span>
        {WORDS.map((w, i) => <span key={w} className="word" style={{ animationDelay: `${i * 3}s` }}>{w}</span>)}
      </div>
      <span className="lp-orb o1" /><span className="lp-orb o2" /><span className="lp-orb o3" />
      <svg className="lp-buddy-svg" viewBox="0 0 200 210">
        <ellipse className="shadow" cx="100" cy="196" rx="46" ry="7" fill="#11111133" />
        <g className="body">
          <line x1="100" y1="58" x2="100" y2="30" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          <polygon className="star" points="100,8 106,21 120,22 109,31 113,45 100,37 87,45 91,31 80,22 94,21" fill="#7CCBF4" stroke="#111" strokeWidth="3.5" strokeLinejoin="round" />
          <g className="arm">
            <path d="M150 120 Q 172 108 176 82" fill="none" stroke="#111" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="176" cy="78" r="9" fill="#FFD84D" stroke="#111" strokeWidth="4" />
          </g>
          <path d="M52 128 Q 34 140 36 160" fill="none" stroke="#111" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="36" cy="164" r="9" fill="#FFD84D" stroke="#111" strokeWidth="4" />
          <circle cx="100" cy="118" r="60" fill="#FFD84D" stroke="#111" strokeWidth="4.5" />
          <ellipse cx="66" cy="134" rx="9" ry="6" fill="#F3A9E9" />
          <ellipse cx="134" cy="134" rx="9" ry="6" fill="#F3A9E9" />
          <g className="eyes">
            <ellipse cx="80" cy="108" rx="14" ry="17" fill="#fff" stroke="#111" strokeWidth="4" />
            <ellipse cx="120" cy="108" rx="14" ry="17" fill="#fff" stroke="#111" strokeWidth="4" />
            <g ref={pupils} className="pupils">
              <circle cx="80" cy="110" r="7" fill="#111" />
              <circle cx="120" cy="110" r="7" fill="#111" />
              <circle cx="83" cy="106" r="2.2" fill="#fff" />
              <circle cx="123" cy="106" r="2.2" fill="#fff" />
            </g>
          </g>
          <path d="M86 140 Q 100 154 114 140" fill="none" stroke="#111" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
