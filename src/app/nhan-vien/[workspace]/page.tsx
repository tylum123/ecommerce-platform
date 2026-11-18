import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { notFound, redirect } from "next/navigation";
import { authorizeStaffPortalPage } from "@/lib/server/staff-portal-access";
import { STAFF_WORKSPACES, canViewStaffWorkspace } from "@/lib/staff-workspaces";
import { StaffWorkspaceView } from "@/components/sites/nari/staff-workspace-view";

export const dynamic = "force-dynamic";

export default async function StaffWorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace: slug } = await params;
  const workspace = STAFF_WORKSPACES.find((item) => item.slug === slug);
  if (!workspace) notFound();
  const access = await authorizeStaffPortalPage(new NextRequest(`http://localhost/nhan-vien/${workspace.slug}`, { headers: await headers() }));
  if (access.status === 401) redirect(`/dang-nhap?redirect=${encodeURIComponent(`/nhan-vien/${workspace.slug}`)}`);
  if (access.status === 403) notFound();
  if (access.status !== 200) return <main className="p-8"><h1 className="text-xl font-semibold">Cổng nhân viên chưa khả dụng</h1><p className="mt-3">Dịch vụ đang chờ cấu hình xác thực và phân quyền. Vui lòng thử lại sau.</p></main>;
  if (!canViewStaffWorkspace(access.user.role, workspace)) notFound();
  return <StaffWorkspaceView session={access.user} workspace={workspace} />;
}
