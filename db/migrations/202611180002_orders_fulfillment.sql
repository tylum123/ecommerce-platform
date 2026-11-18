-- PostgreSQL 15+ / Supabase orders, idempotency, and branch inventory reservation.
-- Intentionally fails if nari_orders already exists or runtime prerequisites are missing.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'nari_catalog_runtime'
      AND NOT rolsuper
      AND NOT rolbypassrls
      AND NOT rolcanlogin
  ) THEN
    RAISE EXCEPTION 'nari_catalog_runtime role must exist as NOLOGIN/NOSUPERUSER/NOBYPASSRLS before applying orders migration';
  END IF;

  IF to_regclass('nari_catalog.products') IS NULL
     OR to_regclass('nari_catalog.branches') IS NULL
     OR to_regclass('nari_catalog.inventory_balances') IS NULL
     OR to_regclass('nari_catalog.inventory_movements') IS NULL THEN
    RAISE EXCEPTION 'nari_catalog tables (products, branches, inventory_balances, inventory_movements) are required before applying orders migration';
  END IF;

  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'auth.users is required before applying orders migration';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'nari_orders') THEN
    RAISE EXCEPTION 'nari_orders schema already exists; refuse to apply over partial or existing DDL';
  END IF;
END;
$preflight$;

-- Grant narrow runtime access to merchant-verified branches and branch inventory reservation tables.
GRANT SELECT ON nari_catalog.branches TO nari_catalog_runtime;
CREATE POLICY branches_runtime_select ON nari_catalog.branches
  FOR SELECT TO nari_catalog_runtime
  USING (
    NOT is_demo
    AND (
      source_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM nari_catalog.sources s
        WHERE s.id = branches.source_id
          AND s.verification_state = 'merchant'
      )
    )
  );

GRANT SELECT, INSERT, UPDATE ON nari_catalog.inventory_balances TO nari_catalog_runtime;
CREATE POLICY inventory_balances_runtime_select ON nari_catalog.inventory_balances
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY inventory_balances_runtime_insert ON nari_catalog.inventory_balances
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY inventory_balances_runtime_update ON nari_catalog.inventory_balances
  FOR UPDATE TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated')
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

-- Inventory movement ledger is strictly append-only for runtime.
GRANT SELECT, INSERT ON nari_catalog.inventory_movements TO nari_catalog_runtime;
CREATE POLICY inventory_movements_runtime_select ON nari_catalog.inventory_movements
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY inventory_movements_runtime_insert ON nari_catalog.inventory_movements
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE SCHEMA nari_orders;
REVOKE ALL ON SCHEMA nari_orders FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_orders REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA nari_orders REVOKE ALL ON SEQUENCES FROM PUBLIC;
GRANT USAGE ON SCHEMA nari_orders TO nari_catalog_runtime;

CREATE TABLE nari_orders.idempotency_keys (
  key text PRIMARY KEY CHECK (length(key) BETWEEN 8 AND 128),
  scope text NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'completed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE nari_orders.orders (
  id text PRIMARY KEY,
  order_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  branch_id text REFERENCES nari_catalog.branches(id) ON DELETE RESTRICT,
  recipient_name text NOT NULL CHECK (btrim(recipient_name) <> ''),
  recipient_phone text NOT NULL CHECK (recipient_phone ~ '^0[0-9]{9}$'),
  shipping_address text NOT NULL CHECK (btrim(shipping_address) <> ''),
  delivery_type text NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled', 'returned')),
  subtotal bigint NOT NULL CHECK (subtotal BETWEEN 0 AND 9007199254740991),
  shipping_fee bigint NOT NULL CHECK (shipping_fee BETWEEN 0 AND 9007199254740991),
  discount_amount bigint NOT NULL DEFAULT 0 CHECK (discount_amount BETWEEN 0 AND 9007199254740991),
  total_amount bigint NOT NULL CHECK (total_amount BETWEEN 0 AND 9007199254740991),
  notes text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX orders_user_created_idx ON nari_orders.orders(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX orders_code_phone_idx ON nari_orders.orders(order_code, recipient_phone);
CREATE INDEX orders_status_created_idx ON nari_orders.orders(status, created_at DESC);

CREATE TABLE nari_orders.order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES nari_orders.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES nari_catalog.products(id) ON DELETE RESTRICT,
  sku text NOT NULL,
  product_name text NOT NULL,
  unit_price bigint NOT NULL CHECK (unit_price BETWEEN 0 AND 9007199254740991),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  line_total bigint NOT NULL CHECK (line_total BETWEEN 0 AND 9007199254740991)
);
CREATE INDEX order_items_order_idx ON nari_orders.order_items(order_id);

CREATE TABLE nari_orders.order_events (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES nari_orders.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX order_events_order_time_idx ON nari_orders.order_events(order_id, created_at ASC);

DO $migration$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['idempotency_keys', 'orders', 'order_items', 'order_events'] LOOP
    EXECUTE format('ALTER TABLE nari_orders.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE nari_orders.%I FROM PUBLIC', table_name);
  END LOOP;

  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA nari_orders FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA nari_orders FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA nari_orders FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_orders REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA nari_orders REVOKE ALL ON SEQUENCES FROM %I', api_role);
    END IF;
  END LOOP;
END;
$migration$;

GRANT SELECT, INSERT, UPDATE ON nari_orders.idempotency_keys, nari_orders.orders TO nari_catalog_runtime;
GRANT SELECT, INSERT ON nari_orders.order_items, nari_orders.order_events TO nari_catalog_runtime;

CREATE POLICY idempotency_keys_runtime_select ON nari_orders.idempotency_keys
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY idempotency_keys_runtime_insert ON nari_orders.idempotency_keys
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY idempotency_keys_runtime_update ON nari_orders.idempotency_keys
  FOR UPDATE TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated')
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE POLICY orders_runtime_select ON nari_orders.orders
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY orders_runtime_insert ON nari_orders.orders
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY orders_runtime_update ON nari_orders.orders
  FOR UPDATE TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated')
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE POLICY order_items_runtime_select ON nari_orders.order_items
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY order_items_runtime_insert ON nari_orders.order_items
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

CREATE POLICY order_events_runtime_select ON nari_orders.order_events
  FOR SELECT TO nari_catalog_runtime
  USING (current_user <> 'anon' AND current_user <> 'authenticated');
CREATE POLICY order_events_runtime_insert ON nari_orders.order_events
  FOR INSERT TO nari_catalog_runtime
  WITH CHECK (current_user <> 'anon' AND current_user <> 'authenticated');

COMMIT;
