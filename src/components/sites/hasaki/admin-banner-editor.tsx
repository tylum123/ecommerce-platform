"use client";

import { useState, type FormEvent } from "react";
import type { LiveBannerItem, LiveCatalogOverridesState } from "@/lib/live-catalog";

type Banners = LiveCatalogOverridesState["banners"];
type BannerGroup = keyof Banners;
const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100";

export function AdminBannerEditor({ initialBanners, disabled, onSave }: {
  initialBanners: Banners;
  disabled: boolean;
  onSave: (banners: Banners) => Promise<void>;
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [error, setError] = useState("");

  function updateBanner(group: BannerGroup, index: number, field: keyof LiveBannerItem, value: string) {
    setBanners((current) => ({ ...current, [group]: current[group].map((banner, i) => i === index ? { ...banner, [field]: value } : banner) }));
  }

  function addBanner(group: BannerGroup) {
    setBanners((current) => ({ ...current, [group]: [...current[group], { id: crypto.randomUUID(), src: "", alt: "", href: "/" }] }));
  }

  function moveBanner(group: BannerGroup, index: number, direction: -1 | 1) {
    setBanners((current) => {
      const items = [...current[group]];
      [items[index], items[index + direction]] = [items[index + direction], items[index]];
      return { ...current, [group]: items };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const validUrl = (value: string) => {
      if ([...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) return false;
      if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
      try { return new URL(value).protocol === "https:"; } catch { return false; }
    };
    if (![...banners.heroSlides, ...banners.sideBanners].every((banner) => validUrl(banner.src) && validUrl(banner.href))) {
      setError("Ảnh và liên kết cần là đường dẫn /nội-bộ hoặc URL HTTPS hợp lệ.");
      return;
    }
    await onSave(banners);
  }

  const total = banners.heroSlides.length + banners.sideBanners.length;

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5" aria-labelledby="banner-title">
      <h2 id="banner-title" className="text-lg font-semibold">Banner trang chủ</h2>
      <p className="mt-2 text-sm text-gray-600">Chỉnh ảnh, liên kết và thứ tự. Thêm hoặc bỏ banner chỉ được áp dụng khi bấm lưu. Tối đa 40 banner.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      <form onSubmit={save}>
        <fieldset disabled={disabled} className="mt-4 space-y-6">
          {(["heroSlides", "sideBanners"] as const).map((group) => (
            <section key={group} aria-label={group === "heroSlides" ? "Banner chính" : "Banner bên cạnh"}>
              <h3 className="font-semibold">{group === "heroSlides" ? "Banner chính" : "Banner bên cạnh"}</h3>
              {banners[group].length === 0 && <p className="mt-3 text-sm text-gray-500">Chưa có banner trong nhóm này.</p>}
              {banners[group].map((banner, index) => (
                <div key={banner.id} className="mt-3 grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
                  <label className="text-sm">Đường dẫn ảnh<input required value={banner.src} onChange={(e) => updateBanner(group, index, "src", e.target.value)} className={inputClass} /></label>
                  <label className="text-sm">Liên kết khi bấm<input required value={banner.href} onChange={(e) => updateBanner(group, index, "href", e.target.value)} className={inputClass} /></label>
                  <label className="text-sm sm:col-span-2">Văn bản thay thế<input required value={banner.alt} onChange={(e) => updateBanner(group, index, "alt", e.target.value)} className={inputClass} /></label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button type="button" disabled={disabled || index === 0} onClick={() => moveBanner(group, index, -1)} aria-label={`Đưa banner ${index + 1} lên`} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Lên</button>
                    <button type="button" disabled={disabled || index === banners[group].length - 1} onClick={() => moveBanner(group, index, 1)} aria-label={`Đưa banner ${index + 1} xuống`} className="rounded border px-3 py-2 text-sm disabled:opacity-40">Xuống</button>
                    <button type="button" onClick={() => setBanners((current) => ({ ...current, [group]: current[group].filter((_, i) => i !== index) }))} aria-label={`Bỏ banner ${index + 1}`} className="rounded border px-3 py-2 text-sm">Bỏ khỏi danh sách</button>
                  </div>
                </div>
              ))}
              <button type="button" disabled={disabled || total >= 40} onClick={() => addBanner(group)} className="mt-3 rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Thêm banner</button>
            </section>
          ))}
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-[#173a2b] px-5 py-2 text-sm text-white disabled:opacity-50" disabled={disabled}>{disabled ? "Đang xử lý…" : "Lưu banner"}</button>
            <button type="button" onClick={() => { setBanners(initialBanners); setError(""); }} className="rounded-lg border px-5 py-2 text-sm">Hủy thay đổi banner</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
