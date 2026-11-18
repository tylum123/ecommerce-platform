import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { notFound, redirect } from "next/navigation";
import { authorizeStaffPortalPage } from "@/lib/server/staff-portal-access";
import { StaffWorkspaceView } from "@/components/sites/nari/staff-workspace-view";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const access = await authorizeStaffPortalPage(new NextRequest("http://localhost/nhan-vien", { headers: await headers() }));
  if (access.status === 401) redirect("/dang-nhap?redirect=/nhan-vien");
  if (access.status === 403) notFound();
  if (access.status !== 200) return <main className="p-8"><h1 className="text-xl font-semibold">Cổng nhân viên chưa khả dụng</h1><p className="mt-3">Dịch vụ đang chờ cấu hình xác thực và phân quyền. Vui lòng thử lại sau.</p></main>;
  return <StaffWorkspaceView session={access.user} />;
}
