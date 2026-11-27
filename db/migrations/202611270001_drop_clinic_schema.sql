-- PostgreSQL 15+ / Supabase. Drop deprecated nari_clinic schema.
-- Preserves nari_catalog.branches (used by store locator & checkout delivery /thanh-toan).
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DROP SCHEMA IF EXISTS nari_clinic CASCADE;

COMMIT;
