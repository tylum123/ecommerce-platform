/* eslint-disable @typescript-eslint/no-require-imports -- isolated PostgreSQL branch service harness */
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

test("listPostgresBranches filters active non-demo branches by city, district, and query", async () => {
  const branchService = load("src/lib/server/postgres-branch-service.ts");
  const seenQueries = [];
  const mockDb = {
    async query(sql, values) {
      seenQueries.push({ sql, values });
      return {
        rows: [
          {
            id: "br-hcm-01",
            name: "Nari Home Tân Bình",
            address: "71 Hoàng Hoa Thám, P.13, Tân Bình",
            city: "TP. Hồ Chí Minh",
            district: "Quận Tân Bình",
            phone: "18006324",
            supports_nowfree_2h: true,
          },
        ],
      };
    },
  };

  const branches = await branchService.listPostgresBranches(mockDb, {
    city: "TP. Hồ Chí Minh",
    district: "Quận Tân Bình",
    query: "Hoàng Hoa Thám",
  });

  assert.equal(branches.length, 1);
  assert.equal(branches[0].id, "br-hcm-01");
  assert.equal(branches[0].hasClinic, false);
  assert.equal(branches[0].supportsNowfree2h, true);
  assert.equal(seenQueries.length, 1);
  assert.match(seenQueries[0].sql, /b\.is_active = true/);
  assert.match(seenQueries[0].sql, /NOT b\.is_demo/);
  assert.doesNotMatch(seenQueries[0].sql, /supports_clinic/);
  assert.deepEqual(seenQueries[0].values, ["TP. Hồ Chí Minh", "Quận Tân Bình", "%Hoàng Hoa Thám%"]);
});

test("Route /api/stores returns empty without NARI_POSTGRES_URL, queries PostgreSQL when set, and hides raw errors on 503", async () => {
  const prevPgUrl = process.env.NARI_POSTGRES_URL;
  const branchService = load("src/lib/server/postgres-branch-service.ts");

  const mockDb = {
    async query() {
      return {
        rows: [
          {
            id: "br-api-1",
            name: "Nari Home Quận 1",
            address: "123 Lê Lợi, Q.1",
            city: "TP. Hồ Chí Minh",
            district: "Quận 1",
            phone: "18006324",
            supports_nowfree_2h: true,
          },
        ],
      };
    },
  };

  try {
    delete process.env.NARI_POSTGRES_URL;
    const storesRoute = load("src/app/api/stores/route.ts", {
      "next/server": { NextResponse: Response },
      "@/lib/server/postgres-branch-service": branchService,
      "@/lib/server/postgres-database": { getPostgresDatabase: () => mockDb },
    });

    const emptyRes = await storesRoute.GET(new Request("https://narihome.test/api/stores"));
    assert.equal(emptyRes.status, 200);
    const emptyBody = await emptyRes.json();
    assert.equal(emptyBody.source, "empty");
    assert.deepEqual(emptyBody.data, []);

    process.env.NARI_POSTGRES_URL = "postgresql://runtime:secret@localhost:5432/nari";
    const pgRes = await storesRoute.GET(new Request("https://narihome.test/api/stores?city=TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh"));
    assert.equal(pgRes.status, 200);
    const pgBody = await pgRes.json();
    assert.equal(pgBody.source, "postgres");
    assert.equal(pgBody.total, 1);
    assert.equal(pgBody.data[0].id, "br-api-1");

    const failingRoute = load("src/app/api/stores/route.ts", {
      "next/server": { NextResponse: Response },
      "@/lib/server/postgres-branch-service": branchService,
      "@/lib/server/postgres-database": {
        getPostgresDatabase: () => ({
          query: async () => {
            throw new Error("secret-postgres-connection-failure-password-123");
          },
        }),
      },
    });
    const failRes = await failingRoute.GET(new Request("https://narihome.test/api/stores"));
    assert.equal(failRes.status, 503);
    const failText = await failRes.text();
    assert.doesNotMatch(failText, /secret-postgres-connection-failure/);
  } finally {
    if (prevPgUrl === undefined) delete process.env.NARI_POSTGRES_URL;
    else process.env.NARI_POSTGRES_URL = prevPgUrl;
  }
});
