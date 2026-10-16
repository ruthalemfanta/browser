import { useState } from "react";
import logo from "../../brand/wonderly-logo.svg";

export default function PairSetup() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    const result = await window.browserAPI.pair(code);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Pairing failed.");
  }

  return (
    <section className="setup-page">
      <form
        className="pin-card"
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
      >
        <img className="setup-logo" src={logo} alt="Wonderly" />
        <span className="eyebrow">GROWN-UPS ONLY</span>
        <h1>Connect to the parent dashboard</h1>
        <p>Sign in to the parent dashboard, choose “Add device” and enter the pairing code here. Browsing stays locked until this is done.</p>

        <label htmlFor="pair-code">Pairing code</label>
        <input
          id="pair-code"
          className="pair-input"
          autoComplete="off"
          autoFocus
          spellCheck={false}
          maxLength={12}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX XXXX"
        />

        {error && <small className="form-error">{error}</small>}
        <button type="submit" className="primary" disabled={busy || code.replace(/\s/g, "").length < 8}>
          {busy ? "Connecting…" : "Connect"}
        </button>
      </form>
    </section>
  );
}
