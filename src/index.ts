import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Env } from "./types";
import { mcpRoutes } from "./routes/mcp";
import { apiRoutes } from "./routes/api";
import { adminRoutes } from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors());

app.route("/mcp/v1", mcpRoutes);
app.route("/api/v1", apiRoutes);
app.route("/admin/v1", adminRoutes);

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