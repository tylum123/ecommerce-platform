import { test } from "node:test";
import assert from "node:assert/strict";
import { filterBrandProducts } from "../src/lib/brand-filter.ts";

const items = [{ name: "Kem A", brand: "Demo", category: "skin", price: 200, old: 300 }, { name: "Sữa B", brand: "Demo", category: "wash", price: 100, old: 100 }, { name: "Kem C", brand: "Demo", category: "skin", price: 150, old: 200 }];
const base = { query: "", category: "", min: null, max: null, deals: false, sort: "default" };
test("price sorting works in both directions without mutating data", () => {
  assert.deepEqual(filterBrandProducts(items, { ...base, sort: "low" }).map(p => p.price), [100, 150, 200]);
  assert.deepEqual(filterBrandProducts(items, { ...base, sort: "high" }).map(p => p.price), [200, 150, 100]);
  assert.deepEqual(items.map(p => p.price), [200, 100, 150]);
});
test("search, category, price and deals compose and empty results stay empty", () => {
  assert.deepEqual(filterBrandProducts(items, { ...base, query: "kEM", category: "skin", min: 150, max: 150, deals: true }).map(p => p.name), ["Kem C"]);
  assert.equal(filterBrandProducts(items, { ...base, query: "missing" }).length, 0);
  assert.deepEqual(filterBrandProducts(items, { ...base, deals: true }).map(p => p.name), ["Kem A", "Kem C"]);
});
