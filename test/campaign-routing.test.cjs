/* eslint-disable @typescript-eslint/no-require-imports -- isolated TS route harness */
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
    if (Object.hasOwn(stubs, id)) return stubs[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, stubs);
    return localRequire(id);
  };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, requireModule);
  return mod.exports;
}

const catalog = { source: 'postgres', updatedAt: '', deletedSlugs: [], banners: { heroSlides: [], sideBanners: [] }, products: { 'product.html': { slug: 'product.html', name: 'Actual', brand: 'Brand', price: 0, old: 0, sale: 0, rating: undefined } } };

test('supported tag/campaign routes come from observed metadata', () => {
  const { getKnownTagPage, isKnownCampaign } = load('src/lib/campaign-catalog.ts');
  for (const slug of ['dai-tiec-hang-hieu', 'dai-tiec-hang-hieu.html', 'deal-for-men.html']) assert.ok(getKnownTagPage(slug));
  for (const slug of ['unknown-verification', '__proto__', 'constructor', '../deal-for-men']) assert.equal(getKnownTagPage(slug), null);
  assert.equal(isKnownCampaign('wow'), true);
  for (const slug of ['unknown-verification', 'wow.html', 'WOW']) assert.equal(isKnownCampaign(slug), false);
});

test('membership is explicit, uses current values and never resurrects snapshots or hidden rows', () => {
  const { getCampaignProducts } = load('src/lib/campaign-catalog.ts');
  assert.deepEqual(getCampaignProducts(catalog), []);
  assert.deepEqual(getCampaignProducts({ ...catalog, source: undefined }), []);
  assert.deepEqual(getCampaignProducts(catalog, ['product.html', 'missing.html', 'product.html']), [catalog.products['product.html']]);
  assert.deepEqual(getCampaignProducts({ ...catalog, deletedSlugs: ['product.html'] }, ['product.html']), []);
  assert.equal(getCampaignProducts(catalog, ['product.html'])[0].rating, undefined);
  assert.equal(getCampaignProducts(catalog, ['product.html'])[0].price, 0);
});

test('unknown pages throw 404 before catalog access; known routes await authoritative catalog', async () => {
  let reads = 0;
  const stubs = {
    'next/navigation': { notFound: () => { throw Error('NEXT_HTTP_ERROR_FALLBACK;404'); } },
    '@/lib/server/live-catalog-store': { readStorefrontCatalog: async () => { reads++; return catalog; } },
    '@/components/sites/hasaki/tag-view': { TagView: () => null },
    '@/components/sites/hasaki/campaign-wow-view': { CampaignWowView: () => null },
  };
  for (const file of ['src/app/tag/[slug]/page.tsx', 'src/app/campaign/[slug]/page.tsx']) {
    const { default: Page } = load(file, stubs);
    await assert.rejects(() => Page({ params: Promise.resolve({ slug: 'unknown-verification' }) }), /;404/);
  }
  assert.equal(reads, 0);
  for (const [file, slug] of [['src/app/tag/[slug]/page.tsx', 'deal-for-men.html'], ['src/app/campaign/[slug]/page.tsx', 'wow'], ['src/app/campaign/wow/page.tsx', 'wow']]) {
    const element = await load(file, stubs).default({ params: Promise.resolve({ slug }) });
    assert.deepEqual(element.props.products, []);
  }
  assert.equal(reads, 3);
});
