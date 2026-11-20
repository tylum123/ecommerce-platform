export type UserTier = "Member" | "Silver" | "Gold" | "Diamond";
export type UserStatus = "active" | "locked";

export interface UserRecord {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  tier: UserTier;
  loyaltyPoints: number;
  totalSpent: number;
  ordersCount: number;
  address: string;
  status: UserStatus;
  createdAt: string;
}

export type StaffRole = "admin" | "store_manager" | "warehouse_staff" | "clinic_doctor" | "cs_agent";
export type StaffStatus = "active" | "on_leave" | "inactive";

export interface StaffRecord {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  roleLabel: string;
  branchId: string;
  branchName: string;
  department: string;
  status: StaffStatus;
  permissions: string[];
  joinedAt: string;
}

export type WarehouseStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface BranchStock {
  branchId: string;
  branchCode?: string;
  branchName: string;
  quantity: number;
  reservedQuantity?: number;
  availableQuantity?: number;
}

export interface ErpBranchSummary {
  id: string;
  code: string;
  name: string;
  city: string;
  district: string;
}

export interface InventoryRecord {
  productId?: string;
  sku: string;
  productSlug: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  warehouseStatus: WarehouseStatus;
  branchStock: BranchStock[];
  lastRestockedAt: string;
}

export interface InventoryAuditLog {
  id: string;
  sku: string;
  productName: string;
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  staffCode: string;
  branchId: string;
  branchName: string;
  timestamp: string;
}

export type ErpOrderStatus =
  | "pending"
  | "confirmed"
  | "packing"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus = "paid" | "unpaid" | "refunded";

export interface ErpOrderItem {
  sku: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  slug: string;
}

export interface ErpOrderRecord {
  id: string;
  orderCode: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: ErpOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: ErpOrderStatus;
  statusLabel: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  branchId: string | null;
  branchName: string;
  assignedStaffCode: string;
  assignedStaffName: string;
  version: number;
  notes?: string;
}

export interface ErpDashboardKpis {
  totalRevenue: number;
  totalOrders: number;
  pendingOrdersCount: number;
  packingShippingCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  totalCustomers: number;
  activeCustomers: number;
  totalStaff: number;
  activeStaff: number;
  totalSkus: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentAuditLogs: InventoryAuditLog[];
  lowStockItems: InventoryRecord[];
  todayOrdersCount: number;
  todayRevenue: number;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Quản Trị Viên Hệ Thống",
  store_manager: "Quản Lý Cửa Hàng",
  warehouse_staff: "Nhân Viên Quản Lý Kho",
  clinic_doctor: "Bác Sĩ Da Liễu Nari Clinic & Spa",
  cs_agent: "Chuyên Viên Chăm Sóc Khách Hàng",
};

export const STAFF_DEPARTMENTS: Record<StaffRole, string> = {
  admin: "Ban Điều Hành",
  store_manager: "Vận Hành Cửa Hàng",
  warehouse_staff: "Kho Vận & Giao Nhận",
  clinic_doctor: "Nari Clinic & Spa",
  cs_agent: "Chăm Sóc Khách Hàng",
};

export const ORDER_STATUS_LABELS: Record<ErpOrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao hàng (NariNow 2H)",
  delivered: "Đã giao thành công",
  cancelled: "Đã hủy đơn",
  returned: "Hoàn trả",
};
