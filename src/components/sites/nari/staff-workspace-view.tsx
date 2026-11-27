import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Headphones,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Store,
  UserCheck,
  Warehouse,
} from "lucide-react";
import type { AuthSessionUser } from "@/lib/auth";
import {
  STAFF_WORKSPACES,
  canViewStaffWorkspace,
  type StaffWorkspace,
} from "@/lib/staff-workspaces";
import {
  BackofficeShell,
  type BackofficeNavGroup,
  type BackofficeNavItem,
} from "@/components/sites/nari/portal/backoffice-shell";
import {
  KpiStatCard,
  PortalPageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/sites/nari/portal/portal-ui";

function getWorkspaceNavIcon(slug: StaffWorkspace["slug"]): BackofficeNavItem["icon"] {
  switch (slug) {
    case "cua-hang":
      return "store";
    case "kho":
      return "warehouse";
    case "cskh":
      return "support";
  }
}

function WorkspaceCardIcon({ slug, active }: { slug: StaffWorkspace["slug"]; active: boolean }) {
  const cls = active ? "h-5 w-5 text-[#faf5f0]" : "h-5 w-5 text-[#9e7656]";
  switch (slug) {
    case "cua-hang":
      return <Store className={cls} />;
    case "kho":
      return <Warehouse className={cls} />;
    case "cskh":
      return <Headphones className={cls} />;
  }
}

export function StaffWorkspaceView({
  session,
  workspace,
}: {
  session: AuthSessionUser;
  workspace?: StaffWorkspace;
}) {
  const available = STAFF_WORKSPACES.filter((item) => canViewStaffWorkspace(session.role, item));
  const branchScope =
    session.role === "admin"
      ? "Phạm vi quản trị hệ thống"
      : `Chi nhánh: ${session.branchName || session.branchId || "Chưa được phân công"}`;
  const branchValue =
    session.role === "admin"
      ? "Toàn hệ thống"
      : session.branchName || session.branchId || "Chưa phân công";

  const navGroups: BackofficeNavGroup[] = [
    {
      title: "Không gian làm việc",
      items: [
        {
          id: "overview",
          label: "Tổng quan",
          href: "/nhan-vien",
          icon: "overview",
          active: !workspace,
        },
        ...available.map((item) => ({
          id: item.slug,
          label: item.title,
          href: `/nhan-vien/${item.slug}`,
          icon: getWorkspaceNavIcon(item.slug),
          active: workspace?.slug === item.slug,
        })),
      ],
    },
  ];

  return (
    <BackofficeShell
      sectionLabel="Cổng Nhân Viên"
      userLabel={session.fullName}
      roleLabel={session.roleLabel}
      branchLabel={branchScope}
      navGroups={navGroups}
    >
      <PortalPageHeader
        title={workspace?.title ?? "Cổng làm việc nhân viên"}
        badge={<StatusBadge tone="accent">{session.roleLabel}</StatusBadge>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiStatCard
          label="Vai trò hiện tại"
          value={session.roleLabel}
          hint={session.fullName}
          icon={<UserCheck className="h-4 w-4" />}
          tone="accent"
        />
        <KpiStatCard
          label="Phạm vi chi nhánh"
          value={branchValue}
          hint={
            session.role === "admin"
              ? "Có quyền truy cập tất cả phân hệ nội bộ"
              : "Giới hạn dữ liệu theo chi nhánh được phân công"
          }
          icon={<Building2 className="h-4 w-4" />}
        />
        <KpiStatCard
          label="Phân hệ được cấp quyền"
          value={available.length}
          hint={`Trên tổng số ${STAFF_WORKSPACES.length} phân hệ vận hành`}
          icon={<Layers3 className="h-4 w-4" />}
        />
      </div>

      <aside className="mb-6 flex items-start gap-3.5 rounded-2xl border border-[#d8b89c] bg-[#f6ece3] px-5 py-4 text-sm text-[#3d2e24]">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#b86b4b]">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 leading-relaxed">
          <p className="font-semibold text-[#3d2e24]">
            Quyền truy cập đã được máy chủ xác minh · Chưa có dữ liệu nghiệp vụ
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#5c493e]">
            Tài khoản và phạm vi hiển thị màn hình đã qua kiểm tra từ máy chủ. Các tác vụ nghiệp vụ
            hiện đang được khóa an toàn để chờ mở API phân quyền thao tác theo từng chi nhánh. Chưa
            có dữ liệu nghiệp vụ để hiển thị hoặc thao tác.
          </p>
        </div>
      </aside>

      <section aria-label="Màn hình theo vai trò" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((item) => {
          const isActive = workspace?.slug === item.slug;
          return (
            <Link
              key={item.slug}
              href={`/nhan-vien/${item.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={`group flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-[0_2px_12px_rgba(61,46,36,0.04)] transition-all hover:border-[#b86b4b] hover:shadow-[0_6px_20px_rgba(61,46,36,0.08)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b86b4b] ${
                isActive
                  ? "border-[#b86b4b] ring-1 ring-[#b86b4b] bg-gradient-to-br from-white to-[#faf5f0]"
                  : "border-[#e6d5c5]"
              }`}
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-[#b86b4b] text-[#faf5f0]"
                        : "bg-[#f6ece3] text-[#9e7656] group-hover:bg-[#b86b4b]/15 group-hover:text-[#b86b4b]"
                    }`}
                  >
                    <WorkspaceCardIcon slug={item.slug} active={isActive} />
                  </span>
                  {isActive ? (
                    <StatusBadge tone="accent">Đang mở</StatusBadge>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-[#9e7656] transition-transform group-hover:translate-x-0.5 group-hover:text-[#b86b4b]" />
                  )}
                </div>
                <h2 className="text-base font-semibold text-[#3d2e24]">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-[#6e5a4f]">{item.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#efe2d4] pt-3 text-[11px] font-medium text-[#9e7656]">
                <span>{item.tasks.length} nhóm tác vụ chuyên môn</span>
                <span className="text-[#b86b4b]">Mở phân hệ</span>
              </div>
            </Link>
          );
        })}
      </section>

      {workspace && (
        <SectionCard
          title="Công việc chuyên môn"
          description="Chức năng chưa khả dụng. Quyền thao tác và phạm vi chi nhánh cần được kiểm tra tại máy chủ trước khi mở."
          actions={<StatusBadge tone="neutral">Khóa an toàn</StatusBadge>}
          className="mt-6"
        >
          <p id="workspace-unavailable" className="sr-only">
            Chức năng chưa khả dụng. Quyền thao tác và phạm vi chi nhánh cần được kiểm tra tại máy
            chủ trước khi mở.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {workspace.tasks.map((task) => (
              <div
                key={task}
                className="flex flex-col justify-between rounded-2xl border border-[#e6d5c5] bg-[#faf5f0]/50 p-4"
              >
                <div>
                  <h3 className="text-sm font-semibold text-[#3d2e24]">{task}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#6e5a4f]">
                    Chờ kích hoạt API nghiệp vụ theo phạm vi chi nhánh.
                  </p>
                </div>
                <button
                  disabled
                  type="button"
                  aria-describedby="workspace-unavailable"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e6d5c5] bg-[#f6ece3]/70 px-3 py-2 text-xs font-medium text-[#7c685c] disabled:cursor-not-allowed"
                >
                  <LockKeyhole className="h-3.5 w-3.5" />
                  <span>Chưa khả dụng</span>
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </BackofficeShell>
  );
}
