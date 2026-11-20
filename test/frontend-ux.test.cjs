/* eslint-disable @typescript-eslint/no-require-imports -- isolated frontend UX unit test harness */
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
    if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  };
  new Function("module", "exports", "require", output)(mod, mod.exports, requireModule);
  return mod.exports;
}

test("sanitizeBrandString recovers from mojibake while preserving valid UTF-8 Vietnamese", () => {
  const { sanitizeBrandString } = load("src/lib/brand-config.ts");
  const fallback = "Khơi nguồn vẻ đẹp - Kiến tạo khí chất";
  assert.equal(sanitizeBrandString("KhÆ¡i nguá»“n váº» Ä‘áº¹p - Kiáº¿n táº¡o khÃ­ cháº¥t", fallback), fallback);
  assert.equal(sanitizeBrandString("CÃ”NG TY Cá»” PHáº¦N NARI HOME BEAUTY & CLINIC", "Fallback Co"), "Fallback Co");
  assert.equal(sanitizeBrandString("   ", fallback), fallback);
  assert.equal(sanitizeBrandString(undefined, fallback), fallback);
  assert.equal(sanitizeBrandString(fallback, "Other"), fallback);
  assert.equal(sanitizeBrandString("CHĂM SÓC TẬN TÂM — ĐÃ XÁC THỰC", "Other"), "CHĂM SÓC TẬN TÂM — ĐÃ XÁC THỰC");
  assert.equal(sanitizeBrandString("Nari Home — Chăm sóc da chuẩn y khoa", "Other"), "Nari Home — Chăm sóc da chuẩn y khoa");
});

test("ProductCard renders quick-add action and enforces PostgreSQL claims policy", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { ProductCard } = load("src/components/sites/nari/product-card.tsx", {
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/image": { __esModule: true, default: () => null },
  });
  const html = renderToStaticMarkup(
    React.createElement(ProductCard, {
      product: {
        id: "prod-1",
        sku: "NARI-CLN-002",
        slug: "nari-calm-gel.html",
        name: "Sữa Rửa Mặt Nari Calm Gel",
        englishName: "Nari Calm Gentle Gel",
        brand: "Nari Lab",
        category: "sua-rua-mat-c19.html",
        price: 245000,
        old: 295000,
        sale: 17,
        image: "/img.jpg",
        catalogSource: "postgres",
      },
    }),
  );
  assert.match(html, /Thêm vào giỏ/);
  assert.match(html, /product-quick-add/);
  assert.match(html, /Nari Calm Gentle Gel/);
  assert.doesNotMatch(html, /Bill|Tặng|Official Authentic Skincare Formula/);
});

test("HomeView adapts PostgreSQL layout without side-banner gap or dead snapshot links", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { HomeView } = load("src/components/sites/nari/home-view.tsx", {
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/image": { __esModule: true, default: () => null },
    "@/components/sites/nari/header": { Header: () => null },
    "@/components/sites/nari/footer": { Footer: () => null },
    "@/components/sites/nari/product-card": { ProductCard: ({ product }) => React.createElement("div", { "data-card": product.slug }, product.name) },
  });
  const state = {
    source: "postgres",
    products: {
      "nari-calm-gel.html": {
        id: "prod-1",
        sku: "NARI-CLN-002",
        slug: "nari-calm-gel.html",
        name: "Sữa Rửa Mặt Nari Calm Gel",
        brand: "Nari Lab",
        category: "sua-rua-mat-c19.html",
        price: 245000,
        old: 295000,
        sale: 17,
        image: "/img.jpg",
        updatedAt: "",
      },
    },
    deletedSlugs: [],
    banners: { heroSlides: [{ id: "h1", src: "/nari-home-banner.jpg", alt: "Nari Home", href: "/tim-kiem" }], sideBanners: [] },
    references: {
      brands: [{ id: "b1", label: "Nari Lab", slug: "nari-lab.html" }],
      categories: [{ id: "c1", label: "Sữa Rửa Mặt", slug: "sua-rua-mat-c19.html" }],
    },
    updatedAt: "",
  };
  const html = renderToStaticMarkup(React.createElement(HomeView, { liveCatalog: state }));
  assert.match(html, /hero-layout--single/);
  assert.match(html, /Sản phẩm nổi bật Nari Home/);
  assert.match(html, /data-card="nari-calm-gel\.html"/);
  assert.match(html, /Nari Lab/);
  assert.doesNotMatch(html, /hero-side|VICHY|CERAVE|LA ROCHE-POSAY|Phụ Kiện Điện Thoại|href="\/booking"|href="\/dich-vu\//);
  assert.match(html, /Dịch vụ Clinic, bảng giá và đặt hẹn chưa khả dụng/);
});

test("CartView omits sample wording and renders NariNow 2H freeship threshold", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { CartView } = load("src/components/sites/nari/cart-view.tsx", {
    "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
    "next/image": { __esModule: true, default: () => null },
    "@/components/sites/nari/footer": { Footer: () => null },
    "@/components/sites/nari/nari-home-logo": { NariHomeLogo: () => null },
  });
  const html = renderToStaticMarkup(
    React.createElement(CartView, {
      liveCatalog: {
        source: "postgres",
        products: {},
        deletedSlugs: [],
        banners: { heroSlides: [], sideBanners: [] },
        updatedAt: "",
      },
    }),
  );
  assert.doesNotMatch(html, /sản phẩm mẫu|mô phỏng/);
  assert.match(html, /Giỏ hàng của bạn đang trống/);
});
