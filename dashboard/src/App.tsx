import { useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "./api";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import Landing from "./components/landing/Landing";
import { navigate, usePath } from "./lib/router";

export default function App() {
  const path = usePath();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setUnauthorizedHandler(() => setEmail(null));
    api.me().then(a => setEmail(a.email)).catch(() => setEmail(null));
  }, []);

  useEffect(() => {
    if (email === undefined) return;
    if (path === "/dashboard" && email === null) navigate("/login", { replace: true });
    if (path === "/login" && email) navigate("/dashboard", { replace: true });
  }, [path, email]);

  if (path === "/login") {
    return email === null ? <AuthPage onSignedIn={next => { setEmail(next); navigate("/dashboard"); }} /> : null;
  }

  if (path === "/dashboard") {
    if (!email) return null;
    return (
      <Dashboard
        email={email}
        onSignOut={async () => {
          await api.logout().catch(() => {});
          setEmail(null);
          navigate("/");
        }}
      />
    );
  }

  return <Landing signedIn={Boolean(email)} />;
}
