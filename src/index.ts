import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Env } from "./types";
import { mcpRoutes } from "./routes/mcp";
import { apiRoutes } from "./routes/api";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { dashboardRoutes } from "./routes/dashboard";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://bc-dashboard.pages.dev",
    "https://bc-dashboard-1i3.pages.dev",
    "https://8d1d1d8d.bc-dashboard-1i3.pages.dev",
    "https://939f2f93.bc-dashboard-1i3.pages.dev",
    "https://9901bc96.bc-dashboard-1i3.pages.dev",
    "https://master.bc-dashboard-1i3.pages.dev",
  ],
  credentials: true,
}));

app.route("/mcp/v1", mcpRoutes);
app.route("/api/v1", apiRoutes);
app.route("/admin/v1", adminRoutes);
app.route("/auth", authRoutes);
app.route("/dashboard", dashboardRoutes);

app.get("/", (c) => {
  return c.json({
    name: "BC - Base de Conocimiento",
    version: "1.0.0",
    endpoints: {
      mcp: "/mcp/v1/query",
      api: "/api/v1/blocks",
      admin: "/admin/v1/tenants",
    },
  });
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;