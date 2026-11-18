/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS loader exercises the TS repositories without adding dependencies. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Module = require("node:module");
const ts = require("typescript");

// Run the actual TypeScript repositories without a new test dependency.
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith("@/") ? path.join(__dirname, "../src", id.slice(2)) : id, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } },
).outputText, filename);

if (process.argv[2] === "read") {
  const { readLiveCatalog } = require("../src/lib/server/live-catalog-store.ts");
  assert.equal(readLiveCatalog().products["storage-check.html"].price, 123000);
  console.log("PASS catalog survives a separate process");
  process.exit(0);
}

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hasaki-catalog-test-"));
process.env.SQLITE_DB_PATH = path.join(directory, "test.db");
process.env.SEED_HASAKI_DATA = "false";
try {
  const { getSqliteDb } = require("../src/lib/sqlite-db.ts");
  const { readLiveCatalog, writeLiveCatalog } = require("../src/lib/server/live-catalog-store.ts");
  const { getAllCatalogProducts, getFeaturedProducts, categoryProducts, findCatalogProduct } = require("../src/lib/catalog.ts");
  const { getRichProductDetail } = require("../src/lib/product-details.ts");
  const { getDealsSnapshot, getBestsellersSnapshot } = require("../src/lib/deals-bestsellers.ts");
  const { getNewArrivals } = require("../src/lib/new-arrivals.ts");
  const { searchCatalogLive } = require("../src/lib/interactive-ui.ts");
  const db = getSqliteDb();
  const state = readLiveCatalog();
  state.products["storage-check.html"] = {
    sku: "TEST-STORAGE", slug: "storage-check.html", name: "Persistence check", brand: "Test",
    category: "sua-rua-mat-c19.html", price: 123000, old: 123000, sale: 0, image: "/test.png", updatedAt: "",
    description: '<img src="x" onerror="alert(1)">',
  };
  writeLiveCatalog(state);
  assert.equal(getAllCatalogProducts(readLiveCatalog()).find((p) => p.sku === "TEST-STORAGE").price, 123000);
  assert.equal(findCatalogProduct("storage-check.html", readLiveCatalog()).price, 123000);
  assert.ok(getFeaturedProducts(readLiveCatalog()).some((p) => p.sku === "TEST-STORAGE"));
  assert.ok(categoryProducts("sua-rua-mat-c19.html", readLiveCatalog()).some((p) => p.sku === "TEST-STORAGE"));
  const detail = getRichProductDetail("storage-check.html", readLiveCatalog());
  assert.equal(detail.price, 123000);
  assert.ok(detail.overviewHtml.startsWith("&lt;img"));
  assert.ok(!detail.overviewHtml.includes("<img"));
  console.log("PASS home/category/product/cart lookup uses runtime overrides and escapes authored HTML");
  assert.ok(searchCatalogLive("Persistence check", 10, state).products.some((p) => p.sku === "TEST-STORAGE"));
  for (const resolveSnapshot of [getDealsSnapshot, getBestsellersSnapshot, getNewArrivals]) {
    const snapshot = resolveSnapshot();
    assert.ok(snapshot.length > 1);
    const changed = {
      ...state, deletedSlugs: [snapshot[1].slug],
      products: {
        ...state.products,
        [snapshot[0].slug]: { ...state.products["storage-check.html"], slug: snapshot[0].slug, name: "Changed snapshot product" },
      },
    };
    const result = resolveSnapshot(changed);
    assert.equal(result.length, snapshot.length - 1);
    assert.equal(result[0].name, "Changed snapshot product");
    assert.equal(result[0].numericPrice ?? result[0].price, 123000);
    assert.ok(!result.some((p) => p.slug === "storage-check.html" || p.slug === snapshot[1].slug));
    assert.ok(!result.some((p) => p.isSample));
    if ("rank" in snapshot[0]) assert.equal(result[0].rank, snapshot[0].rank);
  }
  console.log("PASS autocomplete and deal/bestseller/new-arrival overrides preserve membership and hide products");
  db.exec("BEGIN IMMEDIATE");
  const hidden = readLiveCatalog();
  hidden.deletedSlugs.push("storage-check.html");
  writeLiveCatalog(hidden);
  assert.ok(!getAllCatalogProducts(readLiveCatalog()).some((p) => p.sku === "TEST-STORAGE"));
  db.exec("ROLLBACK");
  assert.ok(getAllCatalogProducts(readLiveCatalog()).some((p) => p.sku === "TEST-STORAGE"));
  console.log("PASS runtime product merge, hide and transaction rollback");
  const restarted = spawnSync(process.execPath, [__filename, "read"], { env: process.env, encoding: "utf8" });
  assert.equal(restarted.status, 0, restarted.stderr);
  process.stdout.write(restarted.stdout);
  db.prepare("UPDATE system_settings SET value = '{}' WHERE key = 'live_catalog_overrides'").run();
  assert.throws(readLiveCatalog, /CATALOG_STORAGE_INVALID/);
  console.log("PASS invalid stored state fails instead of returning a snapshot");
  db.close();
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
