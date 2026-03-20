import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, QuerySchema, AuthContext } from "../types";
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

app.post("/query", zValidator("json", QuerySchema), async (c) => {
  const { query } = c.req.valid("json");
  const auth = c.get("auth");

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 10);

  if (keywords.length === 0) {
    return c.json({ error: "Query too short", details: { min_length: 3 } }, 400);
  }

  const placeholders = keywords.map(() => "?").join(",");
  const results = await c.env.DB.prepare(
    `SELECT b.id, b.tenant_id, b.name, b.content, b.keywords, b.created_at, b.updated_at,
            COUNT(DISTINCT bk.keyword) as match_count
     FROM blocks b
     JOIN block_keywords bk ON b.id = bk.block_id
     WHERE b.tenant_id = ? AND bk.keyword IN (${placeholders})
     GROUP BY b.id
     ORDER BY match_count DESC
     LIMIT 1`
  )
    .bind(auth.tenant_id, ...keywords)
    .first<{
      id: string;
      tenant_id: string;
      name: string;
      content: string;
      keywords: string;
      created_at: string;
      updated_at: string;
      match_count: number;
    }>();

  if (!results) {
    return c.json({ error: "No matching block found" }, 404);
  }

  const block = {
    id: results.id,
    tenant_id: results.tenant_id,
    name: results.name,
    content: results.content,
    keywords: JSON.parse(results.keywords),
    created_at: results.created_at,
    updated_at: results.updated_at,
  };

  const relevanceScore = Math.min(results.match_count / keywords.length, 1);

  return c.json({
    block,
    relevance_score: relevanceScore,
  });
});

export { app as mcpRoutes };