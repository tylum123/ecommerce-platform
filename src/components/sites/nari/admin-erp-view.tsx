"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Bot,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Building2,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Code,
  Globe,
  History,
  X,
  Lock,
  Phone,
  Mail,
  LogOut,
  ShoppingBag,
  Warehouse,
} from "lucide-react";
import type {
  UserRecord,
  UserTier,
  StaffRecord,
  InventoryRecord,
  InventoryAuditLog,
  ErpBranchSummary,
  ErpOrderRecord,
  ErpOrderStatus,
  ErpDashboardKpis,
} from "@/lib/erp-types";
import { clearAuthSession, type AuthSessionUser } from "@/lib/auth";
import { logoutProviderSession } from "@/lib/session-capabilities";
import {
  BackofficeShell,
  type BackofficeNavGroup,
} from "@/components/sites/nari/portal/backoffice-shell";
import {
  EmptyStateCard,
  KpiStatCard,
  PortalPageHeader,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components/sites/nari/portal/portal-ui";
import { cn } from "@/lib/utils";

type ErpTab = "dashboard" | "users" | "staff" | "orders" | "inventory" | "mcp_seo";

function parseInitialTab(): ErpTab {
  if (typeof window === "undefined") return "dashboard";
  const param = new URLSearchParams(window.location.search).get("tab");
  switch (param) {
    case "orders":
      return "orders";
    case "inventory":
      return "inventory";
    case "users":
      return "users";
    case "staff":
      return "staff";
    case "mcp":
    case "mcp_seo":
      return "mcp_seo";
    default:
      return "dashboard";
  }
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";

const formatDateTime = (isoString?: string) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
};

function getOrderStatusTone(status: ErpOrderStatus): StatusTone {
  switch (status) {
    case "delivered":
      return "success";
    case "shipping":
      return "info";
    case "packing":
    case "pending":
      return "warning";
    case "confirmed":
      return "accent";
    case "cancelled":
      return "neutral";
    case "returned":
      return "danger";
    default:
      return "neutral";
  }
}

function getTierTone(tier: UserTier): StatusTone {
  switch (tier) {
    case "Diamond":
      return "accent";
    case "Gold":
      return "warning";
    case "Silver":
      return "info";
    default:
      return "neutral";
  }
}

const modalInputClass =
  "w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 px-3.5 py-2 text-xs text-[#1e1b18] placeholder:text-[#9c877a] transition focus:border-[#b86b4b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b86b4b]/15";

interface McpToolDef {
  name: string;
  description: string;
  defaultArgs: Record<string, string | number | boolean>;
}

const DEFAULT_MCP_TOOLS: McpToolDef[] = [
  {
    name: "nari_search_products",
    description: "Tìm kiếm sản phẩm trong danh mục Nari Home theo từ khóa và bộ lọc",
    defaultArgs: { query: "cerave", limit: 5 },
  },
  {
    name: "nari_check_inventory",
    description: "Tra cứu tồn kho đa chi nhánh (CN1, CN2, CN15, CN28) theo SKU",
    defaultArgs: { sku: "422208973", branchId: "CN1" },
  },
  {
    name: "nari_list_orders",
    description: "Truy vấn danh sách đơn hàng ERP và kiểm tra tiến độ giao NariNow 2H",
    defaultArgs: { status: "shipping", limit: 5 },
  },
  {
    name: "nari_manage_users",
    description: "Tra cứu thông tin khách hàng, hạng thẻ và lịch sử tích điểm",
    defaultArgs: { action: "list", tier: "Gold" },
  },
  {
    name: "nari_seo_audit",
    description: "Audit cấu trúc SEO, thẻ OpenGraph và JSON-LD schema của website",
    defaultArgs: { route: "/" },
  },
  {
    name: "nari_codegraph_map",
    description: "Tra cứu cấu trúc kiến trúc module CodeGraph của hệ thống Nari Home",
    defaultArgs: { module: "postgres-erp-service" },
  },
];

interface SeoRouteAudit {
  route: string;
  name: string;
  score: number;
  schemaType: string;
  ogImage: boolean;
  status: "Pass" | "Warn";
}

const DEFAULT_SEO_ROUTES: SeoRouteAudit[] = [
  { route: "/", name: "Trang chủ Nari Home", score: 100, schemaType: "WebSite, Organization", ogImage: true, status: "Pass" },
  { route: "/thuong-hieu", name: "Danh mục Thương hiệu", score: 98, schemaType: "CollectionPage, Brand", ogImage: true, status: "Pass" },
  { route: "/quan-tri", name: "Hệ thống Quản trị ERP", score: 95, schemaType: "WebPage, AdminApp", ogImage: true, status: "Pass" },
  { route: "/gio-hang", name: "Giỏ hàng & Checkout", score: 96, schemaType: "CheckoutPage", ogImage: false, status: "Warn" },
  { route: "/san-pham/sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml-102959.html", name: "Chi tiết Sữa Rửa Mặt CeraVe", score: 100, schemaType: "Product, BreadcrumbList", ogImage: true, status: "Pass" },
];

async function executeMcpToolCall(
  selectedMcpTool: string,
  mcpToolArgs: string,
): Promise<{ elapsed: number; responseJson: string; succeeded: boolean; statusCode: number | null }> {
  const startTime = performance.now();
  try {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(mcpToolArgs);
    } catch {
      throw new Error("Tham số JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.");
    }

    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: selectedMcpTool,
        arguments: parsedArgs,
      },
    };

    const res = await fetch("/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed = Math.round(performance.now() - startTime);
    const rawText = await res.text();
    let formattedBody = rawText;
    try {
      formattedBody = JSON.stringify(JSON.parse(rawText), null, 2);
    } catch {
      formattedBody = JSON.stringify(
        {
          jsonrpc: "2.0",
          error: {
            code: res.status,
            message: rawText || `Máy chủ MCP trả về lỗi HTTP ${res.status}`,
          },
          id: payload.id,
        },
        null,
        2,
      );
    }

    return {
      elapsed,
      responseJson: formattedBody,
      succeeded: res.ok,
      statusCode: res.status,
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      elapsed,
      succeeded: false,
      statusCode: null,
      responseJson: JSON.stringify(
        {
          jsonrpc: "2.0",
          error: { code: -32603, message: errMsg },
          id: null,
        },
        null,
        2,
      ),
    };
  }
}

export function AdminErpView({ initialSession = null }: { initialSession?: AuthSessionUser | null }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ErpTab>(parseInitialTab);

  const [authSession, setAuthSession] = useState<AuthSessionUser | null>(initialSession ?? null);

  // State
  const [kpis, setKpis] = useState<ErpDashboardKpis | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [orders, setOrders] = useState<ErpOrderRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [branches, setBranches] = useState<ErpBranchSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userTierFilter, setUserTierFilter] = useState<string>("all");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>("all");

  // Modals
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryRecord | null>(null);
  const [stockAdjustDelta, setStockAdjustDelta] = useState<number>(10);
  const [stockAdjustReason, setStockAdjustReason] = useState<string>("");
  const [stockAdjustBranch, setStockAdjustBranch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<ErpOrderRecord | null>(null);

  // MCP Playground State
  const [mcpTools] = useState<McpToolDef[]>(DEFAULT_MCP_TOOLS);
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>(DEFAULT_MCP_TOOLS[0].name);
  const [mcpToolArgs, setMcpToolArgs] = useState<string>(
    JSON.stringify(DEFAULT_MCP_TOOLS[0].defaultArgs, null, 2),
  );
  const [mcpExecuting, setMcpExecuting] = useState(false);
  const [mcpResponse, setMcpResponse] = useState<string | null>(null);
  const [mcpLatency, setMcpLatency] = useState<number | null>(null);
  const [mcpStatus, setMcpStatus] = useState<{ succeeded: boolean; statusCode: number | null } | null>(null);

  const selectTab = useCallback((nextTab: ErpTab) => {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const nextUrl =
        nextTab === "dashboard"
          ? "/quan-tri"
          : `/quan-tri?tab=${nextTab === "mcp_seo" ? "mcp" : nextTab}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const handleLogoutAdmin = async () => {
    try {
      await logoutProviderSession();
    } catch {
      // Ignore if already signed out
    }
    clearAuthSession();
    setAuthSession(null);
    router.push("/dang-nhap");
    router.refresh();
  };

  const refreshAllData = useCallback(async () => {
    if (!authSession) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [usersRes, staffRes, ordersRes, invRes] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/staff").then((r) => r.json()),
        fetch("/api/admin/orders?includeKpis=true").then((r) => r.json()),
        fetch("/api/admin/inventory?includeLogs=true").then((r) => r.json()),
      ]);

      if (usersRes?.success) setUsers(usersRes.users);
      if (staffRes?.success) setStaffList(staffRes.staff);
      if (ordersRes?.success) {
        setOrders(ordersRes.orders);
        if (ordersRes.kpis) setKpis(ordersRes.kpis);
      }
      if (invRes?.success) {
        setInventory(invRes.inventory);
        if (Array.isArray(invRes.branches)) {
          setBranches(invRes.branches);
          if (invRes.branches.length > 0) {
            setStockAdjustBranch((prev) => prev || invRes.branches[0].id);
          }
        }
        if (invRes.auditLogs) setAuditLogs(invRes.auditLogs);
      }
    } catch {
      // Graceful handling on network error
    } finally {
      setIsLoading(false);
    }
  }, [authSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!authSession) {
        setIsLoading(false);
        return;
      }
      try {
        const [usersRes, staffRes, ordersRes, invRes] = await Promise.all([
          fetch("/api/admin/users").then((r) => r.json()),
          fetch("/api/admin/staff").then((r) => r.json()),
          fetch("/api/admin/orders?includeKpis=true").then((r) => r.json()),
          fetch("/api/admin/inventory?includeLogs=true").then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (usersRes?.success) setUsers(usersRes.users);
        if (staffRes?.success) setStaffList(staffRes.staff);
        if (ordersRes?.success) {
          setOrders(ordersRes.orders);
          if (ordersRes.kpis) setKpis(ordersRes.kpis);
        }
        if (invRes?.success) {
          setInventory(invRes.inventory);
          if (Array.isArray(invRes.branches)) {
            setBranches(invRes.branches);
            if (invRes.branches.length > 0) {
              setStockAdjustBranch((prev) => prev || invRes.branches[0].id);
            }
          }
          if (invRes.auditLogs) setAuditLogs(invRes.auditLogs);
        }
      } catch {
        // Graceful handling on network error
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authSession]);

  // MCP tool handlers
  const handleSelectMcpTool = (toolName: string) => {
    setSelectedMcpTool(toolName);
    const tool = mcpTools.find((t) => t.name === toolName);
    if (tool) {
      setMcpToolArgs(JSON.stringify(tool.defaultArgs, null, 2));
    }
    setMcpResponse(null);
    setMcpLatency(null);
    setMcpStatus(null);
  };

  const handleExecuteMcpTool = async () => {
    setMcpExecuting(true);
    const { elapsed, responseJson, succeeded, statusCode } = await executeMcpToolCall(
      selectedMcpTool,
      mcpToolArgs,
    );
    setMcpLatency(elapsed);
    setMcpResponse(responseJson);
    setMcpStatus({ succeeded, statusCode });
    if (succeeded) {
      showToast(`Đã thực thi tool [${selectedMcpTool}] thành công`);
    } else {
      showToast(
        statusCode
          ? `Lỗi thực thi [${selectedMcpTool}] (HTTP ${statusCode})`
          : `Không thể thực thi [${selectedMcpTool}]`,
      );
    }
    setMcpExecuting(false);
  };

  // User Actions
  const handleUpdateUserPoints = async (userId: string, delta: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, patch: { loyaltyPointsDelta: delta } }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        showToast(`Đã cộng +${delta} điểm cho khách hàng ${data.user.fullName}`);
      } else {
        showToast(data.error || "Không thể cập nhật điểm thưởng");
      }
    } catch {
      showToast("Lỗi kết nối khi cập nhật điểm");
    }
  };

  const handleChangeUserTier = async (userId: string, newTier: UserTier) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, patch: { tier: newTier } }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        showToast(`Đã thăng hạng thẻ khách hàng sang: ${newTier}`);
      } else {
        showToast(data.error || "Không thể cập nhật hạng thẻ");
      }
    } catch {
      showToast("Lỗi khi cập nhật hạng thẻ");
    }
  };

  // Order Actions
  const handleAdvanceOrderStatus = async (orderId: string, nextStatus: ErpOrderStatus) => {
    const currentOrder = orders.find((o) => o.id === orderId) || selectedOrder;
    if (nextStatus === "cancelled") {
      if (
        !window.confirm(
          `Xác nhận hủy đơn hàng ${currentOrder?.orderCode || orderId} và hoàn lại tồn kho?`,
        )
      ) {
        return;
      }
    } else if (nextStatus === "returned") {
      if (
        !window.confirm(
          `Xác nhận chuyển đơn hàng ${currentOrder?.orderCode || orderId} sang trạng thái Hoàn đơn?`,
        )
      ) {
        return;
      }
    }
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
          expectedVersion: currentOrder?.version,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        showToast(`Đơn hàng ${data.order.orderCode} đã cập nhật: ${data.order.statusLabel}`);
        fetch("/api/admin/orders?includeKpis=true")
          .then((r) => r.json())
          .then((r) => {
            if (r.kpis) setKpis(r.kpis);
          })
          .catch(() => {});
      } else {
        showToast(data.error || "Không thể cập nhật trạng thái đơn hàng");
      }
    } catch {
      showToast("Lỗi khi cập nhật trạng thái đơn hàng");
    }
  };

  // Inventory Adjustment
  const handleExecuteStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    const targetBranch =
      stockAdjustBranch || branches[0]?.id || selectedInventoryItem.branchStock[0]?.branchId || "";
    if (!targetBranch) {
      showToast("Chưa có chi nhánh hoạt động để điều chỉnh tồn kho.");
      return;
    }

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedInventoryItem.sku,
          delta: stockAdjustDelta,
          reason:
            stockAdjustReason ||
            (stockAdjustDelta > 0 ? "Nhập kho bổ sung" : "Xuất kho điều chuyển"),
          branchId: targetBranch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInventory((prev) =>
          prev.map((item) => (item.sku === selectedInventoryItem.sku ? data.updatedItem : item)),
        );
        setAuditLogs((prev) => [data.auditLog, ...prev]);
        showToast(
          `Đã ${stockAdjustDelta > 0 ? "nhập" : "xuất"} ${Math.abs(stockAdjustDelta)} sản phẩm cho SKU ${selectedInventoryItem.sku}`,
        );
        setSelectedInventoryItem(null);
        setStockAdjustReason("");
        setStockAdjustDelta(10);
      } else {
        showToast(data.error || "Không thể điều chỉnh tồn kho");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ kho hàng");
    }
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    let list = users;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    if (userTierFilter !== "all") {
      list = list.filter((u) => u.tier === userTierFilter);
    }
    return list;
  }, [users, userSearch, userTierFilter]);

  const filteredStaff = useMemo(() => {
    let list = staffList;
    if (staffRoleFilter !== "all") {
      list = list.filter((s) => s.role === staffRoleFilter);
    }
    return list;
  }, [staffList, staffRoleFilter]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderStatusFilter !== "all") {
      list = list.filter((o) => o.status === orderStatusFilter);
    }
    return list;
  }, [orders, orderStatusFilter]);

  const filteredInventory = useMemo(() => {
    let list = inventory;
    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q),
      );
    }
    if (inventoryStatusFilter !== "all") {
      list = list.filter((i) => i.warehouseStatus === inventoryStatusFilter);
    }
    return list;
  }, [inventory, inventorySearch, inventoryStatusFilter]);

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "pending").length,
    [orders],
  );
  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.warehouseStatus === "low_stock").length,
    [inventory],
  );

  const navGroups: BackofficeNavGroup[] = useMemo(
    () => [
      {
        title: "Vận hành",
        items: [
          {
            id: "dashboard",
            label: "Tổng quan ERP",
            icon: "dashboard",
            active: activeTab === "dashboard",
            onSelect: () => selectTab("dashboard"),
          },
          {
            id: "orders",
            label: "Đơn hàng Fulfillment",
            icon: "orders",
            active: activeTab === "orders",
            badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
            onSelect: () => selectTab("orders"),
          },
          {
            id: "inventory",
            label: "Tồn kho chi nhánh",
            icon: "inventory",
            active: activeTab === "inventory",
            badge: lowStockCount > 0 ? lowStockCount : undefined,
            onSelect: () => selectTab("inventory"),
          },
          {
            id: "products",
            label: "Quản lý sản phẩm & Banner",
            icon: "products",
            href: "/quan-tri/san-pham",
          },
        ],
      },
      {
        title: "Khách hàng & Tổ chức",
        items: [
          {
            id: "users",
            label: "Khách hàng CRM",
            icon: "users",
            active: activeTab === "users",
            badge: users.length > 0 ? users.length : undefined,
            onSelect: () => selectTab("users"),
          },
          {
            id: "staff",
            label: "Nhân sự & Chi nhánh",
            icon: "staff",
            active: activeTab === "staff",
            badge: staffList.length > 0 ? staffList.length : undefined,
            onSelect: () => selectTab("staff"),
          },
        ],
      },
      {
        title: "Hệ thống",
        items: [
          {
            id: "mcp",
            label: "SEO & MCP",
            icon: "mcp",
            active: activeTab === "mcp_seo",
            onSelect: () => selectTab("mcp_seo"),
          },
          {
            id: "staff-portal",
            label: "Cổng nhân viên",
            icon: "store",
            href: "/nhan-vien",
          },
        ],
      },
    ],
    [activeTab, lowStockCount, pendingOrdersCount, selectTab, staffList.length, users.length],
  );

  if (!authSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf5f0] px-4 py-16 text-[#1e1b18]">
        <div className="w-full max-w-lg rounded-2xl border border-[#e6d5c5] bg-white p-8 text-center shadow-[0_4px_24px_rgba(61,46,36,0.06)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6ece3] text-[#3d2e24]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-semibold text-[#3d2e24]">
            Khu vực Quản trị Nội bộ
          </h1>
          <p className="mt-2 text-sm text-[#6e5a4f]">
            Cổng Quản trị ERP chỉ dành cho nhân sự được cấp quyền. Vui lòng đăng nhập tài khoản quản trị để tiếp tục.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dang-nhap"
              className="rounded-xl bg-[#3d2e24] px-5 py-2.5 text-sm font-semibold text-[#faf5f0] transition hover:bg-[#2a1f18]"
            >
              Đến trang đăng nhập
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-[#e6d5c5] bg-white px-5 py-2.5 text-sm font-semibold text-[#5c493e] transition hover:bg-[#faf5f0]"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleDisplay =
    authSession.role === "admin"
      ? "Admin ERP"
      : authSession.role === "warehouse_staff"
        ? "Quản lý Kho"
        : authSession.role === "customer"
          ? "Khách hàng"
          : authSession.roleLabel;

  return (
    <BackofficeShell
      sectionLabel="Quản trị ERP"
      userLabel={authSession.fullName}
      roleLabel={roleDisplay}
      branchLabel={authSession.branchName || "Toàn hệ thống Nari Home"}
      navGroups={navGroups}
      topbarActions={
        <>
          <StatusBadge tone="success" className="hidden sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>Hệ thống ổn định</span>
          </StatusBadge>
          <button
            type="button"
            onClick={refreshAllData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6d5c5] bg-white px-3 py-1.5 text-xs font-semibold text-[#3d2e24] transition hover:bg-[#faf5f0] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            <span>Đồng bộ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void handleLogoutAdmin();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#d8b89c]/40 bg-[#3d2e24] px-5 py-3 text-[#faf5f0] shadow-xl">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8b89c]" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Đóng thông báo"
            className="ml-1 rounded-lg p-0.5 text-[#d8b89c] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: TỔNG QUAN ERP (DASHBOARD KPIS)                               */}
      {/* =================================================================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="Tổng quan vận hành ERP"
            badge={<StatusBadge tone="accent">Admin Portal</StatusBadge>}
            actions={
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm khách hàng</span>
              </button>
            }
          />

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiStatCard
              label="Tổng doanh thu"
              value={formatVND(kpis?.totalRevenue || 0)}
              hint={`Hôm nay: ${formatVND(kpis?.todayRevenue || 0)}`}
              icon={<DollarSign className="h-4 w-4" />}
              tone="accent"
            />
            <KpiStatCard
              label="Đơn hàng vận hành"
              value={kpis?.totalOrders || 0}
              hint={`${kpis?.pendingOrdersCount || 0} chờ xử lý · ${kpis?.packingShippingCount || 0} đang giao`}
              icon={<Package className="h-4 w-4" />}
            />
            <KpiStatCard
              label="Khách hàng hội viên"
              value={kpis?.totalCustomers || 0}
              hint={`${kpis?.activeCustomers || 0} tài khoản đang hoạt động`}
              icon={<Users className="h-4 w-4" />}
            />
            <KpiStatCard
              label="Cảnh báo tồn kho"
              value={`${kpis?.lowStockCount || 0} SKU`}
              hint="Dưới định mức tái đặt hàng (< 20 sp)"
              icon={<AlertTriangle className="h-4 w-4" />}
              tone={(kpis?.lowStockCount || 0) > 0 ? "warning" : "default"}
            />
          </div>

          {/* Two Column Layout: Low Stock Warning + Recent Audit Logs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard
              title="Sản phẩm cần nhập kho gấp"
              description="Các SKU có số lượng dưới ngưỡng an toàn trên toàn hệ thống."
              actions={
                <button
                  type="button"
                  onClick={() => {
                    setInventoryStatusFilter("low_stock");
                    selectTab("inventory");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#b86b4b] hover:underline"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              {kpis?.lowStockItems && kpis.lowStockItems.length > 0 ? (
                <div className="divide-y divide-[#efe2d4]">
                  {kpis.lowStockItems.map((item) => (
                    <div
                      key={item.sku}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[#faf5f0] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#6e5a4f]">
                            {item.sku}
                          </span>
                          <span className="truncate text-xs font-semibold text-[#1e1b18]">
                            {item.productName}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#7c685c]">
                          {item.brand} · {formatVND(item.price)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <StatusBadge tone="danger">Còn {item.totalStock} sp</StatusBadge>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setStockAdjustDelta(20);
                            setStockAdjustReason("Nhập hàng khẩn cấp do tồn kho dưới mức an toàn");
                            selectTab("inventory");
                          }}
                          className="rounded-lg border border-[#e6d5c5] bg-[#faf5f0] px-2.5 py-1 text-xs font-semibold text-[#3d2e24] transition hover:bg-[#3d2e24] hover:text-[#faf5f0]"
                        >
                          + Nhập
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateCard
                  icon={<Warehouse className="h-5 w-5" />}
                  title="Tồn kho đang ở mức an toàn"
                  description="Không có sản phẩm nào chạm ngưỡng cảnh báo tái đặt hàng."
                  className="py-8"
                />
              )}
            </SectionCard>

            <SectionCard
              title="Nhật ký biến động kho vận"
              description="5 giao dịch nhập xuất kho gần nhất được ghi nhận vào Audit Trail."
              actions={
                <button
                  type="button"
                  onClick={() => selectTab("inventory")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#b86b4b] hover:underline"
                >
                  <span>Lịch sử chi tiết</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              }
            >
              {auditLogs.length === 0 ? (
                <EmptyStateCard
                  icon={<History className="h-5 w-5" />}
                  title="Chưa có biến động kho gần đây"
                  className="py-8"
                />
              ) : (
                <div className="divide-y divide-[#efe2d4]">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="py-2.5 text-xs first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <StatusBadge tone={log.delta > 0 ? "success" : "warning"}>
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </StatusBadge>
                          <span className="truncate font-semibold text-[#1e1b18]">
                            {log.productName}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-[#8c7568]">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[#6e5a4f]">
                        <span className="truncate">{log.reason}</span>
                        <span className="shrink-0 rounded bg-[#faf5f0] px-1.5 py-0.5 font-mono text-[10px] text-[#5c493e]">
                          {log.staffCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#3d2e24]/15 bg-gradient-to-r from-[#3d2e24] via-[#2f231b] to-[#1e1b18] p-6 text-[#faf5f0] shadow-sm">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#faf5f0]">
                Lối tắt điều hành doanh nghiệp
              </h2>
              <p className="mt-1 max-w-xl text-xs text-[#e6d5c5]/85">
                Khởi tạo hồ sơ khách hàng mới, kiểm tra phân quyền nhân sự, xử lý đơn NariNow 2H hoặc kiểm thử các công cụ MCP dành cho trợ lý AI.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#faf5f0] px-3.5 py-2 text-xs font-semibold text-[#3d2e24] transition hover:bg-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Khách hàng mới</span>
              </button>
              <button
                type="button"
                onClick={() => selectTab("staff")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-[#faf5f0] transition hover:bg-white/15"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Nhân sự & RBAC</span>
              </button>
              <button
                type="button"
                onClick={() => selectTab("mcp_seo")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#b86b4b] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#9f593c]"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>AI MCP Playground</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: QUẢN LÝ KHÁCH HÀNG (USERS)                                   */}
      {/* =================================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="Khách hàng & Hội viên CRM"
            badge={<StatusBadge tone="accent">{users.length} khách hàng</StatusBadge>}
            actions={
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm khách hàng</span>
              </button>
            }
          />

          <SectionCard
            title="Danh sách hội viên"
            description="Quản lý hạng thẻ thành viên, cộng điểm thưởng và theo dõi tổng chi tiêu."
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, số điện thoại, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 py-2 pl-10 pr-3.5 text-xs text-[#1e1b18] placeholder:text-[#9c877a] focus:border-[#b86b4b] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-[#6e5a4f]">Hạng thẻ:</span>
                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value)}
                  className="rounded-xl border border-[#e6d5c5] bg-white px-3 py-2 text-xs font-medium text-[#3d2e24] focus:border-[#b86b4b] focus:outline-none"
                >
                  <option value="all">Tất cả hạng</option>
                  <option value="Member">Member</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyStateCard
                icon={<Users className="h-6 w-6" />}
                title="Không có khách hàng phù hợp"
                description="Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc hạng thẻ."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                    <tr>
                      <th className="px-4 py-3">Mã KH / Họ tên</th>
                      <th className="px-3 py-3">Liên hệ</th>
                      <th className="px-3 py-3">Hạng thẻ</th>
                      <th className="px-3 py-3 text-right">Điểm tích lũy</th>
                      <th className="px-3 py-3 text-right">Tổng chi tiêu</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-[#faf5f0]/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#1e1b18]">{u.fullName}</div>
                          <span className="font-mono text-[10px] text-[#8c7568]">{u.id}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[#3d2e24]">{u.phone}</div>
                          <div className="max-w-[180px] truncate text-[11px] text-[#8c7568]">
                            {u.email}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={getTierTone(u.tier)}>{u.tier}</StatusBadge>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-[#3d2e24]">
                          {u.loyaltyPoints} pts
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-[#1e1b18]">
                          {formatVND(u.totalSpent)}
                          <span className="block text-[10px] font-normal text-[#8c7568]">
                            {u.ordersCount} đơn
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge tone={u.status === "active" ? "success" : "danger"}>
                            {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateUserPoints(u.id, 100)}
                              title="Tặng 100 điểm thưởng"
                              className="rounded-lg border border-[#e6d5c5] bg-[#faf5f0] px-2.5 py-1 text-[11px] font-semibold text-[#3d2e24] transition hover:bg-[#f6ece3]"
                            >
                              +100 pts
                            </button>
                            <select
                              value={u.tier}
                              aria-label={`Đổi hạng thẻ cho ${u.fullName}`}
                              onChange={(e) => handleChangeUserTier(u.id, e.target.value as UserTier)}
                              className="rounded-lg border border-[#e6d5c5] bg-white px-2 py-1 text-[11px] font-medium text-[#3d2e24]"
                            >
                              <option value="Member">Member</option>
                              <option value="Silver">Silver</option>
                              <option value="Gold">Gold</option>
                              <option value="Diamond">Diamond</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: QUẢN LÝ NHÂN VIÊN (STAFF & RBAC)                             */}
      {/* =================================================================== */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="Nhân sự & Chi nhánh (RBAC)"
            badge={<StatusBadge tone="accent">{staffList.length} nhân sự</StatusBadge>}
          />

          <SectionCard
            title="Danh bạ nhân sự nội bộ"
            description="Đồng bộ trực tiếp từ nari_identity.provisioned_identities trên PostgreSQL."
            actions={
              <StatusBadge tone="warning">
                Cấp/thu hồi quyền thực hiện qua Supabase SQL owner
              </StatusBadge>
            }
          >
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-[#6e5a4f]">Lọc vai trò:</span>
              {[
                { key: "all", label: "Tất cả vai trò" },
                { key: "admin", label: "Admin HQ" },
                { key: "store_manager", label: "Quản lý CH" },
                { key: "warehouse_staff", label: "Nhân viên kho" },
                { key: "cs_agent", label: "CSKH" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStaffRoleFilter(item.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    staffRoleFilter === item.key
                      ? "bg-[#3d2e24] text-[#faf5f0]"
                      : "border border-[#e6d5c5] bg-[#faf5f0] text-[#5c493e] hover:bg-[#f6ece3]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredStaff.length === 0 ? (
              <EmptyStateCard
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Không có nhân sự phù hợp bộ lọc"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="rounded-2xl border border-[#e6d5c5] bg-[#faf5f0]/35 p-4 transition hover:border-[#d8b89c] hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded-md bg-[#f6ece3] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3d2e24]">
                          {staff.employeeCode}
                        </span>
                        <h3 className="mt-1.5 text-sm font-bold text-[#1e1b18]">{staff.fullName}</h3>
                        <p className="text-xs font-medium text-[#b86b4b]">{staff.roleLabel}</p>
                      </div>
                      <StatusBadge tone={staff.status === "active" ? "success" : "warning"}>
                        {staff.status === "active" ? "Đang làm việc" : "Nghỉ phép"}
                      </StatusBadge>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-[#6e5a4f]">
                      <p className="flex items-center gap-2 truncate">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#9e7656]" />
                        <span className="truncate">{staff.branchName}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#9e7656]" />
                        <span className="truncate">{staff.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[#9e7656]" />
                        <span>{staff.phone}</span>
                      </p>
                    </div>

                    <div className="mt-3 border-t border-[#efe2d4] pt-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#8c7568]">
                        Quyền truy cập
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {staff.permissions.slice(0, 4).map((perm) => (
                          <span
                            key={perm}
                            className="rounded-md border border-[#efe2d4] bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#5c493e]"
                          >
                            {perm}
                          </span>
                        ))}
                        {staff.permissions.length > 4 && (
                          <span className="rounded-md bg-[#f6ece3] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#5c493e]">
                            +{staff.permissions.length - 4}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-[#8c7568]">
                      <span>Cập nhật: {formatDateTime(staff.joinedAt)}</span>
                      <span className="font-medium text-[#6e5a4f]">Chỉ đọc</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: QUẢN LÝ ĐƠN HÀNG (ORDERS)                                    */}
      {/* =================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="Đơn hàng & Điều phối NariNow 2H"
            badge={<StatusBadge tone="accent">{orders.length} đơn hàng</StatusBadge>}
          />

          <SectionCard
            title="Bảng điều phối đơn hàng"
            description="Quy trình xử lý từ Tiếp nhận → Xác nhận → Đóng gói → Giao hàng 2H → Hoàn tất."
          >
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "Tất cả đơn" },
                { key: "pending", label: "Chờ xác nhận" },
                { key: "confirmed", label: "Đã xác nhận" },
                { key: "packing", label: "Đang đóng gói" },
                { key: "shipping", label: "Đang giao 2H" },
                { key: "delivered", label: "Đã giao" },
                { key: "cancelled", label: "Đã hủy" },
                { key: "returned", label: "Hoàn trả" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setOrderStatusFilter(item.key)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    orderStatusFilter === item.key
                      ? "bg-[#3d2e24] text-[#faf5f0] shadow-sm"
                      : "border border-[#e6d5c5] bg-[#faf5f0] text-[#5c493e] hover:bg-[#f6ece3]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyStateCard
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Không có đơn hàng trong trạng thái này"
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                    <tr>
                      <th className="px-4 py-3">Mã đơn / Thời gian</th>
                      <th className="px-3 py-3">Khách hàng</th>
                      <th className="px-3 py-3">Sản phẩm</th>
                      <th className="px-3 py-3 text-right">Tổng tiền</th>
                      <th className="px-3 py-3">Phương thức</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Điều phối / Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="transition-colors hover:bg-[#faf5f0]/60">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-[#3d2e24]">{o.orderCode}</span>
                          <div className="mt-0.5 text-[11px] text-[#8c7568]">
                            {formatDateTime(o.createdAt)}
                          </div>
                          <span className="mt-1 inline-block rounded bg-[#f6ece3] px-1.5 py-0.5 text-[10px] font-semibold text-[#5c493e]">
                            {o.deliveryType}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-[#1e1b18]">{o.customerName}</div>
                          <div className="text-[11px] text-[#6e5a4f]">{o.customerPhone}</div>
                          <div className="max-w-[180px] truncate text-[10px] text-[#8c7568]">
                            {o.shippingAddress}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[200px] space-y-0.5">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="truncate text-[#5c493e]">
                                <span className="font-bold text-[#3d2e24]">{item.quantity}x</span>{" "}
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          <div className="font-bold text-[#1e1b18]">{formatVND(o.total)}</div>
                          <span
                            className={cn(
                              "text-[10px] font-semibold",
                              o.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700",
                            )}
                          >
                            {o.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[140px] truncate text-[#5c493e]" title={o.paymentMethod}>
                            {o.paymentMethod}
                          </div>
                          <div className="truncate text-[10px] text-[#8c7568]">{o.branchName}</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge tone={getOrderStatusTone(o.status)}>
                            {o.statusLabel}
                          </StatusBadge>
                          <div className="mt-1 text-[10px] text-[#8c7568]">
                            NV: {o.assignedStaffName || "Chưa gán"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {o.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "confirmed")}
                                className="rounded-lg bg-[#3d2e24] px-2.5 py-1 text-[11px] font-semibold text-[#faf5f0] transition hover:bg-[#2a1f18]"
                              >
                                Xác nhận đơn
                              </button>
                            )}
                            {o.status === "confirmed" && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "packing")}
                                className="rounded-lg bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-amber-800"
                              >
                                Đóng gói
                              </button>
                            )}
                            {o.status === "packing" && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "shipping")}
                                className="rounded-lg bg-[#b86b4b] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#9f593c]"
                              >
                                Giao NariNow 2H
                              </button>
                            )}
                            {o.status === "shipping" && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "delivered")}
                                className="rounded-lg bg-[#3d2e24] px-2.5 py-1 text-[11px] font-semibold text-[#faf5f0] transition hover:bg-[#2a1f18]"
                              >
                                Hoàn tất
                              </button>
                            )}
                            {(o.status === "pending" || o.status === "confirmed") && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "cancelled")}
                                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                Hủy đơn
                              </button>
                            )}
                            {(o.status === "shipping" || o.status === "delivered") && (
                              <button
                                type="button"
                                onClick={() => handleAdvanceOrderStatus(o.id, "returned")}
                                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-50"
                              >
                                Hoàn đơn
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(o)}
                              className="rounded-lg border border-[#e6d5c5] bg-[#faf5f0] px-2.5 py-1 text-[11px] font-semibold text-[#3d2e24] transition hover:bg-[#f6ece3]"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: QUẢN LÝ KHO HÀNG (WAREHOUSE & INVENTORY)                     */}
      {/* =================================================================== */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="Tồn kho đa chi nhánh"
            badge={<StatusBadge tone="accent">{inventory.length} SKU</StatusBadge>}
          />

          <SectionCard
            title="Phân bổ tồn kho thực tế"
            description="Theo dõi số lượng khả dụng và thực hiện nhập xuất điều chỉnh tại các chi nhánh trọng điểm."
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]" />
                <input
                  type="text"
                  placeholder="Tìm theo SKU, tên sản phẩm, thương hiệu..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 py-2 pl-10 pr-3.5 text-xs text-[#1e1b18] placeholder:text-[#9c877a] focus:border-[#b86b4b] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-[#6e5a4f]">Trạng thái:</span>
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#e6d5c5] bg-white px-3 py-2 text-xs font-medium text-[#3d2e24] focus:border-[#b86b4b] focus:outline-none"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="in_stock">Còn hàng an toàn</option>
                  <option value="low_stock">Sắp hết hàng (Low Stock)</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <EmptyStateCard
                icon={<Warehouse className="h-6 w-6" />}
                title="Không có SKU phù hợp"
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                    <tr>
                      <th className="px-4 py-3">SKU / Sản phẩm</th>
                      <th className="px-3 py-3">Thương hiệu</th>
                      <th className="px-3 py-3 text-right">Giá bán</th>
                      <th className="px-3 py-3 text-center">Tổng tồn</th>
                      <th className="px-3 py-3">Phân bổ chi nhánh</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Điều chỉnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                    {filteredInventory.map((item) => (
                      <tr key={item.sku} className="transition-colors hover:bg-[#faf5f0]/60">
                        <td className="px-4 py-3">
                          <div className="max-w-[280px] truncate font-semibold text-[#1e1b18]" title={item.productName}>
                            {item.productName}
                          </div>
                          <span className="mt-0.5 inline-block rounded bg-[#faf5f0] px-1.5 py-0.5 font-mono text-[10px] text-[#6e5a4f]">
                            SKU: {item.sku}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-semibold text-[#3d2e24]">{item.brand}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-[#1e1b18]">
                          {formatVND(item.price)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-bold text-[#1e1b18]">{item.totalStock}</span>
                          <div className="text-[10px] text-[#8c7568]">
                            Khả dụng: {item.availableStock}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.branchStock.map((b) => (
                              <span
                                key={b.branchId}
                                className="rounded-md border border-[#efe2d4] bg-[#faf5f0] px-1.5 py-0.5 font-mono text-[10px] text-[#5c493e]"
                                title={b.branchName}
                              >
                                <b>{b.branchCode || b.branchId}:</b> {b.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge
                            tone={
                              item.warehouseStatus === "in_stock"
                                ? "success"
                                : item.warehouseStatus === "low_stock"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {item.warehouseStatus === "in_stock"
                              ? "Còn hàng"
                              : item.warehouseStatus === "low_stock"
                                ? "Sắp hết hàng"
                                : "Hết hàng"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInventoryItem(item);
                                setStockAdjustDelta(20);
                                setStockAdjustReason("Nhập hàng bổ sung từ Nhà phân phối");
                              }}
                              className="rounded-lg border border-[#e6d5c5] bg-[#faf5f0] px-2.5 py-1 text-[11px] font-semibold text-[#3d2e24] transition hover:bg-[#3d2e24] hover:text-[#faf5f0]"
                            >
                              + Nhập kho
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInventoryItem(item);
                                setStockAdjustDelta(-5);
                                setStockAdjustReason("Xuất kho điều chuyển hoặc bán lẻ");
                              }}
                              className="rounded-lg border border-[#e6d5c5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6e5a4f] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              - Xuất
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Audit Trail */}
          <SectionCard
            title="Nhật ký kiểm định & điều chỉnh kho (Audit Trail)"
            description="Lịch sử đầy đủ mọi biến động số lượng tồn kho kèm mã nhân sự thực hiện."
          >
            {auditLogs.length === 0 ? (
              <EmptyStateCard
                icon={<History className="h-5 w-5" />}
                title="Chưa có bản ghi kiểm định kho"
                className="py-8"
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                    <tr>
                      <th className="px-3 py-2.5">Thời gian</th>
                      <th className="px-3 py-2.5">SKU / Tên hàng</th>
                      <th className="px-2 py-2.5 text-center">Biến động</th>
                      <th className="px-2 py-2.5 text-center">Trước → Sau</th>
                      <th className="px-3 py-2.5">Lý do điều chỉnh</th>
                      <th className="px-3 py-2.5">Chi nhánh</th>
                      <th className="px-3 py-2.5">NV thực hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#faf5f0]/50">
                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-[#8c7568]">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-semibold text-[#1e1b18]">{log.productName}</span>
                          <span className="block font-mono text-[10px] text-[#8c7568]">
                            {log.sku}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <StatusBadge tone={log.delta > 0 ? "success" : "danger"}>
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </StatusBadge>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-center text-[11px] text-[#6e5a4f]">
                          {log.previousStock} → <b className="text-[#1e1b18]">{log.newStock}</b>
                        </td>
                        <td className="px-3 py-2.5 text-[#5c493e]">{log.reason}</td>
                        <td className="max-w-[150px] truncate px-3 py-2.5 text-[#6e5a4f]">
                          {log.branchName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-[#5c493e]">
                          {log.staffCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: SEO & CHUẨN HÓA AI MCP CONSOLE                               */}
      {/* =================================================================== */}
      {activeTab === "mcp_seo" && (
        <div className="space-y-6">
          <PortalPageHeader
            title="AI MCP Protocol & SEO Hub"
            badge={<StatusBadge tone="accent">JSON-RPC 2.0</StatusBadge>}
          />

          {/* AI MCP Tool Playground */}
          <SectionCard
            title="AI MCP Tool Playground"
            description="Gửi yêu cầu JSON-RPC 2.0 trực tiếp tới endpoint nội bộ /api/mcp để kiểm thử các công cụ của AI Agent."
            actions={
              <code className="rounded-lg border border-[#e6d5c5] bg-[#faf5f0] px-2.5 py-1 font-mono text-xs font-bold text-[#3d2e24]">
                POST /api/mcp
              </code>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-[#5c493e]">
                  Chọn công cụ MCP Server:
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {mcpTools.map((tool) => (
                    <button
                      key={tool.name}
                      type="button"
                      onClick={() => handleSelectMcpTool(tool.name)}
                      className={cn(
                        "rounded-xl border p-3 text-left text-xs transition",
                        selectedMcpTool === tool.name
                          ? "border-[#b86b4b] bg-[#faf5f0] ring-1 ring-[#b86b4b]/40"
                          : "border-[#e6d5c5] bg-white hover:border-[#d8b89c] hover:bg-[#faf5f0]/50",
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#3d2e24]">
                        <Code className="h-3.5 w-3.5 text-[#b86b4b]" />
                        <span>{tool.name}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#6e5a4f]">
                        {tool.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#5c493e]">
                      Tham số đầu vào (JSON arguments)
                    </label>
                    <span className="font-mono text-[11px] text-[#8c7568]">tools/call</span>
                  </div>
                  <textarea
                    rows={8}
                    value={mcpToolArgs}
                    onChange={(e) => setMcpToolArgs(e.target.value)}
                    className="w-full rounded-xl border border-[#3d2e24]/30 bg-[#1e1b18] p-3.5 font-mono text-xs text-[#f6ece3] focus:border-[#b86b4b] focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleExecuteMcpTool}
                      disabled={mcpExecuting}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#b86b4b] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#9f593c] disabled:opacity-50"
                    >
                      {mcpExecuting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang thực thi JSON-RPC...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="h-3.5 w-3.5" />
                          <span>Thực thi Tool (JSON-RPC 2.0)</span>
                        </>
                      )}
                    </button>
                    {mcpLatency !== null && (
                      <span className="font-mono text-xs text-[#6e5a4f]">
                        Độ trễ: <b className="text-[#3d2e24]">{mcpLatency}ms</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#5c493e]">
                      Kết quả phản hồi JSON-RPC 2.0
                    </span>
                    <StatusBadge
                      tone={
                        mcpStatus
                          ? mcpStatus.succeeded
                            ? "success"
                            : "danger"
                          : "neutral"
                      }
                    >
                      {mcpStatus
                        ? mcpStatus.succeeded
                          ? `Status ${mcpStatus.statusCode ?? 200} OK`
                          : mcpStatus.statusCode
                            ? `Status ${mcpStatus.statusCode} Error`
                            : "Request Failed"
                        : "Chờ thực thi"}
                    </StatusBadge>
                  </div>
                  <pre className="h-[210px] overflow-auto rounded-xl border border-[#3d2e24]/30 bg-[#1e1b18] p-3.5 font-mono text-xs text-[#e6d5c5]">
                    {mcpResponse ||
                      "// Nhấn 'Thực thi Tool' để gửi yêu cầu JSON-RPC đến /api/mcp và xem dữ liệu thời gian thực..."}
                  </pre>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* SEO & Meta Viewer */}
          <SectionCard
            title="SEO & Structured Data (JSON-LD) Audit"
            description="Kiểm tra nhanh trạng thái sitemap, robots và cấu trúc dữ liệu có cấu trúc trên các tuyến chính."
            actions={
              <div className="flex items-center gap-3 text-xs">
                <Link
                  href="/sitemap.xml"
                  target="_blank"
                  className="inline-flex items-center gap-1 font-semibold text-[#3d2e24] hover:text-[#b86b4b]"
                >
                  <span>/sitemap.xml</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <Link
                  href="/robots.txt"
                  target="_blank"
                  className="inline-flex items-center gap-1 font-semibold text-[#3d2e24] hover:text-[#b86b4b]"
                >
                  <span>/robots.txt</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            }
          >
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiStatCard
                label="Lighthouse SEO"
                value="100 / 100"
                hint="Chuẩn hóa Title, Meta Description, H1/H2 và canonical URL"
                icon={<Globe className="h-4 w-4" />}
                tone="accent"
              />
              <KpiStatCard
                label="JSON-LD Schemas"
                value="8 Thực thể"
                hint="Organization, Product, AggregateRating, BreadcrumbList"
                icon={<Code className="h-4 w-4" />}
              />
              <KpiStatCard
                label="OpenGraph & Social"
                value="Đầy đủ"
                hint="Tối ưu xem trước mạng xã hội với og:image"
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                  <tr>
                    <th className="px-4 py-2.5">Route Path</th>
                    <th className="px-3 py-2.5">Tên trang</th>
                    <th className="px-3 py-2.5 text-center">Điểm SEO</th>
                    <th className="px-3 py-2.5">JSON-LD Schemas</th>
                    <th className="px-3 py-2.5 text-center">OpenGraph Card</th>
                    <th className="px-4 py-2.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                  {DEFAULT_SEO_ROUTES.map((item) => (
                    <tr key={item.route} className="hover:bg-[#faf5f0]/60">
                      <td className="px-4 py-2.5 font-mono font-medium text-[#3d2e24]">
                        {item.route}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#1e1b18]">{item.name}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-[#3d2e24]">
                        {item.score}%
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-[#6e5a4f]">
                        {item.schemaType}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge tone={item.ogImage ? "accent" : "neutral"}>
                          {item.ogImage ? "Có og:image" : "Chưa có"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <StatusBadge tone={item.status === "Pass" ? "success" : "warning"}>
                          {item.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM KHÁCH HÀNG MỚI                                          */}
      {/* =================================================================== */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b18]/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e6d5c5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efe2d4] pb-3">
              <h3 className="font-display text-base font-semibold text-[#3d2e24]">
                Tạo hồ sơ khách hàng mới
              </h3>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                aria-label="Đóng hộp thoại"
                className="rounded-lg p-1 text-[#7c685c] hover:bg-[#faf5f0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const fullName = String(fd.get("fullName") || "");
                const phone = String(fd.get("phone") || "");
                const email = String(fd.get("email") || "");
                const tier = String(fd.get("tier") || "Member") as UserTier;
                const address = String(fd.get("address") || "");

                try {
                  const res = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName, phone, email, tier, address }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setUsers((prev) => [data.user, ...prev]);
                    showToast(`Tạo thành công khách hàng: ${data.user.fullName}`);
                    setIsNewUserModalOpen(false);
                  } else {
                    showToast(data.error || "Lỗi tạo khách hàng");
                  }
                } catch {
                  showToast("Lỗi kết nối máy chủ");
                }
              }}
              className="mt-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">
                  Họ và tên khách hàng *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Ví dụ: Lê Thị Thanh Thảo"
                  className={modalInputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-[#5c493e]">Số điện thoại *</label>
                  <input
                    name="phone"
                    required
                    placeholder="0909123456"
                    className={modalInputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[#5c493e]">Hạng thẻ ban đầu</label>
                  <select name="tier" defaultValue="Member" className={modalInputClass}>
                    <option value="Member">Member</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">Email liên hệ *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="thao.le@gmail.com"
                  className={modalInputClass}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">Địa chỉ giao hàng</label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  className={modalInputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#efe2d4] pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="rounded-xl px-3.5 py-2 font-medium text-[#6e5a4f] hover:bg-[#faf5f0]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3d2e24] px-4 py-2 font-semibold text-[#faf5f0] hover:bg-[#2a1f18]"
                >
                  Tạo khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ĐIỀU CHỈNH TỒN KHO                                           */}
      {/* =================================================================== */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b18]/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl border border-[#e6d5c5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efe2d4] pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#3d2e24]">
                  Điều chỉnh tồn kho
                </h3>
                <p className="mt-0.5 font-mono text-xs text-[#7c685c]">
                  SKU: {selectedInventoryItem.sku}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInventoryItem(null)}
                aria-label="Đóng hộp thoại"
                className="rounded-lg p-1 text-[#7c685c] hover:bg-[#faf5f0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-xl border border-[#efe2d4] bg-[#faf5f0] p-3">
                <p className="font-semibold text-[#1e1b18]">{selectedInventoryItem.productName}</p>
                <div className="mt-2 flex items-center justify-between text-[#6e5a4f]">
                  <span>
                    Hiện có: <b className="text-[#3d2e24]">{selectedInventoryItem.totalStock} sp</b>
                  </span>
                  <span>
                    Khả dụng: <b className="text-[#3d2e24]">{selectedInventoryItem.availableStock} sp</b>
                  </span>
                  <span>
                    Ngưỡng báo: <b className="text-[#3d2e24]">{selectedInventoryItem.reorderPoint} sp</b>
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">
                  Số lượng thay đổi (dương là Nhập, âm là Xuất) *
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustDelta}
                  onChange={(e) => setStockAdjustDelta(parseInt(e.target.value) || 0)}
                  className={cn(modalInputClass, "font-bold")}
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">
                  Chi nhánh áp dụng *
                </label>
                <select
                  value={
                    stockAdjustBranch ||
                    branches[0]?.id ||
                    selectedInventoryItem.branchStock[0]?.branchId ||
                    ""
                  }
                  onChange={(e) => setStockAdjustBranch(e.target.value)}
                  className={modalInputClass}
                >
                  {(branches.length > 0
                    ? branches
                    : selectedInventoryItem.branchStock.map((b) => ({
                        id: b.branchId,
                        code: b.branchCode || b.branchId,
                        name: b.branchName,
                      }))
                  ).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#5c493e]">
                  Lý do điều chỉnh (lưu vào Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value)}
                  placeholder="Ghi rõ số hóa đơn nhập khẩu hoặc lý do xuất kho..."
                  className={modalInputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#efe2d4] pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedInventoryItem(null)}
                  className="rounded-xl px-3.5 py-2 font-medium text-[#6e5a4f] hover:bg-[#faf5f0]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3d2e24] px-4 py-2 font-semibold text-[#faf5f0] hover:bg-[#2a1f18]"
                >
                  Xác nhận điều chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CHI TIẾT ĐƠN HÀNG                                            */}
      {/* =================================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b18]/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-[#e6d5c5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#efe2d4] pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-[#3d2e24]">
                  Chi tiết đơn hàng {selectedOrder.orderCode}
                </h3>
                <p className="text-xs text-[#7c685c]">
                  Đặt lúc: {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết đơn hàng"
                className="rounded-lg p-1 text-[#7c685c] hover:bg-[#faf5f0]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5 rounded-xl border border-[#efe2d4] bg-[#faf5f0] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#6e5a4f]">Khách nhận:</span>
                  <span className="font-bold text-[#1e1b18]">{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#6e5a4f]">Điện thoại:</span>
                  <span className="text-[#3d2e24]">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 font-medium text-[#6e5a4f]">Địa chỉ giao:</span>
                  <span className="text-right text-[#3d2e24]">{selectedOrder.shippingAddress}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-2 border-t border-[#e6d5c5] pt-2 text-amber-800">
                    <b>Ghi chú:</b> {selectedOrder.notes}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 font-semibold text-[#5c493e]">Danh sách sản phẩm trong đơn:</p>
                <div className="divide-y divide-[#efe2d4] overflow-hidden rounded-xl border border-[#efe2d4]">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3">
                      <div>
                        <p className="font-semibold text-[#1e1b18]">{item.name}</p>
                        <p className="font-mono text-[11px] text-[#8c7568]">
                          SKU: {item.sku} · {item.brand}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-[#3d2e24]">
                          {formatVND(item.price * item.quantity)}
                        </span>
                        <div className="text-[11px] text-[#7c685c]">
                          {item.quantity} x {formatVND(item.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#efe2d4] bg-[#faf5f0] p-3.5 text-xs">
                <div>
                  <p className="text-[#6e5a4f]">Phương thức thanh toán:</p>
                  <p className="font-semibold text-[#3d2e24]">{selectedOrder.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#6e5a4f]">Tổng thanh toán:</p>
                  <p className="text-base font-bold text-[#b86b4b]">
                    {formatVND(selectedOrder.total)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#efe2d4] pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#6e5a4f]">Nhân sự phụ trách:</span>
                  <span className="font-bold text-[#3d2e24]">
                    {selectedOrder.assignedStaffName || "Chưa gán"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl bg-[#3d2e24] px-4 py-2 font-semibold text-[#faf5f0] hover:bg-[#2a1f18]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BackofficeShell>
  );
}

export { AdminAccessDenied } from "./admin-access-denied";
