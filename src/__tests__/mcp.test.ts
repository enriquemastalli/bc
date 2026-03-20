import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { Env } from "../types";
import { mcpRoutes } from "../routes/mcp";

describe("MCP Routes", () => {
  let app: Hono<{ Bindings: Env }>;
  let mockD1: D1Database;
  let mockKV: KVNamespace;
  const TENANT_KEY = "sk_test_tenant_key";
  const TENANT_ID = "550e8400-e29b-41d4-a716-446655440001";
  const BLOCK_ID = "550e8400-e29b-41d4-a716-446655440002";
  
  function createMockD1(): D1Database {
    return {
      prepare: (query: string) => ({
        bind: (...params: unknown[]) => ({
          first: async <T>(): Promise<T | null> => {
            const upperQuery = query.toUpperCase();
            if (upperQuery.includes("SELECT ID FROM TENANTS WHERE API_KEY")) {
              const apiKey = params[0] as string;
              if (apiKey === TENANT_KEY) {
                return { id: TENANT_ID } as T;
              }
              return null;
            }
            if (upperQuery.includes("SELECT B.ID, B.TENANT_ID, B.NAME, B.CONTENT, B.KEYWORDS")) {
              const tenantId = params[0] as string;
              if (tenantId === TENANT_ID) {
                return {
                  id: BLOCK_ID,
                  tenant_id: TENANT_ID,
                  name: "politicas",
                  content: "[conocimiento_experto::politicas]\n\nLas políticas de devolución...",
                  keywords: JSON.stringify(["politica", "devolucion", "reembolso"]),
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                  match_count: 2,
                } as T;
              }
              return null;
            }
            return null;
          },
          all: async <T>(): Promise<{ results: T[] }> => ({ results: [] as T[] }),
          run: async () => ({ success: true, results: [] }),
        }),
        first: async <T>(): Promise<T | null> => null,
        all: async <T>(): Promise<{ results: T[] }> => ({ results: [] as T[] }),
        run: async () => ({ success: true, results: [] }),
      }),
      batch: async () => [],
      exec: async () => ({ results: [] }),
      dump: async () => new ArrayBuffer(0),
    } as unknown as D1Database;
  }
  
  function createMockKV(): KVNamespace {
    return {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
      list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
      getWithMetadata: async () => ({ value: null, metadata: null }),
    } as unknown as KVNamespace;
  }
  
  beforeEach(() => {
    app = new Hono<{ Bindings: Env }>();
    mockD1 = createMockD1();
    mockKV = createMockKV();
    app.route("/mcp/v1", mcpRoutes);
  });
  
  describe("POST /query", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/mcp/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject request with invalid tenant key", async () => {
      const res = await app.request("/mcp/v1/query", {
        method: "POST",
        headers: {
          "Authorization": "Bearer invalid_key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "test" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject empty query", async () => {
      const res = await app.request("/mcp/v1/query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TENANT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(400);
    });
    
    it("should reject query too short", async () => {
      const res = await app.request("/mcp/v1/query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TENANT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "a" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(400);
    });
    
    it("should accept valid query", async () => {
      const res = await app.request("/mcp/v1/query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TENANT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "cual es la politica de devolucion" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(200);
    });
  });
});