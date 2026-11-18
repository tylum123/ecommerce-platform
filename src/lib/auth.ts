/** Shared identity DTOs and presentation helpers. Server authentication is fail-closed until a maintained provider is configured. */

// ---------------------------------------------------------------------------
// 1. Types & Roles
// ---------------------------------------------------------------------------

export type AuthRole =
  | "admin"
  | "store_manager"
  | "warehouse_staff"
  | "clinic_doctor"
  | "cs_agent"
  | "customer";

export interface AuthSessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AuthRole;
  roleLabel: string;
  tier?: "Member" | "Silver" | "Gold" | "Diamond";
  loyaltyPoints?: number;
  employeeCode?: string;
  branchId?: string;
  branchName?: string;
  permissions?: string[];
  gender?: "Nam" | "Nữ" | "Khác";
  birthday?: string;
  address?: string;
  loggedInAt: string;
}

export interface SessionTokenPayload {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: AuthRole;
  roleLabel: string;
  tier?: "Member" | "Silver" | "Gold" | "Diamond";
  branchId?: string;
  branchName?: string;
  exp: number; // Unix timestamp in seconds
  iat: number; // Issued at in seconds
}

export const AUTH_COOKIE_NAME = "hasaki_session";
export const AUTH_STORAGE_KEY = "hasaki-auth-session";
export const AUTH_USERS_REGISTRY_KEY = "hasaki-registered-users";
export const AUTH_CHANGE_EVENT = "hasaki-auth-change";
export const AUTH_UNAVAILABLE_MESSAGE =
  "Chức năng đăng nhập, đăng ký và đặt lại mật khẩu hiện tạm thời chưa khả dụng.";
export const DEFAULT_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// ---------------------------------------------------------------------------
// 2. Demo Accounts (1-Click Login for Evaluation & Testing)
// ---------------------------------------------------------------------------

export const DEMO_AUTH_ACCOUNTS: Array<{
  username: string;
  passwordHint: string;
  label: string;
  badge: string;
  user: Omit<AuthSessionUser, "loggedInAt">;
}> = [
  {
    username: "admin@narihome.vn",
    passwordHint: "Nari@123",
    label: "Quản Trị Viên Cấp Cao (Admin)",
    badge: "Super Admin",
    user: {
      id: "usr-admin",
      fullName: "Trần Đình Khoa (Admin)",
      email: "admin@narihome.vn",
      phone: "0903112233",
      role: "admin",
      roleLabel: "Quản Trị Viên Hệ Thống",
      tier: "Diamond",
      loyaltyPoints: 5000,
      employeeCode: "NV-HSK-001",
      branchId: "CN1",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      permissions: [
        "users:read",
        "users:write",
        "staff:manage",
        "inventory:manage",
        "orders:manage",
        "finance:read",
        "system:config",
        "mcp:execute",
      ],
      address: "Trụ sở Nari Home, Quận Tân Bình, TP.HCM",
    },
  },
  {
    username: "quanly@narihome.vn",
    passwordHint: "Nari@123",
    label: "Quản Lý Cửa Hàng (Store Manager)",
    badge: "Quản lý cửa hàng",
    user: {
      id: "usr-store-manager",
      fullName: "Lê Hoàng Long (Quản Lý Cửa Hàng)",
      email: "quanly@narihome.vn",
      phone: "0903223344",
      role: "store_manager",
      roleLabel: "Quản Lý Cửa Hàng Nari Home",
      tier: "Gold",
      loyaltyPoints: 1500,
      employeeCode: "NV-HSK-002",
      branchId: "CN1",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      permissions: [
        "orders:read",
        "orders:write",
        "inventory:read",
        "staff:view",
        "reports:store",
      ],
      address: "Cửa hàng CN1 Hoàng Hoa Thám, TP.HCM",
    },
  },
  {
    username: "kho@narihome.vn",
    passwordHint: "Nari@123",
    label: "Quản Lý Kho Vận & NariNow 2H",
    badge: "Quản lý kho 2H",
    user: {
      id: "usr-warehouse",
      fullName: "Nguyễn Văn Thành (Quản Lý Kho)",
      email: "kho@narihome.vn",
      phone: "0903334455",
      role: "warehouse_staff",
      roleLabel: "Nhân Viên Quản Lý Kho",
      tier: "Gold",
      loyaltyPoints: 800,
      employeeCode: "NV-HSK-003",
      branchId: "CN1",
      branchName: "CN1 - 71 Hoàng Hoa Thám, Tân Bình",
      permissions: ["inventory:read", "inventory:write", "orders:pack", "shipping:dispatch"],
      address: "Kho Tổng Tân Bình, TP.HCM",
    },
  },
  {
    username: "bacsi@narihome.vn",
    passwordHint: "Nari@123",
    label: "Bác Sĩ Da Liễu Nari Clinic & Spa Q.10",
    badge: "Bác sĩ Clinic",
    user: {
      id: "usr-doctor",
      fullName: "BS. CKI Nguyễn Thị Mai",
      email: "bacsi@narihome.vn",
      phone: "0903445566",
      role: "clinic_doctor",
      roleLabel: "Bác Sĩ Da Liễu Nari Clinic & Spa",
      tier: "Diamond",
      loyaltyPoints: 1200,
      employeeCode: "NV-HSK-004",
      branchId: "CN2",
      branchName: "CN2 - 555 Đường 3/2, Quận 10",
      permissions: ["clinic:appointments", "clinic:treatments", "clinic:prescriptions", "users:read"],
      address: "Nari Clinic & Spa Quận 10, TP.HCM",
    },
  },
  {
    username: "cskh@narihome.vn",
    passwordHint: "Nari@123",
    label: "Chăm Sóc Khách Hàng (Tổng Đài CSKH)",
    badge: "CSKH Agent",
    user: {
      id: "usr-cskh",
      fullName: "Phạm Thu Hương (CSKH)",
      email: "cskh@narihome.vn",
      phone: "0903556677",
      role: "cs_agent",
      roleLabel: "Chuyên Viên CSKH Nari Home",
      tier: "Silver",
      loyaltyPoints: 500,
      employeeCode: "NV-HSK-005",
      branchId: "CN1",
      branchName: "Tổng đài CSKH 1800 6324",
      permissions: [
        "users:read",
        "orders:read",
        "clinic:appointments",
        "support:tickets",
      ],
      address: "Trung tâm CSKH Nari Home, TP.HCM",
    },
  },
  {
    username: "0901234567",
    passwordHint: "Nari@123",
    label: "Khách Hàng VIP Diamond (2.850 Điểm)",
    badge: "Khách hàng VIP",
    user: {
      id: "usr-customer-vip",
      fullName: "Nguyễn Minh Anh (VIP)",
      email: "khachhang@narihome.vn",
      phone: "0901234567",
      role: "customer",
      roleLabel: "Khách Hàng Thân Thiết",
      tier: "Diamond",
      loyaltyPoints: 2850,
      permissions: ["portal:profile", "portal:orders", "portal:bookings", "portal:address", "portal:rewards"],
      address: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
    },
  },
];

const STAFF_OR_ADMIN_ROLES = new Set<string>([
  "admin",
  "store_manager",
  "warehouse_staff",
  "clinic_doctor",
  "cs_agent",
]);

export function isStaffOrAdminRole(role?: string | null): boolean {
  return typeof role === "string" && STAFF_OR_ADMIN_ROLES.has(role);
}

/** Legacy token verification is intentionally disabled. Never trust self-signed
 * cookies or client role claims. Replace with a maintained server auth provider.
 */
export async function verifySignedSessionToken(
  _token: string,
): Promise<SessionTokenPayload | null> {
  void _token;
  return null;
}

// ---------------------------------------------------------------------------
// 4. Cookie Serialization Helpers
// ---------------------------------------------------------------------------

export function serializeSessionCookie(token: string, maxAge = DEFAULT_SESSION_MAX_AGE): string {
  const isProduction = process.env.NODE_ENV === "production";
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProduction ? "; Secure" : ""}`;
}

export function serializeClearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === "production";
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? "; Secure" : ""}`;
}

export function extractSessionTokenFromCookieHeader(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  try {
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Client Session State
// ---------------------------------------------------------------------------

let cachedClientSession: AuthSessionUser | null = null;

export function readAuthSession(): AuthSessionUser | null {
  if (typeof window === "undefined") return null;
  if (cachedClientSession) return cachedClientSession;

  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      cachedClientSession = JSON.parse(raw);
      return cachedClientSession;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

export function saveAuthSession(user: AuthSessionUser): void {
  if (typeof window === "undefined") return;
  cachedClientSession = user;
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage access fallback
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: user }));
}

export function clearAuthSession(): void {
  cachedClientSession = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage fallback
  }
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: null }));
}

export async function fetchCurrentSession(): Promise<AuthSessionUser | null> {
  try {
    const res = await fetch("/api/auth", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveAuthSession(data.user);
        return data.user;
      }
    }
    clearAuthSession();
    return null;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function readRegisteredLocalUsers(): AuthSessionUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_USERS_REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
