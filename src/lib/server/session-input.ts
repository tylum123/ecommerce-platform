import { createHash } from "node:crypto";

export class SessionInputError extends Error {
  status: number;
  constructor(status: number) { super("Invalid session input"); this.status = status; }
}

export type SessionInput = { action: "logout" } | { email: string; password: string };

/** Enforce the limit on the bytes received, even without Content-Length. */
export async function readSessionInput(request: Request): Promise<SessionInput> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") throw new SessionInputError(415);
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 4096)) throw new SessionInputError(413);
  if (!request.body) throw new SessionInputError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 4096) { void reader.cancel(); throw new SessionInputError(413); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new SessionInputError(400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new SessionInputError(400);
  const keys = Object.keys(body);
  if ("action" in body && body.action === "logout" && keys.length === 1) return { action: "logout" };
  if (keys.length !== 2 || !("email" in body) || !("password" in body) || typeof body.email !== "string" || typeof body.password !== "string") throw new SessionInputError(400);
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.password.length < 1 || body.password.length > 128) throw new SessionInputError(400);
  return { email, password: body.password };
}

/** Local-only defense: never trust user-supplied forwarding headers for keys. */
export function createSessionRateLimiter() {
  const accounts = new Map<string, { count: number; expires: number }>();
  let global = { count: 0, expires: 0 };
  return (email: string, now = Date.now()): number => {
    if (global.expires <= now) global = { count: 0, expires: now + 60_000 };
    global.count += 1;
    if (global.count > 30) return Math.max(1, Math.ceil((global.expires - now) / 1000));
    for (const [key, value] of accounts) if (value.expires <= now) accounts.delete(key);
    const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
    const existing = accounts.get(key);
    if (!existing && accounts.size >= 1024) return 900;
    const entry = existing || { count: 0, expires: now + 900_000 };
    entry.count += 1;
    accounts.set(key, entry);
    return entry.count > 5 ? Math.max(1, Math.ceil((entry.expires - now) / 1000)) : 0;
  };
}
