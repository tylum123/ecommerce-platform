import type { AuthRole } from "@/lib/auth";

export const STAFF_WORKSPACES = [
  {
    slug: "cua-hang",
    role: "store_manager",
    title: "Quản lý cửa hàng",
    description: "Theo dõi đơn hàng và hoạt động tại chi nhánh được phân công.",
    tasks: ["Đơn hàng chi nhánh", "Tra cứu tồn kho", "Nhân sự cửa hàng"],
  },
  {
    slug: "kho",
    role: "warehouse_staff",
    title: "Kho và giao vận",
    description: "Kiểm tra tồn kho, soạn hàng và điều phối giao hàng.",
    tasks: ["Tồn kho chi nhánh", "Danh sách cần soạn", "Bàn giao vận chuyển"],
  },
  {
    slug: "clinic",
    role: "clinic_doctor",
    title: "Bác sĩ Clinic",
    description: "Quản lý lịch hẹn và công việc chuyên môn được phân công.",
    tasks: ["Lịch hẹn được phân công", "Hồ sơ điều trị", "Chỉ định chuyên môn"],
  },
  {
    slug: "cskh",
    role: "cs_agent",
    title: "Chăm sóc khách hàng",
    description: "Tiếp nhận yêu cầu và hỗ trợ tra cứu đơn hàng của khách.",
    tasks: ["Yêu cầu hỗ trợ", "Tra cứu đơn hàng", "Hỗ trợ lịch hẹn"],
  },
] as const;

export type StaffWorkspace = (typeof STAFF_WORKSPACES)[number];

// This controls screen visibility only. Every data entry point must authorize
// its own operation and branch scope before these workspaces can load data.
export function canViewStaffWorkspace(role: AuthRole, workspace: StaffWorkspace): boolean {
  return role === "admin" || role === workspace.role;
}
