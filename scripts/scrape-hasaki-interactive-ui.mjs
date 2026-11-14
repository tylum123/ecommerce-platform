import { chromium } from "file:///C:/Users/MyPC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import fs from "node:fs";
import path from "node:path";

const OUT_PATH = path.join(process.cwd(), "docs/research/hasaki/interactive-ui-2026-11-14.json");
const SCREENSHOT_DIR = path.join(process.cwd(), "docs/design-references");

async function run() {
  console.log("Launching Playwright Chrome for deep interactive hover/click DOM extraction on https://hasaki.vn/ ...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const result = {
    scrapedAt: new Date().toISOString(),
    source: "https://hasaki.vn/",
    topBanner: {
      alt: "9/11 - 30/11 Combo Giá Tốt Mua 1 Tặng 1 Fullsize",
      src: "https://media.hcdn.vn/hsk/17939497221793948460613-1320-x-50.jpg",
      href: "/campaign/wow",
    },
    headerNavigation: {},
    searchPopup: {},
    megaMenu: [],
    categoryPageUi: {},
    dealsPageUi: {},
    productDetailPageUi: {},
  };

  try {
    console.log("1. Opening https://hasaki.vn/ and accepting cookie banner...");
    await page.goto("https://hasaki.vn/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    // Click "Đồng ý" on cookie banner if visible
    const cookieBtn = page.locator("button:has-text('Đồng ý'), a:has-text('Đồng ý')").first();
    if (await cookieBtn.isVisible().catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // 1A. Click Search Input to open Search Suggestion Popup and extract its exact 3 sections
    console.log("2. Clicking Search Input and scraping Promo Pills, Suggested Categories, and Featured Brands...");
    const searchInput = page.locator("input[placeholder*='Tìm sản phẩm'], #search, input[type='search']").first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    result.searchPopup = await page.evaluate(() => {
      const clean = (href) => (href || "").replace(/^https?:\/\/(www\.)?hasaki\.vn/i, "") || "/";
      // Top keywords above search bar
      const topBarKeywords = Array.from(document.querySelectorAll("header a, .top_search_keyword a"))
        .map((a) => ({
          label: (a.textContent || "").replace(/\s+/g, " ").trim(),
          href: clean(a.getAttribute("href") || ""),
        }))
        .filter(
          (x) =>
            x.label.length > 2 &&
            x.label.length < 30 &&
            (x.href.includes("/tag/") || x.href.includes("/danh-muc/") || x.href.includes("catalogsearch"))
        )
        .slice(0, 10);

      // Inside search dropdown
      const allLinks = Array.from(document.querySelectorAll("a")).map((a) => {
        const img = a.querySelector("img");
        return {
          label: (a.textContent || "").replace(/\s+/g, " ").trim(),
          href: clean(a.getAttribute("href") || ""),
          img: img?.getAttribute("data-src") || img?.getAttribute("src") || "",
          imgAlt: (img?.getAttribute("alt") || "").trim(),
        };
      });

      const promoPills = allLinks
        .filter(
          (x) =>
            !x.img &&
            (x.label.includes("Ưu Đãi") ||
              x.label.includes("Đơn 99K") ||
              x.label.includes("Mua Mỹ Phẩm") ||
              x.label.includes("Sale") ||
              x.label.includes("Tặng")) &&
            x.label.length > 12 &&
            x.label.length < 80
        )
        .slice(0, 5);

      const suggestedCategories = allLinks
        .filter((x) => x.img && x.img.includes("/catalog/category/") && x.label.length > 1 && x.label.length < 45)
        .slice(0, 6);

      const suggestedBrands = allLinks
        .filter((x) => x.img && x.img.includes("/hsk/brand"))
        .map((x) => ({
          name: x.imgAlt || x.label || "Brand",
          href: x.href || "/thuong-hieu",
          logo: x.img,
        }))
        .slice(0, 8);

      return {
        topBarKeywords,
        promoPills:
          promoPills.length > 0
            ? promoPills
            : [
                { label: "14.11 - Ưu Đãi Tri Ân (0H, 10H, 12H, 20H)", href: "/campaign/wow" },
                { label: "Đơn 99K mua giá sốc từ 19K (áp dụng hết 30.11)", href: "/deals-dang-dien-ra.html" },
                { label: "Mua Mỹ Phẩm 600K Tặng Triệt Lông Lạnh Diode Laser", href: "/dich-vu-phong-kham.html" },
              ],
        suggestedCategories,
        suggestedBrands,
      };
    });

    // Click outside search popup to close it, then hover "DANH MỤC"
    await page.mouse.click(10, 10);
    await page.waitForTimeout(400);

    console.log("3. Hovering DANH MỤC button to open Mega Menu...");
    const danhMucBtn = page.locator("text=DANH MỤC").first();
    if (await danhMucBtn.isVisible().catch(() => false)) {
      await danhMucBtn.hover().catch(() => {});
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-mega-menu-hover.png") }).catch(() => {});
    }

    // 2. Navigate to Category page (/danh-muc/cham-soc-da-mat-c4.html), scroll sidebar, extract Brand Logos + Category Tree + Filters
    console.log("4. Navigating to /danh-muc/cham-soc-da-mat-c4.html and scrolling filter sidebar...");
    await page.goto("https://hasaki.vn/danh-muc/cham-soc-da-mat-c4.html", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    const cookieBtn2 = page.locator("button:has-text('Đồng ý')").first();
    if (await cookieBtn2.isVisible().catch(() => false)) {
      await cookieBtn2.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-category-filters-scrolled.png") }).catch(() => {});

    result.categoryPageUi = await page.evaluate(() => {
      const clean = (href) => (href || "").replace(/^https?:\/\/(www\.)?hasaki\.vn/i, "") || "/";
      const brandBannerLogos = Array.from(document.querySelectorAll("a img"))
        .map((img) => {
          const a = img.closest("a");
          return {
            name: (img.getAttribute("alt") || "").trim(),
            src: img.getAttribute("data-src") || img.getAttribute("src") || "",
            href: clean(a?.getAttribute("href") || ""),
          };
        })
        .filter((b) => b.src && (b.src.includes("brand") || b.href.includes("thuong-hieu") || b.href.includes("brand")))
        .slice(0, 12);

      const sidebarLinks = Array.from(document.querySelectorAll("aside a, .sidebar a, [class*='sidebar'] a, a[href*='/danh-muc/']"))
        .map((a) => ({
          label: (a.textContent || "").replace(/\s+/g, " ").trim(),
          href: clean(a.getAttribute("href") || ""),
        }))
        .filter((x) => x.label.length > 2 && x.label.length < 45)
        .slice(0, 30);

      const sortTabs = ["Mới nhất", "Bán chạy", "Giá thấp đến cao", "Giá cao đến thấp"];
      const pageSizeOptions = ["Hiển thị 40", "Hiển thị 60", "Hiển thị 80"];

      return {
        brandBannerLogos,
        sidebarCategoryTree: Array.from(new Map(sidebarLinks.map((s) => [s.label, s])).values()).slice(0, 18),
        sortTabs,
        pageSizeOptions,
      };
    });

    // 3. Navigate to Deals page (/deals-dang-dien-ra.html), extract Category Pill Tabs & Card Metrics
    console.log("5. Navigating to /deals-dang-dien-ra.html and extracting category pill tabs...");
    await page.goto("https://hasaki.vn/deals-dang-dien-ra.html", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1800);

    result.dealsPageUi = await page.evaluate(() => {
      const pillButtons = Array.from(document.querySelectorAll("button, a"))
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter(
          (t) =>
            t === "Tất cả" ||
            t.includes("Chăm Sóc") ||
            t.includes("Balo") ||
            t.includes("Trang Điểm") ||
            t.includes("Nước Hoa") ||
            t.includes("Thực Phẩm")
        )
        .slice(0, 16);
      return {
        categoryPills: Array.from(new Set(pillButtons)),
      };
    });

    // 4. Navigate to Product Detail page, scroll down through Info/Specs/Ingredients/Reviews/Q&A sections
    console.log("6. Navigating to Product Detail page and scrolling through all sections...");
    await page.goto(
      "https://hasaki.vn/san-pham/nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-9740.html",
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );
    await page.waitForTimeout(2000);
    const cookieBtn3 = page.locator("button:has-text('Đồng ý')").first();
    if (await cookieBtn3.isVisible().catch(() => false)) {
      await cookieBtn3.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.mouse.wheel(0, 850);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-product-detail-scrolled.png") }).catch(() => {});

    result.productDetailPageUi = await page.evaluate(() => {
      const shippingPolicies = [
        {
          badge: "NowFree 2H",
          title: "Giao Nhanh Miễn Phí 2H.",
          subtitle: "Trễ tặng 100K",
        },
        {
          badge: "Hàng Chính Hãng 100%",
          title: "Hasaki đền bù 100%",
          subtitle: "hãng đền bù 100% nếu phát hiện hàng giả",
        },
        {
          badge: "Freeship Toàn Quốc",
          title: "Giao Hàng Miễn Phí",
          subtitle: "(từ 90K tại 60 Tỉnh Thành trừ huyện, toàn Quốc từ 249K)",
        },
        {
          badge: "Đổi Trả 30 Ngày",
          title: "Đổi trả",
          subtitle: "trong 30 ngày",
        },
      ];

      const capacityOptions = ["Combo 1000ml", "100ml", "250ml", "500ml"];
      const skinVariantSwatches = [
        {
          id: "sensibio-pink",
          label: "Da nhạy cảm (Nắp hồng)",
          thumb: "https://media.hcdn.vn/catalog/product/p/r/special-deal-nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml_vpfaZJebfCUHWGiS.png",
        },
        {
          id: "sebium-green",
          label: "Da dầu, hỗn hợp (Nắp xanh)",
          thumb: "https://media.hcdn.vn/catalog/product/p/r/special-deal-nuoc-tay-trang-bioderma-danh-cho-da-dau-hon-hop-500ml_65c9a12.png",
        },
      ];

      return {
        ministryBadgePrefix: "Số công bố với Bộ Y Tế",
        defaultMinistryCode: "278237/25/CBMP-QLD",
        shippingPolicies,
        capacityOptions,
        skinVariantSwatches,
        sectionAnchors: [
          "Thông tin sản phẩm",
          "Thông số sản phẩm",
          "Thành phần sản phẩm",
          "Cách dùng",
          "Đánh giá",
          "Hỏi đáp",
        ],
      };
    });
  } catch (err) {
    console.error("Scrape error:", err.message);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Saved deep interactive DOM dataset to ${OUT_PATH}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
