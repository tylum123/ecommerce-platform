import assert from "node:assert/strict";

const base = process.env.HASAKI_TEST_URL || "http://127.0.0.1:3035";
const privatePaths = ["/api/admin/users", "/api/admin/staff", "/api/admin/orders", "/api/admin/inventory", "/api/admin/seo", "/api/orders", "/api/bookings", "/api/mcp", "/api/codegraph"];
for (const path of privatePaths) {
  const response = await fetch(`${base}${path}`);
  assert.ok([401, 403, 503].includes(response.status), `${path}: guest received ${response.status}`);
  console.log(`PASS guest denied ${path} (${response.status})`);
}
for (const path of ["/quan-tri", "/khach-hang/tai-khoan"]) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  assert.ok([303, 307, 308].includes(response.status), `${path}: expected server redirect, got ${response.status}`);
  assert.ok(response.headers.get("location")?.includes("/dang-nhap"));
  console.log(`PASS private page redirected ${path}`);
}
for (const path of ["/api/auth", "/api/orders", "/api/bookings"]) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", accountType: "staff", staffRole: "admin" }),
  });
  assert.ok([401, 403, 503].includes(response.status), `${path}: mutation accepted/unexpected ${response.status}`);
  console.log(`PASS unsupported mutation denied ${path}`);
}
for (const path of ["/", "/api/products"]) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, `${path}: public browsing regressed`);
  console.log(`PASS public browsing ${path}`);
}
for (const path of ["/san-pham/unknown-verification.html", "/danh-muc/unknown-verification.html", "/thuong-hieu/unknown-verification.html", "/tag/unknown-verification"]) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 404, `${path}: unknown resource must not silently become another item`);
  console.log(`PASS unknown URL 404 ${path}`);
}
const html = await (await fetch(base)).text();
const chunks = [...new Set([...html.matchAll(/src="([^" ]+\.js(?:\?[^" ]*)?)"/g)].map((match) => match[1]))];
assert.ok(chunks.length > 0, "Expected application JavaScript chunks");
for (const chunk of chunks) {
  const response = await fetch(new URL(chunk.replaceAll("&amp;", "&"), base));
  assert.equal(response.status, 200, `JavaScript chunk failed: ${chunk}`);
}
console.log(`PASS ${chunks.length} homepage JavaScript chunks`);
