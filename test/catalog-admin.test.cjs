/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TypeScript harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, stubs = {}) {
  const filename = path.join(__dirname, '..', file);
  const mod = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = require('node:module').createRequire(filename);
  const requireModule = id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  };
  new Function('module', 'exports', 'require', source)(mod, mod.exports, requireModule);
  return mod.exports;
}

test('catalog authorization trusts verified provisioned admin only', async () => {
  const { catalogAdminStatus } = load('src/lib/server/catalog-admin-access.ts');
  const auth = { getUser: async () => ({ data: { user: { id: 'verified', user_metadata: { role: 'admin' } } }, error: null }) };
  for (const [role, expected] of [['admin', 200], ['customer', 403], ['store_manager', 403], ['warehouse_staff', 403], ['clinic_doctor', 403], ['cs_agent', 403]]) {
    const identities = { findActiveIdentity: async () => ({ userId: 'verified', active: true, fullName: 'Provisioned', role, branchId: 'branch' }) };
    assert.equal(await catalogAdminStatus(auth, identities), expected);
  }
  const never = { findActiveIdentity: () => { throw Error('must not query'); } };
  assert.equal(await catalogAdminStatus({ getUser: async () => ({ data: { user: null }, error: null }) }, never), 401);
  assert.equal(await catalogAdminStatus(auth, { findActiveIdentity: async () => null }), 401);
});

test('product and upload handlers deny before parsing body or invoking storage', async () => {
  for (const status of [401, 403, 503]) {
    const denied = new Response('{}', { status });
    const stubs = {
      '@/lib/server/catalog-admin-access': { authorizeCatalogRequest: async () => ({ response: denied }) },
      '@/lib/server/postgres-database': { getPostgresDatabase: () => { throw Error('database must not be touched'); } },
      '@/lib/server/catalog-storage': { createCatalogStorage: () => { throw Error('storage must not be touched'); } },
    };
    const request = { text: () => { throw Error('must not parse'); }, formData: () => { throw Error('must not parse'); } };
    const products = load('src/app/api/admin/products/route.ts', stubs);
    assert.equal(await products.GET(request), denied);
    assert.equal(await products.POST(request), denied);
    assert.equal(await load('src/app/api/admin/upload/route.ts', stubs).POST(request), denied);
  }
});

test('product API reports stale writes as 409 and keeps raw persistence errors private', async () => {
  let failure = Error('CATALOG_EDIT_CONFLICT');
  let calls = 0;
  const serviceModule = load('src/lib/server/catalog-admin-service.ts');
  const products = load('src/app/api/admin/products/route.ts', {
    '@/lib/server/catalog-admin-access': { authorizeCatalogRequest: async () => ({ response: null, template: {} }) },
    '@/lib/server/postgres-database': { getPostgresDatabase: () => ({}) },
    '@/lib/server/catalog-admin-service': { ...serviceModule, createCatalogAdminService: () => ({ mutate: async () => { calls++; throw failure; } }) },
    '@/lib/server/supabase-session': { sessionResponse: (_template, body, status = 200) => Response.json(body, { status }) },
  });
  const request = body => new Request('https://shop.test/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  let response = await products.POST(request('{}'));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'CATALOG_EDIT_CONFLICT');
  failure = Object.assign(Error('private unique violation'), { code:'23505' });
  assert.equal((await products.POST(request('{"action":"create_brand"}'))).status,409);
  failure = Error('postgres://private-secret@database.invalid');
  response = await products.POST(request('{}'));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private-secret|database.invalid/);
  response = await products.POST(request('{broken'));
  assert.equal(response.status, 400);
  response = await products.POST(request(JSON.stringify({ value: 'x'.repeat(512 * 1024) })));
  assert.equal(response.status, 413);
  assert.equal(calls, 3);
});

test('admin PostgreSQL slice persists fields, images, hide/restore and banners with conflicts and rollback', { skip: !process.env.NARI_TEST_PGLITE_PATH }, async () => {
  const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);
  const pg = new PGlite();
  try {
    await pg.exec(fs.readFileSync(path.join(__dirname, '../db/migrations/202611160001_catalog_inventory.sql'), 'utf8'));
    await pg.exec("INSERT INTO nari_catalog.brands(id,slug,name) VALUES ('b','brand','Brand'); INSERT INTO nari_catalog.categories(id,slug,name) VALUES ('c','category.html','Category');");
    const database = { query: (sql, values) => pg.query(sql, values), transaction: operation => pg.transaction(tx => operation({ query: (sql, values) => tx.query(sql, values) })) };
    const { createCatalogAdminService } = load('src/lib/server/catalog-admin-service.ts');
    const { readPostgresStorefrontCatalog } = load('src/lib/server/postgres-catalog-repository.ts');
    const service = createCatalogAdminService(database);
    assert.deepEqual((await service.read()).products, []);
    const input = { action: 'upsert_product', sku: 'NARI_1', name: 'Sản phẩm', brandId: 'b', categoryId: 'c', price: 100, old: 200, image: '/main.png', images: Array.from({ length: 29 }, (_, i) => `/image-${i}.png`), englishName: 'Managed English name', description: 'Managed description', overviewHtml: '<p>Overview</p>', ingredientsHtml: 'Ingredients', usageHtml: 'Usage', specs: [{ label: 'Size', value: '100ml' }] };
    const created = (await service.mutate(input)).product;
    assert.equal(created.images.length, 30);
    assert.equal(created.image, '/main.png');
    for (const field of ['englishName', 'description', 'overviewHtml', 'ingredientsHtml', 'usageHtml', 'specs']) assert.deepEqual(created[field], input[field]);
    let publicState = await readPostgresStorefrontCatalog(database);
    const details = load('src/lib/product-details.ts');
    const detail = details.getRichProductDetail(created.slug, publicState);
    assert.equal(detail.englishName, input.englishName);
    assert.equal(detail.images.length, 30);
    assert.equal(detail.ratingSummary, undefined);
    assert.equal(detail.overviewHtml, '&lt;p&gt;Overview&lt;/p&gt;');
    assert.deepEqual(detail.specs, input.specs);
    await assert.rejects(() => service.mutate({ ...input, sku: 'OTHER', id: created.id, slug: created.slug, expectedUpdatedAt: created.updatedAt }), /IMMUTABLE_PRODUCT_IDENTITY/);
    await assert.rejects(() => service.mutate({ ...input, id: created.id, slug: created.slug, expectedUpdatedAt: '2000-01-01T00:00:00Z' }), /CATALOG_EDIT_CONFLICT/);
    for (const patch of [{ price: -1 }, { old: 1 }, { brandId: 'unknown' }, { rating: 5 }, { image: '/\t/evil.test/a' }]) await assert.rejects(() => service.mutate({ ...input, ...patch }));
    const changed = (await service.mutate({ ...input, id: created.id, slug: created.slug, name: 'Updated', images: ['/replacement.png'], expectedUpdatedAt: created.updatedAt })).product;
    assert.equal(changed.name, 'Updated');
    assert.deepEqual(changed.images, ['/main.png', '/replacement.png']);
    await service.mutate({ action: 'delete_product', id: changed.id, expectedUpdatedAt: changed.updatedAt });
    publicState = await readPostgresStorefrontCatalog(database);
    assert.equal(publicState.products[changed.slug], undefined);
    assert.equal(details.getRichProductDetail(changed.slug, publicState), null);
    const hidden = (await service.read()).products[0];
    assert.equal(hidden.isDeleted, true);
    await assert.rejects(() => service.mutate({ action: 'restore_product', id: hidden.id, expectedUpdatedAt: changed.updatedAt }), /CATALOG_EDIT_CONFLICT/);
    await service.mutate({ action: 'restore_product', id: hidden.id, expectedUpdatedAt: hidden.updatedAt });
    const restored = (await service.read()).products[0];
    assert.equal(restored.isDeleted, false);
    const failing = { ...database, transaction: operation => database.transaction(tx => operation({ query: (sql, values) => {
      if (sql.includes('INSERT INTO nari_catalog.product_images') && values[3] === 1) throw Error('media failed');
      return tx.query(sql, values);
    } })) };
    await assert.rejects(() => createCatalogAdminService(failing).mutate({ ...input, id: restored.id, slug: restored.slug, name: 'Must rollback', expectedUpdatedAt: restored.updatedAt }), /media failed/);
    assert.equal((await service.read()).products[0].name, 'Updated');
    const banners = { heroSlides: [{ id: 'hero', src: '/hero.png', href: '/', alt: 'Hero' }], sideBanners: [{ id: 'side', src: '/side.png', href: '/tim-kiem', alt: 'Side' }] };
    await service.mutate({ action: 'update_banners', ...banners });
    assert.deepEqual((await readPostgresStorefrontCatalog(database)).banners, banners);
    await assert.rejects(() => service.mutate({ action: 'update_banners', ...banners, heroSlides: [{ ...banners.heroSlides[0], href: '/\n/evil.test' }] }), /CATALOG_URL_INVALID/);
    assert.deepEqual((await readPostgresStorefrontCatalog(database)).banners, banners);
    await service.mutate({ action: 'update_banners', heroSlides: [], sideBanners: [] });
    assert.deepEqual((await readPostgresStorefrontCatalog(database)).banners, { heroSlides: [], sideBanners: [] });
  } finally { await pg.close(); }
});
