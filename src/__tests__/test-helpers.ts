import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "../types";
import { mcpRoutes } from "../routes/mcp";
import { apiRoutes } from "../routes/api";
import { adminRoutes } from "../routes/admin";

export function createTestApp(_d1: D1Database, _kv: KVNamespace): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", cors());
  app.route("/mcp/v1", mcpRoutes);
  app.route("/api/v1", apiRoutes);
  app.route("/admin/v1", adminRoutes);
  return app;
}