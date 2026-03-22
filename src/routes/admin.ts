import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, CreateTenantSchema } from "../types";
import { dashboardAuthMiddleware, requireAdmin } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("*", dashboardAuthMiddleware);
app.use("*", requireAdmin);

app.post("/tenants", zValidator("json", CreateTenantSchema), async (c) => {
  const data = c.req.valid("json");
  const id = crypto.randomUUID();
  const apiKey = `sk_${crypto.randomUUID().replace(/-/g, "")}`;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    "INSERT INTO tenants (id, name, api_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, data.name, apiKey, now, now)
    .run();

  return c.json(
    {
      id,
      name: data.name,
      api_key: apiKey,
      created_at: now,
      updated_at: now,
    },
    201
  );
});

app.get("/tenants", async (c) => {
  const results = await c.env.DB.prepare(
    "SELECT id, name, created_at, updated_at FROM tenants ORDER BY created_at DESC"
  ).all<{ id: string; name: string; created_at: string; updated_at: string }>();

  return c.json({ tenants: results.results ?? [] });
});

app.get("/tenants-with-keys", async (c) => {
  const results = await c.env.DB.prepare(
    "SELECT id, name, api_key, created_at, updated_at FROM tenants ORDER BY created_at DESC"
  ).all<{ id: string; name: string; api_key: string; created_at: string; updated_at: string }>();

  return c.json({ tenants: results.results ?? [] });
});

app.get("/tenants/:id", async (c) => {
  const { id } = c.req.param();
  const tenant = await c.env.DB.prepare(
    "SELECT id, name, created_at, updated_at FROM tenants WHERE id = ?"
  )
    .bind(id)
    .first<{ id: string; name: string; created_at: string; updated_at: string }>();

  if (!tenant) {
    return c.json({ error: "Tenant not found" }, 404);
  }

  return c.json(tenant);
});

app.delete("/tenants/:id", async (c) => {
  const { id } = c.req.param();

  const existing = await c.env.DB.prepare(
    "SELECT id FROM tenants WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Tenant not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM tenants WHERE id = ?").bind(id).run();

  return c.json({ deleted: true });
});

export { app as adminRoutes };