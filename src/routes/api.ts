import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, CreateBlockSchema, UpdateBlockSchema, AuthContext } from "../types";

const app = new Hono<{ Bindings: Env; Variables: { auth: AuthContext } }>();

app.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing API key" }, 401);
  }
  const apiKey = authHeader.slice(7);
  const tenant = await c.env.DB.prepare(
    "SELECT id FROM tenants WHERE api_key = ?"
  )
    .bind(apiKey)
    .first<{ id: string }>();
  if (!tenant) {
    return c.json({ error: "Unauthorized: Invalid API key" }, 401);
  }
  c.set("auth", { tenant_id: tenant.id, is_admin: false });
  return next();
});

app.get("/blocks", async (c) => {
  const auth = c.get("auth");
  const results = await c.env.DB.prepare(
    "SELECT id, tenant_id, name, content, keywords, created_at, updated_at FROM blocks WHERE tenant_id = ? ORDER BY created_at DESC"
  )
    .bind(auth.tenant_id)
    .all<{
      id: string;
      tenant_id: string;
      name: string;
      content: string;
      keywords: string;
      created_at: string;
      updated_at: string;
    }>();

  const blocks = (results.results ?? []).map((row) => ({
    ...row,
    keywords: JSON.parse(row.keywords),
  }));

  return c.json({ blocks });
});

app.get("/blocks/:id", async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();
  const block = await c.env.DB.prepare(
    "SELECT id, tenant_id, name, content, keywords, created_at, updated_at FROM blocks WHERE id = ? AND tenant_id = ?"
  )
    .bind(id, auth.tenant_id)
    .first<{
      id: string;
      tenant_id: string;
      name: string;
      content: string;
      keywords: string;
      created_at: string;
      updated_at: string;
    }>();

  if (!block) {
    return c.json({ error: "Block not found" }, 404);
  }

  return c.json({
    block: {
      ...block,
      keywords: JSON.parse(block.keywords),
    },
  });
});

app.post("/blocks", zValidator("json", CreateBlockSchema), async (c) => {
  const auth = c.get("auth");
  const data = c.req.valid("json");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const keywordsJson = JSON.stringify(data.keywords);

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO blocks (id, tenant_id, name, content, keywords, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, auth.tenant_id, data.name, data.content, keywordsJson, now, now),
    ...data.keywords.map((keyword) =>
      c.env.DB.prepare(
        "INSERT INTO block_keywords (keyword, block_id, tenant_id) VALUES (?, ?, ?)"
      ).bind(keyword.toLowerCase(), id, auth.tenant_id)
    ),
  ]);

  const block = {
    id,
    tenant_id: auth.tenant_id,
    name: data.name,
    content: data.content,
    keywords: data.keywords,
    created_at: now,
    updated_at: now,
  };

  return c.json(block, 201);
});

app.put("/blocks/:id", zValidator("json", UpdateBlockSchema), async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();
  const data = c.req.valid("json");

  const existing = await c.env.DB.prepare(
    "SELECT id, name, content, keywords FROM blocks WHERE id = ? AND tenant_id = ?"
  )
    .bind(id, auth.tenant_id)
    .first<{
      id: string;
      name: string;
      content: string;
      keywords: string;
    }>();

  if (!existing) {
    return c.json({ error: "Block not found" }, 404);
  }

  const name = data.name ?? existing.name;
  const content = data.content ?? existing.content;
  const keywords = data.keywords ?? JSON.parse(existing.keywords);
  const now = new Date().toISOString();
  const keywordsJson = JSON.stringify(keywords);

  const statements = [
    c.env.DB.prepare(
      "UPDATE blocks SET name = ?, content = ?, keywords = ?, updated_at = ? WHERE id = ? AND tenant_id = ?"
    ).bind(name, content, keywordsJson, now, id, auth.tenant_id),
  ];

  if (data.keywords) {
    statements.push(
      c.env.DB.prepare(
        "DELETE FROM block_keywords WHERE block_id = ? AND tenant_id = ?"
      ).bind(id, auth.tenant_id)
    );
    for (const keyword of data.keywords) {
      statements.push(
        c.env.DB.prepare(
          "INSERT INTO block_keywords (keyword, block_id, tenant_id) VALUES (?, ?, ?)"
        ).bind(keyword.toLowerCase(), id, auth.tenant_id)
      );
    }
  }

  await c.env.DB.batch(statements);

  return c.json({
    id,
    tenant_id: auth.tenant_id,
    name,
    content,
    keywords,
    updated_at: now,
  });
});

app.delete("/blocks/:id", async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();

  const existing = await c.env.DB.prepare(
    "SELECT id FROM blocks WHERE id = ? AND tenant_id = ?"
  )
    .bind(id, auth.tenant_id)
    .first();

  if (!existing) {
    return c.json({ error: "Block not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM blocks WHERE id = ? AND tenant_id = ?")
    .bind(id, auth.tenant_id)
    .run();

  return c.json({ deleted: true });
});

export { app as apiRoutes };