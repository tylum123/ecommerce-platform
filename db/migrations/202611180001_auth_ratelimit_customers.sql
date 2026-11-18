-- Additive auth rate limit and customer profile schema. Apply after 202611170001 and 202611170002.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nari_catalog_runtime')
    OR to_regclass('nari_identity.provisioned_identities') IS NULL THEN
    RAISE EXCEPTION 'Reviewed runtime role and identity schema required';
  END IF;
END;
$preflight$;

CREATE TABLE nari_identity.auth_rate_limits (
  id bigserial PRIMARY KEY,
  key text NOT NULL CHECK (btrim(key) <> ''),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX auth_rate_limits_key_created_at_idx
  ON nari_identity.auth_rate_limits (key, created_at DESC);

ALTER TABLE nari_identity.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE nari_identity.auth_rate_limits FROM PUBLIC;
REVOKE ALL ON SEQUENCE nari_identity.auth_rate_limits_id_seq FROM PUBLIC;

DO $revoke_rate_limits$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role', 'nari_catalog_runtime'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE nari_identity.auth_rate_limits FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SEQUENCE nari_identity.auth_rate_limits_id_seq FROM %I', api_role);
    END IF;
  END LOOP;
END;
$revoke_rate_limits$;

CREATE FUNCTION nari_identity.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, nari_identity
AS $fn$
DECLARE
  v_count integer;
BEGIN
  IF p_key IS NULL OR btrim(p_key) = '' THEN
    RAISE EXCEPTION 'RATE_LIMIT_KEY_INVALID';
  END IF;
  IF p_max_requests IS NULL OR p_max_requests <= 0 THEN
    RAISE EXCEPTION 'RATE_LIMIT_MAX_REQUESTS_INVALID';
  END IF;
  IF p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'RATE_LIMIT_WINDOW_SECONDS_INVALID';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rate_limit:' || p_key));

  DELETE FROM nari_identity.auth_rate_limits
  WHERE key = p_key
    AND created_at < clock_timestamp() - make_interval(secs => p_window_seconds);

  SELECT count(*)::integer INTO v_count
  FROM nari_identity.auth_rate_limits
  WHERE key = p_key;

  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retryAfterSeconds', p_window_seconds
    );
  END IF;

  INSERT INTO nari_identity.auth_rate_limits (key, created_at)
  VALUES (p_key, clock_timestamp());

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_count - 1,
    'retryAfterSeconds', 0
  );
END;
$fn$;

REVOKE ALL ON FUNCTION nari_identity.check_rate_limit(text, integer, integer) FROM PUBLIC;
DO $revoke_fn$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION nari_identity.check_rate_limit(text, integer, integer) FROM %I', api_role);
    END IF;
  END LOOP;
END;
$revoke_fn$;
GRANT EXECUTE ON FUNCTION nari_identity.check_rate_limit(text, integer, integer) TO nari_catalog_runtime;

CREATE TABLE nari_identity.customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  default_address text NOT NULL DEFAULT '',
  tier text NOT NULL DEFAULT 'Member' CHECK (tier IN ('Member', 'Silver', 'Gold', 'Diamond')),
  loyalty_points bigint NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE nari_identity.customer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE nari_identity.customer_profiles FROM PUBLIC;

DO $revoke_profiles$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON TABLE nari_identity.customer_profiles FROM %I', api_role);
    END IF;
  END LOOP;
END;
$revoke_profiles$;

GRANT SELECT, INSERT, UPDATE ON nari_identity.customer_profiles TO nari_catalog_runtime;

CREATE POLICY customer_profiles_runtime_select
  ON nari_identity.customer_profiles
  FOR SELECT
  TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE POLICY customer_profiles_runtime_insert
  ON nari_identity.customer_profiles
  FOR INSERT
  TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE POLICY customer_profiles_runtime_update
  ON nari_identity.customer_profiles
  FOR UPDATE
  TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated')
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

COMMIT;
