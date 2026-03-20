import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { Env } from "../types";
import { adminRoutes } from "../routes/admin";

describe("Admin Routes", () => {
  let app: Hono<{ Bindings: Env }>;
  let mockD1: D1Database;
  let mockKV: KVNamespace;
  const ADMIN_KEY = "sk_test_admin_key";
  
  const tenants: Map<string, { id: string; name: string; api_key: string; created_at: string; updated_at: string }> = new Map();
  
  function createMockD1(): D1Database {
    return{
      prepare: (query: string) => ({
        bind: (...params: unknown[]) => ({
          first: async <T>(): Promise<T | null> => {
            const upperQuery = query.toUpperCase();
            if (upperQuery.includes("SELECT ID FROM TENANTS WHERE API_KEY")) {
              return null;
            }
            if (upperQuery.includes("SELECT ID FROM TENANTS WHERE ID")) {
              const id = params[0] as string;
              const tenant = tenants.get(id);
              return tenant ? { id: tenant.id } as T : null;
            }
            return null;
          },
          all: async <T>(): Promise<{ results: T[] }> => {
            return { results: [] as T[] };
          },
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
    tenants.clear();
    app = new Hono<{ Bindings: Env }>();
    mockD1 = createMockD1();
    mockKV = createMockKV();
    app.route("/admin/v1", adminRoutes);
    tenants.clear();
  });
  
  describe("POST /tenants", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/admin/v1/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: ADMIN_KEY, ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject request with invalid admin key", async () => {
      const res = await app.request("/admin/v1/tenants", {
        method: "POST",
        headers: {
          "Authorization": "Bearer invalid_key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "test" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: ADMIN_KEY, ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
    
    it("should reject invalid tenant name", async () => {
      const res = await app.request("/admin/v1/tenants", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ADMIN_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "" }),
      }, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: ADMIN_KEY, ENVIRONMENT: "test" });
      expect(res.status).toBe(400);
    });
  });
  
  describe("GET /tenants", () => {
    it("should reject request without auth", async () => {
      const res = await app.request("/admin/v1/tenants", {}, { DB: mockD1, CACHE: mockKV, ADMIN_API_KEY: ADMIN_KEY, ENVIRONMENT: "test" });
      expect(res.status).toBe(401);
    });
  });
});