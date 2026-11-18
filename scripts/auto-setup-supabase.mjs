#!/usr/bin/env node
/**
 * Automated Supabase setup, env sync, storage bucket provisioning, and schema push/verify.
 *
 * Subcommands:
 *   node scripts/auto-setup-supabase.mjs configure-mcp
 *   node scripts/auto-setup-supabase.mjs check-auth
 *   node scripts/auto-setup-supabase.mjs sync-env
 *   node scripts/auto-setup-supabase.mjs push-and-verify
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROJECT_REF = 'ywrzguhuzekkusoupehf';
const SUPABASE_HTTPS_URL = 'https://ywrzguhuzekkusoupehf.supabase.co';
const MCP_CONFIG_PATH = 'C:\\Users\\MyPC\\.gemini\\config\\mcp_config.json';
const SCRATCH_WORKDIR =
  'C:/Users/MyPC/.gemini/antigravity-cli/brain/d46087e9-80a7-4df1-b499-a466d44ea364/scratch/supabase-cli';
const BUCKET_NAME = 'nari-catalog';

const EXPECTED_CATALOG_TABLES = [
  'brands',
  'branches',
  'categories',
  'home_banners',
  'inventory_balances',
  'inventory_movements',
  'product_images',
  'product_specs',
  'products',
  'sources',
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

function redactSecrets(text) {
  return String(text || '')
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, 'postgresql://[REDACTED]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, 'sb_secret_[REDACTED]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, 'sb_publishable_[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTED]');
}

function runNpx(args, options = {}) {
  const result = spawnSync('npx', args, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    cwd: options.cwd || SCRATCH_WORKDIR,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || null,
  };
}

function parseJsonSafe(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBracket = trimmed.indexOf('[');
    const firstBrace = trimmed.indexOf('{');
    const start =
      firstBracket === -1
        ? firstBrace
        : firstBrace === -1
          ? firstBracket
          : Math.min(firstBracket, firstBrace);
    if (start >= 0) {
      try {
        return JSON.parse(trimmed.slice(start));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function hasPlaceholder(value) {
  if (!value || !String(value).trim()) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(String(value)));
}

function parseEnvEntries(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function formatEnvValue(value) {
  const str = String(value);
  if (/[\s#"']/.test(str) || str === '') {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

function upsertEnvFile(envPath, updates) {
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const seen = new Set();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) return line;
    const key = line.slice(0, eqIdx).trim();
    if (Object.prototype.hasOwnProperty.call(updates, key) && updates[key] !== undefined) {
      seen.add(key);
      return `${key}=${formatEnvValue(updates[key])}`;
    }
    return line;
  });

  const missingKeys = Object.keys(updates).filter(
    (key) => !seen.has(key) && updates[key] !== undefined
  );
  if (missingKeys.length > 0) {
    if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== '') {
      updatedLines.push('');
    }
    for (const key of missingKeys) {
      updatedLines.push(`${key}=${formatEnvValue(updates[key])}`);
    }
  }

  fs.writeFileSync(envPath, `${updatedLines.join('\n').replace(/\n*$/, '\n')}`, 'utf8');
}

function configureMcp() {
  const dir = path.dirname(MCP_CONFIG_PATH);
  fs.mkdirSync(dir, { recursive: true });

  let config = {};
  if (fs.existsSync(MCP_CONFIG_PATH)) {
    const raw = fs.readFileSync(MCP_CONFIG_PATH, 'utf8').trim();
    if (raw) {
      config = JSON.parse(raw);
    }
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    config = {};
  }
  if (!config.mcpServers || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) {
    config.mcpServers = {};
  }
  config.mcpServers.supabase = {
    url: `https://mcp.supabase.com/mcp?project_ref=${PROJECT_REF}`,
  };

  fs.writeFileSync(MCP_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log('[mcp] Configured supabase MCP');
}

function fetchApiKeys() {
  fs.mkdirSync(SCRATCH_WORKDIR, { recursive: true });
  const res = runNpx([
    '--yes',
    'supabase@latest',
    'projects',
    'api-keys',
    '--project-ref',
    PROJECT_REF,
    '-o',
    'json',
  ]);
  if (res.status !== 0) {
    return { ok: false, keys: null, error: redactSecrets(res.stderr || res.stdout) };
  }
  const parsed = parseJsonSafe(res.stdout);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, keys: null, error: 'Empty or invalid JSON from api-keys' };
  }
  return { ok: true, keys: parsed, error: null };
}

function checkAuth() {
  const result = fetchApiKeys();
  if (result.ok) {
    console.log(`[auth] Authenticated for project ${PROJECT_REF}`);
    return;
  }
  console.log('[auth] Not authenticated yet');
  process.exitCode = 1;
}

function extractKeys(apiKeys) {
  const publishableEntry = apiKeys.find(
    (k) => k?.api_key?.startsWith('sb_publishable_') || k?.type === 'publishable'
  );
  const publishableKey = publishableEntry?.api_key || undefined;

  const anonEntry = apiKeys.find((k) => k?.name === 'anon' || k?.id === 'anon');
  const anonKey = anonEntry?.api_key || publishableKey || undefined;

  const serviceRoleEntry = apiKeys.find(
    (k) => k?.name === 'service_role' || k?.id === 'service_role'
  );
  const secretFallback = apiKeys.find(
    (k) => k?.api_key?.startsWith('sb_secret_') || k?.type === 'secret'
  );
  const secretKey = serviceRoleEntry?.api_key || secretFallback?.api_key || undefined;

  return { publishableKey, anonKey, secretKey };
}

function readPoolerTemplate() {
  const poolerPath = path.join(SCRATCH_WORKDIR, 'supabase', '.temp', 'pooler-url');
  if (!fs.existsSync(poolerPath)) return null;
  const raw = fs.readFileSync(poolerPath, 'utf8').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    if (!host) return null;
    return `postgresql://postgres.${PROJECT_REF}:YOUR_DB_PASSWORD@${host}:${port}/postgres`;
  } catch {
    return null;
  }
}

async function ensureStorageBucket(secretKey) {
  if (!secretKey) {
    throw new Error('Missing service_role/secret key; cannot inspect or create Storage bucket.');
  }
  const client = createClient(SUPABASE_HTTPS_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw new Error(`Storage listBuckets failed: ${redactSecrets(listError.message)}`);
  }
  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 6291456,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    });
    if (createError) {
      throw new Error(`Storage createBucket failed: ${redactSecrets(createError.message)}`);
    }
  }
  console.log(`[storage] Bucket ${BUCKET_NAME} ready`);
}

async function syncEnv() {
  const gitCheck = spawnSync('git', ['check-ignore', '-q', '.env'], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
  });
  if (gitCheck.status !== 0) {
    throw new Error('.env is NOT gitignored. Aborting sync-env to prevent secret exposure.');
  }

  fs.mkdirSync(SCRATCH_WORKDIR, { recursive: true });
  const configToml = path.join(SCRATCH_WORKDIR, 'supabase', 'config.toml');
  if (!fs.existsSync(configToml)) {
    const initRes = runNpx(['--yes', 'supabase@latest', '--workdir', SCRATCH_WORKDIR, 'init']);
    if (initRes.status !== 0) {
      throw new Error(`supabase init failed: ${redactSecrets(initRes.stderr || initRes.stdout)}`);
    }
  }

  const linkRes = runNpx([
    '--yes',
    'supabase@latest',
    '--workdir',
    SCRATCH_WORKDIR,
    'link',
    '--project-ref',
    PROJECT_REF,
  ]);
  if (linkRes.status !== 0) {
    console.warn(`[link] Warning: supabase link exited ${linkRes.status}: ${redactSecrets(linkRes.stderr || linkRes.stdout).trim()}`);
  }

  const authKeys = fetchApiKeys();
  if (!authKeys.ok) {
    throw new Error(`Failed to fetch Supabase API keys: ${authKeys.error}`);
  }

  const { publishableKey, anonKey, secretKey } = extractKeys(authKeys.keys);
  console.log(
    `[env] Keys resolved: hasPublishable=${Boolean(publishableKey)}, hasAnon=${Boolean(anonKey)}, hasServiceRole=${Boolean(secretKey)}`
  );

  const envPath = path.join(ROOT_DIR, '.env');
  const existingContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const existingMap = parseEnvEntries(existingContent);

  const poolerTemplate = readPoolerTemplate();
  const existingNariPg = existingMap.get('NARI_POSTGRES_URL');
  const existingDbUrl = existingMap.get('DATABASE_URL');

  const updates = {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_HTTPS_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_URL: SUPABASE_HTTPS_URL,
    SUPABASE_SERVICE_ROLE_KEY: secretKey,
    NARI_STORAGE_BUCKET: BUCKET_NAME,
    NARI_STORAGE_PUBLIC_ORIGIN: SUPABASE_HTTPS_URL,
  };

  if (existingNariPg && !hasPlaceholder(existingNariPg)) {
    updates.NARI_POSTGRES_URL = existingNariPg;
  } else if (poolerTemplate) {
    updates.NARI_POSTGRES_URL = poolerTemplate;
  }

  if (existingDbUrl && !hasPlaceholder(existingDbUrl)) {
    updates.DATABASE_URL = existingDbUrl;
  } else if (poolerTemplate) {
    updates.DATABASE_URL = poolerTemplate;
  }

  upsertEnvFile(envPath, updates);
  console.log('[env] Updated .env in place (values redacted)');

  await ensureStorageBucket(secretKey);
}

function detectDbQueryFlags() {
  const helpRes = runNpx(['--yes', 'supabase@latest', 'db', 'query', '--help']);
  if (helpRes.status !== 0) {
    throw new Error(`supabase db query --help failed: ${redactSecrets(helpRes.stderr || helpRes.stdout)}`);
  }
  const helpText = `${helpRes.stdout}\n${helpRes.stderr}`;
  const remoteFlag = helpText.includes('--remote')
    ? '--remote'
    : helpText.includes('--linked')
      ? '--linked'
      : null;
  const supportsFile = helpText.includes('--file');
  if (!remoteFlag) {
    throw new Error('Could not detect --remote or --linked flag in supabase db query --help.');
  }
  if (!supportsFile) {
    throw new Error('supabase db query --help does not advertise --file support.');
  }
  return { remoteFlag };
}

function parseQueryRows(stdout) {
  const parsed = parseJsonSafe(stdout);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
  return [];
}

function runRemoteSqlFile(remoteFlag, sqlFilePath, jsonOutput = false) {
  const args = [
    '--yes',
    'supabase@latest',
    '--workdir',
    SCRATCH_WORKDIR,
    'db',
    'query',
    remoteFlag,
    '--file',
    sqlFilePath,
  ];
  if (jsonOutput) {
    args.push('-o', 'json');
  }
  const res = runNpx(args);
  if (res.status !== 0) {
    throw new Error(
      `supabase db query failed for ${path.basename(sqlFilePath)}: ${redactSecrets(res.stderr || res.stdout)}`
    );
  }
  return res.stdout;
}

function pushAndVerify() {
  fs.mkdirSync(SCRATCH_WORKDIR, { recursive: true });
  const { remoteFlag } = detectDbQueryFlags();

  const checkSqlPath = path.join(SCRATCH_WORKDIR, 'check_tables.sql');
  const catalogSqlPath = path.join(SCRATCH_WORKDIR, '202611160001_catalog_inventory.sql');
  const identitySqlPath = path.join(SCRATCH_WORKDIR, '202611170001_identity.sql');
  const verifySqlPath = path.join(SCRATCH_WORKDIR, 'verify_tables.sql');

  fs.writeFileSync(
    checkSqlPath,
    "SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('nari_catalog', 'nari_identity') ORDER BY schemaname, tablename;\n",
    'utf8'
  );
  fs.copyFileSync(
    path.join(ROOT_DIR, 'db', 'migrations', '202611160001_catalog_inventory.sql'),
    catalogSqlPath
  );
  fs.copyFileSync(
    path.join(ROOT_DIR, 'db', 'migrations', '202611170001_identity.sql'),
    identitySqlPath
  );
  fs.writeFileSync(
    verifySqlPath,
    "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname IN ('nari_catalog', 'nari_identity') ORDER BY schemaname, tablename;\n",
    'utf8'
  );

  const existingRows = parseQueryRows(runRemoteSqlFile(remoteFlag, checkSqlPath, true));
  const existingCatalog = new Set(
    existingRows.filter((r) => r.schemaname === 'nari_catalog').map((r) => r.tablename)
  );
  const existingIdentity = new Set(
    existingRows.filter((r) => r.schemaname === 'nari_identity').map((r) => r.tablename)
  );

  const missingCatalog = EXPECTED_CATALOG_TABLES.filter((t) => !existingCatalog.has(t));
  if (missingCatalog.length > 0) {
    console.log(`[push] Applying 202611160001_catalog_inventory.sql (missing: ${missingCatalog.join(', ')})...`);
    runRemoteSqlFile(remoteFlag, catalogSqlPath, false);
    console.log('[push] Applied 202611160001_catalog_inventory.sql');
  } else {
    console.log('[push] nari_catalog tables already present; skipping 202611160001_catalog_inventory.sql');
  }

  if (!existingIdentity.has('provisioned_identities')) {
    console.log('[push] Applying 202611170001_identity.sql...');
    runRemoteSqlFile(remoteFlag, identitySqlPath, false);
    console.log('[push] Applied 202611170001_identity.sql');
  } else {
    console.log('[push] nari_identity.provisioned_identities already present; skipping 202611170001_identity.sql');
  }

  const verifiedRows = parseQueryRows(runRemoteSqlFile(remoteFlag, verifySqlPath, true));
  console.log('[verify] Tables and RLS status:');
  for (const row of verifiedRows) {
    console.log(`  - ${row.schemaname}.${row.tablename} (rowsecurity=${row.rowsecurity})`);
  }
}

async function main() {
  const subcommand = process.argv[2];
  if (subcommand === 'configure-mcp') {
    configureMcp();
  } else if (subcommand === 'check-auth') {
    checkAuth();
  } else if (subcommand === 'sync-env') {
    await syncEnv();
  } else if (subcommand === 'push-and-verify') {
    pushAndVerify();
  } else {
    console.error(
      'Usage: node scripts/auto-setup-supabase.mjs <configure-mcp|check-auth|sync-env|push-and-verify>'
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`[error] ${redactSecrets(err.message)}`);
  process.exitCode = 1;
});
