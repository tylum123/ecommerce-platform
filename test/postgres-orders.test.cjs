const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadTs(relativePath, stubs = {}) {
  const fullPath = path.join(__dirname, "..", relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const mod = { exports: {} };
  const requireModule = (specifier) => {
    if (Object.hasOwn(stubs, specifier)) {
      return stubs[specifier];
    }
    if (specifier.startsWith("node:")) {
      return require(specifier);
    }
    throw new Error(`Unexpected module import in ${relativePath}: ${specifier}`);
  };
  new Function("require", "module", "exports", outputText)(requireModule, mod, mod.exports);
  return mod.exports;
}

function sqlFile(filename) {
  return fs.readFileSync(path.join(__dirname, "..", "db", "migrations", filename), "utf8");
}

function createPgliteAdapter(pg) {
  return {
    query(sql, values) {
      return pg.query(sql, values ? [...values] : undefined);
    },
    async transaction(operation) {
      await pg.exec("BEGIN");
      try {
        const result = await operation({
          query(sql, values) {
            return pg.query(sql, values ? [...values] : undefined);
          },
        });
        await pg.exec("COMMIT");
        return result;
      } catch (error) {
        try {
          await pg.exec("ROLLBACK");
        } catch {
          // Ignore rollback failure when transaction already aborted.
        }
        throw error;
      }
    },
  };
}

async function setupPgliteOrdersDb() {
  const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);
  const pg = new PGlite();

  await pg.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
  `);

  await pg.exec(sqlFile("202611160001_catalog_inventory.sql"));
  await pg.exec(sqlFile("202611170001_identity.sql"));
  await pg.exec(sqlFile("202611170002_catalog_runtime.sql"));
  await pg.exec(sqlFile("202611170003_catalog_reference_authoring.sql"));
  await pg.exec(sqlFile("202611180002_orders_fulfillment.sql"));

  await pg.exec(`
    INSERT INTO nari_catalog.sources (id, verification_state, scope)
    VALUES
      ('src-merchant', 'merchant', 'catalog'),
      ('src-demo', 'demo', 'demo');

    INSERT INTO nari_catalog.brands (id, slug, name, is_demo, source_id)
    VALUES
      ('brand-1', 'nari-lab', 'Nari Lab', false, 'src-merchant');

    INSERT INTO nari_catalog.categories (id, slug, name, display_order, is_demo, source_id)
    VALUES
      ('cat-1', 'cham-soc-da', 'Cham soc da', 1, false, 'src-merchant');

    INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_nowfree_2h, is_active, is_demo, source_id)
    VALUES
      ('branch-hcm-01', 'HCM01', 'Nari Home Q1', '123 Le Loi', 'Ho Chi Minh', 'Quan 1', '0901234567', true, true, false, 'src-merchant'),
      ('branch-demo-01', 'DEMO01', 'Demo Branch', '1 Demo St', 'Ho Chi Minh', 'Quan 1', '0901234568', true, true, true, 'src-demo');

    INSERT INTO nari_catalog.products (id, sku, slug, name, brand_id, category_id, price, market_price, is_demo, source_id)
    VALUES
      ('prod-1', 'NARI-001', 'serum-duong-am-nari.html', 'Serum Duong Am Nari 30ml', 'brand-1', 'cat-1', 250000, 320000, false, 'src-merchant'),
      ('prod-2', 'NARI-002', 'sua-rua-mat-nari.html', 'Sua Rua Mat Nari 100ml', 'brand-1', 'cat-1', 80000, 100000, false, 'src-merchant'),
      ('prod-demo', 'DEMO-001', 'demo-product.html', 'Demo Serum', 'brand-1', 'cat-1', 100000, 100000, true, 'src-demo');

    INSERT INTO nari_catalog.inventory_balances (branch_id, product_id, total_stock, reserved_stock)
    VALUES
      ('branch-hcm-01', 'prod-1', 10, 0),
      ('branch-hcm-01', 'prod-2', 2, 0);
  `);

  await pg.exec("SET ROLE nari_catalog_runtime");
  const roleRes = await pg.query("SELECT current_user");
  assert.equal(roleRes.rows[0].current_user, "nari_catalog_runtime");

  return { pg, db: createPgliteAdapter(pg) };
}

const orderService = loadTs("src/lib/server/postgres-order-service.ts");

test(
  "server-side pricing ignores tampered client prices and filters demo catalog records",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { pg, db } = await setupPgliteOrdersDb();
    try {
      const result = await orderService.createPostgresOrder(db, {
        idempotencyKey: "idem-price-check-001",
        branchId: "branch-hcm-01",
        recipientName: "Nguyen Minh Anh",
        recipientPhone: "0912345678",
        shippingAddress: "45 Nguyen Hue, Quan 1",
        deliveryType: "NariNow 2H",
        paymentMethod: "cod",
        items: [{ sku: "NARI-001", quantity: 2, price: 1 }],
      });

      assert.equal(result.replayed, false);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].unitPrice, 250000);
      assert.equal(result.items[0].lineTotal, 500000);
      assert.equal(result.order.subtotal, 500000);
      assert.equal(result.order.shippingFee, 0);
      assert.equal(result.order.totalAmount, 500000);

      const lowTotalResult = await orderService.createPostgresOrder(db, {
        idempotencyKey: "idem-price-check-002",
        recipientName: "Nguyen Minh Anh",
        recipientPhone: "0912345678",
        shippingAddress: "45 Nguyen Hue, Quan 1",
        deliveryType: "NariNow 2H",
        paymentMethod: "cod",
        items: [{ slug: "sua-rua-mat-nari.html", quantity: 1, price: 5 }],
      });
      assert.equal(lowTotalResult.order.subtotal, 80000);
      assert.equal(lowTotalResult.order.shippingFee, 25000);
      assert.equal(lowTotalResult.order.totalAmount, 105000);

      await assert.rejects(
        () =>
          orderService.createPostgresOrder(db, {
            idempotencyKey: "idem-demo-product-001",
            recipientName: "Nguyen Minh Anh",
            recipientPhone: "0912345678",
            shippingAddress: "45 Nguyen Hue, Quan 1",
            items: [{ sku: "DEMO-001", quantity: 1 }],
          }),
        (err) => err instanceof orderService.OrderInputError && err.status === 404 && err.code === "ORDER_PRODUCT_NOT_FOUND",
      );

      await assert.rejects(
        () =>
          orderService.createPostgresOrder(db, {
            idempotencyKey: "idem-demo-branch-001",
            branchId: "branch-demo-01",
            recipientName: "Nguyen Minh Anh",
            recipientPhone: "0912345678",
            shippingAddress: "45 Nguyen Hue, Quan 1",
            items: [{ sku: "NARI-001", quantity: 1 }],
          }),
        (err) => err instanceof orderService.OrderInputError && err.status === 404 && err.code === "ORDER_BRANCH_NOT_FOUND",
      );
    } finally {
      await pg.close();
    }
  },
);

test(
  "duplicate Idempotency-Key replays identical order without double-reserving stock",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { pg, db } = await setupPgliteOrdersDb();
    try {
      const input = {
        idempotencyKey: "idem-replay-key-001",
        branchId: "branch-hcm-01",
        recipientName: "Tran Thu Ha",
        recipientPhone: "0987654321",
        shippingAddress: "10 Le Thanh Ton, Quan 1",
        paymentMethod: "vietqr",
        items: [{ sku: "NARI-001", quantity: 2 }],
      };

      const first = await orderService.createPostgresOrder(db, input);
      assert.equal(first.replayed, false);

      const second = await orderService.createPostgresOrder(db, input);
      assert.equal(second.replayed, true);
      assert.equal(second.orderCode, first.orderCode);
      assert.equal(second.order.id, first.order.id);
      assert.equal(second.items[0].quantity, 2);

      const balanceRes = await pg.query(
        "SELECT total_stock, reserved_stock, available_stock FROM nari_catalog.inventory_balances WHERE branch_id = 'branch-hcm-01' AND product_id = 'prod-1'",
      );
      assert.equal(balanceRes.rows[0].reserved_stock, 2);
      assert.equal(balanceRes.rows[0].available_stock, 8);

      const movementsRes = await pg.query(
        "SELECT delta, previous_stock, new_stock FROM nari_catalog.inventory_movements WHERE branch_id = 'branch-hcm-01' AND product_id = 'prod-1'",
      );
      assert.equal(movementsRes.rows.length, 1);
      assert.equal(movementsRes.rows[0].delta, -2);
      assert.equal(movementsRes.rows[0].previous_stock, 10);
      assert.equal(movementsRes.rows[0].new_stock, 8);
    } finally {
      await pg.close();
    }
  },
);

test(
  "insufficient stock throws ORDER_INSUFFICIENT_STOCK (409) and rolls back the entire transaction",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { pg, db } = await setupPgliteOrdersDb();
    try {
      await assert.rejects(
        () =>
          orderService.createPostgresOrder(db, {
            idempotencyKey: "idem-insufficient-001",
            branchId: "branch-hcm-01",
            recipientName: "Le Hoang Nam",
            recipientPhone: "0909111222",
            shippingAddress: "88 Hai Ba Trung, Quan 1",
            items: [
              { sku: "NARI-001", quantity: 2 },
              { sku: "NARI-002", quantity: 5 },
            ],
          }),
        (err) =>
          err instanceof orderService.OrderInputError &&
          err.status === 409 &&
          err.code === "ORDER_INSUFFICIENT_STOCK",
      );

      const balances = await pg.query(
        "SELECT product_id, reserved_stock FROM nari_catalog.inventory_balances WHERE branch_id = 'branch-hcm-01' ORDER BY product_id ASC",
      );
      assert.deepEqual(
        balances.rows.map((r) => ({ product_id: r.product_id, reserved_stock: r.reserved_stock })),
        [
          { product_id: "prod-1", reserved_stock: 0 },
          { product_id: "prod-2", reserved_stock: 0 },
        ],
      );

      const orderCount = await pg.query("SELECT count(*)::int AS cnt FROM nari_orders.orders");
      const keyCount = await pg.query("SELECT count(*)::int AS cnt FROM nari_orders.idempotency_keys");
      const movementCount = await pg.query("SELECT count(*)::int AS cnt FROM nari_catalog.inventory_movements");
      assert.equal(orderCount.rows[0].cnt, 0);
      assert.equal(keyCount.rows[0].cnt, 0);
      assert.equal(movementCount.rows[0].cnt, 0);
    } finally {
      await pg.close();
    }
  },
);

test(
  "cancelling order transitions with optimistic version check, restores reserved_stock, and appends movement",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { pg, db } = await setupPgliteOrdersDb();
    try {
      const created = await orderService.createPostgresOrder(db, {
        idempotencyKey: "idem-cancel-flow-001",
        branchId: "branch-hcm-01",
        recipientName: "Pham Ngoc Lan",
        recipientPhone: "0933444555",
        shippingAddress: "22 Dong Khoi, Quan 1",
        items: [{ sku: "NARI-001", quantity: 3 }],
      });

      assert.equal(created.order.status, "pending");
      assert.equal(created.order.version, 1);

      const confirmed = await orderService.transitionPostgresOrderStatus(db, {
        orderId: created.order.id,
        expectedVersion: 1,
        toStatus: "confirmed",
        actorId: "staff-01",
        note: "Xac nhan don",
      });
      assert.equal(confirmed.status, "confirmed");
      assert.equal(confirmed.version, 2);

      await assert.rejects(
        () =>
          orderService.transitionPostgresOrderStatus(db, {
            orderId: created.order.id,
            expectedVersion: 1,
            toStatus: "cancelled",
            actorId: "staff-01",
          }),
        (err) =>
          err instanceof orderService.OrderInputError &&
          err.status === 409 &&
          err.code === "ORDER_VERSION_CONFLICT",
      );

      const cancelled = await orderService.transitionPostgresOrderStatus(db, {
        orderId: created.order.id,
        expectedVersion: 2,
        toStatus: "cancelled",
        actorId: "staff-01",
        note: "Khach yeu cau huy",
      });
      assert.equal(cancelled.status, "cancelled");
      assert.equal(cancelled.version, 3);

      const balanceRes = await pg.query(
        "SELECT reserved_stock, available_stock FROM nari_catalog.inventory_balances WHERE branch_id = 'branch-hcm-01' AND product_id = 'prod-1'",
      );
      assert.equal(balanceRes.rows[0].reserved_stock, 0);
      assert.equal(balanceRes.rows[0].available_stock, 10);

      const movements = await pg.query(
        "SELECT delta, previous_stock, new_stock, reason FROM nari_catalog.inventory_movements WHERE product_id = 'prod-1' ORDER BY created_at ASC",
      );
      assert.equal(movements.rows.length, 2);
      assert.deepEqual(movements.rows[0], {
        delta: -3,
        previous_stock: 10,
        new_stock: 7,
        reason: `order_reserve:${created.orderCode}`,
      });
      assert.deepEqual(movements.rows[1], {
        delta: 3,
        previous_stock: 7,
        new_stock: 10,
        reason: `order_cancel:${created.orderCode}`,
      });

      const events = await pg.query(
        "SELECT from_status, to_status FROM nari_orders.order_events WHERE order_id = $1 ORDER BY created_at ASC",
        [created.order.id],
      );
      assert.deepEqual(events.rows, [
        { from_status: null, to_status: "pending" },
        { from_status: "pending", to_status: "confirmed" },
        { from_status: "confirmed", to_status: "cancelled" },
      ]);

      await assert.rejects(
        () =>
          orderService.transitionPostgresOrderStatus(db, {
            orderId: created.order.id,
            expectedVersion: 3,
            toStatus: "confirmed",
          }),
        (err) =>
          err instanceof orderService.OrderInputError &&
          err.status === 409 &&
          err.code === "ORDER_INVALID_TRANSITION",
      );

      // Verify runtime role cannot mutate or delete append-only inventory_movements.
      await assert.rejects(() =>
        pg.query("UPDATE nari_catalog.inventory_movements SET delta = 99 WHERE product_id = 'prod-1'"),
      );
      await assert.rejects(() =>
        pg.query("DELETE FROM nari_catalog.inventory_movements WHERE product_id = 'prod-1'"),
      );
    } finally {
      await pg.close();
    }
  },
);

test(
  "lookupPostgresOrder requires matching orderCode and recipientPhone",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const { pg, db } = await setupPgliteOrdersDb();
    try {
      const created = await orderService.createPostgresOrder(db, {
        idempotencyKey: "idem-lookup-check-001",
        recipientName: "Vo Thuy Tien",
        recipientPhone: "0911223344",
        shippingAddress: "12 Pasteur, Quan 1",
        items: [{ sku: "NARI-001", quantity: 1 }],
      });

      await assert.rejects(
        () => orderService.lookupPostgresOrder(db, created.orderCode, "12345"),
        (err) => err instanceof orderService.OrderInputError && err.status === 400,
      );

      const wrongPhone = await orderService.lookupPostgresOrder(db, created.orderCode, "0999888777");
      assert.equal(wrongPhone, null);

      const matched = await orderService.lookupPostgresOrder(db, created.orderCode, "0911223344");
      assert.ok(matched);
      assert.equal(matched.orderCode, created.orderCode);
      assert.equal(matched.items.length, 1);
      assert.equal(matched.items[0].sku, "NARI-001");
      assert.equal(matched.items[0].unitPrice, 250000);
    } finally {
      await pg.close();
    }
  },
);

test("orders route enforces disabled boundary and enabled origin/idempotency/lookup contract", async () => {
  const prevEnabled = process.env.NARI_ORDERS_ENABLED;
  const prevOrigin = process.env.APP_ORIGIN;

  try {
    const accessPolicy = loadTs("src/lib/server/access-policy.ts");
    const supabasePrincipal = loadTs("src/lib/server/supabase-principal.ts");
    const boundedBody = loadTs("src/lib/server/bounded-request-body.ts", { "server-only": {} });

    let activeDb = null;
    const route = loadTs("src/app/api/orders/route.ts", {
      "next/server": { NextResponse: Response },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/supabase-principal": supabasePrincipal,
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-order-service": orderService,
      "@/lib/server/postgres-database": {
        getPostgresDatabase() {
          return activeDb;
        },
      },
    });

    // 1. Disabled mode: 401 on GET, 503 on POST without reading body
    delete process.env.NARI_ORDERS_ENABLED;
    const disabledGet = await route.GET(new Request("http://localhost/api/orders?code=NARI-1&phone=0912345678"));
    assert.equal(disabledGet.status, 401);

    const disabledPostReq = new Request("http://localhost/api/orders", { method: "POST" });
    disabledPostReq.json = () => {
      throw new Error("Body must not be read when disabled");
    };
    const disabledPost = await route.POST(disabledPostReq);
    assert.equal(disabledPost.status, 503);

    if (!process.env.NARI_TEST_PGLITE_PATH) return;

    const { pg, db } = await setupPgliteOrdersDb();
    activeDb = db;
    try {
      process.env.NARI_ORDERS_ENABLED = "true";
      process.env.APP_ORIGIN = "https://narihome.vn";

      // 2. Bad origin rejected with 403
      const badOriginRes = await route.POST(
        new Request("https://narihome.vn/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://evil.example",
            "idempotency-key": "idem-route-bad-origin",
          },
          body: JSON.stringify({}),
        }),
      );
      assert.equal(badOriginRes.status, 403);

      // 3. Valid order creation returns 201 + server price + VietQR details
      const createBody = JSON.stringify({
        branchId: "branch-hcm-01",
        recipientName: "Hoang Bao Chau",
        recipientPhone: "0918181818",
        shippingAddress: "77 Nguyen Dinh Chieu, Quan 3",
        paymentMethod: "vietqr",
        items: [{ slug: "serum-duong-am-nari.html", quantity: 1, price: 1 }],
      });

      const createRes = await route.POST(
        new Request("https://narihome.vn/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://narihome.vn",
            "idempotency-key": "idem-route-create-001",
          },
          body: createBody,
        }),
      );
      assert.equal(createRes.status, 201);
      const createdJson = await createRes.json();
      assert.equal(createdJson.ok, true);
      assert.equal(createdJson.order.totalAmount, 250000);
      assert.ok(createdJson.orderCode.startsWith("NARI-"));
      assert.ok(createdJson.vietQr && createdJson.vietQr.qrUrl.includes(createdJson.orderCode));

      // 4. Replay with same Idempotency-Key returns 200 and same orderCode
      const replayRes = await route.POST(
        new Request("https://narihome.vn/api/orders", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://narihome.vn",
            "idempotency-key": "idem-route-create-001",
          },
          body: createBody,
        }),
      );
      assert.equal(replayRes.status, 200);
      const replayJson = await replayRes.json();
      assert.equal(replayJson.orderCode, createdJson.orderCode);
      assert.equal(replayJson.replayed, true);

      // 5. GET lookup matches (code, phone) and rejects wrong phone or missing params
      const okLookup = await route.GET(
        new Request(
          `https://narihome.vn/api/orders?code=${encodeURIComponent(createdJson.orderCode)}&phone=0918181818`,
        ),
      );
      assert.equal(okLookup.status, 200);
      const okLookupJson = await okLookup.json();
      assert.equal(okLookupJson.order.orderCode, createdJson.orderCode);
      assert.equal(okLookupJson.order.items.length, 1);

      const wrongPhoneLookup = await route.GET(
        new Request(
          `https://narihome.vn/api/orders?code=${encodeURIComponent(createdJson.orderCode)}&phone=0900000000`,
        ),
      );
      assert.equal(wrongPhoneLookup.status, 404);

      const missingParamsLookup = await route.GET(
        new Request(`https://narihome.vn/api/orders?code=${encodeURIComponent(createdJson.orderCode)}`),
      );
      assert.equal(missingParamsLookup.status, 400);

      // 6. PATCH cancel rejects wrong phone (404), cancels pending order (200) and restores stock,
      //    then rejects cancelling an already-cancelled (non-pending) order (409)
      const badOriginPatch = await route.PATCH(
        new Request("https://narihome.vn/api/orders", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "https://evil.example",
          },
          body: JSON.stringify({
            action: "cancel",
            orderCode: createdJson.orderCode,
            phone: "0918181818",
          }),
        }),
      );
      assert.equal(badOriginPatch.status, 403);

      const wrongPhoneCancel = await route.PATCH(
        new Request("https://narihome.vn/api/orders", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "https://narihome.vn",
          },
          body: JSON.stringify({
            action: "cancel",
            orderCode: createdJson.orderCode,
            phone: "0900000000",
          }),
        }),
      );
      assert.equal(wrongPhoneCancel.status, 404);

      const okCancel = await route.PATCH(
        new Request("https://narihome.vn/api/orders", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "https://narihome.vn",
          },
          body: JSON.stringify({
            action: "cancel",
            orderCode: createdJson.orderCode,
            phone: "0918181818",
            reason: "Khach doi y",
          }),
        }),
      );
      assert.equal(okCancel.status, 200);
      const okCancelJson = await okCancel.json();
      assert.equal(okCancelJson.ok, true);
      assert.equal(okCancelJson.order.status, "cancelled");
      assert.equal(okCancelJson.order.version, 2);

      const restoredBalance = await pg.query(
        "SELECT reserved_stock, available_stock FROM nari_catalog.inventory_balances WHERE branch_id = 'branch-hcm-01' AND product_id = 'prod-1'",
      );
      assert.equal(restoredBalance.rows[0].reserved_stock, 0);
      assert.equal(restoredBalance.rows[0].available_stock, 10);

      const cancelNonPending = await route.PATCH(
        new Request("https://narihome.vn/api/orders", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            origin: "https://narihome.vn",
          },
          body: JSON.stringify({
            action: "cancel",
            orderCode: createdJson.orderCode,
            phone: "0918181818",
          }),
        }),
      );
      assert.equal(cancelNonPending.status, 409);
      const cancelNonPendingJson = await cancelNonPending.json();
      assert.equal(cancelNonPendingJson.code, "ORDER_NOT_CANCELLABLE");
    } finally {
      await pg.close();
    }
  } finally {
    if (prevEnabled === undefined) delete process.env.NARI_ORDERS_ENABLED;
    else process.env.NARI_ORDERS_ENABLED = prevEnabled;
    if (prevOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = prevOrigin;
  }
});
