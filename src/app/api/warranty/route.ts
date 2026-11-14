import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return authenticationRequired();
}

export async function POST() {
  return serviceUnavailable();
}
