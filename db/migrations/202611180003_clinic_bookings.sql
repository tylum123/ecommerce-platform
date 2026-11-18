-- PostgreSQL 15+ / Supabase. Clinic services, appointments (GiST overlap prevention),
-- and merchant branch authoring for nari_catalog_runtime.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles
    WHERE rolname = 'nari_catalog_runtime'
      AND NOT rolsuper
      AND NOT rolbypassrls
      AND NOT rolcanlogin
  ) OR to_regclass('nari_catalog.branches') IS NULL THEN
    RAISE EXCEPTION 'Reviewed nari_catalog_runtime role and nari_catalog.branches table are required';
  END IF;
END;
$preflight$;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Grant merchant INSERT ONLY on nari_catalog.branches (SELECT is granted in 202611180002).
GRANT INSERT ON nari_catalog.branches TO nari_catalog_runtime;
CREATE POLICY branches_runtime_merchant_insert ON nari_catalog.branches
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (NOT is_demo AND source_id IS NULL);

CREATE SCHEMA nari_clinic;
REVOKE ALL ON SCHEMA nari_clinic FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_clinic REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_clinic REVOKE ALL ON SEQUENCES FROM PUBLIC;
GRANT USAGE ON SCHEMA nari_clinic TO nari_catalog_runtime;

CREATE TABLE nari_clinic.services (
  id text PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  name text NOT NULL CHECK (btrim(name) <> ''),
  category text NOT NULL,
  price bigint NOT NULL CHECK (price BETWEEN 0 AND 9007199254740991),
  market_price bigint NOT NULL CHECK (market_price BETWEEN price AND 9007199254740991),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE nari_clinic.appointments (
  id text PRIMARY KEY,
  booking_code text UNIQUE NOT NULL,
  branch_id text NOT NULL REFERENCES nari_catalog.branches(id) ON DELETE RESTRICT,
  service_id text REFERENCES nari_clinic.services(id) ON DELETE RESTRICT,
  service_name text NOT NULL CHECK (btrim(service_name) <> ''),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL CHECK (btrim(customer_name) <> ''),
  customer_phone text NOT NULL CHECK (customer_phone ~ '^0[0-9]{9}$'),
  during tstzrange NOT NULL,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'completed', 'cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  EXCLUDE USING gist (branch_id WITH =, during WITH &&) WHERE (status <> 'cancelled')
);

CREATE INDEX appointments_branch_created_idx ON nari_clinic.appointments(branch_id, created_at DESC);
CREATE INDEX appointments_user_idx ON nari_clinic.appointments(user_id) WHERE user_id IS NOT NULL;

DO $migration$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['services', 'appointments'] LOOP
    EXECUTE format('ALTER TABLE nari_clinic.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE nari_clinic.%I FROM PUBLIC', table_name);
  END LOOP;
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA nari_clinic FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA nari_clinic FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA nari_clinic FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_clinic REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_clinic REVOKE ALL ON SEQUENCES FROM %I', api_role);
    END IF;
  END LOOP;
END;
$migration$;

GRANT SELECT, INSERT, UPDATE ON nari_clinic.services, nari_clinic.appointments TO nari_catalog_runtime;

CREATE POLICY clinic_services_runtime_read ON nari_clinic.services
  FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY clinic_services_runtime_insert ON nari_clinic.services
  FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY clinic_services_runtime_update ON nari_clinic.services
  FOR UPDATE TO nari_catalog_runtime USING (true) WITH CHECK (true);

CREATE POLICY clinic_appointments_runtime_read ON nari_clinic.appointments
  FOR SELECT TO nari_catalog_runtime USING (true);
CREATE POLICY clinic_appointments_runtime_insert ON nari_clinic.appointments
  FOR INSERT TO nari_catalog_runtime WITH CHECK (true);
CREATE POLICY clinic_appointments_runtime_update ON nari_clinic.appointments
  FOR UPDATE TO nari_catalog_runtime USING (true) WITH CHECK (true);

COMMIT;
