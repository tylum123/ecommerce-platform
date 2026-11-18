import { BookingView, type BookingBranchOption } from "@/components/sites/nari/booking-view";
import { readPostgresBranchesSafely, readPostgresClinicServicesSafely } from "@/lib/server/postgres-clinic-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

export default async function DatLichKhamPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>;
}) {
  const [{ sku }, clinicBranches, clinicServices] = await Promise.all([
    searchParams,
    readPostgresBranchesSafely(() => getPostgresDatabase(), { hasClinic: true }),
    readPostgresClinicServicesSafely(() => getPostgresDatabase()),
  ]);
  const branches: BookingBranchOption[] = clinicBranches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    address: branch.address,
    ...(branch.image ? { image: branch.image } : {}),
  }));
  const service = sku
    ? clinicServices.find(
        (item) => item.booking === `/booking?sku=${sku}` || item.booking === `/booking?sku=${encodeURIComponent(sku)}`
      )
    : undefined;
  return <BookingView initialService={service?.name || ""} branches={branches} />;
}
