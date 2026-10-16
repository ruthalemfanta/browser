import { useState } from "react";
import { Plus, Search, X } from "lucide-react";

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  emptyText: string;
  normalize?: (value: string) => string | null;
};

export default function ListEditor({ items, onChange, placeholder, emptyText, normalize }: Props) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function add() {
    const values = draft.split(/[\n,]+/).map(v => v.trim()).filter(Boolean);
    const cleaned = values.map(v => (normalize ? normalize(v) : v.toLowerCase()));

    if (cleaned.some(v => !v)) {
      setError("Some entries aren't valid.");
      return;
    }

    onChange([...new Set([...items, ...(cleaned as string[])])]);
    setDraft("");
    setError("");
  }

  const visible = items.filter(item => item.includes(query.toLowerCase()));

  return (
    <div className="list-editor">
      <form
        className="list-editor-add"
        onSubmit={event => {
          event.preventDefault();
          add();
        }}
      >
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" disabled={!draft.trim()}>
          <Plus size={16} /> Add
        </button>
      </form>
      {error && <small className="form-error">{error}</small>}

      {items.length > 8 && (
        <label className="list-editor-search">
          <Search size={14} />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter list" />
        </label>
      )}

      {items.length === 0 ? (
        <p className="empty-note">{emptyText}</p>
      ) : (
        <div className="chip-list">
          {visible.map(item => (
            <span className="chip" key={item}>
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => onChange(items.filter(i => i !== item))}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
