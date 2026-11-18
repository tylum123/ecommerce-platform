import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { NextRequest, NextResponse } from "next/server.js";
import { createSessionRateLimiter, readSessionInput } from "../src/lib/server/session-input.ts";
import { hasTrustedMutationOrigin, createIdentityRoleRepository } from "../src/lib/server/supabase-principal.ts";

const require = createRequire(import.meta.url);
function load(path, dependencies) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(name => dependencies[name] ?? require(name), module, module.exports);
  return module.exports;
}
const request = (body, origin = "http://localhost:3010") => new NextRequest("http://localhost:3010/api/session", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: typeof body === "string" ? body : JSON.stringify(body),
});

test("session input bounds actual streamed bytes and rejects metadata/empty passwords", async () => {
  for (const body of ["{", [], { email: "a@b.test", password: "" }, { email: "a@b.test", password: "p", role: "admin" }]) {
    await assert.rejects(readSessionInput(request(body)), error => error.status === 400);
  }
  await assert.rejects(readSessionInput(request(" ".repeat(4097))), error => error.status === 413);
  assert.deepEqual(await readSessionInput(request({ email: " A@B.test ", password: "p" })), { email: "a@b.test", password: "p" });
});

test("local limiter bounds attempts, normalizes account keys, and expires windows", () => {
  const limit = createSessionRateLimiter();
  for (let i = 0; i < 5; i++) assert.equal(limit(" A@B.test ", 0), 0);
  assert.equal(limit("a@b.test", 0), 900);
  assert.equal(limit("a@b.test", 900_000), 0);
  const global = createSessionRateLimiter();
  for (let i = 0; i < 30; i++) assert.equal(global(`a${i}@b.test`, 0), 0);
  assert.equal(global("new@b.test", 0), 60);
});

test("config gate denies production before provider construction; adapter preserves refresh/removal cookies", async () => {
  const original = { ...process.env };
  let adapter;
  let constructions = 0;
  const session = load("../src/lib/server/supabase-session.ts", {
    "next/server": { NextResponse },
    "@supabase/ssr": { createServerClient: (_url, _key, options) => { constructions++; adapter = options.cookies; return {}; } },
  });
  try {
    Object.assign(process.env, { NODE_ENV: "test", NARI_AUTH_ENABLED: "true", NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnop", APP_ORIGIN: "http://localhost:3010" });
    assert.equal(session.isSupabaseSessionConfigured(), true);
    const req = request({ action: "logout" });
    const context = session.createSupabaseSession(req);
    adapter.setAll([{ name: "sb-test-auth-token.0", value: "refreshed", options: { httpOnly: true, path: "/" } }, { name: "sb-test-auth-token.1", value: "", options: { maxAge: 0, path: "/" } }], { Pragma: "no-cache" });
    const response = session.sessionResponse(context.response, { ok: true });
    assert.equal(req.cookies.get("sb-test-auth-token.0").value, "refreshed");
    assert.equal(response.cookies.get("sb-test-auth-token.0").httpOnly, true);
    assert.equal(response.cookies.get("sb-test-auth-token.1").maxAge, 0);
    assert.match(response.headers.get("cache-control"), /no-store/);
    process.env.NODE_ENV = "production";
    assert.equal(session.isSupabaseSessionConfigured(), false);
    assert.throws(() => session.createSupabaseSession(req));
    assert.equal(constructions, 1);
    process.env.NODE_ENV = "test";
    process.env.NARI_AUTH_ENABLED = "TRUE";
    assert.equal(session.isSupabaseSessionConfigured(), false);
  } finally { process.env = original; }
});

test("session routes reject untrusted input before provider, keep business closed and report failed logout", async () => {
  const session = load("../src/lib/server/supabase-session.ts", { "next/server": { NextResponse } });
  let disabled = false;
  let calls = 0;
  let failLogout = false;
  const route = load("../src/app/api/session/route.ts", {
    "next/server": { NextResponse },
    "@/lib/server/supabase-session": {
      sessionResponse: session.sessionResponse,
      readSupabaseSessionConfig: () => { if (disabled) throw Error("disabled"); return { origin: "http://localhost:3010" }; },
      createSupabaseSession: () => {
        if (disabled) throw Error("disabled");
        calls++;
        const response = NextResponse.json({});
        return { response, config: { origin: "http://localhost:3010" }, client: { auth: {
          signInWithPassword: async () => ({ data: { user: { id: "verified" }, session: {} }, error: null }),
          getUser: async () => ({ data: { user: { id: "verified", email: "a@b.test", user_metadata: { role: "admin" } } }, error: null }),
          signOut: async options => { assert.deepEqual(options, { scope: "local" }); return { error: failLogout ? Error("private-provider-detail") : null }; },
        } } };
      },
    },
    "@/lib/server/supabase-principal": { hasTrustedMutationOrigin },
    "@/lib/server/catalog-admin-access": { readCatalogAdminConfig: () => { throw Error("disabled"); } },
    "@/lib/server/staff-portal-access": { readStaffPortalConfig: () => { throw Error("disabled"); } },
    "@/lib/server/postgres-database": { getPostgresDatabase: () => { throw Error("must not query"); } },
    "@/lib/server/session-input": { createSessionRateLimiter, readSessionInput, SessionInputError: (await import("../src/lib/server/session-input.ts")).SessionInputError },
  });
  assert.equal((await route.POST(request({ email: "a@b.test", password: "p" }, "https://evil.test"))).status, 403);
  assert.equal((await route.POST(request(" ".repeat(4097)))).status, 413);
  assert.equal(calls, 0);
  const login = await route.POST(request({ email: "a@b.test", password: "p" }));
  assert.deepEqual(await login.json(), { ok: true, businessAccess: false, catalogAccess: false, staffPortalAccess: false });
  const current = await (await route.GET(request({}))).json();
  assert.equal(current.businessAccess, false);
  assert.equal(current.user.role, undefined);
  const logout = await route.POST(request({ action: "logout" }));
  assert.equal(logout.cookies.get("nari_session").maxAge, 0);
  failLogout = true;
  const failed = await route.POST(request({ action: "logout" }));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private-provider-detail/);
  disabled = true;
  const count = calls;
  assert.equal((await route.POST(request({ email: "a@b.test", password: "p" }))).status, 503);
  assert.equal((await route.GET(request({}))).status, 503);
  assert.equal(calls, count);
});

test("role repository parameterizes verified ID and rejects malformed server records", async () => {
  let rows = [{ user_id: "verified", role: "admin", active: true, full_name: "Admin", branch_id: null }];
  const repo = createIdentityRoleRepository({ query: async (sql, values) => { assert.match(sql, /user_id = \$1::uuid/); assert.deepEqual(values, ["verified"]); return { rows }; } });
  assert.equal((await repo.findActiveIdentity("verified")).role, "admin");
  rows = [{ ...rows[0], role: "superuser" }];
  assert.equal(await repo.findActiveIdentity("verified"), null);
});
