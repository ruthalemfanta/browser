import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(root, "data"));

export const config = {
  port: Number(process.env.PORT) || 8787,
  host: process.env.HOST ?? "0.0.0.0",
  dataDir,
  databaseUrl: process.env.DATABASE_URL ?? `file:${path.join(dataDir, "guardian.db")}`,
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  dashboardDir: path.resolve(process.env.DASHBOARD_DIR ?? path.join(root, "../dashboard/dist")),
  trustProxy: process.env.TRUST_PROXY === "1",
  production: process.env.NODE_ENV === "production"
};
