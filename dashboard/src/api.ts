import type { Device, LogEntry, Policy } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data)
  });

  if (response.status === 401 && !path.startsWith("/auth/")) onUnauthorized();
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(response.status, payload.error ?? "Request failed");
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

type Account = { email: string };

export const api = {
  me: () => request<Account>("GET", "/auth/me"),
  login: (email: string, password: string) => request<Account>("POST", "/auth/login", { email, password }),
  signup: (email: string, password: string) => request<Account>("POST", "/auth/signup", { email, password }),
  logout: () => request<void>("POST", "/auth/logout"),

  devices: () => request<Device[]>("GET", "/devices"),
  createPairing: (name: string) => request<{ code: string; expiresAt: number }>("POST", "/devices/pairing", { name }),
  renameDevice: (id: number, name: string) => request<void>("PATCH", `/devices/${id}`, { name }),
  removeDevice: (id: number) => request<void>("DELETE", `/devices/${id}`),

  policy: (id: number) => request<Policy>("GET", `/devices/${id}/policy`),
  updatePolicy: (id: number, patch: Partial<Policy>) => request<Policy>("PUT", `/devices/${id}/policy`, patch),
  requests: (id: number) => request<string[]>("GET", `/devices/${id}/requests`),
  resolveRequest: (id: number, domain: string, approve: boolean) =>
    request<Policy>("POST", `/devices/${id}/requests`, { domain, approve }),
  log: (id: number) => request<LogEntry[]>("GET", `/devices/${id}/log`),
  clearLog: (id: number) => request<void>("DELETE", `/devices/${id}/log`)
};
