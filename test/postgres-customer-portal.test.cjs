/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TS test harness */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextRequest, NextResponse } = require("next/server");

function loadTs(relativePath, stubs = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const mod = { exports: {} };
  const localRequire = require("node:module").createRequire(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  new Function("module", "exports", "require", code)(mod, mod.exports, (id) => {
    if (id === "server-only") return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith("@/")) return loadTs(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  });
  return mod.exports;
}

const CUST_UUID = "22222222-2222-4222-8222-222222222222";

test("/api/customer/portal enforces authentication, CSRF, and blocks tier/loyaltyPoints/role tampering", async () => {
  const boundedBody = loadTs("src/lib/server/bounded-request-body.ts");
  const supabasePrincipal = loadTs("src/lib/server/supabase-principal.ts");
  const erpTypes = loadTs("src/lib/erp-types.ts");
  const customerService = loadTs("src/lib/server/postgres-customer-service.ts", {
    "@/lib/erp-types": erpTypes,
  });

  let currentUser = { id: CUST_UUID, email: "kh@narihome.vn", user_metadata: { full_name: "Khách A" } };
  const profileState = {
    user_id: CUST_UUID,
    email: "kh@narihome.vn",
    full_name: "Khách A",
    phone: "0901234567",
    default_address: "Quận 1, TP.HCM",
    tier: "Member",
    loyalty_points: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const seenQueries = [];
  const mockDb = {
    async query(sql, values) {
      seenQueries.push({ sql, values });
      if (sql.includes("FROM nari_identity.customer_profiles") && sql.startsWith("SELECT")) {
        return { rows: [profileState] };
      }
      if (sql.includes("UPDATE nari_identity.customer_profiles")) {
        profileState.full_name = values[1];
        profileState.phone = values[2];
        profileState.default_address = values[3];
        return { rows: [profileState] };
      }
      if (sql.includes("FROM nari_orders.orders")) {
        return {
          rows: [
            {
              id: "ord-1",
              order_code: "NARI-20261120-0001",
              branch_id: "br-1",
              recipient_name: "Khách A",
              recipient_phone: "0901234567",
              shipping_address: "Quận 1",
              delivery_type: "NariNow 2H",
              payment_method: "cod",
              payment_status: "unpaid",
              status: "confirmed",
              subtotal: 390000,
              shipping_fee: 0,
              total_amount: 390000,
              created_at: new Date().toISOString(),
              branch_name: "Nari Home Q1",
            },
          ],
        };
      }
      if (sql.includes("FROM nari_orders.order_items")) {
        return {
          rows: [
            {
              order_id: "ord-1",
              sku: "NARI-SRM-001",
              product_name: "Serum HA B5",
              unit_price: 390000,
              quantity: 1,
              slug: "serum-ha-b5.html",
              brand_name: "Nari Botanicals",
            },
          ],
        };
      }
      return { rows: [] };
    },
  };

  const sessionStub = {
    readSupabaseSessionConfig: () => ({ url: "https://proj.supabase.co", key: "sb_publishable_123", origin: "https://narihome.test" }),
    sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
    createSupabaseSession: () => ({
      response: NextResponse.json({}),
      config: { origin: "https://narihome.test" },
      client: {
        auth: {
          getUser: async () => ({ data: { user: currentUser }, error: null }),
        },
      },
    }),
  };

  const route = loadTs("src/app/api/customer/portal/route.ts", {
    "next/server": { NextResponse },
    "@/lib/server/bounded-request-body": boundedBody,
    "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
    "@/lib/server/postgres-customer-service": customerService,
    "@/lib/server/supabase-principal": supabasePrincipal,
    "@/lib/server/supabase-session": sessionStub,
  });

  // GET authenticated returns scoped profile, orders, loyalty
  const getRes = await route.GET(new NextRequest("https://narihome.test/api/customer/portal"));
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.equal(getJson.profile.userId, CUST_UUID);
  assert.equal(getJson.orders.length, 1);
  assert.equal(getJson.bookings, undefined);
  assert.equal(getJson.loyalty.totalSpent, 390000);

  // Orders query scoped strictly by user_id
  assert.ok(seenQueries.some((q) => q.sql.includes("WHERE o.user_id = $1::uuid") && q.values[0] === CUST_UUID));

  // PATCH rejects untrusted origin -> 403
  const badOriginRes = await route.PATCH(
    new NextRequest("https://narihome.test/api/customer/portal", {
      method: "PATCH",
      headers: { Origin: "https://evil.test", "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Hack" }),
    }),
  );
  assert.equal(badOriginRes.status, 403);

  // PATCH rejects forbidden tier / loyaltyPoints / role tampering -> 400
  for (const field of [{ tier: "Diamond" }, { loyaltyPoints: 9999 }, { role: "admin" }]) {
    const tamperRes = await route.PATCH(
      new NextRequest("https://narihome.test/api/customer/portal", {
        method: "PATCH",
        headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
        body: JSON.stringify(field),
      }),
    );
    assert.equal(tamperRes.status, 400);
    assert.equal((await tamperRes.json()).code, "PROFILE_FIELDS_FORBIDDEN");
  }

  // PATCH valid update -> 200
  const okPatchRes = await route.PATCH(
    new NextRequest("https://narihome.test/api/customer/portal", {
      method: "PATCH",
      headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Nguyễn Lan", phone: "0912345678", defaultAddress: "Quận 3" }),
    }),
  );
  assert.equal(okPatchRes.status, 200);
  const okPatchJson = await okPatchRes.json();
  assert.equal(okPatchJson.profile.fullName, "Nguyễn Lan");
  assert.equal(okPatchJson.profile.tier, "Member");

  // Unauthenticated GET -> 401
  currentUser = null;
  assert.equal((await route.GET(new NextRequest("https://narihome.test/api/customer/portal"))).status, 401);
});

test("/api/auth/register, /api/auth/recovery, and /auth/callback enforce CSRF, role rejection, rate limits, and open-redirect safety", async () => {
  const prevShared = process.env.NARI_SHARED_RATE_LIMIT;
  process.env.NARI_SHARED_RATE_LIMIT = "postgres";

  try {
    const boundedBody = loadTs("src/lib/server/bounded-request-body.ts");
    const supabasePrincipal = loadTs("src/lib/server/supabase-principal.ts");
    const sessionInput = loadTs("src/lib/server/session-input.ts");
    const erpTypes = loadTs("src/lib/erp-types.ts");
    const customerService = loadTs("src/lib/server/postgres-customer-service.ts", { "@/lib/erp-types": erpTypes });

    let rateBlocked = false;
    let currentAuthUser = null;
    let exchangeShouldFail = false;

    const mockDb = {
      async query(sql) {
        if (sql.includes("nari_identity.check_rate_limit")) {
          return {
            rows: [
              {
                result: rateBlocked
                  ? { allowed: false, remaining: 0, retryAfterSeconds: 900 }
                  : { allowed: true, remaining: 4, retryAfterSeconds: 0 },
              },
            ],
          };
        }
        if (sql.includes("FROM nari_identity.customer_profiles") && sql.startsWith("SELECT")) {
          return {
            rows: [
              {
                user_id: CUST_UUID,
                email: "newuser@narihome.vn",
                full_name: "New User",
                phone: "0901234567",
                default_address: "",
                tier: "Member",
                loyalty_points: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const sessionStub = {
      isSupabaseSessionConfigured: () => true,
      readSupabaseSessionConfig: () => ({ origin: "https://narihome.test" }),
      sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
      createSupabaseSession: () => {
        const response = NextResponse.json({});
        response.cookies.set("sb-auth", "cookie-ok", { httpOnly: true });
        return {
          response,
          config: { origin: "https://narihome.test" },
          client: {
            auth: {
              signUp: async ({ email }) => ({
                data: { user: { id: CUST_UUID, email, identities: [{ id: "id-1" }] }, session: null },
                error: null,
              }),
              resetPasswordForEmail: async () => ({ error: null }),
              getUser: async () => ({ data: { user: currentAuthUser }, error: null }),
              updateUser: async () => ({ error: null }),
              exchangeCodeForSession: async () => ({ error: exchangeShouldFail ? new Error("bad") : null }),
            },
          },
        };
      },
    };

    const registerRoute = loadTs("src/app/api/auth/register/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/postgres-customer-service": customerService,
      "@/lib/server/session-input": sessionInput,
      "@/lib/server/supabase-principal": supabasePrincipal,
      "@/lib/server/supabase-session": sessionStub,
    });

    const recoveryRoute = loadTs("src/app/api/auth/recovery/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/session-input": sessionInput,
      "@/lib/server/supabase-principal": supabasePrincipal,
      "@/lib/server/supabase-session": sessionStub,
    });

    const callbackRoute = loadTs("src/app/auth/callback/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/supabase-session": sessionStub,
    });

    // Register: rejects bad origin (403) and role escalation attempt (400)
    assert.equal(
      (
        await registerRoute.POST(
          new NextRequest("https://narihome.test/api/auth/register", {
            method: "POST",
            headers: { Origin: "https://evil.test", "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await registerRoute.POST(
          new NextRequest("https://narihome.test/api/auth/register", {
            method: "POST",
            headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
            body: JSON.stringify({ fullName: "A", email: "a@b.test", password: "password123", role: "admin" }),
          }),
        )
      ).status,
      400,
    );

    // Register: succeeds 201 and creates profile
    const regOk = await registerRoute.POST(
      new NextRequest("https://narihome.test/api/auth/register", {
        method: "POST",
        headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "New User",
          email: "newuser@narihome.vn",
          phone: "0901234567",
          password: "password123",
        }),
      }),
    );
    assert.equal(regOk.status, 201);
    assert.equal((await regOk.json()).requiresEmailConfirmation, true);

    // Register & Recovery rate limit -> 429
    rateBlocked = true;
    assert.equal(
      (
        await registerRoute.POST(
          new NextRequest("https://narihome.test/api/auth/register", {
            method: "POST",
            headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName: "New User",
              email: "newuser@narihome.vn",
              password: "password123",
            }),
          }),
        )
      ).status,
      429,
    );
    assert.equal(
      (
        await recoveryRoute.POST(
          new NextRequest("https://narihome.test/api/auth/recovery", {
            method: "POST",
            headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
            body: JSON.stringify({ email: "newuser@narihome.vn" }),
          }),
        )
      ).status,
      429,
    );

    rateBlocked = false;
    const recPost = await recoveryRoute.POST(
      new NextRequest("https://narihome.test/api/auth/recovery", {
        method: "POST",
        headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@narihome.vn" }),
      }),
    );
    assert.equal(recPost.status, 200);

    // Recovery PUT requires active session -> 401 then 200
    assert.equal(
      (
        await recoveryRoute.PUT(
          new NextRequest("https://narihome.test/api/auth/recovery", {
            method: "PUT",
            headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
            body: JSON.stringify({ password: "new-password-123" }),
          }),
        )
      ).status,
      401,
    );
    currentAuthUser = { id: CUST_UUID, email: "newuser@narihome.vn" };
    assert.equal(
      (
        await recoveryRoute.PUT(
          new NextRequest("https://narihome.test/api/auth/recovery", {
            method: "PUT",
            headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
            body: JSON.stringify({ password: "new-password-123" }),
          }),
        )
      ).status,
      200,
    );

    // Callback: blocks open redirect //evil.test and copies auth cookies
    const cbRes = await callbackRoute.GET(
      new NextRequest("https://narihome.test/auth/callback?code=abc123&next=//evil.test"),
    );
    assert.equal(cbRes.status, 307);
    assert.equal(cbRes.headers.get("location"), "https://narihome.test/khach-hang/tai-khoan");
    assert.equal(cbRes.cookies.get("sb-auth")?.value, "cookie-ok");

    // Callback: failed code -> error redirect
    exchangeShouldFail = true;
    const cbFailRes = await callbackRoute.GET(
      new NextRequest("https://narihome.test/auth/callback?code=bad"),
    );
    assert.equal(cbFailRes.headers.get("location"), "https://narihome.test/dang-nhap?error=callback_invalid");
  } finally {
    if (prevShared === undefined) delete process.env.NARI_SHARED_RATE_LIMIT;
    else process.env.NARI_SHARED_RATE_LIMIT = prevShared;
  }
});

test(
  "PGlite integration: postgres-customer-service reads/writes profile and isolates orders under nari_catalog_runtime",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);
    const pg = new PGlite();
    const sqlFile = (name) => fs.readFileSync(path.join(__dirname, "../db/migrations", name), "utf8");
    const OTHER_UUID = "33333333-3333-4333-8333-333333333333";

    try {
      await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);");
      await pg.exec(sqlFile("202611160001_catalog_inventory.sql"));
      await pg.exec(sqlFile("202611170001_identity.sql"));
      await pg.exec(sqlFile("202611170002_catalog_runtime.sql"));
      await pg.exec(sqlFile("202611170003_catalog_reference_authoring.sql"));
      await pg.exec(sqlFile("202611180001_auth_ratelimit_customers.sql"));
      await pg.exec(sqlFile("202611180002_orders_fulfillment.sql"));

      await pg.query("INSERT INTO auth.users(id) VALUES ($1), ($2)", [CUST_UUID, OTHER_UUID]);
      await pg.exec(`
        INSERT INTO nari_catalog.brands (id, slug, name) VALUES ('b1', 'nari-lab', 'Nari Lab');
        INSERT INTO nari_catalog.categories (id, slug, name) VALUES ('c1', 'cham-soc-da.html', 'Chăm sóc da');
        INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_nowfree_2h, supports_clinic, is_active, is_demo)
        VALUES ('br-1', 'HCMQ1', 'Nari Home Q1', '123 Lê Lợi', 'TP. Hồ Chí Minh', 'Quận 1', '18006324', true, false, true, false);
        INSERT INTO nari_catalog.products (id, sku, slug, name, brand_id, category_id, price, market_price)
        VALUES ('p1', 'NARI-001', 'serum-ha.html', 'Serum HA', 'b1', 'c1', 390000, 450000);
      `);
      await pg.exec("SET ROLE nari_catalog_runtime");
      const db = {
        query: (sql, values) => pg.query(sql, values ? [...values] : undefined),
        transaction: async (op) => {
          await pg.exec("BEGIN");
          try {
            const res = await op({ query: (sql, values) => pg.query(sql, values ? [...values] : undefined) });
            await pg.exec("COMMIT");
            return res;
          } catch (err) {
            await pg.exec("ROLLBACK").catch(() => {});
            throw err;
          }
        },
      };

      const orderService = loadTs("src/lib/server/postgres-order-service.ts");
      const erpTypes = loadTs("src/lib/erp-types.ts");
      const customerService = loadTs("src/lib/server/postgres-customer-service.ts", { "@/lib/erp-types": erpTypes });

      await orderService.createPostgresOrder(db, {
        idempotencyKey: "cust-own-order-01",
        userId: CUST_UUID,
        recipientName: "Khách A",
        recipientPhone: "0901234567",
        shippingAddress: "Q1",
        items: [{ sku: "NARI-001", quantity: 1 }],
      });
      await orderService.createPostgresOrder(db, {
        idempotencyKey: "other-user-order-01",
        userId: OTHER_UUID,
        recipientName: "Khách B",
        recipientPhone: "0912345678",
        shippingAddress: "Q3",
        items: [{ sku: "NARI-001", quantity: 2 }],
      });

      const portal = await customerService.getCustomerPortalData(db, {
        id: CUST_UUID,
        email: "kh@narihome.vn",
        fullName: "Khách A",
      });
      assert.equal(portal.orders.length, 1);
      assert.equal(portal.orders[0].recipientName, "Khách A");
      assert.equal(portal.loyalty.totalSpent, 390000);

      const updated = await customerService.updateCustomerProfile(db, CUST_UUID, {
        fullName: "Khách A Updated",
        phone: "0909888777",
        defaultAddress: "Quận 7, TP.HCM",
      });
      assert.equal(updated.fullName, "Khách A Updated");
      assert.equal(updated.defaultAddress, "Quận 7, TP.HCM");
    } finally {
      await pg.close();
    }
  },
);
