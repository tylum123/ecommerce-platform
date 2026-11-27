"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Package,
  UserRound,
} from "lucide-react";
import { AUTH_CHANGE_EVENT, clearAuthSession } from "@/lib/auth";

export function SupabaseLoginForm({ redirectTo = "" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"status" | "error">("status");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [catalogAccess, setCatalogAccess] = useState(false);
  const [staffPortalAccess, setStaffPortalAccess] = useState(false);
  const initialCheck = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    initialCheck.current = controller;
    fetch("/api/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (controller.signal.aborted) return;
        setAuthenticated(data.ok === true && Boolean(data.user?.id));
        setCatalogAccess(data.ok === true && data.catalogAccess === true);
        setStaffPortalAccess(data.ok === true && data.staffPortalAccess === true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    initialCheck.current?.abort();
    setBusy(true);
    setMessage("");
    setMessageTone("status");
    setAuthenticated(false);
    setCatalogAccess(false);
    setStaffPortalAccess(false);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Đăng nhập chưa khả dụng.");
      }
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      setPassword("");
      setAuthenticated(true);
      const hasCatalog = data.catalogAccess === true;
      const hasStaff = data.staffPortalAccess === true;
      setCatalogAccess(hasCatalog);
      setStaffPortalAccess(hasStaff);

      if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setMessageTone("status");
      setMessage(
        hasCatalog || hasStaff
          ? "Đã xác thực tài khoản. Bạn có thể mở cổng khách hàng hoặc màn hình quản trị bên dưới."
          : "Đăng nhập thành công! Mở Cổng Khách Hàng để xem tài khoản và đơn hàng của bạn.",
      );
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Không thể kết nối.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    initialCheck.current?.abort();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Chưa thể đăng xuất. Vui lòng thử lại.");
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      setPassword("");
      setMessageTone("status");
      setMessage("Đã đăng xuất.");
      setAuthenticated(false);
      setCatalogAccess(false);
      setStaffPortalAccess(false);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Không thể kết nối.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {message &&
        (messageTone === "error" ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        ) : (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-sm text-emerald-900"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{message}</span>
          </div>
        ))}

      {authenticated ? (
        <div className="rounded-xl border border-[#e6d5c5] bg-[#faf5f0] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6d5c5]/80 pb-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#3d2e24]">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Phiên đăng nhập đang hoạt động</span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6d5c5] bg-white px-3 py-1.5 text-xs font-medium text-[#3d2e24] transition-colors hover:border-[#9e7656] hover:bg-[#f6ece3] disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>Đăng xuất</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Link
              href="/khach-hang/tai-khoan"
              className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition-all hover:border-[#9e7656] hover:bg-[#fdfaf7]"
            >
              <span className="flex items-center gap-2.5">
                <UserRound className="h-4 w-4 text-[#b86b4b]" aria-hidden="true" />
                <span>Cổng khách hàng</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#9e7656] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>

            {(catalogAccess || staffPortalAccess) && (
              <Link
                href="/quan-tri"
                className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition-all hover:border-[#9e7656] hover:bg-[#fdfaf7]"
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4 text-[#b86b4b]" aria-hidden="true" />
                  <span>Cổng quản trị ERP</span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#9e7656] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}

            {catalogAccess && (
              <Link
                href="/quan-tri/san-pham"
                className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition-all hover:border-[#9e7656] hover:bg-[#fdfaf7]"
              >
                <span className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-[#b86b4b]" aria-hidden="true" />
                  <span>Quản lý sản phẩm</span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#9e7656] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}

            {staffPortalAccess && (
              <Link
                href="/nhan-vien"
                className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition-all hover:border-[#9e7656] hover:bg-[#fdfaf7]"
              >
                <span className="flex items-center gap-2.5">
                  <BriefcaseBusiness className="h-4 w-4 text-[#b86b4b]" aria-hidden="true" />
                  <span>Cổng nhân viên</span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#9e7656] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@email.com"
                disabled={busy}
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                disabled={busy}
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-11 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={busy}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6e5a4f] transition-colors hover:text-[#3d2e24] disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-semibold text-[#faf5f0] transition-colors hover:bg-[#2a1f18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{busy ? "Đang xử lý…" : "Đăng nhập"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
