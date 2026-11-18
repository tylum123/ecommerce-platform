/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TS harness */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const mod = { exports: {} };
  const localRequire = require("node:module").createRequire(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("module", "exports", "require", code)(mod, mod.exports, (id) => {
    if (id === "server-only") return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  });
  return mod.exports;
}

const sqlFile = (name) => fs.readFileSync(path.join(__dirname, "../db/migrations", name), "utf8");

test(
  "202611180001 migration enforces preflight, shared rate limiting, and customer_profiles RLS under nari_catalog_runtime",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);

    const preflightPg = new PGlite();
    try {
      await assert.rejects(
        () => preflightPg.exec(sqlFile("202611180001_auth_ratelimit_customers.sql")),
        /Reviewed runtime role and identity schema required/,
      );
    } finally {
      await preflightPg.close();
    }

    const pg = new PGlite();
    try {
      await pg.exec(
        "CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);",
      );
      await pg.exec(sqlFile("202611160001_catalog_inventory.sql"));
      await pg.exec(sqlFile("202611170001_identity.sql"));
      await pg.exec(sqlFile("202611170002_catalog_runtime.sql"));
      await pg.exec(sqlFile("202611180001_auth_ratelimit_customers.sql"));

      const userId = "11111111-1111-4111-8111-111111111111";
      await pg.query("INSERT INTO auth.users(id) VALUES ($1)", [userId]);

      await pg.exec("SET ROLE nari_catalog_runtime");
      const database = { query: (sql, values) => pg.query(sql, values) };
      const { checkPostgresLoginRateLimit } = load("src/lib/server/session-input.ts");

      // 5 attempts pass (normalized email); 6th blocks with 900s
      for (let i = 0; i < 5; i++) {
        const retry = await checkPostgresLoginRateLimit(
          database,
          i % 2 === 0 ? " User@Example.test " : "user@example.test",
        );
        assert.equal(retry, 0);
      }
      assert.equal(await checkPostgresLoginRateLimit(database, "user@example.test"), 900);

      // Direct check_rate_limit verifies JSON payload and remaining count
      const first = (
        await pg.query("SELECT nari_identity.check_rate_limit($1, $2, $3) AS result", [
          "custom:bucket",
          2,
          120,
        ])
      ).rows[0].result;
      assert.deepEqual(first, { allowed: true, remaining: 1, retryAfterSeconds: 0 });
      const second = (
        await pg.query("SELECT nari_identity.check_rate_limit($1, $2, $3) AS result", [
          "custom:bucket",
          2,
          120,
        ])
      ).rows[0].result;
      assert.deepEqual(second, { allowed: true, remaining: 0, retryAfterSeconds: 0 });
      const blocked = (
        await pg.query("SELECT nari_identity.check_rate_limit($1, $2, $3) AS result", [
          "custom:bucket",
          2,
          120,
        ])
      ).rows[0].result;
      assert.deepEqual(blocked, { allowed: false, remaining: 0, retryAfterSeconds: 120 });

      // Global login cap (30/60s): 5 already recorded above, next 25 distinct accounts succeed, 31st blocks with 60s
      for (let i = 0; i < 25; i++) {
        assert.equal(await checkPostgresLoginRateLimit(database, `acct${i}@example.test`), 0);
      }
      assert.equal(await checkPostgresLoginRateLimit(database, "overflow@example.test"), 60);

      // Direct access to auth_rate_limits must be denied for nari_catalog_runtime
      for (const sql of [
        "SELECT * FROM nari_identity.auth_rate_limits",
        "INSERT INTO nari_identity.auth_rate_limits(key) VALUES ('forged')",
        "UPDATE nari_identity.auth_rate_limits SET key = 'forged'",
        "DELETE FROM nari_identity.auth_rate_limits",
      ]) {
        await assert.rejects(() => pg.query(sql), /permission denied/i);
      }

      // customer_profiles SELECT/INSERT/UPDATE works for nari_catalog_runtime; DELETE is denied
      await pg.query(
        "INSERT INTO nari_identity.customer_profiles (user_id, email, full_name, phone, default_address) VALUES ($1, $2, $3, $4, $5)",
        [userId, "user@example.test", "Nguyen Minh Anh", "0901234567", "71 Hoang Hoa Tham"],
      );
      const inserted = (
        await pg.query(
          "SELECT user_id, email, full_name, phone, default_address, tier, loyalty_points FROM nari_identity.customer_profiles WHERE user_id = $1",
          [userId],
        )
      ).rows[0];
      assert.equal(inserted.email, "user@example.test");
      assert.equal(inserted.tier, "Member");
      assert.equal(Number(inserted.loyalty_points), 0);

      await pg.query(
        "UPDATE nari_identity.customer_profiles SET full_name = $2, tier = $3, loyalty_points = $4 WHERE user_id = $1",
        [userId, "Updated Name", "Gold", 350],
      );
      const updated = (
        await pg.query(
          "SELECT full_name, tier, loyalty_points FROM nari_identity.customer_profiles WHERE user_id = $1",
          [userId],
        )
      ).rows[0];
      assert.equal(updated.full_name, "Updated Name");
      assert.equal(updated.tier, "Gold");
      assert.equal(Number(updated.loyalty_points), 350);

      await assert.rejects(
        () => pg.query("DELETE FROM nari_identity.customer_profiles WHERE user_id = $1", [userId]),
        /permission denied/i,
      );

      // anon and authenticated have no access to rate limit RPC or customer_profiles
      await pg.exec("RESET ROLE; SET ROLE anon;");
      await assert.rejects(
        () => pg.query("SELECT nari_identity.check_rate_limit('anon', 5, 60)"),
        /permission denied/i,
      );
      await assert.rejects(
        () => pg.query("SELECT * FROM nari_identity.customer_profiles"),
        /permission denied/i,
      );
      await pg.exec("RESET ROLE;");
    } finally {
      await pg.close();
    }
  },
);

test("readSupabaseSessionConfig allows production only with NARI_SHARED_RATE_LIMIT=postgres and valid NARI_POSTGRES_URL", () => {
  const original = { ...process.env };
  const { readSupabaseSessionConfig, isSupabaseSessionConfigured } = load(
    "src/lib/server/supabase-session.ts",
    {
      "next/server": { NextResponse },
      "@supabase/ssr": { createServerClient: () => ({}) },
    },
  );
  try {
    Object.assign(process.env, {
      NODE_ENV: "production",
      NARI_AUTH_ENABLED: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnop",
      APP_ORIGIN: "https://shop.narihome.vn",
    });
    delete process.env.NARI_SHARED_RATE_LIMIT;
    delete process.env.NARI_POSTGRES_URL;
    assert.equal(isSupabaseSessionConfigured(), false);
    assert.throws(() => readSupabaseSessionConfig(), /disabled/);

    process.env.NARI_SHARED_RATE_LIMIT = "postgres";
    process.env.NARI_POSTGRES_URL = "   ";
    assert.equal(isSupabaseSessionConfigured(), false);
    assert.throws(() => readSupabaseSessionConfig(), /disabled/);

    process.env.NARI_SHARED_RATE_LIMIT = "memory";
    process.env.NARI_POSTGRES_URL = "postgresql://runtime:secret@db.example.com/postgres";
    assert.equal(isSupabaseSessionConfigured(), false);
    assert.throws(() => readSupabaseSessionConfig(), /disabled/);

    process.env.NARI_SHARED_RATE_LIMIT = "postgres";
    const config = readSupabaseSessionConfig();
    assert.equal(config.origin, "https://shop.narihome.vn");
    assert.equal(isSupabaseSessionConfigured(), true);
  } finally {
    process.env = original;
  }
});

test("authorizeBusinessRequest enforces feature flag, origin, verified identity, permission, and branch access", async () => {
  const original = { ...process.env };
  let identityRow = {
    user_id: "11111111-1111-4111-8111-111111111111",
    role: "warehouse_staff",
    active: true,
    full_name: "Staff",
    branch_id: "CN1",
  };
  let verifiedUser = { id: "11111111-1111-4111-8111-111111111111", email: "staff@narihome.vn" };
  let dbCalls = 0;

  const { authorizeBusinessRequest } = load("src/lib/server/business-access.ts", {
    "next/server": { NextResponse },
    "@supabase/ssr": {
      createServerClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: verifiedUser }, error: null }),
        },
      }),
    },
    "@/lib/server/postgres-database": {
      getPostgresDatabase: () => ({
        query: async () => {
          dbCalls++;
          return { rows: identityRow ? [identityRow] : [] };
        },
      }),
    },
  });

  try {
    Object.assign(process.env, {
      NODE_ENV: "test",
      NARI_AUTH_ENABLED: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnop",
      APP_ORIGIN: "http://localhost:3010",
    });
    delete process.env.NARI_TEST_BIZ_ENABLED;

    const getReq = () => new NextRequest("http://localhost:3010/api/orders", { method: "GET" });
    const postReq = (origin = "http://localhost:3010") =>
      new NextRequest("http://localhost:3010/api/orders", {
        method: "POST",
        headers: origin ? { Origin: origin } : {},
      });

    // Flag off -> 503
    assert.equal(
      (await authorizeBusinessRequest(getReq(), { flagEnv: "NARI_TEST_BIZ_ENABLED", permission: "inventory:read" }))
        .response.status,
      503,
    );

    process.env.NARI_TEST_BIZ_ENABLED = "true";

    // Untrusted origin on POST -> 403
    assert.equal(
      (await authorizeBusinessRequest(postReq("https://evil.test"), { flagEnv: "NARI_TEST_BIZ_ENABLED" })).response
        .status,
      403,
    );

    // Unauthenticated -> 401 without querying identity table
    verifiedUser = null;
    assert.equal(
      (await authorizeBusinessRequest(getReq(), { flagEnv: "NARI_TEST_BIZ_ENABLED", permission: "inventory:read" }))
        .response.status,
      401,
    );
    assert.equal(dbCalls, 0);

    // Authenticated warehouse_staff (CN1): missing permission -> 403
    verifiedUser = { id: "11111111-1111-4111-8111-111111111111", email: "staff@narihome.vn" };
    assert.equal(
      (await authorizeBusinessRequest(postReq(), { flagEnv: "NARI_TEST_BIZ_ENABLED", permission: "orders:write" }))
        .response.status,
      403,
    );

    // Authorized permission + branch helper check
    const allowed = await authorizeBusinessRequest(postReq(), {
      flagEnv: "NARI_TEST_BIZ_ENABLED",
      permission: "inventory:write",
      requireOrigin: true,
    });
    assert.equal(allowed.response, null);
    assert.equal(allowed.user.role, "warehouse_staff");
    assert.equal(allowed.canAccessBranch("CN1"), true);
    assert.equal(allowed.canAccessBranch("CN2"), false);

    // Cross-branch request -> 403
    assert.equal(
      (
        await authorizeBusinessRequest(getReq(), {
          flagEnv: "NARI_TEST_BIZ_ENABLED",
          permission: "inventory:read",
          branchId: "CN2",
        })
      ).response.status,
      403,
    );
  } finally {
    process.env = original;
  }
});

test("proxy and customer portal pages refresh cookies and verify auth when Supabase is configured", async () => {
  const original = { ...process.env };
  let currentUser = { id: "cust-1", email: "kh@narihome.vn" };

  try {
    Object.assign(process.env, {
      NODE_ENV: "test",
      NARI_AUTH_ENABLED: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnop",
      APP_ORIGIN: "http://localhost:3010",
    });

    const { proxy } = load("src/proxy.ts", {
      "@/lib/server/supabase-session": {
        isSupabaseSessionConfigured: () => true,
        createSupabaseSession: (request) => ({
          response: (() => {
            const response = NextResponse.json({});
            response.cookies.set("sb-token", "cust-fresh", { httpOnly: true });
            return response;
          })(),
          client: {
            auth: {
              getUser: async () => {
                request.cookies.set("sb-token", "cust-fresh");
                return { data: { user: currentUser }, error: null };
              },
            },
          },
        }),
      },
    });

    const custReq = new NextRequest("http://localhost:3010/khach-hang/tai-khoan");
    const custRes = await proxy(custReq);
    assert.equal(custRes.status, 200);
    assert.equal(custRes.cookies.get("sb-token").value, "cust-fresh");

    const mockRedirect = (url) => {
      const err = new Error(`NEXT_REDIRECT:${url}`);
      err.digest = `NEXT_REDIRECT;replace;${url};307;;`;
      throw err;
    };
    const pageStubs = {
      "next/headers": { cookies: async () => ({ getAll: () => [], get: () => undefined }) },
      "next/navigation": { redirect: mockRedirect },
      "@/components/sites/nari/customer-portal-view": {
        CustomerPortalView: (props) => ({ type: "CustomerPortalView", props }),
      },
      "@supabase/ssr": {
        createServerClient: () => ({
          auth: {
            getUser: async () => ({ data: { user: currentUser }, error: null }),
          },
        }),
      },
      "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    };

    const sectionPage = load("src/app/khach-hang/[section]/page.tsx", pageStubs).default;
    const rendered = await sectionPage({ params: Promise.resolve({ section: "tai-khoan" }) });
    assert.equal(rendered.props.section, "tai-khoan");

    currentUser = null;
    await assert.rejects(
      () => sectionPage({ params: Promise.resolve({ section: "don-hang" }) }),
      /NEXT_REDIRECT:\/dang-nhap\?redirect=\/khach-hang\/don-hang/,
    );

    const rootPage = load("src/app/khach-hang/page.tsx", pageStubs).default;
    await assert.rejects(() => rootPage(), /NEXT_REDIRECT:\/dang-nhap\?redirect=\/khach-hang\/tai-khoan/);
    currentUser = { id: "cust-1", email: "kh@narihome.vn" };
    await assert.rejects(() => rootPage(), /NEXT_REDIRECT:\/khach-hang\/tai-khoan/);

    const { proxy: legacyProxy } = load("src/proxy.ts", {
      "@/lib/server/supabase-session": {
        isSupabaseSessionConfigured: () => false,
        createSupabaseSession: () => {
          throw new Error("must not construct supabase session");
        },
      },
    });
    const legacyCustRes = await legacyProxy(new NextRequest("http://localhost:3010/khach-hang/tai-khoan"));
    assert.equal(legacyCustRes.status, 307);
    assert.match(legacyCustRes.headers.get("location") || "", /\/dang-nhap\?redirect=%2Fkhach-hang%2Ftai-khoan/);
  } finally {
    process.env = original;
  }
});

test("/api/session uses shared Postgres rate limiter when NARI_SHARED_RATE_LIMIT=postgres and returns customerAccess on GET", async () => {
  const original = { ...process.env };
  let currentUser = { id: "cust-1", email: "kh@narihome.vn" };
  let pgQueries = 0;
  let retrySeconds = 0;

  try {
    process.env.NARI_SHARED_RATE_LIMIT = "postgres";
    const sessionMod = load("src/lib/server/supabase-session.ts", {
      "next/server": { NextResponse },
      "@supabase/ssr": { createServerClient: () => ({}) },
    });
    const route = load("src/app/api/session/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/supabase-session": {
        sessionResponse: sessionMod.sessionResponse,
        readSupabaseSessionConfig: () => ({ origin: "http://localhost:3010" }),
        createSupabaseSession: () => ({
          response: NextResponse.json({}),
          config: { origin: "http://localhost:3010" },
          client: {
            auth: {
              getUser: async () => ({ data: { user: currentUser }, error: null }),
              signInWithPassword: async () => ({ data: { user: currentUser, session: {} }, error: null }),
              signOut: async () => ({ error: null }),
            },
          },
        }),
      },
      "@/lib/server/catalog-admin-access": { readCatalogAdminConfig: () => { throw new Error("disabled"); } },
      "@/lib/server/staff-portal-access": { readStaffPortalConfig: () => { throw new Error("disabled"); } },
      "@/lib/server/postgres-database": {
        getPostgresDatabase: () => ({
          query: async (sql, values) => {
            pgQueries++;
            assert.match(sql, /nari_identity\.check_rate_limit/);
            assert.equal(values.length, 3);
            return {
              rows: [
                {
                  result: retrySeconds > 0
                    ? { allowed: false, remaining: 0, retryAfterSeconds: retrySeconds }
                    : { allowed: true, remaining: 4, retryAfterSeconds: 0 },
                },
              ],
            };
          },
        }),
      },
    });

    const getRes = await route.GET(new NextRequest("http://localhost:3010/api/session"));
    const getBody = await getRes.json();
    assert.equal(getRes.status, 200);
    assert.equal(getBody.customerAccess, true);
    assert.equal(getBody.businessAccess, false);

    currentUser = null;
    const unauthGetRes = await route.GET(new NextRequest("http://localhost:3010/api/session"));
    assert.equal(unauthGetRes.status, 401);
    assert.equal((await unauthGetRes.json()).customerAccess, false);

    currentUser = { id: "cust-1", email: "kh@narihome.vn" };
    const okPost = await route.POST(
      new NextRequest("http://localhost:3010/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3010" },
        body: JSON.stringify({ email: "kh@narihome.vn", password: "secret" }),
      }),
    );
    assert.equal(okPost.status, 200);
    assert.equal(pgQueries, 2);

    retrySeconds = 900;
    const blockedPost = await route.POST(
      new NextRequest("http://localhost:3010/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost:3010" },
        body: JSON.stringify({ email: "kh@narihome.vn", password: "secret" }),
      }),
    );
    assert.equal(blockedPost.status, 429);
    assert.equal(blockedPost.headers.get("Retry-After"), "900");
  } finally {
    process.env = original;
  }
});
