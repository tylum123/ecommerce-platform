import { BookingView } from "@/components/sites/nari/booking-view";
import { clinicServices } from "@/lib/clinic-services";

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ sku?: string }> }) {
  const { sku } = await searchParams;
  const service = sku ? clinicServices.find(item => item.booking === `/booking?sku=${sku}`) : undefined;
  return <BookingView initialService={service?.name || ""} />;
}
