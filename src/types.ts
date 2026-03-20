import { z } from "zod";

export const BlockSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  content: z.string(),
  keywords: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateBlockSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
});

export const UpdateBlockSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  keywords: z.array(z.string().min(1)).min(1).optional(),
});

export const QuerySchema = z.object({
  query: z.string().min(1).max(1000),
});

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  api_key: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  role: z.enum(["admin", "editor"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "editor"]).default("editor"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const QueryLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  query: z.string(),
  block_id: z.string().uuid().optional().nullable(),
  relevance_score: z.number().optional().nullable(),
  latency_ms: z.number().optional().nullable(),
  created_at: z.string().datetime(),
});

export type Block = z.infer<typeof BlockSchema>;
export type CreateBlock = z.infer<typeof CreateBlockSchema>;
export type UpdateBlock = z.infer<typeof UpdateBlockSchema>;
export type Query = z.infer<typeof QuerySchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type QueryLog = z.infer<typeof QueryLogSchema>;

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  ADMIN_API_KEY: string;
  JWT_SECRET: string;
}

export interface AuthContext {
  tenant_id: string;
  is_admin: boolean;
}

export interface DashboardAuthContext {
  user_id: string;
  email: string;
  role: "admin" | "editor";
}

export interface SearchResult {
  block: Block;
  relevance_score: number;
}

export interface DashboardStats {
  total_tenants: number;
  total_blocks: number;
  total_queries_24h: number;
  avg_latency_ms: number;
}