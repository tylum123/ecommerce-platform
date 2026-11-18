import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRequest, hasPermission, canAccessBranch } from "../src/lib/server/access-policy.ts";
import { verifySignedSessionToken, extractSessionTokenFromCookieHeader, fetchCurrentSession } from "../src/lib/auth.ts";

test("admin has access to every permission and branch, including future modules", () => {
  for (const permission of ["staff:manage", "products:write", "future:screen"]) {
    assert.equal(hasPermission({ role: "admin" }, permission), true);
  }
  assert.equal(canAccessBranch({ role: "admin" }, "CN99"), true);
});

test("staff cannot escalate through permission claims or cross branches", () => {
  const staff = { role: "warehouse_staff", branchId: "CN1", permissions: ["staff:manage"] };
  assert.equal(hasPermission(staff, "inventory:read"), true);
  assert.equal(hasPermission(staff, "staff:manage"), false);
  assert.equal(hasPermission({ role: "customer" }, "products:write"), false);
  assert.equal(hasPermission({ role: "untrusted" }, "inventory:read"), false);
  assert.equal(canAccessBranch(staff, "CN1"), true);
  assert.equal(canAccessBranch(staff, "CN2"), false);
  assert.equal(canAccessBranch(staff, undefined), false);
  assert.equal(canAccessBranch({ role: "customer", branchId: "CN1" }, "CN1"), false);
});

test("legacy and malformed cookies never authenticate", async () => {
  assert.equal(await verifySignedSessionToken("eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.fake"), null);
  assert.equal(extractSessionTokenFromCookieHeader("nari_session=%E0%A4%A"), null);
  const result = await authorizeRequest(new Request("https://example.test/api/admin/staff", {
    headers: { Cookie: "nari_session=forged", Authorization: "Bearer admin" },
  }), "staff:manage");
  assert.equal(result.user, null);
  assert.equal(result.response.status, 401);
  assert.match(result.response.headers.get("Cache-Control"), /no-store/);
});

test("failed server session check clears client state instead of falling back", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 401 });
  try { assert.equal(await fetchCurrentSession(), null); }
  finally { globalThis.fetch = originalFetch; }
});
