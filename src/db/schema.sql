CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_tenant_id ON blocks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blocks_name ON blocks(tenant_id, name);

CREATE TABLE IF NOT EXISTS block_keywords (
  keyword TEXT NOT NULL,
  block_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  PRIMARY KEY (keyword, block_id),
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_block_keywords_keyword ON block_keywords(keyword, tenant_id);
CREATE INDEX IF NOT EXISTS idx_block_keywords_tenant ON block_keywords(tenant_id);

-- Users del dashboard
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Logs de queries MCP
CREATE TABLE IF NOT EXISTS query_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  query TEXT NOT NULL,
  block_id TEXT,
  relevance_score REAL,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_query_logs_tenant ON query_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created ON query_logs(created_at);