#!/usr/bin/env node
/**
 * Safe Supabase & Cloudflare Ops CLI wrapper (Node 24 ESM).
 *
 * Usage:
 *   node scripts/ops-cli.mjs doctor [--live]
 *   node scripts/ops-cli.mjs supabase <...args>
 *   node scripts/ops-cli.mjs cf <...args>
 *   node scripts/ops-cli.mjs --help
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

export const DOCTOR_ENV_KEYS = [
  'NARI_POSTGRES_URL',
  'NARI_POSTGRES_CA',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NARI_STORAGE_BUCKET',
  'NARI_CATALOG_BACKEND',
  'NARI_AUTH_ENABLED',
  'NARI_CATALOG_ADMIN_ENABLED',
  'NARI_STAFF_PORTAL_ENABLED',
  'NARI_SHARED_RATE_LIMIT',
  'NARI_ORDERS_ENABLED',
  'NARI_BOOKINGS_ENABLED',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_ACCESS_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
];

const BOOLEAN_ENV_KEYS = new Set([
  'NARI_AUTH_ENABLED',
  'NARI_CATALOG_ADMIN_ENABLED',
  'NARI_STAFF_PORTAL_ENABLED',
  'NARI_ORDERS_ENABLED',
  'NARI_BOOKINGS_ENABLED',
]);

const SECRET_ENV_KEYS = [
  'NARI_POSTGRES_URL',
  'DATABASE_URL',
  'NARI_POSTGRES_CA',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];

const PLACEHOLDER_PATTERNS = [
  /YOUR_/i,
  /\[YOUR[-_]/i,
  /\bexample\b/i,
  /changeme/i,
  /<[^>]+>/,
  /\[password\]/i,
  /\[project[-_]?ref\]/i,
  /^TODO\b/i,
];

const FORBIDDEN_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Parse `.env` content safely, supporting multiline quoted values (such as PEM certificates).
 * @param {string} content
 * @returns {Record<string, string>}
 */
export function parseDotEnvContent(content) {
  const src = String(content || '').replace(/\r\n/g, '\n');
  const entries = {};
  const len = src.length;
  let i = 0;

  const skipHorizontalSpace = () => {
    while (i < len && (src[i] === ' ' || src[i] === '\t')) i++;
  };

  const skipToNextLine = () => {
    while (i < len && src[i] !== '\n') i++;
    if (i < len && src[i] === '\n') i++;
  };

  while (i < len) {
    while (i < len && (src[i] === ' ' || src[i] === '\t' || src[i] === '\n')) i++;
    if (i >= len) break;

    if (src[i] === '#') {
      skipToNextLine();
      continue;
    }

    if (src.slice(i).match(/^export[ \t]+(?=[A-Za-z_][A-Za-z0-9_]*[ \t]*=)/)) {
      i += 6;
      skipHorizontalSpace();
    }

    const lineEnd = src.indexOf('\n', i);
    const searchEnd = lineEnd === -1 ? len : lineEnd;
    const eqIdx = src.indexOf('=', i);
    if (eqIdx === -1 || eqIdx > searchEnd) {
      skipToNextLine();
      continue;
    }

    const key = src.slice(i, eqIdx).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || FORBIDDEN_PROTO_KEYS.has(key)) {
      skipToNextLine();
      continue;
    }

    i = eqIdx + 1;
    skipHorizontalSpace();

    let value = '';
    if (i < len && src[i] === '"') {
      i++;
      while (i < len) {
        const ch = src[i];
        if (ch === '\\' && i + 1 < len) {
          const next = src[i + 1];
          if (next === 'n') {
            value += '\n';
            i += 2;
          } else if (next === 'r') {
            value += '\r';
            i += 2;
          } else if (next === 't') {
            value += '\t';
            i += 2;
          } else if (next === '"' || next === '\\') {
            value += next;
            i += 2;
          } else {
            value += ch;
            i++;
          }
        } else if (ch === '"') {
          i++;
          break;
        } else {
          value += ch;
          i++;
        }
      }
      skipToNextLine();
    } else if (i < len && src[i] === "'") {
      i++;
      while (i < len && src[i] !== "'") {
        value += src[i];
        i++;
      }
      if (i < len && src[i] === "'") i++;
      skipToNextLine();
    } else {
      const end = lineEnd === -1 ? len : lineEnd;
      const rawLine = src.slice(i, end);
      if (rawLine.startsWith('#')) {
        value = '';
      } else {
        const commentMatch = rawLine.match(/[ \t]+#/);
        value = (commentMatch ? rawLine.slice(0, commentMatch.index) : rawLine).trim();
      }
      i = end < len ? end + 1 : len;
    }

    Object.defineProperty(entries, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  return entries;
}

/**
 * Load `.env` into targetEnv without overwriting already-set variables.
 * @param {string} [envPath]
 * @param {Record<string, string | undefined>} [targetEnv]
 * @returns {{ loaded: boolean, keys: string[] }}
 */
export function loadDotEnv(envPath = path.resolve(ROOT_DIR, '.env'), targetEnv = process.env) {
  if (!fs.existsSync(envPath)) {
    return { loaded: false, keys: [] };
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  const parsed = parseDotEnvContent(raw);
  const loadedKeys = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (Object.hasOwn(targetEnv, key) && targetEnv[key] !== undefined) continue;
    targetEnv[key] = value;
    loadedKeys.push(key);
  }
  return { loaded: true, keys: loadedKeys };
}

/**
 * Mask connection strings, Supabase keys/tokens, Bearer headers, JWTs, PEM blocks, and known secrets.
 * @param {string} text
 * @param {string[]} [extraSecrets]
 * @returns {string}
 */
export function redactSecrets(text, extraSecrets = []) {
  let out = String(text || '')
    .replace(/-----BEGIN [A-Z0-9 ]+-----[\s\S]*?-----END [A-Z0-9 ]+-----/g, '[PEM_REDACTED]')
    .replace(/Bearer[ \t]+[^\s'"`]+/gi, 'Bearer [REDACTED]')
    .replace(/postgres(?:ql)?:\/\/[^\s'"`]+/gi, 'postgresql://[REDACTED]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, 'sb_secret_[REDACTED]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, 'sb_publishable_[REDACTED]')
    .replace(/sbp_[A-Za-z0-9_-]+/g, 'sbp_[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+=*/g, '[JWT_REDACTED]');

  for (const secret of extraSecrets) {
    if (typeof secret === 'string' && secret.length >= 8) {
      out = out.split(secret).join('[SECRET_REDACTED]');
    }
  }
  return out;
}

export const redact = redactSecrets;

function hasPlaceholder(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Compute a safe, non-leaking status label for an environment variable.
 * @param {string} name
 * @param {Record<string, string | undefined>} [env]
 * @returns {'EMPTY' | 'PLACEHOLDER' | 'CONFIGURED' | 'true' | 'false'}
 */
export function maskEnvStatus(name, env = process.env) {
  const raw = env?.[name];
  if (raw === undefined || raw === null || !String(raw).trim()) {
    return 'EMPTY';
  }
  const trimmed = String(raw).trim();
  if (hasPlaceholder(trimmed)) {
    return 'PLACEHOLDER';
  }
  if (BOOLEAN_ENV_KEYS.has(name) && (trimmed === 'true' || trimmed === 'false')) {
    return trimmed;
  }
  return 'CONFIGURED';
}

/**
 * Parse CLI arguments for ops-cli.
 * @param {string[]} [argv]
 * @returns {{ command: 'help' | 'doctor' | 'supabase' | 'cf', live: boolean, args: string[] }}
 */
export function parseOpsArgs(argv = []) {
  if (!Array.isArray(argv) || argv.length === 0) {
    return { command: 'help', live: false, args: [] };
  }
  const [first, ...rest] = argv;
  if (first === '--help' || first === '-h' || first === 'help') {
    return { command: 'help', live: false, args: [] };
  }
  if (first === 'doctor') {
    let live = false;
    for (const flag of rest) {
      if (flag === '--live') {
        live = true;
      } else if (flag === '--help' || flag === '-h') {
        return { command: 'help', live: false, args: [] };
      } else {
        throw new Error(`Unknown doctor option: ${flag}`);
      }
    }
    return { command: 'doctor', live, args: rest };
  }
  if (first === 'supabase' || first === 'cf') {
    return { command: first, live: false, args: rest };
  }
  throw new Error(`Unknown command: ${first}. Run with --help for usage.`);
}

export function printHelp() {
  console.log(
    [
      'Nari Ops CLI (Supabase & Cloudflare)',
      '',
      'Usage:',
      '  node scripts/ops-cli.mjs doctor [--live]    Check Node >= 24, local CLIs, and masked env status',
      '  node scripts/ops-cli.mjs supabase <...args>  Run local Supabase CLI with .env loaded',
      '  node scripts/ops-cli.mjs cf <...args>        Run local Cloudflare Wrangler CLI with .env loaded',
      '  node scripts/ops-cli.mjs --help              Show this help message',
    ].join('\n')
  );
}

/**
 * Resolve a local binary in node_modules/.bin cross-platform.
 * @param {string} binName
 * @param {string} [rootDir]
 * @returns {string}
 */
export function resolveLocalBin(binName, rootDir = ROOT_DIR) {
  const binDir = path.join(rootDir, 'node_modules', '.bin');
  if (process.platform === 'win32') {
    const cmdPath = path.join(binDir, `${binName}.cmd`);
    if (fs.existsSync(cmdPath)) return cmdPath;
  }
  return path.join(binDir, binName);
}

function quoteWinCmdArg(arg) {
  const str = String(arg);
  if (str.length === 0) return '""';
  if (!/[\s"&|<>^()%!]/.test(str)) return str;
  return `"${str.replace(/"/g, '\\"')}"`;
}

function collectSecretValues(env) {
  const secrets = [];
  for (const key of SECRET_ENV_KEYS) {
    const val = env?.[key];
    if (typeof val === 'string' && val.trim().length >= 8) {
      secrets.push(val.trim());
    }
  }
  return secrets;
}

function isDirProbeWritable(baseDir, existingSubdir) {
  if (!baseDir) return false;
  const checkDir = existingSubdir && fs.existsSync(path.join(baseDir, existingSubdir))
    ? path.join(baseDir, existingSubdir)
    : baseDir;
  if (!fs.existsSync(checkDir)) return false;
  const probePath = path.join(
    checkDir,
    `.nari-ops-probe-${process.pid}-${Math.random().toString(36).slice(2)}`
  );
  try {
    fs.writeFileSync(probePath, '');
    fs.unlinkSync(probePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Keep real user home/config directories when writable; fall back to os.tmpdir() in restricted sandboxes.
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, string | undefined>}
 */
export function prepareCliEnv(env) {
  const nextEnv = { ...env };
  const fallbackBase = path.join(os.tmpdir(), 'nari-ops-cli-home');
  const homeDir = nextEnv.USERPROFILE || nextEnv.HOME || os.homedir();
  const xdgDir = nextEnv.XDG_CONFIG_HOME || nextEnv.APPDATA || homeDir;

  const homeWritable = isDirProbeWritable(homeDir, '.supabase');
  const xdgWritable = isDirProbeWritable(xdgDir, 'xdg.config');

  if (!homeWritable || !xdgWritable) {
    fs.mkdirSync(fallbackBase, { recursive: true });
    if (!homeWritable) {
      nextEnv.HOME = fallbackBase;
      nextEnv.USERPROFILE = fallbackBase;
    }
    if (!xdgWritable) {
      nextEnv.XDG_CONFIG_HOME = fallbackBase;
      nextEnv.APPDATA = fallbackBase;
      nextEnv.LOCALAPPDATA = fallbackBase;
    }
  }

  return nextEnv;
}

/**
 * Execute a local CLI binary safely, redacting any accidental secrets in output.
 * @param {string} binName
 * @param {string[]} args
 * @param {Record<string, string | undefined>} env
 * @param {{ rootDir?: string, inheritStdin?: boolean }} [options]
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
export function runLocalBin(binName, args, env, options = {}) {
  const rootDir = options.rootDir || ROOT_DIR;
  const binPath = resolveLocalBin(binName, rootDir);
  const secrets = collectSecretValues(env);
  if (!fs.existsSync(binPath)) {
    return {
      status: 1,
      stdout: '',
      stderr: `Local binary not found: ${binName} (expected at node_modules/.bin). Run npm install.`,
    };
  }

  const isWin = process.platform === 'win32';
  const cliEnv = prepareCliEnv(env);

  const result = isWin
    ? spawnSync([quoteWinCmdArg(binPath), ...args.map(quoteWinCmdArg)].join(' '), {
        cwd: rootDir,
        env: cliEnv,
        shell: true,
        encoding: 'utf8',
        stdio: [options.inheritStdin ? 'inherit' : 'ignore', 'pipe', 'pipe'],
      })
    : spawnSync(binPath, args, {
        cwd: rootDir,
        env: cliEnv,
        shell: false,
        encoding: 'utf8',
        stdio: [options.inheritStdin ? 'inherit' : 'ignore', 'pipe', 'pipe'],
      });

  const stdout = redactSecrets(result.stdout || '', secrets);
  const stderr = redactSecrets(result.stderr || (result.error ? result.error.message : ''), secrets);
  return {
    status: result.status ?? 1,
    stdout,
    stderr,
  };
}

function parseNodeMajor(version = process.versions.node) {
  return Number.parseInt(String(version).split('.')[0], 10);
}

/**
 * Run diagnostics on runtime, local CLIs, env status, and optional live checks.
 * @param {{ live?: boolean, env?: Record<string, string | undefined>, rootDir?: string }} [options]
 * @returns {number} Exit code (0 = ok, 1 = failed)
 */
export function runDoctor(options = {}) {
  const rootDir = options.rootDir || ROOT_DIR;
  const env = options.env || { ...process.env };
  loadDotEnv(path.resolve(rootDir, '.env'), env);

  let ok = true;
  const nodeMajor = parseNodeMajor();
  const nodeOk = Number.isFinite(nodeMajor) && nodeMajor >= 24;
  if (!nodeOk) ok = false;

  console.log('=== Nari Ops Doctor ===');
  console.log(`Node.js: v${process.versions.node} (${nodeOk ? 'OK >= 24' : 'FAIL < 24'})`);

  const supaVer = runLocalBin('supabase', ['--version'], env, { rootDir });
  const supaLine = (supaVer.stdout || supaVer.stderr).trim().split(/\r?\n/)[0] || 'unavailable';
  if (supaVer.status !== 0) ok = false;
  console.log(`supabase CLI: ${supaVer.status === 0 ? supaLine : `FAIL (${supaLine})`}`);

  const wranglerVer = runLocalBin('wrangler', ['--version'], env, { rootDir });
  const wranglerLine = (wranglerVer.stdout || wranglerVer.stderr).trim().split(/\r?\n/)[0] || 'unavailable';
  if (wranglerVer.status !== 0) ok = false;
  console.log(`wrangler CLI: ${wranglerVer.status === 0 ? wranglerLine : `FAIL (${wranglerLine})`}`);

  console.log('\nEnvironment status (masked):');
  for (const key of DOCTOR_ENV_KEYS) {
    console.log(`  ${key}: ${maskEnvStatus(key, env)}`);
  }

  if (options.live) {
    console.log('\nLive checks:');
    const secrets = collectSecretValues(env);
    const verifyScript = path.resolve(rootDir, 'scripts', 'verify-supabase-live.mjs');
    const dbCheck = spawnSync(process.execPath, [verifyScript, '--database'], {
      cwd: rootDir,
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const dbOut = redactSecrets((dbCheck.stdout || '').trim(), secrets);
    const dbErr = redactSecrets((dbCheck.stderr || '').trim(), secrets);
    if (dbCheck.status === 0) {
      console.log(`  Supabase DB: OK ${dbOut}`);
    } else {
      ok = false;
      console.log(`  Supabase DB: FAIL ${dbErr || dbOut || `exit ${dbCheck.status ?? 1}`}`);
    }

    const cfTokenStatus = maskEnvStatus('CLOUDFLARE_API_TOKEN', env);
    if (cfTokenStatus === 'CONFIGURED') {
      const cfCheck = runLocalBin('wrangler', ['whoami'], env, { rootDir });
      const cfOut = redactSecrets((cfCheck.stdout || cfCheck.stderr).trim(), secrets);
      if (cfCheck.status === 0) {
        console.log(`  Cloudflare Wrangler: OK ${cfOut.replace(/\r?\n/g, ' | ')}`);
      } else {
        ok = false;
        console.log(`  Cloudflare Wrangler: FAIL ${cfOut || `exit ${cfCheck.status}`}`);
      }
    } else {
      console.log(`  Cloudflare Wrangler: SKIPPED (CLOUDFLARE_API_TOKEN is ${cfTokenStatus})`);
    }
  }

  return ok ? 0 : 1;
}

/**
 * CLI entry point.
 * @param {string[]} [argv]
 * @returns {number}
 */
export function main(argv = process.argv.slice(2)) {
  const parsed = parseOpsArgs(argv);
  if (parsed.command === 'help') {
    printHelp();
    return 0;
  }

  const childEnv = { ...process.env };
  loadDotEnv(path.resolve(ROOT_DIR, '.env'), childEnv);

  if (parsed.command === 'doctor') {
    return runDoctor({ live: parsed.live, env: childEnv, rootDir: ROOT_DIR });
  }

  const binName = parsed.command === 'supabase' ? 'supabase' : 'wrangler';
  const result = runLocalBin(binName, parsed.args, childEnv, {
    rootDir: ROOT_DIR,
    inheritStdin: true,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result.status;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    process.exitCode = main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ops-cli] ${redactSecrets(message)}`);
    printHelp();
    process.exitCode = 1;
  }
}
