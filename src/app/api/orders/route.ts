import type { NextRequest } from "next/server";
import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

// Fail closed until PostgreSQL order persistence, server-side pricing, and
// ownership enforcement are wired and tested.
export async function GET(request: NextRequest) {
  void request;
  return authenticationRequired();
}

export async function POST(request: NextRequest) {
  void request;
  return serviceUnavailable();
}
