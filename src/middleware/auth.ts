import { Context, Next } from "hono";
import { Env, DashboardAuthContext } from "../types";

export async function dashboardAuthMiddleware(c: Context<{ Bindings: Env; Variables: { user: DashboardAuthContext } }>, next: Next) {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing token" }, 401);
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
    
    c.set("user", {
      user_id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
    
    return next();
  } catch {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
}

export function requireAdmin(c: Context<{ Variables: { user: DashboardAuthContext } }>, next: Next) {
  const user = c.get("user");
  
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }
  
  return next();
}