import { describe, it, expect } from "vitest";
import { BlockSchema, CreateBlockSchema, UpdateBlockSchema, QuerySchema, CreateTenantSchema } from "../types";

describe("BlockSchema", () => {
  it("should validate a valid block", () => {
    const block = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      tenant_id: "550e8400-e29b-41d4-a716-446655440001",
      name: "politicas",
      content: "[conocimiento_experto::politicas]\n\nContenido...",
      keywords: ["politica", "devolucion"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(true);
  });

  it("should reject block with empty name", () => {
    const block = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      tenant_id: "550e8400-e29b-41d4-a716-446655440001",
      name: "",
      content: "content",
      keywords: ["keyword"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(false);
  });

  it("should accept block with empty keywords array (for existing blocks)", () => {
    const block = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      tenant_id: "550e8400-e29b-41d4-a716-446655440001",
      name: "test",
      content: "content",
      keywords: [],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    const result = BlockSchema.safeParse(block);
    expect(result.success).toBe(true);
  });
});

describe("CreateBlockSchema", () => {
  it("should validate valid create block input", () => {
    const input = {
      name: "politicas",
      content: "[conocimiento_experto::politicas]\n\nContenido...",
      keywords: ["politica", "devolucion"],
    };
    const result = CreateBlockSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty content", () => {
    const input = {
      name: "test",
      content: "",
      keywords: ["keyword"],
    };
    const result = CreateBlockSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject keywords shorter than 1 character", () => {
    const input = {
      name: "test",
      content: "content",
      keywords: ["", "valid"],
    };
    const result = CreateBlockSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("UpdateBlockSchema", () => {
  it("should validate partial update", () => {
    const input = { name: "nuevo-nombre" };
    const result = UpdateBlockSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should validate empty update", () => {
    const input = {};
    const result = UpdateBlockSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("QuerySchema", () => {
  it("should validate valid query", () => {
    const input = { query: "cual es la politica de devolucion" };
    const result = QuerySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty query", () => {
    const input = { query: "" };
    const result = QuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should reject query longer than 1000 characters", () => {
    const input = { query: "a".repeat(1001) };
    const result = QuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("CreateTenantSchema", () => {
  it("should validate valid tenant input", () => {
    const input = { name: "mi_agente" };
    const result = CreateTenantSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const input = { name: "" };
    const result = CreateTenantSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});