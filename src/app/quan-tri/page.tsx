import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminErpView } from "@/components/sites/hasaki/admin-erp-view";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
  isStaffOrAdminRole,
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
    redirect("/khach-hang/tai-khoan?error=access_denied_admin_only");
  }

  return <AdminErpView />;
}
