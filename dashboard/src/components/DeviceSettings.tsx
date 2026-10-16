import { useState } from "react";
import { api } from "../api";
import type { Device } from "../types";
import { Card } from "./ui";

export default function DeviceSettings({ device, onChanged }: { device: Device; onChanged: () => void }) {
  const [name, setName] = useState(device.name);
  const [message, setMessage] = useState("");

  async function rename() {
    try {
      await api.renameDevice(device.id, name);
      setMessage("Saved.");
      onChanged();
    } catch {
      setMessage("Couldn't rename.");
    }
  }

  async function remove() {
    if (!confirm(`Disconnect “${device.name}”? Its browser will lock until it's paired again.`)) return;
    await api.removeDevice(device.id).catch(() => {});
    onChanged();
  }

  return (
    <>
      <Card title="Device name">
        <form
          className="inline-form"
          onSubmit={event => {
            event.preventDefault();
            rename();
          }}
        >
          <input value={name} onChange={e => setName(e.target.value)} maxLength={60} />
          <button type="submit" className="primary" disabled={!name.trim() || name === device.name}>Save</button>
        </form>
        {message && <small className="form-note">{message}</small>}
      </Card>

      <Card title="Disconnect device" hint="Removes this browser from your account and deletes its activity. The browser stays locked until paired again.">
        <button className="danger-button" onClick={remove}>Disconnect</button>
      </Card>
    </>
  );
}
