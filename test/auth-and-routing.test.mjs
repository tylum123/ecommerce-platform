import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_UNAVAILABLE_MESSAGE,
  AUTH_COOKIE_NAME,
  DEMO_AUTH_ACCOUNTS,
  isStaffOrAdminRole,
  verifySignedSessionToken,
  serializeSessionCookie,
  serializeClearSessionCookie,
  extractSessionTokenFromCookieHeader,
  readRegisteredLocalUsers,
} from "../src/lib/auth.ts";

test("AUTH_UNAVAILABLE_MESSAGE is exported and maintains backwards compatibility", () => {
  assert.ok(typeof AUTH_UNAVAILABLE_MESSAGE === "string");
  assert.ok(AUTH_UNAVAILABLE_MESSAGE.length > 0);
  assert.match(AUTH_UNAVAILABLE_MESSAGE, /Chức năng đăng nhập, đăng ký/);
});

test("DEMO_AUTH_ACCOUNTS provides valid roles for Admin, Staff, and Customer", () => {
  assert.ok(Array.isArray(DEMO_AUTH_ACCOUNTS));
  assert.ok(DEMO_AUTH_ACCOUNTS.length >= 4);

  const admin = DEMO_AUTH_ACCOUNTS.find((a) => a.user.role === "admin");
  assert.ok(admin, "Admin account must exist");
  assert.match(admin.username, /^admin@(narihome|hasaki)\.vn$/);
  assert.equal(isStaffOrAdminRole(admin.user.role), true);

  const customer = DEMO_AUTH_ACCOUNTS.find((a) => a.user.role === "customer");
  assert.ok(customer, "VIP Customer account must exist");
  assert.equal(customer.username, "0901234567");
  assert.equal(isStaffOrAdminRole(customer.user.role), false);

  const warehouse = DEMO_AUTH_ACCOUNTS.find((a) => a.user.role === "warehouse_staff");
  assert.ok(warehouse);
  assert.equal(isStaffOrAdminRole(warehouse.user.role), true);

  const doctor = DEMO_AUTH_ACCOUNTS.find((a) => a.user.role === "clinic_doctor");
  assert.ok(doctor);
  assert.equal(isStaffOrAdminRole(doctor.user.role), true);
});

test("legacy signed tokens are rejected until a maintained provider is configured", async () => {
  assert.equal(await verifySignedSessionToken("header.payload.signature"), null);
  assert.equal(await verifySignedSessionToken(""), null);
});

test("Cookie serialization and extraction operates properly", () => {
  const sampleToken = "eyJhbGciOiJIUzI1NiJ9.samplePayload.sampleSig";
  const cookieHeader = serializeSessionCookie(sampleToken);
  assert.match(cookieHeader, new RegExp(`${AUTH_COOKIE_NAME}=${sampleToken}`));
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Lax/i);

  const clearCookie = serializeClearSessionCookie();
  assert.match(clearCookie, new RegExp(`${AUTH_COOKIE_NAME}=;`));
  assert.match(clearCookie, /Max-Age=0/i);

  const mockHeader = `other_cookie=xyz; ${AUTH_COOKIE_NAME}=${sampleToken}; theme=dark`;
  const extracted = extractSessionTokenFromCookieHeader(mockHeader);
  assert.equal(extracted, sampleToken);

  assert.equal(extractSessionTokenFromCookieHeader(""), null);
  assert.equal(extractSessionTokenFromCookieHeader(null), null);
});

test("readRegisteredLocalUsers is exported and safe on SSR", () => {
  assert.equal(typeof readRegisteredLocalUsers, "function");
  const result = readRegisteredLocalUsers();
  assert.ok(Array.isArray(result));
});

test("isStaffOrAdminRole accurately distinguishes privileged staff from customers", () => {
  assert.equal(isStaffOrAdminRole("admin"), true);
  assert.equal(isStaffOrAdminRole("store_manager"), true);
  assert.equal(isStaffOrAdminRole("warehouse_staff"), true);
  assert.equal(isStaffOrAdminRole("clinic_doctor"), true);
  assert.equal(isStaffOrAdminRole("cs_agent"), true);
  assert.equal(isStaffOrAdminRole("customer"), false);
  assert.equal(isStaffOrAdminRole(undefined), false);
  assert.equal(isStaffOrAdminRole(null), false);
  assert.equal(isStaffOrAdminRole("hacker"), false);
});
