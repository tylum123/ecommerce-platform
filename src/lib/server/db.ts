/**
 * Central In-Memory Backend Repository & Database Store for Nari Home Clone.
 * Indexed by CodeGraph to unify data snapshots, runtime mutations, and API route handlers.
 *
 * Implements strict TypeScript types, runtime persistence across dev reloads via globalThis,
 * seeded datasets, and query optimizer indexing.
 */

import {
  getAllCatalogProducts,
  type Product as CatalogProduct,
  categories as catalogCategories,
} from "@/lib/catalog";
import {
  matchesCategory,
} from "@/lib/deals-bestsellers";
import {
  getStoreBranches,
  lookupWarrantyDraft,
  type WarrantyLookupResult,
} from "@/lib/support-stores";
import { clinicServices } from "@/lib/clinic-services";
import {
  getInteractiveUiData,
  computeGiftBillPromo,
  computeProductEnglishSubtitle,
  searchCatalogLive,
} from "@/lib/interactive-ui";
import {
  getDemoOrderHistory,
  getDemoBookingHistory,
} from "@/lib/campaigns-location";

export {
  getInteractiveUiData,
  computeGiftBillPromo,
  computeProductEnglishSubtitle,
  searchCatalogLive,
};
import type {
  ProductReviewItem,
  ProductCommentItem,
  FacetOption,
  FacetGroup,
} from "@/lib/backend-contracts";

import categoryFacetsRaw from "../../../docs/research/hasaki/category-facets-2026-11-13.json";

// ----------------------------------------------------------------------
// Domain Data Types & Contracts
// ----------------------------------------------------------------------

export interface OrderItem {
  sku?: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  slug?: string;
  image?: string;
}

export interface OrderRecord {
  id: string;
  code: string;
  createdAt: string;
  status: "processing" | "Đang giao hàng" | "Đã giao thành công" | "cancelled";
  recipientName: string;
  recipientPhone: string;
  address: string;
  paymentMethod: string;
  deliveryType?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface CreateOrderInput {
  recipientName: string;
  recipientPhone: string;
  address: string;
  paymentMethod?: string;
  deliveryType?: string;
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  total?: number;
}

export interface BookingRecord {
  id: string;
  code: string;
  customerName?: string;
  customerPhone?: string;
  serviceName: string;
  serviceSlug?: string;
  branchName: string;
  branchAddress?: string;
  appointmentTime: string;
  status: "confirmed" | "Sắp tới" | "Đã hoàn thành" | "Đã hủy";
  doctorAssigned?: string;
  note?: string;
  createdAt: string;
}

export interface CreateBookingInput {
  name: string;
  phone: string;
  branch: string;
  service: string;
  date?: string;
  time?: string;
  appointmentTime?: string;
  note?: string;
  doctorAssigned?: string;
}

export interface WarrantyClaimRecord {
  ticketId: string;
  customerName: string;
  phone: string;
  serialNumber?: string;
  productName: string;
  brand?: string;
  issueDescription: string;
  branchName?: string;
  status: "pending" | "processing" | "completed";
  createdAt: string;
}

export interface CreateWarrantyClaimInput {
  customerName: string;
  phone: string;
  serialNumber?: string;
  productName: string;
  brand?: string;
  issueDescription: string;
  branchName?: string;
}

export interface ProductFeedbackState {
  reviews: ProductReviewItem[];
  comments: ProductCommentItem[];
}

export interface ProductQueryParams {
  category?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: "popular" | "topsale" | "low" | "high" | "discount";
  page?: number;
  limit?: number;
}

export interface QueryProductsResult {
  items: CatalogProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: {
    categories: FacetOption[];
    brands: FacetOption[];
    priceRanges: FacetOption[];
    additionalGroups?: FacetGroup[];
  };
}

// ----------------------------------------------------------------------
// Seeded Datasets (MOCK_ORDERS, MOCK_APPOINTMENTS, etc.)
// ----------------------------------------------------------------------

export const MOCK_ORDERS: OrderRecord[] = getDemoOrderHistory().map(o => ({
  id: o.code || o.id,
  code: o.code || o.id,
  createdAt: o.createdAt,
  status: o.status as OrderRecord["status"],
  recipientName: o.recipientName,
  recipientPhone: o.recipientPhone,
  address: o.shippingAddress,
  paymentMethod: o.paymentMethod,
  deliveryType: o.deliveryType,
  items: o.items.map(i => ({
    sku: i.sku,
    name: i.name,
    brand: i.brand,
    price: i.price,
    quantity: i.quantity,
    slug: i.slug,
  })),
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  total: o.total,
}));

export const MOCK_APPOINTMENTS: BookingRecord[] = getDemoBookingHistory().map(b => ({
  id: b.code || b.id,
  code: b.code || b.id,
  customerName: "Nguyễn Văn An",
  customerPhone: "0901234567",
  serviceName: b.serviceName,
  branchName: b.branchName,
  branchAddress: b.branchAddress,
  appointmentTime: b.appointmentTime,
  status: b.status,
  doctorAssigned: b.doctorAssigned,
  note: b.note,
  createdAt: "10/11/2026",
}));

// ----------------------------------------------------------------------
// Global In-Memory Singleton Store
// ----------------------------------------------------------------------

interface DatabaseState {
  orders: OrderRecord[];
  appointments: BookingRecord[];
  productFeedback: Map<string, ProductFeedbackState>;
  warrantyClaims: WarrantyClaimRecord[];
  initialCatalogCache: CatalogProduct[] | null;
}

const GLOBAL_DB_KEY = "__hasaki_inmemory_db__";

interface GlobalWithDb {
  [GLOBAL_DB_KEY]?: DatabaseState;
}

function getStore(): DatabaseState {
  const g = globalThis as unknown as GlobalWithDb;
  if (!g[GLOBAL_DB_KEY]) {
    g[GLOBAL_DB_KEY] = {
      orders: [...MOCK_ORDERS],
      appointments: [...MOCK_APPOINTMENTS],
      productFeedback: new Map<string, ProductFeedbackState>(),
      warrantyClaims: [],
      initialCatalogCache: null,
    };
  }
  return g[GLOBAL_DB_KEY];
}

// ----------------------------------------------------------------------
// Order Operations
// ----------------------------------------------------------------------

export function createOrderRecord(input: CreateOrderInput): OrderRecord {
  const orderId = `HSK-${Date.now().toString().slice(-6)}`;
  const items = input.items || [];
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = input.shippingFee ?? (calculatedSubtotal >= 90000 ? 0 : 25000);

  const newOrder: OrderRecord = {
    id: orderId,
    code: orderId,
    createdAt: new Date().toLocaleString("vi-VN"),
    status: "processing",
    recipientName: input.recipientName.trim(),
    recipientPhone: input.recipientPhone.trim(),
    address: input.address.trim(),
    paymentMethod: input.paymentMethod || "Thanh toán khi nhận hàng (COD)",
    deliveryType: input.deliveryType || "NariNow 2H",
    items,
    subtotal: input.subtotal ?? calculatedSubtotal,
    shippingFee: shipping,
    total: input.total ?? (calculatedSubtotal + shipping),
  };

  getStore().orders.unshift(newOrder);
  return newOrder;
}

export function listOrderRecords(): OrderRecord[] {
  return [...getStore().orders];
}

export function findOrderById(idOrCode: string): OrderRecord | undefined {
  const clean = idOrCode.trim();
  return getStore().orders.find(o => o.id === clean || o.code === clean);
}

// ----------------------------------------------------------------------
// Booking Operations
// ----------------------------------------------------------------------

export function createBookingRecord(input: CreateBookingInput): BookingRecord {
  const bookingId = `SPA-${Date.now().toString().slice(-5)}`;
  const timeDisplay = input.appointmentTime ||
    `${input.time || "09:00"} - ${input.date || new Date().toLocaleDateString("vi-VN")}`;

  const newBooking: BookingRecord = {
    id: bookingId,
    code: bookingId,
    customerName: input.name.trim(),
    customerPhone: input.phone.trim(),
    serviceName: input.service.trim(),
    branchName: input.branch.trim(),
    appointmentTime: timeDisplay,
    status: "confirmed",
    doctorAssigned: input.doctorAssigned || "Bác sĩ da liễu chỉ định tại chi nhánh",
    note: input.note || "Hẹn khám tư vấn da miễn phí tại Nari Clinic & Spa",
    createdAt: new Date().toLocaleString("vi-VN"),
  };

  getStore().appointments.unshift(newBooking);
  return newBooking;
}

export function listBookingRecords(): BookingRecord[] {
  return [...getStore().appointments];
}

export function findBookingById(idOrCode: string): BookingRecord | undefined {
  const clean = idOrCode.trim();
  return getStore().appointments.find(b => b.id === clean || b.code === clean);
}

// ----------------------------------------------------------------------
// Product Review & Comment Mutations
// ----------------------------------------------------------------------

export function addProductReviewOrComment(
  slug: string,
  payload: { type: "review" | "comment"; author: string; rating?: number; content: string }
): ProductFeedbackState {
  const store = getStore();
  const current = store.productFeedback.get(slug) || { reviews: [], comments: [] };

  if (payload.type === "review") {
    const newReview: ProductReviewItem = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      author: payload.author.trim(),
      rating: Math.max(1, Math.min(5, Math.round(payload.rating ?? 5))),
      comment: payload.content.trim(),
      createdAt: new Date().toLocaleDateString("vi-VN"),
      variant: "Chính hãng Nari Home",
    };
    current.reviews.unshift(newReview);
  } else {
    const newComment: ProductCommentItem = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      author: payload.author.trim(),
      content: payload.content.trim(),
      createdAt: new Date().toLocaleDateString("vi-VN"),
      likeCount: 0,
      replies: [
        {
          id: `rep-${Date.now()}`,
          author: "Nari Home Beauty Chăm sóc khách hàng",
          content: "Dạ chào bạn, Nari Home xin cảm ơn câu hỏi của bạn. Chuyên viên tư vấn sẽ liên hệ giải đáp chi tiết ạ!",
          createdAt: new Date().toLocaleDateString("vi-VN"),
          isAdmin: true,
        },
      ],
    };
    current.comments.unshift(newComment);
  }

  store.productFeedback.set(slug, current);
  return {
    reviews: [...current.reviews],
    comments: [...current.comments],
  };
}

export function getProductFeedback(slug: string): ProductFeedbackState {
  const fb = getStore().productFeedback.get(slug);
  return fb ? { reviews: [...fb.reviews], comments: [...fb.comments] } : { reviews: [], comments: [] };
}

// ----------------------------------------------------------------------
// Warranty Claim Operations
// ----------------------------------------------------------------------

export function createWarrantyClaim(input: CreateWarrantyClaimInput): WarrantyClaimRecord {
  const ticketId = `BH-${Date.now().toString().slice(-6)}`;
  const claim: WarrantyClaimRecord = {
    ticketId,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    serialNumber: input.serialNumber?.trim() || `SN-${ticketId}`,
    productName: input.productName.trim(),
    brand: input.brand?.trim() || "Chính hãng",
    issueDescription: input.issueDescription.trim(),
    branchName: input.branchName?.trim() || "Trung tâm Bảo hành Nari Home Toàn quốc",
    status: "processing",
    createdAt: new Date().toLocaleString("vi-VN"),
  };

  getStore().warrantyClaims.unshift(claim);
  return claim;
}

export function lookupWarranty(query: string): WarrantyLookupResult {
  const clean = query.trim().replace(/\s+/g, "");
  if (!clean) {
    return {
      found: false,
      query,
      message: "Vui lòng nhập số điện thoại mua hàng hoặc mã Serial/mã đơn hàng.",
    };
  }

  // Check runtime claims first
  const store = getStore();
  const runtimeClaim = store.warrantyClaims.find(
    c => c.ticketId === clean || c.phone === clean || (c.serialNumber && c.serialNumber === clean)
  );

  if (runtimeClaim) {
    return {
      found: true,
      query,
      customerName: runtimeClaim.customerName,
      phone: runtimeClaim.phone,
      serialNumber: runtimeClaim.serialNumber,
      productName: runtimeClaim.productName,
      brand: runtimeClaim.brand || "Nari Home Official",
      purchaseDate: runtimeClaim.createdAt,
      warrantyExpireDate: "12-24 tháng theo tiêu chuẩn hãng",
      warrantyStatus: "processing",
      branchName: runtimeClaim.branchName,
      message: `Đang tiếp nhận xử lý bảo hành cho phiếu ${runtimeClaim.ticketId}. Chi nhánh phụ trách: ${runtimeClaim.branchName}.`,
    };
  }

  return lookupWarrantyDraft(query);
}

// ----------------------------------------------------------------------
// Catalog & Search Optimizer: queryProducts
// ----------------------------------------------------------------------

export function queryProducts(params: ProductQueryParams = {}): QueryProductsResult {
  const store = getStore();
  if (!store.initialCatalogCache) {
    store.initialCatalogCache = getAllCatalogProducts();
  }
  const all = store.initialCatalogCache;

  const {
    category,
    brand,
    q,
    minPrice,
    maxPrice,
    onSale,
    sort = "popular",
    page = 1,
    limit = 20,
  } = params;

  let filtered = all;

  // 1. Filter by category
  if (category && category.trim()) {
    const targetCat = category.trim();
    filtered = filtered.filter(p => matchesCategory(p.category, targetCat));
  }

  // 2. Filter by brand
  if (brand && brand.trim()) {
    const brandLower = brand.trim().toLowerCase();
    filtered = filtered.filter(p => p.brand.toLowerCase() === brandLower);
  }

  // 3. Search query
  if (q && q.trim()) {
    const searchTerms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter(p => {
      const targetText = `${p.name} ${p.brand} ${p.category} ${p.description || ""}`.toLowerCase();
      return searchTerms.every(term => targetText.includes(term));
    });
  }

  // 4. Price range
  if (minPrice !== undefined && !isNaN(minPrice)) {
    filtered = filtered.filter(p => p.price >= minPrice);
  }
  if (maxPrice !== undefined && !isNaN(maxPrice)) {
    filtered = filtered.filter(p => p.price <= maxPrice);
  }

  // 5. On Sale
  if (onSale) {
    filtered = filtered.filter(p => (p.sale && p.sale > 0) || (p.old && p.old > p.price));
  }

  // 6. Compute Facets before pagination
  const brandCountMap = new Map<string, number>();
  const categoryCountMap = new Map<string, number>();

  let countUnder100 = 0;
  let count100to300 = 0;
  let count300to500 = 0;
  let countAbove500 = 0;

  for (const item of filtered) {
    // Brand facets
    if (item.brand) {
      brandCountMap.set(item.brand, (brandCountMap.get(item.brand) || 0) + 1);
    }
    // Category facets
    if (item.category) {
      categoryCountMap.set(item.category, (categoryCountMap.get(item.category) || 0) + 1);
    }
    // Price range facets
    if (item.price < 100000) countUnder100++;
    else if (item.price <= 300000) count100to300++;
    else if (item.price <= 500000) count300to500++;
    else countAbove500++;
  }

  const brandFacets: FacetOption[] = Array.from(brandCountMap.entries())
    .map(([bName, count]) => ({ label: bName, value: bName, count }))
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  const categoryFacets: FacetOption[] = Array.from(categoryCountMap.entries())
    .map(([catSlug, count]) => {
      const match = catalogCategories.find(c => c[1] === catSlug);
      return {
        label: match ? match[0] : catSlug,
        value: catSlug,
        count,
      };
    })
    .sort((a, b) => (b.count || 0) - (a.count || 0));

  const priceRangeFacets: FacetOption[] = [
    { label: "Dưới 100.000 ₫", value: "0-100000", count: countUnder100 },
    { label: "100.000 ₫ - 300.000 ₫", value: "100000-300000", count: count100to300 },
    { label: "300.000 ₫ - 500.000 ₫", value: "300000-500000", count: count300to500 },
    { label: "Trên 500.000 ₫", value: "500000-max", count: countAbove500 },
  ];

  // Optional category-facets enrichment from scraped file
  let additionalGroups: FacetGroup[] | undefined;
  if (category && (categoryFacetsRaw as Record<string, Array<{ code: string; name: string; options: Array<{ key: string; label: string; count: number }> }>>)[category]) {
    const rawGroups = (categoryFacetsRaw as Record<string, Array<{ code: string; name: string; options: Array<{ key: string; label: string; count: number }> }>>)[category];
    additionalGroups = rawGroups.map(g => ({
      key: g.code,
      name: g.name,
      options: g.options.map(opt => ({
        label: opt.label,
        value: opt.key,
        count: opt.count,
      })),
    }));
  }

  // 7. Sorting
  const sorted = [...filtered];
  switch (sort) {
    case "topsale":
      sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      break;
    case "low":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "high":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "discount":
      sorted.sort((a, b) => (b.sale || 0) - (a.sale || 0));
      break;
    case "popular":
    default:
      sorted.sort((a, b) => ((b.rating || 4.5) * (b.reviewCount || 10)) - ((a.rating || 4.5) * (a.reviewCount || 10)));
      break;
  }

  // 8. Pagination
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const total = sorted.length;
  const totalPages = Math.ceil(total / safeLimit) || 1;
  const startIndex = (safePage - 1) * safeLimit;
  const items = sorted.slice(startIndex, startIndex + safeLimit);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    facets: {
      categories: categoryFacets,
      brands: brandFacets,
      priceRanges: priceRangeFacets,
      additionalGroups,
    },
  };
}

// ----------------------------------------------------------------------
// CodeGraph Architectural Manifest
// ----------------------------------------------------------------------

export interface CodeGraphManifest {
  version: string;
  project: string;
  description: string;
  contracts: {
    file: string;
    interfaces: string[];
  };
  serviceModules: Array<{
    file: string;
    domain: string;
    exportedFunctions: string[];
  }>;
  repository: {
    file: string;
    inMemoryCollections: string[];
    mutationMethods: string[];
  };
  apiEndpoints: Array<{
    path: string;
    methods: string[];
    description: string;
  }>;
  frontendRoutes: Array<{
    path: string;
    title: string;
    dynamic: boolean;
  }>;
}

export function getCodeGraphManifest(): CodeGraphManifest {
  return {
    version: "2.0.0",
    project: "Nari Home Fullstack Next.js Clone",
    description: "Reverse-engineered Next.js App Router codebase with 1:1 fidelity, typed domain services, and in-memory mock repository.",
    contracts: {
      file: "src/lib/backend-contracts.ts",
      interfaces: [
        "ProductSummary",
        "ProductDetailData",
        "ProductSpecRow",
        "ProductReviewItem",
        "ProductCommentItem",
        "ProductRatingSummary",
        "CategoryNode",
        "FacetOption",
        "FacetGroup",
        "BrandSummary",
        "CampaignBanner",
        "StoreBranchInfo",
        "SupportTopic",
        "LocationSelection",
        "CustomerOrderDraft",
      ],
    },
    serviceModules: [
      {
        file: "src/lib/catalog.ts",
        domain: "Product Catalog & Category Filtering",
        exportedFunctions: ["categories", "productBreadcrumbs", "categoryProducts", "getAllCatalogProducts", "findCatalogProduct", "money"],
      },
      {
        file: "src/lib/deals-bestsellers.ts",
        domain: "Flash Deals, Bestsellers & Category Rollups",
        exportedFunctions: ["matchesCategory", "getDealsSnapshot", "getDealCategories", "getBestsellersSnapshot", "getScrapedCategoryProducts", "getAllScrapedProducts"],
      },
      {
        file: "src/lib/product-details.ts",
        domain: "Rich Product Specifications, Reviews & Comments",
        exportedFunctions: ["getRichProductDetail"],
      },
      {
        file: "src/lib/campaigns-location.ts",
        domain: "Campaign Banners, 63 Provinces/Districts & Demo History",
        exportedFunctions: ["VIETNAM_LOCATIONS", "getDemoOrderHistory", "getDemoBookingHistory", "getDemoLoyaltySummary", "getDemoUserProfile"],
      },
      {
        file: "src/lib/support-stores.ts",
        domain: "Store Locator, 350+ Branches, Warranty & CSKH FAQ",
        exportedFunctions: ["getStoreBranches", "getStoreCities", "getStoreDistricts", "filterStoreBranches", "getSupportCategories", "getSupportTopics", "getSupportTopicBySlug", "searchSupportTopics", "getWarrantyPolicyData", "lookupWarrantyDraft", "getFooterData"],
      },
      {
        file: "src/lib/clinic-services.ts",
        domain: "Clinic & Spa Medical Dermatology Services",
        exportedFunctions: ["clinicServices"],
      },
      {
        file: "src/lib/interactive-ui.ts",
        domain: "Data-Driven Interactive UI Config, Search Popup, Hover Mega Menu, Gift Bills & Multi-Branch Stock",
        exportedFunctions: [
          "getInteractiveUiData",
          "computeGiftBillPromo",
          "computeProductEnglishSubtitle",
          "searchCatalogLive",
        ],
      },
    ],
    repository: {
      file: "src/lib/server/db.ts",
      inMemoryCollections: ["orders", "appointments", "productFeedback", "warrantyClaims", "initialCatalogCache"],
      mutationMethods: [
        "createOrderRecord",
        "listOrderRecords",
        "findOrderById",
        "createBookingRecord",
        "listBookingRecords",
        "findBookingById",
        "addProductReviewOrComment",
        "getProductFeedback",
        "createWarrantyClaim",
        "lookupWarranty",
        "queryProducts",
      ],
    },
    apiEndpoints: [
      { path: "/api/products", methods: ["GET"], description: "Catalog queries with filtering, search, sorting, and faceted metadata" },
      { path: "/api/products/[slug]", methods: ["GET", "POST"], description: "Product detail inspection and review/comment submission" },
      { path: "/api/deals", methods: ["GET"], description: "Flash Deals with countdown, progress, and category tabs" },
      { path: "/api/bestsellers", methods: ["GET"], description: "Top ranking bestsellers with rank badges and category filters" },
      { path: "/api/orders", methods: ["GET", "POST"], description: "Order history listing and checkout submission" },
      { path: "/api/bookings", methods: ["GET", "POST"], description: "Clinic consultation listing and appointment booking" },
      { path: "/api/stores", methods: ["GET"], description: "Branch store locator with city, district, and clinic filters" },
      { path: "/api/warranty", methods: ["GET", "POST"], description: "Electronic warranty claim lookup and ticket registration" },
      { path: "/api/ui-config", methods: ["GET"], description: "Data-driven interactive UI config, Search Popup suggestions, 3-column Mega Menu, Gift Bills, and live ERP Multi-Branch stock" },
      { path: "/api/auth", methods: ["GET", "POST"], description: "Customer & Staff authentication, registration, and RBAC demo role switcher" },
      { path: "/api/admin/erp", methods: ["GET", "POST"], description: "Enterprise ERP management for Users, Staff/RBAC, Orders, and Multi-Branch Inventory" },
      { path: "/api/admin/seo", methods: ["GET", "POST"], description: "Technical SEO audit, JSON-LD schema generator, and Meta Registry" },
      { path: "/api/mcp", methods: ["GET", "POST"], description: "Standardized JSON-RPC 2.0 MCP Server with 9 tools, 4 resources, and 3 prompt templates" },
      { path: "/api/codegraph", methods: ["GET"], description: "System architectural dependency graph manifest" },
    ],
    frontendRoutes: [
      { path: "/", title: "Trang chủ Nari Home", dynamic: false },
      { path: "/deal-dau-ngay", title: "Flash Deals Giờ Vàng", dynamic: false },
      { path: "/ban-chay", title: "Top Bán Chạy", dynamic: false },
      { path: "/danh-muc/[category]", title: "Danh mục sản phẩm", dynamic: true },
      { path: "/san-pham/[slug]", title: "Chi tiết sản phẩm", dynamic: true },
      { path: "/thuong-hieu/[brand]", title: "Thương hiệu chính hãng", dynamic: true },
      { path: "/gio-hang", title: "Giỏ hàng", dynamic: false },
      { path: "/dat-hang", title: "Thanh toán đơn hàng", dynamic: false },
      { path: "/clinic", title: "Nari Clinic & Spa", dynamic: false },
      { path: "/booking", title: "Đặt hẹn Clinic", dynamic: false },
      { path: "/he-thong-cua-hang", title: "Hệ thống 350+ Cửa hàng", dynamic: false },
      { path: "/bao-hanh", title: "Tra cứu Bảo hành", dynamic: false },
      { path: "/ho-tro", title: "Trung tâm Hỗ trợ", dynamic: false },
      { path: "/tai-khoan", title: "Tài khoản người dùng", dynamic: false },
    ],
  };
}

// ----------------------------------------------------------------------
// Exported Database Stats for Monitoring
// ----------------------------------------------------------------------

export function getDatabaseStats(): {
  totalCatalogProducts: number;
  totalOrders: number;
  totalAppointments: number;
  totalStoreBranches: number;
  totalClinicServices: number;
  totalWarrantyClaims: number;
} {
  const store = getStore();
  return {
    totalCatalogProducts: getAllCatalogProducts().length,
    totalOrders: store.orders.length,
    totalAppointments: store.appointments.length,
    totalStoreBranches: getStoreBranches().length,
    totalClinicServices: clinicServices.length,
    totalWarrantyClaims: store.warrantyClaims.length,
  };
}
