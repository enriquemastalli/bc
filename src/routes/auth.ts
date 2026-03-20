import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, LoginSchema, CreateUserSchema } from "../types";
import { dashboardAuthMiddleware, requireAdmin } from "../middleware/auth";

const app = new Hono<{ Bindings: Env }>();

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function generateJWT(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 };
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

app.post("/login", zValidator("json", LoginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  
  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, role FROM users WHERE email = ?"
  )
    .bind(email)
    .first<{ id: string; email: string; password_hash: string; role: string }>();
  
  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.password_hash) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  
  const token = await generateJWT(
    { sub: user.id, email: user.email, role: user.role },
    c.env.JWT_SECRET
  );
  
  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

app.post("/logout", dashboardAuthMiddleware, async (c) => {
  return c.json({ message: "Logged out successfully" });
});

app.get("/me", dashboardAuthMiddleware, async (c) => {
  const user = c.get("user");
  return c.json(user);
});

app.post("/users", zValidator("json", CreateUserSchema), async (c) => {
  // Check if there are any existing users
  const userCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).first<{ count: number }>();
  
  // If users exist, require authentication
  if (userCount && userCount.count > 0) {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const token = authHeader.slice(7);
    try {
      const [headerB64, payloadB64, signatureB64] = token.split(".");
      if (!headerB64 || !payloadB64 || !signatureB64) {
        return c.json({ error: "Unauthorized: Invalid token format" }, 401);
      }
      
      const payload = JSON.parse(atob(payloadB64));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return c.json({ error: "Unauthorized: Token expired" }, 401);
      }
      
      // Verify signature
      const encoder = new TextEncoder();
      const data = encoder.encode(`${headerB64}.${payloadB64}`);
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(c.env.JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );
      
      const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify("HMAC", key, signature, data);
      
      if (!isValid) {
        return c.json({ error: "Unauthorized: Invalid signature" }, 401);
      }
      
      // Check if user is admin
      if (payload.role !== "admin") {
        return c.json({ error: "Forbidden: Admin access required" }, 403);
      }
    } catch {
      return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }
  }
  
  const data = c.req.valid("json");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(data.password);
  
  const existing = await c.env.DB.prepare(
    "SELECT id FROM users WHERE email = ?"
  )
    .bind(data.email)
    .first();
  
  if (existing) {
    return c.json({ error: "Email already exists" }, 409);
  }
  
  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, data.email, passwordHash, data.role, now, now)
    .run();
  
  return c.json({
    id,
    email: data.email,
    role: data.role,
    created_at: now,
    updated_at: now,
  }, 201);
});

app.get("/users", dashboardAuthMiddleware, requireAdmin, async (c) => {
  const results = await c.env.DB.prepare(
    "SELECT id, email, role, created_at, updated_at FROM users ORDER BY created_at DESC"
  ).all<{ id: string; email: string; role: string; created_at: string; updated_at: string }>();
  
  return c.json({ users: results.results ?? [] });
});

export { app as authRoutes };