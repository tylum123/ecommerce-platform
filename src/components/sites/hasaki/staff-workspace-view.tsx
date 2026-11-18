import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, LockKeyhole, ShieldCheck } from "lucide-react";
import type { AuthSessionUser } from "@/lib/auth";
import { STAFF_WORKSPACES, canViewStaffWorkspace, type StaffWorkspace } from "@/lib/staff-workspaces";

export function StaffWorkspaceView({ session, workspace }: {
  session: AuthSessionUser;
  workspace?: StaffWorkspace;
}) {
  const available = STAFF_WORKSPACES.filter((item) => canViewStaffWorkspace(session.role, item));

  return (
    <main className="min-h-screen bg-[#f3f6f4] px-4 py-8 text-[#1e2922]">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Điều hướng nhân viên" className="mb-6 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4">Cửa hàng trực tuyến</Link>
          <Link href="/nhan-vien" className="underline underline-offset-4">Cổng nhân viên</Link>
        </nav>
        <header className="rounded-2xl bg-[#173a2b] p-6 text-white sm:p-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-[#d4beaa]"><BriefcaseBusiness size={20} /> NARI HOME · NỘI BỘ</div>
          <h1 className="text-2xl font-bold sm:text-3xl">{workspace?.title ?? "Cổng làm việc nhân viên"}</h1>
          <p className="mt-3 text-sm text-white/80">{session.fullName} · {session.roleLabel}</p>
          <p className="mt-1 text-sm text-white/80">{session.role === "admin" ? "Phạm vi quản trị hệ thống" : `Chi nhánh được phân công: ${session.branchName || session.branchId || "Chưa được phân công"}`}</p>
        </header>

        <aside className="my-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <ShieldCheck className="shrink-0" size={20} />
          <p>Tài khoản và quyền xem màn hình đã được máy chủ xác minh. Các tác vụ nghiệp vụ vẫn đang chờ nguồn dữ liệu và kiểm tra quyền thao tác, phạm vi chi nhánh. Chưa có dữ liệu nghiệp vụ để hiển thị hoặc thao tác. Đây là thiết kế nội bộ của dự án.</p>
        </aside>

        <section aria-label="Màn hình theo vai trò" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {available.map((item) => (
            <Link key={item.slug} href={`/nhan-vien/${item.slug}`} aria-current={workspace?.slug === item.slug ? "page" : undefined}
              className={`rounded-xl border bg-white p-5 transition-colors hover:border-[#326e51] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#326e51] ${workspace?.slug === item.slug ? "border-[#326e51] ring-1 ring-[#326e51]" : "border-gray-200"}`}>
              <h2 className="flex items-center justify-between gap-2 font-semibold">{item.title}<ArrowRight size={18} /></h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
            </Link>
          ))}
        </section>

        {workspace && (
          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6" aria-labelledby="workspace-tasks">
            <h2 id="workspace-tasks" className="text-xl font-semibold">Công việc chuyên môn</h2>
            <p id="workspace-unavailable" className="mt-2 text-sm text-gray-600">Chức năng chưa khả dụng. Quyền thao tác và phạm vi chi nhánh cần được kiểm tra tại máy chủ trước khi mở.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {workspace.tasks.map((task) => (
                <div key={task} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium">{task}</h3>
                  <button disabled aria-describedby="workspace-unavailable" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500 disabled:cursor-not-allowed">
                    <LockKeyhole size={16} /> Chưa khả dụng
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
