import { NextResponse } from "next/server";
import { getPostgresDatabase } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    const db = getPostgresDatabase();
    await db.query("SELECT 1 AS ok");
    return NextResponse.json(
      { ok: true, db: "connected", timestamp },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "unavailable", timestamp },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
