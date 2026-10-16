import { useState } from "react";
import { backgroundCss, loadBackground } from "../lib/backgrounds";
import { places } from "../lib/places";
import BackgroundPicker from "./BackgroundPicker";

const SUGGESTIONS = ["Dinosaurs", "Space", "How to draw a cat", "Ocean animals"];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";
}

export default function HomePage({ mode, approvedSites, onSearch, onOpen }: {
  mode: "allowlist" | "blocklist";
  approvedSites: string[];
  onSearch: (query: string) => void;
  onOpen: (domain: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [background, setBackground] = useState(loadBackground);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="home-page" style={{ background: backgroundCss(background.id, background.custom) }}>
      <div className="home-inner">
        <div className="hero-card">
          <span className="date-label">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <h1>{greeting()}</h1>
          <form
            className="hero-search"
            onSubmit={event => {
              event.preventDefault();
              onSearch(query);
            }}
          >
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="What do you want to discover?"
              aria-label="Search the web"
            />
            <button type="submit">Search</button>
          </form>
          <div className="suggestions">
            <span>Try:</span>
            {SUGGESTIONS.map(label => (
              <button key={label} onClick={() => onSearch(label)}>{label}</button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="section-chip">My Places</h2>
          <div className="places-grid">
            {places(mode, approvedSites).map(place => (
              <button key={place.domain} className="place-card" onClick={() => onOpen(place.domain)}>
                <span className="place-letter" style={{ background: place.color }}>{place.letter}</span>
                <strong>{place.name}</strong>
                <small>{place.domain}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {pickerOpen && (
        <BackgroundPicker
          value={background}
          onChange={setBackground}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <button className="bg-button" onClick={() => setPickerOpen(open => !open)}>
        <span className="bg-swatch" /> Change background
      </button>
    </section>
  );
}
