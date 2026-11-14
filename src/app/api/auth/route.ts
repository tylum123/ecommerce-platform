import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createSignedSessionToken,
  verifySignedSessionToken,
  serializeSessionCookie,
  serializeClearSessionCookie,
  extractSessionTokenFromCookieHeader,
  DEMO_AUTH_ACCOUNTS,
  type AuthSessionUser,
} from "@/lib/auth";
import { getSqliteDb } from "@/lib/sqlite-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);

  if (!token) {
    return NextResponse.json({ success: false, user: null });
  }

  const payload = await verifySignedSessionToken(token);
  if (!payload) {
    // Clear invalid or expired cookie
    const res = NextResponse.json({ success: false, user: null });
    res.headers.set("Set-Cookie", serializeClearSessionCookie());
    return res;
  }

  const user: AuthSessionUser = {
    id: payload.id,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    roleLabel: payload.roleLabel,
    tier: payload.tier || "Member",
    branchId: payload.branchId,
    branchName: payload.branchName,
    loggedInAt: new Date(payload.iat * 1000).toISOString(),
  };

  return NextResponse.json({ success: true, user });
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const action = url.searchParams.get("action") || body.action || "login";

    // 1. ACTION: LOGOUT
    if (action === "logout") {
      const response = NextResponse.json({ success: true, message: "Đăng xuất thành công" });
      response.headers.set("Set-Cookie", serializeClearSessionCookie());
      return response;
    }

    // 2. ACTION: LOGIN
    if (action === "login") {
      const username = (body.username || body.email || body.phone || "").trim();
      const password = (body.password || "").trim();

      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập số điện thoại/email và mật khẩu" },
          { status: 400 }
        );
      }

      // Check 1-Click Demo Accounts
      const demoAccount = DEMO_AUTH_ACCOUNTS.find(
        (acc) =>
          acc.username.toLowerCase() === username.toLowerCase() ||
          acc.user.phone === username ||
          acc.user.email.toLowerCase() === username.toLowerCase()
      );

      if (demoAccount) {
        if (password === demoAccount.passwordHint || password === "Hasaki@123") {
          const user: AuthSessionUser = {
            ...demoAccount.user,
            loggedInAt: new Date().toISOString(),
          };

          const token = await createSignedSessionToken({
            id: user.id,
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            role: user.role,
            roleLabel: user.roleLabel,
            tier: user.tier,
            branchId: user.branchId,
            branchName: user.branchName,
          });

          const response = NextResponse.json({ success: true, user });
          response.headers.set("Set-Cookie", serializeSessionCookie(token));
          return response;
        } else {
          return NextResponse.json(
            { success: false, error: "Mật khẩu không chính xác. Mật khẩu demo là: Hasaki@123" },
            { status: 401 }
          );
        }
      }

      // Check database users table
      const db = getSqliteDb();
      const dbUser = db.prepare(`
        SELECT * FROM users
        WHERE (phone = ? OR email = ?) AND status = 'active'
        LIMIT 1
      `).get(username, username) as {
        id: string;
        email: string | null;
        phone: string;
        password_hash: string;
        salt: string;
        full_name: string;
        role: "admin" | "store_manager" | "warehouse_staff" | "clinic_doctor" | "cs_agent" | "customer";
        role_label: string | null;
        tier: "Member" | "Silver" | "Gold" | "Diamond";
        loyalty_points: number;
        branch_id: string | null;
      } | undefined;

      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "Tài khoản không tồn tại hoặc đã bị khóa" },
          { status: 401 }
        );
      }

      const user: AuthSessionUser = {
        id: dbUser.id,
        fullName: dbUser.full_name,
        email: dbUser.email || "",
        phone: dbUser.phone,
        role: dbUser.role,
        roleLabel: dbUser.role_label || (dbUser.role === "customer" ? "Khách Hàng" : "Nhân Viên Hasaki"),
        tier: dbUser.tier,
        loyaltyPoints: dbUser.loyalty_points,
        branchId: dbUser.branch_id || undefined,
        loggedInAt: new Date().toISOString(),
      };

      const token = await createSignedSessionToken({
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        roleLabel: user.roleLabel,
        tier: user.tier,
        branchId: user.branchId,
      });

      const response = NextResponse.json({ success: true, user });
      response.headers.set("Set-Cookie", serializeSessionCookie(token));
      return response;
    }

    // 3. ACTION: REGISTER
    if (action === "register") {
      const fullName = (body.fullName || body.name || "").trim();
      const phone = (body.phone || "").trim();
      const email = (body.email || "").trim() || null;
      const password = (body.password || "").trim();

      if (!fullName || !phone || !password) {
        return NextResponse.json(
          { success: false, error: "Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu" },
          { status: 400 }
        );
      }

      if (phone.length < 10) {
        return NextResponse.json(
          { success: false, error: "Số điện thoại không hợp lệ (tối thiểu 10 chữ số)" },
          { status: 400 }
        );
      }

      const db = getSqliteDb();

      // Check if user already exists
      const existing = db.prepare("SELECT id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)").get(phone, email || "");
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Số điện thoại hoặc email đã được đăng ký trước đó" },
          { status: 409 }
        );
      }

      const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();

      // Store in users table
      db.prepare(`
        INSERT INTO users (id, email, phone, password_hash, salt, full_name, role, role_label, tier, loyalty_points, total_spent, orders_count, status, is_seed, created_at)
        VALUES (?, ?, ?, 'sha256_mock_hash', 'salt', ?, 'customer', 'Khách Hàng Thành Viên', 'Member', 50, 0, 0, 'active', 0, ?)
      `).run(userId, email, phone, fullName, now);

      const user: AuthSessionUser = {
        id: userId,
        fullName,
        email: email || "",
        phone,
        role: "customer",
        roleLabel: "Khách Hàng Thành Viên",
        tier: "Member",
        loyaltyPoints: 50, // Welcome points bonus
        loggedInAt: now,
      };

      const token = await createSignedSessionToken({
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        roleLabel: user.roleLabel,
        tier: user.tier,
      });

      const response = NextResponse.json({ success: true, user, message: "Đăng ký tài khoản thành công!" });
      response.headers.set("Set-Cookie", serializeSessionCookie(token));
      return response;
    }

    return NextResponse.json({ success: false, error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi xử lý xác thực" },
      { status: 500 }
    );
  }
}
