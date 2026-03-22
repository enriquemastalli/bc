const API_URL = import.meta.env.VITE_API_URL || "https://bc-prod.enrique-mastalli.workers.dev";

export interface User {
  id: string;
  email: string;
  role: "admin" | "editor";
}

export interface Tenant {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface Block {
  id: string;
  tenant_id: string;
  name: string;
  content: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface QueryLog {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  query: string;
  block_id: string | null;
  relevance_score: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface DashboardStats {
  total_tenants: number;
  total_blocks: number;
  total_queries_24h: number;
  avg_latency_ms: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async fetch(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.fetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.fetch("/auth/me");
  }

  // Dashboard
  async getStats(): Promise<DashboardStats> {
    return this.fetch("/dashboard/stats");
  }

  async getLogs(limit = 50, offset = 0, tenantId?: string): Promise<{ logs: QueryLog[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (tenantId) params.append("tenant_id", tenantId);
    return this.fetch(`/dashboard/logs?${params}`);
  }

  async getQueriesByHour(): Promise<{ hour: string; count: number }[]> {
    return this.fetch("/dashboard/queries-by-hour");
  }

  // Tenants
  async getTenants(): Promise<{ tenants: Tenant[] }> {
    return this.fetch("/admin/v1/tenants");
  }

  async createTenant(name: string): Promise<Tenant> {
    return this.fetch("/admin/v1/tenants", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async deleteTenant(id: string): Promise<void> {
    return this.fetch(`/admin/v1/tenants/${id}`, { method: "DELETE" });
  }

  // Blocks
  async getBlocks(tenantApiKey: string): Promise<{ blocks: Block[] }> {
    return fetch(`${API_URL}/api/v1/blocks`, {
      headers: {
        "Authorization": `Bearer ${tenantApiKey}`,
        "Content-Type": "application/json",
      },
    }).then(r => {
      if (!r.ok) throw new Error("Failed to fetch blocks");
      return r.json();
    });
  }

  async createBlock(tenantApiKey: string, data: { name: string; content: string; keywords: string[] }): Promise<Block> {
    return fetch(`${API_URL}/api/v1/blocks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tenantApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(r => {
      if (!r.ok) throw new Error("Failed to create block");
      return r.json();
    });
  }

  async updateBlock(tenantApiKey: string, id: string, data: Partial<Block>): Promise<Block> {
    return fetch(`${API_URL}/api/v1/blocks/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${tenantApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(r => {
      if (!r.ok) throw new Error("Failed to update block");
      return r.json();
    });
  }

  async deleteBlock(tenantApiKey: string, id: string): Promise<void> {
    return fetch(`${API_URL}/api/v1/blocks/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tenantApiKey}`,
      },
    }).then(r => {
      if (!r.ok) throw new Error("Failed to delete block");
    });
  }
}

export const api = new ApiClient();