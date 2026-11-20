"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AUTH_CHANGE_EVENT, clearAuthSession } from "@/lib/auth";

export function SupabaseLoginForm({ redirectTo = "" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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

      setMessage(
        hasCatalog || hasStaff
          ? "Đã xác thực tài khoản. Bạn có thể mở cổng khách hàng hoặc màn hình quản trị bên dưới."
          : "Đăng nhập thành công! Mở Cổng Khách Hàng để xem tài khoản và đơn hàng của bạn.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể kết nối.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    initialCheck.current?.abort();
    setBusy(true);
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
      setMessage("Đã đăng xuất.");
      setAuthenticated(false);
      setCatalogAccess(false);
      setStaffPortalAccess(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể kết nối.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        Email
        <input
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border p-3"
          disabled={busy}
        />
      </label>
      <label className="block">
        Mật khẩu
        <input
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border p-3"
          disabled={busy}
        />
      </label>
      <button disabled={busy} className="rounded bg-[#3d2e24] px-5 py-3 text-white">
        {busy ? "Đang xử lý…" : "Đăng nhập"}
      </button>
      <button type="button" disabled={busy} onClick={logout} className="ml-3 underline">
        Đăng xuất
      </button>
      {message && <p role="status">{message}</p>}
      {authenticated && (
        <Link href="/khach-hang/tai-khoan" className="block underline">
          Mở cổng khách hàng (/khach-hang/tai-khoan)
        </Link>
      )}
      {(catalogAccess || staffPortalAccess) && (
        <Link href="/quan-tri" className="block underline">
          Mở cổng quản trị ERP (/quan-tri)
        </Link>
      )}
      {catalogAccess && (
        <Link href="/quan-tri/san-pham" className="block underline">
          Mở quản lý sản phẩm
        </Link>
      )}
      {staffPortalAccess && (
        <Link href="/nhan-vien" className="block underline">
          Mở cổng nhân viên
        </Link>
      )}
    </form>
  );
}
