import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const validUrl = (value) => typeof value === 'string' && /^(https:\/\/|\/(?!\/))/.test(value) && !value.includes('\\');
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const timestamp = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));

/** Pure mapping: unresolved source relationships block SQL output rather than invent data. */
export function prepareCatalogImport(source, includeDemo = false) {
  const issues = [];
  const rows = { sources: [{ id: 'sqlite-import-unverified', verification_state: 'unverified', scope: 'SQLite catalog export; provenance not yet verified' }], branches: [], categories: [], brands: [], products: [], product_images: [], product_specs: [], home_banners: [], inventory_balances: [] };
  const keep = (row) => includeDemo || !row.is_seed;
  const state = source.overrides || { products: {}, deletedSlugs: [], banners: {} };
  if (!state.products || !Array.isArray(state.deletedSlugs)) throw Error('Invalid overrides state');
  const addIssue = (kind, key) => issues.push({ kind, key: String(key) });
  for (const table of ['branches', 'categories', 'brands']) {
    for (const item of source[table].filter(keep)) {
      const { is_seed, created_at, ...rest } = item;
      if (table === 'categories') {
        delete rest.icon;
        rows[table].push({ ...rest, icon_url: item.icon, is_demo: Boolean(is_seed), source_id: rows.sources[0].id });
      } else if (table === 'branches') {
        if (!timestamp(created_at)) addIssue('invalid_timestamp', item.id);
        rows[table].push({ ...rest, supports_nowfree_2h: Boolean(item.supports_nowfree_2h), supports_clinic: Boolean(item.supports_clinic), is_active: Boolean(item.is_active), is_demo: Boolean(is_seed), created_at, source_id: rows.sources[0].id });
      } else rows[table].push({ ...rest, is_demo: Boolean(is_seed), source_id: rows.sources[0].id });
    }
  }
  const productBySlug = new Map(source.products.filter(keep).map((p) => [p.slug, p]));
  for (const [slug, override] of Object.entries(state.products)) {
    if (slug !== override.slug) addIssue('override_key_mismatch', slug);
    if (!productBySlug.has(slug)) { addIssue('override_missing_sqlite_product', slug); continue; }
    const base = productBySlug.get(slug);
    if (override.sku !== base.sku) addIssue('override_sku_mismatch', slug);
  }
  const findUnique = (items, predicate, kind, key) => {
    const matches = items.filter(predicate);
    if (matches.length !== 1) { addIssue(kind, key); return null; }
    return matches[0].id;
  };
  for (const base of productBySlug.values()) {
    const ov = state.products[base.slug] || {};
    const brandId = findUnique(rows.brands, (b) => ov.brand ? b.name === ov.brand : base.brand_id ? b.id === base.brand_id : b.name === base.brand_name, 'unresolved_brand', base.slug);
    const categoryId = findUnique(rows.categories, (c) => ov.category ? c.slug === ov.category : base.category_id ? c.id === base.category_id : c.slug === base.category_slug, 'unresolved_category', base.slug);
    const price = ov.price ?? base.price;
    const market = ov.old ?? base.market_price;
    if (!integer(price) || !integer(market) || market < price) addIssue('invalid_price', base.slug);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(base.sku) || !/^[a-z0-9][a-z0-9.-]{0,240}\.html$/.test(base.slug)) addIssue('invalid_sku_or_slug', base.slug);
    if (!timestamp(base.created_at)) addIssue('invalid_timestamp', base.slug);
    rows.products.push({ id: base.id, sku: base.sku, slug: base.slug, name: ov.name ?? base.name, english_name: ov.englishName ?? base.english_name, brand_id: brandId, category_id: categoryId, price, market_price: market, description: ov.description ?? base.description ?? '', overview_html: ov.overviewHtml ?? '', ingredients_html: ov.ingredientsHtml ?? '', usage_html: ov.usageHtml ?? '', is_demo: Boolean(base.is_seed), hidden_at: state.deletedSlugs.includes(base.slug) ? base.created_at : null, source_id: rows.sources[0].id, created_at: base.created_at });
    // Legacy ratings/sold counts may be generated fixtures: do not promote them to observed facts.
    const images = [...new Set([ov.image ?? base.thumbnail_url, ...(ov.images || [])].filter(Boolean))];
    if (images.length > 30) addIssue('too_many_images', base.slug);
    images.forEach((url, index) => {
      if (!validUrl(url)) addIssue('invalid_image_url', base.slug);
      rows.product_images.push({ id: `${base.id}-image-${index}`, product_id: base.id, url, sort_order: index, alt_text: ov.name ?? base.name });
    });
    (ov.specs || []).forEach((spec, index) => {
      if (typeof spec.label !== 'string' || !spec.label.trim() || typeof spec.value !== 'string' || !spec.value.trim()) addIssue('invalid_spec', base.slug);
      rows.product_specs.push({ product_id: base.id, sort_order: index, label: spec.label, value: spec.value });
    });
  }
  for (const slug of state.deletedSlugs) if (!productBySlug.has(slug)) addIssue('unresolved_tombstone', slug);
  for (const category of rows.categories) if (category.parent_id && !rows.categories.some((c) => c.id === category.parent_id)) addIssue('unresolved_parent', category.id);
  for (const item of source.inventory_balances) {
    const product = rows.products.find((p) => p.sku === item.sku);
    if (!product || !rows.branches.some((b) => b.id === item.branch_id)) { addIssue('unresolved_inventory', `${item.branch_id}:${item.sku}`); continue; }
    if (!integer(item.total_stock) || !integer(item.reserved_stock) || item.reserved_stock > item.total_stock || item.available_stock !== item.total_stock - item.reserved_stock || !integer(item.reorder_point) || !timestamp(item.updated_at)) addIssue('invalid_inventory', item.sku);
    rows.inventory_balances.push({ branch_id: item.branch_id, product_id: product.id, total_stock: item.total_stock, reserved_stock: item.reserved_stock, reorder_point: item.reorder_point, updated_at: item.updated_at });
  }
  for (const [group, placement] of [['heroSlides', 'hero'], ['sideBanners', 'side']]) {
    (state.banners?.[group] || []).forEach((banner, index) => {
      if (!validUrl(banner.src) || !validUrl(banner.href)) addIssue('invalid_banner_url', banner.id);
      rows.home_banners.push({ id: `${placement}:${banner.id}`, placement, sort_order: index, image_url: banner.src, target_url: banner.href, alt_text: banner.alt || '' });
    });
  }
  if (rows.home_banners.length > 40) addIssue('too_many_banners', 'banners');
  return { rows, issues, includeDemo, ready: issues.length === 0 };
}

function literal(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') { if (!Number.isSafeInteger(value)) throw Error('Unsafe numeric value'); return String(value); }
  if (typeof value !== 'string' || value.includes('\0')) throw Error('Invalid SQL value');
  return `'${value.replaceAll("'", "''")}'`;
}

export function importSql(plan) {
  if (!plan.ready) throw Error('Resolve import issues before generating SQL');
  const commands = ["BEGIN; SET LOCAL standard_conforming_strings = on; SET LOCAL statement_timeout = '60s';", "DO $$ BEGIN IF EXISTS (SELECT 1 FROM nari_catalog.products) OR EXISTS (SELECT 1 FROM nari_catalog.sources) THEN RAISE EXCEPTION 'Import requires an empty target'; END IF; END $$;"];
  // Categories may reference parents appearing later in the export.
  for (const [table, records] of Object.entries(plan.rows)) for (const record of records) {
    const row = table === 'categories' ? { ...record, parent_id: null } : record;
    const keys = Object.keys(row);
    commands.push(`INSERT INTO nari_catalog.${table} (${keys.join(',')}) VALUES (${keys.map((key) => literal(row[key])).join(',')});`);
  }
  for (const category of plan.rows.categories) if (category.parent_id) commands.push(`UPDATE nari_catalog.categories SET parent_id=${literal(category.parent_id)} WHERE id=${literal(category.id)};`);
  commands.push('COMMIT;');
  return commands.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const sourcePath = process.argv[2];
  const out = process.argv[3];
  if (!sourcePath || !out || !path.isAbsolute(sourcePath) || !existsSync(sourcePath)) throw Error('Usage: node scripts/prepare-catalog-import.mjs ABSOLUTE_SQLITE_PATH NEW_OUTPUT_DIRECTORY [--include-demo]');
  const database = new DatabaseSync(sourcePath, { readOnly: true });
  let source;
  try {
    database.exec('BEGIN');
    source = Object.fromEntries(['branches', 'categories', 'brands', 'products', 'inventory_balances', 'product_variants', 'inventory_audit_logs'].map((table) => [table, database.prepare(`SELECT * FROM ${table}`).all()]));
    const setting = database.prepare("SELECT value FROM system_settings WHERE key='live_catalog_overrides'").get();
    source.overrides = setting ? JSON.parse(setting.value) : undefined;
    database.exec('ROLLBACK');
  } finally { database.close(); }
  const plan = prepareCatalogImport(source, process.argv.includes('--include-demo'));
  mkdirSync(out); // Refuse to overwrite a prior export.
  const raw = JSON.stringify(source, null, 2);
  writeFileSync(path.join(out, 'source.json'), raw, { flag: 'wx', mode: 0o600 });
  writeFileSync(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2), { flag: 'wx', mode: 0o600 });
  writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ sha256: createHash('sha256').update(raw).digest('hex'), counts: Object.fromEntries(Object.entries(plan.rows).map(([k, v]) => [k, v.length])), issueCount: plan.issues.length, ready: plan.ready }), { flag: 'wx' });
  if (plan.ready) writeFileSync(path.join(out, 'import.sql'), importSql(plan), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ ready: plan.ready, issues: plan.issues.length, output: path.resolve(out) }));
  if (!plan.ready) process.exitCode = 2;
}
