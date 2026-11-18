# Read-only staff portal — 17/11/2026

Staff pages now verify Supabase `getUser()` plus the server-provisioned identity table instead of the deliberately disabled legacy signed cookie. `NARI_STAFF_PORTAL_ENABLED=true` is an explicit, independent capability flag; the existing Supabase authentication configuration and production/shared-limiter restriction still apply. PostgreSQL identity configuration is required.

An active admin can reach all four staff screens (`cua-hang`, `kho`, `clinic`, `cskh`). Each active staff role requires a branch assignment and can reach only its matching workspace. Customers receive 404; unverified/inactive/unprovisioned identities are redirected to login; unknown workspace slugs return 404 before identity/database access. Disabled/unavailable configuration renders a closed state. Pages authorize again after middleware refresh, and middleware preserves private cache headers/refreshed cookies for staff routes.

The portal contains descriptions and disabled task buttons only. No inventory/order/customer/clinic records or fixture business totals are fetched or presented. ERP APIs, business access, orders and customer data gates remain closed. The removed legacy ERP navigation link did not grant access to the new catalog capability.

`/api/session` exposes only server-computed `staffPortalAccess`/`catalogAccess` capability booleans, with `businessAccess:false`. The login form reads current server status and presents permitted portal links; it never trusts a client role for authorization. Login availability copy describes these actual scoped capabilities. The staff view receives the verified principal rather than a legacy token payload.

Local validation: focused staff/session/auth tests cover role/workspace matrix, unprovisioned/inactive/missing-branch users, unknown404, guest redirect, cross-workspace rejection, production flag closure, middleware cookie propagation, unchanged legacy ERP closure, server capability output and disabled rendered task buttons. These are local boundary checks, not live account/browser acceptance.

Root activation: set `NARI_STAFF_PORTAL_ENABLED=true` only in the private environment, restart the isolated dev process to load it, then verify the admin and at least one separately provisioned staff/customer identity in browser. Refresh login or sign in again to display the new link. No additional schema migration is required for this read-only portal; it uses the existing identity SELECT grant.

Rollback: set the portal flag false and restart; preserve the global business gate. Root records integrated checks and live results in handoff/progress/gap documentation.
