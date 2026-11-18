-- Additive merchant reference authoring only. Apply after 202611170002.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='nari_catalog_runtime' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin)
    OR to_regclass('nari_catalog.brands') IS NULL OR to_regclass('nari_catalog.categories') IS NULL THEN
    RAISE EXCEPTION 'Reviewed catalog runtime group and reference tables required';
  END IF;
END;
$preflight$;
GRANT INSERT ON nari_catalog.brands, nari_catalog.categories TO nari_catalog_runtime;
CREATE POLICY catalog_runtime_merchant_insert ON nari_catalog.brands FOR INSERT TO nari_catalog_runtime
  WITH CHECK (NOT is_demo AND source_id IS NULL);
CREATE POLICY catalog_runtime_merchant_insert ON nari_catalog.categories FOR INSERT TO nari_catalog_runtime
  WITH CHECK (NOT is_demo AND source_id IS NULL);
-- No UPDATE, DELETE, provenance changes, source/identity/inventory/order grants.
COMMIT;
