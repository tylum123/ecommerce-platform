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
    if (id.startsWith("@/")) {
      return loadTs(`src/${id.slice(2)}.ts`, stubs);
    }
    return localRequire(id);
  });
  return mod.exports;
}

const UUID_1 = "11111111-1111-4111-8111-111111111111";

test("Admin ERP routes fail closed with 401 when NARI_ERP_ADMIN_ENABLED is unset", async () => {
  const prev = process.env.NARI_ERP_ADMIN_ENABLED;
  delete process.env.NARI_ERP_ADMIN_ENABLED;
  try {
    const accessPolicy = loadTs("src/lib/server/access-policy.ts");
    const routes = [
      ["src/app/api/admin/users/route.ts", ["GET", "POST", "PATCH"]],
      ["src/app/api/admin/staff/route.ts", ["GET", "POST", "PATCH"]],
      ["src/app/api/admin/orders/route.ts", ["GET", "POST", "PATCH"]],
      ["src/app/api/admin/inventory/route.ts", ["GET", "POST"]],
    ];
    for (const [file, methods] of routes) {
      const mod = loadTs(file, {
        "next/server": { NextResponse },
        "@/lib/server/access-policy": accessPolicy,
      });
      for (const method of methods) {
        const req = new NextRequest("http://localhost:3010/api/admin/test", { method });
        const res = await mod[method](req);
        assert.equal(res.status, 401, `${file} ${method}`);
        assert.equal((await res.json()).code, "AUTHENTICATION_REQUIRED");
      }
    }
  } finally {
    if (prev === undefined) delete process.env.NARI_ERP_ADMIN_ENABLED;
    else process.env.NARI_ERP_ADMIN_ENABLED = prev;
  }
});

test("Admin Users & Staff routes enforce RBAC permissions, customer lock rejection, and 501 out-of-band staff policy", async () => {
  const prev = process.env.NARI_ERP_ADMIN_ENABLED;
  process.env.NARI_ERP_ADMIN_ENABLED = "true";
  try {
    const accessPolicy = loadTs("src/lib/server/access-policy.ts");
    const boundedBody = loadTs("src/lib/server/bounded-request-body.ts");
    const erpTypes = loadTs("src/lib/erp-types.ts");
    const orderService = loadTs("src/lib/server/postgres-order-service.ts");
    const erpService = loadTs("src/lib/server/postgres-erp-service.ts", {
      "@/lib/erp-types": erpTypes,
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/postgres-order-service": orderService,
    });

    let activeUser = {
      id: "admin-1",
      email: "admin@narihome.vn",
      phone: "",
      fullName: "Admin",
      role: "admin",
      roleLabel: "admin",
      loggedInAt: new Date().toISOString(),
    };

    const queries = [];
    const mockDb = {
      async query(sql, values) {
        queries.push({ sql, values });
        if (sql.includes("FROM nari_identity.customer_profiles cp")) {
          return {
            rows: [
              {
                user_id: UUID_1,
                email: "kh@narihome.vn",
                full_name: "Nguyễn Thị Hoa",
                phone: "0901234567",
                default_address: "Quận 1, TP.HCM",
                tier: "Silver",
                loyalty_points: 200,
                created_at: new Date().toISOString(),
                orders_count: 2,
                total_spent: 650000,
              },
            ],
          };
        }
        if (sql.includes("FROM nari_identity.provisioned_identities pi")) {
          return {
            rows: [
              {
                user_id: UUID_1,
                role: "store_manager",
                active: true,
                full_name: "Quản Lý Q1",
                branch_id: "branch-q1",
                updated_at: new Date().toISOString(),
                branch_name: "Nari Home Q1",
                email: "",
                phone: "",
              },
            ],
          };
        }
        return { rows: [] };
      },
      async transaction(fn) {
        return fn({
          async query(sql, values) {
            if (sql.includes("FROM nari_identity.customer_profiles") && sql.includes("FOR UPDATE")) {
              return {
                rows: [
                  {
                    user_id: UUID_1,
                    email: "kh@narihome.vn",
                    full_name: "Nguyễn Thị Hoa",
                    phone: "0901234567",
                    default_address: "Quận 1, TP.HCM",
                    tier: "Silver",
                    loyalty_points: 200,
                    created_at: new Date().toISOString(),
                  },
                ],
              };
            }
            if (sql.includes("UPDATE nari_identity.customer_profiles")) {
              return {
                rows: [
                  {
                    user_id: UUID_1,
                    email: "kh@narihome.vn",
                    full_name: values[1],
                    phone: values[2],
                    default_address: values[3],
                    tier: values[4],
                    loyalty_points: values[5],
                    created_at: new Date().toISOString(),
                  },
                ],
              };
            }
            if (sql.includes("FROM nari_orders.orders")) {
              return { rows: [{ orders_count: 2, total_spent: 650000 }] };
            }
            return { rows: [] };
          },
        });
      },
    };

    const makeAuthStub = () => ({
      hasPermission: accessPolicy.hasPermission,
      canAccessBranch: accessPolicy.canAccessBranch,
      async authorizeBusinessRequest(_req, opts) {
        if (opts?.permission && !accessPolicy.hasPermission(activeUser, opts.permission)) {
          return {
            user: null,
            template: NextResponse.json({}),
            response: NextResponse.json({ ok: false, code: "PERMISSION_DENIED" }, { status: 403 }),
            canAccessBranch: () => false,
          };
        }
        return {
          user: activeUser,
          template: NextResponse.json({}),
          response: null,
          canAccessBranch: (b) => accessPolicy.canAccessBranch(activeUser, b),
        };
      },
    });

    const usersRoute = loadTs("src/app/api/admin/users/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/business-access": makeAuthStub(),
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/supabase-session": {
        sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
      },
      "@/lib/server/postgres-erp-service": erpService,
    });

    const staffRoute = loadTs("src/app/api/admin/staff/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/business-access": makeAuthStub(),
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/supabase-session": {
        sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
      },
      "@/lib/server/postgres-erp-service": erpService,
    });

    // GET users works for admin
    const listRes = await usersRoute.GET(new NextRequest("http://localhost:3010/api/admin/users"));
    assert.equal(listRes.status, 200);
    assert.equal((await listRes.json()).users.length, 1);

    // PATCH users supports nested { id, patch: { loyaltyPointsDelta, tier } }
    const patchRes = await usersRoute.PATCH(
      new NextRequest("http://localhost:3010/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: UUID_1, patch: { loyaltyPointsDelta: 100, tier: "Gold" } }),
      }),
    );
    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.user.loyaltyPoints, 300);
    assert.equal(patchBody.user.tier, "Gold");

    // PATCH users rejects unsupported lock status honestly
    const lockRes = await usersRoute.PATCH(
      new NextRequest("http://localhost:3010/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: UUID_1, patch: { status: "locked" } }),
      }),
    );
    assert.equal(lockRes.status, 400);
    assert.equal((await lockRes.json()).code, "CUSTOMER_LOCK_UNSUPPORTED");

    // POST/PATCH staff return 501 out-of-band for admin
    const staffPostRes = await staffRoute.POST(
      new NextRequest("http://localhost:3010/api/admin/staff", { method: "POST" }),
    );
    assert.equal(staffPostRes.status, 501);
    assert.equal((await staffPostRes.json()).code, "STAFF_PROVISIONING_OUT_OF_BAND");

    // store_manager GET staff is branch-scoped
    activeUser = { ...activeUser, role: "store_manager", branchId: "branch-q1" };
    const mgrStaffRes = await staffRoute.GET(new NextRequest("http://localhost:3010/api/admin/staff"));
    assert.equal(mgrStaffRes.status, 200);
    const staffQuery = queries.find((q) => q.sql.includes("FROM nari_identity.provisioned_identities pi"));
    assert.ok(staffQuery.values.includes("branch-q1"));

    // customer cannot access admin users or staff
    activeUser = { ...activeUser, role: "customer", branchId: undefined };
    assert.equal((await usersRoute.GET(new NextRequest("http://localhost:3010/api/admin/users"))).status, 403);
    assert.equal((await staffRoute.GET(new NextRequest("http://localhost:3010/api/admin/staff"))).status, 403);
  } finally {
    if (prev === undefined) delete process.env.NARI_ERP_ADMIN_ENABLED;
    else process.env.NARI_ERP_ADMIN_ENABLED = prev;
  }
});

test("Admin Orders & Inventory routes enforce branch scope, orders:pack boundary, and negative stock guard", async () => {
  const prev = process.env.NARI_ERP_ADMIN_ENABLED;
  process.env.NARI_ERP_ADMIN_ENABLED = "true";
  try {
    const accessPolicy = loadTs("src/lib/server/access-policy.ts");
    const boundedBody = loadTs("src/lib/server/bounded-request-body.ts");
    const erpTypes = loadTs("src/lib/erp-types.ts");
    const orderService = loadTs("src/lib/server/postgres-order-service.ts");
    const erpService = loadTs("src/lib/server/postgres-erp-service.ts", {
      "@/lib/erp-types": erpTypes,
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/postgres-order-service": orderService,
    });

    const activeUser = {
      id: "wh-1",
      email: "kho@narihome.vn",
      phone: "",
      fullName: "Kho Q1",
      role: "warehouse_staff",
      roleLabel: "warehouse_staff",
      branchId: "branch-q1",
      loggedInAt: new Date().toISOString(),
    };

    const mockDb = {
      async query(sql) {
        if (sql.includes("SELECT id, branch_id, version")) {
          return { rows: [{ id: "ord-q2", branch_id: "branch-q2", version: 1 }] };
        }
        return { rows: [] };
      },
      async transaction(fn) {
        return fn({
          async query(sql) {
            if (sql.includes("FROM nari_catalog.branches b")) {
              return { rows: [{ id: "branch-q1", name: "Nari Home Q1" }] };
            }
            if (sql.includes("FROM nari_catalog.products p")) {
              return { rows: [{ id: "prod-1", sku: "NARI-SRM-001", name: "Serum HA" }] };
            }
            if (sql.includes("FROM nari_catalog.inventory_balances")) {
              return { rows: [{ total_stock: 5, reserved_stock: 3 }] };
            }
            return { rows: [] };
          },
        });
      },
    };

    const authStub = {
      hasPermission: accessPolicy.hasPermission,
      canAccessBranch: accessPolicy.canAccessBranch,
      async authorizeBusinessRequest(_req, opts) {
        if (opts?.permission && !accessPolicy.hasPermission(activeUser, opts.permission)) {
          return {
            user: null,
            template: NextResponse.json({}),
            response: NextResponse.json({ ok: false, code: "PERMISSION_DENIED" }, { status: 403 }),
            canAccessBranch: () => false,
          };
        }
        return {
          user: activeUser,
          template: NextResponse.json({}),
          response: null,
          canAccessBranch: (b) => accessPolicy.canAccessBranch(activeUser, b),
        };
      },
    };

    const ordersRoute = loadTs("src/app/api/admin/orders/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/business-access": authStub,
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/supabase-session": {
        sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
      },
      "@/lib/server/postgres-order-service": orderService,
      "@/lib/server/postgres-erp-service": erpService,
    });

    const invRoute = loadTs("src/app/api/admin/inventory/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/business-access": authStub,
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/supabase-session": {
        sessionResponse: (_t, body, status = 200) => NextResponse.json(body, { status }),
      },
      "@/lib/server/postgres-erp-service": erpService,
    });

    // warehouse_staff cannot confirm orders (needs orders:write)
    const confirmRes = await ordersRoute.PATCH(
      new NextRequest("http://localhost:3010/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord-q2", status: "confirmed" }),
      }),
    );
    assert.equal(confirmRes.status, 403);

    // warehouse_staff can attempt packing (orders:pack) but is blocked on branch-q2 order
    const packCrossBranchRes = await ordersRoute.PATCH(
      new NextRequest("http://localhost:3010/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: "ord-q2", status: "packing" }),
      }),
    );
    assert.equal(packCrossBranchRes.status, 403);

    // Adjusting inventory below reserved_stock (5 - 3 = 2 < 3 reserved) fails 409 INSUFFICIENT_STOCK
    const invRes = await invRoute.POST(
      new NextRequest("http://localhost:3010/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: "NARI-SRM-001",
          branchId: "branch-q1",
          delta: -3,
          reason: "Xuất kiểm tra vượt tồn khả dụng",
        }),
      }),
    );
    assert.equal(invRes.status, 409);
    assert.equal((await invRes.json()).code, "INSUFFICIENT_STOCK");
  } finally {
    if (prev === undefined) delete process.env.NARI_ERP_ADMIN_ENABLED;
    else process.env.NARI_ERP_ADMIN_ENABLED = prev;
  }
});

test(
  "PGlite integration: postgres-erp-service reads/mutates customers, orders, KPIs, and branch inventory under nari_catalog_runtime",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);
    const pg = new PGlite();
    const sqlFile = (name) => fs.readFileSync(path.join(__dirname, "../db/migrations", name), "utf8");

    try {
      await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);");
      await pg.exec(sqlFile("202611160001_catalog_inventory.sql"));
      await pg.exec(sqlFile("202611170001_identity.sql"));
      await pg.exec(sqlFile("202611170002_catalog_runtime.sql"));
      await pg.exec(sqlFile("202611170003_catalog_reference_authoring.sql"));
      await pg.exec(sqlFile("202611180001_auth_ratelimit_customers.sql"));
      await pg.exec(sqlFile("202611180002_orders_fulfillment.sql"));

      await pg.query("INSERT INTO auth.users(id) VALUES ($1)", [UUID_1]);
      await pg.exec(`
        INSERT INTO nari_catalog.brands (id, slug, name) VALUES ('b1', 'nari-lab', 'Nari Lab');
        INSERT INTO nari_catalog.categories (id, slug, name) VALUES ('c1', 'cham-soc-da.html', 'Chăm sóc da');
        INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_nowfree_2h, is_active, is_demo)
        VALUES ('br-1', 'HCMQ1', 'Nari Home Q1', '123 Lê Lợi', 'TP. Hồ Chí Minh', 'Quận 1', '18006324', true, true, false);
        INSERT INTO nari_catalog.products (id, sku, slug, name, brand_id, category_id, price, market_price)
        VALUES ('p1', 'NARI-001', 'serum-ha.html', 'Serum HA', 'b1', 'c1', 350000, 420000);
        INSERT INTO nari_identity.provisioned_identities (user_id, role, active, full_name, branch_id)
        VALUES ('${UUID_1}', 'admin', true, 'Super Admin', NULL);
        INSERT INTO nari_identity.customer_profiles (user_id, email, full_name, phone, tier, loyalty_points)
        VALUES ('${UUID_1}', 'kh@narihome.vn', 'Khách Hàng A', '0901234567', 'Member', 50);
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

      const accessPolicy = loadTs("src/lib/server/access-policy.ts");
      const erpTypes = loadTs("src/lib/erp-types.ts");
      const orderService = loadTs("src/lib/server/postgres-order-service.ts");
      const erpService = loadTs("src/lib/server/postgres-erp-service.ts", {
        "@/lib/erp-types": erpTypes,
        "@/lib/server/access-policy": accessPolicy,
        "@/lib/server/postgres-order-service": orderService,
      });

      const adjusted = await erpService.adjustPostgresAdminInventoryStock(db, {
        sku: "NARI-001",
        branchId: "br-1",
        delta: 20,
        reason: "Nhập hàng đầu kỳ",
        actorId: "admin@narihome.vn",
      });
      assert.equal(adjusted.updatedItem.totalStock, 20);
      assert.equal(adjusted.auditLog.newStock, 20);

      const createdOrder = await orderService.createPostgresOrder(db, {
        idempotencyKey: "erp-pglite-order-001",
        userId: UUID_1,
        branchId: "br-1",
        recipientName: "Khách Hàng A",
        recipientPhone: "0901234567",
        shippingAddress: "Quận 1, TP.HCM",
        items: [{ sku: "NARI-001", quantity: 2 }],
      });

      const advanced = await erpService.advancePostgresAdminOrderStatus(db, {
        orderId: createdOrder.order.id,
        toStatus: "confirmed",
        expectedVersion: 1,
        actorId: "admin@narihome.vn",
      });
      assert.equal(advanced.status, "confirmed");
      assert.equal(advanced.version, 2);

      const updatedUser = await erpService.updatePostgresAdminUser(db, UUID_1, {
        loyaltyPointsDelta: 150,
        tier: "Silver",
      });
      assert.equal(updatedUser.loyaltyPoints, 200);
      assert.equal(updatedUser.tier, "Silver");
      assert.equal(updatedUser.ordersCount, 1);

      const staffList = await erpService.listPostgresAdminStaff(db);
      assert.equal(staffList.length, 1);
      assert.equal(staffList[0].role, "admin");

      const kpis = await erpService.getPostgresAdminDashboardKpis(db);
      assert.equal(kpis.totalOrders, 1);
      assert.equal(kpis.totalCustomers, 1);
      assert.equal(kpis.totalSkus, 1);
    } finally {
      await pg.close();
    }
  },
);
