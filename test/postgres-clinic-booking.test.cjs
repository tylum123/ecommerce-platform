/* eslint-disable @typescript-eslint/no-require-imports -- isolated PostgreSQL clinic & booking harness */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const mod = { exports: {} };
  const localRequire = require("node:module").createRequire(filename);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const requireModule = (id) => {
    if (id === "server-only") return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith("@/")) {
      const base = path.resolve(__dirname, "..", "src", id.slice(2));
      const resolved = fs.existsSync(`${base}.ts`)
        ? `src/${id.slice(2)}.ts`
        : `src/${id.slice(2)}.tsx`;
      return load(resolved, stubs);
    }
    return localRequire(id);
  };
  new Function("module", "exports", "require", output)(mod, mod.exports, requireModule);
  return mod.exports;
}

async function createClinicPglite() {
  const pglitePath = process.env.NARI_TEST_PGLITE_PATH;
  const { PGlite } = require(pglitePath);
  const { btree_gist } = require(path.join(path.dirname(pglitePath), "contrib/btree_gist.cjs"));
  const pg = new PGlite({ extensions: { btree_gist } });

  const migrationsDir = path.join(__dirname, "../db/migrations");
  const sqlFile = (name) => fs.readFileSync(path.join(migrationsDir, name), "utf8");

  await pg.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);"
  );
  await pg.exec(sqlFile("202611160001_catalog_inventory.sql"));
  await pg.exec(sqlFile("202611170001_identity.sql"));
  await pg.exec(sqlFile("202611170002_catalog_runtime.sql"));
  await pg.exec(sqlFile("202611170003_catalog_reference_authoring.sql"));

  const ordersMigration = path.join(migrationsDir, "202611180002_orders_fulfillment.sql");
  if (fs.existsSync(ordersMigration)) {
    const wave0001 = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.startsWith("202611180001") && name.endsWith(".sql"))
      .sort();
    for (const file of wave0001) {
      await pg.exec(sqlFile(file));
    }
    await pg.exec(sqlFile("202611180002_orders_fulfillment.sql"));
  } else {
    await pg.exec(`
      GRANT SELECT ON nari_catalog.branches TO nari_catalog_runtime;
      CREATE POLICY branches_runtime_read ON nari_catalog.branches
        FOR SELECT TO nari_catalog_runtime USING (true);
    `);
  }

  await pg.exec(sqlFile("202611180003_clinic_bookings.sql"));
  return pg;
}

test(
  "PostgreSQL clinic GiST exclusion enforces branch slot non-overlap under nari_catalog_runtime",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const pg = await createClinicPglite();
    try {
      await pg.exec(`
        INSERT INTO nari_catalog.sources (id, verification_state, scope)
        VALUES ('merchant', 'merchant', 'clinic-test'), ('demo', 'demo', 'clinic-test');

        INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_nowfree_2h, supports_clinic, is_active, is_demo, source_id)
        VALUES
          ('br-clinic-hcm', 'HCM01', 'Nari Clinic Quận 1', '71 Hoàng Hoa Thám, P.13, Tân Bình', 'TP. Hồ Chí Minh', 'Quận Tân Bình', '18006324', true, true, true, false, NULL),
          ('br-retail-only', 'HCM02', 'Nari Store Quận 3', '120 Nguyễn Đình Chiểu, Q.3', 'TP. Hồ Chí Minh', 'Quận 3', '18006324', true, false, true, false, NULL),
          ('br-demo', 'DEMO01', 'Demo Branch', '999 Demo', 'Hà Nội', 'Ba Đình', '18006324', false, true, true, true, NULL),
          ('br-inactive', 'INACT01', 'Inactive Clinic', '88 Closed St', 'Đà Nẵng', 'Hải Châu', '18006324', false, true, false, false, NULL);

        INSERT INTO nari_clinic.services (id, sku, slug, name, category, price, market_price, duration_minutes, description, image_url, is_active)
        VALUES
          ('svc-acne', 'DV-MUN-01', 'lay-nhan-mun-y-khoa.html', 'Lấy nhân mụn chuẩn y khoa', 'Điều Trị Mụn & Sẹo', 250000, 350000, 60, 'Làm sạch nhân mụn chuẩn y khoa', '/images/clinic-acne.jpg', true),
          ('svc-inactive', 'DV-OFF-01', 'tam-ngung.html', 'Dịch vụ tạm ngưng', 'Chăm Sóc & Thư Giãn', 199000, 299000, 45, 'Ngưng phục vụ', '', false);
      `);

      await pg.exec("SET ROLE nari_catalog_runtime");
      const database = {
        query: (sql, values) => pg.query(sql, values),
        transaction: (operation) =>
          pg.transaction((tx) => operation({ query: (sql, values) => tx.query(sql, values) })),
      };

      const clinicService = load("src/lib/server/postgres-clinic-service.ts");

      // Branch queries exclude demo and inactive rows
      const allBranches = await clinicService.listPostgresBranches(database);
      assert.deepEqual(
        allBranches.map((b) => b.id),
        ["br-retail-only", "br-clinic-hcm"]
      );
      const clinicBranches = await clinicService.listPostgresBranches(database, { hasClinic: true });
      assert.deepEqual(
        clinicBranches.map((b) => b.id),
        ["br-clinic-hcm"]
      );
      const queriedBranches = await clinicService.listPostgresBranches(database, {
        city: "TP. Hồ Chí Minh",
        district: "Quận Tân Bình",
        query: "Hoàng Hoa Thám",
      });
      assert.deepEqual(
        queriedBranches.map((b) => b.id),
        ["br-clinic-hcm"]
      );

      // Clinic services list formats vi-VN currency, duration, and booking URL
      const services = await clinicService.listPostgresClinicServices(database);
      assert.equal(services.length, 1);
      assert.equal(services[0].id, "svc-acne");
      assert.equal(services[0].price, "250.000 ₫");
      assert.equal(services[0].duration, "60 phút");
      assert.equal(services[0].booking, "/booking?sku=DV-MUN-01");

      // Merchant branch authoring policy permits non-demo with source_id IS NULL, denies demo/sourced
      await database.query(
        `INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_clinic)
         VALUES ('br-merchant-hn', 'HN01', 'Nari Clinic Hà Nội', '182 Cầu Giấy', 'Hà Nội', 'Cầu Giấy', '18006324', true)`
      );
      await assert.rejects(
        () =>
          database.query(
            `INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, is_demo)
             VALUES ('br-bad-demo', 'BAD1', 'Bad Demo', 'Addr', 'Hà Nội', 'Ba Đình', '18006324', true)`
          ),
        /row-level security/i
      );
      await assert.rejects(
        () =>
          database.query(
            `INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, source_id)
             VALUES ('br-bad-src', 'BAD2', 'Bad Source', 'Addr', 'Hà Nội', 'Ba Đình', '18006324', 'merchant')`
          ),
        /row-level security/i
      );

      // Non-clinic branch rejects with 404 CLINIC_BRANCH_NOT_FOUND
      await assert.rejects(
        () =>
          clinicService.createPostgresBooking(database, {
            customerName: "Nguyễn Minh Anh",
            customerPhone: "0901234567",
            branchId: "br-retail-only",
            serviceName: "Lấy nhân mụn chuẩn y khoa",
            date: "2026-11-25",
            time: "09:00",
          }),
        (err) => err instanceof clinicService.ClinicBookingError && err.status === 404 && err.code === "CLINIC_BRANCH_NOT_FOUND"
      );

      // 1. Booking [09:00, 10:00) on a clinic branch succeeds
      const first = await clinicService.createPostgresBooking(database, {
        customerName: "Nguyễn Minh Anh",
        customerPhone: "0901234567",
        branchId: "br-clinic-hcm",
        serviceId: "svc-acne",
        serviceName: "Lấy nhân mụn chuẩn y khoa",
        date: "2026-11-25",
        time: "09:00",
        durationMinutes: 60,
      });
      assert.match(first.bookingCode, /^BK-20261125-[A-F0-9]{8}$/);
      assert.equal(first.status, "booked");

      // 2. Overlapping [09:30, 10:30) on same branch throws BOOKING_SLOT_CONFLICT (409 via 23P01)
      await assert.rejects(
        () =>
          clinicService.createPostgresBooking(database, {
            customerName: "Trần Bảo Ngọc",
            customerPhone: "0912345678",
            branchId: "br-clinic-hcm",
            serviceId: "svc-acne",
            serviceName: "Lấy nhân mụn chuẩn y khoa",
            date: "2026-11-25",
            time: "09:30",
            durationMinutes: 60,
          }),
        (err) => err instanceof clinicService.ClinicBookingError && err.status === 409 && err.code === "BOOKING_SLOT_CONFLICT"
      );

      // 3. Back-to-back [10:00, 11:00) succeeds ([) half-open interval)
      const second = await clinicService.createPostgresBooking(database, {
        customerName: "Lê Thu Hà",
        customerPhone: "0987654321",
        branchId: "br-clinic-hcm",
        serviceName: "Lấy nhân mụn chuẩn y khoa",
        date: "2026-11-25",
        time: "10:00",
        durationMinutes: 60,
      });
      assert.equal(second.status, "booked");

      // 4. Cancelling the first booking (status = 'cancelled') allows rebooking [09:00, 10:00)
      await database.query(`UPDATE nari_clinic.appointments SET status = 'cancelled' WHERE id = $1`, [first.id]);
      const rebooked = await clinicService.createPostgresBooking(database, {
        customerName: "Phạm Gia Hân",
        customerPhone: "0934567890",
        branchId: "br-clinic-hcm",
        serviceId: "svc-acne",
        serviceName: "Lấy nhân mụn chuẩn y khoa",
        date: "2026-11-25",
        time: "09:00",
        durationMinutes: 60,
      });
      assert.equal(rebooked.status, "booked");
      assert.notEqual(rebooked.id, first.id);

      // Runtime cannot DELETE clinic rows
      for (const sql of [
        "DELETE FROM nari_clinic.appointments WHERE false",
        "DELETE FROM nari_clinic.services WHERE false",
      ]) {
        await assert.rejects(() => database.query(sql), /permission denied/i);
      }

      await pg.exec("RESET ROLE");
    } finally {
      await pg.close();
    }
  }
);

test("Route /api/bookings rejects when NARI_BOOKINGS_ENABLED is unset before parsing body", async () => {
  const prevEnabled = process.env.NARI_BOOKINGS_ENABLED;
  delete process.env.NARI_BOOKINGS_ENABLED;

  try {
    const clinicService = load("src/lib/server/postgres-clinic-service.ts");
    const boundedBody = load("src/lib/server/bounded-request-body.ts");
    const route = load("src/app/api/bookings/route.ts", {
      "next/server": { NextResponse: Response },
      "@/lib/server/postgres-clinic-service": clinicService,
      "@/lib/server/bounded-request-body": boundedBody,
      "@/lib/server/postgres-database": {
        getPostgresDatabase() {
          throw new Error("Database must not be accessed when NARI_BOOKINGS_ENABLED is unset");
        },
      },
    });

    const getRes = await route.GET();
    assert.equal(getRes.status, 401);
    assert.equal((await getRes.json()).code, "AUTHENTICATION_REQUIRED");

    const postReq = new Request("http://localhost:3000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ name: "Test" }),
    });
    postReq.json = () => {
      throw new Error("Route must not call request.json() when disabled");
    };
    Object.defineProperty(postReq, "body", {
      get() {
        throw new Error("Route must not read request.body when disabled");
      },
    });

    const postRes = await route.POST(postReq);
    assert.equal(postRes.status, 503);
    assert.equal((await postRes.json()).code, "SERVICE_UNAVAILABLE");
  } finally {
    if (prevEnabled === undefined) delete process.env.NARI_BOOKINGS_ENABLED;
    else process.env.NARI_BOOKINGS_ENABLED = prevEnabled;
  }
});

test(
  "Routes /api/bookings and /api/stores enforce CSRF origin, body bounds, 201/409 booking, and safe 503",
  { skip: !process.env.NARI_TEST_PGLITE_PATH },
  async () => {
    const prevEnabled = process.env.NARI_BOOKINGS_ENABLED;
    const prevOrigin = process.env.APP_ORIGIN;
    const prevPgUrl = process.env.NARI_POSTGRES_URL;
    const pg = await createClinicPglite();

    try {
      await pg.exec(`
        INSERT INTO nari_catalog.branches (id, code, name, address, city, district, phone, supports_clinic, is_active, is_demo)
        VALUES ('br-api-1', 'HCM99', 'Nari Clinic API Test', '71 Hoàng Hoa Thám', 'TP. Hồ Chí Minh', 'Quận Tân Bình', '18006324', true, true, false);
      `);
      await pg.exec("SET ROLE nari_catalog_runtime");
      const database = {
        query: (sql, values) => pg.query(sql, values),
        transaction: (operation) =>
          pg.transaction((tx) => operation({ query: (sql, values) => tx.query(sql, values) })),
      };

      process.env.NARI_BOOKINGS_ENABLED = "true";
      process.env.APP_ORIGIN = "https://narihome.test";
      const clinicService = load("src/lib/server/postgres-clinic-service.ts");
      const boundedBody = load("src/lib/server/bounded-request-body.ts");
      const bookingRoute = load("src/app/api/bookings/route.ts", {
        "next/server": { NextResponse: Response },
        "@/lib/server/postgres-clinic-service": clinicService,
        "@/lib/server/bounded-request-body": boundedBody,
        "@/lib/server/postgres-database": { getPostgresDatabase: () => database },
      });

      // Untrusted origin -> 403
      const badOriginRes = await bookingRoute.POST(
        new Request("https://narihome.test/api/bookings", {
          method: "POST",
          headers: { Origin: "https://evil.test", "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );
      assert.equal(badOriginRes.status, 403);
      assert.equal((await badOriginRes.json()).code, "INVALID_ORIGIN");

      // Oversized payload > 64KB -> 413
      const oversizedRes = await bookingRoute.POST(
        new Request("https://narihome.test/api/bookings", {
          method: "POST",
          headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
          body: JSON.stringify({ padding: "x".repeat(65 * 1024) }),
        })
      );
      assert.equal(oversizedRes.status, 413);

      // Valid booking -> 201
      const okRes = await bookingRoute.POST(
        new Request("https://narihome.test/api/bookings", {
          method: "POST",
          headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Trần Lan Anh",
            phone: "0909112233",
            branchId: "br-api-1",
            service: "Triệt lông Diode Laser",
            date: "2026-11-26",
            time: "14:00",
          }),
        })
      );
      assert.equal(okRes.status, 201);
      const okBody = await okRes.json();
      assert.equal(okBody.ok, true);
      assert.equal(okBody.success, true);
      assert.match(okBody.bookingCode, /^BK-20261126-/);
      assert.equal(okBody.booking.branchId, "br-api-1");

      // Overlapping booking -> 409
      const conflictRes = await bookingRoute.POST(
        new Request("https://narihome.test/api/bookings", {
          method: "POST",
          headers: { Origin: "https://narihome.test", "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Hoàng Mai",
            phone: "0911223344",
            branchId: "br-api-1",
            service: "Triệt lông Diode Laser",
            date: "2026-11-26",
            time: "14:30",
          }),
        })
      );
      assert.equal(conflictRes.status, 409);
      assert.equal((await conflictRes.json()).code, "BOOKING_SLOT_CONFLICT");

      // /api/stores: empty when NARI_POSTGRES_URL is unset
      delete process.env.NARI_POSTGRES_URL;
      const storesRoute = load("src/app/api/stores/route.ts", {
        "next/server": { NextResponse: Response },
        "@/lib/server/postgres-clinic-service": clinicService,
        "@/lib/server/postgres-database": { getPostgresDatabase: () => database },
      });
      const emptyStoresRes = await storesRoute.GET(new Request("https://narihome.test/api/stores"));
      assert.equal(emptyStoresRes.status, 200);
      assert.deepEqual((await emptyStoresRes.json()).data, []);

      // /api/stores: postgres when configured
      process.env.NARI_POSTGRES_URL = "postgresql://runtime:secret@localhost:5432/nari";
      const pgStoresRes = await storesRoute.GET(new Request("https://narihome.test/api/stores?hasClinic=true"));
      assert.equal(pgStoresRes.status, 200);
      const pgStoresBody = await pgStoresRes.json();
      assert.equal(pgStoresBody.source, "postgres");
      assert.equal(pgStoresBody.total, 1);
      assert.equal(pgStoresBody.data[0].id, "br-api-1");

      // /api/stores: safe 503 without leaking raw error string
      const failingStoresRoute = load("src/app/api/stores/route.ts", {
        "next/server": { NextResponse: Response },
        "@/lib/server/postgres-clinic-service": clinicService,
        "@/lib/server/postgres-database": {
          getPostgresDatabase: () => ({
            query: async () => {
              throw new Error("secret-postgres-connection-failure-password-123");
            },
          }),
        },
      });
      const failStoresRes = await failingStoresRoute.GET(new Request("https://narihome.test/api/stores"));
      assert.equal(failStoresRes.status, 503);
      const failStoresText = await failStoresRes.text();
      assert.doesNotMatch(failStoresText, /secret-postgres-connection-failure/);

      await pg.exec("RESET ROLE");
    } finally {
      if (prevEnabled === undefined) delete process.env.NARI_BOOKINGS_ENABLED;
      else process.env.NARI_BOOKINGS_ENABLED = prevEnabled;
      if (prevOrigin === undefined) delete process.env.APP_ORIGIN;
      else process.env.APP_ORIGIN = prevOrigin;
      if (prevPgUrl === undefined) delete process.env.NARI_POSTGRES_URL;
      else process.env.NARI_POSTGRES_URL = prevPgUrl;
      await pg.close();
    }
  }
);
