"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShoppingBag,
  Warehouse,
  Bot,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowUpRight,
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

// Helper for formatting Vietnamese currency
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " ₫";

// Helper for formatting date-time
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
  mcpToolArgs: string
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
        2
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
        2
      ),
    };
  }
}

export function AdminErpView({ initialSession = null }: { initialSession?: AuthSessionUser | null }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "staff" | "orders" | "inventory" | "mcp_seo"
  >("dashboard");

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
    JSON.stringify(DEFAULT_MCP_TOOLS[0].defaultArgs, null, 2)
  );
  const [mcpExecuting, setMcpExecuting] = useState(false);
  const [mcpResponse, setMcpResponse] = useState<string | null>(null);
  const [mcpLatency, setMcpLatency] = useState<number | null>(null);
  const [mcpStatus, setMcpStatus] = useState<{ succeeded: boolean; statusCode: number | null } | null>(null);

  // Show Toast
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

  // Fetch all initial data
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
      // In case of network error, graceful handling
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
        // In case of network error, graceful handling
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authSession]);

  // Handle MCP tool switch
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

  // Execute MCP Tool
  const handleExecuteMcpTool = async () => {
    setMcpExecuting(true);
    const { elapsed, responseJson, succeeded, statusCode } = await executeMcpToolCall(
      selectedMcpTool,
      mcpToolArgs
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
          : `Không thể thực thi [${selectedMcpTool}]`
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
  const handleAdvanceOrderStatus = async (
    orderId: string,
    nextStatus: ErpOrderStatus
  ) => {
    const currentOrder = orders.find((o) => o.id === orderId) || selectedOrder;
    if (nextStatus === "cancelled") {
      if (!window.confirm(`Xác nhận hủy đơn hàng ${currentOrder?.orderCode || orderId} và hoàn lại tồn kho?`)) {
        return;
      }
    } else if (nextStatus === "returned") {
      if (!window.confirm(`Xác nhận chuyển đơn hàng ${currentOrder?.orderCode || orderId} sang trạng thái Hoàn đơn?`)) {
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
        // Refresh KPIs in background
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
          reason: stockAdjustReason || (stockAdjustDelta > 0 ? "Nhập kho bổ sung" : "Xuất kho điều chuyển"),
          branchId: targetBranch,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInventory((prev) =>
          prev.map((item) => (item.sku === selectedInventoryItem.sku ? data.updatedItem : item))
        );
        setAuditLogs((prev) => [data.auditLog, ...prev]);
        showToast(
          `Đã ${stockAdjustDelta > 0 ? "nhập" : "xuất"} ${Math.abs(stockAdjustDelta)} sản phẩm cho SKU ${selectedInventoryItem.sku}`
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
          u.email.toLowerCase().includes(q)
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
          i.brand.toLowerCase().includes(q)
      );
    }
    if (inventoryStatusFilter !== "all") {
      list = list.filter((i) => i.warehouseStatus === inventoryStatusFilter);
    }
    return list;
  }, [inventory, inventorySearch, inventoryStatusFilter]);

  if (!authSession) {
    return (
      <div className="min-h-screen bg-[#f3f6f4] text-[#1e2922] py-16 px-4">
        <div className="wrap max-w-lg mx-auto bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
          <Lock className="w-10 h-10 text-[#3d2e24] mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Khu vực Quản trị Nội bộ (Yêu cầu xác thực)
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Cổng Quản trị ERP chỉ dành cho nhân sự được cấp quyền. Vui lòng đăng nhập tài khoản quản trị để tiếp tục.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/dang-nhap"
              className="bg-[#3d2e24] text-white px-5 py-2.5 rounded-md text-sm font-semibold"
            >
              Đến trang đăng nhập
            </Link>
            <Link
              href="/"
              className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-md text-sm font-semibold"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-[#1e2922] pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#173a2b] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-[#9e7656]/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#c8a98e] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#d4beaa] hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner / Breadcrumb Bar */}
      <div className="bg-[#3d2e24] text-white border-b border-[#2a1f18]/30">
        <div className="wrap py-4 px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2a1f18] flex items-center justify-center border border-[#9e7656]/50 shadow-inner">
              <Building2 className="w-5 h-5 text-[#efe2d4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">NARI HOME ENTERPRISE ERP</h1>
                <span className="bg-[#b86b4b] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Portal v2.6
                </span>
              </div>
              <p className="text-xs text-[#f6ece3]/80">
                Trung tâm Quản trị Vận hành Bán lẻ, Kho Đa Chi nhánh, Khách hàng & AI MCP Protocols
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link href="/quan-tri/san-pham" className="rounded-md border border-[#6e5a4f] px-3 py-2 hover:bg-white/10">
              Quản lý sản phẩm
            </Link>
            <Link href="/nhan-vien" className="rounded-md border border-[#6e5a4f] px-3 py-2 hover:bg-white/10">
              Màn hình nhân viên
            </Link>
            <div className="flex items-center gap-2 bg-[#2a1f18]/40 px-3 py-1.5 rounded-md border border-[#6e5a4f]/40">
              <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
              <span>Hệ thống: 100% Hoạt động</span>
            </div>
            <div className="flex items-center gap-2 bg-[#2a1f18]/40 px-3 py-1.5 rounded-md border border-[#6e5a4f]/40">
              <ShieldCheck className="w-4 h-4 text-[#d4beaa]" />
              <span>
                {authSession
                  ? `${authSession.fullName} (${
                      authSession.role === "admin"
                        ? "Admin ERP"
                        : authSession.role === "warehouse_staff"
                        ? "Quản lý Kho"
                        : authSession.role === "customer"
                        ? "Khách hàng"
                        : authSession.roleLabel
                    })`
                  : "Chưa đăng nhập"}
              </span>
            </div>
            <button
              onClick={refreshAllData}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-white text-[#3d2e24] font-medium px-3 py-1.5 rounded-md hover:bg-[#faf5f0] transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Đồng bộ</span>
            </button>
          </div>
        </div>

        {/* Active Admin Session & Role Switcher Bar */}
        <div className="bg-[#2a1f18] border-t border-[#6e5a4f]/50 px-4 py-2.5">
          <div className="wrap flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Current Session Info */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#2a1f18] border border-[#9e7656]/50 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {authSession ? authSession.fullName.charAt(0) : "A"}
                </div>
                <div>
                  <span className="font-bold text-white">
                    {authSession ? authSession.fullName : "Chưa đăng nhập (Khách vãng lai)"}
                  </span>
                  {authSession?.email && (
                    <span className="text-[#d4beaa]/80 text-[11px] ml-1.5">
                      ({authSession.email})
                    </span>
                  )}
                </div>
              </div>

              {/* Role Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2a1f18] text-[#efe2d4] border border-[#9e7656]/60 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-[#c8a98e]" />
                <span>
                  {authSession?.role === "admin"
                    ? "Admin ERP"
                    : authSession?.role === "warehouse_staff"
                    ? "Quản lý Kho"
                    : authSession?.role === "customer"
                    ? "Khách hàng"
                    : authSession?.roleLabel || "Khách"}
                </span>
              </span>

              {/* Branch */}
              <span className="text-[#efe2d4]/90 text-[11px] bg-[#2a1f18]/40 px-2 py-0.5 rounded border border-[#6e5a4f]/40 truncate max-w-[280px]">
                Chi nhánh: <b>{authSession?.branchName || "Toàn hệ thống Nari Home"}</b>
              </span>
            </div>

            {/* Session Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dang-nhap"
                className="bg-[#2a1f18]/60 hover:bg-[#2a1f18] text-[#efe2d4] border border-[#9e7656]/40 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
              >
                Tài khoản
              </Link>

              {authSession && (
                <button
                  type="button"
                  onClick={() => {
                    void handleLogoutAdmin();
                  }}
                  className="bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/50 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="wrap px-4 flex items-center overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "dashboard"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng quan ERP</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "users"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách hàng & Hội viên</span>
            <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "staff"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Nhân sự & RBAC</span>
            <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {staffList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "orders"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn hàng & Điều phối</span>
            {orders.some((o) => o.status === "pending") && (
              <span className="bg-red-500 text-white text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {orders.filter((o) => o.status === "pending").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Kho hàng & Đa chi nhánh</span>
            {inventory.some((i) => i.warehouseStatus === "low_stock") && (
              <span className="bg-[#b86b4b] text-white text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                {inventory.filter((i) => i.warehouseStatus === "low_stock").length} cảnh báo
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("mcp_seo")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "mcp_seo"
                ? "border-[#3d2e24] text-[#3d2e24] bg-[#faf5f0]/80"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Bot className="w-4 h-4 text-[#3d2e24]" />
            <span>AI MCP & SEO Hub</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="wrap px-4 mt-6">
        {/* ========================================================================= */}
        {/* TAB 1: TỔNG QUAN ERP (DASHBOARD KPIS)                                    */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tổng Doanh Thu
                    </p>
                    <p className="text-2xl font-black text-gray-900 mt-1">
                      {formatVND(kpis?.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#faf5f0] text-[#3d2e24] flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#3d2e24] font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Hôm nay: {formatVND(kpis?.todayRevenue || 0)}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Đơn Hàng Vận Hành
                    </p>
                    <p className="text-2xl font-black text-gray-900 mt-1">
                      {kpis?.totalOrders || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-50 text-[#b86b4b] flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-600 font-medium">
                  <span className="text-amber-600 font-bold">
                    {kpis?.pendingOrdersCount || 0} chờ xử lý
                  </span>
                  <span>•</span>
                  <span className="text-blue-600 font-bold">
                    {kpis?.packingShippingCount || 0} đang giao
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Khách Hàng Hội Viên
                    </p>
                    <p className="text-2xl font-black text-gray-900 mt-1">
                      {kpis?.totalCustomers || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                  <span className="text-[#3d2e24] font-bold">
                    {kpis?.activeCustomers || 0} tài khoản đang hoạt động
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Cảnh Báo Kho Hàng
                    </p>
                    <p className="text-2xl font-black text-red-600 mt-1">
                      {kpis?.lowStockCount || 0} SKU
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <span>Dưới định mức tái đặt hàng (Reorder Point &lt; 20)</span>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Low Stock Warning + Recent Audit Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Alerts */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#b86b4b]" />
                    <h2 className="font-bold text-gray-900">Sản Phẩm Cần Nhập Kho Gấp</h2>
                  </div>
                  <button
                    onClick={() => {
                      setInventoryStatusFilter("low_stock");
                      setActiveTab("inventory");
                    }}
                    className="text-xs font-semibold text-[#3d2e24] hover:underline flex items-center gap-1"
                  >
                    <span>Xem tất cả</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 mt-2">
                  {kpis?.lowStockItems && kpis.lowStockItems.length > 0 ? (
                    kpis.lowStockItems.map((item) => (
                      <div
                        key={item.sku}
                        className="py-3 flex items-center justify-between gap-4 hover:bg-gray-50/80 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {item.sku}
                            </span>
                            <span className="text-xs font-bold text-gray-800 truncate">
                              {item.productName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Thương hiệu: <span className="font-medium text-gray-700">{item.brand}</span> • Giá:{" "}
                            {formatVND(item.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="inline-block text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              Còn {item.totalStock} sp
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setStockAdjustDelta(20);
                              setStockAdjustReason("Nhập hàng khẩn cấp do tồn kho dưới mức an toàn");
                              setActiveTab("inventory");
                            }}
                            className="bg-[#faf5f0] text-[#3d2e24] hover:bg-[#3d2e24] hover:text-white px-2.5 py-1 text-xs font-semibold rounded transition-colors"
                          >
                            + Nhập
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 py-6 text-center">
                      Không có sản phẩm nào chạm ngưỡng cảnh báo.
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-600" />
                    <h2 className="font-bold text-gray-900">Nhật Ký Biến Động Kho Vận</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="text-xs font-semibold text-[#3d2e24] hover:underline flex items-center gap-1"
                  >
                    <span>Lịch sử chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 mt-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="py-2.5 text-xs hover:bg-gray-50/80 px-2 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              log.delta > 0
                                ? "bg-[#f6ece3] text-[#2a1f18]"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </span>
                          <span className="font-medium text-gray-800 line-clamp-1">
                            {log.productName}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 mt-1">
                        <span className="truncate">{log.reason}</span>
                        <span className="font-mono text-[10px] bg-gray-100 px-1 rounded shrink-0">
                          {log.staffCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-gradient-to-r from-[#173a2b] to-[#3d2e24] text-white p-6 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Lối Tắt Điều Hành Doanh Nghiệp</h3>
                <p className="text-xs text-[#f6ece3] mt-1 max-w-xl">
                  Khởi tạo nhanh hồ sơ khách hàng mới, phê duyệt phân quyền nhân sự, xử lý đơn NariNow 2H hoặc kiểm tra các MCP protocol dành cho trợ lý AI.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="bg-white text-[#3d2e24] hover:bg-[#faf5f0] px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Khách Hàng</span>
                </button>
                <button
                  onClick={() => setActiveTab("staff")}
                  className="bg-[#2a1f18] hover:bg-[#3d2e24] text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 border border-[#9e7656]/40"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Danh Sách Nhân Sự</span>
                </button>
                <button
                  onClick={() => setActiveTab("mcp_seo")}
                  className="bg-[#b86b4b] hover:bg-[#e85b0d] text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Mở AI MCP Playground</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: QUẢN LÝ KHÁCH HÀNG (USERS)                                       */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quản Lý Khách Hàng & Hội Viên</h2>
                <p className="text-xs text-gray-500">
                  Hệ thống quản lý khách hàng Nari Home, phân loại hạng thẻ và tích lũy điểm thưởng
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="bg-[#3d2e24] hover:bg-[#1e1b18] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Khách Hàng</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, số điện thoại, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d2e24]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Hạng thẻ:</span>
                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                >
                  <option value="all">Tất cả hạng</option>
                  <option value="Member">Member</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Diamond">Diamond</option>
                </select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Mã KH / Họ Tên</th>
                    <th className="py-3 px-3">Liên Hệ</th>
                    <th className="py-3 px-3">Hạng Thẻ</th>
                    <th className="py-3 px-3 text-right">Điểm Tích Lũy</th>
                    <th className="py-3 px-3 text-right">Tổng Chi Tiêu</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{u.fullName}</div>
                        <span className="text-[10px] font-mono text-gray-400">{u.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-800">{u.phone}</div>
                        <div className="text-gray-400 text-[11px] truncate max-w-[180px]">
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.tier === "Diamond"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : u.tier === "Gold"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : u.tier === "Silver"
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#3d2e24]">
                        {u.loyaltyPoints} pts
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-800">
                        {formatVND(u.totalSpent)}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {u.ordersCount} đơn
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === "active"
                              ? "bg-[#faf5f0] text-[#3d2e24]"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "active" ? "bg-[#9e7656]" : "bg-red-500"
                            }`}
                          />
                          {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateUserPoints(u.id, 100)}
                            title="Tặng 100 điểm thưởng"
                            className="bg-[#faf5f0] hover:bg-[#f6ece3] text-[#3d2e24] px-2 py-1 rounded text-[11px] font-semibold transition-colors"
                          >
                            +100 pts
                          </button>
                          <select
                            value={u.tier}
                            onChange={(e) => handleChangeUserTier(u.id, e.target.value as UserTier)}
                            className="text-[10px] border border-gray-300 rounded px-1.5 py-1 bg-white"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QUẢN LÝ NHÂN VIÊN (STAFF & RBAC)                                  */}
        {/* ========================================================================= */}
        {activeTab === "staff" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quản Lý Nhân Sự & Phân Quyền (RBAC)</h2>
                <p className="text-xs text-gray-500">
                  Danh sách nhân sự đồng bộ trực tiếp từ nari_identity.provisioned_identities trên PostgreSQL
                </p>
              </div>

              <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-900">
                Cấp/thu hồi quyền nhân sự thực hiện qua Supabase SQL owner (bảo mật đặc quyền tối thiểu)
              </span>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500 font-medium">Lọc theo vai trò:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all", label: "Tất cả vai trò" },
                  { key: "admin", label: "Admin HQ" },
                  { key: "store_manager", label: "Quản lý CH" },
                  { key: "warehouse_staff", label: "Nhân viên kho" },
                  { key: "cs_agent", label: "CSKH" },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setStaffRoleFilter(item.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      staffRoleFilter === item.key
                        ? "bg-[#3d2e24] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono bg-[#faf5f0] text-[#3d2e24] font-bold px-1.5 py-0.5 rounded">
                        {staff.employeeCode}
                      </span>
                      <h3 className="font-bold text-gray-900 mt-1">{staff.fullName}</h3>
                      <p className="text-xs text-[#3d2e24] font-medium">{staff.roleLabel}</p>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        staff.status === "active"
                          ? "bg-[#faf5f0] text-[#3d2e24]"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {staff.status === "active" ? "Đang làm việc" : "Nghỉ phép"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{staff.branchName}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{staff.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{staff.phone}</span>
                    </p>
                  </div>

                  {/* RBAC Permissions Badges */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Quyền truy cập:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {staff.permissions.slice(0, 4).map((perm) => (
                        <span
                          key={perm}
                          className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                      {staff.permissions.length > 4 && (
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          +{staff.permissions.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">
                      Cập nhật: {formatDateTime(staff.joinedAt)}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Chỉ đọc trên runtime
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: QUẢN LÝ ĐƠN HÀNG (ORDERS)                                         */}
        {/* ========================================================================= */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quản Lý Đơn Hàng & Điều Phối NariNow 2H</h2>
                <p className="text-xs text-gray-500">
                  Quy trình xử lý đơn hàng từ Tiếp nhận → Đóng gói → Giao hàng 2H → Hoàn tất
                </p>
              </div>

              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>Tổng số đơn: <b>{orders.length}</b></span>
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { key: "all", label: "Tất cả đơn" },
                { key: "pending", label: "Chờ xác nhận" },
                { key: "confirmed", label: "Đã xác nhận" },
                { key: "packing", label: "Đang đóng gói" },
                { key: "shipping", label: "Đang giao NariNow 2H" },
                { key: "delivered", label: "Đã giao thành công" },
                { key: "cancelled", label: "Đã hủy" },
                { key: "returned", label: "Hoàn trả" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setOrderStatusFilter(item.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    orderStatusFilter === item.key
                      ? "bg-[#3d2e24] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn / Thời Gian</th>
                    <th className="py-3 px-3">Khách Hàng</th>
                    <th className="py-3 px-3">Sản Phẩm</th>
                    <th className="py-3 px-3 text-right">Tổng Tiền</th>
                    <th className="py-3 px-3">Phương Thức</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Điều Phối / Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#2a1f18]">{o.orderCode}</span>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {formatDateTime(o.createdAt)}
                        </div>
                        <span className="inline-block text-[10px] font-semibold bg-[#faf5f0] text-[#3d2e24] px-1.5 py-0.2 rounded mt-1">
                          {o.deliveryType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{o.customerName}</div>
                        <div className="text-gray-500 text-[11px]">{o.customerPhone}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[180px]">
                          {o.shippingAddress}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 max-w-[200px]">
                          {o.items.map((item, idx) => (
                            <div key={idx} className="truncate text-gray-700">
                              <span className="font-bold text-[#3d2e24]">{item.quantity}x</span>{" "}
                              {item.name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-gray-900">{formatVND(o.total)}</div>
                        <span
                          className={`text-[10px] font-semibold ${
                            o.paymentStatus === "paid" ? "text-[#3d2e24]" : "text-amber-600"
                          }`}
                        >
                          {o.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-700 truncate max-w-[140px]" title={o.paymentMethod}>
                          {o.paymentMethod}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{o.branchName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            o.status === "delivered"
                              ? "bg-[#f6ece3] text-[#2a1f18]"
                              : o.status === "shipping"
                              ? "bg-blue-100 text-blue-800"
                              : o.status === "packing"
                              ? "bg-amber-100 text-amber-800"
                              : o.status === "confirmed"
                              ? "bg-indigo-100 text-indigo-800"
                              : o.status === "cancelled"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {o.statusLabel}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">
                          NV: {o.assignedStaffName || "Chưa gán"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {o.status === "pending" && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "confirmed")}
                              className="bg-[#3d2e24] hover:bg-[#1e1b18] text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Xác nhận đơn
                            </button>
                          )}
                          {o.status === "confirmed" && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "packing")}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Đóng gói
                            </button>
                          )}
                          {o.status === "packing" && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "shipping")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Giao NariNow 2H
                            </button>
                          )}
                          {o.status === "shipping" && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "delivered")}
                              className="bg-[#3d2e24] hover:bg-[#1e1b18] text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Hoàn tất
                            </button>
                          )}
                          {(o.status === "pending" || o.status === "confirmed") && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "cancelled")}
                              className="border border-red-200 bg-white hover:bg-red-50 text-red-700 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Hủy đơn
                            </button>
                          )}
                          {(o.status === "shipping" || o.status === "delivered") && (
                            <button
                              onClick={() => handleAdvanceOrderStatus(o.id, "returned")}
                              className="border border-amber-300 bg-white hover:bg-amber-50 text-amber-800 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                            >
                              Hoàn đơn
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-[11px] font-medium"
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: QUẢN LÝ KHO HÀNG (WAREHOUSE & INVENTORY)                           */}
        {/* ========================================================================= */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Quản Lý Tồn Kho Đa Chi Nhánh</h2>
                <p className="text-xs text-gray-500">
                  Phân bổ tồn kho thực tế giữa 4 chi nhánh trọng điểm (CN Hoàng Hoa Thám, CN 3/2, CN Cầu Giấy, CN Đà Nẵng)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Tổng SKU: <b>{inventory.length}</b>
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo SKU, tên sản phẩm, thương hiệu..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#3d2e24]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Trạng thái:</span>
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="in_stock">Còn hàng an toàn</option>
                  <option value="low_stock">Sắp hết hàng (Low Stock)</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">SKU / Sản Phẩm</th>
                    <th className="py-3 px-3">Thương Hiệu</th>
                    <th className="py-3 px-3 text-right">Đơn Giá</th>
                    <th className="py-3 px-3 text-center">Tổng Tồn Kho</th>
                    <th className="py-3 px-3">Phân Bổ Chi Nhánh</th>
                    <th className="py-3 px-3 text-center">Tình Trạng</th>
                    <th className="py-3 px-4 text-right">Điều Chỉnh Kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.sku} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 line-clamp-1 max-w-[280px]" title={item.productName}>
                          {item.productName}
                        </div>
                        <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          SKU: {item.sku}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-700">{item.brand}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-800">
                        {formatVND(item.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-gray-900 text-sm">{item.totalStock}</span>
                        <div className="text-[10px] text-gray-400">
                          Khả dụng: {item.availableStock}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.branchStock.map((b) => (
                            <span
                              key={b.branchId}
                              className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono"
                              title={b.branchName}
                            >
                              <b>{b.branchCode || b.branchId}:</b> {b.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.warehouseStatus === "in_stock"
                              ? "bg-[#f6ece3] text-[#2a1f18]"
                              : item.warehouseStatus === "low_stock"
                              ? "bg-red-100 text-red-800 animate-pulse"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {item.warehouseStatus === "in_stock"
                            ? "Còn hàng"
                            : item.warehouseStatus === "low_stock"
                            ? "Sắp hết hàng"
                            : "Hết hàng"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setStockAdjustDelta(20);
                              setStockAdjustReason("Nhập hàng bổ sung từ Nhà phân phối");
                            }}
                            className="bg-[#faf5f0] hover:bg-[#3d2e24] hover:text-white text-[#3d2e24] px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                          >
                            + Nhập kho
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setStockAdjustDelta(-5);
                              setStockAdjustReason("Xuất kho điều chuyển hoặc bán lẻ");
                            }}
                            className="bg-gray-100 hover:bg-red-600 hover:text-white text-gray-700 px-2 py-1 rounded text-[11px] font-semibold transition-colors"
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

            {/* Audit Logs History Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <span>Nhật Ký Kiểm Định & Điều Chỉnh Kho Gần Nhất (Audit Trail)</span>
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Thời Gian</th>
                      <th className="py-2.5 px-3">SKU / Tên Hàng</th>
                      <th className="py-2.5 px-2 text-center">Biến Động</th>
                      <th className="py-2.5 px-2 text-center">Trước → Sau</th>
                      <th className="py-2.5 px-3">Lý Do Điều Chỉnh</th>
                      <th className="py-2.5 px-3">Chi Nhánh</th>
                      <th className="py-2.5 px-3 font-mono">NV Thực Hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 text-gray-400 text-[11px]">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-gray-800">{log.productName}</span>
                          <span className="block text-[10px] font-mono text-gray-400">
                            {log.sku}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              log.delta > 0
                                ? "bg-[#f6ece3] text-[#2a1f18]"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.delta > 0 ? `+${log.delta}` : log.delta}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center text-gray-500 text-[11px]">
                          {log.previousStock} → <b className="text-gray-900">{log.newStock}</b>
                        </td>
                        <td className="py-2 px-3 text-gray-700">{log.reason}</td>
                        <td className="py-2 px-3 text-gray-500 truncate max-w-[150px]">
                          {log.branchName}
                        </td>
                        <td className="py-2 px-3 font-mono text-gray-600 text-[11px]">
                          {log.staffCode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SEO & CHUẨN HÓA AI MCP CONSOLE                                   */}
        {/* ========================================================================= */}
        {activeTab === "mcp_seo" && (
          <div className="space-y-6">
            {/* Header intro */}
            <div className="bg-gradient-to-r from-[#173a2b] via-[#3d2e24] to-[#25523d] text-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#2a1f18] flex items-center justify-center border border-[#9e7656]/40">
                  <Bot className="w-6 h-6 text-[#d4beaa]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Nari Home AI MCP Protocol & SEO Optimization Hub
                  </h2>
                  <p className="text-xs text-[#f6ece3]/90 mt-0.5">
                    Giao diện thử nghiệm Model Context Protocol (JSON-RPC 2.0) cho Autonomous AI Agents & Bảng kiểm thử SEO / Structured Data
                  </p>
                </div>
              </div>
            </div>

            {/* AI MCP Tool Playground */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-[#3d2e24]" />
                  <h3 className="font-bold text-gray-900">AI MCP Tool Playground (JSON-RPC 2.0)</h3>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>Endpoint:</span>
                  <code className="bg-gray-100 text-[#3d2e24] font-mono px-2 py-0.5 rounded font-bold">
                    POST /api/mcp
                  </code>
                </div>
              </div>

              {/* Tool Selection Buttons */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Chọn công cụ AI Agent có sẵn trong MCP Server:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {mcpTools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => handleSelectMcpTool(tool.name)}
                      className={`text-left p-3 rounded-lg border text-xs transition-all ${
                        selectedMcpTool === tool.name
                          ? "border-[#3d2e24] bg-[#faf5f0]/60 ring-1 ring-[#3d2e24]"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                      }`}
                    >
                      <div className="font-mono font-bold text-[#3d2e24]">{tool.name}</div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {tool.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Args & Execution Output Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Arguments Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Tham số đầu vào (JSON arguments):
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">tools/call</span>
                  </div>
                  <textarea
                    rows={8}
                    value={mcpToolArgs}
                    onChange={(e) => setMcpToolArgs(e.target.value)}
                    className="w-full font-mono text-xs bg-slate-900 text-[#c8a98e] p-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#9e7656]"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleExecuteMcpTool}
                      disabled={mcpExecuting}
                      className="bg-[#b86b4b] hover:bg-[#e65c0d] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                    >
                      {mcpExecuting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang thực thi JSON-RPC...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>Thực thi Tool (JSON-RPC 2.0)</span>
                        </>
                      )}
                    </button>
                    {mcpLatency !== null && (
                      <span className="text-xs font-mono text-gray-500">
                        Độ trễ phản hồi: <b className="text-[#3d2e24]">{mcpLatency}ms</b>
                      </span>
                    )}
                  </div>
                </div>

                {/* Output Console */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Kết quả phản hồi JSON-RPC 2.0:
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        mcpStatus && !mcpStatus.succeeded ? "text-red-600" : "text-[#3d2e24]"
                      }`}
                    >
                      {mcpStatus
                        ? mcpStatus.succeeded
                          ? `Status ${mcpStatus.statusCode ?? 200} OK`
                          : mcpStatus.statusCode
                            ? `Status ${mcpStatus.statusCode} Error`
                            : "Request Failed"
                        : "Waiting for execute"}
                    </span>
                  </div>
                  <pre className="h-[210px] overflow-auto font-mono text-xs bg-slate-950 text-[#d4beaa] p-3 rounded-lg border border-slate-800 no-scrollbar">
                    {mcpResponse ||
                      "// Nhấn 'Thực thi Tool' để gửi yêu cầu JSON-RPC đến /api/mcp và xem dữ liệu thời gian thực..."}
                  </pre>
                </div>
              </div>
            </div>

            {/* SEO & Meta Viewer */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#3d2e24]" />
                  <h3 className="font-bold text-gray-900">SEO & Structured Data (JSON-LD) Audit</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href="/sitemap.xml"
                    target="_blank"
                    className="text-[#3d2e24] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>/sitemap.xml</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/robots.txt"
                    target="_blank"
                    className="text-[#3d2e24] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>/robots.txt</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* SEO Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#faf5f0]/60 p-4 rounded-xl border border-[#e6d5c5]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2a1f18]">Lighthouse SEO</span>
                    <span className="text-xl font-black text-[#3d2e24]">100 / 100</span>
                  </div>
                  <p className="text-[11px] text-[#3d2e24] mt-1">
                    Chuẩn hóa hoàn chỉnh thẻ Title, Meta Description, H1/H2 và canonical URL.
                  </p>
                </div>

                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-800">JSON-LD Schemas</span>
                    <span className="text-xl font-black text-blue-700">8 Thực thể</span>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-1">
                    Organization, Product, AggregateRating, BreadcrumbList.
                  </p>
                </div>

                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">OpenGraph & Twitter</span>
                    <span className="text-xl font-black text-amber-700">Đầy đủ</span>
                  </div>
                  <p className="text-[11px] text-amber-600 mt-1">
                    Tối ưu xem trước mạng xã hội với og:image và dynamic preview cards.
                  </p>
                </div>
              </div>

              {/* Routes Audit Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4">Route Path</th>
                      <th className="py-2.5 px-3">Tên Trang</th>
                      <th className="py-2.5 px-3 text-center">Điểm SEO</th>
                      <th className="py-2.5 px-3">JSON-LD Schemas</th>
                      <th className="py-2.5 px-3 text-center">OpenGraph Card</th>
                      <th className="py-2.5 px-4 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {DEFAULT_SEO_ROUTES.map((item) => (
                      <tr key={item.route} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-4 font-mono font-medium text-[#2a1f18]">
                          {item.route}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-bold text-[#3d2e24]">{item.score}%</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                          {item.schemaType}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.ogImage
                                ? "bg-[#f6ece3] text-[#3d2e24]"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.ogImage ? "Có og:image" : "Chưa có"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === "Pass"
                                ? "bg-[#f6ece3] text-[#2a1f18]"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM KHÁCH HÀNG MỚI                                               */}
      {/* ========================================================================= */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Tạo Hồ Sơ Khách Hàng Mới</h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
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
              className="space-y-3 mt-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Ví dụ: Lê Thị Thanh Thảo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    name="phone"
                    required
                    placeholder="0909123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Hạng thẻ ban đầu</label>
                  <select
                    name="tier"
                    defaultValue="Member"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Member">Member</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email liên hệ *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="thao.le@gmail.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Địa chỉ giao hàng</label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#3d2e24] hover:bg-[#1e1b18] text-white px-4 py-2 rounded-lg font-bold"
                >
                  Tạo Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ĐIỀU CHỈNH TỒN KHO                                               */}
      {/* ========================================================================= */}
      {selectedInventoryItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Điều Chỉnh Tồn Kho</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  SKU: {selectedInventoryItem.sku}
                </p>
              </div>
              <button
                onClick={() => setSelectedInventoryItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockAdjustment} className="space-y-3 mt-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-800">{selectedInventoryItem.productName}</p>
                <div className="flex items-center justify-between mt-2 text-gray-600">
                  <span>
                    Hiện có: <b>{selectedInventoryItem.totalStock} sp</b>
                  </span>
                  <span>
                    Khả dụng: <b>{selectedInventoryItem.availableStock} sp</b>
                  </span>
                  <span>
                    Ngưỡng báo: <b>{selectedInventoryItem.reorderPoint} sp</b>
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Số lượng thay đổi (dương là Nhập, âm là Xuất) *
                </label>
                <input
                  type="number"
                  required
                  value={stockAdjustDelta}
                  onChange={(e) => setStockAdjustDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white"
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
                <label className="block font-semibold text-gray-700 mb-1">
                  Lý do điều chỉnh (lưu vào Audit Trail) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={stockAdjustReason}
                  onChange={(e) => setStockAdjustReason(e.target.value)}
                  placeholder="Ghi rõ số hóa đơn nhập khẩu hoặc lý do xuất kho..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedInventoryItem(null)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#3d2e24] hover:bg-[#1e1b18] text-white px-4 py-2 rounded-lg font-bold"
                >
                  Xác Nhận Điều Chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT ĐƠN HÀNG                                                */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Chi Tiết Đơn Hàng {selectedOrder.orderCode}
                </h3>
                <p className="text-xs text-gray-500">
                  Đặt lúc: {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-500">Khách nhận:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-500">Điện thoại:</span>
                  <span className="text-gray-800">{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="font-semibold text-gray-500 shrink-0">Địa chỉ giao:</span>
                  <span className="text-gray-800 text-right">{selectedOrder.shippingAddress}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-amber-700">
                    <b>Ghi chú:</b> {selectedOrder.notes}
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-2">Danh sách sản phẩm trong đơn:</p>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                      <div>
                        <p className="font-bold text-gray-800">{item.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          SKU: {item.sku} • {item.brand}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatVND(item.price * item.quantity)}
                        </span>
                        <div className="text-[11px] text-gray-500">
                          {item.quantity} x {formatVND(item.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <p className="text-gray-500">Phương thức thanh toán:</p>
                  <p className="font-semibold text-gray-800">{selectedOrder.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Tổng thanh toán:</p>
                  <p className="text-base font-black text-[#b86b4b]">
                    {formatVND(selectedOrder.total)}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Nhân sự phụ trách:</span>
                  <span className="font-bold text-[#3d2e24]">
                    {selectedOrder.assignedStaffName || "Chưa gán"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AdminAccessDenied } from "./admin-access-denied";

