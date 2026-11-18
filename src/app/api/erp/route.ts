import type { NextRequest } from "next/server";
import { authenticationRequired } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

// Fail closed until PostgreSQL ERP persistence and session authorization are wired.
export async function GET(request: NextRequest) {
  void request;
  return authenticationRequired();
}

export async function POST(request: NextRequest) {
  void request;
  return authenticationRequired();
}
