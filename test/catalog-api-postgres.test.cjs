/* eslint-disable @typescript-eslint/no-require-imports -- isolated TS API boundary harness */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextRequest } = require("next/server");

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname, "..", file);
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
    if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  });
  return mod.exports;
}

const pgCatalog = {
  source: "postgres",
  updatedAt: "2026-11-18T00:00:00.000Z",
  deletedSlugs: ["hidden-serum.html"],
  references: {
    brands: [{ id: "b1", slug: "nari-brand", label: "Nari Brand" }],
    categories: [{ id: "c1", slug: "merchant-serum.html", label: "Merchant Serum" }],
  },
  banners: { heroSlides: [], sideBanners: [] },
  products: {
    "vitamin-c-serum.html": {
      id: "p1",
      sku: "NARI-SKU-001",
      slug: "vitamin-c-serum.html",
      name: "Serum Vitamin C Nari",
      englishName: "Vitamin C Serum",
      brand: "Nari Brand",
      brandId: "b1",
      categoryId: "c1",
      category: "merchant-serum.html",
      price: 250000,
      old: 300000,
      sale: 17,
      image: "/nari-home-banner.jpg",
      images: ["/nari-home-banner.jpg"],
      specs: [],
      updatedAt: "2026-11-18T00:00:00.000Z",
      catalogSource: "postgres",
    },
  },
};

test("/api/products reads authoritative postgres catalog without fallback facets", async () => {
  const dbMod = load("src/lib/server/db.ts", {
    "@/lib/server/live-catalog-store": {
      readStorefrontCatalog: async () => pgCatalog,
    },
  });
  const route = load("src/app/api/products/route.ts", {
    "@/lib/server/db": dbMod,
  });

  const res = await route.GET(new Request("http://localhost/api/products?q=Vitamin"));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.data.total, 1);
  assert.equal(body.data.items[0].sku, "NARI-SKU-001");
  assert.equal(body.data.facets.categories[0].label, "Merchant Serum");
  assert.equal(body.data.facets.additionalGroups, undefined);

  const failingRoute = load("src/app/api/products/route.ts", {
    "@/lib/server/db": {
      queryProducts: async () => {
        throw new Error("CATALOG_POSTGRES_UNAVAILABLE");
      },
    },
  });
  const failRes = await failingRoute.GET(new Request("http://localhost/api/products"));
  assert.equal(failRes.status, 503);
  const failBody = await failRes.json();
  assert.equal(failBody.code, "CATALOG_POSTGRES_UNAVAILABLE");
});

test("/api/products/[slug] never synthesizes fake stats or falls back to snapshots", async () => {
  const route = load("src/app/api/products/[slug]/route.ts", {
    "@/lib/server/live-catalog-store": {
      readStorefrontCatalog: async () => pgCatalog,
    },
    "@/lib/server/db": {
      getProductFeedback: () => {
        throw new Error("Legacy feedback must not be called in postgres mode");
      },
    },
  });

  const okRes = await route.GET(new Request("http://localhost/api/products/vitamin-c-serum.html"), {
    params: Promise.resolve({ slug: "vitamin-c-serum.html" }),
  });
  assert.equal(okRes.status, 200);
  const okBody = await okRes.json();
  assert.equal(okBody.data.sku, "NARI-SKU-001");
  assert.equal(okBody.data.rating, undefined);
  assert.equal(okBody.data.reviewCount, undefined);
  assert.equal(okBody.data.sold, undefined);

  const missingRes = await route.GET(new Request("http://localhost/api/products/unknown-slug.html"), {
    params: Promise.resolve({ slug: "unknown-slug.html" }),
  });
  assert.equal(missingRes.status, 404);

  const hiddenRes = await route.GET(new Request("http://localhost/api/products/hidden-serum.html"), {
    params: Promise.resolve({ slug: "hidden-serum.html" }),
  });
  assert.equal(hiddenRes.status, 404);
});

test("/api/cart/quote enforces server-authoritative catalog pricing and rejects invalid items", async () => {
  const route = load("src/app/api/cart/quote/route.ts", {
    "@/lib/server/live-catalog-store": {
      catalogBackend: () => "postgres",
      readStorefrontCatalog: async () => pgCatalog,
    },
    "@/lib/db/repository": {
      generateVietQrPaymentDetails: ({ amount, orderCode }) => ({
        qrUrl: `https://qr.test/${orderCode}?amount=${amount}`,
      }),
    },
  });

  // Client attempts to tamper price to 1 VND — server must ignore and compute 250000 * 2 = 500000
  const quoteRes = await route.POST(
    new NextRequest("http://localhost/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ sku: "NARI-SKU-001", quantity: 2, price: 1 }],
        deliveryType: "NariNow 2H",
      }),
    })
  );
  assert.equal(quoteRes.status, 200);
  const quoteBody = await quoteRes.json();
  assert.equal(quoteBody.source, "postgres");
  assert.equal(quoteBody.quote.subtotal, 500000);
  assert.equal(quoteBody.quote.shippingFee, 0);
  assert.equal(quoteBody.quote.total, 500000);
  assert.equal(quoteBody.quote.items[0].price, 250000);

  const missingRes = await route.POST(
    new NextRequest("http://localhost/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ sku: "UNKNOWN-SKU", quantity: 1 }] }),
    })
  );
  assert.equal(missingRes.status, 404);

  const badQtyRes = await route.POST(
    new NextRequest("http://localhost/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ sku: "NARI-SKU-001", quantity: 0 }] }),
    })
  );
  assert.equal(badQtyRes.status, 400);
});
