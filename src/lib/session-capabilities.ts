export interface SessionCapabilities {
  authenticated: boolean;
  catalogAccess: boolean;
  staffPortalAccess: boolean;
}
export const CLOSED_SESSION_CAPABILITIES: SessionCapabilities = { authenticated: false, catalogAccess: false, staffPortalAccess: false };

/** Display hints from the verified session endpoint only; pages/APIs authorize independently. */
export async function fetchSessionCapabilities(): Promise<SessionCapabilities> {
  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    const data: unknown = await response.json();
    if (!response.ok || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true || !("user" in data) || !data.user || typeof data.user !== "object" || !("id" in data.user) || typeof data.user.id !== "string") return { ...CLOSED_SESSION_CAPABILITIES };
    return { authenticated: true, catalogAccess: "catalogAccess" in data && data.catalogAccess === true, staffPortalAccess: "staffPortalAccess" in data && data.staffPortalAccess === true };
  } catch { return { ...CLOSED_SESSION_CAPABILITIES }; }
}

export async function logoutProviderSession(): Promise<void> {
  const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
  const data: unknown = await response.json();
  if (!response.ok || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true) throw new Error("Chưa thể đăng xuất. Vui lòng thử lại.");
}
