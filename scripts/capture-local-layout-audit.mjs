import { chromium } from "file:///C:/Users/MyPC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "docs/design-references");

async function main() {
  let base = "http://localhost:3000";
  let server = null;
  let runningOn3000 = false;
  try {
    const res = await fetch(`${base}/`);
    if (res.ok) runningOn3000 = true;
  } catch {
    // not running on 3000
  }

  if (!runningOn3000) {
    base = "http://localhost:3037";
    server = spawn(
      process.execPath,
      [path.join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "-p", "3037"],
      { stdio: "ignore", cwd: process.cwd() }
    );
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 700));
      try {
        const res = await fetch(`${base}/`);
        if (res.ok) break;
      } catch {
        // wait
      }
    }
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Homepage
    await page.goto(`${base}/`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-01-home.png") });

    // 2. Category page
    await page.goto(`${base}/danh-muc/cham-soc-da-mat-c4.html`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-02-category.png") });

    // 3. Product detail page
    await page.goto(`${base}/san-pham/nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-03-product.png") });
    await page.click(".buy-button").catch(() => {});
    await page.evaluate(() => window.scrollBy(0, 650));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-04-product-scrolled.png") });

    // 4. Deals page
    await page.goto(`${base}/deals-dang-dien-ra.html`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-05-deals.png") });

    // 5. Campaign WOW page
    await page.goto(`${base}/campaign/wow`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-06-campaign-wow.png") });

    // 6. Bestsellers page
    await page.goto(`${base}/san-pham-ban-chay.html`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-07-bestsellers.png") });

    // 7. Order lookup page
    await page.goto(`${base}/tra-cuu-don-hang`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-08-order-lookup.png") });

    // 8. Cart page (with item added from product detail page)
    await page.goto(`${base}/gio-hang`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-09-cart.png") });

    // 9. Store locator page
    await page.goto(`${base}/he-thong-cua-hang`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-10-stores.png") });

    // 10. Warranty page
    await page.goto(`${base}/bao-hanh`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-11-warranty.png") });

    // 11. Support page & Footer
    await page.goto(`${base}/ho-tro`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-12-support.png") });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, "audit-local-13-footer.png") });
  } finally {
    await browser.close();
    if (server) server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
