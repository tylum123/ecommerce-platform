import type { NextRequest } from "next/server";
import { serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

// Provider signatures, payment amount, and replay protection are not yet verified.
// Keep webhook fail-closed until PostgreSQL payment settlement is implemented.
export async function POST(request: NextRequest) {
  void request;
  return serviceUnavailable();
}
