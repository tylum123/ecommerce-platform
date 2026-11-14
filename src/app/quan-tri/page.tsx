import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminErpView, AdminAccessDenied } from "@/components/sites/hasaki/admin-erp-view";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function QuanTriPage() {
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

  return <AdminErpView />;
}

