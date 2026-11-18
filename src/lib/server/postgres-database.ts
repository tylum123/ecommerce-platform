import "server-only";
import { Pool, type PoolConfig } from "pg";
import type { CatalogSqlConnection, CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";

type Environment = Readonly<Record<string, string | undefined>>;

/** No connection is opened while validating configuration. Never log the result. */
export function postgresPoolConfig(env: Environment = process.env): PoolConfig {
  let url: URL;
  try { url = new URL(env.NARI_POSTGRES_URL || ""); } catch { throw new Error("POSTGRES_URL_REQUIRED"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2 || url.hash) {
    throw new Error("POSTGRES_URL_INVALID");
  }
  // pg connection-string SSL options replace the explicit TLS object. Reject them.
  if (url.search) throw new Error("POSTGRES_URL_QUERY_NOT_ALLOWED");
  const mode = env.NARI_POSTGRES_SSL_MODE || "verify-full";
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (mode !== "verify-full" && !(mode === "disable" && loopback && env.NODE_ENV !== "production")) {
    throw new Error("POSTGRES_SSL_MODE_INVALID");
  }
  const max = env.NARI_POSTGRES_POOL_MAX || "5";
  if (!/^\d+$/.test(max) || Number(max) < 1 || Number(max) > 20) throw new Error("POSTGRES_POOL_MAX_INVALID");
  return {
    connectionString: url.toString(),
    ssl: mode === "disable" ? false : { rejectUnauthorized: true, ...(env.NARI_POSTGRES_CA ? { ca: env.NARI_POSTGRES_CA } : {}) },
    max: Number(max), connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
    statement_timeout: 15000, lock_timeout: 5000, idle_in_transaction_session_timeout: 15000,
    application_name: "nari-catalog", allowExitOnIdle: true,
  };
}

export interface PostgresDatabase extends CatalogSqlDatabase {
  close(): Promise<void>;
  /** Safe operational state; errors, credentials and SQL are never returned. */
  status(): { closing: boolean; idleConnectionErrors: number };
}

/** Own one instance per server process. Transactions always use one checked-out client. */
export function createPostgresDatabase(config: PoolConfig): PostgresDatabase {
  const pool = new Pool(config);
  let closing: Promise<void> | undefined;
  let idleConnectionErrors = 0;
  pool.on("error", () => { idleConnectionErrors += 1; });
  function open() { if (closing) throw new Error("POSTGRES_DATABASE_CLOSED"); }
  return {
    async query(sql, values) {
      open();
      return pool.query<Record<string, unknown>>(sql, values ? [...values] : undefined);
    },
    async transaction<T>(operation: (connection: CatalogSqlConnection) => Promise<T>): Promise<T> {
      open();
      const client = await pool.connect();
      let active = true;
      let discard = false;
      try {
        await client.query("BEGIN");
        const result = await operation({ async query(sql, values) {
          if (!active) throw new Error("POSTGRES_TRANSACTION_FINISHED");
          return client.query<Record<string, unknown>>(sql, values ? [...values] : undefined);
        } });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch { discard = true; }
        throw error;
      } finally {
        active = false;
        client.release(discard);
      }
    },
    close() { closing ??= pool.end(); return closing; },
    status() { return { closing: Boolean(closing), idleConnectionErrors }; },
  };
}

let runtimeDatabase: PostgresDatabase | undefined;
export function getPostgresDatabase(): PostgresDatabase {
  runtimeDatabase ??= createPostgresDatabase(postgresPoolConfig());
  return runtimeDatabase;
}

/** CLI/shutdown hook; request handlers must not close the shared pool per request. */
export async function closePostgresDatabase(): Promise<void> {
  const database = runtimeDatabase;
  runtimeDatabase = undefined;
  await database?.close();
}
