"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { clearAuthSession } from "@/lib/auth";

export function SupabaseLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [catalogAccess, setCatalogAccess] = useState(false);
  const [staffPortalAccess, setStaffPortalAccess] = useState(false);
  const initialCheck = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    initialCheck.current = controller;
    fetch("/api/session", { cache: "no-store", signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (controller.signal.aborted) return;
      setCatalogAccess(data.ok === true && data.catalogAccess === true);
      setStaffPortalAccess(data.ok === true && data.staffPortalAccess === true);
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    initialCheck.current?.abort();
    setBusy(true); setMessage(""); setCatalogAccess(false); setStaffPortalAccess(false);
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(typeof data.error === "string" ? data.error : "Đăng nhập chưa khả dụng.");
      clearAuthSession();
      setPassword("");
      setCatalogAccess(data.catalogAccess === true);
      setStaffPortalAccess(data.staffPortalAccess === true);
      setMessage(data.catalogAccess === true || data.staffPortalAccess === true ? "Đã xác thực tài khoản. Mở màn hình được cấp quyền bên dưới." : "Đã xác thực tài khoản. Tài khoản chưa được cấp quyền mở màn hình nội bộ.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể kết nối."); }
    finally { setBusy(false); }
  }
  async function logout() {
    initialCheck.current?.abort();
    setBusy(true);
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("Chưa thể đăng xuất. Vui lòng thử lại.");
      clearAuthSession();
      setPassword("");
      setMessage("Đã đăng xuất.");
      setCatalogAccess(false);
      setStaffPortalAccess(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể kết nối."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <label className="block">Email<input type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded border p-3" disabled={busy} /></label>
    <label className="block">Mật khẩu<input type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded border p-3" disabled={busy} /></label>
    <button disabled={busy} className="rounded bg-[#3d2e24] px-5 py-3 text-white">{busy ? "Đang xử lý…" : "Đăng nhập"}</button>
    <button type="button" disabled={busy} onClick={logout} className="ml-3 underline">Đăng xuất</button>
    {message && <p role="status">{message}</p>}
    {catalogAccess && <Link href="/quan-tri/san-pham" className="block underline">Mở quản lý sản phẩm</Link>}
    {staffPortalAccess && <Link href="/nhan-vien" className="block underline">Mở cổng nhân viên</Link>}
  </form>;
}
