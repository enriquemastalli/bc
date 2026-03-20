import { Hono } from "hono";
import { Env, DashboardStats } from "../types";
import { dashboardAuthMiddleware, requireAdmin } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("*", dashboardAuthMiddleware);

app.get("/stats", async (c) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const tenantsCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tenants"
  ).first<{ count: number }>();
  
  const blocksCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM blocks"
  ).first<{ count: number }>();
  
  const queriesCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM query_logs WHERE created_at > ?"
  )
    .bind(twentyFourHoursAgo)
    .first<{ count: number }>();
  
  const avgLatency = await c.env.DB.prepare(
    "SELECT AVG(latency_ms) as avg FROM query_logs WHERE created_at > ? AND latency_ms IS NOT NULL"
  )
    .bind(twentyFourHoursAgo)
    .first<{ avg: number | null }>();
  
  const stats: DashboardStats = {
    total_tenants: tenantsCount?.count ?? 0,
    total_blocks: blocksCount?.count ?? 0,
    total_queries_24h: queriesCount?.count ?? 0,
    avg_latency_ms: Math.round(avgLatency?.avg ?? 0),
  };
  
  return c.json(stats);
});

app.get("/logs", async (c) => {
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");
  const tenantId = c.req.query("tenant_id");
  
  let query = `
    SELECT ql.id, ql.tenant_id, t.name as tenant_name, ql.query, ql.block_id, 
           ql.relevance_score, ql.latency_ms, ql.created_at
    FROM query_logs ql
    LEFT JOIN tenants t ON ql.tenant_id = t.id
  `;
  let countQuery = "SELECT COUNT(*) as count FROM query_logs";
  
  const params: (string | number)[] = [];
  
  if (tenantId) {
    query += " WHERE ql.tenant_id = ?";
    countQuery += " WHERE tenant_id = ?";
    params.push(tenantId);
  }
  
  query += " ORDER BY ql.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  
  const results = await c.env.DB.prepare(query)
    .bind(...params)
    .all<{
      id: string;
      tenant_id: string;
      tenant_name: string | null;
      query: string;
      block_id: string | null;
      relevance_score: number | null;
      latency_ms: number | null;
      created_at: string;
    }>();
  
  const countResult = tenantId
    ? await c.env.DB.prepare(countQuery).bind(tenantId).first<{ count: number }>()
    : await c.env.DB.prepare(countQuery).first<{ count: number }>();
  
  return c.json({
    logs: results.results ?? [],
    total: countResult?.count ?? 0,
    limit,
    offset,
  });
});

app.get("/queries-by-hour", async (c) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const results = await c.env.DB.prepare(
    `SELECT 
      strftime('%H', created_at) as hour,
      COUNT(*) as count
    FROM query_logs
    WHERE created_at > ?
    GROUP BY hour
    ORDER BY hour`
  )
    .bind(twentyFourHoursAgo)
    .all<{ hour: string; count: number }>();
  
  const data = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    const found = results.results?.find(r => r.hour === hour);
    return { hour: `${hour}:00`, count: found?.count ?? 0 };
  });
  
  return c.json(data);
});

export { app as dashboardRoutes };