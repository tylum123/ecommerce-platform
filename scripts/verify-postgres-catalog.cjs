/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS test harness */
// Isolated integration check: node scripts/verify-postgres-catalog.cjs <absolute PGlite module path>
// PGlite is a development test runtime, not an application database dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

async function main() {
  const modulePath = process.argv[2];
  if (!modulePath || !path.isAbsolute(modulePath)) throw new Error('Supply an absolute PGlite module path');
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync(path.join(__dirname, '../db/migrations/202611160001_catalog_inventory.sql'), 'utf8'));
    const emptySource = fs.readFileSync(path.join(__dirname, '../src/lib/server/postgres-catalog-repository.ts'), 'utf8');
    const emptyModule = { exports: {} };
    new Function('module', 'exports', ts.transpileModule(emptySource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(emptyModule, emptyModule.exports);
    const empty = await emptyModule.exports.readPostgresCatalog({ query: (sql, values) => db.query(sql, values) });
    assert.equal(empty.source, 'postgres');
    assert.deepEqual(empty.products, {});
    await db.exec(`
      INSERT INTO nari_catalog.brands (id,slug,name) VALUES ('b','brand','Brand');
      INSERT INTO nari_catalog.categories (id,slug,name) VALUES ('c','category.html','Category');
      INSERT INTO nari_catalog.products (id,sku,slug,name,brand_id,category_id,price,market_price)
      VALUES ('p','SKU','product.html','Product','b','c',0,100000),('h','HIDDEN','hidden.html','Private','b','c',1,1);
      UPDATE nari_catalog.products SET hidden_at=now() WHERE id='h';
      INSERT INTO nari_catalog.product_images (id,product_id,url,sort_order) VALUES ('i2','p','/second.png',1),('i1','p','/first.png',0);
      INSERT INTO nari_catalog.product_specs VALUES ('p',0,'Size','100ml');
      INSERT INTO nari_catalog.home_banners (id,placement,sort_order,image_url,target_url)
      VALUES ('b2','hero',1,'/second.png','/'),('b1','hero',0,'/first.png','/');
    `);
    const source = fs.readFileSync(path.join(__dirname, '../src/lib/server/postgres-catalog-repository.ts'), 'utf8');
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    const mod = { exports: {} };
    new Function('module', 'exports', outputText)(mod, mod.exports);
    const result = await mod.exports.readPostgresStorefrontCatalog({ query: (sql, values) => db.query(sql, values) });
    assert.equal(result.products['product.html'].price, 0);
    assert.equal(result.products['product.html'].sale, 100);
    assert.equal(result.products['product.html'].image, '/first.png');
    assert.deepEqual(result.products['product.html'].images, ['/first.png','/second.png']);
    assert.deepEqual(result.products['product.html'].specs, [{ label: 'Size', value: '100ml' }]);
    assert.equal(result.products['product.html'].rating, undefined);
    assert.equal(result.products['hidden.html'], undefined);
    assert.deepEqual(result.deletedSlugs, ['hidden.html']);
    assert.deepEqual(result.banners.heroSlides.map(b => b.id), ['b1','b2']);
    const connection = { query: (sql, values) => db.query(sql, values) };
    await assert.rejects(() => db.query("INSERT INTO nari_catalog.products(id,sku,slug,name,brand_id,category_id,price,market_price) VALUES ('duplicate','SKU','duplicate.html','Duplicate','b','c',1,1)"), /unique/i);
    await db.query("INSERT INTO nari_catalog.branches(id,code,name,address,city,district,phone) VALUES ('branch','BR','Branch','','','','')");
    await assert.rejects(() => db.query("INSERT INTO nari_catalog.inventory_balances(branch_id,product_id,total_stock,reserved_stock) VALUES ('branch','p',-1,0)"), /check constraint/i);
    await assert.rejects(() => db.query("INSERT INTO nari_catalog.inventory_balances(branch_id,product_id,total_stock,reserved_stock) VALUES ('branch','p',1,2)"), /check constraint/i);
    const database = { ...connection, transaction: operation => db.transaction(tx => operation({ query:(sql, values) => tx.query(sql, values) })) };
    const created = { id:'new',sku:'NEW',slug:'new.html',name:'New',brand:'Brand',category:'category.html',price:123,old:200,sale:39,image:'/new.png',updatedAt:'' };
    await mod.exports.upsertPostgresProduct(database, created, {brandId:'b',categoryId:'c'});
    let current = await mod.exports.readPostgresCatalog(connection);
    assert.equal(current.products['new.html'].price,123);
    const version = current.products['new.html'].updatedAt;
    await assert.rejects(() => mod.exports.upsertPostgresProduct(database, {...created,name:'lost'}, {brandId:'b',categoryId:'c',expectedUpdatedAt:'2000-01-01T00:00:00Z'}), /CATALOG_EDIT_CONFLICT/);
    const failSecondImage = { ...database, transaction: operation => database.transaction(tx => operation({ query:(sql, values) => {
      if (sql.includes('INSERT INTO nari_catalog.product_images') && values[3] === 1) throw Error('media write failed');
      return tx.query(sql, values);
    } })) };
    await assert.rejects(() => mod.exports.upsertPostgresProduct(failSecondImage, {...created,name:'should rollback',images:['/second.png']}, {brandId:'b',categoryId:'c',expectedUpdatedAt:version}), /media write failed/);
    current = await mod.exports.readPostgresCatalog(connection);
    assert.equal(current.products['new.html'].name,'New');
    assert.deepEqual(current.products['new.html'].images,['/new.png']);
    await mod.exports.setPostgresProductHidden(connection,'new',true,current.products['new.html'].updatedAt);
    assert.equal((await mod.exports.readPostgresCatalog(connection)).products['new.html'],undefined);
    const hiddenVersion = (await db.query("SELECT updated_at::text FROM nari_catalog.products WHERE id='new'")).rows[0].updated_at;
    await mod.exports.setPostgresProductHidden(connection,'new',false,hiddenVersion);
    assert.equal((await mod.exports.readPostgresCatalog(connection)).products['new.html'].name,'New');
    await mod.exports.replacePostgresBanners(database,{heroSlides:[{id:'replacement',src:'/new.png',href:'/',alt:'New'}],sideBanners:[]});
    assert.deepEqual((await mod.exports.readPostgresCatalog(connection)).banners.heroSlides.map(b => b.id),['replacement']);
    await assert.rejects(() => mod.exports.upsertPostgresProduct(database,{...created,price:201},{brandId:'b',categoryId:'c'}),/CATALOG_PRODUCT_INVALID/);
    await assert.rejects(() => mod.exports.readPostgresCatalog({ query: async () => { throw new Error('storage offline'); } }), /storage offline/);
    const row = { kind: 'product', data: { id:'x', sku:'X', slug:'x.html', name:'x', brand:'b', category:'c', price:'9007199254740992', market_price:'9007199254740992', hidden_at:null, updated_at:new Date(), images:[], specs:[] } };
    await assert.rejects(() => mod.exports.readPostgresCatalog({ query: async () => ({ rows:[row] }) }), /CATALOG_INTEGER_INVALID/);
    console.log('PASS PostgreSQL catalog read/upsert/hide/restore/banner, optimistic conflict, rollback, precision and storage failure');
  } finally { await db.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
