/**
 * Centralized White-Label Brand Configuration & Dynamic Token System.
 *
 * Change the environment variables (`NEXT_PUBLIC_BRAND_*`) or default values here
 * to configure the E-Commerce platform in one place.
 */

export interface BrandConfig {
  /** Full brand name, e.g. "Nari Home" */
  name: string;
  /** Short brand token, e.g. "Nari" */
  shortName: string;
  /** Uppercase short token, e.g. "NARI" */
  upperShortName: string;
  /** Uppercase full name, e.g. "NARI HOME" */
  upperName: string;
  /** Brand slogan / tagline */
  slogan: string;
  /** Display domain, e.g. "narihome.vn" */
  domain: string;
  /** Legal company title */
  companyName: string;
  /** Flash deal program name, e.g. "Nari Deals" */
  dealsLabel: string;
  /** Uppercase flash deal program name, e.g. "NARI DEALS" */
  dealsUpper: string;
  /** Express delivery service name, e.g. "NariNow 2H" */
  deliveryName: string;
  /** Loyalty program name, e.g. "Nari Rewards" */
  loyaltyName: string;
  /** Customer care hotline */
  hotline: string;
  /** Support email */
  supportEmail: string;
  /** Staff/Admin email domain */
  emailDomain: string;
  /** Order code prefix */
  orderPrefix: string;
  /** Hero main brand banner */
  heroBannerUrl: string;
}

const MOJIBAKE_PATTERN = /Ã[\u0080-\u00bf\u2018-\u203a\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc]|Â[\u0080-\u00bf]|Æ[¡°]|Ä‘|á[º»]/;

/**
 * Sanitize environment-supplied brand copy and fall back if empty or double-encoded.
 */
export function sanitizeBrandString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed || MOJIBAKE_PATTERN.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

const shortName = sanitizeBrandString(process.env.NEXT_PUBLIC_BRAND_SHORT, "Nari");
const fullName = sanitizeBrandString(process.env.NEXT_PUBLIC_BRAND_NAME, `${shortName} Home`);
const emailDomain = process.env.NEXT_PUBLIC_BRAND_EMAIL_DOMAIN?.trim() || "narihome.io.vn";

export const BRAND_CONFIG: BrandConfig = {
  name: fullName,
  shortName,
  upperShortName: shortName.toUpperCase(),
  upperName: fullName.toUpperCase(),
  slogan: sanitizeBrandString(
    process.env.NEXT_PUBLIC_BRAND_SLOGAN,
    "Khơi nguồn vẻ đẹp - Kiến tạo khí chất",
  ),
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN?.trim() || emailDomain,
  companyName: sanitizeBrandString(
    process.env.NEXT_PUBLIC_BRAND_COMPANY,
    `CÔNG TY CỔ PHẦN MỸ PHẨM ${fullName.toUpperCase()}`,
  ),
  dealsLabel:
    process.env.NEXT_PUBLIC_BRAND_DEALS?.trim() || `${shortName} Deals`,
  dealsUpper:
    process.env.NEXT_PUBLIC_BRAND_DEALS_UPPER?.trim() ||
    `${shortName.toUpperCase()} DEALS`,
  deliveryName:
    process.env.NEXT_PUBLIC_BRAND_DELIVERY?.trim() || `${shortName}Now 2H`,
  loyaltyName:
    process.env.NEXT_PUBLIC_BRAND_LOYALTY?.trim() || `${shortName} Rewards`,
  hotline: process.env.NEXT_PUBLIC_BRAND_HOTLINE?.trim() || "1800 6324",
  supportEmail:
    process.env.NEXT_PUBLIC_BRAND_EMAIL?.trim() || `cskh@${emailDomain}`,
  emailDomain,
  orderPrefix:
    process.env.NEXT_PUBLIC_BRAND_ORDER_PREFIX?.trim() ||
    shortName.toUpperCase(),
  heroBannerUrl:
    process.env.NEXT_PUBLIC_BRAND_BANNER?.trim() || "/nari-home-banner.jpg",
};

/**
 * Identity/trimming helper for display text.
 */
export function brandText(input: string): string {
  if (!input || typeof input !== "string") return input;
  return input.trim();
}

/**
 * Identity helper preserving typed data structures.
 */
export function brandDeep<T>(data: T): T {
  return data;
}
