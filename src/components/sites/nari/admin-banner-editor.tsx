"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import type { LiveBannerItem, LiveCatalogOverridesState } from "@/lib/live-catalog";
import { EmptyStateCard, SectionCard, StatusBadge } from "@/components/sites/nari/portal/portal-ui";

type Banners = LiveCatalogOverridesState["banners"];
type BannerGroup = keyof Banners;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/50 px-3.5 py-2 text-sm text-[#1e1b18] placeholder:text-[#9c877a] transition focus:border-[#b86b4b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b86b4b]/15 disabled:cursor-not-allowed disabled:bg-[#f6ece3]/60 disabled:opacity-70";

export function AdminBannerEditor({
  initialBanners,
  disabled,
  onSave,
}: {
  initialBanners: Banners;
  disabled: boolean;
  onSave: (banners: Banners) => Promise<void>;
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [error, setError] = useState("");

  function updateBanner(
    group: BannerGroup,
    index: number,
    field: keyof LiveBannerItem,
    value: string,
  ) {
    setBanners((current) => ({
      ...current,
      [group]: current[group].map((banner, i) =>
        i === index ? { ...banner, [field]: value } : banner,
      ),
    }));
  }

  function addBanner(group: BannerGroup) {
    setBanners((current) => ({
      ...current,
      [group]: [
        ...current[group],
        { id: crypto.randomUUID(), src: "", alt: "", href: "/" },
      ],
    }));
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
      if ([...value].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) {
        return false;
      }
      if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
        return true;
      }
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    };
    if (
      ![...banners.heroSlides, ...banners.sideBanners].every(
        (banner) => validUrl(banner.src) && validUrl(banner.href),
      )
    ) {
      setError("Ảnh và liên kết cần là đường dẫn /nội-bộ hoặc URL HTTPS hợp lệ.");
      return;
    }
    await onSave(banners);
  }

  const total = banners.heroSlides.length + banners.sideBanners.length;

  return (
    <SectionCard
      title="Banner trang chủ"
      description="Chỉnh ảnh, liên kết và thứ tự hiển thị. Thêm hoặc bỏ banner chỉ được áp dụng khi bấm lưu (tối đa 40 banner)."
      actions={
        <StatusBadge tone="accent">
          {total} / 40 banner
        </StatusBadge>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={save}>
        <fieldset disabled={disabled} className="space-y-6">
          {(["heroSlides", "sideBanners"] as const).map((group) => {
            const groupLabel = group === "heroSlides" ? "Banner chính (Hero Slides)" : "Banner bên cạnh (Side Banners)";
            return (
              <section
                key={group}
                aria-label={group === "heroSlides" ? "Banner chính" : "Banner bên cạnh"}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#efe2d4] pb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#3d2e24]">{groupLabel}</h3>
                    <StatusBadge tone="neutral">{banners[group].length}</StatusBadge>
                  </div>
                  <button
                    type="button"
                    disabled={disabled || total >= 40}
                    onClick={() => addBanner(group)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6d5c5] bg-[#faf5f0] px-3 py-1.5 text-xs font-semibold text-[#3d2e24] transition hover:border-[#d8b89c] hover:bg-[#f6ece3] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm banner</span>
                  </button>
                </div>

                {banners[group].length === 0 ? (
                  <EmptyStateCard
                    icon={<ImageIcon className="h-5 w-5" />}
                    title="Chưa có banner trong nhóm này"
                    description="Nhấn “Thêm banner” để bổ sung hình ảnh quảng bá mới cho trang chủ."
                    className="py-8"
                  />
                ) : (
                  <div className="space-y-3">
                    {banners[group].map((banner, index) => (
                      <div
                        key={banner.id}
                        className="rounded-2xl border border-[#e6d5c5] bg-[#faf5f0]/40 p-4 transition hover:border-[#d8b89c]"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3d2e24] text-[11px] font-bold text-[#faf5f0]">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-[#5c493e]">
                              {group === "heroSlides" ? "Slide chính" : "Banner phụ"} #{index + 1}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              disabled={disabled || index === 0}
                              onClick={() => moveBanner(group, index, -1)}
                              aria-label={`Đưa banner ${index + 1} lên`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e6d5c5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3d2e24] transition hover:bg-[#f6ece3] disabled:opacity-40"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                              <span>Lên</span>
                            </button>
                            <button
                              type="button"
                              disabled={disabled || index === banners[group].length - 1}
                              onClick={() => moveBanner(group, index, 1)}
                              aria-label={`Đưa banner ${index + 1} xuống`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e6d5c5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3d2e24] transition hover:bg-[#f6ece3] disabled:opacity-40"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                              <span>Xuống</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setBanners((current) => ({
                                  ...current,
                                  [group]: current[group].filter((_, i) => i !== index),
                                }))
                              }
                              aria-label={`Bỏ banner ${index + 1}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Bỏ</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-[#5c493e]">
                            Đường dẫn ảnh
                            <input
                              required
                              value={banner.src}
                              onChange={(e) => updateBanner(group, index, "src", e.target.value)}
                              placeholder="https://... hoặc /sites/nari/..."
                              className={inputClass}
                            />
                          </label>
                          <label className="text-xs font-semibold text-[#5c493e]">
                            Liên kết khi bấm
                            <input
                              required
                              value={banner.href}
                              onChange={(e) => updateBanner(group, index, "href", e.target.value)}
                              placeholder="/thuong-hieu hoặc https://..."
                              className={inputClass}
                            />
                          </label>
                          <label className="text-xs font-semibold text-[#5c493e] sm:col-span-2">
                            Văn bản thay thế (Alt)
                            <input
                              required
                              value={banner.alt}
                              onChange={(e) => updateBanner(group, index, "alt", e.target.value)}
                              placeholder="Mô tả ngắn nội dung banner"
                              className={inputClass}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <div className="flex flex-wrap items-center gap-3 border-t border-[#efe2d4] pt-4">
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-2.5 text-sm font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{disabled ? "Đang xử lý…" : "Lưu banner"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBanners(initialBanners);
                setError("");
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e6d5c5] bg-white px-4 py-2.5 text-sm font-medium text-[#5c493e] transition hover:bg-[#faf5f0]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Hủy thay đổi banner</span>
            </button>
          </div>
        </fieldset>
      </form>
    </SectionCard>
  );
}
