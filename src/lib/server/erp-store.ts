/**
 * Enterprise ERP Service & Repository for Hasaki Clone.
 * Manages Multi-Branch Inventory, Customers, Staff RBAC, Orders Fulfillment, and Audit Logs.
 * CodeGraph-indexed enterprise repository.
 */

import { getAllCatalogProducts, Product } from "@/lib/catalog";

// ---------------------------------------------------------------------------
// 1. Types & Interfaces
// ---------------------------------------------------------------------------

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
  branchName: string;
  quantity: number;
}

export interface InventoryRecord {
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

export type ErpOrderStatus = "pending" | "confirmed" | "packing" | "shipping" | "delivered" | "cancelled";
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
  deliveryType: "NowFree 2H" | "Tiêu chuẩn";
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  branchName: string;
  assignedStaffCode: string;
  assignedStaffName: string;
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

// ---------------------------------------------------------------------------
// 2. Constants & Helpers
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Quản Trị Viên Hệ Thống",
  store_manager: "Quản Lý Cửa Hàng",
  warehouse_staff: "Nhân Viên Quản Lý Kho",
  clinic_doctor: "Bác Sĩ Da Liễu Hasaki Clinic",
  cs_agent: "Chuyên Viên Chăm Sóc Khách Hàng",
};

export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  admin: [
    "users:read",
    "users:write",
    "staff:manage",
    "inventory:manage",
    "orders:manage",
    "finance:read",
    "system:config",
    "mcp:execute",
  ],
  store_manager: [
    "users:read",
    "inventory:manage",
    "orders:manage",
    "staff:read",
    "reports:branch",
  ],
  warehouse_staff: [
    "inventory:read",
    "inventory:write",
    "orders:pack",
    "shipping:dispatch",
  ],
  clinic_doctor: [
    "clinic:appointments",
    "clinic:treatments",
    "clinic:prescriptions",
    "users:read",
  ],
  cs_agent: [
    "users:read",
    "users:points",
    "orders:read",
    "orders:support",
    "tickets:manage",
  ],
};

export const ORDER_STATUS_LABELS: Record<ErpOrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao hàng (NowFree 2H)",
  delivered: "Đã giao thành công",
  cancelled: "Đã hủy đơn",
};

export const BRANCH_DEFINITIONS = [
  { id: "CN1", name: "CN1 - 71 Hoàng Hoa Thám, Tân Bình, TP.HCM" },
  { id: "CN2", name: "CN2 - 555 Đường 3/2, Quận 10, TP.HCM" },
  { id: "CN15", name: "CN15 - 182 Cầu Giấy, Hà Nội" },
  { id: "CN28", name: "CN28 - Nguyễn Văn Linh, Đà Nẵng" },
] as const;

// ---------------------------------------------------------------------------
// 3. Seed Data
// ---------------------------------------------------------------------------

function createInitialUsers(): UserRecord[] {
  return [
    {
      id: "usr-001",
      fullName: "Nguyễn Minh Anh",
      phone: "0908123456",
      email: "minhanh.nguyen@gmail.com",
      tier: "Gold",
      loyaltyPoints: 420,
      totalSpent: 3450000,
      ordersCount: 5,
      address: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
      status: "active",
      createdAt: "2024-03-15T08:30:00Z",
    },
    {
      id: "usr-002",
      fullName: "Trần Thị Thu Hà",
      phone: "0912345678",
      email: "thuha.tran@hasaki-demo.vn",
      tier: "Diamond",
      loyaltyPoints: 1280,
      totalSpent: 12890000,
      ordersCount: 18,
      address: "158 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh",
      status: "active",
      createdAt: "2023-11-20T10:15:00Z",
    },
    {
      id: "usr-003",
      fullName: "Lê Hoàng Nam",
      phone: "0987654321",
      email: "hoangnam.le@gmail.com",
      tier: "Silver",
      loyaltyPoints: 180,
      totalSpent: 1240000,
      ordersCount: 2,
      address: "182 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội",
      status: "active",
      createdAt: "2024-08-05T14:20:00Z",
    },
    {
      id: "usr-004",
      fullName: "Phạm Quỳnh Như",
      phone: "0933889900",
      email: "quynhnhu.pham@yahoo.com",
      tier: "Diamond",
      loyaltyPoints: 2450,
      totalSpent: 24150000,
      ordersCount: 32,
      address: "555 Đường 3/2, Phường 8, Quận 10, TP. Hồ Chí Minh",
      status: "active",
      createdAt: "2023-05-10T09:00:00Z",
    },
    {
      id: "usr-005",
      fullName: "Vũ Đức Trọng",
      phone: "0944112233",
      email: "ductrong.vu@gmail.com",
      tier: "Member",
      loyaltyPoints: 50,
      totalSpent: 450000,
      ordersCount: 1,
      address: "48 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận, TP. Hồ Chí Minh",
      status: "active",
      createdAt: "2025-01-12T16:45:00Z",
    },
    {
      id: "usr-006",
      fullName: "Đỗ Thị Mai Linh",
      phone: "0977223344",
      email: "mailinh.do@gmail.com",
      tier: "Silver",
      loyaltyPoints: 260,
      totalSpent: 2100000,
      ordersCount: 4,
      address: "120 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng",
      status: "active",
      createdAt: "2024-06-18T11:20:00Z",
    },
    {
      id: "usr-007",
      fullName: "Bùi Văn Hùng",
      phone: "0909556677",
      email: "hung.bui@hotmail.com",
      tier: "Member",
      loyaltyPoints: 0,
      totalSpent: 0,
      ordersCount: 0,
      address: "25 Quang Trung, Phường 10, Quận Gò Vấp, TP. Hồ Chí Minh",
      status: "locked",
      createdAt: "2025-02-01T13:10:00Z",
    },
    {
      id: "usr-008",
      fullName: "Hoàng Yến Nhi",
      phone: "0922334455",
      email: "yennhi.hoang@gmail.com",
      tier: "Gold",
      loyaltyPoints: 680,
      totalSpent: 6700000,
      ordersCount: 9,
      address: "88 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      status: "active",
      createdAt: "2023-12-01T15:00:00Z",
    },
  ];
}

function createInitialStaff(): StaffRecord[] {
  return [
    {
      id: "stf-001",
      employeeCode: "NV-HSK-001",
      fullName: "Trần Đình Khoa",
      email: "khoa.tran@hasaki.vn",
      phone: "0903112233",
      role: "admin",
      roleLabel: ROLE_LABELS.admin,
      branchId: "HQ",
      branchName: "Trụ sở chính Hasaki (HQ)",
      department: "Công Nghệ & Điều Hành Hệ Thống",
      status: "active",
      permissions: ROLE_PERMISSIONS.admin,
      joinedAt: "2022-01-15T08:00:00Z",
    },
    {
      id: "stf-002",
      employeeCode: "NV-HSK-002",
      fullName: "Lê Thị Bích Ngọc",
      email: "ngoc.le@hasaki.vn",
      phone: "0903223344",
      role: "store_manager",
      roleLabel: ROLE_LABELS.store_manager,
      branchId: "CN1",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      department: "Khối Cửa Hàng Bán Lẻ",
      status: "active",
      permissions: ROLE_PERMISSIONS.store_manager,
      joinedAt: "2022-05-10T08:00:00Z",
    },
    {
      id: "stf-003",
      employeeCode: "NV-HSK-003",
      fullName: "Nguyễn Văn Thành",
      email: "thanh.nguyen@hasaki.vn",
      phone: "0903334455",
      role: "warehouse_staff",
      roleLabel: ROLE_LABELS.warehouse_staff,
      branchId: "CN2",
      branchName: "CN2 - 555 Đường 3/2, Quận 10",
      department: "Kho Vận & Logistics",
      status: "active",
      permissions: ROLE_PERMISSIONS.warehouse_staff,
      joinedAt: "2023-02-01T08:00:00Z",
    },
    {
      id: "stf-004",
      employeeCode: "NV-HSK-004",
      fullName: "BS. CKI Nguyễn Thị Mai",
      email: "mai.nguyen.md@hasakiclinic.vn",
      phone: "0903445566",
      role: "clinic_doctor",
      roleLabel: ROLE_LABELS.clinic_doctor,
      branchId: "CN1",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      department: "Hasaki Clinic & Spa Da Liễu",
      status: "active",
      permissions: ROLE_PERMISSIONS.clinic_doctor,
      joinedAt: "2022-08-20T08:00:00Z",
    },
    {
      id: "stf-005",
      employeeCode: "NV-HSK-005",
      fullName: "Phạm Hoàng Oanh",
      email: "oanh.pham@hasaki.vn",
      phone: "0903556677",
      role: "cs_agent",
      roleLabel: ROLE_LABELS.cs_agent,
      branchId: "HQ",
      branchName: "Trung tâm CSKH TP.HCM",
      department: "Chăm Sóc & Trải Nghiệm Khách Hàng",
      status: "active",
      permissions: ROLE_PERMISSIONS.cs_agent,
      joinedAt: "2023-06-15T08:00:00Z",
    },
    {
      id: "stf-006",
      employeeCode: "NV-HSK-006",
      fullName: "Đặng Quốc Bảo",
      email: "bao.dang@hasaki.vn",
      phone: "0903667788",
      role: "store_manager",
      roleLabel: ROLE_LABELS.store_manager,
      branchId: "CN15",
      branchName: "CN15 - 182 Cầu Giấy, Hà Nội",
      department: "Khối Cửa Hàng Bán Lẻ",
      status: "active",
      permissions: ROLE_PERMISSIONS.store_manager,
      joinedAt: "2023-09-01T08:00:00Z",
    },
    {
      id: "stf-007",
      employeeCode: "NV-HSK-007",
      fullName: "Vũ Hải Yến",
      email: "yen.vu@hasaki.vn",
      phone: "0903778899",
      role: "warehouse_staff",
      roleLabel: ROLE_LABELS.warehouse_staff,
      branchId: "CN28",
      branchName: "CN28 - Nguyễn Văn Linh, Đà Nẵng",
      department: "Kho Vận & Logistics",
      status: "on_leave",
      permissions: ROLE_PERMISSIONS.warehouse_staff,
      joinedAt: "2024-01-10T08:00:00Z",
    },
    {
      id: "stf-008",
      employeeCode: "NV-HSK-008",
      fullName: "BS. Trần Bảo Ngọc",
      email: "ngoc.tran.md@hasakiclinic.vn",
      phone: "0903889900",
      role: "clinic_doctor",
      roleLabel: ROLE_LABELS.clinic_doctor,
      branchId: "CN2",
      branchName: "CN2 - 555 Đường 3/2, Quận 10",
      department: "Hasaki Clinic & Spa Da Liễu",
      status: "active",
      permissions: ROLE_PERMISSIONS.clinic_doctor,
      joinedAt: "2023-04-12T08:00:00Z",
    },
  ];
}

function createInitialInventory(): { records: InventoryRecord[]; logs: InventoryAuditLog[] } {
  const catalogProducts: Product[] = getAllCatalogProducts().slice(0, 30);
  const records: InventoryRecord[] = [];
  const logs: InventoryAuditLog[] = [];

  catalogProducts.forEach((p, idx) => {
    // Generate realistic numeric SKU
    const sku = p.sku ? String(p.sku) : `HSK-${(100234 + idx * 7).toString()}`;
    const reorderPoint = 20;

    // Make items at index 1, 4, 7 start with low_stock (< 20)
    let totalStock = 45 + ((idx * 17) % 80);
    if (idx === 1) totalStock = 12; // low stock
    if (idx === 4) totalStock = 9;  // low stock
    if (idx === 7) totalStock = 15; // low stock
    if (idx === 14) totalStock = 6; // low stock

    const reservedStock = Math.min(Math.floor(totalStock * 0.15), 5);
    const availableStock = Math.max(0, totalStock - reservedStock);

    let warehouseStatus: WarehouseStatus = "in_stock";
    if (totalStock === 0) {
      warehouseStatus = "out_of_stock";
    } else if (totalStock <= reorderPoint) {
      warehouseStatus = "low_stock";
    }

    // Distribute stock across 4 branches
    const q1 = Math.floor(totalStock * 0.4);
    const q2 = Math.floor(totalStock * 0.3);
    const q3 = Math.floor(totalStock * 0.2);
    const q4 = Math.max(0, totalStock - q1 - q2 - q3);

    const branchStock: BranchStock[] = [
      { branchId: "CN1", branchName: BRANCH_DEFINITIONS[0].name, quantity: q1 },
      { branchId: "CN2", branchName: BRANCH_DEFINITIONS[1].name, quantity: q2 },
      { branchId: "CN15", branchName: BRANCH_DEFINITIONS[2].name, quantity: q3 },
      { branchId: "CN28", branchName: BRANCH_DEFINITIONS[3].name, quantity: q4 },
    ];

    records.push({
      sku,
      productSlug: p.slug,
      productName: p.name,
      brand: p.brand || "Hasaki",
      category: p.category || "my-pham",
      price: p.price || 150000,
      totalStock,
      reservedStock,
      availableStock,
      reorderPoint,
      warehouseStatus,
      branchStock,
      lastRestockedAt: new Date(Date.now() - (idx * 3600000 * 12)).toISOString(),
    });
  });

  // Seed 5 initial audit logs
  if (records.length >= 4) {
    logs.push(
      {
        id: "log-001",
        sku: records[0].sku,
        productName: records[0].productName,
        delta: +50,
        previousStock: records[0].totalStock - 50,
        newStock: records[0].totalStock,
        reason: "Nhập hàng chính hãng từ Nhà phân phối CeraVe Việt Nam",
        staffCode: "NV-HSK-003",
        branchId: "CN1",
        branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
        timestamp: "2026-11-12T09:30:00Z",
      },
      {
        id: "log-002",
        sku: records[1].sku,
        productName: records[1].productName,
        delta: -10,
        previousStock: records[1].totalStock + 10,
        newStock: records[1].totalStock,
        reason: "Xuất kho phục vụ chiến dịch Flash Deal NowFree 2H",
        staffCode: "NV-HSK-003",
        branchId: "CN2",
        branchName: "CN2 - 555 Đường 3/2, Quận 10",
        timestamp: "2026-11-12T14:15:00Z",
      },
      {
        id: "log-003",
        sku: records[2].sku,
        productName: records[2].productName,
        delta: +30,
        previousStock: records[2].totalStock - 30,
        newStock: records[2].totalStock,
        reason: "Điều chuyển hàng từ Kho Tổng về Chi nhánh Hà Nội",
        staffCode: "NV-HSK-007",
        branchId: "CN15",
        branchName: "CN15 - 182 Cầu Giấy, Hà Nội",
        timestamp: "2026-11-12T16:45:00Z",
      },
      {
        id: "log-004",
        sku: records[4].sku,
        productName: records[4].productName,
        delta: -5,
        previousStock: records[4].totalStock + 5,
        newStock: records[4].totalStock,
        reason: "Xuất mẫu trải nghiệm tại Hasaki Clinic & kiểm định chất lượng",
        staffCode: "NV-HSK-002",
        branchId: "CN1",
        branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
        timestamp: "2026-11-13T08:10:00Z",
      },
      {
        id: "log-005",
        sku: records[7].sku,
        productName: records[7].productName,
        delta: -8,
        previousStock: records[7].totalStock + 8,
        newStock: records[7].totalStock,
        reason: "Đóng gói đơn hàng NowFree 2H cho khách hàng VIP Gold",
        staffCode: "NV-HSK-003",
        branchId: "CN2",
        branchName: "CN2 - 555 Đường 3/2, Quận 10",
        timestamp: "2026-11-13T10:00:00Z",
      }
    );
  }

  return { records, logs };
}

function createInitialOrders(inventory: InventoryRecord[]): ErpOrderRecord[] {
  const getProductInfo = (index: number) => {
    const inv = inventory[index % inventory.length];
    return {
      sku: inv ? inv.sku : "422208973",
      name: inv ? inv.productName : "Sản phẩm Hasaki",
      brand: inv ? inv.brand : "Hasaki",
      price: inv ? inv.price : 250000,
      slug: inv ? inv.productSlug : "san-pham-mau.html",
    };
  };

  const p0 = getProductInfo(0);
  const p1 = getProductInfo(1);
  const p2 = getProductInfo(2);
  const p3 = getProductInfo(3);
  const p4 = getProductInfo(4);

  return [
    {
      id: "ord-202611-0941",
      orderCode: "HSK-202611-0941",
      createdAt: "2026-11-13T09:15:00Z",
      customerName: "Nguyễn Minh Anh",
      customerPhone: "0908123456",
      shippingAddress: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
      items: [
        { ...p0, quantity: 1 },
        { ...p1, quantity: 1 },
      ],
      subtotal: p0.price + p1.price,
      shippingFee: 0,
      total: p0.price + p1.price,
      status: "shipping",
      statusLabel: ORDER_STATUS_LABELS.shipping,
      deliveryType: "NowFree 2H",
      paymentMethod: "Thanh toán khi nhận hàng (COD)",
      paymentStatus: "unpaid",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      assignedStaffCode: "NV-HSK-003",
      assignedStaffName: "Nguyễn Văn Thành",
      notes: "Giao gấp trong 2H trước 11:30 sáng",
    },
    {
      id: "ord-202611-0952",
      orderCode: "HSK-202611-0952",
      createdAt: "2026-11-13T09:45:00Z",
      customerName: "Trần Thị Thu Hà",
      customerPhone: "0912345678",
      shippingAddress: "158 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh",
      items: [
        { ...p2, quantity: 2 },
        { ...p3, quantity: 1 },
      ],
      subtotal: p2.price * 2 + p3.price,
      shippingFee: 0,
      total: p2.price * 2 + p3.price,
      status: "packing",
      statusLabel: ORDER_STATUS_LABELS.packing,
      deliveryType: "NowFree 2H",
      paymentMethod: "Chuyển khoản VNPAY-QR",
      paymentStatus: "paid",
      branchName: "CN2 - 555 Đường 3/2, Quận 10",
      assignedStaffCode: "NV-HSK-003",
      assignedStaffName: "Nguyễn Văn Thành",
      notes: "Khách hàng Diamond - Đóng gói hộp quà kèm thiệp cảm ơn",
    },
    {
      id: "ord-202611-0960",
      orderCode: "HSK-202611-0960",
      createdAt: "2026-11-13T10:20:00Z",
      customerName: "Lê Hoàng Nam",
      customerPhone: "0987654321",
      shippingAddress: "182 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội",
      items: [
        { ...p4, quantity: 1 },
      ],
      subtotal: p4.price,
      shippingFee: 15000,
      total: p4.price + 15000,
      status: "confirmed",
      statusLabel: ORDER_STATUS_LABELS.confirmed,
      deliveryType: "Tiêu chuẩn",
      paymentMethod: "Ví MoMo",
      paymentStatus: "paid",
      branchName: "CN15 - 182 Cầu Giấy, Hà Nội",
      assignedStaffCode: "NV-HSK-006",
      assignedStaffName: "Đặng Quốc Bảo",
    },
    {
      id: "ord-202611-0968",
      orderCode: "HSK-202611-0968",
      createdAt: "2026-11-13T10:45:00Z",
      customerName: "Phạm Quỳnh Như",
      customerPhone: "0933889900",
      shippingAddress: "555 Đường 3/2, Phường 8, Quận 10, TP. Hồ Chí Minh",
      items: [
        { ...p1, quantity: 2 },
        { ...p0, quantity: 1 },
      ],
      subtotal: p1.price * 2 + p0.price,
      shippingFee: 0,
      total: p1.price * 2 + p0.price,
      status: "pending",
      statusLabel: ORDER_STATUS_LABELS.pending,
      deliveryType: "NowFree 2H",
      paymentMethod: "Thanh toán khi nhận hàng (COD)",
      paymentStatus: "unpaid",
      branchName: "CN2 - 555 Đường 3/2, Quận 10",
      assignedStaffCode: "NV-HSK-002",
      assignedStaffName: "Lê Thị Bích Ngọc",
    },
    {
      id: "ord-202610-8812",
      orderCode: "HSK-202610-8812",
      createdAt: "2026-10-28T10:15:00Z",
      customerName: "Nguyễn Minh Anh",
      customerPhone: "0908123456",
      shippingAddress: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
      items: [
        { ...p2, quantity: 2 },
      ],
      subtotal: p2.price * 2,
      shippingFee: 0,
      total: p2.price * 2,
      status: "delivered",
      statusLabel: ORDER_STATUS_LABELS.delivered,
      deliveryType: "NowFree 2H",
      paymentMethod: "Chuyển khoản VNPAY-QR",
      paymentStatus: "paid",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      assignedStaffCode: "NV-HSK-002",
      assignedStaffName: "Lê Thị Bích Ngọc",
    },
    {
      id: "ord-202611-0899",
      orderCode: "HSK-202611-0899",
      createdAt: "2026-11-11T16:00:00Z",
      customerName: "Đỗ Thị Mai Linh",
      customerPhone: "0977223344",
      shippingAddress: "120 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng",
      items: [
        { ...p3, quantity: 1 },
      ],
      subtotal: p3.price,
      shippingFee: 0,
      total: p3.price,
      status: "delivered",
      statusLabel: ORDER_STATUS_LABELS.delivered,
      deliveryType: "NowFree 2H",
      paymentMethod: "Thẻ ATM Nội địa",
      paymentStatus: "paid",
      branchName: "CN28 - Nguyễn Văn Linh, Đà Nẵng",
      assignedStaffCode: "NV-HSK-007",
      assignedStaffName: "Vũ Hải Yến",
    },
    {
      id: "ord-202611-0810",
      orderCode: "HSK-202611-0810",
      createdAt: "2026-11-10T14:20:00Z",
      customerName: "Bùi Văn Hùng",
      customerPhone: "0909556677",
      shippingAddress: "25 Quang Trung, Phường 10, Quận Gò Vấp, TP. Hồ Chí Minh",
      items: [
        { ...p0, quantity: 1 },
      ],
      subtotal: p0.price,
      shippingFee: 20000,
      total: p0.price + 20000,
      status: "cancelled",
      statusLabel: ORDER_STATUS_LABELS.cancelled,
      deliveryType: "Tiêu chuẩn",
      paymentMethod: "Thanh toán khi nhận hàng (COD)",
      paymentStatus: "unpaid",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      assignedStaffCode: "NV-HSK-005",
      assignedStaffName: "Phạm Hoàng Oanh",
      notes: "Khách hàng đổi ý, yêu cầu hủy đơn qua tổng đài 1800 6324",
    },
  ];
}

// ---------------------------------------------------------------------------
// 4. In-Memory Store Singleton (Global across Next.js API Routes)
// ---------------------------------------------------------------------------

interface HasakiErpStoreState {
  users: UserRecord[];
  staff: StaffRecord[];
  inventory: InventoryRecord[];
  auditLogs: InventoryAuditLog[];
  orders: ErpOrderRecord[];
}

declare global {
  var __hasakiErpStore__: HasakiErpStoreState | undefined;
}

function getStore(): HasakiErpStoreState {
  if (!globalThis.__hasakiErpStore__) {
    const { records: inventoryRecords, logs: auditLogs } = createInitialInventory();
    globalThis.__hasakiErpStore__ = {
      users: createInitialUsers(),
      staff: createInitialStaff(),
      inventory: inventoryRecords,
      auditLogs,
      orders: createInitialOrders(inventoryRecords),
    };
  }
  return globalThis.__hasakiErpStore__;
}

// ---------------------------------------------------------------------------
// 5. Repository Functions: Users / Customers
// ---------------------------------------------------------------------------

export function listUsers(filter?: {
  search?: string;
  tier?: UserTier;
  status?: UserStatus;
}): UserRecord[] {
  const store = getStore();
  let list = [...store.users];

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q)
    );
  }

  if (filter?.tier) {
    list = list.filter((u) => u.tier === filter.tier);
  }

  if (filter?.status) {
    list = list.filter((u) => u.status === filter.status);
  }

  return list;
}

export function getUserById(id: string): UserRecord | undefined {
  const store = getStore();
  return store.users.find((u) => u.id === id);
}

export function createUser(input: {
  fullName: string;
  phone: string;
  email: string;
  tier?: UserTier;
  address?: string;
  loyaltyPoints?: number;
}): UserRecord {
  const store = getStore();
  const id = `usr-${(store.users.length + 1).toString().padStart(3, "0")}`;
  const newUser: UserRecord = {
    id,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    tier: input.tier || "Member",
    loyaltyPoints: input.loyaltyPoints ?? 0,
    totalSpent: 0,
    ordersCount: 0,
    address: (input.address || "").trim(),
    status: "active",
    createdAt: new Date().toISOString(),
  };

  store.users.unshift(newUser);
  return newUser;
}

export function updateUser(
  id: string,
  patch: Partial<Omit<UserRecord, "id" | "createdAt">> & { loyaltyPointsDelta?: number }
): UserRecord | null {
  const store = getStore();
  const index = store.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const current = store.users[index];
  let newPoints = current.loyaltyPoints;
  if (typeof patch.loyaltyPoints === "number") {
    newPoints = patch.loyaltyPoints;
  } else if (typeof patch.loyaltyPointsDelta === "number") {
    newPoints = Math.max(0, newPoints + patch.loyaltyPointsDelta);
  }

  const updated: UserRecord = {
    ...current,
    fullName: patch.fullName !== undefined ? patch.fullName.trim() : current.fullName,
    phone: patch.phone !== undefined ? patch.phone.trim() : current.phone,
    email: patch.email !== undefined ? patch.email.trim() : current.email,
    tier: patch.tier !== undefined ? patch.tier : current.tier,
    loyaltyPoints: newPoints,
    totalSpent: patch.totalSpent !== undefined ? patch.totalSpent : current.totalSpent,
    ordersCount: patch.ordersCount !== undefined ? patch.ordersCount : current.ordersCount,
    address: patch.address !== undefined ? patch.address.trim() : current.address,
    status: patch.status !== undefined ? patch.status : current.status,
  };

  store.users[index] = updated;
  return updated;
}

// ---------------------------------------------------------------------------
// 6. Repository Functions: Staff & RBAC
// ---------------------------------------------------------------------------

export function listStaff(filter?: {
  search?: string;
  role?: StaffRole;
  status?: StaffStatus;
  branchId?: string;
}): StaffRecord[] {
  const store = getStore();
  let list = [...store.staff];

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.employeeCode.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }

  if (filter?.role) {
    list = list.filter((s) => s.role === filter.role);
  }

  if (filter?.status) {
    list = list.filter((s) => s.status === filter.status);
  }

  if (filter?.branchId) {
    list = list.filter((s) => s.branchId === filter.branchId);
  }

  return list;
}

export function createStaff(input: {
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  branchId?: string;
  branchName?: string;
  department?: string;
}): StaffRecord {
  const store = getStore();
  const nextNum = store.staff.length + 1;
  const id = `stf-${nextNum.toString().padStart(3, "0")}`;
  const employeeCode = `NV-HSK-${nextNum.toString().padStart(3, "0")}`;
  const roleLabel = ROLE_LABELS[input.role] || "Nhân viên Hasaki";
  const permissions = ROLE_PERMISSIONS[input.role] || ["users:read"];

  let branchName = input.branchName;
  if (!branchName && input.branchId) {
    const b = BRANCH_DEFINITIONS.find((item) => item.id === input.branchId);
    branchName = b ? b.name : "Trụ sở Hasaki";
  }

  const newStaff: StaffRecord = {
    id,
    employeeCode,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    role: input.role,
    roleLabel,
    branchId: input.branchId || "CN1",
    branchName: branchName || "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
    department: input.department || "Khối Bán Lẻ & Dịch Vụ",
    status: "active",
    permissions,
    joinedAt: new Date().toISOString(),
  };

  store.staff.unshift(newStaff);
  return newStaff;
}

export function updateStaff(
  id: string,
  patch: Partial<Omit<StaffRecord, "id" | "employeeCode" | "joinedAt">>
): StaffRecord | null {
  const store = getStore();
  const index = store.staff.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const current = store.staff[index];
  const role = patch.role || current.role;
  const roleLabel = patch.role ? ROLE_LABELS[patch.role] : current.roleLabel;
  const permissions = patch.permissions || (patch.role ? ROLE_PERMISSIONS[patch.role] : current.permissions);

  const updated: StaffRecord = {
    ...current,
    fullName: patch.fullName !== undefined ? patch.fullName.trim() : current.fullName,
    email: patch.email !== undefined ? patch.email.trim() : current.email,
    phone: patch.phone !== undefined ? patch.phone.trim() : current.phone,
    role,
    roleLabel,
    branchId: patch.branchId !== undefined ? patch.branchId : current.branchId,
    branchName: patch.branchName !== undefined ? patch.branchName : current.branchName,
    department: patch.department !== undefined ? patch.department.trim() : current.department,
    status: patch.status !== undefined ? patch.status : current.status,
    permissions,
  };

  store.staff[index] = updated;
  return updated;
}

// ---------------------------------------------------------------------------
// 7. Repository Functions: Warehouse & Multi-Branch Inventory
// ---------------------------------------------------------------------------

export function listInventory(filter?: {
  search?: string;
  status?: WarehouseStatus;
  branchId?: string;
  lowStockOnly?: boolean;
}): InventoryRecord[] {
  const store = getStore();
  let list = [...store.inventory];

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }

  if (filter?.status) {
    list = list.filter((item) => item.warehouseStatus === filter.status);
  }

  if (filter?.lowStockOnly) {
    list = list.filter((item) => item.warehouseStatus === "low_stock" || item.warehouseStatus === "out_of_stock");
  }

  if (filter?.branchId) {
    list = list.filter((item) =>
      item.branchStock.some((b) => b.branchId === filter.branchId && b.quantity > 0)
    );
  }

  return list;
}

export function getInventoryBySkuOrSlug(key: string): InventoryRecord | undefined {
  const store = getStore();
  const q = key.trim().toLowerCase();
  return store.inventory.find(
    (item) => item.sku.toLowerCase() === q || item.productSlug.toLowerCase() === q
  );
}

export function adjustInventoryStock(params: {
  sku: string;
  delta: number;
  reason: string;
  staffCode: string;
  branchId?: string;
}): { updatedItem: InventoryRecord; auditLog: InventoryAuditLog } | null {
  const store = getStore();
  const index = store.inventory.findIndex((item) => item.sku === params.sku);
  if (index === -1) return null;

  const current = store.inventory[index];
  const previousStock = current.totalStock;
  const newStock = Math.max(0, previousStock + params.delta);

  let newStatus: WarehouseStatus = "in_stock";
  if (newStock === 0) {
    newStatus = "out_of_stock";
  } else if (newStock <= current.reorderPoint) {
    newStatus = "low_stock";
  }

  const reservedStock = Math.min(current.reservedStock, newStock);
  const availableStock = Math.max(0, newStock - reservedStock);

  // Update target branch stock
  const targetBranchId = params.branchId || "CN1";
  const updatedBranches = current.branchStock.map((b) => {
    if (b.branchId === targetBranchId) {
      return {
        ...b,
        quantity: Math.max(0, b.quantity + params.delta),
      };
    }
    return b;
  });

  const branchDef = BRANCH_DEFINITIONS.find((b) => b.id === targetBranchId);
  const branchName = branchDef ? branchDef.name : "CN1 - 71 Hoàng Hoa Thám, Tân Bình";

  const updatedItem: InventoryRecord = {
    ...current,
    totalStock: newStock,
    reservedStock,
    availableStock,
    warehouseStatus: newStatus,
    branchStock: updatedBranches,
    lastRestockedAt: params.delta > 0 ? new Date().toISOString() : current.lastRestockedAt,
  };

  store.inventory[index] = updatedItem;

  // Create Audit Log
  const auditLog: InventoryAuditLog = {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    sku: current.sku,
    productName: current.productName,
    delta: params.delta,
    previousStock,
    newStock,
    reason: params.reason.trim() || "Cập nhật tồn kho thủ công từ Admin ERP",
    staffCode: params.staffCode || "NV-HSK-001",
    branchId: targetBranchId,
    branchName,
    timestamp: new Date().toISOString(),
  };

  store.auditLogs.unshift(auditLog);

  return { updatedItem, auditLog };
}

export function listInventoryAuditLogs(limit = 50): InventoryAuditLog[] {
  const store = getStore();
  return store.auditLogs.slice(0, limit);
}

// ---------------------------------------------------------------------------
// 8. Repository Functions: Enterprise Orders Fulfillment
// ---------------------------------------------------------------------------

export function listErpOrders(filter?: {
  search?: string;
  status?: ErpOrderStatus;
  branch?: string;
  staffCode?: string;
}): ErpOrderRecord[] {
  const store = getStore();
  let list = [...store.orders];

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.shippingAddress.toLowerCase().includes(q) ||
        o.items.some((item) => item.name.toLowerCase().includes(q) || item.sku.includes(q))
    );
  }

  if (filter?.status) {
    list = list.filter((o) => o.status === filter.status);
  }

  if (filter?.branch) {
    list = list.filter((o) => o.branchName.toLowerCase().includes(filter.branch!.toLowerCase()));
  }

  if (filter?.staffCode) {
    list = list.filter((o) => o.assignedStaffCode === filter.staffCode);
  }

  return list;
}

export function getErpOrderById(orderId: string): ErpOrderRecord | undefined {
  const store = getStore();
  return store.orders.find((o) => o.id === orderId || o.orderCode === orderId);
}

export function createErpOrder(input: {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  items: ErpOrderItem[];
  deliveryType?: "NowFree 2H" | "Tiêu chuẩn";
  paymentMethod?: string;
  branchName?: string;
  notes?: string;
}): ErpOrderRecord {
  const store = getStore();
  const nextNum = store.orders.length + 1;
  const id = `ord-${Date.now().toString().slice(-6)}-${nextNum}`;
  const orderCode = `HSK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(nextNum + 1000).slice(-4)}`;

  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryType = input.deliveryType || "NowFree 2H";
  const shippingFee = deliveryType === "NowFree 2H" && subtotal >= 99000 ? 0 : 15000;
  const total = subtotal + shippingFee;

  const branchName = input.branchName || "CN1 - 71 Hoàng Hoa Thám, Tân Bình";

  const newOrder: ErpOrderRecord = {
    id,
    orderCode,
    createdAt: new Date().toISOString(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    shippingAddress: input.shippingAddress.trim(),
    items: input.items,
    subtotal,
    shippingFee,
    total,
    status: "pending",
    statusLabel: ORDER_STATUS_LABELS.pending,
    deliveryType,
    paymentMethod: input.paymentMethod || "Thanh toán khi nhận hàng (COD)",
    paymentStatus: "unpaid",
    branchName,
    assignedStaffCode: "NV-HSK-002",
    assignedStaffName: "Lê Thị Bích Ngọc",
    notes: input.notes?.trim(),
  };

  store.orders.unshift(newOrder);

  // Also update customer stats if customer exists
  const customer = store.users.find(
    (u) => u.phone === newOrder.customerPhone || u.fullName.toLowerCase() === newOrder.customerName.toLowerCase()
  );
  if (customer) {
    updateUser(customer.id, {
      ordersCount: customer.ordersCount + 1,
      totalSpent: customer.totalSpent + newOrder.total,
      loyaltyPointsDelta: Math.floor(newOrder.total / 10000), // 1 point per 10k VND
    });
  }

  return newOrder;
}

export function updateErpOrderStatus(
  orderId: string,
  status: ErpOrderStatus,
  assignedStaffCode?: string
): ErpOrderRecord | null {
  const store = getStore();
  const index = store.orders.findIndex((o) => o.id === orderId || o.orderCode === orderId);
  if (index === -1) return null;

  const current = store.orders[index];
  let staffName = current.assignedStaffName;
  let staffCode = current.assignedStaffCode;

  if (assignedStaffCode) {
    const staff = store.staff.find((s) => s.employeeCode === assignedStaffCode);
    if (staff) {
      staffCode = staff.employeeCode;
      staffName = staff.fullName;
    }
  }

  let paymentStatus: PaymentStatus = current.paymentStatus;
  if (status === "delivered" && current.paymentMethod.includes("COD")) {
    paymentStatus = "paid";
  } else if (status === "cancelled") {
    paymentStatus = current.paymentStatus === "paid" ? "refunded" : "unpaid";
  }

  const updated: ErpOrderRecord = {
    ...current,
    status,
    statusLabel: ORDER_STATUS_LABELS[status] || status,
    assignedStaffCode: staffCode,
    assignedStaffName: staffName,
    paymentStatus,
  };

  store.orders[index] = updated;
  return updated;
}

// ---------------------------------------------------------------------------
// 9. Dashboard KPIs
// ---------------------------------------------------------------------------

export function getErpDashboardKpis(): ErpDashboardKpis {
  const store = getStore();

  const totalRevenue = store.orders
    .filter((o) => o.status === "delivered" || o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = store.orders.filter((o) => o.status === "pending").length;
  const packingShippingCount = store.orders.filter(
    (o) => o.status === "confirmed" || o.status === "packing" || o.status === "shipping"
  ).length;
  const deliveredOrdersCount = store.orders.filter((o) => o.status === "delivered").length;
  const cancelledOrdersCount = store.orders.filter((o) => o.status === "cancelled").length;

  const totalCustomers = store.users.length;
  const activeCustomers = store.users.filter((u) => u.status === "active").length;

  const totalStaff = store.staff.length;
  const activeStaff = store.staff.filter((s) => s.status === "active").length;

  const totalSkus = store.inventory.length;
  const inStockCount = store.inventory.filter((i) => i.warehouseStatus === "in_stock").length;
  const lowStockCount = store.inventory.filter((i) => i.warehouseStatus === "low_stock").length;
  const outOfStockCount = store.inventory.filter((i) => i.warehouseStatus === "out_of_stock").length;

  const lowStockItems = store.inventory
    .filter((i) => i.warehouseStatus === "low_stock" || i.warehouseStatus === "out_of_stock")
    .slice(0, 8);

  const recentAuditLogs = store.auditLogs.slice(0, 6);

  // Today stats
  const todayOrders = store.orders.filter((o) => {
    const created = new Date(o.createdAt);
    const now = new Date();
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate()
    );
  });

  const todayRevenue = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return {
    totalRevenue,
    totalOrders: store.orders.length,
    pendingOrdersCount,
    packingShippingCount,
    deliveredOrdersCount,
    cancelledOrdersCount,
    totalCustomers,
    activeCustomers,
    totalStaff,
    activeStaff,
    totalSkus,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    recentAuditLogs,
    lowStockItems,
    todayOrdersCount: todayOrders.length,
    todayRevenue,
  };
}
