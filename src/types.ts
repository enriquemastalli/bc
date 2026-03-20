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

export type Block = z.infer<typeof BlockSchema>;
export type CreateBlock = z.infer<typeof CreateBlockSchema>;
export type UpdateBlock = z.infer<typeof UpdateBlockSchema>;
export type Query = z.infer<typeof QuerySchema>;
export type Tenant = z.infer<typeof TenantSchema>;
export type CreateTenant = z.infer<typeof CreateTenantSchema>;

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  ADMIN_API_KEY: string;
}

export interface AuthContext {
  tenant_id: string;
  is_admin: boolean;
}

export interface SearchResult {
  block: Block;
  relevance_score: number;
}