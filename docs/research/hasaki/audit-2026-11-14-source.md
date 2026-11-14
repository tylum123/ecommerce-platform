# Hasaki source destination audit — 2026-11-14

## Scope and method

Read-only public-source pass using web search/open results on 2026-11-14. No Hasaki account, purchase, booking, or form submission was used. This pass maps representative destinations at a high level; it does not reproduce the page DOM or prove live click behavior.

The web tool returned indexed page extracts, not raw HTTP headers or a controlled browser session. Therefore this report records **index/open availability and extracted content**, not HTTP status codes, viewport appearance, or interaction results. Search result crawl dates vary (today/yesterday, last week, or older) and are shown in the source links' tool evidence; prices, stock, promotions, and page contents are volatile snapshots.

## Representative top-down destinations

| Area | Observed source destination | Indexed evidence | Local project comparison |
|---|---|---|---|
| Home | [`https://hasaki.vn/`](https://hasaki.vn/) | Search index crawled yesterday/today. Extract indicates global header (search, account, store/help links, cart, app, region), top searches, merchandise, clinic services, benefits and footer material. Open returned only a small header/link extract, so full page order is not established here. | Home route exists. Existing handoff documents a prior desktop comparison and known limits: source content changes, sampled product data, carousel/timer and “Xem thêm” gaps. This pass does not supersede that visual evidence. |
| Category | [`/danh-muc/cham-soc-da-mat-c4.html`](https://hasaki.vn/danh-muc/cham-soc-da-mat-c4.html) | Search index crawled three days ago. Page is a category listing with category prose; sibling category [`/danh-muc/phu-kien-cham-soc-da-c290.html`](https://hasaki.vn/danh-muc/phu-kien-cham-soc-da-c290.html) was indexed last week. A campaign extract showed the shared category tree and product cards. | `/danh-muc/[slug]` exists. Handoff says the skincare category has a brand strip, four-column listing, and local sort/filter checks; source mobile parity and complete source-state coverage remain unverified. |
| Product | [`/san-pham/cham-soc-da-mat-hasaki-da-lanh-16218.html`](https://hasaki.vn/san-pham/cham-soc-da-mat-hasaki-da-lanh-16218.html) | Search index crawled six days ago. Extract exposed breadcrumb links to home, Clinic & Spa, a service category, and product. Other indexed product extracts expose Q&A, likes, reviews and fulfillment/return benefits, but are different SKUs and are not interchangeable evidence for this product's controls. | `/san-pham/[slug]` exists. Handoff records product template work and states some tabs/data/variants/inventory are missing or sample-based. This source pass did not inspect the chosen page's variant or add-to-cart behavior. |
| Brand | [`/thuong-hieu/cocoon.html`](https://hasaki.vn/thuong-hieu/cocoon.html) | Search index crawled last week. Extract contains brand intro, in-store search, price range with “Áp dụng”, and facet groups (hair/scalp condition, size, ingredients, skin type, benefits, product type). A non-`.html` alternate `/thuong-hieu/cocoon` was also indexed last month; canonical behavior was not tested. | `/thuong-hieu` and `/thuong-hieu/[slug]` exist. Handoff says the directory snapshot has 488 brand names/URLs; brand detail lacks real description, full product set, promotions and full filters. |
| Deals | [`/deals-dang-dien-ra.html?cat=331`](https://hasaki.vn/deals-dang-dien-ra.html?cat=331) | Search index crawled last week; this query returned clinic services and booking buttons. That is evidence `cat=331` selects a clinic category in the indexed result, not a general cosmetics Flash Deal. A separate [`/campaign/campaign-test-flash-deal`](https://hasaki.vn/campaign/campaign-test-flash-deal) result crawled today lists deal cards with stock/rating/price/timer text. | `/deals-dang-dien-ra.html` exists. Handoff notes source menu destination with `?product_list_order=topsale`; `cat=331` is a materially different sample state and must not be conflated. Existing Flash Deals work has documented partial parity. |
| Footer/support | [`hotro.hasaki.vn/quy-dinh-giao-dich-chung.html`](https://hotro.hasaki.vn/quy-dinh-giao-dich-chung.html), [`hotro.hasaki.vn/chinh-sach-bao-mat.html`](https://hotro.hasaki.vn/chinh-sach-bao-mat.html), [`/gioi-thieu-hasaki-clinic-spa.html`](https://hasaki.vn/gioi-thieu-hasaki-clinic-spa.html) | Indexed content confirms support-policy destinations are on the `hotro.hasaki.vn` subdomain. General transaction policy mentions hotline/email, cancellation, warranty and complaints; privacy policy discusses personal-data handling. The Clinic introduction is a separate Hasaki route. These are sampled destinations, not an exhaustive footer inventory. | Local has `/ho-tro`, `/ho-tro/[slug]`, `/bao-hanh`, `/clinic`, and informational routes. This HTTP/index pass does not establish that every source footer link is mapped or that local policy content matches current source. |

## Source navigation inventory

The compact machine-readable list is in [`audit-source-links-2026-11-14.json`](audit-source-links-2026-11-14.json). It distinguishes indexed direct destinations from links inferred by page content. Because the extraction service did not expose a complete DOM/link graph, treat it as a crawl seed list rather than an exhaustive navigation scrape.

## Coverage limits and next verification

- No raw status codes, response headers, redirects, cookie state, responsive screenshots, hover/focus states, or keyboard behavior were available from the web-index interface.
- No login-required routes or sensitive controls were tested. No cart, checkout, account, booking, contact, or purchase action was submitted.
- Source text includes changing prices, stock, ratings, deal timers and counts; do not promote these extracts into current/live product truth.
- Follow the link inventory in an isolated browser to establish actual top-to-bottom page order and button/link outcomes. Compare each local template at matched viewport and state; record blocked/login-gated results as unverified.

## Source evidence

- [Hasaki home](https://hasaki.vn/) — indexed crawl shown as yesterday/today; open exposed a short header extract.
- [Facial-care category](https://hasaki.vn/danh-muc/cham-soc-da-mat-c4.html) — indexed crawl three days ago.
- [Accessory category](https://hasaki.vn/danh-muc/phu-kien-cham-soc-da-c290.html) — indexed crawl last week.
- [Hasaki facial-care product](https://hasaki.vn/san-pham/cham-soc-da-mat-hasaki-da-lanh-16218.html) — indexed crawl six days ago.
- [Cocoon brand listing](https://hasaki.vn/thuong-hieu/cocoon.html) — indexed crawl last week.
- [Deals with clinic category query](https://hasaki.vn/deals-dang-dien-ra.html?cat=331) — indexed crawl last week.
- [Flash Deal campaign sample](https://hasaki.vn/campaign/campaign-test-flash-deal) — indexed crawl today.
- [General transaction policy](https://hotro.hasaki.vn/quy-dinh-giao-dich-chung.html) and [privacy policy](https://hotro.hasaki.vn/chinh-sach-bao-mat.html) — indexed crawl last month.
- [Clinic introduction](https://hasaki.vn/gioi-thieu-hasaki-clinic-spa.html) — indexed crawl today.
