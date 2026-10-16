import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

export const config = {
  port: Number(process.env.PORT) || 8787,
  host: process.env.HOST ?? "0.0.0.0",
  dataDir: path.resolve(process.env.DATA_DIR ?? path.join(root, "data")),
  dashboardDir: path.resolve(process.env.DASHBOARD_DIR ?? path.join(root, "../dashboard/dist")),
  trustProxy: process.env.TRUST_PROXY === "1",
  production: process.env.NODE_ENV === "production"
};
