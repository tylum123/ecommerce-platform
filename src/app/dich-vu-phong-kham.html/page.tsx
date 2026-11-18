import { ClinicView } from "@/components/sites/nari/clinic-view";

export default async function ClinicServiceLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  return <ClinicView sort={sort || "position"} />;
}
