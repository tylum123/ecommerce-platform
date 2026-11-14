import { ClinicView } from "@/components/sites/hasaki/clinic-view";

export default async function ClinicServiceLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  return <ClinicView sort={sort || "position"} />;
}
