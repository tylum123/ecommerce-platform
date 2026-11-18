import { ServiceView } from "@/components/sites/nari/service-view";
import { notFound } from "next/navigation";
import { clinicServices, getClinicServiceRichDetail } from "@/lib/clinic-services";

export const dynamic = "force-dynamic";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const matched = clinicServices.find(
    item => item.slug === slug || item.slug === `${slug}.html` || item.url.endsWith(slug)
  );
  if (matched) {
    return <ServiceView service={matched} />;
  }
  const rich = getClinicServiceRichDetail(slug);
  if (!rich) notFound();
  return (
    <ServiceView
      service={{
        name: rich.name,
        slug: rich.slug,
        price: `${new Intl.NumberFormat("vi-VN").format(rich.price)} ₫`,
        duration: "",
        booking: `/booking?sku=${rich.sku}`,
        description: "",
        image: rich.images[0] || "",
        url: rich.sourceUrl || `/dich-vu/${slug}`,
      }}
    />
  );
}
