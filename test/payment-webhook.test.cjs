/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TS test harness */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
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

function signWebhook(rawBody, secret, timestampSeconds, prefix = "sha256=") {
  const digest = createHmac("sha256", secret)
    .update(`${timestampSeconds}.${rawBody}`, "utf8")
    .digest("hex");
  return `${prefix}${digest}`;
}

test("verifyPaymentWebhookSignature and parsePaymentWebhookPayload enforce HMAC-SHA256, replay window, and schema bounds", () => {
  const svc = loadTs("src/lib/server/postgres-payment-webhook-service.ts");
  const secret = "nari-webhook-secret-key-0123456789";
  const now = 1_795_150_000;
  const rawBody = JSON.stringify({
    eventId: "evt_vietqr_0001",
    orderCode: "NARI-20261120-ABCD1234",
    amount: 390000,
    status: "paid",
    provider: "vietqr",
    transactionRef: "FT26325001",
  });

  // Valid signature with sha256= prefix and raw hex both pass
  svc.verifyPaymentWebhookSignature({
    rawBody,
    signatureHeader: signWebhook(rawBody, secret, now, "sha256="),
    timestampHeader: String(now),
    secret,
    nowSeconds: now,
  });
  svc.verifyPaymentWebhookSignature({
    rawBody,
    signatureHeader: signWebhook(rawBody, secret, now, ""),
    timestampHeader: String(now),
    secret,
    nowSeconds: now,
  });

  // Tampered payload fails 401
  assert.throws(
    () =>
      svc.verifyPaymentWebhookSignature({
        rawBody: rawBody.replace("390000", "1"),
        signatureHeader: signWebhook(rawBody, secret, now),
        timestampHeader: String(now),
        secret,
        nowSeconds: now,
      }),
    (err) => err.status === 401 && err.code === "WEBHOOK_SIGNATURE_INVALID",
  );

  // Stale timestamp (> 300s) fails 401
  assert.throws(
    () =>
      svc.verifyPaymentWebhookSignature({
        rawBody,
        signatureHeader: signWebhook(rawBody, secret, now - 301),
        timestampHeader: String(now - 301),
        secret,
        nowSeconds: now,
      }),
    (err) => err.status === 401 && err.code === "WEBHOOK_TIMESTAMP_INVALID",
  );

  const parsed = svc.parsePaymentWebhookPayload(rawBody);
  assert.equal(parsed.eventId, "evt_vietqr_0001");
  assert.equal(parsed.amount, 390000);
  assert.equal(parsed.status, "paid");

  assert.throws(
    () => svc.parsePaymentWebhookPayload(JSON.stringify({ eventId: "short", orderCode: "A", amount: 1, status: "paid" })),
    (err) => err.status === 400 && err.code === "WEBHOOK_EVENT_ID_INVALID",
  );
  assert.throws(
    () => svc.parsePaymentWebhookPayload(JSON.stringify({ eventId: "evt_valid_001", orderCode: "A", amount: 0, status: "paid" })),
    (err) => err.status === 400 && err.code === "WEBHOOK_AMOUNT_INVALID",
  );
});

test("POST /api/payments/webhook settles pending orders, rejects mismatch/cancelled, and replays idempotently", async () => {
  const prevEnabled = process.env.NARI_PAYMENT_WEBHOOK_ENABLED;
  const prevSecret = process.env.NARI_PAYMENT_WEBHOOK_SECRET;

  try {
    const accessPolicy = loadTs("src/lib/server/access-policy.ts");
    const boundedBody = loadTs("src/lib/server/bounded-request-body.ts");
    const webhookSvc = loadTs("src/lib/server/postgres-payment-webhook-service.ts");

    const orders = new Map([
      [
        "NARI-20261120-0001",
        { id: "ord-1", order_code: "NARI-20261120-0001", status: "pending", payment_status: "unpaid", total_amount: 390000, version: 1 },
      ],
      [
        "NARI-20261120-0002",
        { id: "ord-2", order_code: "NARI-20261120-0002", status: "cancelled", payment_status: "unpaid", total_amount: 200000, version: 2 },
      ],
    ]);
    const idem = new Map();
    const events = [];

    const mockDb = {
      async transaction(fn) {
        return fn({
          async query(sql, values) {
            if (sql.includes("INSERT INTO nari_orders.idempotency_keys")) {
              const key = values[0];
              if (idem.has(key)) return { rows: [] };
              idem.set(key, { scope: "payment_webhook", status: "processing", response_body: null });
              return { rows: [{ key }] };
            }
            if (sql.includes("SELECT scope, status, response_body")) {
              const entry = idem.get(values[0]);
              return { rows: entry ? [entry] : [] };
            }
            if (sql.includes("FROM nari_orders.orders") && sql.includes("FOR UPDATE")) {
              const order = orders.get(String(values[0]).toUpperCase());
              return { rows: order ? [order] : [] };
            }
            if (sql.includes("UPDATE nari_orders.orders")) {
              const [id, expectedVersion, nextStatus] = values;
              for (const order of orders.values()) {
                if (order.id === id && order.version === expectedVersion) {
                  if (sql.includes("payment_status = 'paid'")) {
                    order.payment_status = "paid";
                    order.status = nextStatus;
                  } else {
                    order.payment_status = "refunded";
                  }
                  order.version += 1;
                  return { rows: [{ status: order.status, payment_status: order.payment_status, version: order.version }] };
                }
              }
              return { rows: [] };
            }
            if (sql.includes("INSERT INTO nari_orders.order_events")) {
              events.push(values);
              return { rows: [] };
            }
            if (sql.includes("UPDATE nari_orders.idempotency_keys")) {
              const entry = idem.get(values[0]);
              if (entry) {
                entry.status = "completed";
                entry.response_body = JSON.parse(values[1]);
              }
              return { rows: [] };
            }
            return { rows: [] };
          },
        });
      },
    };

    const route = loadTs("src/app/api/payments/webhook/route.ts", {
      "next/server": { NextResponse },
      "@/lib/server/access-policy": accessPolicy,
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
      "@/lib/server/postgres-payment-webhook-service": webhookSvc,
    });

    // Disabled -> 503
    delete process.env.NARI_PAYMENT_WEBHOOK_ENABLED;
    delete process.env.NARI_PAYMENT_WEBHOOK_SECRET;
    assert.equal(
      (await route.POST(new NextRequest("https://narihome.test/api/payments/webhook", { method: "POST" }))).status,
      503,
    );

    const secret = "webhook-live-test-secret-0123456789";
    process.env.NARI_PAYMENT_WEBHOOK_ENABLED = "true";
    process.env.NARI_PAYMENT_WEBHOOK_SECRET = secret;
    const now = Math.floor(Date.now() / 1000);

    // 1. Valid settlement -> 200, pending -> confirmed, paid
    const paidBody = JSON.stringify({
      eventId: "evt_pay_0001",
      orderCode: "NARI-20261120-0001",
      amount: 390000,
      status: "paid",
      transactionRef: "MB-9991",
    });
    const payRes = await route.POST(
      new NextRequest("https://narihome.test/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nari-timestamp": String(now),
          "x-nari-signature": signWebhook(paidBody, secret, now),
        },
        body: paidBody,
      }),
    );
    assert.equal(payRes.status, 200);
    const payJson = await payRes.json();
    assert.equal(payJson.status, "confirmed");
    assert.equal(payJson.paymentStatus, "paid");
    assert.equal(payJson.idempotentReplay, false);

    // 2. Duplicate replay returns idempotentReplay: true and creates no extra event
    const replayRes = await route.POST(
      new NextRequest("https://narihome.test/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nari-timestamp": String(now),
          "x-nari-signature": signWebhook(paidBody, secret, now),
        },
        body: paidBody,
      }),
    );
    assert.equal(replayRes.status, 200);
    assert.equal((await replayRes.json()).idempotentReplay, true);
    assert.equal(events.length, 1);

    // 3. Amount mismatch -> 400 (note: rollback in real DB removes processing key; here use distinct eventId)
    const mismatchBody = JSON.stringify({
      eventId: "evt_mismatch_01",
      orderCode: "NARI-20261120-0001",
      amount: 1000,
      status: "paid",
    });
    const mismatchRes = await route.POST(
      new NextRequest("https://narihome.test/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nari-timestamp": String(now),
          "x-nari-signature": signWebhook(mismatchBody, secret, now),
        },
        body: mismatchBody,
      }),
    );
    assert.equal(mismatchRes.status, 400);
    assert.equal((await mismatchRes.json()).code, "WEBHOOK_AMOUNT_MISMATCH");

    // 4. Cancelled order cannot be paid -> 409
    const cancelledBody = JSON.stringify({
      eventId: "evt_cancelled_01",
      orderCode: "NARI-20261120-0002",
      amount: 200000,
      status: "paid",
    });
    const cancelledRes = await route.POST(
      new NextRequest("https://narihome.test/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nari-timestamp": String(now),
          "x-nari-signature": signWebhook(cancelledBody, secret, now),
        },
        body: cancelledBody,
      }),
    );
    assert.equal(cancelledRes.status, 409);
    assert.equal((await cancelledRes.json()).code, "ORDER_CANNOT_BE_PAID");

    // 5. Refund paid order -> 200
    const refundBody = JSON.stringify({
      eventId: "evt_refund_0001",
      orderCode: "NARI-20261120-0001",
      amount: 390000,
      status: "refunded",
    });
    const refundRes = await route.POST(
      new NextRequest("https://narihome.test/api/payments/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-nari-timestamp": String(now),
          "x-nari-signature": signWebhook(refundBody, secret, now),
        },
        body: refundBody,
      }),
    );
    assert.equal(refundRes.status, 200);
    assert.equal((await refundRes.json()).paymentStatus, "refunded");
  } finally {
    if (prevEnabled === undefined) delete process.env.NARI_PAYMENT_WEBHOOK_ENABLED;
    else process.env.NARI_PAYMENT_WEBHOOK_ENABLED = prevEnabled;
    if (prevSecret === undefined) delete process.env.NARI_PAYMENT_WEBHOOK_SECRET;
    else process.env.NARI_PAYMENT_WEBHOOK_SECRET = prevSecret;
  }
});

test(
  "PGlite integration: payment webhook atomically settles and replays against PostgreSQL constraints",
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
      await pg.exec(sqlFile("202611180002_orders_fulfillment.sql"));

      await pg.exec(`
        INSERT INTO nari_catalog.brands (id, slug, name) VALUES ('b1', 'nari-lab', 'Nari Lab');
        INSERT INTO nari_catalog.categories (id, slug, name) VALUES ('c1', 'cham-soc-da.html', 'Chăm sóc da');
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
      const webhookSvc = loadTs("src/lib/server/postgres-payment-webhook-service.ts");

      const created = await orderService.createPostgresOrder(db, {
        idempotencyKey: "pglite-webhook-order-01",
        recipientName: "Nguyen Van A",
        recipientPhone: "0901234567",
        shippingAddress: "71 Hoang Hoa Tham",
        paymentMethod: "vietqr",
        items: [{ sku: "NARI-001", quantity: 1 }],
      });

      const res1 = await webhookSvc.processPostgresPaymentWebhook(db, {
        eventId: "pglite_evt_0001",
        orderCode: created.orderCode,
        amount: created.order.totalAmount,
        status: "paid",
        provider: "vietqr",
        transactionRef: "TX-1001",
      });
      assert.equal(res1.status, "confirmed");
      assert.equal(res1.paymentStatus, "paid");
      assert.equal(res1.idempotentReplay, false);

      const res2 = await webhookSvc.processPostgresPaymentWebhook(db, {
        eventId: "pglite_evt_0001",
        orderCode: created.orderCode,
        amount: created.order.totalAmount,
        status: "paid",
        provider: "vietqr",
        transactionRef: "TX-1001",
      });
      assert.equal(res2.idempotentReplay, true);
    } finally {
      await pg.close();
    }
  },
);
