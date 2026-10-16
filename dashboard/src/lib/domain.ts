const HOST = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

export function normalizeDomain(input: string): string | null {
  const value = input.trim().toLowerCase();
  try {
    const host = new URL(/^[a-z]+:\/\//.test(value) ? value : `https://${value}`)
      .hostname.replace(/^www\./, "");
    return HOST.test(host) ? host : null;
  } catch {
    return null;
  }
}
