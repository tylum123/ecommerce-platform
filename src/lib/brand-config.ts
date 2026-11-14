/**
 * Centralized White-Label Brand Configuration & Dynamic Token System.
 *
 * Change the environment variables (`NEXT_PUBLIC_BRAND_*`) or default values here
 * to rebrand the entire E-Commerce & Clinic platform in one place.
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
  /** Clinic & Spa division name, e.g. "Nari Clinic & Spa" */
  clinicName: string;
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

const shortName = process.env.NEXT_PUBLIC_BRAND_SHORT?.trim() || "Nari";
const fullName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || `${shortName} Home`;
const emailDomain = process.env.NEXT_PUBLIC_BRAND_EMAIL_DOMAIN?.trim() || "narihome.vn";

export const BRAND_CONFIG: BrandConfig = {
  name: fullName,
  shortName,
  upperShortName: shortName.toUpperCase(),
  upperName: fullName.toUpperCase(),
  slogan:
    process.env.NEXT_PUBLIC_BRAND_SLOGAN?.trim() ||
    "Khơi nguồn vẻ đẹp - Kiến tạo khí chất",
  domain: process.env.NEXT_PUBLIC_BRAND_DOMAIN?.trim() || emailDomain,
  companyName:
    process.env.NEXT_PUBLIC_BRAND_COMPANY?.trim() ||
    `CÔNG TY CỔ PHẦN ${fullName.toUpperCase()} BEAUTY & CLINIC`,
  dealsLabel:
    process.env.NEXT_PUBLIC_BRAND_DEALS?.trim() || `${shortName} Deals`,
  dealsUpper:
    process.env.NEXT_PUBLIC_BRAND_DEALS_UPPER?.trim() ||
    `${shortName.toUpperCase()} DEALS`,
  clinicName:
    process.env.NEXT_PUBLIC_BRAND_CLINIC?.trim() || `${shortName} Clinic & Spa`,
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
 * Checks whether a string looks like a URL, file path, asset path, or route slug
 * that must NOT be altered by brand text replacement.
 */
function isProtectedPathOrSlug(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.endsWith(".html") ||
    trimmed.endsWith(".png") ||
    trimmed.endsWith(".jpg") ||
    trimmed.endsWith(".jpeg") ||
    trimmed.endsWith(".webp") ||
    trimmed.endsWith(".svg") ||
    trimmed.endsWith(".gif")
  ) {
    return true;
  }
  // Single token with no spaces that looks like a slug/id/code (unless it contains hasaki or nowfree)
  if (
    !trimmed.includes(" ") &&
    /^[a-z0-9._-]+$/i.test(trimmed) &&
    !/hasaki|nowfree/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

/**
 * Replaces legacy "Hasaki" / "NowFree" brand occurrences in display text with
 * the active `BRAND_CONFIG` tokens while preserving URLs and slugs.
 */
export function brandText(input: string): string {
  if (!input || typeof input !== "string") return input;
  if (isProtectedPathOrSlug(input)) return input;

  // Preserve media asset CDN URLs so images remain loadable
  const mediaTokens: string[] = [];
  const placeholderPrefix = "__CDN_MEDIA_KEEP_";
  const masked = input.replace(/https?:\/\/(?:media\.hasaki\.vn|media\.hcdn\.vn)[^\s"'<>)]*/gi, (match) => {
    const idx = mediaTokens.length;
    mediaTokens.push(match);
    return `${placeholderPrefix}${idx}__`;
  });

  const replaced = masked
    .replace(/CÔNG TY CỔ PHẦN HASAKI BEAUTY & CLINIC/gi, BRAND_CONFIG.companyName)
    .replace(/Hasaki Beauty\s*&\s*Clinic/gi, `${BRAND_CONFIG.name} Beauty & Clinic`)
    .replace(/Hasaki Clinic\s*&\s*Spa/gi, BRAND_CONFIG.clinicName)
    .replace(/Hasaki Clinic/gi, BRAND_CONFIG.clinicName)
    .replace(/HASAKI DEALS/g, BRAND_CONFIG.dealsUpper)
    .replace(/Hasaki Deals/gi, BRAND_CONFIG.dealsLabel)
    .replace(/Hasaki Rewards/gi, BRAND_CONFIG.loyaltyName)
    .replace(/NOWFREE\s*2H/g, BRAND_CONFIG.deliveryName.toUpperCase())
    .replace(/NowFree\s*2H/gi, BRAND_CONFIG.deliveryName)
    .replace(/NowFree/gi, `${BRAND_CONFIG.shortName}Now`)
    .replace(/@hasaki\.vn/gi, `@${BRAND_CONFIG.emailDomain}`)
    .replace(/HASAKI\.VN/g, BRAND_CONFIG.upperName)
    .replace(/Hasaki\.vn/gi, BRAND_CONFIG.name)
    .replace(/hasaki\.vn/g, BRAND_CONFIG.domain)
    .replace(/\bHASAKI\b/g, BRAND_CONFIG.upperName)
    .replace(/\bHasaki\b/g, BRAND_CONFIG.name)
    .replace(/\bhasaki\b/g, BRAND_CONFIG.shortName.toLowerCase());

  // Restore preserved media URLs
  return replaced.replace(new RegExp(`${placeholderPrefix}(\\d+)__`, "g"), (_, idx) => {
    return mediaTokens[Number(idx)] || "";
  });
}

const PROTECTED_OBJECT_KEYS = new Set([
  "id",
  "sku",
  "slug",
  "href",
  "url",
  "image",
  "images",
  "thumbnail",
  "thumbnailUrl",
  "logo",
  "logoUrl",
  "banner",
  "icon",
  "code",
  "categorySlug",
  "parentSlug",
  "brandSlug",
  "productSlug",
  "username",
  "passwordHint",
]);

/**
 * Recursively transforms all human-readable display strings inside a data structure
 * (arrays, objects, JSON datasets) to use `BRAND_CONFIG` tokens without touching
 * URLs, slugs, IDs, asset paths, or third-party cosmetic brand names.
 */
export function brandDeep<T>(data: T): T {
  if (typeof data === "string") {
    return brandText(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => brandDeep(item)) as unknown as T;
  }
  if (data && typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (PROTECTED_OBJECT_KEYS.has(key)) {
        out[key] = val;
      } else if (key === "brand") {
        // Only brand token "Hasaki" gets rebranded; third-party brands (Bioderma, La Roche-Posay, etc.) remain untouched
        if (typeof val === "string" && /^hasaki$/i.test(val.trim())) {
          out[key] = BRAND_CONFIG.name;
        } else {
          out[key] = val;
        }
      } else {
        out[key] = brandDeep(val);
      }
    }
    return out as T;
  }
  return data;
}
