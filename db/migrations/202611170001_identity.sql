-- Reviewed local draft only. Run against an isolated Supabase staging project,
-- never automatically on production. Requires Supabase auth.users to exist.
BEGIN;
CREATE SCHEMA IF NOT EXISTS nari_identity;
REVOKE ALL ON SCHEMA nari_identity FROM PUBLIC, anon, authenticated;

CREATE TABLE nari_identity.provisioned_identities (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'store_manager', 'warehouse_staff', 'clinic_doctor', 'cs_agent', 'customer')),
  active boolean NOT NULL DEFAULT false,
  full_name text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 1 AND 200),
  branch_id text CHECK (branch_id IS NULL OR length(btrim(branch_id)) BETWEEN 1 AND 80),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (role IN ('admin', 'customer') OR branch_id IS NOT NULL)
);
ALTER TABLE nari_identity.provisioned_identities ENABLE ROW LEVEL SECURITY;
-- No public policies, RPCs, signup triggers, grants or automatic admin records.
REVOKE ALL ON nari_identity.provisioned_identities FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_identity REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
COMMIT;
