/* eslint-disable @typescript-eslint/no-require-imports -- dependency-free isolated TS harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const ts = require('typescript');

function load(file, stubs = {}) {
  const filename = path.join(__dirname, '..', file);
  const source = fs.readFileSync(filename, 'utf8');
  const localRequire = require('node:module').createRequire(filename);
  const mod = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const requireModule = id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id === '@opennextjs/cloudflare') return { getCloudflareContext() { throw new Error('NO_CLOUDFLARE_CONTEXT'); } };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, requireModule);
  return mod.exports;
}

test('PostgreSQL configuration rejects TLS downgrade, URL overrides and invalid bounds', () => {
  const { postgresPoolConfig } = load('src/lib/server/postgres-database.ts');
  const env = { NARI_POSTGRES_URL: 'postgresql://user:pass@db.example/catalog' };
  assert.equal(postgresPoolConfig(env).ssl.rejectUnauthorized, true);
  assert.equal(postgresPoolConfig(env).max, 5);
  for (const patch of [
    { NARI_POSTGRES_URL: '' }, { NARI_POSTGRES_URL: `${env.NARI_POSTGRES_URL}?sslmode=disable` },
    { NARI_POSTGRES_SSL_MODE: 'disable' }, { NARI_POSTGRES_SSL_MODE: 'false' },
    { NARI_POSTGRES_POOL_MAX: '0' }, { NARI_POSTGRES_POOL_MAX: '21' }, { NARI_POSTGRES_POOL_MAX: '1.5' },
  ]) assert.throws(() => postgresPoolConfig({ ...env, ...patch }), /POSTGRES_/);
  const local = { NARI_POSTGRES_URL: 'postgresql://user:pass@localhost/catalog', NARI_POSTGRES_SSL_MODE: 'disable' };
  assert.equal(postgresPoolConfig(local).ssl, false);
  assert.throws(() => postgresPoolConfig({ ...local, NODE_ENV: 'production' }), /SSL_MODE/);
});

test('pool transactions pin a client, rollback, discard broken clients and close once', async () => {
  const calls = [];
  let failRollback = false;
  let failCommit = false;
  let released;
  class FakePool extends EventEmitter {
    constructor() { super(); FakePool.last = this; }
    async query(sql) { calls.push(`pool:${sql}`); return { rows: [] }; }
    async connect() { return {
      async query(sql) { calls.push(sql); if ((sql === 'ROLLBACK' && failRollback) || (sql === 'COMMIT' && failCommit)) throw Error('disconnected'); return { rows: [] }; },
      release(discard) { released = discard; calls.push('release'); },
    }; }
    async end() { calls.push('end'); }
  }
  const { createPostgresDatabase } = load('src/lib/server/postgres-database.ts', { pg: { Pool: FakePool } });
  const db = createPostgresDatabase({});
  let escaped;
  assert.equal(await db.transaction(async connection => { escaped = connection; await connection.query('UPDATE'); return 7; }), 7);
  assert.deepEqual(calls, ['BEGIN', 'UPDATE', 'COMMIT', 'release']);
  await assert.rejects(() => escaped.query('late'), /TRANSACTION_FINISHED/);
  calls.length = 0;
  await assert.rejects(() => db.transaction(async () => { throw Error('business conflict'); }), /business conflict/);
  assert.deepEqual(calls, ['BEGIN', 'ROLLBACK', 'release']);
  assert.equal(released, false);
  failRollback = true;
  await assert.rejects(() => db.transaction(async () => { throw Error('original failure'); }), /original failure/);
  assert.equal(released, true);
  failRollback = false; failCommit = true;
  await assert.rejects(() => db.transaction(async () => 1), /disconnected/);
  FakePool.last.emit('error', Error('idle disconnect with secret'));
  assert.equal(db.status().idleConnectionErrors, 1);
  await Promise.all([db.close(), db.close()]);
  assert.equal(calls.filter(x => x === 'end').length, 1);
  await assert.rejects(() => db.query('SELECT'), /DATABASE_CLOSED/);
});

test('runtime PG failure rejects unavailable database and invalid catalog backends', async () => {
  const previousBackend = process.env.NARI_CATALOG_BACKEND;
  const previousNodeEnv = process.env.NODE_ENV;
  const store = load('src/lib/server/live-catalog-store.ts', {
    '@/lib/server/postgres-database': { getPostgresDatabase() { throw Error('secret connection details'); } },
  });
  try {
    process.env.NARI_CATALOG_BACKEND = 'postgres';
    assert.equal(store.catalogBackend(), 'postgres');
    await assert.rejects(() => store.readStorefrontCatalog(), /^Error: CATALOG_POSTGRES_UNAVAILABLE$/);
    delete process.env.NARI_CATALOG_BACKEND;
    process.env.NODE_ENV = 'test';
    assert.equal(store.catalogBackend(), 'postgres');
    process.env.NARI_CATALOG_BACKEND = 'sqlite';
    assert.throws(() => store.catalogBackend(), /^Error: CATALOG_BACKEND_REQUIRED$/);
    await assert.rejects(() => store.readStorefrontCatalog(), /^Error: CATALOG_BACKEND_REQUIRED$/);
    process.env.NARI_CATALOG_BACKEND = 'false';
    assert.throws(() => store.catalogBackend(), /^Error: CATALOG_BACKEND_REQUIRED$/);
    delete process.env.NARI_CATALOG_BACKEND;
    process.env.NODE_ENV = 'production';
    assert.throws(() => store.catalogBackend(), /^Error: CATALOG_BACKEND_REQUIRED$/);
  } finally {
    if (previousBackend === undefined) delete process.env.NARI_CATALOG_BACKEND; else process.env.NARI_CATALOG_BACKEND = previousBackend;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('durable Storage validates bytes, MIME and origin; never overwrites or returns fake success', async () => {
  let uploadArgs;
  let uploadError = null;
  const client = { storage: { from(bucket) { assert.equal(bucket, 'catalog-media'); return { async upload(...args) { uploadArgs = args; return { data: { path: args[0] }, error: uploadError }; } }; } } };
  const { createCatalogStorage } = load('src/lib/server/catalog-storage.ts');
  const config = { supabaseUrl: 'https://project.supabase.co', publicOrigin: 'https://project.supabase.co', serviceRoleKey: 'private-test-key', bucket: 'catalog-media' };
  assert.throws(() => createCatalogStorage({ ...config, publicOrigin: 'https://untrusted.example' }, client), /CONFIG_INVALID/);
  const storage = createCatalogStorage(config, client);
  const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
  const saved = await storage.upload(png, 'image/png');
  assert.match(saved.path, /^catalog\/[a-f0-9-]+\.png$/);
  assert.equal(saved.url, `${config.publicOrigin}/storage/v1/object/public/${config.bucket}/${saved.path}`);
  assert.equal(uploadArgs[2].upsert, false);
  await assert.rejects(() => storage.upload(png, 'image/jpeg'), /TYPE_INVALID/);
  await assert.rejects(() => storage.upload(new TextEncoder().encode('<svg onload="bad()"/>'), 'image/svg+xml'), /TYPE_INVALID/);
  await assert.rejects(() => storage.upload(new Uint8Array(6 * 1024 * 1024 + 1), 'image/png'), /SIZE_INVALID/);
  uploadError = Error('private provider details');
  await assert.rejects(() => storage.upload(png, 'image/png'), /^Error: CATALOG_STORAGE_UPLOAD_FAILED$/);
});

test('authoritative PG projection stays empty and escaped editorial fields cannot create HTML elements', () => {
  const empty = { source: 'postgres', products: {}, deletedSlugs: [], updatedAt: '', banners: { heroSlides: [], sideBanners: [] } };
  const catalog = load('src/lib/catalog.ts');
  const details = load('src/lib/product-details.ts');
  const listings = load('src/lib/deals-bestsellers.ts');
  const arrivals = load('src/lib/new-arrivals.ts');
  assert.deepEqual(catalog.getAllCatalogProducts(empty), []);
  assert.deepEqual(catalog.getFeaturedProducts(empty), []);
  assert.deepEqual(catalog.categoryProducts('cham-soc-da-mat-c4.html', empty), []);
  assert.equal(details.getRichProductDetail('authoritative-product.html', empty), null);
  assert.deepEqual(listings.getDealsSnapshot(empty), []);
  assert.deepEqual(listings.getBestsellersSnapshot(empty), []);
  assert.deepEqual(arrivals.getNewArrivals(empty), []);
  const slug = 'authoritative-product.html';
  const malicious = '<script>globalThis.compromised=1</script><img src=x onerror="bad()"><a href="javascript:bad()">bad</a>';
  const product = { id: 'p', sku: 'P', slug, name: 'Live', brand: 'Brand', category: 'category.html', price: 0, old: 1, sale: 100, image: '/live.png', images: ['/live.png'], overviewHtml: malicious, ingredientsHtml: malicious, usageHtml: malicious, specs: [], updatedAt: '' };
  const state = { ...empty, products: { [slug]: product } };
  assert.deepEqual(catalog.getAllCatalogProducts(state).map(p => p.name), ['Live']);
  const detail = details.getRichProductDetail(slug, state);
  assert.equal(detail.rating, undefined);
  assert.equal(detail.ratingSummary, undefined);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  for (const html of [detail.overviewHtml, detail.ingredientsText, detail.usageText]) {
    const rendered = renderToStaticMarkup(React.createElement('div', { dangerouslySetInnerHTML: { __html: html } }));
    assert.doesNotMatch(rendered, /<(script|img|a)\b/i);
    assert.match(rendered, /&lt;script&gt;/);
  }
  assert.equal(details.getRichProductDetail(slug, { ...state, deletedSlugs: [slug] }), null);
});

test('Hyperdrive database opens a fresh Client per query and transaction, rolls back, guards escaped handles and closes cleanly', async () => {
  const clients = [];
  let behavior = {};
  class FakeClient {
    constructor(config) {
      this.config = config;
      this.events = [];
      this.queries = [];
      clients.push(this);
    }
    async connect() {
      this.events.push('connect');
      if (behavior.failConnect) throw Error('connect boom');
    }
    async query(sql, values) {
      this.events.push(`query:${sql}`);
      this.queries.push({ sql, values });
      if (behavior.failSql && behavior.failSql(sql)) throw Error(behavior.failMessage || 'query boom');
      return { rows: [{ ok: true, sql }] };
    }
    async end() {
      this.events.push('end');
      if (behavior.failEnd) throw Error('end error');
    }
  }

  const connectionString = 'postgres://hyperdrive.local/db';
  const { createHyperdriveDatabase } = load('src/lib/server/postgres-database.ts', {
    pg: { Pool: class {}, Client: FakeClient },
  });
  const db = createHyperdriveDatabase(connectionString);
  assert.deepEqual(db.status(), { closing: false, idleConnectionErrors: 0 });

  const inputValues = [42];
  const res1 = await db.query('SELECT $1::int AS n', inputValues);
  assert.deepEqual(res1, { rows: [{ ok: true, sql: 'SELECT $1::int AS n' }] });
  assert.equal(clients.length, 1);
  assert.deepEqual(clients[0].config, { connectionString });
  assert.equal('ssl' in clients[0].config, false);
  assert.deepEqual(clients[0].events, ['connect', 'query:SELECT $1::int AS n', 'end']);
  assert.equal(typeof clients[0].queries[0].sql, 'string');
  assert.deepEqual(clients[0].queries[0].values, [42]);
  assert.notEqual(clients[0].queries[0].values, inputValues);

  await db.query('SELECT 1');
  assert.equal(clients.length, 2);
  assert.notEqual(clients[0], clients[1]);
  assert.equal(clients[1].queries[0].values, undefined);

  behavior = { failSql: sql => sql === 'SELECT broken', failMessage: 'query boom' };
  await assert.rejects(() => db.query('SELECT broken'), /query boom/);
  assert.deepEqual(clients[2].events, ['connect', 'query:SELECT broken', 'end']);

  behavior = { failConnect: true };
  await assert.rejects(() => db.query('SELECT never'), /connect boom/);
  assert.deepEqual(clients[3].events, ['connect', 'end']);

  behavior = { failEnd: true };
  assert.deepEqual(await db.query('SELECT 2'), { rows: [{ ok: true, sql: 'SELECT 2' }] });
  assert.deepEqual(clients[4].events, ['connect', 'query:SELECT 2', 'end']);

  behavior = {};
  let escapedCommitted;
  const txResult = await db.transaction(async connection => {
    escapedCommitted = connection;
    await connection.query('INSERT INTO t VALUES ($1)', ['a']);
    return 7;
  });
  assert.equal(txResult, 7);
  assert.deepEqual(clients[5].events, ['connect', 'query:BEGIN', 'query:INSERT INTO t VALUES ($1)', 'query:COMMIT', 'end']);
  await assert.rejects(() => escapedCommitted.query('late'), /POSTGRES_TRANSACTION_FINISHED/);
  assert.equal(clients[5].queries.length, 3);

  let escapedFailed;
  await assert.rejects(() => db.transaction(async connection => {
    escapedFailed = connection;
    await connection.query('UPDATE t SET x = 1');
    throw Error('business conflict');
  }), /business conflict/);
  assert.deepEqual(clients[6].events, ['connect', 'query:BEGIN', 'query:UPDATE t SET x = 1', 'query:ROLLBACK', 'end']);
  await assert.rejects(() => escapedFailed.query('late after rollback'), /POSTGRES_TRANSACTION_FINISHED/);

  behavior = { failSql: sql => sql === 'ROLLBACK', failMessage: 'rollback disconnected' };
  await assert.rejects(() => db.transaction(async () => {
    throw Error('original failure');
  }), /original failure/);
  assert.deepEqual(clients[7].events, ['connect', 'query:BEGIN', 'query:ROLLBACK', 'end']);

  behavior = { failSql: sql => sql === 'COMMIT', failMessage: 'commit disconnected' };
  await assert.rejects(() => db.transaction(async () => 1), /commit disconnected/);
  assert.deepEqual(clients[8].events, ['connect', 'query:BEGIN', 'query:COMMIT', 'query:ROLLBACK', 'end']);

  behavior = {};
  const countBeforeClose = clients.length;
  await Promise.all([db.close(), db.close()]);
  assert.deepEqual(db.status(), { closing: true, idleConnectionErrors: 0 });
  await assert.rejects(() => db.query('SELECT 3'), /POSTGRES_DATABASE_CLOSED/);
  await assert.rejects(() => db.transaction(async () => 1), /POSTGRES_DATABASE_CLOSED/);
  assert.equal(clients.length, countBeforeClose);
});

test('getPostgresDatabase selects fresh Hyperdrive adapter in Workers and singleton Pool fallback outside Workers', async () => {
  const previousUrl = process.env.NARI_POSTGRES_URL;
  const previousSsl = process.env.NARI_POSTGRES_SSL_MODE;
  delete process.env.NARI_POSTGRES_URL;
  delete process.env.NARI_POSTGRES_SSL_MODE;

  try {
    let poolCreations = 0;
    const clientConfigs = [];
    const contextCalls = [];
    class FakePool extends EventEmitter {
      constructor(config) {
        super();
        this.config = config;
        poolCreations += 1;
      }
      async query() { return { rows: [] }; }
      async end() {}
    }
    class FakeClient {
      constructor(config) {
        clientConfigs.push(config);
      }
      async connect() {}
      async query() { return { rows: [{ source: 'hyperdrive' }] }; }
      async end() {}
    }

    const hyperdriveMod = load('src/lib/server/postgres-database.ts', {
      pg: { Pool: FakePool, Client: FakeClient },
      '@opennextjs/cloudflare': {
        getCloudflareContext(options) {
          contextCalls.push(options);
          return { env: { HYPERDRIVE: { connectionString: '  postgres://hyperdrive.local/db  ' } } };
        },
      },
    });

    assert.equal(hyperdriveMod.readHyperdriveConnectionString(), 'postgres://hyperdrive.local/db');
    assert.deepEqual(contextCalls, [{ async: false }]);
    const hd1 = hyperdriveMod.getPostgresDatabase();
    const hd2 = hyperdriveMod.getPostgresDatabase();
    assert.notEqual(hd1, hd2);
    assert.equal(poolCreations, 0);
    assert.deepEqual(await hd1.query('SELECT 1'), { rows: [{ source: 'hyperdrive' }] });
    assert.deepEqual(clientConfigs, [{ connectionString: 'postgres://hyperdrive.local/db' }]);
    await hyperdriveMod.closePostgresDatabase();

    const throwingContextMod = load('src/lib/server/postgres-database.ts', {
      pg: { Pool: FakePool, Client: FakeClient },
    });
    assert.equal(throwingContextMod.readHyperdriveConnectionString(), null);
    assert.throws(() => throwingContextMod.getPostgresDatabase(), /POSTGRES_URL_REQUIRED/);

    process.env.NARI_POSTGRES_URL = 'postgresql://user:pass@db.example/catalog';
    const nodeDb1 = throwingContextMod.getPostgresDatabase();
    const nodeDb2 = throwingContextMod.getPostgresDatabase();
    assert.equal(nodeDb1, nodeDb2);
    assert.equal(poolCreations, 1);
    await throwingContextMod.closePostgresDatabase();

    for (const env of [{}, { HYPERDRIVE: {} }, { HYPERDRIVE: { connectionString: '   ' } }]) {
      const poolsBefore = poolCreations;
      const missingBindingMod = load('src/lib/server/postgres-database.ts', {
        pg: { Pool: FakePool, Client: FakeClient },
        '@opennextjs/cloudflare': {
          getCloudflareContext() { return { env }; },
        },
      });
      assert.equal(missingBindingMod.readHyperdriveConnectionString(), null);
      const fallback1 = missingBindingMod.getPostgresDatabase();
      const fallback2 = missingBindingMod.getPostgresDatabase();
      assert.equal(fallback1, fallback2);
      assert.equal(poolCreations, poolsBefore + 1);
      await missingBindingMod.closePostgresDatabase();
    }
  } finally {
    if (previousUrl === undefined) delete process.env.NARI_POSTGRES_URL; else process.env.NARI_POSTGRES_URL = previousUrl;
    if (previousSsl === undefined) delete process.env.NARI_POSTGRES_SSL_MODE; else process.env.NARI_POSTGRES_SSL_MODE = previousSsl;
  }
});
