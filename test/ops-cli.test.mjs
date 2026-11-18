import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ROOT_DIR,
  parseDotEnvContent,
  loadDotEnv,
  redact,
  redactSecrets,
  maskEnvStatus,
  parseOpsArgs,
  prepareCliEnv,
} from '../scripts/ops-cli.mjs';

test('parseDotEnvContent parses multiline double-quoted PEM and subsequent keys', () => {
  const raw = [
    '# Header comment',
    'NARI_POSTGRES_CA="-----BEGIN CERTIFICATE-----',
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A',
    '-----END CERTIFICATE-----"',
    'NARI_CATALOG_BACKEND="postgres"',
    "SINGLE_QUOTED='line1\nline2'",
    'ESCAPED_PEM="-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----"',
    'UNQUOTED=hello # trailing comment',
    'ONLY_COMMENT=   # nothing here',
    'export EXPORTED_KEY=value_with#hash',
    '__proto__=ignored',
  ].join('\r\n');

  const parsed = parseDotEnvContent(raw);
  assert.equal(
    parsed.NARI_POSTGRES_CA,
    '-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A\n-----END CERTIFICATE-----'
  );
  assert.equal(parsed.NARI_CATALOG_BACKEND, 'postgres');
  assert.equal(parsed.SINGLE_QUOTED, 'line1\nline2');
  assert.equal(parsed.ESCAPED_PEM, '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----');
  assert.equal(parsed.UNQUOTED, 'hello');
  assert.equal(parsed.ONLY_COMMENT, '');
  assert.equal(parsed.EXPORTED_KEY, 'value_with#hash');
  assert.equal(Object.hasOwn(parsed, '__proto__'), false);
});

test('loadDotEnv does not overwrite pre-existing environment variables', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nari-ops-env-'));
  try {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(
      envPath,
      'EXISTING_VAR="from_file"\nNEW_VAR="loaded_value"\nEMPTY_EXISTING="from_file"\n',
      'utf8'
    );
    const target = { EXISTING_VAR: 'from_process', EMPTY_EXISTING: '' };
    const result = loadDotEnv(envPath, target);
    assert.equal(result.loaded, true);
    assert.equal(target.EXISTING_VAR, 'from_process');
    assert.equal(target.EMPTY_EXISTING, '');
    assert.equal(target.NEW_VAR, 'loaded_value');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('redactSecrets masks connection strings, Supabase tokens, Bearer headers, JWTs, and PEM blocks', () => {
  assert.equal(redact, redactSecrets);

  const sample = [
    'db=postgresql://postgres.ref:super-secret@aws-0.pooler.supabase.com:5432/postgres',
    'alt=postgres://user:pass@localhost:5432/db',
    'sec=sb_secret_abc123_XYZ',
    'pub=sb_publishable_def456_UVW',
    'pat=sbp_0123456789abcdef',
    'auth=Bearer my-cf-token-value',
    'jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.sig_abc-123',
    'pem=-----BEGIN CERTIFICATE-----\nMIIDATestData\n-----END CERTIFICATE-----',
  ].join(' | ');

  const masked = redactSecrets(sample, ['custom-secret-token']);
  assert.doesNotMatch(masked, /super-secret/);
  assert.doesNotMatch(masked, /user:pass@/);
  assert.doesNotMatch(masked, /sb_secret_abc123/);
  assert.doesNotMatch(masked, /sb_publishable_def456/);
  assert.doesNotMatch(masked, /sbp_0123456789abcdef/);
  assert.doesNotMatch(masked, /my-cf-token-value/);
  assert.doesNotMatch(masked, /eyJ/);
  assert.doesNotMatch(masked, /MIIDATestData/);
  assert.match(masked, /postgresql:\/\/\[REDACTED\]/);
  assert.match(masked, /sb_secret_\[REDACTED\]/);
  assert.match(masked, /sb_publishable_\[REDACTED\]/);
  assert.match(masked, /sbp_\[REDACTED\]/);
  assert.match(masked, /Bearer \[REDACTED\]/);
  assert.match(masked, /\[JWT_REDACTED\]/);
  assert.match(masked, /\[PEM_REDACTED\]/);
});

test('maskEnvStatus classifies EMPTY, PLACEHOLDER, boolean flags, and CONFIGURED without leaking values', () => {
  const env = {
    NARI_POSTGRES_URL: '',
    NARI_POSTGRES_CA: '   ',
    SUPABASE_SERVICE_ROLE_KEY: 'YOUR_SERVICE_ROLE_KEY',
    CLOUDFLARE_API_TOKEN: '<replace-token>',
    SUPABASE_ACCESS_TOKEN: 'sbp_real_looking_token_1234',
    NARI_AUTH_ENABLED: 'true',
    NARI_ORDERS_ENABLED: 'false',
    NARI_CATALOG_BACKEND: 'postgres',
  };

  assert.equal(maskEnvStatus('NARI_POSTGRES_URL', env), 'EMPTY');
  assert.equal(maskEnvStatus('NARI_POSTGRES_CA', env), 'EMPTY');
  assert.equal(maskEnvStatus('MISSING_KEY', env), 'EMPTY');
  assert.equal(maskEnvStatus('SUPABASE_SERVICE_ROLE_KEY', env), 'PLACEHOLDER');
  assert.equal(maskEnvStatus('CLOUDFLARE_API_TOKEN', env), 'PLACEHOLDER');
  assert.equal(maskEnvStatus('SUPABASE_ACCESS_TOKEN', env), 'CONFIGURED');
  assert.equal(maskEnvStatus('NARI_AUTH_ENABLED', env), 'true');
  assert.equal(maskEnvStatus('NARI_ORDERS_ENABLED', env), 'false');
  assert.equal(maskEnvStatus('NARI_CATALOG_BACKEND', env), 'CONFIGURED');
});

test('parseOpsArgs handles help, doctor, supabase, cf, and rejects invalid arguments', () => {
  assert.deepEqual(parseOpsArgs([]), { command: 'help', live: false, args: [] });
  assert.deepEqual(parseOpsArgs(['--help']), { command: 'help', live: false, args: [] });
  assert.deepEqual(parseOpsArgs(['doctor']), { command: 'doctor', live: false, args: [] });
  assert.deepEqual(parseOpsArgs(['doctor', '--live']), {
    command: 'doctor',
    live: true,
    args: ['--live'],
  });
  assert.deepEqual(parseOpsArgs(['supabase', 'projects', 'list']), {
    command: 'supabase',
    live: false,
    args: ['projects', 'list'],
  });
  assert.deepEqual(parseOpsArgs(['cf', 'whoami']), {
    command: 'cf',
    live: false,
    args: ['whoami'],
  });

  assert.throws(() => parseOpsArgs(['doctor', '--unknown']), /Unknown doctor option/);
  assert.throws(() => parseOpsArgs(['unknown-cmd']), /Unknown command/);
});

test('ops-cli doctor exits 0, verifies supabase and wrangler versions, and leaks zero secrets', () => {
  const cliPath = path.join(ROOT_DIR, 'scripts', 'ops-cli.mjs');
  const injectedSecretUrl = 'postgresql://runtime:canary_secret_987@db.canary.local:5432/nari';
  const injectedPat = 'sbp_canary_secret_token_value';
  const injectedCf = 'cf_canary_secret_token_value';

  const result = spawnSync(process.execPath, [cliPath, 'doctor'], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      NARI_POSTGRES_URL: injectedSecretUrl,
      SUPABASE_ACCESS_TOKEN: injectedPat,
      CLOUDFLARE_API_TOKEN: injectedCf,
      NARI_AUTH_ENABLED: 'false',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  assert.equal(result.status, 0, `doctor failed:\n${combined}`);
  assert.match(result.stdout, /Node\.js:\s+v\d+\.\d+\.\d+\s+\(OK >= 24\)/);
  assert.match(result.stdout, /supabase CLI:\s+\d+\.\d+\.\d+/);
  assert.match(result.stdout, /wrangler CLI:\s+\d+\.\d+\.\d+/);
  assert.match(result.stdout, /NARI_POSTGRES_URL:\s+CONFIGURED/);
  assert.match(result.stdout, /SUPABASE_ACCESS_TOKEN:\s+CONFIGURED/);
  assert.match(result.stdout, /CLOUDFLARE_API_TOKEN:\s+CONFIGURED/);
  assert.match(result.stdout, /NARI_AUTH_ENABLED:\s+false/);

  assert.doesNotMatch(combined, /DEP0190/);
  assert.doesNotMatch(combined, /canary_secret/);
  assert.doesNotMatch(combined, /postgres(?:ql)?:\/\//i);
  assert.doesNotMatch(combined, /sb_secret_/);
  assert.doesNotMatch(combined, /sb_publishable_/);
  assert.doesNotMatch(combined, /sbp_/);
  assert.doesNotMatch(combined, /eyJ[A-Za-z0-9_-]+\./);
});

test('ops-cli --help exits 0 with usage instructions', () => {
  const cliPath = path.join(ROOT_DIR, 'scripts', 'ops-cli.mjs');
  const result = spawnSync(process.execPath, [cliPath, '--help'], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /doctor \[--live\]/);
  assert.match(result.stdout, /supabase <\.\.\.args>/);
  assert.match(result.stdout, /cf <\.\.\.args>/);
});

test('prepareCliEnv preserves writable home/config dirs and falls back when missing/unwritable', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nari-cli-home-'));
  try {
    const preserved = prepareCliEnv({
      HOME: tmpDir,
      USERPROFILE: tmpDir,
      XDG_CONFIG_HOME: tmpDir,
      APPDATA: tmpDir,
    });
    assert.equal(preserved.HOME, tmpDir);
    assert.equal(preserved.XDG_CONFIG_HOME, tmpDir);

    const missingPath = path.join(tmpDir, 'does-not-exist');
    const fallenBack = prepareCliEnv({
      HOME: missingPath,
      USERPROFILE: missingPath,
      XDG_CONFIG_HOME: missingPath,
      APPDATA: missingPath,
    });
    assert.notEqual(fallenBack.HOME, missingPath);
    assert.ok(fs.existsSync(fallenBack.HOME));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
