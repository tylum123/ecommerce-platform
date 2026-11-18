"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { LiveProductOverride, LiveCatalogOverridesState, ManagedCatalogProduct } from "@/lib/live-catalog";
import { AdminBannerEditor } from "@/components/sites/nari/admin-banner-editor";

type ManagedProduct = ManagedCatalogProduct;
interface CategoryOption { id: string; label: string; slug: string }
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
  id: "", expectedUpdatedAt: "", brandId: "", categoryId: "",
  sku: "", slug: "", name: "", brand: "", category: "", price: "", old: "", image: "", description: "",
  englishName: "", imagesText: "", overviewHtml: "", ingredientsHtml: "", usageHtml: "", specsText: "",
};
const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100";

async function requestCatalog(url: string, init?: RequestInit): Promise<CatalogResponse> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data: CatalogResponse = await response.json().catch(() => ({}));
  if (!response.ok || data.ok !== true) {
    if (response.status === 401) throw new Error("Phiên làm việc chưa khả dụng. Hệ thống đang chờ tích hợp xác thực an toàn.");
    if (response.status === 403) throw new Error("Bạn không có quyền thực hiện thao tác này.");
    if (response.status === 409) throw new Error("Sản phẩm đã thay đổi hoặc SKU/đường dẫn đã tồn tại. Tải lại danh mục và mở lại sản phẩm trước khi lưu.");
    throw new Error(data.error || "Không thể kết nối dịch vụ quản lý sản phẩm.");
  }
  return data;
}

export function AdminProductsView() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("visible");
  const [banners, setBanners] = useState<LiveCatalogOverridesState["banners"] | null>(null);
  const [referenceForm, setReferenceForm] = useState({ kind: "brand", label: "", slug: "", parentId: "" });
  const busy = loading || saving || uploading;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await requestCatalog("/api/admin/products");
      if (!Array.isArray(data.products) || !Array.isArray(data.categories) || !Array.isArray(data.brands)) throw new Error("Dữ liệu trả về không hợp lệ.");
      setProducts(data.products);
      setCategories(data.categories);
      setBrands(data.brands);
      if (data.banners && Array.isArray(data.banners.heroSlides) && Array.isArray(data.banners.sideBanners)) setBanners(data.banners);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  async function createReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await requestCatalog("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: referenceForm.kind === "brand" ? "create_brand" : "create_category", label: referenceForm.label, slug: referenceForm.slug,
          ...(referenceForm.kind === "category" && referenceForm.parentId ? { parentId: referenceForm.parentId } : {}) }),
      });
      if (!data.reference?.id) throw new Error("Máy chủ chưa xác nhận dữ liệu đã lưu.");
      setNotice(`Đã tạo ${referenceForm.kind === "brand" ? "thương hiệu" : "danh mục"}: ${data.reference.label}.`);
      setReferenceForm({ ...referenceForm, label: "", slug: "", parentId: "" });
      await loadProducts();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tạo thương hiệu hoặc danh mục."); }
    finally { setSaving(false); }
  }

  function editProduct(product: ManagedProduct) {
    setForm({ id: product.id || "", expectedUpdatedAt: product.updatedAt, brandId: product.brandId, categoryId: product.categoryId, sku: product.sku, slug: product.slug, name: product.name, brand: product.brand,
      category: product.category, price: String(product.price), old: String(product.old),
      image: product.image, description: product.description || "", englishName: product.englishName || "",
      imagesText: (product.images || []).join("\n"), overviewHtml: product.overviewHtml || "",
      ingredientsHtml: product.ingredientsHtml || "", usageHtml: product.usageHtml || "",
      specsText: (product.specs || []).map((spec) => `${spec.label}|${spec.value}`).join("\n") });
    setEditing(true);
    setNotice("");
    setError("");
    document.getElementById("product-name")?.focus();
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const price = Number(form.price);
    const old = form.old === "" ? price : Number(form.old);
    if (!Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(old) || old < price) {
      setError("Giá phải là số nguyên VND không âm; giá gốc phải lớn hơn hoặc bằng giá bán.");
      return;
    }
    const gallery = [...new Set([form.image, ...form.imagesText.split("\n").map((image) => image.trim()).filter(Boolean)])];
    const specs = form.specsText.split("\n").filter((line) => line.trim()).map((line) => {
      const separator = line.indexOf("|");
      return { label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim(), valid: separator > 0 };
    });
    if (specs.some((spec) => !spec.valid || !spec.value)) {
      setError("Mỗi thông số cần có tên và giá trị ngăn cách bằng dấu |.");
      return;
    }
    if (gallery.length > 30) { setError("Album tối đa 30 ảnh, gồm ảnh chính."); return; }
    setSaving(true);
    try {
      const { imagesText: _imagesText, specsText: _specsText, ...productFields } = form;
      void _imagesText;
      void _specsText;
      const data = await requestCatalog("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert_product", ...productFields, slug: form.slug || undefined, price, old,
          images: gallery, specs: specs.map(({ label, value }) => ({ label, value })) }),
      });
      if (!data.product?.slug) throw new Error("Máy chủ chưa xác nhận sản phẩm đã lưu.");
      setNotice(`Máy chủ đã lưu sản phẩm: ${data.product.name}.`);
      setForm(emptyProduct);
      setEditing(false);
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: product.id, expectedUpdatedAt: product.updatedAt }),
      });
      if (!Array.isArray(data.deletedSlugs) || data.deletedSlugs.includes(product.slug) === Boolean(product.isDeleted)) {
        throw new Error("Máy chủ chưa xác nhận trạng thái hiển thị sản phẩm.");
      }
      setNotice(`${product.isDeleted ? "Đã khôi phục" : "Đã ẩn"} sản phẩm: ${product.name}.`);
      if (form.slug === product.slug) { setForm(emptyProduct); setEditing(false); }
      await loadProducts();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể thay đổi trạng thái sản phẩm.");
    } finally { setSaving(false); }
  }

  async function saveBanners(nextBanners: LiveCatalogOverridesState["banners"]) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await requestCatalog("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_banners", ...nextBanners }),
      });
      if (!data.banners || !Array.isArray(data.banners.heroSlides) || !Array.isArray(data.banners.sideBanners)) throw new Error("Máy chủ chưa xác nhận danh sách banner.");
      setBanners(data.banners);
      setNotice("Máy chủ đã lưu banner trang chủ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu banner.");
    } finally { setSaving(false); }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setError("");
    setNotice("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Chỉ nhận JPEG, PNG hoặc WebP tối đa 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const data = await requestCatalog("/api/admin/upload", { method: "POST", body });
      if (typeof data.url !== "string" || !/^https:\/\//.test(data.url)) throw new Error("Máy chủ chưa trả đường dẫn ảnh hợp lệ.");
      setForm((current) => ({ ...current, image: data.url || "" }));
      setNotice("Đã tải ảnh lên. Bấm lưu sản phẩm để áp dụng ảnh.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = products.filter((product) => (visibility === "all" || Boolean(product.isDeleted) === (visibility === "hidden")) && `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#f3f6f4] p-4 text-[#1e2922] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm underline">Trở về cửa hàng</Link>
        <h1 className="mt-5 text-2xl font-bold">Quản lý sản phẩm</h1>
        <p className="mt-2 text-sm text-gray-600">Danh mục lấy từ dịch vụ quản trị. Thay đổi chỉ được xác nhận sau phản hồi thành công từ máy chủ.</p>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notice}</p>}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5" aria-labelledby="reference-title">
          <h2 id="reference-title" className="text-lg font-semibold">Tạo thương hiệu và danh mục</h2>
          <p className="mt-2 text-sm text-gray-600">Nhập dữ liệu kinh doanh của bạn trước khi tạo sản phẩm. Đường dẫn dùng chữ thường không dấu và dấu gạch ngang; có thể kết thúc bằng .html.</p>
          <form onSubmit={createReference} className="mt-4">
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">Loại<select value={referenceForm.kind} onChange={e => setReferenceForm({ ...referenceForm, kind: e.target.value, parentId: "" })} className={inputClass}><option value="brand">Thương hiệu</option><option value="category">Danh mục</option></select></label>
              <label className="text-sm">Tên hiển thị<input required maxLength={200} value={referenceForm.label} onChange={e => setReferenceForm({ ...referenceForm, label: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Đường dẫn<input required maxLength={125} pattern="[a-z0-9]([a-z0-9]|-){0,119}([.]html)?" value={referenceForm.slug} onChange={e => setReferenceForm({ ...referenceForm, slug: e.target.value })} className={inputClass} /></label>
              {referenceForm.kind === "category" && <label className="text-sm">Danh mục cha (không bắt buộc)<select value={referenceForm.parentId} onChange={e => setReferenceForm({ ...referenceForm, parentId: e.target.value })} className={inputClass}><option value="">Danh mục gốc</option>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>}
              <button disabled={busy} className="rounded-lg bg-[#173a2b] px-5 py-2 text-sm text-white disabled:opacity-50">Tạo {referenceForm.kind === "brand" ? "thương hiệu" : "danh mục"}</button>
            </fieldset>
          </form>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5" aria-labelledby="editor-title">
          <h2 id="editor-title" className="text-lg font-semibold">{editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h2>
          <form onSubmit={saveProduct} className="mt-4">
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">Tên sản phẩm<input id="product-name" required maxLength={300} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">SKU<input required pattern="[a-zA-Z0-9_-]{1,80}" disabled={editing} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Thương hiệu<select required value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className={inputClass}><option value="">Chọn thương hiệu</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.label}</option>)}</select></label>
              <label className="text-sm">Danh mục<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
              <label className="text-sm">Giá bán (VND)<input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Giá gốc (VND)<input type="number" min={form.price || "0"} step="1" value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Đường dẫn ảnh<input required value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Tải ảnh (tối đa 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { void uploadImage(e.target.files?.[0]); e.target.value = ""; }} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Mô tả<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Tên tiếng Anh<input value={form.englishName} onChange={(e) => setForm({ ...form, englishName: e.target.value })} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Album ảnh (mỗi dòng một đường dẫn, tối đa 30 ảnh)<textarea rows={3} value={form.imagesText} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} className={inputClass} /></label>
              <p className="text-sm text-amber-900 sm:col-span-2">Nội dung HTML hiện hiển thị dưới dạng văn bản an toàn trên cửa hàng.</p>
              <label className="text-sm sm:col-span-2">Tổng quan (HTML)<textarea rows={4} value={form.overviewHtml} onChange={(e) => setForm({ ...form, overviewHtml: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Thành phần (HTML)<textarea rows={4} value={form.ingredientsHtml} onChange={(e) => setForm({ ...form, ingredientsHtml: e.target.value })} className={inputClass} /></label>
              <label className="text-sm">Hướng dẫn sử dụng (HTML)<textarea rows={4} value={form.usageHtml} onChange={(e) => setForm({ ...form, usageHtml: e.target.value })} className={inputClass} /></label>
              <label className="text-sm sm:col-span-2">Thông số (mỗi dòng: tên|giá trị)<textarea rows={3} value={form.specsText} onChange={(e) => setForm({ ...form, specsText: e.target.value })} className={inputClass} /></label>
            </fieldset>
            <div className="mt-4 flex flex-wrap gap-3">
              <button disabled={busy || categories.length === 0 || brands.length === 0} className="rounded-lg bg-[#173a2b] px-5 py-2 text-sm text-white disabled:opacity-50">{saving ? "Đang lưu…" : uploading ? "Đang tải ảnh…" : "Lưu sản phẩm"}</button>
              <button type="button" disabled={busy} onClick={() => { setForm(emptyProduct); setEditing(false); setNotice(""); }} className="rounded-lg border px-5 py-2 text-sm disabled:opacity-50">Tạo mới</button>
            </div>
          </form>
        </section>

        <section aria-labelledby="list-title" aria-busy={loading} className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="list-title" className="text-lg font-semibold">Danh sách sản phẩm</h2>
            <button type="button" disabled={busy} onClick={() => { void loadProducts(); }} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">{loading ? "Đang tải…" : "Tải lại"}</button>
          </div>
          <label className="mt-4 block text-sm">Tìm tên hoặc SKU<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} /></label>
          <label className="mt-4 block text-sm">Hiển thị<select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputClass}><option value="visible">Đang hiển thị</option><option value="hidden">Đã ẩn</option><option value="all">Tất cả</option></select></label>
          {saving && <p role="status" className="mt-3 text-sm">Đang gửi thay đổi tới máy chủ…</p>}
          {loading ? <p role="status" className="py-6 text-sm">Đang tải danh mục…</p> : filtered.length === 0 ? <p className="py-6 text-sm text-gray-600">{error ? "Chưa có danh mục được tải thành công." : "Không có sản phẩm phù hợp."}</p> : (
            <div className="mt-4 max-h-[600px] overflow-auto">
              <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Sản phẩm / SKU</th><th className="p-3">Giá bán</th><th className="p-3">Thao tác</th></tr></thead>
                <tbody>{filtered.map((product) => <tr key={product.slug} className="border-b"><td className="p-3"><span className="font-medium">{product.name}</span><br /><span className="text-xs text-gray-500">{product.sku} · {product.isDeleted ? "Đã ẩn" : "Đang hiển thị"}</span></td><td className="whitespace-nowrap p-3">{product.price.toLocaleString("vi-VN")} ₫</td><td className="p-3"><div className="flex flex-wrap gap-2"><button disabled={busy || product.isDeleted} onClick={() => editProduct(product)} aria-label={`Sửa ${product.name}`} className="rounded border px-3 py-2 disabled:opacity-50">Sửa</button><button disabled={busy} onClick={() => { void setProductHidden(product); }} aria-label={`${product.isDeleted ? "Khôi phục" : "Ẩn"} ${product.name}`} className="rounded border px-3 py-2 disabled:opacity-50">{product.isDeleted ? "Khôi phục" : "Ẩn"}</button></div></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
        {banners && <AdminBannerEditor key={JSON.stringify(banners)} initialBanners={banners} disabled={busy} onSave={saveBanners} />}
      </div>
    </main>
  );
}
