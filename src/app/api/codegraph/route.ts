import { authenticationRequired } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  return authenticationRequired();
}
