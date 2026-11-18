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

  if (process.env.NARI_AUTH_ENABLED === "true") {
    const { isSupabaseSessionConfigured, readSupabaseSessionConfig } = await import(
      "@/lib/server/supabase-session"
    );
    if (isSupabaseSessionConfigured()) {
      const config = readSupabaseSessionConfig();
      const { createServerClient } = await import("@supabase/ssr");
      const supabase = createServerClient(config.url, config.key, {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      });
      let authenticated = false;
      try {
        const { data, error } = await supabase.auth.getUser();
        authenticated = Boolean(!error && data.user);
      } catch {
        authenticated = false;
      }
      if (!authenticated) {
        redirect(`/dang-nhap?redirect=/khach-hang/${encodeURIComponent(section)}`);
      }
      return <CustomerPortalView section={section} initialSection={section} />;
    }
  }

  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session) {
    redirect(`/dang-nhap?redirect=/khach-hang/${encodeURIComponent(section)}`);
  }

  return <CustomerPortalView section={section} initialSection={section} />;
}
