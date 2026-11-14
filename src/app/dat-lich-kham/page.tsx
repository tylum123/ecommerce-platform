import { BookingView } from "@/components/sites/hasaki/booking-view";
import services from "../../../docs/research/hasaki/clinic-services-2026-11-13.json";

export default async function DatLichKhamPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>;
}) {
  const { sku } = await searchParams;
  const service = sku ? services.find((item) => item.booking === `/booking?sku=${sku}`) : undefined;
  return <BookingView initialService={service?.name || ""} />;
}
