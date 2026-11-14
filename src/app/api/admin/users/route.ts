import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { authenticationRequired } from "@/lib/server/access-policy";
import {
  listUsers,
  createUser,
  updateUser,
  type UserTier,
  type UserStatus,
} from "@/lib/server/erp-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const tier = (url.searchParams.get("tier") as UserTier) || undefined;
  const status = (url.searchParams.get("status") as UserStatus) || undefined;

  const users = listUsers({ search, tier, status });

  return NextResponse.json({
    success: true,
    users,
    total: users.length,
  });
}

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  try {
    const body = await request.json();
    const newUser = createUser(body);

    return NextResponse.json({
      success: true,
      message: "Tạo khách hàng mới thành công",
      user: newUser,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tạo khách hàng" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  try {
    const body = await request.json();
    const { id, ...patch } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID khách hàng cần cập nhật" },
        { status: 400 }
      );
    }

    const updated = updateUser(id, patch);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy khách hàng với ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật hồ sơ khách hàng thành công",
      user: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi cập nhật khách hàng" },
      { status: 500 }
    );
  }
}
