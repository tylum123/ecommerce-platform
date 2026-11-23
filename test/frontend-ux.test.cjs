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
    if (id.startsWith("@/")) {
      const base = path.resolve(__dirname, "..", "src", id.slice(2));
      const tsPath = `${base}.ts`;
      const tsxPath = `${base}.tsx`;
      return load(fs.existsSync(tsPath) ? tsPath : tsxPath, stubs);
    }
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

test("ui-skeletons renders Luxury Silk shimmer, aria-busy, and ModalLoadingOverlay", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const skeletons = load("src/components/sites/nari/ui-skeletons.tsx");

  const skeletonComponents = [
    ["ProductDetailSkeleton", skeletons.ProductDetailSkeleton],
    ["CatalogPageSkeleton", skeletons.CatalogPageSkeleton],
    ["CheckoutPageSkeleton", skeletons.CheckoutPageSkeleton],
    ["BookingPageSkeleton", skeletons.BookingPageSkeleton],
    ["OrderResultSkeleton", skeletons.OrderResultSkeleton],
    ["CustomerPortalSkeleton", skeletons.CustomerPortalSkeleton],
    ["AdminErpSkeleton", skeletons.AdminErpSkeleton],
    ["AdminTableSkeleton", skeletons.AdminTableSkeleton],
    ["CartDrawerItemsSkeleton", skeletons.CartDrawerItemsSkeleton],
  ];

  for (const [name, Component] of skeletonComponents) {
    assert.equal(typeof Component, "function", `${name} should be exported`);
    const html = renderToStaticMarkup(React.createElement(Component));
    assert.match(html, /nari-shimmer/, `${name} should render nari-shimmer class`);
    assert.match(html, /aria-busy="true"/, `${name} should render aria-busy="true"`);
  }

  const modalHtml = renderToStaticMarkup(
    React.createElement(skeletons.ModalLoadingOverlay, { label: "Đang mở tài khoản..." }),
  );
  assert.match(modalHtml, /animate-spin/);
  assert.match(modalHtml, /Đang mở tài khoản\.\.\./);
  assert.match(modalHtml, /aria-busy="true"/);
});

test("all 8 route loading.tsx files exist and render Luxury Silk skeleton markup", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");

  const loadingRoutes = [
    "src/app/loading.tsx",
    "src/app/san-pham/[slug]/loading.tsx",
    "src/app/danh-muc/[slug]/loading.tsx",
    "src/app/thanh-toan/loading.tsx",
    "src/app/booking/loading.tsx",
    "src/app/tra-cuu-don-hang/loading.tsx",
    "src/app/khach-hang/[section]/loading.tsx",
    "src/app/quan-tri/loading.tsx",
  ];

  for (const routeFile of loadingRoutes) {
    const absPath = path.resolve(__dirname, "..", routeFile);
    assert.equal(fs.existsSync(absPath), true, `${routeFile} should exist on disk`);
    const mod = load(routeFile);
    assert.equal(typeof mod.default, "function", `${routeFile} should default-export Loading`);
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.match(html, /nari-shimmer/, `${routeFile} should render nari-shimmer`);
    assert.match(html, /aria-busy="true"/, `${routeFile} should render aria-busy="true"`);
  }
});

test("smooth-image helpers update img dataset and [data-img-frame] only when loaded or errored", () => {
  const {
    markImageContainerLoaded,
    syncCachedImageRef,
    handleSmoothImageLoad,
    handleSmoothImageError,
  } = load("src/lib/smooth-image.ts");

  function createMockImage({ complete = false, withFrame = true } = {}) {
    const frameAttrs = new Map();
    const frame = {
      setAttribute(name, value) {
        frameAttrs.set(name, value);
      },
      getAttribute(name) {
        return frameAttrs.get(name) ?? null;
      },
    };
    const img = {
      complete,
      dataset: {},
      closest(selector) {
        return withFrame && selector === "[data-img-frame]" ? frame : null;
      },
    };
    return { img, frame };
  }

  // markImageContainerLoaded marks both img.dataset.loaded and parent [data-img-frame]
  const direct = createMockImage();
  markImageContainerLoaded(direct.img);
  assert.equal(direct.img.dataset.loaded, "true");
  assert.equal(direct.frame.getAttribute("data-img-loaded"), "true");

  // Handles null and missing frame safely
  assert.doesNotThrow(() => markImageContainerLoaded(null));
  const frameless = createMockImage({ withFrame: false });
  markImageContainerLoaded(frameless.img);
  assert.equal(frameless.img.dataset.loaded, "true");

  // handleSmoothImageLoad marks img and frame
  const onLoadCase = createMockImage();
  handleSmoothImageLoad({ currentTarget: onLoadCase.img });
  assert.equal(onLoadCase.img.dataset.loaded, "true");
  assert.equal(onLoadCase.frame.getAttribute("data-img-loaded"), "true");

  // handleSmoothImageError marks img and frame so shimmer stops cleanly
  const onErrorCase = createMockImage();
  handleSmoothImageError({ currentTarget: onErrorCase.img });
  assert.equal(onErrorCase.img.dataset.loaded, "true");
  assert.equal(onErrorCase.frame.getAttribute("data-img-loaded"), "true");

  // syncCachedImageRef marks when complete === true
  const cachedReady = createMockImage({ complete: true });
  syncCachedImageRef(cachedReady.img);
  assert.equal(cachedReady.img.dataset.loaded, "true");
  assert.equal(cachedReady.frame.getAttribute("data-img-loaded"), "true");

  // syncCachedImageRef does NOT mark when complete === false or null
  const pending = createMockImage({ complete: false });
  syncCachedImageRef(pending.img);
  assert.equal(pending.img.dataset.loaded, undefined);
  assert.equal(pending.frame.getAttribute("data-img-loaded"), null);
  assert.doesNotThrow(() => syncCachedImageRef(null));
});

test("code-splitting boundaries use next/dynamic (ssr: false) and layout mounts RouteProgressBar inside Suspense", () => {
  const readProjectFile = (relPath) =>
    fs.readFileSync(path.resolve(__dirname, "..", relPath), "utf8");

  const headerSrc = readProjectFile("src/components/sites/nari/header.tsx");
  assert.match(headerSrc, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
  for (const modName of ["account-dialog", "location-dialog", "storefront-cart-drawer"]) {
    const pattern = new RegExp(
      `dynamic\\(\\s*\\(\\)\\s*=>[\\s\\S]*?${modName}[\\s\\S]*?\\{\\s*(?:[^}]*?\\n)*?[^}]*?ssr:\\s*false`,
    );
    assert.match(headerSrc, pattern, `header.tsx should dynamically import ${modName} with ssr: false`);
  }

  const catalogViewSrc = readProjectFile("src/components/sites/nari/catalog-view.tsx");
  assert.match(catalogViewSrc, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
  assert.match(
    catalogViewSrc,
    /dynamic\([\s\S]*?product-rich-sections[\s\S]*?ssr:\s*false[\s\S]*?loading:\s*\(\)\s*=>[\s\S]*?nari-shimmer[\s\S]*?\)/,
  );

  const adminLoaderSrc = readProjectFile("src/components/sites/nari/admin-erp-loader.tsx");
  assert.match(adminLoaderSrc, /import\s+dynamic\s+from\s+["']next\/dynamic["']/);
  assert.match(
    adminLoaderSrc,
    /dynamic\([\s\S]*?admin-erp-view[\s\S]*?ssr:\s*false[\s\S]*?AdminErpSkeleton[\s\S]*?\)/,
  );

  const layoutSrc = readProjectFile("src/app/layout.tsx");
  assert.match(layoutSrc, /import\s*\{[^}]*\bSuspense\b[^}]*\}\s*from\s+["']react["']/);
  assert.match(layoutSrc, /<Suspense\b[\s\S]*?>[\s\S]*?<RouteProgressBar\s*\/>[\s\S]*?<\/Suspense>/);
});
