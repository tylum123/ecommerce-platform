/** Fail closed until a maintained auth provider and persistent services are configured.
 * Client roles, cookies and bearer strings are deliberately not accepted as identity.
 */
export function authenticationRequired(): Response {
  return Response.json(
    {
      ok: false,
      success: false,
      code: "AUTHENTICATION_REQUIRED",
      error: "Chức năng tài khoản và quản trị tạm chưa sẵn sàng. Vui lòng thử lại sau.",
    },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function serviceUnavailable(): Response {
  return Response.json(
    {
      ok: false,
      success: false,
      code: "SERVICE_UNAVAILABLE",
      error: "Chức năng này tạm chưa sẵn sàng. Yêu cầu của bạn chưa được gửi hoặc lưu. Vui lòng thử lại sau.",
    },
    { status: 503, headers: { "Cache-Control": "private, no-store" } },
  );
}

export const PRIVATE_LOGIN_PATH = "/dang-nhap?reason=unavailable";
