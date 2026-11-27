import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtimePostgresConfig, validateBucket, main, safeFailureCode, expectedDatabaseSpec } from '../scripts/verify-supabase-live.mjs';

test('safe diagnostics expose only fixed codes and never driver messages or arbitrary codes', () => {
  for (const code of ['ENOTFOUND','ETIMEDOUT','ECONNREFUSED','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','28P01','28000','42501']) assert.equal(safeFailureCode({ code, message:'postgres://secret-user:private-password@private-host' }), code);
  for (const error of [Error('private-password'), { code:'postgres://private-password@private-host' }, { code:'UNKNOWN', message:'private-password' }, null, 'private-password']) assert.equal(safeFailureCode(error), 'OPERATION_FAILED');
});

test('live helper reuses application TLS/timeouts and rejects URL overrides', () => {
  const env = { NARI_POSTGRES_URL:'postgresql://runtime:private-test-password@db.example.test/catalog' };
  const config = runtimePostgresConfig(env);
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.connectionTimeoutMillis, 5000);
  assert.equal(config.statement_timeout, 15000);
  for (const patch of [{ NARI_POSTGRES_SSL_MODE:'disable' }, { NARI_POSTGRES_URL:`${env.NARI_POSTGRES_URL}?sslmode=disable` }, { NARI_POSTGRES_POOL_MAX:'100' }]) {
    assert.throws(() => runtimePostgresConfig({ ...env, ...patch }), error => error.message === 'POSTGRES_CONFIG_INVALID' && !error.message.includes('private-test-password'));
  }
});

test('Storage policy accepts only exact public bucket and restrictions', () => {
  const bucket = { id:'nari-catalog', public:true, file_size_limit:5 * 1024 * 1024, allowed_mime_types:['image/png','image/jpeg','image/webp'] };
  assert.doesNotThrow(() => validateBucket(bucket));
  for (const patch of [{ id:'another-bucket' }, { public:false }, { file_size_limit:null }, { allowed_mime_types:null }, { allowed_mime_types:['image/*'] }]) assert.throws(() => validateBucket({ ...bucket, ...patch }), /BUCKET_POLICY_CONFLICT/);
});

test('CLI rejects ambiguous modes/path options before external calls', async () => {
  for (const argv of [[], ['--database','--storage-setup'], ['--storage-setup','--path','catalog/a.png'], ['--storage-check','--path']]) await assert.rejects(() => main(argv), /INVALID_ARGUMENTS/);
});

test('expectedDatabaseSpec distinguishes baseline catalog from Wave 3 multi-schema boundaries', () => {
  const baseline = expectedDatabaseSpec(false);
  assert.deepEqual(baseline.schemas, ['nari_catalog', 'nari_identity']);
  assert.equal(baseline.exactPolicies, 18);
  const wave3 = expectedDatabaseSpec(true);
  assert.deepEqual(wave3.schemas, ['nari_catalog', 'nari_identity', 'nari_orders']);
  assert.equal(wave3.exactPolicies, 38);
  assert.deepEqual(wave3.expected['nari_identity.auth_rate_limits'], [false, false, false, false]);
  assert.deepEqual(wave3.expected['nari_orders.orders'], [true, true, true, false]);
  assert.deepEqual(wave3.expected['nari_catalog.branches'], [true, true, false, false]);
  assert.equal(Object.hasOwn(wave3.expected, 'nari_clinic.services'), false);
  assert.equal(Object.hasOwn(wave3.expected, 'nari_clinic.appointments'), false);
});
