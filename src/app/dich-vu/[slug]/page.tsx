import { ServiceView } from "@/components/sites/hasaki/service-view";
import { clinicServices, getClinicServiceRichDetail } from "@/lib/clinic-services";

export const dynamic = "force-dynamic";

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const matched =
    clinicServices.find(item => item.slug === slug || item.slug === `${slug}.html` || item.url.endsWith(slug)) ||
    (() => {
      const rich = getClinicServiceRichDetail(slug);
      return {
        ...clinicServices[0],
        name: rich.name,
        slug: rich.slug,
        price: `${new Intl.NumberFormat("vi-VN").format(rich.price)} ₫`,
        image: rich.images[0] || clinicServices[0].image,
        url: rich.sourceUrl || `https://Nari Home/dich-vu/${slug}`,
      };
    })();
  return <ServiceView service={matched} />;
}
