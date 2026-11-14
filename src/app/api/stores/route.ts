import { NextResponse } from "next/server";
import {
  filterStoreBranches,
  getStoreCities,
  getStoreDistricts,
} from "@/lib/support-stores";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city") || undefined;
    const district = searchParams.get("district") || undefined;
    const hasClinicParam = searchParams.get("hasClinic");
    const query = searchParams.get("q") || searchParams.get("query") || undefined;

    const hasClinic = hasClinicParam === "true" || hasClinicParam === "1" ? true : undefined;

    const branches = filterStoreBranches({
      city,
      district,
      hasClinic,
      query,
    });

    const cities = getStoreCities();
    const districts = getStoreDistricts(city);

    return NextResponse.json({
      ok: true,
      data: branches,
      total: branches.length,
      cities,
      districts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
