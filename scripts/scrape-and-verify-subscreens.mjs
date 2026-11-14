import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const OUT_JSON = path.join(process.cwd(), "docs/research/hasaki/subscreens-visible-2026-11-13.json");
let LOCAL_BASE = process.env.LOCAL_BASE || "http://localhost:3000";

const LIVE_HASAKI_URLS = [
  { key: "home", url: "https://hasaki.vn/" },
  { key: "newArrivals", url: "https://hasaki.vn/hang-moi-ve.html" },
  { key: "categorySkincare", url: "https://hasaki.vn/danh-muc/cham-soc-da-mat-c4.html" },
  { key: "categoryMakeup", url: "https://hasaki.vn/danh-muc/trang-diem-c25.html" },
  { key: "deals", url: "https://hasaki.vn/deals-dang-dien-ra.html" },
  { key: "bestsellers", url: "https://hasaki.vn/san-pham-ban-chay.html" },
  { key: "clinic", url: "https://hasaki.vn/dich-vu-phong-kham.html" },
  { key: "clinicPricing", url: "https://hasaki.vn/bang-gia-dich-vu.html" },
  { key: "clinicHandbook", url: "https://hasaki.vn/cam-nang.html" },
  { key: "campaignWow", url: "https://hasaki.vn/campaign/wow" },
];

const LOCAL_SUBSCREENS = [
  { name: "home", path: "/" },
  { name: "category-skincare", path: "/danh-muc/cham-soc-da-mat-c4.html" },
  { name: "category-makeup", path: "/danh-muc/trang-diem-c25.html" },
  { name: "category-bodycare", path: "/danh-muc/cham-soc-co-the-c12.html" },
  { name: "deals", path: "/deals-dang-dien-ra.html" },
  { name: "bestsellers", path: "/san-pham-ban-chay.html" },
  { name: "new-arrivals", path: "/hang-moi-ve.html" },
  { name: "brands-directory", path: "/thuong-hieu" },
  { name: "brand-detail-laroche", path: "/thuong-hieu/la-roche-posay" },
  { name: "brand-detail-bioderma", path: "/thuong-hieu/bioderma.html" },
  { name: "product-detail-bioderma", path: "/san-pham/nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml" },
  { name: "product-detail-cerave", path: "/san-pham/sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml-102959.html" },
  { name: "clinic-landing", path: "/dich-vu-phong-kham.html" },
  { name: "clinic-pricing", path: "/bang-gia-dich-vu.html" },
  { name: "clinic-handbook", path: "/cam-nang.html" },
  { name: "clinic-booking", path: "/dat-lich-kham" },
  { name: "campaign-wow", path: "/campaign/wow" },
  { name: "tag-chong-nang", path: "/tag/kem-chong-nang" },
  { name: "stores-locator", path: "/he-thong-cua-hang" },
  { name: "support-center", path: "/ho-tro" },
  { name: "warranty-center", path: "/bao-hanh" },
  { name: "cart", path: "/gio-hang" },
  { name: "checkout", path: "/thanh-toan" },
  { name: "search", path: "/tim-kiem?q=kem+chong+nang" },
  { name: "login-register", path: "/dang-nhap" },
  { name: "customer-portal-account", path: "/khach-hang/tai-khoan" },
  { name: "customer-portal-orders", path: "/khach-hang/don-hang" },
  { name: "customer-portal-bookings", path: "/khach-hang/lich-hen" },
  { name: "customer-portal-loyalty", path: "/khach-hang/diem-thuong" },
  { name: "admin-erp-portal", path: "/quan-tri" },
  { name: "sitemap-xml", path: "/sitemap.xml" },
  { name: "robots-txt", path: "/robots.txt" },
];

const LOCAL_APIS = [
  { name: "api-products", path: "/api/products?limit=8" },
  { name: "api-deals", path: "/api/deals" },
  { name: "api-bestsellers", path: "/api/bestsellers" },
  { name: "api-stores", path: "/api/stores" },
  { name: "api-warranty", path: "/api/warranty" },
  { name: "api-admin-users", path: "/api/admin/users" },
  { name: "api-admin-staff", path: "/api/admin/staff" },
  { name: "api-admin-orders", path: "/api/admin/orders" },
  { name: "api-admin-inventory", path: "/api/admin/inventory" },
  { name: "api-admin-seo", path: "/api/admin/seo" },
  { name: "api-mcp-get", path: "/api/mcp" },
  { name: "api-ui-config", path: "/api/ui-config" },
  { name: "api-ui-config-stock", path: "/api/ui-config?slug=nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml" },
  { name: "api-codegraph", path: "/api/codegraph" },
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagTexts(html, tag, limit = 15) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null && out.length < limit) {
    const txt = stripTags(m[1]);
    if (txt && txt.length > 1 && txt.length < 160 && !out.includes(txt)) {
      out.push(txt);
    }
  }
  return out;
}

function extractImages(html, limit = 20) {
  const re = /<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null && out.length < limit) {
    const src = m[1];
    if (src && !src.startsWith("data:") && !out.includes(src)) {
      out.push(src);
    }
  }
  return out;
}

async function run() {
  const liveScraped = {};
  console.log("=== 1. Scraping visible sub-screen HTML data from https://hasaki.vn/ ===");
  for (const item of LIVE_HASAKI_URLS) {
    try {
      const res = await fetch(item.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      const title = extractTagTexts(html, "title", 1)[0] || "";
      const h1s = extractTagTexts(html, "h1", 5);
      const h2s = extractTagTexts(html, "h2", 15);
      const h3s = extractTagTexts(html, "h3", 20);
      const images = extractImages(html, 20);
      liveScraped[item.key] = {
        url: item.url,
        status: res.status,
        title,
        h1s,
        h2s,
        h3s,
        sampleImages: images,
      };
      console.log(
        `  [LIVE ${res.status}] ${item.key.padEnd(18)} | title="${title.slice(0, 48)}" | h2s=${h2s.length} | h3s=${h3s.length} | imgs=${images.length}`
      );
    } catch (err) {
      liveScraped[item.key] = { url: item.url, status: 0, error: String(err.message || err) };
      console.log(`  [LIVE WARN] ${item.key}: ${err.message}`);
    }
  }

  let tempServer = null;
  try {
    const probe = await fetch(`${LOCAL_BASE}/api/ui-config`, {
      signal: AbortSignal.timeout(4000),
    });
    const ct = probe.headers.get("content-type") || "";
    if (!probe.ok || !ct.includes("application/json")) {
      throw new Error("Stale server on port 3000");
    }
  } catch {
    console.log("\nStarting fresh Next.js production server on port 3036 to verify latest build...");
    LOCAL_BASE = "http://localhost:3036";
    tempServer = spawn(
      process.execPath,
      [path.join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "-p", "3036"],
      { stdio: "ignore", cwd: process.cwd() }
    );
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 750));
      try {
        const check = await fetch(`${LOCAL_BASE}/api/ui-config`);
        if (check.ok) break;
      } catch {
        // wait for server ready
      }
    }
  }

  console.log("\n=== 2. Auditing 32 Local Storefront, Auth, ERP & SEO Sub-screens ===");
  const localSubscreensAudit = [];
  for (const sub of LOCAL_SUBSCREENS) {
    try {
      const res = await fetch(`${LOCAL_BASE}${sub.path}`, {
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      const title = extractTagTexts(html, "title", 1)[0] || "";
      const h1s = extractTagTexts(html, "h1", 5);
      const h2s = extractTagTexts(html, "h2", 12);
      const h3s = extractTagTexts(html, "h3", 12);
      const imgs = extractImages(html, 30);
      const visibleTextLen = stripTags(html).length;
      localSubscreensAudit.push({
        name: sub.name,
        path: sub.path,
        status: res.status,
        title,
        h1s,
        h2s,
        h3s,
        imagesCount: imgs.length,
        visibleTextLen,
      });
      console.log(
        `  [LOCAL ${res.status}] ${sub.path.padEnd(42)} | h1="${(h1s[0] || title).slice(0, 38)}" | h2=${h2s.length} | imgs=${imgs.length} | textLen=${visibleTextLen}`
      );
    } catch (err) {
      localSubscreensAudit.push({
        name: sub.name,
        path: sub.path,
        status: 500,
        error: String(err.message || err),
      });
      console.log(`  [LOCAL ERR] ${sub.path}: ${err.message}`);
    }
  }

  console.log("\n=== 3. Auditing 12 Local Backend, ERP, SEO & MCP API Endpoints ===");
  const localApisAudit = [];
  for (const api of LOCAL_APIS) {
    try {
      const res = await fetch(`${LOCAL_BASE}${api.path}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json();
      const keys = Object.keys(json || {});
      localApisAudit.push({
        name: api.name,
        path: api.path,
        status: res.status,
        topLevelKeys: keys,
      });
      console.log(`  [API ${res.status}]   ${api.path.padEnd(32)} | keys=${keys.join(", ")}`);
    } catch (err) {
      localApisAudit.push({
        name: api.name,
        path: api.path,
        status: 500,
        error: String(err.message || err),
      });
      console.log(`  [API ERR]   ${api.path}: ${err.message}`);
    }
  }

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        liveHasakiVisibleSummary: liveScraped,
        localSubscreensAudit,
        localApisAudit,
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`\nSaved full subscreen scrape & audit to ${OUT_JSON}`);
  if (tempServer) {
    tempServer.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
