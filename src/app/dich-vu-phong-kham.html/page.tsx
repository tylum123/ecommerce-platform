import { ClinicView } from "@/components/sites/nari/clinic-view";
import { readPostgresClinicServicesSafely } from "@/lib/server/postgres-clinic-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

export default async function ClinicServiceLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ sort }, services] = await Promise.all([
    searchParams,
    readPostgresClinicServicesSafely(() => getPostgresDatabase()),
  ]);
  return <ClinicView sort={sort || "position"} services={services} />;
}
