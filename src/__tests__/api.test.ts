import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { Env } from "../types";
import { apiRoutes } from "../routes/api";

describe("API Routes", () => {
  let app: Hono<{ Bindings: Env }>;
  let mockD1: D1Database;
  let mockKV: KVNamespace;
  const TENANT_KEY = "sk_test_tenant_key";
  const TENANT_ID = "550e8400-e29b-41d4-a716-446655440001";
  
  const blocks: Map<string, { id: string; tenant_id: string; name: string; content: string; keywords: string }> = new Map();
  
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
            if (upperQuery.includes("SELECT ID, NAME, CONTENT, KEYWORDS FROM BLOCKS WHERE ID")) {
              const blockId = params[0] as string;
              const tenantId = params[1] as string;
              const block = blocks.get(blockId);
              if (block && block.tenant_id === tenantId) {
                return { ...block } as T;
              }
              return null;
            }
            if (upperQuery.includes("SELECT ID FROM BLOCKS WHERE ID")) {
              const blockId = params[0] as string;
              const tenantId = params[1] as string;
              const block = blocks.get(blockId);
              if (block && block.tenant_id === tenantId) {
                return { id: block.id } as T;
              }
              return null;
            }
            return null;
          },
          all: async <T>(): Promise<{ results: T[] }> => {
            const upperQuery = query.toUpperCase();
            if (upperQuery.includes("SELECT ID, TENANT_ID, NAME, CONTENT, KEYWORDS, CREATED_AT, UPDATED_AT FROM BLOCKS WHERE TENANT_ID")) {
              const tenantId = params[0] as string;
              const results = Array.from(blocks.values())
                .filter(b => b.tenant_id === tenantId)
                .map(b => ({
                  ...b,
                  created_at: "2024-01-01T00:00:00Z",
                  updated_at: "2024-01-01T00:00:00Z",
                }));
              return { results: results as T[] };
            }
            return { results: [] as T[] };
          },
          run: async () => ({ success: true, results: [] }),
        }),
        first: async <T>(): Promise<T | null> => null,
        all: async <T>(): Promise<{ results: T[] }> => ({ results: [] as T[] }),
        run: async () => ({ success: true, results: [] }),
      }),
      batch: async (statements: unknown[]) => {
        return (statements as unknown[]).map(() => ({ success: true, results: [] }));
      },
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
    blocks.clear();
    app = new Hono<{ Bindings: Env }>();
    mockD1 = createMockD1();
    mockKV = createMockKV();
    app.route("/api/v1", apiRoutes);
    blocks.clear();
  });
  
  describe("GET /blocks", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/api/v1/blocks", {}, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject request with invalid tenant key", async () => {
      const res = await app.request("/api/v1/blocks", {
        headers: { "Authorization": "Bearer invalid_key" },
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should return empty blocks list for valid tenant", async () => {
      const res = await app.request("/api/v1/blocks", {
        headers: { "Authorization": `Bearer ${TENANT_KEY}` },
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { blocks: unknown[] };
      expect(body).toHaveProperty("blocks");
      expect(Array.isArray(body.blocks)).toBe(true);
    });
  });
  
  describe("POST /blocks", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/api/v1/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "test",
          content: "content",
          keywords: ["test"],
        }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject invalid block data", async () => {
      const res = await app.request("/api/v1/blocks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TENANT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "",
          content: "",
          keywords: [],
        }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(400);
    });
    
    it("should reject block with empty keywords", async () => {
      const res = await app.request("/api/v1/blocks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TENANT_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "test",
          content: "content",
          keywords: [],
        }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(400);
    });
  });
  
  describe("GET /blocks/:id", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/api/v1/blocks/test-id", {}, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
  });
  
  describe("PUT /blocks/:id", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/api/v1/blocks/test-id", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "new" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
  });
  
  describe("DELETE /blocks/:id", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/api/v1/blocks/test-id", {
        method: "DELETE",
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: "key", ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
  });
});