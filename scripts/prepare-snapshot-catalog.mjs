import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Quarantine only: these snapshots are not verified merchant records. */
export function auditSnapshotCatalog(documents) {
  const products = new Map();
  const quarantine = [];
  for (const { file, data } of documents) {
    const groups = file.startsWith('category-products-') ? Object.values(data)
      : file.startsWith('brand-catalog-') ? Object.values(data.brandProducts || {}).map((group) => group.products || [])
        : [data.products || []];
    for (const group of groups) {
      if (!Array.isArray(group)) { quarantine.push({ source: file, reason: 'invalid_product_group' }); continue; }
      for (const item of group) {
        const reasons = [];
        if (typeof item?.slug !== 'string' || !/^[a-z0-9][a-z0-9.-]{0,240}\.html$/.test(item.slug)) reasons.push('invalid_slug');
        if (!item?.sku || !/^[A-Za-z0-9_-]{1,80}$/.test(String(item.sku))) reasons.push('missing_or_invalid_sku');
        if (!Number.isSafeInteger(item?.price) || item.price < 0) reasons.push('invalid_price');
        if (reasons.length) { quarantine.push({ source: file, reasons, raw: item }); continue; }
        const previous = products.get(item.slug);
        if (previous && JSON.stringify(previous.raw) !== JSON.stringify(item)) {
          quarantine.push({ source: file, reason: 'conflicting_duplicate_slug', raw: item });
          previous.requiresReview = true;
          continue;
        }
        if (previous) { previous.sourceFiles.push(file); continue; }
        products.set(item.slug, { raw: item, is_demo: true, verification_state: 'unverified', requiresReview: true, captured_at: null, sourceFiles: [file] });
      }
    }
  }
  return { readyForImport: false, products: [...products.values()], quarantine,
    limits: ['Dry-run only; no SQL generated', 'No generated SKU/IDs or substitute prices', 'Brand/category relationships and provenance need review', 'Images are references only; no Storage upload', 'Ratings, sold counts and promotions are not verified facts'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const sourceDir = process.argv[2];
  const outputDir = process.argv[3];
  if (!sourceDir || !outputDir) throw Error('Usage: node scripts/prepare-snapshot-catalog.mjs SNAPSHOT_DIRECTORY NEW_PRIVATE_OUTPUT_DIRECTORY');
  const files = ['category-products-2026-11-13.json', 'deals-2026-11-13.json', 'bestsellers-2026-11-13.json', 'brand-catalog-2026-11-13.json'];
  const documents = files.map((file) => {
    const raw = readFileSync(path.join(sourceDir, file), 'utf8');
    return { file, data: JSON.parse(raw), sha256: createHash('sha256').update(raw).digest('hex') };
  });
  const plan = auditSnapshotCatalog(documents);
  mkdirSync(outputDir);
  writeFileSync(path.join(outputDir, 'snapshot-review.json'), JSON.stringify(plan, null, 2), { flag: 'wx', mode: 0o600 });
  writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({ sources: documents.map(({ file, sha256 }) => ({ file, sha256 })), productCount: plan.products.length, quarantineCount: plan.quarantine.length, readyForImport: false }), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ candidates: plan.products.length, quarantine: plan.quarantine.length, readyForImport: false }));
}
