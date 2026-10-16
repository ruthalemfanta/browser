import { useRef, useState } from "react";
import { X } from "lucide-react";
import { BACKGROUNDS, saveBackground, saveCustomBackground } from "../lib/backgrounds";

type Background = { id: string; custom: string | null };

export default function BackgroundPicker({ value, onChange, onClose }: {
  value: Background;
  onChange: (next: Background) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const options = value.custom
    ? [...BACKGROUNDS, { id: "custom", label: "My picture", css: `url("${value.custom}") center/cover` }]
    : BACKGROUNDS;

  function pick(id: string) {
    saveBackground(id);
    onChange({ ...value, id });
  }

  function upload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      if (!saveCustomBackground(dataUrl)) {
        setError("That picture is too big. Try a smaller one.");
        return;
      }
      setError("");
      onChange({ id: "custom", custom: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-picker" role="dialog" aria-label="Pick a background">
      <div className="bg-picker-head">
        <strong>Pick a background</strong>
        <button onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="bg-grid">
        {options.map(option => (
          <button
            key={option.id}
            className={option.id === value.id ? "selected" : ""}
            onClick={() => pick(option.id)}
          >
            <span style={{ background: option.css }} />
            {option.label}
          </button>
        ))}
      </div>
      <button className="bg-upload" onClick={() => fileRef.current?.click()}>Upload my own picture</button>
      {error && <small className="form-error">{error}</small>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={event => upload(event.target.files?.[0])}
      />
    </div>
  );
}
