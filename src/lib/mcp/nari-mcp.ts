/**
 * Nari Home Model Context Protocol (MCP) Server Engine
 * Standardized JSON-RPC 2.0 & REST-ready MCP server implementation.
 *
 * Exposes 12 domain tools, 4 resources, and 3 prompts connecting:
 * - Product catalog, rich details, deals & bestsellers
 * - Clinic services, price tables & booking engine
 * - Multi-branch inventory, ERP order processing & staff operations
 * - Store locator, warranty lookup, and technical SEO engine
 */

import {
  getAllCatalogProducts,
  categories,
  findCatalogProduct,
  money,
} from "@/lib/catalog";
import {
  getDealsSnapshot,
  getBestsellersSnapshot,
  matchesCategory,
} from "@/lib/deals-bestsellers";
import { getRichProductDetail } from "@/lib/product-details";
import { clinicServices } from "@/lib/clinic-services";
import {
  filterStoreBranches,
  lookupWarrantyDraft,
} from "@/lib/support-stores";
import {
  auditAllRoutesSeo,
  generateProductJsonLd,
} from "@/lib/seo/seo-engine";

// ----------------------------------------------------------------------
// MCP Protocol Types (Strictly Typed, Zero `any`)
// ----------------------------------------------------------------------

export interface McpToolInputSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }
  >;
  required?: string[];
}

export interface McpToolItem {
  name: string;
  description: string;
  inputSchema: McpToolInputSchema;
}

export interface McpResourceItem {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpPromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface McpPromptItem {
  name: string;
  description: string;
  arguments?: McpPromptArgument[];
}

export interface McpContentBlock {
  type: "text";
  text: string;
}

export interface McpCallResult {
  content: McpContentBlock[];
  isError?: boolean;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
  // REST fallback convenience fields
  tool?: string;
  arguments?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ----------------------------------------------------------------------
// In-Memory Enterprise Resource Planning (ERP) & Operational Store
// ----------------------------------------------------------------------

export interface InventoryItem {
  sku: string;
  name: string;
  brand: string;
  category: string;
  totalQuantity: number;
  branches: Record<string, number>;
  reorderLevel: number;
  unitCost: number;
  retailPrice: number;
  lastUpdated: string;
}

export interface ErpOrder {
  id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  branchFulfillment: string;
  isNariNow2H: boolean;
  paymentMethod: "COD" | "VNPAY" | "MOMO" | "BANK_TRANSFER";
  paymentStatus: "paid" | "unpaid";
  status: "pending" | "processing" | "shipping" | "delivered" | "cancelled";
  items: Array<{
    sku: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  staffNotes?: string;
}

export interface ErpUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  membershipTier: "Member" | "Silver" | "Gold" | "Diamond";
  points: number;
  totalOrders: number;
  spentAmount: number;
  joinedDate: string;
}

export interface ErpStaff {
  id: string;
  code: string;
  fullName: string;
  role: "manager" | "warehouse" | "clinic_doctor" | "sales_advisor" | "cs_agent";
  branch: string;
  phone: string;
  shift: "morning" | "afternoon" | "full_day";
  isActive: boolean;
}

export interface ClinicBookingRecord {
  bookingId: string;
  customerName: string;
  phone: string;
  serviceName: string;
  branchName: string;
  date: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

const initialInventory: InventoryItem[] = [];
const initialOrders: ErpOrder[] = [];
const initialUsers: ErpUser[] = [];
const initialStaff: ErpStaff[] = [
  {
    id: "STF-01",
    code: "NV-KHO-01",
    fullName: "Nguyễn Văn Hùng",
    role: "warehouse",
    branch: "Kho Tổng Bình Chánh",
    phone: "0934112233",
    shift: "morning",
    isActive: true,
  },
  {
    id: "STF-02",
    code: "BS-CLINIC-01",
    fullName: "BS. CKI Trần Thị Kim Oanh",
    role: "clinic_doctor",
    branch: "71 Hoàng Hoa Thám, Tân Bình",
    phone: "0934223344",
    shift: "full_day",
    isActive: true,
  },
  {
    id: "STF-03",
    code: "QL-STORE-01",
    fullName: "Võ Minh Đức",
    role: "manager",
    branch: "555 Đường 3 Tháng 2, Q.10",
    phone: "0934334455",
    shift: "full_day",
    isActive: true,
  },
  {
    id: "STF-04",
    code: "CS-NARI-01",
    fullName: "Phạm Thảo Vy",
    role: "cs_agent",
    branch: "Trụ Sở Chính Nari Home (Tổng đài 1800 6324)",
    phone: "18006324",
    shift: "morning",
    isActive: true,
  },
];
const initialBookings: ClinicBookingRecord[] = [];

const erpStore = {
  inventory: [...initialInventory],
  orders: [...initialOrders],
  users: [...initialUsers],
  staff: [...initialStaff],
  bookings: [...initialBookings],
};

// ----------------------------------------------------------------------
// 12 Standardized MCP Tools Definitions
// ----------------------------------------------------------------------

export const MCP_TOOLS: McpToolItem[] = [
  {
    name: "nari_search_products",
    description:
      "Tìm kiếm sản phẩm trong danh mục Nari Home theo từ khóa, ngành hàng, thương hiệu, mức giá và bộ lọc sắp xếp.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Từ khóa tên sản phẩm hoặc thương hiệu (ví dụ: 'Bioderma', 'CeraVe', 'sữa rửa mặt')",
        },
        category: {
          type: "string",
          description: "Slug danh mục (ví dụ: 'cham-soc-da-mat-c4.html', 'tay-trang-mat-c48.html')",
        },
        brand: { type: "string", description: "Tên thương hiệu chính xác hoặc viết tắt" },
        maxPrice: { type: "number", description: "Giá tối đa tính bằng VNĐ (ví dụ: 300000)" },
        sort: {
          type: "string",
          description: "Tiêu chí sắp xếp",
          enum: ["price_asc", "price_desc", "topsale", "rating"],
        },
        limit: { type: "number", description: "Số lượng kết quả trả về (mặc định: 10, tối đa: 50)" },
      },
    },
  },
  {
    name: "nari_get_product_detail",
    description:
      "Lấy chi tiết chuyên sâu sản phẩm Nari Home theo slug hoặc ID: thông số kỹ thuật, giá bán, mô tả, đánh giá và Schema.org Product JSON-LD.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug hoặc URL identifier của sản phẩm" },
      },
      required: ["slug"],
    },
  },
  {
    name: "nari_list_deals_and_bestsellers",
    description:
      "Tra cứu danh sách Flash Deals đang diễn ra (tiến độ bán, thời gian) hoặc bảng xếp hạng sản phẩm bán chạy nhất Nari Home.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Loại danh sách cần lấy",
          enum: ["deals", "bestsellers"],
          default: "deals",
        },
        category: { type: "string", description: "Lọc theo slug danh mục" },
        limit: { type: "number", description: "Số lượng mục cần lấy (mặc định: 12)" },
      },
      required: ["type"],
    },
  },
  {
    name: "nari_check_inventory",
    description:
      "Kiểm tra số lượng tồn kho đa chi nhánh (Kho tổng, chi nhánh HCM, Hà Nội, Đà Nẵng) của sản phẩm theo tên, SKU hoặc thương hiệu.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Mã SKU hoặc tên sản phẩm cần kiểm tra" },
        branch: { type: "string", description: "Tên chi nhánh cụ thể hoặc 'All'" },
      },
    },
  },
  {
    name: "nari_adjust_inventory",
    description:
      "Thực hiện điều chỉnh xuất nhập tồn kho ERP (ghi nhận nhập hàng mới, điều chuyển chi nhánh hoặc kiểm kê hao hụt).",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "Mã SKU sản phẩm" },
        delta: { type: "number", description: "Số lượng thay đổi (dương là nhập thêm, âm là xuất kho)" },
        reason: { type: "string", description: "Lý do điều chỉnh (nhập hàng, hao hụt, trả hàng...)" },
        staffCode: { type: "string", description: "Mã nhân viên thực hiện (ví dụ: 'NV-KHO-01')" },
      },
      required: ["sku", "delta", "reason", "staffCode"],
    },
  },
  {
    name: "nari_list_orders",
    description:
      "Tra cứu danh sách đơn hàng ERP Nari Home theo trạng thái (chờ duyệt, đang xử lý, NariNow 2H đang giao, hoàn tất) hoặc số điện thoại người mua.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Trạng thái đơn hàng",
          enum: ["all", "pending", "processing", "shipping", "delivered", "cancelled"],
        },
        phone: { type: "string", description: "Số điện thoại khách hàng cần tra cứu" },
      },
    },
  },
  {
    name: "nari_update_order_status",
    description:
      "Cập nhật trạng thái đơn hàng trong hệ thống ERP (chuyển sang đang giao NariNow 2H, hoàn tất hoặc hủy).",
    inputSchema: {
      type: "object",
      properties: {
        orderId: { type: "string", description: "Mã đơn hàng (ví dụ: 'ORD-1001' hoặc 'NARI-20261113-001')" },
        status: {
          type: "string",
          description: "Trạng thái mới",
          enum: ["pending", "processing", "shipping", "delivered", "cancelled"],
        },
        staffCode: { type: "string", description: "Mã nhân viên cập nhật" },
      },
      required: ["orderId", "status"],
    },
  },
  {
    name: "nari_manage_users",
    description:
      "Quản lý khách hàng thành viên Nari Rewards: tìm kiếm hồ sơ, kiểm tra điểm thưởng loyalty và tích điểm đơn hàng.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Hành động cần thực hiện",
          enum: ["list", "get", "add_points"],
          default: "list",
        },
        query: { type: "string", description: "Tên hoặc số điện thoại khách hàng" },
        userId: { type: "string", description: "Mã khách hàng" },
        points: { type: "number", description: "Số điểm cần cộng thêm (nếu action = add_points)" },
      },
      required: ["action"],
    },
  },
  {
    name: "nari_manage_staff",
    description:
      "Tra cứu thông tin đội ngũ nhân sự Nari Home (Bác sĩ da liễu Clinic, quản lý chi nhánh, nhân viên kho vận, CSKH tổng đài).",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description: "Vai trò nhân viên",
          enum: ["all", "manager", "warehouse", "clinic_doctor", "sales_advisor", "cs_agent"],
        },
        branch: { type: "string", description: "Lọc theo chi nhánh cụ thể" },
      },
    },
  },
  {
    name: "nari_clinic_services_and_booking",
    description:
      "Tra cứu bảng giá dịch vụ Nari Clinic & Spa (trị mụn, laser, triệt lông) và tạo đặt hẹn khám da với bác sĩ da liễu.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Hành động thực hiện",
          enum: ["search", "price_table", "book"],
          default: "search",
        },
        query: { type: "string", description: "Từ khóa dịch vụ (ví dụ: 'Aqua Mesoderm', 'Triệt lông nách')" },
        customerName: { type: "string", description: "Họ tên khách hàng (nếu book)" },
        phone: { type: "string", description: "Số điện thoại liên hệ (nếu book)" },
        serviceName: { type: "string", description: "Tên dịch vụ muốn đặt hẹn" },
        branchName: { type: "string", description: "Chi nhánh Clinic mong muốn" },
        date: { type: "string", description: "Ngày hẹn (YYYY-MM-DD)" },
        time: { type: "string", description: "Khung giờ hẹn (ví dụ: '14:30')" },
      },
      required: ["action"],
    },
  },
  {
    name: "nari_find_stores_and_warranty",
    description:
      "Tìm kiếm chi nhánh trong hệ thống cửa hàng Nari Home toàn quốc hoặc tra cứu kích hoạt bảo hành thiết bị chính hãng.",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "Tỉnh/Thành phố (ví dụ: 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng')" },
        district: { type: "string", description: "Quận/Huyện" },
        hasClinic: { type: "boolean", description: "Chỉ tìm chi nhánh có dịch vụ Clinic & Spa" },
        warrantyQuery: { type: "string", description: "Số điện thoại mua hàng hoặc số serial máy cần tra cứu bảo hành" },
      },
    },
  },
  {
    name: "nari_seo_and_codegraph",
    description:
      "Kiểm toán kỹ thuật SEO toàn diện cho các route Nari Home, tạo Schema.org JSON-LD chuẩn xác hoặc trích xuất bản đồ CodeGraph dự án.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Tác vụ SEO/CodeGraph",
          enum: ["seo_audit", "product_jsonld", "codegraph_map"],
          default: "seo_audit",
        },
        slugOrPath: { type: "string", description: "Đường dẫn route hoặc slug sản phẩm" },
      },
      required: ["action"],
    },
  },
];

// ----------------------------------------------------------------------
// 4 MCP Resources Definitions
// ----------------------------------------------------------------------

export const MCP_RESOURCES: McpResourceItem[] = [
  {
    uri: "nari://catalog/overview",
    name: "Nari Home Product Catalog Overview",
    description:
      "Tổng quan toàn bộ danh mục sản phẩm, 36 ngành hàng chính, thương hiệu phân phối và chỉ số hàng đầu của Nari Home.",
    mimeType: "text/markdown",
  },
  {
    uri: "nari://erp/summary",
    name: "Nari Home ERP & Logistics Operations Summary",
    description:
      "Báo cáo thời gian thực về tồn kho đa chi nhánh, trạng thái đơn hàng NariNow 2H, nhân sự vận hành và năng lực kho bãi.",
    mimeType: "text/markdown",
  },
  {
    uri: "nari://seo/audit-report",
    name: "Nari Home Technical SEO & Structured Data Audit",
    description:
      "Báo cáo kiểm toán kỹ thuật SEO, chỉ số index Google, độ bao phủ Schema.org và trạng thái robots.txt / sitemap.xml.",
    mimeType: "application/json",
  },
  {
    uri: "nari://codegraph/architecture",
    name: "Nari Home CodeGraph Architecture Blueprint",
    description:
      "Bản đồ liên kết mã nguồn CodeGraph: Từ giao diện người dùng Next.js App Router đến adapter dịch vụ và điểm tích hợp MCP.",
    mimeType: "text/markdown",
  },
];

// ----------------------------------------------------------------------
// 3 MCP Prompts Definitions
// ----------------------------------------------------------------------

export const MCP_PROMPTS: McpPromptItem[] = [
  {
    name: "nari-beauty-consultant",
    description:
      "Chuyên gia tư vấn mỹ phẩm & da liễu Nari Home - phân tích tình trạng da, đề xuất routine và sản phẩm phù hợp ngân sách.",
    arguments: [
      { name: "skinType", description: "Loại da (da dầu, da khô, da hỗn hợp, da nhạy cảm)", required: true },
      { name: "concern", description: "Vấn đề cần điều trị (mụn, thâm nám, lỗ chân lông to, lão hóa)", required: true },
      { name: "budget", description: "Ngân sách dự kiến (ví dụ: dưới 500k, 1 triệu - 2 triệu)" },
    ],
  },
  {
    name: "nari-warehouse-order-ops",
    description:
      "Trợ lý vận hành kho vận & xử lý đơn hàng Nari Home ERP - hỗ trợ điều phối NariNow 2H, kiểm kê tồn kho và cập nhật đơn hàng.",
    arguments: [
      { name: "task", description: "Nhiệm vụ (kiểm kê, xuất kho, duyệt giao 2H, xử lý khiếu nại)", required: true },
      { name: "orderId", description: "Mã đơn hàng liên quan" },
      { name: "branch", description: "Chi nhánh phụ trách" },
    ],
  },
  {
    name: "nari-seo-auditor",
    description:
      "Chuyên gia kiểm toán kỹ thuật SEO & dữ liệu có cấu trúc Schema.org cho sàn thương mại điện tử Nari Home.",
    arguments: [
      { name: "path", description: "Đường dẫn trang cần phân tích SEO", required: true },
      { name: "targetKeyword", description: "Từ khóa SEO mục tiêu" },
    ],
  },
];

// ----------------------------------------------------------------------
// Tool Executors (12 Tools)
// ----------------------------------------------------------------------

export async function executeMcpTool(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<McpCallResult> {
  try {
    switch (toolName) {
      case "nari_search_products": {
        const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : "";
        const category = typeof args.category === "string" ? args.category.trim() : "";
        const brand = typeof args.brand === "string" ? args.brand.toLowerCase().trim() : "";
        const maxPrice = typeof args.maxPrice === "number" ? args.maxPrice : undefined;
        const sort = typeof args.sort === "string" ? args.sort : undefined;
        const limit = typeof args.limit === "number" && args.limit > 0 ? Math.min(args.limit, 50) : 10;

        let results = getAllCatalogProducts();

        if (query) {
          results = results.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.brand.toLowerCase().includes(query) ||
              p.slug.toLowerCase().includes(query)
          );
        }

        if (category) {
          results = results.filter((p) => matchesCategory(p.category, category));
        }

        if (brand) {
          results = results.filter((p) => p.brand.toLowerCase().includes(brand));
        }

        if (maxPrice !== undefined) {
          results = results.filter((p) => p.price <= maxPrice);
        }

        if (sort === "price_asc") {
          results = [...results].sort((a, b) => a.price - b.price);
        } else if (sort === "price_desc") {
          results = [...results].sort((a, b) => b.price - a.price);
        } else if (sort === "topsale") {
          results = [...results].sort((a, b) => (b.sold || 0) - (a.sold || 0));
        } else if (sort === "rating") {
          results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        const paginated = results.slice(0, limit);
        const formatted = paginated.map((p) => ({
          name: p.name,
          brand: p.brand,
          priceFormatted: money(p.price),
          price: p.price,
          oldPriceFormatted: money(p.old),
          discountPercent: p.sale > 0 ? `-${p.sale}%` : "0%",
          rating: p.rating || 4.9,
          reviewCount: p.reviewCount || 0,
          sold: p.sold || 0,
          slug: p.slug,
          category: p.category,
          productUrl: `https://narihome.vn/san-pham/${p.slug}`,
          image: p.image,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalMatches: results.length,
                  returnedCount: paginated.length,
                  filtersApplied: { query, category, brand, maxPrice, sort, limit },
                  products: formatted,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_get_product_detail": {
        const slug = typeof args.slug === "string" ? args.slug.trim() : "";
        if (!slug) {
          return {
            content: [{ type: "text", text: "Error: Missing required parameter 'slug'" }],
            isError: true,
          };
        }

        const rich = getRichProductDetail(slug);
        const catalogItem = findCatalogProduct(slug);

        if (!rich && !catalogItem) {
          return {
            content: [{ type: "text", text: `Product not found for slug: "${slug}"` }],
            isError: true,
          };
        }

        const base = rich || catalogItem;
        if (!base) {
          return { content: [{ type: "text", text: "Product not found" }], isError: true };
        }

        const schemaJsonLd = generateProductJsonLd(base);

        const responsePayload = {
          product: {
            ...base,
            priceFormatted: money(base.price),
            oldPriceFormatted: money(base.old),
            url: `https://narihome.vn/san-pham/${base.slug}`,
          },
          structuredDataSchema: schemaJsonLd,
        };

        return {
          content: [{ type: "text", text: JSON.stringify(responsePayload, null, 2) }],
        };
      }

      case "nari_list_deals_and_bestsellers": {
        const type = typeof args.type === "string" ? args.type : "deals";
        const category = typeof args.category === "string" ? args.category.trim() : "";
        const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 12;

        if (type === "deals") {
          let deals = getDealsSnapshot();
          if (category) {
            deals = deals.filter((d) => matchesCategory(d.category, category));
          }
          const paginated = deals.slice(0, limit).map((d) => ({
            name: d.name,
            brand: d.brand,
            price: d.price,
            priceFormatted: money(d.price),
            oldPrice: d.old,
            discount: `-${d.sale}%`,
            soldProgress: `${d.progress || 50}%`,
            slug: d.slug,
            productUrl: `https://narihome.vn/san-pham/${d.slug}`,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    type: "Flash Deals",
                    totalDeals: deals.length,
                    returned: paginated.length,
                    deals: paginated,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          let bestsellers = getBestsellersSnapshot();
          if (category) {
            bestsellers = bestsellers.filter((b) => matchesCategory(b.category, category));
          }
          const paginated = bestsellers.slice(0, limit).map((b) => ({
            rank: b.rank,
            badge: b.badge,
            name: b.name,
            brand: b.brand,
            priceFormatted: money(b.price),
            slug: b.slug,
            productUrl: `https://narihome.vn/san-pham/${b.slug}`,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    type: "Bestsellers",
                    totalBestsellers: bestsellers.length,
                    returned: paginated.length,
                    bestsellers: paginated,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case "nari_check_inventory": {
        const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : "";
        const branch = typeof args.branch === "string" ? args.branch.toLowerCase().trim() : "";

        let items = erpStore.inventory;
        if (query) {
          items = items.filter(
            (i) =>
              i.sku.toLowerCase().includes(query) ||
              i.name.toLowerCase().includes(query) ||
              i.brand.toLowerCase().includes(query)
          );
        }

        const report = items.map((item) => {
          let branchBreakdown = item.branches;
          if (branch && branch !== "all") {
            const filtered: Record<string, number> = {};
            for (const [bName, count] of Object.entries(item.branches)) {
              if (bName.toLowerCase().includes(branch)) {
                filtered[bName] = count;
              }
            }
            branchBreakdown = filtered;
          }

          return {
            sku: item.sku,
            name: item.name,
            brand: item.brand,
            totalStock: item.totalQuantity,
            status: item.totalQuantity > item.reorderLevel ? "in_stock" : "low_stock",
            reorderThreshold: item.reorderLevel,
            retailPrice: money(item.retailPrice),
            branches: branchBreakdown,
            lastUpdated: item.lastUpdated,
          };
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalTrackedItems: items.length,
                  inventoryReport: report,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_adjust_inventory": {
        const sku = typeof args.sku === "string" ? args.sku.trim() : "";
        const delta = typeof args.delta === "number" ? args.delta : 0;
        const reason = typeof args.reason === "string" ? args.reason : "Cập nhật tồn kho định kỳ";
        const staffCode = typeof args.staffCode === "string" ? args.staffCode : "NV-AUTO";

        if (!sku || delta === 0) {
          return {
            content: [{ type: "text", text: "Error: Missing valid 'sku' or non-zero 'delta'" }],
            isError: true,
          };
        }

        const item = erpStore.inventory.find((i) => i.sku === sku);
        if (!item) {
          return {
            content: [{ type: "text", text: `Error: SKU "${sku}" not found in ERP inventory` }],
            isError: true,
          };
        }

        const previousQuantity = item.totalQuantity;
        item.totalQuantity = Math.max(0, item.totalQuantity + delta);
        item.lastUpdated = new Date().toISOString();

        const mainWhKey = "Kho Tổng Bình Chánh";
        if (item.branches[mainWhKey] !== undefined) {
          item.branches[mainWhKey] = Math.max(0, item.branches[mainWhKey] + delta);
        }

        const auditRecord = {
          sku,
          productName: item.name,
          delta,
          previousQuantity,
          newQuantity: item.totalQuantity,
          reason,
          staffCode,
          timestamp: item.lastUpdated,
          status: "success",
        };

        return {
          content: [{ type: "text", text: JSON.stringify(auditRecord, null, 2) }],
        };
      }

      case "nari_list_orders": {
        const status = typeof args.status === "string" ? args.status : "all";
        const phone = typeof args.phone === "string" ? args.phone.trim() : "";

        let orders = erpStore.orders;
        if (status && status !== "all") {
          orders = orders.filter((o) => o.status === status);
        }
        if (phone) {
          orders = orders.filter((o) => o.phone.includes(phone));
        }

        const formatted = orders.map((o) => ({
          orderId: o.id,
          orderCode: o.orderCode,
          customerName: o.customerName,
          phone: o.phone,
          isNariNow2H: o.isNariNow2H,
          status: o.status,
          payment: `${o.paymentMethod} (${o.paymentStatus})`,
          itemsCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
          totalAmount: money(o.totalAmount),
          createdAt: o.createdAt,
          staffNotes: o.staffNotes,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalOrders: orders.length,
                  orders: formatted,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_update_order_status": {
        const orderId = typeof args.orderId === "string" ? args.orderId.trim() : "";
        const status = typeof args.status === "string" ? args.status : "";
        const staffCode = typeof args.staffCode === "string" ? args.staffCode : "NV-OPERATIONS";

        const order = erpStore.orders.find((o) => o.id === orderId || o.orderCode === orderId);
        if (!order) {
          return {
            content: [{ type: "text", text: `Error: Order "${orderId}" not found` }],
            isError: true,
          };
        }

        const previousStatus = order.status;
        order.status = status as ErpOrder["status"];
        order.updatedAt = new Date().toISOString();
        order.staffNotes = `${order.staffNotes || ""} | [${order.updatedAt}] Cập nhật bởi ${staffCode}: ${previousStatus} -> ${status}`;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  message: `Đơn hàng ${order.orderCode} đã được cập nhật thành công`,
                  orderId: order.id,
                  orderCode: order.orderCode,
                  previousStatus,
                  currentStatus: order.status,
                  updatedAt: order.updatedAt,
                  staffNotes: order.staffNotes,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_manage_users": {
        const action = typeof args.action === "string" ? args.action : "list";
        const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : "";
        const userId = typeof args.userId === "string" ? args.userId.trim() : "";
        const pointsToAdd = typeof args.points === "number" ? args.points : 0;

        if (action === "list") {
          let users = erpStore.users;
          if (query) {
            users = users.filter((u) => u.name.toLowerCase().includes(query) || u.phone.includes(query));
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ totalUsers: users.length, users }, null, 2),
              },
            ],
          };
        }

        if (action === "get") {
          const user = erpStore.users.find((u) => u.id === userId || u.phone === query);
          if (!user) {
            return { content: [{ type: "text", text: "Error: User not found" }], isError: true };
          }
          return { content: [{ type: "text", text: JSON.stringify(user, null, 2) }] };
        }

        if (action === "add_points") {
          const user = erpStore.users.find((u) => u.id === userId || u.phone === query);
          if (!user) {
            return { content: [{ type: "text", text: "Error: User not found" }], isError: true };
          }
          user.points += pointsToAdd;
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    message: `Cộng thành công ${pointsToAdd} điểm cho khách hàng ${user.name}`,
                    user,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return { content: [{ type: "text", text: "Unknown action for nari_manage_users" }], isError: true };
      }

      case "nari_manage_staff": {
        const role = typeof args.role === "string" ? args.role : "all";
        const branch = typeof args.branch === "string" ? args.branch.toLowerCase().trim() : "";

        let staffList = erpStore.staff;
        if (role && role !== "all") {
          staffList = staffList.filter((s) => s.role === role);
        }
        if (branch) {
          staffList = staffList.filter((s) => s.branch.toLowerCase().includes(branch));
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalStaff: staffList.length,
                  staff: staffList,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_clinic_services_and_booking": {
        const action = typeof args.action === "string" ? args.action : "search";
        const query = typeof args.query === "string" ? args.query.toLowerCase().trim() : "";

        if (action === "search") {
          let list = clinicServices;
          if (query) {
            list = list.filter(
              (s) =>
                s.name.toLowerCase().includes(query) ||
                (s.description && s.description.toLowerCase().includes(query))
            );
          }
          const formatted = list.map((s) => ({
            name: s.name,
            slug: s.slug,
            price: s.price,
            duration: s.duration,
            bookingUrl: `https://narihome.vn${s.booking}`,
            detailUrl: `https://narihome.vn/dich-vu/${s.slug}`,
            description: s.description,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    totalServices: list.length,
                    services: formatted,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (action === "price_table") {
          const categorized: Record<
            string,
            Array<{ name: string; price: string | number; duration?: string }>
          > = {
            "Triệt Lông Diode Laser": [],
            "Điều Trị Mụn & Chăm Sóc Da": [],
            "Trẻ Hóa & Thẩm Mỹ Công Nghệ Cao": [],
            "Dịch Vụ Khác": [],
          };

          for (const s of clinicServices) {
            const entry = { name: s.name, price: s.price || "Liên hệ tư vấn", duration: s.duration };
            if (s.name.toLowerCase().includes("triệt lông")) {
              categorized["Triệt Lông Diode Laser"].push(entry);
            } else if (s.name.toLowerCase().includes("mụn") || s.name.toLowerCase().includes("meso")) {
              categorized["Điều Trị Mụn & Chăm Sóc Da"].push(entry);
            } else if (
              s.name.toLowerCase().includes("hifu") ||
              s.name.toLowerCase().includes("laser") ||
              s.name.toLowerCase().includes("trẻ hóa")
            ) {
              categorized["Trẻ Hóa & Thẩm Mỹ Công Nghệ Cao"].push(entry);
            } else {
              categorized["Dịch Vụ Khác"].push(entry);
            }
          }

          return {
            content: [{ type: "text", text: JSON.stringify(categorized, null, 2) }],
          };
        }

        if (action === "book") {
          const customerName =
            typeof args.customerName === "string" ? args.customerName.trim() : "Khách hàng Nari Home";
          const phone = typeof args.phone === "string" ? args.phone.trim() : "";
          const serviceName =
            typeof args.serviceName === "string" ? args.serviceName.trim() : "Khám & Tư Vấn Da Liễu";
          const branchName =
            typeof args.branchName === "string"
              ? args.branchName.trim()
              : "71 Hoàng Hoa Thám, P.Tân Bình, TP.HCM";
          const date = typeof args.date === "string" ? args.date.trim() : "2026-11-15";
          const time = typeof args.time === "string" ? args.time.trim() : "10:00";

          if (!phone) {
            return {
              content: [{ type: "text", text: "Error: Missing required phone number for clinic booking" }],
              isError: true,
            };
          }

          const bookingId = `NARI-CLN-${Date.now().toString().slice(-6)}`;
          const newBooking: ClinicBookingRecord = {
            bookingId,
            customerName,
            phone,
            serviceName,
            branchName,
            date,
            time,
            status: "confirmed",
            createdAt: new Date().toISOString(),
          };

          erpStore.bookings.push(newBooking);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    message: "Đặt lịch hẹn Nari Clinic & Spa thành công!",
                    bookingDetails: newBooking,
                    instructions:
                      "Quý khách vui lòng đến trước 10 phút. Bác sĩ chuyên khoa da liễu sẽ trực tiếp thăm khám và soi da miễn phí.",
                    hotline: "1800 6324 (Phím 2)",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [{ type: "text", text: "Unknown action for nari_clinic_services_and_booking" }],
          isError: true,
        };
      }

      case "nari_find_stores_and_warranty": {
        const warrantyQuery =
          typeof args.warrantyQuery === "string" ? args.warrantyQuery.trim() : "";
        if (warrantyQuery) {
          const warrantyResult = lookupWarrantyDraft(warrantyQuery);
          return {
            content: [{ type: "text", text: JSON.stringify(warrantyResult, null, 2) }],
          };
        }

        const city = typeof args.city === "string" ? args.city : undefined;
        const district = typeof args.district === "string" ? args.district : undefined;
        const hasClinic = typeof args.hasClinic === "boolean" ? args.hasClinic : undefined;

        const branches = filterStoreBranches({ city, district, hasClinic });
        const formatted = branches.map((b) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          city: b.city,
          district: b.district,
          phone: b.phone || "1800 6324",
          hours: b.hours,
          hasClinic: b.hasClinic,
          googleMapsUrl: b.mapUrl,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalBranchesFound: branches.length,
                  branches: formatted,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "nari_seo_and_codegraph": {
        const action = typeof args.action === "string" ? args.action : "seo_audit";
        const slugOrPath = typeof args.slugOrPath === "string" ? args.slugOrPath.trim() : "";

        if (action === "seo_audit") {
          const audit = auditAllRoutesSeo();
          return {
            content: [{ type: "text", text: JSON.stringify(audit, null, 2) }],
          };
        }

        if (action === "product_jsonld") {
          const product = findCatalogProduct(slugOrPath) || getAllCatalogProducts()[0];
          if (!product) {
            return {
              content: [{ type: "text", text: "No live catalog product found for JSON-LD generation" }],
              isError: true,
            };
          }
          const jsonLd = generateProductJsonLd(product);
          return {
            content: [{ type: "text", text: JSON.stringify(jsonLd, null, 2) }],
          };
        }

        if (action === "codegraph_map") {
          const codeGraphSummary = {
            project: "Nari Home Architecture Graph",
            version: "2026.11.18",
            architecture: {
              framework: "Next.js 16 (App Router) + React 19 + Tailwind CSS v4",
              contractsLayer: "src/lib/backend-contracts.ts",
              catalogService: "src/lib/catalog.ts (36 categories, live catalog products)",
              dealsAndBestsellers: "src/lib/deals-bestsellers.ts (Live deals & bestsellers engine)",
              productDetails: "src/lib/product-details.ts (Rich attributes, reviews, comments)",
              clinicServices: "src/lib/clinic-services.ts (Clinic procedures & booking contracts)",
              supportAndStores: "src/lib/support-stores.ts (Stores, warranty lookup, FAQ)",
              technicalSeo: "src/lib/seo/seo-engine.ts (Schema.org JSON-LD, automated audits)",
              mcpServer: "src/lib/mcp/nari-mcp.ts & src/app/api/mcp/route.ts (12 tools, 4 resources, 3 prompts)",
            },
            verifiedEndpoints: [
              "/api/mcp (JSON-RPC 2.0 & REST MCP Server)",
              "/api/admin/seo (Automated Technical SEO Audit & Overrides)",
              "/sitemap.xml (Dynamic multi-entity XML sitemap)",
              "/robots.txt (Crawler directives & security boundaries)",
            ],
          };

          return {
            content: [{ type: "text", text: JSON.stringify(codeGraphSummary, null, 2) }],
          };
        }

        return { content: [{ type: "text", text: "Unknown action for nari_seo_and_codegraph" }], isError: true };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown MCP Tool: "${toolName}"` }],
          isError: true,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Tool Execution Error";
    return {
      content: [{ type: "text", text: `Tool error [${toolName}]: ${message}` }],
      isError: true,
    };
  }
}

// ----------------------------------------------------------------------
// MCP Resource Readers (4 Resources)
// ----------------------------------------------------------------------

export function readMcpResource(
  uri: string
): { uri: string; mimeType: string; text: string } | null {
  switch (uri) {
    case "nari://catalog/overview": {
      const allProducts = getAllCatalogProducts();
      const text = [
        "# Nari Home Product Catalog Overview",
        "",
        `- **Tổng số sản phẩm**: ${allProducts.length} sản phẩm`,
        `- **Số ngành hàng**: ${categories.length} danh mục cấp 1 & cấp 2`,
        "- **Thương hiệu nổi bật**: La Roche-Posay, Bioderma, CeraVe, Anker, Cocoon, Skin1004, Klairs, Hada Labo, L'Oreal",
        "- **Chính sách**: 100% chính hãng, đền bù 200% nếu phát hiện hàng giả, giao nhanh 2H NariNow miễn phí từ 90K.",
        "",
        "## Danh Sách 36 Ngành Hàng Chính",
        categories.map(([name, slug]) => `- **${name}**: \`/danh-muc/${slug}\``).join("\n"),
      ].join("\n");

      return { uri, mimeType: "text/markdown", text };
    }

    case "nari://erp/summary": {
      const totalStock = erpStore.inventory.reduce((acc, i) => acc + i.totalQuantity, 0);
      const ordersCount = erpStore.orders.length;
      const text = [
        "# Nari Home ERP & Logistics Operations Summary",
        "",
        "## Chỉ Số Kho Vận Tổng Hợp",
        `- **Tổng SKU theo dõi**: ${erpStore.inventory.length} mã`,
        `- **Tổng sản phẩm tồn kho**: ${totalStock.toLocaleString("vi-VN")} đơn vị`,
        "- **Kho trung tâm**: Kho Tổng Bình Chánh (1.200m²)",
        `- **Đơn hàng xử lý trong ngày**: ${ordersCount} đơn hàng`,
        `- **Nhân sự trực ca**: ${erpStore.staff.filter((s) => s.isActive).length} nhân viên`,
        "",
        "## Đơn Hàng Gần Nhất",
        erpStore.orders
          .map((o) => `- **${o.orderCode}** (${o.customerName}) - Trạng thái: ${o.status.toUpperCase()} - ${money(o.totalAmount)}`)
          .join("\n"),
      ].join("\n");

      return { uri, mimeType: "text/markdown", text };
    }

    case "nari://seo/audit-report": {
      const audit = auditAllRoutesSeo();
      return {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(audit, null, 2),
      };
    }

    case "nari://codegraph/architecture": {
      const text = [
        "# Nari Home CodeGraph Architecture Blueprint",
        "",
        "## Central Contracts Layer",
        "- `src/lib/backend-contracts.ts`: Canonical domain models (`ProductSummary`, `ProductDetailData`, `StoreBranchInfo`, `SupportTopic`, `CustomerOrderDraft`)",
        "",
        "## Data & Domain Services",
        "- `src/lib/catalog.ts`: Core catalog & category tree rollup",
        "- `src/lib/deals-bestsellers.ts`: Flash deals & bestsellers engine",
        "- `src/lib/product-details.ts`: Rich specs, attributes & rating breakdowns",
        "- `src/lib/clinic-services.ts`: Clinical procedures & booking contracts",
        "- `src/lib/support-stores.ts`: Stores, warranty claims & customer support",
        "",
        "## SEO & MCP Servers",
        "- `src/lib/seo/seo-engine.ts`: Automated route audit & Schema.org JSON-LD generator",
        "- `src/lib/mcp/nari-mcp.ts`: Complete MCP specification (12 tools, 4 resources, 3 prompts)",
        "- `src/app/api/mcp/route.ts`: JSON-RPC 2.0 endpoint for AI agents",
      ].join("\n");

      return { uri, mimeType: "text/markdown", text };
    }

    default:
      return null;
  }
}

// ----------------------------------------------------------------------
// MCP Prompt Provider (3 Prompts)
// ----------------------------------------------------------------------

export function getMcpPrompt(
  name: string,
  args: Record<string, string> = {}
): {
  description: string;
  messages: Array<{ role: "system" | "user"; content: { type: "text"; text: string } }>;
} | null {
  switch (name) {
    case "nari-beauty-consultant": {
      const skinType = args.skinType || "da dầu nhạy cảm";
      const concern = args.concern || "mụn và thâm mụn";
      const budget = args.budget || "dưới 1 triệu VNĐ";

      return {
        description: "Chuyên gia tư vấn mỹ phẩm & da liễu Nari Home",
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "Bạn là Dược sĩ & Chuyên gia tư vấn làm đẹp cao cấp tại Nari Home Beauty & Clinic. Hãy phân tích khoa học tình trạng da của khách hàng, giải thích hoạt chất phù hợp (BHA, Niacinamide, Hyaluronic Acid, Centella...) và xây dựng chu trình Skincare sáng/tối với các sản phẩm chính hãng có sẵn tại Nari Home.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Tôi có loại da là ${skinType}, đang gặp vấn đề ${concern}. Ngân sách dự kiến của tôi là ${budget}. Vui lòng gợi ý routine hoàn chỉnh và các sản phẩm Nari Home chính hãng phù hợp.`,
            },
          },
        ],
      };
    }

    case "nari-warehouse-order-ops": {
      const task = args.task || "Điều phối giao nhanh NariNow 2H";
      const orderId = args.orderId || "NARI-20261113-001";
      const branch = args.branch || "71 Hoàng Hoa Thám, Tân Bình";

      return {
        description: "Trợ lý vận hành kho vận & xử lý đơn hàng Nari Home ERP",
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "Bạn là Trưởng ca điều phối kho vận Nari Home ERP. Bạn chịu trách nhiệm giám sát luồng đơn hàng NariNow 2H, kiểm soát tồn kho đa chi nhánh, cảnh báo ngưỡng reorder và đảm bảo cam kết SLA giao hàng.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Yêu cầu vận hành: Thực hiện nhiệm vụ "${task}" cho đơn hàng "${orderId}" tại chi nhánh "${branch}". Hãy kiểm tra tồn kho và xác nhận quy trình xử lý.`,
            },
          },
        ],
      };
    }

    case "nari-seo-auditor": {
      const path = args.path || "/";
      const targetKeyword = args.targetKeyword || "mỹ phẩm chính hãng";

      return {
        description: "Chuyên gia kiểm toán kỹ thuật SEO & dữ liệu có cấu trúc Schema.org",
        messages: [
          {
            role: "system",
            content: {
              type: "text",
              text: "Bạn là Chuyên gia Kỹ thuật SEO hàng đầu cho sàn thương mại điện tử Nari Home. Bạn phân tích thẻ Meta, Schema.org JSON-LD (Product, Organization, MedicalBusiness), tốc độ Core Web Vitals và cấu trúc liên kết nội bộ theo tiêu chuẩn Google Search Central.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Hãy tiến hành kiểm toán SEO kỹ thuật toàn diện cho trang "${path}" với từ khóa mục tiêu "${targetKeyword}". Đề xuất phương án tối ưu hóa thẻ meta và Schema.org tương ứng.`,
            },
          },
        ],
      };
    }

    default:
      return null;
  }
}

// ----------------------------------------------------------------------
// JSON-RPC 2.0 Dispatcher Core
// ----------------------------------------------------------------------

export async function handleMcpJsonRpc(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = request.id !== undefined ? request.id : null;
  const method = request.method || (request.tool ? "tools/call" : "");

  if (request.tool && !request.method) {
    const callResult = await executeMcpTool(request.tool, request.arguments || {});
    return {
      jsonrpc: "2.0",
      id,
      result: callResult,
    };
  }

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: {
            name: "nari-mcp-server",
            version: "1.0.0",
            description: "Official Nari Home Model Context Protocol Server for AI Agents",
          },
        },
      };

    case "ping":
      return {
        jsonrpc: "2.0",
        id,
        result: {},
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };

    case "tools/call": {
      const params = request.params || {};
      const toolName = typeof params.name === "string" ? params.name : "";
      const toolArgs = (params.arguments as Record<string, unknown>) || {};

      if (!toolName) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: 'name' is required for tools/call" },
        };
      }

      const callResult = await executeMcpTool(toolName, toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: callResult,
      };
    }

    case "resources/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          resources: MCP_RESOURCES,
        },
      };

    case "resources/read": {
      const params = request.params || {};
      const uri = typeof params.uri === "string" ? params.uri : "";
      if (!uri) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: 'uri' is required for resources/read" },
        };
      }

      const resource = readMcpResource(uri);
      if (!resource) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Resource not found: "${uri}"` },
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        result: {
          contents: [resource],
        },
      };
    }

    case "prompts/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          prompts: MCP_PROMPTS,
        },
      };

    case "prompts/get": {
      const params = request.params || {};
      const name = typeof params.name === "string" ? params.name : "";
      const promptArgs = (params.arguments as Record<string, string>) || {};

      if (!name) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: 'name' is required for prompts/get" },
        };
      }

      const prompt = getMcpPrompt(name, promptArgs);
      if (!prompt) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Prompt not found: "${name}"` },
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        result: prompt,
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: "${method}"` },
      };
  }
}
