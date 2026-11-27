"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  ImageIcon,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Upload,
  X,
} from "lucide-react";
import type {
  LiveCatalogOverridesState,
  LiveProductOverride,
  ManagedCatalogProduct,
} from "@/lib/live-catalog";
import { AdminBannerEditor } from "@/components/sites/nari/admin-banner-editor";
import { AdminTableSkeleton } from "@/components/sites/nari/ui-skeletons";
import {
  BackofficeShell,
  type BackofficeNavGroup,
} from "@/components/sites/nari/portal/backoffice-shell";
import {
  EmptyStateCard,
  KpiStatCard,
  PortalPageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/sites/nari/portal/portal-ui";
import { cn } from "@/lib/utils";

type ManagedProduct = ManagedCatalogProduct;
type PageTab = "products" | "references" | "banners";
type DrawerTab = "basic" | "media" | "details";

interface CategoryOption {
  id: string;
  label: string;
  slug: string;
}

interface CatalogResponse {
  ok?: boolean;
  error?: string;
  products?: ManagedProduct[];
  categories?: CategoryOption[];
  brands?: CategoryOption[];
  product?: LiveProductOverride;
  url?: string;
  deletedSlugs?: string[];
  banners?: LiveCatalogOverridesState["banners"];
  reference?: CategoryOption;
}

const emptyProduct = {
  id: "",
  expectedUpdatedAt: "",
  brandId: "",
  categoryId: "",
  sku: "",
  slug: "",
  name: "",
  brand: "",
  category: "",
  price: "",
  old: "",
  image: "",
  description: "",
  englishName: "",
  imagesText: "",
  overviewHtml: "",
  ingredientsHtml: "",
  usageHtml: "",
  specsText: "",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 px-3.5 py-2 text-sm text-[#1e1b18] placeholder:text-[#9c877a] transition focus:border-[#b86b4b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b86b4b]/15 disabled:cursor-not-allowed disabled:bg-[#f6ece3]/70 disabled:text-[#7c685c]";

const ADMIN_PRODUCTS_NAV_GROUPS: BackofficeNavGroup[] = [
  {
    title: "Vận hành",
    items: [
      { id: "dashboard", label: "Tổng quan ERP", href: "/quan-tri", icon: "dashboard" },
      { id: "orders", label: "Đơn hàng Fulfillment", href: "/quan-tri?tab=orders", icon: "orders" },
      { id: "inventory", label: "Tồn kho chi nhánh", href: "/quan-tri?tab=inventory", icon: "inventory" },
      {
        id: "products",
        label: "Quản lý sản phẩm & Banner",
        href: "/quan-tri/san-pham",
        icon: "products",
        active: true,
      },
    ],
  },
  {
    title: "Khách hàng & Tổ chức",
    items: [
      { id: "users", label: "Khách hàng CRM", href: "/quan-tri?tab=users", icon: "users" },
      { id: "staff", label: "Nhân sự & Chi nhánh", href: "/quan-tri?tab=staff", icon: "staff" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { id: "mcp", label: "SEO & MCP", href: "/quan-tri?tab=mcp", icon: "mcp" },
      { id: "staff-portal", label: "Cổng nhân viên", href: "/nhan-vien", icon: "store" },
    ],
  },
];

async function requestCatalog(url: string, init?: RequestInit): Promise<CatalogResponse> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data: CatalogResponse = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    if (response.status === 401) {
      throw new Error("Phiên làm việc chưa khả dụng. Hệ thống đang chờ tích hợp xác thực an toàn.");
    }
    if (response.status === 403) {
      throw new Error("Bạn không có quyền thực hiện thao tác này.");
    }
    if (response.status === 409) {
      throw new Error(
        "Sản phẩm đã thay đổi hoặc SKU/đường dẫn đã tồn tại. Tải lại danh mục và mở lại sản phẩm trước khi lưu.",
      );
    }
    throw new Error(data.error || "Không thể kết nối dịch vụ quản lý sản phẩm.");
  }
  return data;
}

export function AdminProductsView() {
  const [activeTab, setActiveTab] = useState<PageTab>("products");
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("visible");
  const [banners, setBanners] = useState<LiveCatalogOverridesState["banners"] | null>(null);
  const [referenceForm, setReferenceForm] = useState({
    kind: "brand",
    label: "",
    slug: "",
    parentId: "",
  });

  const busy = loading || saving || uploading;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await requestCatalog("/api/admin/products");
      if (
        !Array.isArray(data.products) ||
        !Array.isArray(data.categories) ||
        !Array.isArray(data.brands)
      ) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }
      setProducts(data.products);
      setCategories(data.categories);
      setBrands(data.brands);
      if (
        data.banners &&
        Array.isArray(data.banners.heroSlides) &&
        Array.isArray(data.banners.sideBanners)
      ) {
        setBanners(data.banners);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await requestCatalog("/api/admin/products");
        if (cancelled) return;
        if (
          !Array.isArray(data.products) ||
          !Array.isArray(data.categories) ||
          !Array.isArray(data.brands)
        ) {
          throw new Error("Dữ liệu trả về không hợp lệ.");
        }
        setProducts(data.products);
        setCategories(data.categories);
        setBrands(data.brands);
        if (
          data.banners &&
          Array.isArray(data.banners.heroSlides) &&
          Array.isArray(data.banners.sideBanners)
        ) {
          setBanners(data.banners);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Không thể tải danh mục.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await requestCatalog("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: referenceForm.kind === "brand" ? "create_brand" : "create_category",
          label: referenceForm.label,
          slug: referenceForm.slug,
          ...(referenceForm.kind === "category" && referenceForm.parentId
            ? { parentId: referenceForm.parentId }
            : {}),
        }),
      });
      if (!data.reference?.id) throw new Error("Máy chủ chưa xác nhận dữ liệu đã lưu.");
      setNotice(
        `Đã tạo ${referenceForm.kind === "brand" ? "thương hiệu" : "danh mục"}: ${data.reference.label}.`,
      );
      setReferenceForm({ ...referenceForm, label: "", slug: "", parentId: "" });
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo thương hiệu hoặc danh mục.");
    } finally {
      setSaving(false);
    }
  }

  function openCreateDrawer() {
    setForm(emptyProduct);
    setEditing(false);
    setDrawerTab("basic");
    setError("");
    setNotice("");
    setDrawerOpen(true);
  }

  function editProduct(product: ManagedProduct) {
    setForm({
      id: product.id || "",
      expectedUpdatedAt: product.updatedAt,
      brandId: product.brandId,
      categoryId: product.categoryId,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: String(product.price),
      old: String(product.old),
      image: product.image,
      description: product.description || "",
      englishName: product.englishName || "",
      imagesText: (product.images || []).join("\n"),
      overviewHtml: product.overviewHtml || "",
      ingredientsHtml: product.ingredientsHtml || "",
      usageHtml: product.usageHtml || "",
      specsText: (product.specs || []).map((spec) => `${spec.label}|${spec.value}`).join("\n"),
    });
    setEditing(true);
    setDrawerTab("basic");
    setNotice("");
    setError("");
    setDrawerOpen(true);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.name.trim() || !form.sku.trim() || !form.brandId || !form.categoryId || form.price === "") {
      setDrawerTab("basic");
      setError("Vui lòng điền đầy đủ Tên sản phẩm, SKU, Thương hiệu, Danh mục và Giá bán.");
      return;
    }
    if (!form.image.trim()) {
      setDrawerTab("media");
      setError("Vui lòng cung cấp đường dẫn ảnh chính hoặc tải ảnh lên.");
      return;
    }

    const price = Number(form.price);
    const old = form.old === "" ? price : Number(form.old);
    if (!Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(old) || old < price) {
      setDrawerTab("basic");
      setError("Giá phải là số nguyên VND không âm; giá gốc phải lớn hơn hoặc bằng giá bán.");
      return;
    }
    const gallery = [
      ...new Set([
        form.image,
        ...form.imagesText
          .split("\n")
          .map((image) => image.trim())
          .filter(Boolean),
      ]),
    ];
    const specs = form.specsText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const separator = line.indexOf("|");
        return {
          label: line.slice(0, separator).trim(),
          value: line.slice(separator + 1).trim(),
          valid: separator > 0,
        };
      });
    if (specs.some((spec) => !spec.valid || !spec.value)) {
      setDrawerTab("details");
      setError("Mỗi thông số cần có tên và giá trị ngăn cách bằng dấu |.");
      return;
    }
    if (gallery.length > 30) {
      setDrawerTab("media");
      setError("Album tối đa 30 ảnh, gồm ảnh chính.");
      return;
    }

    setSaving(true);
    try {
      const { imagesText: _imagesText, specsText: _specsText, ...productFields } = form;
      void _imagesText;
      void _specsText;
      const data = await requestCatalog("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_product",
          ...productFields,
          slug: form.slug || undefined,
          price,
          old,
          images: gallery,
          specs: specs.map(({ label, value }) => ({ label, value })),
        }),
      });
      if (!data.product?.slug) throw new Error("Máy chủ chưa xác nhận sản phẩm đã lưu.");
      setNotice(`Máy chủ đã lưu sản phẩm: ${data.product.name}.`);
      setForm(emptyProduct);
      setEditing(false);
      setDrawerOpen(false);
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  async function setProductHidden(product: ManagedProduct) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const action = product.isDeleted ? "restore_product" : "delete_product";
      const data = await requestCatalog("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id: product.id,
          expectedUpdatedAt: product.updatedAt,
        }),
      });
      if (
        !Array.isArray(data.deletedSlugs) ||
        data.deletedSlugs.includes(product.slug) === Boolean(product.isDeleted)
      ) {
        throw new Error("Máy chủ chưa xác nhận trạng thái hiển thị sản phẩm.");
      }
      setNotice(`${product.isDeleted ? "Đã khôi phục" : "Đã ẩn"} sản phẩm: ${product.name}.`);
      if (form.slug === product.slug) {
        setForm(emptyProduct);
        setEditing(false);
        setDrawerOpen(false);
      }
      await loadProducts();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể thay đổi trạng thái sản phẩm.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveBanners(nextBanners: LiveCatalogOverridesState["banners"]) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await requestCatalog("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_banners", ...nextBanners }),
      });
      if (
        !data.banners ||
        !Array.isArray(data.banners.heroSlides) ||
        !Array.isArray(data.banners.sideBanners)
      ) {
        throw new Error("Máy chủ chưa xác nhận danh sách banner.");
      }
      setBanners(data.banners);
      setNotice("Máy chủ đã lưu banner trang chủ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu banner.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setError("");
    setNotice("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Chỉ nhận JPEG, PNG hoặc WebP tối đa 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await requestCatalog("/api/admin/upload", { method: "POST", body });
      if (typeof data.url !== "string" || !/^https:\/\//.test(data.url)) {
        throw new Error("Máy chủ chưa trả đường dẫn ảnh hợp lệ.");
      }
      setForm((current) => ({ ...current, image: data.url || "" }));
      setNotice("Đã tải ảnh lên Storage. Bấm lưu sản phẩm để áp dụng.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  const visibleCount = useMemo(
    () => products.filter((p) => !p.isDeleted).length,
    [products],
  );
  const hiddenCount = useMemo(
    () => products.filter((p) => Boolean(p.isDeleted)).length,
    [products],
  );
  const totalBannersCount = banners
    ? banners.heroSlides.length + banners.sideBanners.length
    : 0;

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (visibility === "all" || Boolean(product.isDeleted) === (visibility === "hidden")) &&
          `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, visibility, query],
  );

  return (
    <BackofficeShell
      sectionLabel="Quản trị ERP"
      navGroups={ADMIN_PRODUCTS_NAV_GROUPS}
      topbarActions={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void loadProducts();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6d5c5] bg-white px-3 py-1.5 text-xs font-semibold text-[#3d2e24] transition hover:bg-[#faf5f0] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>{loading ? "Đang tải…" : "Đồng bộ"}</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3d2e24] px-3.5 py-1.5 text-xs font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm sản phẩm</span>
          </button>
        </>
      }
    >
      <PortalPageHeader
        title="Quản lý Sản phẩm & Banner"
        badge={
          <StatusBadge tone="accent">
            {products.length} sản phẩm · {brands.length} thương hiệu
          </StatusBadge>
        }
      />

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Đóng thông báo lỗi"
            className="rounded-lg p-1 text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>{notice}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Đóng thông báo"
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3-Tab Switcher */}
      <div
        role="tablist"
        aria-label="Phân mục quản lý danh mục"
        className="mb-6 inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#e6d5c5] bg-white p-1.5 shadow-[0_2px_10px_rgba(61,46,36,0.03)]"
      >
        {[
          { id: "products" as const, label: "Sản phẩm", count: products.length, icon: Package },
          {
            id: "references" as const,
            label: "Thương hiệu & Danh mục",
            count: brands.length + categories.length,
            icon: FolderTree,
          },
          {
            id: "banners" as const,
            label: "Banner trang chủ",
            count: totalBannersCount,
            icon: ImageIcon,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition",
                isActive
                  ? "bg-[#3d2e24] text-[#faf5f0] shadow-sm"
                  : "text-[#6e5a4f] hover:bg-[#faf5f0] hover:text-[#3d2e24]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-white/20 text-[#faf5f0]" : "bg-[#f6ece3] text-[#5c493e]",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: SẢN PHẨM                                                   */}
      {/* ================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiStatCard
              label="Tổng sản phẩm"
              value={products.length}
              hint="Đồng bộ trực tiếp từ cơ sở dữ liệu"
              icon={<Package className="h-4 w-4" />}
              tone="accent"
            />
            <KpiStatCard
              label="Đang hiển thị"
              value={visibleCount}
              hint="Đang mở bán trên storefront"
              icon={<Eye className="h-4 w-4" />}
            />
            <KpiStatCard
              label="Đang ẩn"
              value={hiddenCount}
              hint="Có thể khôi phục bất cứ lúc nào"
              icon={<EyeOff className="h-4 w-4" />}
              tone={hiddenCount > 0 ? "warning" : "default"}
            />
            <KpiStatCard
              label="Thương hiệu"
              value={brands.length}
              hint={`${categories.length} danh mục đang hoạt động`}
              icon={<Tag className="h-4 w-4" />}
            />
          </div>

          <SectionCard
            title="Danh sách sản phẩm"
            description="Tìm kiếm, lọc trạng thái hiển thị hoặc mở ngăn kéo bên phải để thêm mới và chỉnh sửa chi tiết."
            actions={
              <button
                type="button"
                disabled={busy}
                onClick={openCreateDrawer}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Thêm sản phẩm</span>
              </button>
            }
          >
            {/* Filter Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm, SKU hoặc thương hiệu..."
                  aria-label="Tìm tên hoặc SKU"
                  className="w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 py-2 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9c877a] transition focus:border-[#b86b4b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b86b4b]/15"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="product-visibility-filter" className="text-xs font-semibold text-[#6e5a4f]">
                  Hiển thị:
                </label>
                <select
                  id="product-visibility-filter"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="rounded-xl border border-[#e6d5c5] bg-white px-3 py-2 text-xs font-medium text-[#3d2e24] focus:border-[#b86b4b] focus:outline-none"
                >
                  <option value="visible">Đang hiển thị ({visibleCount})</option>
                  <option value="hidden">Đã ẩn ({hiddenCount})</option>
                  <option value="all">Tất cả ({products.length})</option>
                </select>
              </div>
            </div>

            {saving && (
              <div role="status" className="mb-3 flex items-center gap-2 text-xs font-medium text-[#9e7656]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang gửi thay đổi tới máy chủ…</span>
              </div>
            )}

            {loading ? (
              <AdminTableSkeleton rows={5} />
            ) : filtered.length === 0 ? (
              <EmptyStateCard
                icon={<Package className="h-6 w-6" />}
                title={error ? "Chưa thể tải danh mục" : "Không tìm thấy sản phẩm phù hợp"}
                description={
                  error
                    ? "Vui lòng nhấn Đồng bộ để thử tải lại dữ liệu từ máy chủ."
                    : "Thử thay đổi từ khóa tìm kiếm, bộ lọc hiển thị hoặc thêm sản phẩm mới."
                }
                action={
                  !error && (
                    <button
                      type="button"
                      onClick={openCreateDrawer}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-[#faf5f0] hover:bg-[#2a1f18]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm sản phẩm đầu tiên</span>
                    </button>
                  )
                }
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#efe2d4]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#efe2d4] bg-[#faf5f0] text-[11px] font-semibold uppercase tracking-wider text-[#6e5a4f]">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm & SKU</th>
                      <th className="px-3 py-3">Thương hiệu</th>
                      <th className="px-3 py-3 text-right">Giá bán</th>
                      <th className="px-3 py-3 text-center">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe2d4]/70 bg-white">
                    {filtered.map((product) => (
                      <tr
                        key={product.slug}
                        className="transition-colors hover:bg-[#faf5f0]/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e6d5c5] bg-[#faf5f0]">
                              {product.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-[#9e7656]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[320px] truncate font-semibold text-[#1e1b18]">
                                {product.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-[#7c685c]">
                                SKU: {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-[#3d2e24]">{product.brand || "—"}</span>
                          {product.category && (
                            <span className="mt-0.5 block text-[11px] text-[#7c685c]">
                              {product.category}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">
                          <span className="font-bold text-[#3d2e24]">
                            {product.price.toLocaleString("vi-VN")} ₫
                          </span>
                          {product.old > product.price && (
                            <span className="block text-[11px] text-[#9c877a] line-through">
                              {product.old.toLocaleString("vi-VN")} ₫
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <StatusBadge tone={product.isDeleted ? "neutral" : "success"}>
                            {product.isDeleted ? "Đã ẩn" : "Đang hiển thị"}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy || product.isDeleted}
                              onClick={() => editProduct(product)}
                              aria-label={`Sửa ${product.name}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e6d5c5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#3d2e24] transition hover:border-[#b86b4b] hover:bg-[#faf5f0] disabled:opacity-40"
                            >
                              <Pencil className="h-3 w-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                void setProductHidden(product);
                              }}
                              aria-label={`${product.isDeleted ? "Khôi phục" : "Ẩn"} ${product.name}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40",
                                product.isDeleted
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                  : "border-[#e6d5c5] bg-[#faf5f0] text-[#6e5a4f] hover:border-red-200 hover:bg-red-50 hover:text-red-700",
                              )}
                            >
                              {product.isDeleted ? (
                                <>
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Khôi phục</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" />
                                  <span>Ẩn</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: THƯƠNG HIỆU & DANH MỤC                                     */}
      {/* ================================================================= */}
      {activeTab === "references" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionCard
              title="Tạo thương hiệu & danh mục"
              description="Đường dẫn dùng chữ thường không dấu và dấu gạch ngang; có thể kết thúc bằng .html."
            >
              <form onSubmit={createReference}>
                <fieldset disabled={busy} className="space-y-4">
                  <label className="block text-xs font-semibold text-[#5c493e]">
                    Loại dữ liệu
                    <select
                      value={referenceForm.kind}
                      onChange={(e) =>
                        setReferenceForm({ ...referenceForm, kind: e.target.value, parentId: "" })
                      }
                      className={inputClass}
                    >
                      <option value="brand">Thương hiệu</option>
                      <option value="category">Danh mục sản phẩm</option>
                    </select>
                  </label>

                  <label className="block text-xs font-semibold text-[#5c493e]">
                    Tên hiển thị
                    <input
                      required
                      maxLength={200}
                      value={referenceForm.label}
                      onChange={(e) =>
                        setReferenceForm({ ...referenceForm, label: e.target.value })
                      }
                      placeholder={
                        referenceForm.kind === "brand" ? "VD: La Roche-Posay" : "VD: Chăm sóc da mặt"
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-xs font-semibold text-[#5c493e]">
                    Đường dẫn (Slug)
                    <input
                      required
                      maxLength={125}
                      pattern="[a-z0-9]([a-z0-9]|-){0,119}([.]html)?"
                      value={referenceForm.slug}
                      onChange={(e) =>
                        setReferenceForm({ ...referenceForm, slug: e.target.value })
                      }
                      placeholder={
                        referenceForm.kind === "brand" ? "la-roche-posay" : "cham-soc-da-mat.html"
                      }
                      className={inputClass}
                    />
                  </label>

                  {referenceForm.kind === "category" && (
                    <label className="block text-xs font-semibold text-[#5c493e]">
                      Danh mục cha (không bắt buộc)
                      <select
                        value={referenceForm.parentId}
                        onChange={(e) =>
                          setReferenceForm({ ...referenceForm, parentId: e.target.value })
                        }
                        className={inputClass}
                      >
                        <option value="">Danh mục gốc</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-2.5 text-sm font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>Tạo {referenceForm.kind === "brand" ? "thương hiệu" : "danh mục"}</span>
                  </button>
                </fieldset>
              </form>
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <SectionCard
              title="Thương hiệu hiện có"
              description="Các thương hiệu đang được kích hoạt để gán cho sản phẩm."
              actions={<StatusBadge tone="accent">{brands.length} thương hiệu</StatusBadge>}
            >
              {brands.length === 0 ? (
                <EmptyStateCard
                  icon={<Tag className="h-5 w-5" />}
                  title="Chưa có thương hiệu nào"
                  className="py-8"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <span
                      key={brand.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6d5c5] bg-[#faf5f0] px-3 py-1.5 text-xs font-medium text-[#3d2e24]"
                    >
                      <span className="font-semibold">{brand.label}</span>
                      <span className="font-mono text-[10px] text-[#8c7568]">/{brand.slug}</span>
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Danh mục sản phẩm"
              description="Cấu trúc phân loại ngành hàng đang hiển thị trên hệ thống."
              actions={<StatusBadge tone="accent">{categories.length} danh mục</StatusBadge>}
            >
              {categories.length === 0 ? (
                <EmptyStateCard
                  icon={<FolderTree className="h-5 w-5" />}
                  title="Chưa có danh mục nào"
                  className="py-8"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6d5c5] bg-[#faf5f0] px-3 py-1.5 text-xs font-medium text-[#3d2e24]"
                    >
                      <span className="font-semibold">{category.label}</span>
                      <span className="font-mono text-[10px] text-[#8c7568]">/{category.slug}</span>
                    </span>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: BANNER TRANG CHỦ                                           */}
      {/* ================================================================= */}
      {activeTab === "banners" && (
        <div>
          {banners ? (
            <AdminBannerEditor
              key={JSON.stringify(banners)}
              initialBanners={banners}
              disabled={busy}
              onSave={saveBanners}
            />
          ) : loading ? (
            <SectionCard title="Banner trang chủ">
              <AdminTableSkeleton rows={3} />
            </SectionCard>
          ) : (
            <EmptyStateCard
              icon={<ImageIcon className="h-6 w-6" />}
              title="Chưa tải được cấu hình banner"
              description="Nhấn Đồng bộ ở thanh công cụ phía trên để tải dữ liệu banner trang chủ."
            />
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SLIDE-OVER DRAWER: THÊM / SỬA SẢN PHẨM                            */}
      {/* ================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#1e1b18]/50 backdrop-blur-[2px]"
            onClick={() => !busy && setDrawerOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-product-title"
            className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[#e6d5c5] bg-white shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#efe2d4] bg-[#faf5f0] px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="drawer-product-title" className="font-display text-lg font-semibold text-[#3d2e24]">
                    {editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                  </h2>
                  {editing && form.sku && (
                    <StatusBadge tone="accent">SKU: {form.sku}</StatusBadge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[#6e5a4f]">
                  Thay đổi được bảo vệ bằng khóa phiên bản (optimistic lock) khi lưu lên máy chủ.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng ngăn kéo chỉnh sửa"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6d5c5] bg-white text-[#5c493e] transition hover:bg-[#f6ece3] disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-tab Bar */}
            <div className="flex items-center gap-1 border-b border-[#efe2d4] bg-white px-6 py-2.5">
              {[
                { id: "basic" as const, label: "Thông tin cơ bản", icon: Layers },
                { id: "media" as const, label: "Hình ảnh & Storage", icon: ImageIcon },
                { id: "details" as const, label: "Mô tả & Thông số", icon: FileText },
              ].map((st) => {
                const Icon = st.icon;
                const active = drawerTab === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setDrawerTab(st.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "bg-[#f6ece3] text-[#3d2e24] ring-1 ring-[#d8b89c]"
                        : "text-[#7c685c] hover:bg-[#faf5f0] hover:text-[#3d2e24]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Body */}
            <form onSubmit={saveProduct} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
                  >
                    {error}
                  </div>
                )}

                <fieldset disabled={busy}>
                  {/* SUB-TAB 1: BASIC */}
                  <div className={drawerTab === "basic" ? "grid gap-4 sm:grid-cols-2" : "hidden"}>
                    <label className="text-xs font-semibold text-[#5c493e] sm:col-span-2">
                      Tên sản phẩm *
                      <input
                        id="product-name"
                        required
                        maxLength={300}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Nhập tên sản phẩm hiển thị trên storefront"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e] sm:col-span-2">
                      Tên tiếng Anh
                      <input
                        value={form.englishName}
                        onChange={(e) => setForm({ ...form, englishName: e.target.value })}
                        placeholder="Tên quốc tế (không bắt buộc)"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e]">
                      SKU *
                      <input
                        required
                        pattern="[a-zA-Z0-9_-]{1,80}"
                        disabled={editing}
                        value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        placeholder="VD: 422208973"
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e]">
                      Thương hiệu *
                      <select
                        required
                        value={form.brandId}
                        onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Chọn thương hiệu</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e] sm:col-span-2">
                      Danh mục *
                      <select
                        required
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e]">
                      Giá bán (VND) *
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e]">
                      Giá gốc (VND)
                      <input
                        type="number"
                        min={form.price || "0"}
                        step="1"
                        value={form.old}
                        onChange={(e) => setForm({ ...form, old: e.target.value })}
                        className={inputClass}
                      />
                    </label>

                    <label className="text-xs font-semibold text-[#5c493e] sm:col-span-2">
                      Mô tả ngắn
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Mô tả tóm tắt đặc điểm nổi bật của sản phẩm"
                        className={inputClass}
                      />
                    </label>
                  </div>

                  {/* SUB-TAB 2: MEDIA */}
                  <div className={drawerTab === "media" ? "space-y-4" : "hidden"}>
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#e6d5c5] bg-[#faf5f0]/60 p-4 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e6d5c5] bg-white">
                        {form.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={form.image}
                            alt={form.name || "Ảnh sản phẩm"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-7 w-7 text-[#9e7656]" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-semibold text-[#3d2e24]">
                          Tải ảnh lên Supabase Storage
                        </p>
                        <p className="text-[11px] text-[#6e5a4f]">
                          Hỗ trợ JPEG, PNG hoặc WebP tối đa 5 MB. Sau khi tải xong đường dẫn sẽ tự động điền vào ảnh chính.
                        </p>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d8b89c] bg-white px-3.5 py-2 text-xs font-semibold text-[#3d2e24] transition hover:bg-[#f6ece3]">
                          {uploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>{uploading ? "Đang tải ảnh…" : "Chọn tệp ảnh từ máy"}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              void uploadImage(e.target.files?.[0]);
                              e.target.value = "";
                            }}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>

                    <label className="block text-xs font-semibold text-[#5c493e]">
                      Đường dẫn ảnh chính *
                      <input
                        required
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="https://... hoặc /sites/nari/..."
                        className={inputClass}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-[#5c493e]">
                      Album ảnh bổ sung (mỗi dòng một đường dẫn, tối đa 30 ảnh)
                      <textarea
                        rows={5}
                        value={form.imagesText}
                        onChange={(e) => setForm({ ...form, imagesText: e.target.value })}
                        placeholder="https://.../anh-2.jpg&#10;https://.../anh-3.jpg"
                        className={inputClass}
                      />
                    </label>
                  </div>

                  {/* SUB-TAB 3: DETAILS */}
                  <div className={drawerTab === "details" ? "space-y-4" : "hidden"}>
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <span>Nội dung HTML hiện hiển thị dưới dạng văn bản an toàn trên cửa hàng.</span>
                    </div>

                    <label className="block text-xs font-semibold text-[#5c493e]">
                      Tổng quan (HTML)
                      <textarea
                        rows={4}
                        value={form.overviewHtml}
                        onChange={(e) => setForm({ ...form, overviewHtml: e.target.value })}
                        className={inputClass}
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-[#5c493e]">
                        Thành phần (HTML)
                        <textarea
                          rows={4}
                          value={form.ingredientsHtml}
                          onChange={(e) => setForm({ ...form, ingredientsHtml: e.target.value })}
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-[#5c493e]">
                        Hướng dẫn sử dụng (HTML)
                        <textarea
                          rows={4}
                          value={form.usageHtml}
                          onChange={(e) => setForm({ ...form, usageHtml: e.target.value })}
                          className={inputClass}
                        />
                      </label>
                    </div>

                    <label className="block text-xs font-semibold text-[#5c493e]">
                      Thông số kỹ thuật (mỗi dòng: tên|giá trị)
                      <textarea
                        rows={4}
                        value={form.specsText}
                        onChange={(e) => setForm({ ...form, specsText: e.target.value })}
                        placeholder="Dung tích|473ml&#10;Xuất xứ|Pháp"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* Sticky Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efe2d4] bg-[#faf5f0] px-6 py-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setForm(emptyProduct);
                    setEditing(false);
                    setError("");
                    setNotice("");
                    setDrawerTab("basic");
                  }}
                  className="rounded-xl border border-[#e6d5c5] bg-white px-4 py-2 text-xs font-semibold text-[#5c493e] transition hover:bg-[#f6ece3] disabled:opacity-50"
                >
                  Đặt lại biểu mẫu
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#6e5a4f] transition hover:bg-[#efe2d4]/60"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={busy || categories.length === 0 || brands.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-2.5 text-xs font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-50"
                  >
                    {(saving || uploading) && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    <span>
                      {saving ? "Đang lưu…" : uploading ? "Đang tải ảnh…" : "Lưu sản phẩm"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      )}
    </BackofficeShell>
  );
}
