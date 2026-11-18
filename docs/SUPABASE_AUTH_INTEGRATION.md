# Supabase Auth integration boundary

17/11/2026 — local identity preview implemented; live provider acceptance blocked.
No cloud mutation, provisioned account, role assignment or business API enablement
has occurred. Production always returns 503 for `/api/session` in this wave.

## Implemented locally

- Exact SDK pins: `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.119.0.
- Optional `/dang-nhap` form requires `NARI_AUTH_ENABLED="true"`, nonproduction
  `NODE_ENV`, valid `NEXT_PUBLIC_SUPABASE_URL`, publishable-only
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and exact `APP_ORIGIN`. Missing/invalid
  config shows the existing unavailable screen and session endpoints return 503.
- POST accepts email/password or `{ "action": "logout" }`, exact Origin and JSON
  only, at most 4096 actual bytes; role/extra input is rejected. Generic errors
  never expose provider details or credentials. Login returns no raw tokens.
- Local process limiter: five attempts/account/15 minutes, 30 attempts globally
  per minute, at most 1024 account hashes; expires entries and rejects overflow.
  Forwarded IP headers are ignored. This is not distributed protection; replacing
  it with a shared limiter is required before removing the production gate.
- Request-scoped SDK `getAll/setAll` adapter copies refreshed/chunked/removal
  cookies to request and response, honors SDK cache headers, and returns private
  no-store responses even on errors. Cookies are HttpOnly, SameSite=Lax, path=/,
  Secure on HTTPS. No browser Supabase client is used; refresh runs within the
  session Route Handler, not a new global Proxy.
- GET verifies with `auth.getUser()`. Every authenticated response still carries
  `businessAccess:false`; existing portals, legacy JWT verifier and business
  `authorizeRequest` remain closed. The old `/api/auth` logout delegates to the
  provider when configured, uses local-session revocation, and reports failures.
  The preview form clears stale local UI state only after successful operations.
- `createIdentityRoleRepository` reads a parameterized private role table through
  an injected trusted SQL connection. Draft migration
  `db/migrations/202611170001_identity.sql` references `auth.users`, denies direct
  public/anon/authenticated access and creates no roles, policies or signup trigger.
  It is not wired into HTTP authorization and has not run against PostgreSQL.

## Verification and limits

Focused Node tests cover actual byte limits, strict input/origin, limiter windows,
production/config denial before SDK construction, cookie refresh/removal adapter,
session route success/failure, metadata exclusion and parameterized role lookup.
These tests inject the provider. They do not prove real Supabase authentication,
refresh/revocation, migration execution, RLS or browser success with credentials.
Existing auth/order denial tests also pass. Root owns final typecheck/lint/build
and browser acceptance. No credentials were read, printed or fabricated.

`src/lib/server/supabase-principal.ts` defines the boundary between a verified
Supabase user and the existing permission policy. Its auth dependency must call
`supabase.auth.getUser()`, which obtains a server-confirmed user. Do not supply a
decoded JWT, `getSession()` result, browser role or `user_metadata` as verification.
The role repository must read current, server-owned provisioning data by that
verified user ID. Missing/disabled/unknown roles deny access. Staff require an
explicit branch; admin retains the existing `hasPermission` and `canAccessBranch`
override. No role records or credentials are embedded in source.

Before enabling the existing API boundary:

1. Configure the project URL and publishable key in the private environment.
   Never supply a service-role/secret key to browser code.
2. Replace the local limiter with shared durable protection and verify the real
   session lifecycle before enabling production. Add Proxy refresh only when
   Server Components start depending on authenticated sessions; it never replaces
   permission checks at individual sensitive data entries.
3. Create a reviewed role/provisioning table linked to `auth.users`. Public users
   must not be able to write role, active status or branch assignment. Provision
   the first admin through a protected administrative process, then test revocation.
4. Implement the `IdentityRoleRepository` against that table and pass verified
   principals to each server entry. For cookie mutations require exact Origin
   matching the configured application origin, in addition to provider protection.
   Check permissions plus resource ownership/branch in the query itself.
5. Test real login/logout, refreshed and revoked tokens, a forged cookie,
   customer/staff escalation, wrong branch, role changes and expired sessions.
   Only then wire the business `authorizeRequest` boundary and protected pages.

Business authorization remains a separate acceptance gate. Mapping/adapter tests
do not establish SDK connectivity or a live Supabase session.

Sources: [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[Supabase SSR](https://supabase.com/docs/guides/auth/server-side).
Reviewed official [signOut semantics](https://supabase.com/docs/reference/javascript/auth-signout)
and [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
Local framework references read before edits: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`,
`01-app/03-api-reference/04-functions/cookies.md`, `01-app/03-api-reference/03-file-conventions/proxy.md`
and `01-app/01-getting-started/15-route-handlers.md`.
