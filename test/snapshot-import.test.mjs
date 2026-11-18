import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditSnapshotCatalog } from '../scripts/prepare-snapshot-catalog.mjs';

test('snapshot audit quarantines missing SKU and conflicts, never marks import ready', () => {
  const valid = { sku: 'SKU', slug: 'item.html', price: 0 };
  const result = auditSnapshotCatalog([
    { file: 'deals-example.json', data: { products: [valid, { slug: 'no-sku.html', price: 1 }] } },
    { file: 'bestsellers-example.json', data: { products: [{ ...valid, price: 2 }] } },
  ]);
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0].raw.price, 0);
  assert.equal(result.products[0].is_demo, true);
  assert.equal(result.products[0].verification_state, 'unverified');
  assert.equal(result.readyForImport, false);
  assert.equal(result.quarantine.length, 2);
});
