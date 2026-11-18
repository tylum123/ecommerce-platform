import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareCatalogImport, importSql } from '../scripts/prepare-catalog-import.mjs';

const fixture = () => ({
  branches: [{ id: 'b', code: 'B', name: 'Branch', address: '', city: '', district: '', phone: '', supports_nowfree_2h: 0, supports_clinic: 0, is_active: 1, is_seed: 0, created_at: '2026-01-01T00:00:00Z' }],
  categories: [{ id: 'c', slug: 'c', name: 'Category', parent_id: null, display_order: 0, is_seed: 0 }],
  brands: [{ id: 'brand', slug: 'brand', name: 'Brand', is_seed: 0 }],
  products: [{ id: 'p', sku: 'SKU', slug: 'item.html', name: "O'Name", brand_id: 'brand', category_id: 'c', price: 10, market_price: 20, thumbnail_url: '/image.jpg', created_at: '2026-01-01T00:00:00Z', is_seed: 0, rating: 5, sold_count: 100 }],
  inventory_balances: [{ branch_id: 'b', sku: 'SKU', total_stock: 10, reserved_stock: 3, available_stock: 7, reorder_point: 0, updated_at: '2026-01-01T00:00:00Z' }],
  overrides: { products: {}, deletedSlugs: [], banners: {} },
});

test('import preserves zero overrides, quotes text and omits unverified rating claims', () => {
  const source = fixture();
  source.overrides.products['item.html'] = { sku: 'SKU', slug: 'item.html', price: 0, old: 0 };
  const plan = prepareCatalogImport(source);
  assert.equal(plan.ready, true);
  assert.equal(plan.rows.products[0].price, 0);
  assert.equal(plan.rows.products[0].observed_rating, undefined);
  assert.match(importSql(plan), /O''Name/);
  assert.equal(source.products[0].price, 10);
});

test('import blocks unresolved relationships and inconsistent stock', () => {
  const source = fixture();
  source.products[0].brand_id = 'missing';
  source.inventory_balances[0].available_stock = 99;
  const plan = prepareCatalogImport(source);
  assert.equal(plan.ready, false);
  assert.ok(plan.issues.some((i) => i.kind === 'unresolved_brand'));
  assert.ok(plan.issues.some((i) => i.kind === 'invalid_inventory'));
  assert.throws(() => importSql(plan));
});

test('import blocks overrides without base rows instead of fabricating foreign keys', () => {
  const source = fixture();
  source.overrides.products['new.html'] = { slug: 'new.html', sku: 'NEW' };
  assert.equal(prepareCatalogImport(source).ready, false);
});
