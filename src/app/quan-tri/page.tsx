import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/sites/nari/admin-access-denied";
import { AdminErpLoader } from "@/components/sites/nari/admin-erp-loader";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuanTriPage() {
  if (process.env.NARI_ERP_ADMIN_ENABLED === "true") {
    const [
      { isSupabaseSessionConfigured, createSupabaseSession, readSupabaseSessionConfig },
      { createIdentityRoleRepository, resolveSupabasePrincipal },
      { getPostgresDatabase },
    ] = await Promise.all([
      import("@/lib/server/supabase-session"),
      import("@/lib/server/supabase-principal"),
      import("@/lib/server/postgres-database"),
    ]);

    if (!isSupabaseSessionConfigured()) {
      return (
        <main className="mx-auto max-w-xl p-8">
          <h1 className="text-xl font-semibold">Cổng quản trị ERP tạm chưa khả dụng</h1>
          <p className="mt-3 text-sm text-gray-600">
            Hệ thống xác thực hoặc cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.
          </p>
        </main>
      );
    }

    const request = new NextRequest("http://localhost/quan-tri", { headers: await headers() });
    const config = readSupabaseSessionConfig();
    const session = createSupabaseSession(request, config);
    const db = getPostgresDatabase();
    const user = await resolveSupabasePrincipal(session.client.auth, createIdentityRoleRepository(db));

    if (!user) {
      redirect("/dang-nhap?redirect=/quan-tri");
    }

    if (!isStaffOrAdminRole(user.role)) {
      return <AdminAccessDenied user={user} />;
    }

    return <AdminErpLoader initialSession={user} />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session) {
    redirect("/dang-nhap?redirect=/quan-tri");
  }

  if (!isStaffOrAdminRole(session.role)) {
    const user: AuthSessionUser = {
      id: session.id,
      fullName: session.fullName,
      email: session.email,
      phone: session.phone,
      role: session.role,
      roleLabel: session.roleLabel,
      tier: session.tier,
      branchId: session.branchId,
      branchName: session.branchName,
      loggedInAt: new Date(session.iat * 1000).toISOString(),
    };
    return <AdminAccessDenied user={user} />;
  }

  return <AdminErpLoader />;
}
