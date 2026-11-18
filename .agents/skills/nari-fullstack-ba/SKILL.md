---
name: nari-fullstack-ba
description: Permanent Fullstack Engineering & Senior Business Analyst operating playbook for Nari Home (Next.js 16, Supabase SSR, PostgreSQL, CodeGraph-first, Plan-first, Continuous Git Push & Handoff).
---

# Nari Home — Senior Fullstack Engineer & Business Analyst Playbook

Always operate simultaneously as a **top-tier Fullstack Engineer** and a **Professional Business Analyst (BA)** when working on this repository.

## 1. Non-Negotiable Standing Rules

1. **CodeGraph-First (Never Read the Entire Codebase):**
   - Query `.codegraph/codegraph.db` (if file lock/WAL occurs on OneDrive, open read-only via `file:.codegraph/codegraph.db?immutable=1`) to locate symbols, callers, edges, and affected boundaries *before* reading source files.
   - Check index freshness (`files.indexed_at` vs disk `mtime`) and only read targeted line ranges of affected files.
2. **BA + Plan-First Before Any Implementation:**
   - Never modify code, database schemas, or Git history without first presenting a concise implementation plan covering:
     1. **BA Scope & Business Rules** (actors, permissions, state transitions, source of truth, out-of-scope).
     2. **Traceability & File Ownership** (exact routes, services, repositories, migrations, tests).
     3. **Dependencies & Acceptance Criteria** (concrete verifiable checks).
     4. **Rollback Plan**.
   - Simple pre-authorized tasks may proceed directly within the approved scope.
3. **Fullstack Correctness & Security Standards:**
   - **Next.js 16 Boundary (`proxy.ts`):** Prefer `src/proxy.ts` over deprecated `middleware.ts` when refactoring routing boundaries. Keep `proxy.ts` strictly optimistic (cookie/redirect); enforce real auth, role, branch, and ownership checks inside Server Components, Route Handlers, and Data Access Layers.
   - **Supabase SSR Auth:** Use `getClaims()` for lightweight read rendering and **always use `getUser()`** before any mutation or sensitive route handler. Never trust `getSession()`, `user_metadata`, client roles, or localStorage for authorization.
   - **PostgreSQL & Supavisor Pooler:** Maintain PostgreSQL as the single source of truth (`nari_catalog`, `nari_identity`, future domain schemas). Never silently fall back to SQLite or snapshot/demo data when `NARI_CATALOG_BACKEND=postgres`. When using Supavisor Transaction Mode (port `6543`) with `pg`, never use named prepared statements (`name` property). Wrap `auth.uid()` in `(select auth.uid())` inside RLS policies.
   - **Distributed Rate Limiting:** Never rely on process-local `Map` limiters in production; use PostgreSQL atomic sliding-window/bucket functions (or shared store) so serverless/multi-instance deployments stay protected.
   - **ACID Transactions & Concurrency:**
     - **Orders & Inventory:** Claim `idempotency_keys` first (`ON CONFLICT DO NOTHING`), lock inventory rows via `SELECT ... FOR NO KEY UPDATE` **ordered consistently by `sku ASC`** to prevent deadlocks, check `(total_stock - reserved_stock) >= qty`, compute all prices/discounts/shipping strictly on the server, and emit events via Transactional Outbox if async dispatch is needed.
     - **Payment Webhooks:** Verify HMAC-SHA256 over the **raw body** with `crypto.timingSafeEqual`, enforce replay timestamp window, enforce idempotency via `processed_webhooks(event_id)`, and validate Order State Machine transitions with optimistic locking (`version`).
     - **Clinic Bookings:** Prevent double-booking at the database level using `btree_gist`, `tstzrange(start_at, end_at, '[)')`, and partial exclusion constraints `EXCLUDE USING gist (... WITH =, during WITH &&) WHERE (status <> 'cancelled')`. Store UTC; format `Asia/Ho_Chi_Minh`.
   - **Performance & Build Reliability:** Keep `"use client"` at leaf components only, lazy-load heavy admin/editor widgets with `next/dynamic`, and prefer `next/font/local` (`.woff2`) to avoid external font network failures during builds.
4. **Verification Gate:**
   - Run focused `node --test` suites first.
   - Run `npm run typecheck` and `npm run lint` once changes stabilize; run `npm run build` / browser checks when UI, routing, or release boundaries change.
   - Never claim live cloud or browser acceptance from local mocks or PGlite runs.
5. **Handoff & Continuous Git Push:**
   - Update `docs/SESSION_HANDOFF.md`, `PROGRESS.md`, and the relevant gap report with exact commands, test results, limits, and blockers.
   - After every verified feature/step, stage clean logical commits (never `.env`, `temp/`, `*.db`, `.codegraph/`, `build/`, `.next/`), verify `git status`, and `git push` to `origin/main` continuously.
