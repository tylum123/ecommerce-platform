import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSupabasePrincipal, hasTrustedMutationOrigin } from "../src/lib/server/supabase-principal.ts";

const verifiedAuth = { getUser: async () => ({ data: { user: { id: "verified-id", email: "admin@example.test" } }, error: null }) };
const record = { userId: "verified-id", role: "admin", active: true, fullName: "Admin", branchId: null };
const repository = (value) => ({ findActiveIdentity: async (id) => { assert.equal(id, "verified-id"); return value; } });

test("principal uses verified identity and provisioned role only", async () => {
  const user = await resolveSupabasePrincipal(verifiedAuth, repository(record));
  assert.equal(user.role, "admin");
  assert.equal(user.id, "verified-id");
  assert.equal(user.branchId, undefined);
});

test("failed verification never queries roles; stale or unprovisioned records deny access", async () => {
  const never = { findActiveIdentity: () => { throw Error("must not query"); } };
  assert.equal(await resolveSupabasePrincipal({ getUser: async () => ({ data: { user: null }, error: null }) }, never), null);
  for (const value of [null, { ...record, active: false }, { ...record, userId: "other" }, { ...record, role: "superuser" }, { ...record, role: "warehouse_staff" }]) {
    assert.equal(await resolveSupabasePrincipal(verifiedAuth, repository(value)), null);
  }
  assert.equal(await resolveSupabasePrincipal({ getUser: async () => { throw Error("offline"); } }, never), null);
});

test("staff principal carries explicit branch; customer cannot self-assign admin metadata", async () => {
  const user = await resolveSupabasePrincipal(verifiedAuth, repository({ ...record, role: "warehouse_staff", branchId: "CN1" }));
  assert.equal(user.branchId, "CN1");
  const malicious = { getUser: async () => ({ data: { user: { id: "verified-id", user_metadata: { role: "admin" } } }, error: null }) };
  assert.equal((await resolveSupabasePrincipal(malicious, repository({ ...record, role: "customer" }))).role, "customer");
});

test("cookie mutations require exact configured Origin", () => {
  const req = (origin) => new Request("https://shop.example.test/api", { method: "POST", headers: origin ? { Origin: origin } : {} });
  assert.equal(hasTrustedMutationOrigin(req("https://shop.example.test"), "https://shop.example.test"), true);
  assert.equal(hasTrustedMutationOrigin(req("https://evil.test"), "https://shop.example.test"), false);
  assert.equal(hasTrustedMutationOrigin(req(), "https://shop.example.test"), false);
  assert.equal(hasTrustedMutationOrigin(req("https://shop.example.test"), "https://shop.example.test/path"), false);
});
