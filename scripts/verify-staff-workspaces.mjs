import assert from "node:assert/strict";
import { STAFF_WORKSPACES, canViewStaffWorkspace } from "../src/lib/staff-workspaces.ts";

const expectedRoles = new Map([
  ["cua-hang", "store_manager"],
  ["kho", "warehouse_staff"],
  ["clinic", "clinic_doctor"],
  ["cskh", "cs_agent"],
]);
const roles = ["admin", "store_manager", "warehouse_staff", "clinic_doctor", "cs_agent", "customer"];
assert.equal(STAFF_WORKSPACES.length, expectedRoles.size);
for (const workspace of STAFF_WORKSPACES) {
  assert.equal(workspace.role, expectedRoles.get(workspace.slug));
  for (const role of roles) {
    assert.equal(canViewStaffWorkspace(role, workspace), role === "admin" || role === expectedRoles.get(workspace.slug), `${role} -> ${workspace.slug}`);
  }
}
console.log("PASS: 24 staff workspace role checks. This does not verify server authentication.");
