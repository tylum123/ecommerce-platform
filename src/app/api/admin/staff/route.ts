import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { authenticationRequired } from "@/lib/server/access-policy";
import {
  listStaff,
  createStaff,
  updateStaff,
  type StaffRole,
  type StaffStatus,
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
  const role = (url.searchParams.get("role") as StaffRole) || undefined;
  const status = (url.searchParams.get("status") as StaffStatus) || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;

  const staff = listStaff({ search, role, status, branchId });

  return NextResponse.json({
    success: true,
    staff,
    total: staff.length,
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
    const newStaff = createStaff(body);

    return NextResponse.json({
      success: true,
      message: "Tạo nhân viên mới thành công",
      staff: newStaff,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tạo nhân viên" },
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
        { success: false, error: "Thiếu ID nhân viên cần cập nhật" },
        { status: 400 }
      );
    }

    const updated = updateStaff(id, patch);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy nhân viên với ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      staff: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi cập nhật nhân viên" },
      { status: 500 }
    );
  }
}
