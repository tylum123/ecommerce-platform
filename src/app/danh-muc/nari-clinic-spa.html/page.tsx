import { ClinicView } from "@/components/sites/nari/clinic-view";

export default async function ClinicPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort = "topsale" } = await searchParams;
  return <ClinicView sort={sort} />;
}
