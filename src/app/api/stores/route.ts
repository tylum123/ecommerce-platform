import { NextResponse } from "next/server";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { listPostgresBranches } from "@/lib/server/postgres-clinic-service";
import { getStoreCities, getStoreDistricts } from "@/lib/support-stores";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city") || undefined;
    const district = searchParams.get("district") || undefined;
    const hasClinicParam = searchParams.get("hasClinic");
    const query = searchParams.get("q") || searchParams.get("query") || undefined;

    const hasClinic = hasClinicParam === "true" || hasClinicParam === "1" ? true : undefined;

    if (!process.env.NARI_POSTGRES_URL?.trim()) {
      return NextResponse.json({
        ok: true,
        source: "empty",
        data: [],
        total: 0,
        cities: getStoreCities([]),
        districts: getStoreDistricts(city, []),
      });
    }

    const data = await listPostgresBranches(getPostgresDatabase(), {
      city,
      district,
      hasClinic,
      query,
    });

    return NextResponse.json({
      ok: true,
      source: "postgres",
      data,
      total: data.length,
      cities: getStoreCities(data),
      districts: getStoreDistricts(city, data),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "STORES_UNAVAILABLE",
        error: "Hệ thống cửa hàng tạm thời chưa khả dụng. Vui lòng thử lại sau.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
