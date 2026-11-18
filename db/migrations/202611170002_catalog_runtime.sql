-- PREPARED ONLY: review and apply after catalog + identity migrations in staging.
-- Creates a dedicated group, never modifies/grants membership to an existing login.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nari_catalog_runtime') THEN
    RAISE EXCEPTION 'nari_catalog_runtime already exists; review existing privileges before applying';
  END IF;
  IF to_regclass('nari_identity.provisioned_identities') IS NULL
    OR to_regclass('nari_catalog.sources') IS NULL
    OR to_regclass('nari_catalog.products') IS NULL THEN
    RAISE EXCEPTION 'Catalog and identity migrations must be applied first';
  END IF;
END;
$preflight$;

CREATE ROLE nari_catalog_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOINHERIT NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA nari_catalog, nari_identity TO nari_catalog_runtime;
GRANT SELECT ON nari_catalog.sources, nari_catalog.brands, nari_catalog.categories,
  nari_catalog.products, nari_catalog.product_images, nari_catalog.product_specs,
  nari_catalog.home_banners, nari_identity.provisioned_identities TO nari_catalog_runtime;
GRANT INSERT, UPDATE ON nari_catalog.products TO nari_catalog_runtime;
GRANT INSERT, DELETE ON nari_catalog.product_images, nari_catalog.product_specs,
  nari_catalog.home_banners TO nari_catalog_runtime;

-- Server-owned group only. No anon/authenticated policies or role self-provisioning.
CREATE POLICY catalog_runtime_read ON nari_catalog.sources FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.brands FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.categories FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.products FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.product_images FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.product_specs FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_read ON nari_catalog.home_banners FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_identity_read ON nari_identity.provisioned_identities FOR SELECT TO nari_catalog_runtime USING (true);

CREATE POLICY catalog_runtime_insert ON nari_catalog.products FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY catalog_runtime_update ON nari_catalog.products FOR UPDATE TO nari_catalog_runtime USING (true) WITH CHECK (true);
CREATE POLICY catalog_runtime_insert ON nari_catalog.product_images FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY catalog_runtime_delete ON nari_catalog.product_images FOR DELETE TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_insert ON nari_catalog.product_specs FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY catalog_runtime_delete ON nari_catalog.product_specs FOR DELETE TO nari_catalog_runtime USING (true);
CREATE POLICY catalog_runtime_insert ON nari_catalog.home_banners FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY catalog_runtime_delete ON nari_catalog.home_banners FOR DELETE TO nari_catalog_runtime USING (true);

-- No schema CREATE, sequences, identity writes, source/reference writes, inventory,
-- branches, orders or role memberships are granted. A separate reviewed non-owner
-- LOGIN may inherit this group; use that credential for NARI_POSTGRES_URL.
COMMIT;
