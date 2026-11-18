import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as policy from "../src/lib/server/access-policy.ts";
import {
  readAuthSession,
  saveAuthSession,
  clearAuthSession,
  readRegisteredLocalUsers,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "../src/lib/auth.ts";

// Execute actual TS handler bodies with explicit dependency boundaries; any
// unexpected repository import fails the test before a handler can touch data.
function loadModule(file, dependencies = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const module = { exports: {} };
  const forbiddenRepoProxy = new Proxy({}, {
    get(_target, prop) {
      if (prop === "__esModule") return true;
      return () => {
        throw new Error(`Protected handler must not touch repository: ${String(prop)}`);
      };
    },
  });

  const require = (name) => {
    if (name === "@/lib/server/access-policy") return policy;
    if (name === "next/server") return { NextResponse: Response };
    if (name === "@/lib/auth") {
      return {
        extractSessionTokenFromCookieHeader: () => null,
        verifySignedSessionToken: async () => null,
        isStaffOrAdminRole: () => false,
        AUTH_COOKIE_NAME: "nari_session",
      };
    }
    if (name === "@/lib/server/erp-store" || name === "@/lib/db/repository") {
      return forbiddenRepoProxy;
    }
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Unexpected dependency at protected boundary: ${name}`);
  };
  new Function("require", "module", "exports", outputText)(require, module, module.exports);
  return module.exports;
}

const privateRoutes = {
  "admin/users": ["GET", "POST", "PATCH"],
  "admin/staff": ["GET", "POST", "PATCH"],
  "admin/orders": ["GET", "POST", "PATCH"],
  "admin/inventory": ["GET", "POST"],
  "admin/seo": ["GET", "POST"],
  mcp: ["GET", "POST", "OPTIONS"],
  codegraph: ["GET"],
};

test("private APIs fail closed before body parsing or repository access, including forged credentials", async () => {
  for (const [route, methods] of Object.entries(privateRoutes)) {
    const handlers = loadModule(`src/app/api/${route}/route.ts`);
    for (const method of methods) {
      const request = new Request(`http://localhost/api/${route}`, {
        method,
        headers: { Authorization: "Bearer forged-admin", Cookie: "role=admin; session=forged" },
      });
      request.json = () => { throw new Error("Protected handler must not parse the request body"); };
      const response = await handlers[method](request);
      assert.equal(response.status, 401, `${route} ${method}`);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.deepEqual(Object.keys(await response.json()).sort(), ["code", "error", "ok", "success"]);
    }
  }
});

test("private page entry points redirect unauthenticated visitors to login", async () => {
  const mockRedirect = (path) => {
    const err = new Error(`NEXT_REDIRECT:${path}`);
    err.digest = `NEXT_REDIRECT;replace;${path};307;;`;
    throw err;
  };

  const quanTriPage = loadModule("src/app/quan-tri/page.tsx", {
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    "next/navigation": { redirect: mockRedirect },
    "@/components/sites/nari/admin-erp-view": { AdminErpView: () => null },
    "@/lib/auth": {
      AUTH_COOKIE_NAME: "nari_session",
      verifySignedSessionToken: async () => null,
      isStaffOrAdminRole: () => false,
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
  });

  await assert.rejects(
    async () => {
      await quanTriPage.default();
    },
    /NEXT_REDIRECT:\/dang-nhap\?redirect=\/quan-tri/
  );

  const customerPage = loadModule("src/app/khach-hang/[section]/page.tsx", {
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    "next/navigation": { redirect: mockRedirect },
    "@/components/sites/nari/customer-portal-view": { CustomerPortalView: () => null },
    "@/lib/auth": {
      AUTH_COOKIE_NAME: "nari_session",
      verifySignedSessionToken: async () => null,
    },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
  });

  await assert.rejects(
    async () => {
      await customerPage.default({ params: Promise.resolve({ section: "tai-khoan" }) });
    },
    /NEXT_REDIRECT:\/dang-nhap\?redirect=\/khach-hang\/tai-khoan/
  );
});

test("forged or invalid credentials are never accepted as authenticated session", async () => {
  // Tampered token fails HMAC verification
  const invalidToken = "invalid.token.signature";
  const verified = await verifySignedSessionToken(invalidToken);
  assert.equal(verified, null);

  // Client session management functions properly in browser environments
  let stored = null;
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_k, v) => { stored = v; },
    removeItem: () => { stored = null; },
  };
  globalThis.sessionStorage = {
    getItem: () => stored,
    setItem: (_k, v) => { stored = v; },
    removeItem: () => { stored = null; },
  };

  try {
    assert.equal(readAuthSession(), null);
    const validUser = {
      id: "usr-123",
      fullName: "Test User",
      email: "test@narihome.vn",
      phone: "0901234567",
      role: "customer",
      roleLabel: "Khách Hàng",
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(validUser);
    assert.equal(readAuthSession()?.id, "usr-123");
    clearAuthSession();
    assert.equal(readAuthSession(), null);
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
  }
});

test("public catalog GET remains available and UI config never loads operational inventory", async () => {
  const products = loadModule("src/app/api/products/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/server/db": { queryProducts: ({ q }) => ({ items: [{ slug: q }], total: 1 }) },
  });
  const response = await products.GET(new Request("http://localhost/api/products?q=public-product"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.items[0].slug, "public-product");

  const publicCatalog = { updatedAt: "", products: {}, deletedSlugs: ["hidden"], banners: { heroSlides: [], sideBanners: [] } };
  const ui = loadModule("src/app/api/ui-config/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/server/live-catalog-store": { readStorefrontCatalog: () => publicCatalog },
    "@/lib/interactive-ui": {
      getInteractiveUiData: () => ({ source: "snapshot", productDetailPageUi: {} }),
      searchCatalogLive: (query, limit, state) => {
        assert.equal(query, "public-product");
        assert.equal(limit, 6);
        assert.equal(state, publicCatalog);
        return { products: [{ slug: "public-product", price: 123000 }], matchedBrands: [] };
      },
    },
    "@/lib/catalog": {
      findCatalogProduct: (slug, state) => {
        assert.equal(state, publicCatalog);
        return slug === "known" ? { slug } : undefined;
      },
    },
  });
  const publicConfig = await ui.GET(new Request("http://localhost/api/ui-config"));
  assert.equal(publicConfig.status, 200);
  assert.deepEqual((await publicConfig.json()).data, { source: "snapshot", productDetailPageUi: {} });
  const known = await (await ui.GET(new Request("http://localhost/api/ui-config?slug=known"))).json();
  assert.equal(known.branchStock, null);
  assert.equal(known.data.stock, null);
  assert.equal((await ui.GET(new Request("http://localhost/api/ui-config?slug=unknown"))).status, 404);
  assert.equal((await ui.GET(new Request("http://localhost/api/ui-config?slug=hidden"))).status, 404);
  const search = await (await ui.GET(new Request("http://localhost/api/ui-config?q=public-product"))).json();
  assert.deepEqual(search.products, [{ slug: "public-product", price: 123000 }]);
  assert.equal(search.source, "catalog-runtime-overrides-on-snapshot");
});
