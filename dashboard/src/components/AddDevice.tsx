import { useEffect, useState } from "react";
import { api } from "../api";
import { Card } from "./ui";

export default function AddDevice({ firstDevice, knownIds, onPaired }: {
  firstDevice: boolean;
  knownIds: number[];
  onPaired: () => void;
}) {
  const [name, setName] = useState("");
  const [pairing, setPairing] = useState<{ code: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pairing) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      const devices = await api.devices().catch(() => []);
      if (devices.some(d => !knownIds.includes(d.id))) onPaired();
    }, 3000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [pairing, knownIds, onPaired]);

  async function create() {
    setError("");
    try {
      setPairing(await api.createPairing(name));
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create a code");
    }
  }

  const secondsLeft = pairing ? Math.max(0, Math.ceil((pairing.expiresAt - now) / 1000)) : 0;

  return (
    <div className="panel">
      <h1>{firstDevice ? "Connect your child's browser" : "Add a device"}</h1>
      <p className="lead">Generate a one-time code, then type it into the browser on your child's computer.</p>

      <Card title="1. Name the device">
        <form
          className="inline-form"
          onSubmit={event => {
            event.preventDefault();
            create();
          }}
        >
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maya's laptop" maxLength={60} />
          <button type="submit" className="primary">{pairing ? "New code" : "Get pairing code"}</button>
        </form>
        {error && <small className="form-error">{error}</small>}
      </Card>

      {pairing && (
        <Card title="2. Enter this code in the browser">
          {secondsLeft > 0 ? (
            <>
              <div className="pair-code">{pairing.code.replace(/(.{4})/, "$1 ")}</div>
              <p className="card-hint">
                Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}. This page updates once the browser connects.
              </p>
            </>
          ) : (
            <p className="form-error">This code expired. Generate a new one.</p>
          )}
        </Card>
      )}
    </div>
  );
}
