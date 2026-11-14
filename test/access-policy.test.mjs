import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as policy from "../src/lib/server/access-policy.ts";
import { readAuthSession, saveAuthSession, readRegisteredLocalUsers } from "../src/lib/auth.ts";

// Execute actual TS handler bodies with explicit dependency boundaries; any
// unexpected repository import fails the test before a handler can touch data.
function loadModule(file, dependencies = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const require = (name) => {
    if (name === "@/lib/server/access-policy") return policy;
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

test("auth and transient business writes are unavailable rather than fabricating success", async () => {
  const auth = loadModule("src/app/api/auth/route.ts");
  for (const method of ["GET", "POST"]) {
    const response = await auth[method]();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "SERVICE_UNAVAILABLE");
  }
  for (const route of ["orders", "bookings", "warranty"]) {
    const handlers = loadModule(`src/app/api/${route}/route.ts`);
    assert.equal((await handlers.GET()).status, 401);
    const response = await handlers.POST();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
  const reviews = loadModule("src/app/api/products/[slug]/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/product-details": {},
    "@/lib/catalog": {},
    "@/lib/server/db": {},
  });
  assert.equal((await reviews.POST()).status, 503);
});

test("private page entry points redirect without importing or rendering private portals", () => {
  for (const file of ["src/app/quan-tri/page.tsx", "src/app/khach-hang/[section]/page.tsx"]) {
    const page = loadModule(file, {
      "next/navigation": { redirect: (path) => { throw new Error(`redirect:${path}`); } },
    });
    assert.throws(() => page.default(), /redirect:\/dang-nhap\?reason=unavailable/);
  }
});

test("forged legacy local storage never becomes a session or registered identity", () => {
  let stored = JSON.stringify({ role: "admin", fullName: "Forged admin" });
  globalThis.window = { dispatchEvent() {} };
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: () => { throw new Error("Must not persist client identity"); },
    removeItem: () => { stored = null; },
  };
  try {
    assert.equal(readAuthSession(), null);
    assert.deepEqual(readRegisteredLocalUsers(), []);
    saveAuthSession({ role: "admin", fullName: "Forged admin" });
    assert.equal(readAuthSession(), null);
    assert.equal(stored, null);
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
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

  const ui = loadModule("src/app/api/ui-config/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/interactive-ui": {
      getInteractiveUiData: () => ({ source: "snapshot", productDetailPageUi: {} }),
      searchCatalogLive: () => ({ products: [], matchedBrands: [] }),
    },
    "@/lib/catalog": { findCatalogProduct: (slug) => slug === "known" ? { slug } : undefined },
  });
  const publicConfig = await ui.GET(new Request("http://localhost/api/ui-config"));
  assert.equal(publicConfig.status, 200);
  assert.deepEqual((await publicConfig.json()).data, { source: "snapshot", productDetailPageUi: {} });
  const known = await (await ui.GET(new Request("http://localhost/api/ui-config?slug=known"))).json();
  assert.equal(known.branchStock, null);
  assert.equal(known.data.stock, null);
  assert.equal((await ui.GET(new Request("http://localhost/api/ui-config?slug=unknown"))).status, 404);
});
