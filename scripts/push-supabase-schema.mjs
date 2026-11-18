#!/usr/bin/env node
/**
 * Supabase / PostgreSQL schema push tool (ESM).
 *
 * Usage:
 *   node --env-file=.env scripts/push-supabase-schema.mjs --dry-run
 *   node --env-file=.env scripts/push-supabase-schema.mjs --apply
 *   node --env-file=.env scripts/push-supabase-schema.mjs --apply --with-roles
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CORE_MIGRATIONS = [
  'db/migrations/202611160001_catalog_inventory.sql',
];

const PROVIDER_ROLE_MIGRATIONS = [
  'db/migrations/202611170001_identity.sql',
];

const WAVE3_BACKEND_MIGRATIONS = [
  'db/migrations/202611180001_auth_ratelimit_customers.sql',
  'db/migrations/202611180002_orders_fulfillment.sql',
  'db/migrations/202611180003_clinic_bookings.sql',
];

const PLACEHOLDER_PATTERNS = [
  /YOUR_/i,
  /\[YOUR-/i,
  /\bexample\b/i,
  /changeme/i,
  /<[^>]+>/,
  /\[password\]/i,
  /\[project-ref\]/i,
];

function loadDotEnvIfPresent(envPath) {
  if (!fs.existsSync(envPath)) return false;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return true;
}

function hasPlaceholder(value) {
  if (!value) return false;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function maskEnvStatus(name) {
  const val = process.env[name];
  if (!val || !val.trim()) return 'UNSET';
  if (hasPlaceholder(val)) return 'SET (placeholder)';
  return 'SET (configured)';
}

function sanitizeErrorMessage(message) {
  return String(message || 'Unknown error').replace(
    /postgres(?:ql)?:\/\/[^\s'"]+/gi,
    'postgresql://[REDACTED]'
  );
}

function stripSqlCommentsAndWhitespace(sql) {
  return sql
    .replace(/--[^\r\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
}

function stripOuterTransaction(sql) {
  return sql
    .replace(/^\s*(?:--[^\r\n]*\r?\n|\s)*BEGIN\s*;/i, '')
    .replace(/COMMIT\s*;\s*(?:--[^\r\n]*\r?\n|\s)*$/i, '')
    .trim();
}

function validateSqlFile(relPath) {
  const absPath = path.resolve(ROOT_DIR, relPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing SQL file: ${relPath}`);
  }
  const content = fs.readFileSync(absPath, 'utf8');
  const executable = stripSqlCommentsAndWhitespace(content);
  if (!executable) {
    throw new Error(`SQL file contains no executable statements: ${relPath}`);
  }
  return { relPath, absPath, content, bytes: Buffer.byteLength(content, 'utf8') };
}

function resolveSslConfig(databaseUrl) {
  const sslMode = (process.env.NARI_POSTGRES_SSL_MODE || '').trim().toLowerCase();
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname.toLowerCase();
  const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (sslMode === 'disable') {
    if (!isLoopback) {
      throw new Error('NARI_POSTGRES_SSL_MODE=disable is only permitted for loopback hosts.');
    }
    return false;
  }

  const caRaw = (process.env.NARI_POSTGRES_CA || '').trim();
  if (caRaw) {
    const ca = caRaw.includes('BEGIN CERTIFICATE')
      ? caRaw.replace(/\\n/g, '\n')
      : fs.readFileSync(path.resolve(ROOT_DIR, caRaw), 'utf8');
    return { rejectUnauthorized: true, ca };
  }

  return { rejectUnauthorized: true };
}

function validateDatabaseUrlForApply() {
  const sourceKey = (process.env.DATABASE_URL || '').trim()
    ? 'DATABASE_URL'
    : (process.env.NARI_POSTGRES_URL || '').trim()
      ? 'NARI_POSTGRES_URL'
      : 'DATABASE_URL / NARI_POSTGRES_URL';
  const url = (process.env.DATABASE_URL || process.env.NARI_POSTGRES_URL || '').trim();
  if (!url) {
    throw new Error('DATABASE_URL (or NARI_POSTGRES_URL) is missing. Set a real Supabase PostgreSQL connection string in .env before running --apply.');
  }
  if (hasPlaceholder(url)) {
    throw new Error(`${sourceKey} still contains placeholder tokens (e.g. YOUR_, [YOUR-], example). Replace with real credentials before --apply.`);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${sourceKey} is not a valid URL.`);
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`${sourceKey} must use postgres:// or postgresql:// protocol.`);
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error(`${sourceKey} must include hostname and database name.`);
  }
  return url;
}

function parseArgs(argv) {
  let mode = null;
  let withRoles = false;
  let runtimeOnly = false;
  let wave3Backend = false;
  let help = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      if (mode && mode !== 'dry-run') throw new Error('Cannot combine --dry-run and --apply.');
      mode = 'dry-run';
    } else if (arg === '--apply') {
      if (mode && mode !== 'apply') throw new Error('Cannot combine --dry-run and --apply.');
      mode = 'apply';
    } else if (arg === '--with-roles') {
      withRoles = true;
    } else if (arg === '--catalog-runtime-only') {
      runtimeOnly = true;
    } else if (arg === '--wave3-backend') {
      wave3Backend = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (runtimeOnly && withRoles) throw new Error('--catalog-runtime-only cannot combine with --with-roles; prerequisites must already exist.');
  if (wave3Backend && (runtimeOnly || withRoles)) throw new Error('--wave3-backend cannot combine with --catalog-runtime-only or --with-roles.');
  return { mode, withRoles, runtimeOnly, wave3Backend, help };
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node --env-file=.env scripts/push-supabase-schema.mjs --dry-run [--with-roles]',
      '  node --env-file=.env scripts/push-supabase-schema.mjs --apply [--with-roles]',
      '  node --env-file=.env scripts/push-supabase-schema.mjs --dry-run|--apply --catalog-runtime-only',
      '  node --env-file=.env scripts/push-supabase-schema.mjs --dry-run|--apply --wave3-backend',
    ].join('\n')
  );
}

async function runDryRun(files) {
  console.log('[dry-run] Validating SQL migration files (no database connection opened)...');
  for (const file of files) {
    const validated = validateSqlFile(file);
    console.log(`  OK  ${validated.relPath} (${validated.bytes} bytes)`);
  }

  console.log('[dry-run] Environment variable status (values redacted):');
  for (const key of [
    'DATABASE_URL',
    'NARI_POSTGRES_URL',
    'NARI_POSTGRES_SSL_MODE',
    'NARI_POSTGRES_CA',
    'NARI_POSTGRES_POOL_MAX',
  ]) {
    console.log(`  ${key}: ${maskEnvStatus(key)}`);
  }

  const dbUrl = (process.env.DATABASE_URL || process.env.NARI_POSTGRES_URL || '').trim();
  if (!dbUrl || hasPlaceholder(dbUrl)) {
    console.log('[dry-run] Note: DATABASE_URL / NARI_POSTGRES_URL is not yet configured for live --apply (placeholder or unset).');
  } else {
    console.log('[dry-run] DATABASE_URL / NARI_POSTGRES_URL format check: configured (ready for --apply).');
  }
  console.log('[dry-run] PASS: SQL files and local checks succeeded.');
}

async function runApply(files) {
  const databaseUrl = validateDatabaseUrlForApply();
  const ssl = resolveSslConfig(databaseUrl);

  const loadedFiles = files.map((file) => validateSqlFile(file));
  const client = new Client({
    connectionString: databaseUrl,
    ssl,
    connectionTimeoutMillis: 15000,
    statement_timeout: 60000,
  });

  console.log(`[apply] Connecting to PostgreSQL (SSL: ${ssl ? 'enabled' : 'disabled-loopback'})...`);
  await client.connect();

  try {
    const { rows: [roleInfo] } = await client.query(
      "SELECT current_user AS name, r.rolsuper, r.rolcreaterole, has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema FROM pg_roles r WHERE r.rolname = current_user"
    );
    if (!roleInfo || (!roleInfo.rolsuper && !roleInfo.can_create_schema)) {
      throw new Error('Connected role lacks schema-owner CREATE privileges (runtime role detected). Set DATABASE_URL to the postgres/schema-owner URI before running --apply.');
    }

    for (const file of loadedFiles) {
      const body = stripOuterTransaction(file.content);
      console.log(`[apply] Applying ${file.relPath} inside transaction...`);
      await client.query('BEGIN');
      try {
        await client.query(body);
        await client.query('COMMIT');
        console.log(`  COMMITTED ${file.relPath}`);
      } catch (err) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // Ignore rollback error after failed statement; original error is rethrown.
        }
        throw new Error(`Failed applying ${file.relPath}: ${sanitizeErrorMessage(err.message)}`);
      }
    }
    console.log('[apply] PASS: All selected SQL migrations committed.');
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  loadDotEnvIfPresent(path.join(ROOT_DIR, '.env'));

  const { mode, withRoles, runtimeOnly, wave3Backend, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printUsage();
    return;
  }
  if (!mode) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const files = wave3Backend
    ? [...WAVE3_BACKEND_MIGRATIONS]
    : runtimeOnly
      ? ['db/migrations/202611170002_catalog_runtime.sql']
      : withRoles
        ? [...CORE_MIGRATIONS, ...PROVIDER_ROLE_MIGRATIONS]
        : [...CORE_MIGRATIONS];

  if (mode === 'dry-run') {
    await runDryRun(files);
  } else {
    await runApply(files);
  }
}

main().catch((err) => {
  console.error(`[error] ${sanitizeErrorMessage(err.message)}`);
  process.exitCode = 1;
});
