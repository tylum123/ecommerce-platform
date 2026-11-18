import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CustomerPortalView } from "@/components/sites/nari/customer-portal-view";
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomerSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session) {
    redirect(`/dang-nhap?redirect=/khach-hang/${section}`);
  }

  return <CustomerPortalView section={section} initialSection={section} />;
}
