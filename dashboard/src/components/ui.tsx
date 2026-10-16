import type { ReactNode } from "react";

export function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {hint && <p className="card-hint">{hint}</p>}
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input type="checkbox" className="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}
