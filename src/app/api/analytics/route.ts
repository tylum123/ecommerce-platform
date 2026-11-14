import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { getSqliteDb } from "@/lib/sqlite-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = extractSessionTokenFromCookieHeader(cookieHeader);
    const session = token ? await verifySignedSessionToken(token) : null;

    if (!session || !isStaffOrAdminRole(session.role)) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu quyền Quản trị viên hoặc Nhân viên để xem dữ liệu phân tích hệ thống" },
        { status: 401 }
      );
    }

    const db = getSqliteDb();

    // 1. Revenue and Orders Summary
    const ordersStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_orders,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'packing', 'shipping') THEN 1 ELSE 0 END), 0) as processing_orders,
        COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered_orders,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) as cancelled_orders
      FROM orders
    `).get() as {
      total_orders: number;
      total_revenue: number;
      pending_orders: number;
      processing_orders: number;
      delivered_orders: number;
      cancelled_orders: number;
    };

    // 2. Multi-Branch Inventory Health
    const invStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT sku) as total_skus,
        COALESCE(SUM(total_stock), 0) as grand_total_units,
        COALESCE(SUM(CASE WHEN total_stock = 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count,
        COALESCE(SUM(CASE WHEN total_stock > 0 AND total_stock <= reorder_point THEN 1 ELSE 0 END), 0) as low_stock_count
      FROM inventory_balances
    `).get() as {
      total_skus: number;
      grand_total_units: number;
      out_of_stock_count: number;
      low_stock_count: number;
    };

    // 3. Branch Performance
    const branchPerformance = db.prepare(`
      SELECT 
        b.id,
        b.name,
        b.supports_nowfree_2h,
        b.supports_clinic,
        COALESCE(SUM(ib.total_stock), 0) as current_stock,
        COUNT(DISTINCT o.id) as orders_count
      FROM branches b
      LEFT JOIN inventory_balances ib ON b.id = ib.branch_id
      LEFT JOIN orders o ON b.id = o.branch_id
      WHERE b.is_active = 1
      GROUP BY b.id, b.name, b.supports_nowfree_2h, b.supports_clinic
      ORDER BY b.id ASC
    `).all() as Array<{
      id: string;
      name: string;
      supports_nowfree_2h: number;
      supports_clinic: number;
      current_stock: number;
      orders_count: number;
    }>;

    // 4. Customer Demographics
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(CASE WHEN tier = 'Diamond' THEN 1 ELSE 0 END), 0) as diamond_users,
        COALESCE(SUM(CASE WHEN tier = 'Gold' THEN 1 ELSE 0 END), 0) as gold_users,
        COALESCE(SUM(CASE WHEN tier = 'Silver' THEN 1 ELSE 0 END), 0) as silver_users
      FROM users
      WHERE role = 'customer'
    `).get() as {
      total_users: number;
      diamond_users: number;
      gold_users: number;
      silver_users: number;
    };

    return NextResponse.json({
      success: true,
      analytics: {
        timestamp: new Date().toISOString(),
        user: {
          name: session.fullName,
          role: session.role,
        },
        orders: {
          totalOrders: ordersStats.total_orders,
          totalRevenue: ordersStats.total_revenue,
          pending: ordersStats.pending_orders,
          processing: ordersStats.processing_orders,
          delivered: ordersStats.delivered_orders,
          cancelled: ordersStats.cancelled_orders,
        },
        inventory: {
          totalSkus: invStats.total_skus,
          grandTotalUnits: invStats.grand_total_units,
          lowStockCount: invStats.low_stock_count,
          outOfStockCount: invStats.out_of_stock_count,
        },
        branches: branchPerformance.map((b) => ({
          id: b.id,
          name: b.name,
          supportsNowFree2H: b.supports_nowfree_2h === 1,
          supportsClinic: b.supports_clinic === 1,
          currentStock: b.current_stock,
          ordersCount: b.orders_count,
        })),
        customers: userStats,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tính toán chỉ số phân tích" },
      { status: 500 }
    );
  }
}
