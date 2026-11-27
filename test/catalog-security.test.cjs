/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TS harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const mod = { exports: {} };
  const localRequire = require('node:module').createRequire(filename);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const requireModule = id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, requireModule);
  return mod.exports;
}

function streamedRequest(size, headers = {}) {
  let cancelled = false;
  let sent = false;
  const body = new ReadableStream({ pull(controller) { if (!sent) { sent = true; controller.enqueue(new Uint8Array(size)); } else controller.close(); }, cancel() { cancelled = true; } });
  const request = new Request('https://shop.test/api', { method: 'POST', headers, body, duplex: 'half' });
  return { request, cancelled: () => cancelled };
}

test('stream reader caps actual bytes without Content-Length and cancels excess input', async () => {
  const { readBoundedRequestBody } = load('src/lib/server/bounded-request-body.ts');
  for (const headers of [{}, { 'Content-Length': '1' }]) {
    const input = streamedRequest(11, headers);
    await assert.rejects(() => readBoundedRequestBody(input.request, 10), /REQUEST_BODY_TOO_LARGE/);
    assert.equal(input.cancelled(), true);
  }
  const accepted = await readBoundedRequestBody(streamedRequest(10).request, 10);
  assert.equal(accepted.byteLength, 10);
  const never = { headers: new Headers({ 'Content-Length': '11' }), get body() { throw Error('must not read'); } };
  await assert.rejects(() => readBoundedRequestBody(never, 10), /REQUEST_BODY_TOO_LARGE/);
});

test('JSON and multipart routes return 413 for oversized streams without declared length', async () => {
  const stubs = {
    '@/lib/server/catalog-admin-access': { authorizeCatalogRequest: async () => ({ response: null, template: {} }) },
    '@/lib/server/postgres-database': { getPostgresDatabase: () => ({}) },
    '@/lib/server/catalog-admin-service': { createCatalogAdminService: () => ({ mutate: () => { throw Error('must not mutate'); } }) },
    '@/lib/server/catalog-storage': { createCatalogStorage: () => ({ upload: () => { throw Error('must not upload'); } }) },
    '@/lib/server/supabase-session': { sessionResponse: (_template, body, status = 200) => Response.json(body, { status }) },
  };
  // Share the error constructor across the route and bounded reader in this isolated harness.
  stubs['@/lib/server/bounded-request-body'] = load('src/lib/server/bounded-request-body.ts');
  const products = load('src/app/api/admin/products/route.ts', stubs);
  assert.equal((await products.POST(streamedRequest(512 * 1024 + 1, { 'Content-Type': 'application/json' }).request)).status, 413);
  const previous = [process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL];
  try {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.test';
    const upload = load('src/app/api/admin/upload/route.ts', stubs);
    assert.equal((await upload.POST(streamedRequest(5 * 1024 * 1024 + 65537, { 'Content-Type': 'multipart/form-data; boundary=test' }).request)).status, 413);
  } finally {
    for (const [index, name] of ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'].entries()) {
      if (previous[index] === undefined) delete process.env[name]; else process.env[name] = previous[index];
    }
  }
});

test('authoritative catalog cards display managed English and suppress unsupported gift promotions', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { ProductCard } = load('src/components/sites/nari/product-card.tsx', {
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/image': { __esModule: true, default: () => null },
  });
  const product = { id:'merchant', sku:'MERCHANT', slug:'merchant.html', name:'Bioderma Merchant', brand:'Bioderma', category:'category.html', price:0, old:0, sale:0, image:'/actual.png', englishName:'Merchant authored English', updatedAt:'' };
  const state = { source:'postgres', products:{ [product.slug]:product }, deletedSlugs:[], banners:{ heroSlides:[], sideBanners:[] }, updatedAt:'' };
  const { getAllCatalogProducts } = load('src/lib/catalog.ts');
  const card = getAllCatalogProducts(state)[0];
  assert.equal(card.catalogSource, 'postgres');
  const render = p => renderToStaticMarkup(React.createElement(ProductCard, { product:p }));
  const html = render(card);
  assert.match(html, /Merchant authored English/);
  assert.doesNotMatch(html, /Bill|Tặng|Official Authentic Skincare Formula/);
  const empty = render({ ...card, englishName:'' });
  assert.doesNotMatch(empty, /Merchant authored English|Official Authentic Skincare Formula|Bill|Tặng/);
  const legacy = render({ ...card, catalogSource:undefined });
  assert.doesNotMatch(legacy, /Bill Bioderma|Tặng/);
});

test('PostgreSQL home omits synthetic category sales and clinic sections', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { HomeView } = load('src/components/sites/nari/home-view.tsx', {
    'next/link': { __esModule:true, default:({ children,...props }) => React.createElement('a',props,children) },
    'next/image': { __esModule:true, default:() => null },
    '@/components/sites/nari/header':{ Header:() => null },
    '@/components/sites/nari/footer':{ Footer:() => null },
    '@/components/sites/nari/product-card':{ ProductCard:() => null },
  });
  const state = { source:'postgres', products:{}, deletedSlugs:[], banners:{ heroSlides:[],sideBanners:[] },updatedAt:'' };
  const html = renderToStaticMarkup(React.createElement(HomeView,{ liveCatalog:state }));
  assert.doesNotMatch(html,/8[.]4M đã bán|★ 5[.]0|href="\/booking"|href="\/dich-vu\/|href="\/clinic"|Nari Clinic/);
  const legacy = renderToStaticMarkup(React.createElement(HomeView,{ liveCatalog:{ ...state,source:undefined } }));
  assert.match(legacy,/8[.]4M đã bán/);
  assert.doesNotMatch(legacy,/href="\/booking"|href="\/dich-vu\/|href="\/clinic"|Nari Clinic/);
});

test('public publication filter excludes demo/unverified references; nonowner runtime gets catalog only', { skip: !process.env.NARI_TEST_PGLITE_PATH }, async () => {
  const { PGlite } = require(process.env.NARI_TEST_PGLITE_PATH);
  const pg = new PGlite();
  const sqlFile = name => fs.readFileSync(path.join(__dirname, '../db/migrations', name), 'utf8');
  try {
    await pg.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);");
    await pg.exec(sqlFile('202611160001_catalog_inventory.sql'));
    await pg.exec(sqlFile('202611170001_identity.sql'));
    await pg.exec(`INSERT INTO nari_catalog.sources(id,verification_state,scope) VALUES
      ('merchant','merchant','test'),('observed','observed','test'),('unverified','unverified','test'),('demo','demo','test');
      INSERT INTO nari_catalog.brands(id,slug,name,is_demo,source_id) VALUES ('b','brand','Brand',false,'merchant'),('bd','brand-demo','Demo',true,null),('bu','brand-unverified','Unknown',false,'unverified');
      INSERT INTO nari_catalog.categories(id,slug,name,is_demo,source_id) VALUES ('c','category.html','Category',false,'merchant'),('cd','category-demo.html','Demo',true,null),('cu','category-unknown.html','Unknown',false,'unverified');
      INSERT INTO nari_catalog.products(id,sku,slug,name,brand_id,category_id,price,market_price,is_demo,source_id) VALUES
      ('p','P','merchant.html','Merchant','b','c',0,0,false,'merchant'),('native','N','native.html','Authored','b','c',1,1,false,null),
      ('demo','D','demo.html','Demo','b','c',1,1,true,null),('observed','O','observed.html','Observed','b','c',1,1,false,'observed'),
      ('unverified','U','unverified.html','Unverified','b','c',1,1,false,'unverified'),('source-demo','SD','source-demo.html','Demo source','b','c',1,1,false,'demo'),
      ('brand-demo','BD','brand-demo.html','Demo brand','bd','c',1,1,false,null),('category-demo','CD','category-demo.html','Demo category','b','cd',1,1,false,null),
      ('brand-unverified','BU','brand-unverified.html','Unverified brand','bu','c',1,1,false,null),('category-unverified','CU','category-unverified.html','Unverified category','b','cu',1,1,false,null);
      INSERT INTO nari_catalog.home_banners(id,placement,sort_order,image_url,target_url,source_id) VALUES
      ('merchant','hero',0,'/merchant.png','/','merchant'),('demo','hero',1,'/demo.png','/','demo'),('unverified','hero',2,'/unknown.png','/','unverified');
      INSERT INTO auth.users(id) VALUES ('11111111-1111-4111-8111-111111111111');
      INSERT INTO nari_identity.provisioned_identities(user_id,role,active,full_name) VALUES ('11111111-1111-4111-8111-111111111111','admin',true,'Admin');
      CREATE TABLE nari_catalog.orders(id text);`);
    await pg.exec("INSERT INTO nari_catalog.product_images(id,product_id,url,sort_order,source_id) VALUES ('real','p','/real.png',0,'merchant'),('demo-image','p','/demo.png',1,'demo');");
    await pg.exec(sqlFile('202611170002_catalog_runtime.sql'));
    const flags = (await pg.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname='nari_catalog_runtime'")).rows[0];
    assert.deepEqual(Object.values(flags), [false, false, false, false, false]);
    await pg.exec('SET ROLE nari_catalog_runtime');
    const database = { query: (sql, values) => pg.query(sql, values), transaction: operation => pg.transaction(tx => operation({ query: (sql, values) => tx.query(sql, values) })) };
    const repository = load('src/lib/server/postgres-catalog-repository.ts');
    const publicState = await repository.readPostgresStorefrontCatalog(database);
    assert.deepEqual(Object.keys(publicState.products).sort(), ['merchant.html', 'native.html']);
    assert.deepEqual(publicState.products['merchant.html'].images, ['/real.png']);
    assert.deepEqual(publicState.references.brands.map(row => row.id), ['b']);
    assert.deepEqual(publicState.references.categories.map(row => row.id), ['c']);
    assert.deepEqual(publicState.banners.heroSlides.map(b => b.id), ['merchant']);
    const service = load('src/lib/server/catalog-admin-service.ts').createCatalogAdminService(database);
    assert.equal((await service.read()).products.length, 10);
    assert.equal((await database.query('SELECT * FROM nari_identity.provisioned_identities')).rows.length, 1);
    const created = (await service.mutate({ action:'upsert_product', sku:'NEW', name:'New', brandId:'b', categoryId:'c', price:1, old:1, image:'/new.png', images:[], specs:[] })).product;
    assert.ok(created.id);
    const changed = (await service.mutate({ ...created, action:'upsert_product', expectedUpdatedAt:created.updatedAt, name:'Updated' })).product;
    assert.equal(changed.name, 'Updated');
    await service.mutate({ action:'delete_product', id:changed.id, expectedUpdatedAt:changed.updatedAt });
    await service.mutate({ action:'update_banners', heroSlides:[], sideBanners:[] });
    for (const sql of [
      'SELECT * FROM nari_catalog.inventory_balances', 'SELECT * FROM nari_catalog.inventory_movements', 'SELECT * FROM nari_catalog.branches', 'SELECT * FROM nari_catalog.orders',
      "UPDATE nari_identity.provisioned_identities SET role='admin'", "DELETE FROM nari_catalog.products", "INSERT INTO nari_catalog.sources(id,verification_state,scope) VALUES ('bad','merchant','bad')",
      'CREATE TABLE nari_catalog.escalation(id text)',
    ]) await assert.rejects(() => database.query(sql), /permission denied/i);
    await pg.exec('RESET ROLE');
    await pg.exec(sqlFile('202611170003_catalog_reference_authoring.sql'));
    await pg.exec('SET ROLE nari_catalog_runtime');
    const brand = (await service.mutate({ action:'create_brand',label:'Merchant Brand',slug:'merchant-brand' })).reference;
    const parent = (await service.mutate({ action:'create_category',label:'Merchant Category',slug:'merchant-category.html' })).reference;
    const child = (await service.mutate({ action:'create_category',label:'Child Category',slug:'merchant-child.html',parentId:parent.id })).reference;
    assert.equal(child.parentId,parent.id);
    assert.ok((await service.read()).brands.some(row => row.id === brand.id));
    const runtimeReferences = (await repository.readPostgresStorefrontCatalog(database)).references;
    assert.ok(runtimeReferences.brands.some(row => row.id === brand.id));
    assert.equal(runtimeReferences.categories.find(row => row.id === child.id).parentId,parent.id);
    await assert.rejects(() => service.mutate({ action:'create_brand',label:'Collision',slug:brand.slug }),error => error.code === '23505');
    await assert.rejects(() => service.mutate({ action:'create_category',label:'Unknown parent',slug:'orphan.html',parentId:'unknown' }),error => error.code === '23503');
    for (const body of [
      { action:'create_brand',label:'',slug:'blank' }, { action:'create_brand',label:'Bad',slug:'../bad' },
      { action:'create_brand',label:'Bad',slug:'bad',is_demo:true }, { action:'create_category',label:'Bad',slug:'bad',source_id:'merchant' },
    ]) await assert.rejects(() => service.mutate(body),/INVALID_/);
    for (const sql of ["UPDATE nari_catalog.brands SET name=name WHERE false","DELETE FROM nari_catalog.categories WHERE false"]) await assert.rejects(() => database.query(sql),/permission denied/i);
    for (const sql of ["INSERT INTO nari_catalog.brands(id,slug,name,is_demo) VALUES ('illegal-demo','illegal-demo','Demo',true)","INSERT INTO nari_catalog.categories(id,slug,name,source_id) VALUES ('illegal-source','illegal-source','Source','merchant')"]) await assert.rejects(() => database.query(sql),/row-level security/i);
    await pg.exec('RESET ROLE');
    await assert.rejects(() => pg.exec(sqlFile('202611170002_catalog_runtime.sql')), /already exists/);
  } finally { await pg.close(); }
});
