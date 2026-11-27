"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Store,
  Truck,
  Headphones,
  UserRound,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  LogOut,
} from "lucide-react";
import { clearAuthSession, type AuthSessionUser } from "@/lib/auth";
import { logoutProviderSession } from "@/lib/session-capabilities";

interface AdminAccessDeniedProps {
  user: AuthSessionUser;
}

export function AdminAccessDenied({ user }: AdminAccessDeniedProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    try {
      await logoutProviderSession();
    } catch {
      // Ignore if session already expired
    }
    clearAuthSession();
    startTransition(() => {
      router.push("/dang-nhap?redirect=/quan-tri");
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-gray-900 pb-16">
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
              disabled={isPending}
              onClick={handleLogout}
              className="flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-10">
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
                Bạn đang đăng nhập với vai trò <b>{user.roleLabel}</b> (
                <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{user.role}</code>).
                Khu vực Quản trị ERP (<code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">/quan-tri</code>)
                được bảo vệ theo <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">nari_identity.provisioned_identities</code>{" "}
                và chỉ cho phép nhân sự được cấp quyền truy cập.
              </p>

              <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-amber-200 bg-white/90 px-3.5 py-2 text-xs">
                <UserRound className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  Tài khoản: <b>{user.fullName}</b> ({user.email || user.phone})
                </span>
              </div>
            </div>
          </div>
        </div>

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
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cho phép</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Toàn quyền vận hành & danh mục
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Toàn hệ thống</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-blue-900 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-blue-600" /> Quản lý cửa hàng
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">store_manager</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cho phép</span>
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
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cho phép</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Tồn kho & Đóng gói NariNow 2H
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Chi nhánh phân bổ</td>
                </tr>

                <tr className="hover:bg-gray-50/60">
                  <td className="py-2.5 px-3 font-bold text-teal-900 flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-teal-600" /> CSKH Tổng Đài
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">cs_agent</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cho phép</span>
                  </td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="rounded bg-[#f6ece3] px-2 py-0.5 text-[#2a1f18]">
                      Tra cứu đơn & Hỗ trợ khách hàng
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Chi nhánh phân bổ</td>
                </tr>

                <tr className="bg-amber-50/60 font-medium">
                  <td className="py-2.5 px-3 font-bold text-amber-900 flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-amber-600" /> Khách hàng
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-amber-800">customer</td>
                  <td className="py-2.5 px-3 text-[#3d2e24] font-semibold">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Cho phép toàn bộ</span>
                  </td>
                  <td className="py-2.5 px-3 text-red-600 font-bold">
                    <span className="inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" /> Từ chối (403 Forbidden)</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">Tài khoản & đơn mua cá nhân</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/khach-hang/tai-khoan"
            className="flex items-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#1e1b18]"
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
