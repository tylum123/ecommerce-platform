"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Store,
  Truck,
  Stethoscope,
  Headphones,
  UserRound,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  saveAuthSession,
  clearAuthSession,
  DEMO_AUTH_ACCOUNTS,
  type AuthSessionUser,
} from "@/lib/auth";

interface AdminAccessDeniedProps {
  user: AuthSessionUser;
}

export function AdminAccessDenied({ user }: AdminAccessDeniedProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleSwitchRole = async (acc: (typeof DEMO_AUTH_ACCOUNTS)[number]) => {
    setSwitchError(null);
    setSwitchingTo(acc.badge);

    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: acc.username,
          password: acc.passwordHint,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSwitchError(data.error || "Không thể chuyển vai trò");
        setSwitchingTo(null);
        return;
      }

      saveAuthSession(data.user);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSwitchError("Lỗi kết nối khi chuyển đổi vai trò");
      setSwitchingTo(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth?action=logout", { method: "POST" });
    } catch {
      // Ignore
    }
    clearAuthSession();
    startTransition(() => {
      router.push("/dang-nhap?redirect=/quan-tri");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-gray-900 pb-16">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-lg font-black tracking-wider text-[#3d2e24] hover:opacity-90"
            >
              NARI HOME
            </Link>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs font-semibold text-gray-600">
              Cổng Quản Trị ERP (RBAC Policy)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/khach-hang/tai-khoan"
              className="flex items-center gap-1 font-semibold text-[#3d2e24] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" /> Về cổng khách hàng
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1 text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Alert Container */}
      <main className="mx-auto max-w-4xl px-4 pt-10">
        {/* Banner Alert */}
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">
                  Từ chối truy cập: Tài khoản không có quyền xem Quản Trị ERP
                </h1>
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                  403 Forbidden
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                Bạn đang đăng nhập với vai trò <b>{user.roleLabel}</b> (<code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{user.role}</code>).
                Khu vực Quản trị ERP (<code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">/quan-tri</code>)
                được bảo vệ nghiêm ngặt và chỉ cho phép nhân viên vận hành, quản lý chi nhánh, bác sĩ hoặc quản trị viên cấp cao.
              </p>

              {/* Current User Pill */}
              <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-amber-200 bg-white/90 px-3.5 py-2 text-xs">
                <UserRound className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  Tài khoản: <b>{user.fullName}</b> ({user.phone || user.email})
                </span>
                <span className="rounded bg-[#f6ece3] px-2 py-0.5 font-semibold text-[#2a1f18]">
                  {user.tier || "VIP Customer"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {switchError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{switchError}</span>
          </div>
        )}

        {/* 1-Click Quick Demo Role Switcher */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#3d2e24]" />
              <h2 className="text-base font-bold text-gray-900">
                Chuyển đổi vai trò kiểm thử 1-Click (Demo Switcher)
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              Click vào tài khoản nhân sự để truy cập ngay /quan-tri
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-600">
            Dành cho nhà phát triển & hội đồng kiểm thử: Chọn một trong các vai trò nhân sự hợp lệ bên dưới để tự động cấp token signed HMAC-SHA256 và mở khóa hệ thống ERP:
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO_AUTH_ACCOUNTS.filter((acc) => acc.user.role !== "customer").map((acc) => {
              const isAdmin = acc.user.role === "admin";
              const isManager = acc.user.role === "store_manager";
              const isWarehouse = acc.user.role === "warehouse_staff";
              const isDoctor = acc.user.role === "clinic_doctor";

              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleSwitchRole(acc)}
                  disabled={isPending}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 text-left transition hover:border-[#3d2e24] hover:bg-[#faf5f0]/80 hover:shadow-sm"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                      isAdmin
                        ? "bg-purple-600"
                        : isManager
                          ? "bg-blue-600"
                          : isWarehouse
                            ? "bg-orange-600"
                            : isDoctor
                              ? "bg-[#3d2e24]"
                              : "bg-teal-600"
                    }`}
                  >
                    {isAdmin ? (
                      <Crown className="h-5 w-5" />
                    ) : isManager ? (
                      <Store className="h-5 w-5" />
                    ) : isWarehouse ? (
                      <Truck className="h-5 w-5" />
                    ) : isDoctor ? (
                      <Stethoscope className="h-5 w-5" />
                    ) : (
                      <Headphones className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs font-bold text-gray-900">{acc.badge}</p>
                      <ArrowRight className="h-3 w-3 text-[#3d2e24]" />
                    </div>
                    <p className="truncate text-[11px] font-medium text-gray-700 mt-0.5">
                      {acc.user.fullName}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">{acc.username}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {switchingTo && (
            <p className="mt-3 text-xs text-center font-semibold text-[#3d2e24]">
              Đang chuyển sang vai trò {switchingTo}...
            </p>
          )}
        </div>

        {/* Role Permission Matrix Table */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-[#3d2e24]" />
            <h2 className="text-base font-bold text-gray-900">
              Bảng Phân Quyền Tuyến Đường (Route Authorization Matrix)
            </h2>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <th className="py-2.5 px-3 font-bold">Vai trò (Role)</th>
                  <th className="py-2.5 px-3 font-bold">Mã hệ thống</th>
                  <th className="py-2.5 px-3 font-bold">Cổng Khách Hàng (/khach-hang/*)</th>
                  <th className="py-2.5 px-3 font-bold">Quản Trị ERP (/quan-tri)</th>
                  <th className="py-2.5 px-3 font-bold">Phạm vi dữ liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-purple-900 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-purple-600" /> Super Admin
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">admin</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Toàn quyền cấu hình & MCP
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Toàn quốc (CN1, CN2, CN15, CN28)</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-blue-600" /> Quản lý cửa hàng
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">store_manager</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Đơn hàng, nhân sự, tồn kho
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Chi nhánh phân bổ</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-orange-900 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-orange-600" /> Quản lý kho 2H
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">warehouse_staff</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Tồn kho & Điều phối NariNow 2H
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Kho tổng & trung chuyển</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-[#1e1b18] flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-[#3d2e24]" /> Bác sĩ Clinic
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">clinic_doctor</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Lịch khám & Hồ sơ điều trị
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Phòng khám Nari Clinic & Spa Q10</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-teal-900 flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-teal-600" /> CSKH Tổng Đài
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">cs_agent</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Tra cứu đơn & Hỗ trợ bảo hành
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Toàn quốc (Kênh tổng đài 1800 6324)</td>
                </tr>

                <tr className="bg-amber-50/60 font-medium">
                  <td className="py-2.5 px-3 font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Khách hàng (Bạn)
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-amber-800">customer</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Cho phép toàn bộ
                  </td>
                  <td className="py-2.5 px-3 text-red-600 font-bold flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-red-500" /> Từ chối (Role Forbidden)
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Tài khoản & đơn mua cá nhân</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/khach-hang/tai-khoan"
            className="flex items-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#25553e]"
          >
            <UserRound className="h-4 w-4" />
            Về Cổng Khách Hàng Cá Nhân
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Về Trang Chủ Mua Sắm
          </Link>
        </div>
      </main>
    </div>
  );
}
