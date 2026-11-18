import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { AuthSessionUser } from "@/lib/auth";
import { canAccessBranch, hasPermission } from "@/lib/server/access-policy";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import {
  createIdentityRoleRepository,
  hasTrustedMutationOrigin,
  resolveSupabasePrincipal,
} from "@/lib/server/supabase-principal";
import {
  createSupabaseSession,
  readSupabaseSessionConfig,
  sessionResponse,
} from "@/lib/server/supabase-session";

export interface BusinessAccessOptions {
  flagEnv: string;
  permission?: string;
  requireOrigin?: boolean;
  branchId?: string | null;
}

export type BusinessAccessResult =
  | {
      user: AuthSessionUser;
      template: NextResponse;
      response: null;
      canAccessBranch: (branchId: string | null | undefined) => boolean;
    }
  | {
      user: null;
      template: NextResponse;
      response: NextResponse;
      canAccessBranch: (branchId: string | null | undefined) => false;
    };

/** Fail-closed server authorization boundary for business API routes. */
export async function authorizeBusinessRequest(
  request: NextRequest,
  options: BusinessAccessOptions,
): Promise<BusinessAccessResult> {
  let template = NextResponse.json({});
  const closedBranch = () => false as const;

  try {
    if (!options.flagEnv || process.env[options.flagEnv] !== "true") {
      throw new Error("BUSINESS_ACCESS_DISABLED");
    }

    const config = readSupabaseSessionConfig();
    const database = getPostgresDatabase();

    const mustCheckOrigin =
      options.requireOrigin ?? !["GET", "HEAD"].includes(request.method.toUpperCase());
    if (mustCheckOrigin && !hasTrustedMutationOrigin(request, config.origin)) {
      return {
        user: null,
        template,
        response: sessionResponse(
          template,
          { ok: false, success: false, code: "INVALID_ORIGIN", error: "Yêu cầu không hợp lệ." },
          403,
        ),
        canAccessBranch: closedBranch,
      };
    }

    const session = createSupabaseSession(request, config);
    template = session.response;

    const user = await resolveSupabasePrincipal(
      session.client.auth,
      createIdentityRoleRepository(database),
    );
    if (!user) {
      return {
        user: null,
        template,
        response: sessionResponse(
          template,
          {
            ok: false,
            success: false,
            code: "AUTHENTICATION_REQUIRED",
            error: "Vui lòng đăng nhập bằng tài khoản được cấp quyền.",
          },
          401,
        ),
        canAccessBranch: closedBranch,
      };
    }

    if (options.permission && !hasPermission(user, options.permission)) {
      return {
        user: null,
        template,
        response: sessionResponse(
          template,
          {
            ok: false,
            success: false,
            code: "PERMISSION_DENIED",
            error: "Bạn không có quyền thực hiện thao tác này.",
          },
          403,
        ),
        canAccessBranch: closedBranch,
      };
    }

    if (options.branchId !== undefined && !canAccessBranch(user, options.branchId)) {
      return {
        user: null,
        template,
        response: sessionResponse(
          template,
          {
            ok: false,
            success: false,
            code: "PERMISSION_DENIED",
            error: "Bạn không có quyền truy cập chi nhánh này.",
          },
          403,
        ),
        canAccessBranch: closedBranch,
      };
    }

    return {
      user,
      template,
      response: null,
      canAccessBranch: (branchId) => canAccessBranch(user, branchId),
    };
  } catch {
    return {
      user: null,
      template,
      response: sessionResponse(
        template,
        {
          ok: false,
          success: false,
          code: "SERVICE_UNAVAILABLE",
          error: "Chức năng này tạm chưa khả dụng. Vui lòng thử lại sau.",
        },
        503,
      ),
      canAccessBranch: closedBranch,
    };
  }
}

export { canAccessBranch, hasPermission };
