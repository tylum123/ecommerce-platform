import { BestsellerView } from "@/components/sites/hasaki/bestseller-view";

export default async function BestsellerPage({
  searchParams
}: {
  searchParams?: Promise<{ sort?: string; brand?: string; category?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  return (
    <BestsellerView
      initialSort={params.sort || "topsale"}
      initialBrand={params.brand || ""}
      initialCategory={params.category || ""}
    />
  );
}
