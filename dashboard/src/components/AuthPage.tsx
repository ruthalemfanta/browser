import { useState } from "react";
import { api } from "../api";
import Link from "./Link";
import logo from "../../../brand/wonderly-logo.svg";

export default function AuthPage({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const account = mode === "login" ? await api.login(email, password) : await api.signup(email, password);
      onSignedIn(account.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link to="/" className="auth-home"><img src={logo} alt="Wonderly" /></Link>
      <form
        className="auth-card"
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
      >
    
        <h1>{mode === "login" ? "Parent sign in" : "Create a parent account"}</h1>
        <p>Manage websites, words and browsing hours for your child's browser.</p>

        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 10 : undefined}
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {mode === "signup" && <small className="field-hint">At least 10 characters.</small>}

        {error && <small className="form-error">{error}</small>}
        <button type="submit" className="primary" disabled={busy}>
          {mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
