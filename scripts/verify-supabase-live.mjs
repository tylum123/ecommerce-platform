#!/usr/bin/env node
// Operational checks only. Load credentials with node --env-file=.env; never print them.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'nari-catalog';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
class VerificationError extends Error {
  constructor(code) { super(code); this.code = code; }
}
function requireCheck(condition, code) { if (!condition) throw new VerificationError(code); }

/** Fixed diagnostic codes only: driver/provider messages may contain credentials or URLs. */
export function safeFailureCode(error) {
  if (error instanceof VerificationError) return error.code;
  const allowed = new Set(['ENOTFOUND','EAI_AGAIN','ETIMEDOUT','ECONNREFUSED','ECONNRESET',
    'SELF_SIGNED_CERT_IN_CHAIN','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY','CERT_HAS_EXPIRED','ERR_TLS_CERT_ALTNAME_INVALID',
    '28P01','28000','42501']);
  return error && typeof error === 'object' && allowed.has(error.code) ? error.code : 'OPERATION_FAILED';
}

/** Evaluate the installed application's real config function without Next's server-only marker.
 * Typescript is an existing development dependency; no alternate TLS config is maintained here.
 */
export function runtimePostgresConfig(env = process.env) {
  const filename = fileURLToPath(new URL('../src/lib/server/postgres-database.ts', import.meta.url));
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const requireModule = createRequire(import.meta.url);
  new Function('module', 'exports', 'require', output)(mod, mod.exports, id => {
    if (id === 'server-only') return {};
    requireCheck(id === 'pg', 'CONFIG_DEPENDENCY_CHANGED');
    return requireModule(id);
  });
  try { return mod.exports.postgresPoolConfig(env); } catch { throw new VerificationError('POSTGRES_CONFIG_INVALID'); }
}

export function expectedDatabaseSpec(wave3Applied) {
  const baseTables = {
    'nari_catalog.sources': [true, false, false, false],
    'nari_catalog.brands': [true, true, false, false],
    'nari_catalog.categories': [true, true, false, false],
    'nari_catalog.products': [true, true, true, false],
    'nari_catalog.product_images': [true, true, false, true],
    'nari_catalog.product_specs': [true, true, false, true],
    'nari_catalog.home_banners': [true, true, false, true],
    'nari_identity.provisioned_identities': [true, false, false, false],
  };
  if (!wave3Applied) {
    return {
      schemas: ['nari_catalog', 'nari_identity'],
      expected: baseTables,
      minPolicies: 18,
      exactPolicies: 18,
      deniedUpdateTargets: [
        'UPDATE nari_identity.provisioned_identities SET active=active WHERE false',
        'UPDATE nari_catalog.inventory_balances SET total_stock=total_stock WHERE false',
      ],
    };
  }
  return {
    schemas: ['nari_catalog', 'nari_identity', 'nari_orders', 'nari_clinic'],
    expected: {
      ...baseTables,
      'nari_catalog.branches': [true, true, false, false],
      'nari_catalog.inventory_balances': [true, true, true, false],
      'nari_catalog.inventory_movements': [true, true, false, false],
      'nari_identity.auth_rate_limits': [false, false, false, false],
      'nari_identity.customer_profiles': [true, true, true, false],
      'nari_orders.idempotency_keys': [true, true, true, false],
      'nari_orders.orders': [true, true, true, false],
      'nari_orders.order_items': [true, true, false, false],
      'nari_orders.order_events': [true, true, false, false],
      'nari_clinic.services': [true, true, true, false],
      'nari_clinic.appointments': [true, true, true, false],
    },
    minPolicies: 35,
    exactPolicies: null,
    deniedUpdateTargets: [
      'UPDATE nari_identity.provisioned_identities SET active=active WHERE false',
      'DELETE FROM nari_catalog.inventory_movements WHERE false',
      'DELETE FROM nari_orders.order_events WHERE false',
    ],
  };
}

export async function verifyDatabase() {
  const config = runtimePostgresConfig();
  requireCheck(config.ssl && config.ssl.rejectUnauthorized === true, 'VERIFIED_TLS_REQUIRED');
  const client = new pg.Client(config);
  try {
    await client.connect();
    const { rows: [role] } = await client.query(`SELECT current_user AS name, r.rolsuper, r.rolbypassrls,
      r.rolcreatedb, r.rolcreaterole, r.rolreplication,
      pg_has_role(current_user, 'nari_catalog_runtime', 'USAGE') AS runtime_member,
      current_setting('row_security') AS row_security
      FROM pg_roles r WHERE r.rolname=current_user`);
    requireCheck(role && !role.rolsuper && !role.rolbypassrls && !role.rolcreatedb && !role.rolcreaterole && !role.rolreplication && role.runtime_member && role.row_security === 'on', 'RUNTIME_ROLE_UNSAFE');
    const { rows: wave3Schemas } = await client.query("SELECT nspname FROM pg_namespace WHERE nspname IN ('nari_orders', 'nari_clinic')");
    const wave3Applied = wave3Schemas.length === 2;
    const spec = expectedDatabaseSpec(wave3Applied);
    const schemaPlaceholders = spec.schemas.map((_, i) => `$${i + 1}`).join(',');
    const { rows: tables } = await client.query(`SELECT n.nspname AS schema, c.relname AS name, c.relrowsecurity AS rls,
      c.relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned,
      has_table_privilege(current_user,c.oid,'SELECT') AS can_select,
      has_table_privilege(current_user,c.oid,'INSERT') AS can_insert,
      has_table_privilege(current_user,c.oid,'UPDATE') AS can_update,
      has_table_privilege(current_user,c.oid,'DELETE') AS can_delete,
      has_table_privilege(current_user,c.oid,'TRUNCATE') AS can_truncate
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname IN (${schemaPlaceholders}) AND c.relkind='r' ORDER BY n.nspname,c.relname`, spec.schemas);
    for (const [qualifiedName, privileges] of Object.entries(spec.expected)) {
      const [schemaName, tableName] = qualifiedName.split('.');
      const table = tables.find(row => row.schema === schemaName && row.name === tableName);
      requireCheck(table && table.rls && !table.owned && !table.can_truncate, 'TABLE_BOUNDARY_UNSAFE');
      requireCheck(JSON.stringify([table.can_select,table.can_insert,table.can_update,table.can_delete]) === JSON.stringify(privileges), 'RUNTIME_GRANTS_MISMATCH');
    }
    for (const table of tables.filter(row => !Object.hasOwn(spec.expected, `${row.schema}.${row.name}`))) {
      requireCheck(!table.owned && !table.can_select && !table.can_insert && !table.can_update && !table.can_delete && !table.can_truncate, 'UNEXPECTED_BUSINESS_ACCESS');
    }
    const { rows: schemas } = await client.query(`SELECT nspname, has_schema_privilege(current_user,oid,'CREATE') AS can_create, nspowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned FROM pg_namespace WHERE nspname IN (${schemaPlaceholders})`, spec.schemas);
    requireCheck(schemas.length === spec.schemas.length && schemas.every(row => !row.can_create && !row.owned), 'SCHEMA_BOUNDARY_UNSAFE');
    const { rows: policies } = await client.query(`SELECT schemaname,tablename,policyname,cmd FROM pg_policies WHERE schemaname IN (${schemaPlaceholders}) AND 'nari_catalog_runtime'=ANY(roles)`, spec.schemas);
    requireCheck(spec.exactPolicies !== null ? policies.length === spec.exactPolicies : policies.length >= spec.minPolicies, 'RLS_POLICIES_MISMATCH');
    const counts = {};
    for (const qualifiedName of Object.keys(spec.expected)) {
      if (qualifiedName === 'nari_identity.auth_rate_limits') continue;
      const [schemaName, tableName] = qualifiedName.split('.');
      const result = await client.query(`SELECT count(*)::text AS count FROM ${schemaName}.${tableName}`);
      counts[qualifiedName] = result.rows[0].count;
    }
    for (const sql of spec.deniedUpdateTargets) {
      await client.query('BEGIN');
      let denied = false;
      try { await client.query(sql); } catch (error) { denied = error?.code === '42501'; }
      finally { await client.query('ROLLBACK'); }
      requireCheck(denied, 'WRITE_DENIAL_CHECK_FAILED');
    }
    console.log(JSON.stringify({ check:'database', ok:true, wave3Applied, currentUser:role.name, verifiedTls:true, rls:true, runtimePolicies:policies.length, deniedWrites:true, counts }));
  } finally { await client.end().catch(() => {}); }
}

function storageClient() {
  let project;
  try { project = new URL(process.env.SUPABASE_URL || ''); } catch { throw new VerificationError('STORAGE_CONFIG_INVALID'); }
  requireCheck(project.protocol === 'https:' && project.href === `${project.origin}/` && !project.username && !project.password && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(), 'STORAGE_CONFIG_INVALID');
  requireCheck(!process.env.NARI_STORAGE_BUCKET || process.env.NARI_STORAGE_BUCKET === BUCKET, 'BUCKET_TARGET_MISMATCH');
  requireCheck(!process.env.NARI_STORAGE_PUBLIC_ORIGIN || new URL(process.env.NARI_STORAGE_PUBLIC_ORIGIN).origin === project.origin, 'STORAGE_ORIGIN_MISMATCH');
  const client = createClient(project.origin, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false },
    global:{ fetch:(input, init) => fetch(input, { ...init, signal:init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) },
  });
  return { client, origin:project.origin };
}

export function validateBucket(bucket) {
  requireCheck(bucket && bucket.id === BUCKET && bucket.public === true && Number(bucket.file_size_limit) === MAX_IMAGE_BYTES &&
    Array.isArray(bucket.allowed_mime_types) && JSON.stringify([...bucket.allowed_mime_types].sort()) === JSON.stringify([...MIME_TYPES].sort()), 'BUCKET_POLICY_CONFLICT');
}

export async function verifyStorage(setup, objectPath) {
  const { client, origin } = storageClient();
  let { data:bucket, error } = await client.storage.getBucket(BUCKET);
  if (error && setup && String(error.statusCode) === '404') {
    const created = await client.storage.createBucket(BUCKET, { public:true, fileSizeLimit:MAX_IMAGE_BYTES, allowedMimeTypes:MIME_TYPES });
    requireCheck(!created.error, 'BUCKET_CREATE_FAILED');
    ({ data:bucket, error } = await client.storage.getBucket(BUCKET));
  }
  requireCheck(!error, 'BUCKET_INSPECTION_FAILED');
  validateBucket(bucket); // Existing conflicting buckets are never overwritten.
  let publicReadback = false;
  if (objectPath) {
    requireCheck(/^catalog\/[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/.test(objectPath), 'OBJECT_PATH_INVALID');
    const response = await fetch(`${origin}/storage/v1/object/public/${BUCKET}/${objectPath}`, { redirect:'error', signal:AbortSignal.timeout(15000) });
    requireCheck(response.ok && MIME_TYPES.includes(response.headers.get('content-type')?.split(';')[0]), 'PUBLIC_READBACK_FAILED');
    requireCheck(response.body, 'PUBLIC_READBACK_FAILED');
    const reader = response.body.getReader();
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new VerificationError('PUBLIC_READBACK_TOO_LARGE'); }
      }
    } finally { reader.releaseLock(); }
    requireCheck(size > 0, 'PUBLIC_READBACK_EMPTY');
    publicReadback = true;
  }
  console.log(JSON.stringify({ check:setup ? 'storage-setup' : 'storage-check', ok:true, bucket:BUCKET, public:true, maxBytes:MAX_IMAGE_BYTES, mimeTypes:MIME_TYPES, publicReadback }));
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && ['--help','-h'].includes(argv[0])) {
    console.log('Usage: node --env-file=.env scripts/verify-supabase-live.mjs --database | --storage-setup | --storage-check [--path catalog/EXISTING_OBJECT.png]\nDatabase is read-only except zero-row denied-write probes inside ROLLBACK. Storage setup only creates nari-catalog if absent; conflicts fail. Storage check does not upload. No .env file is read by this script.');
    return;
  }
  requireCheck(['--database','--storage-setup','--storage-check'].includes(argv[0]) && (argv.length === 1 || (argv[0] === '--storage-check' && argv.length === 3 && argv[1] === '--path')), 'INVALID_ARGUMENTS');
  if (argv[0] === '--database') await verifyDatabase();
  else await verifyStorage(argv[0] === '--storage-setup', argv[2]);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => { console.error(`[verify] FAIL: ${safeFailureCode(error)}`); process.exitCode = 1; });
}
