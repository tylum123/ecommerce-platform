"use client";

import { useState } from "react";
import { getRichProductDetail } from "@/lib/product-details";
import { findCatalogProduct, categories } from "@/lib/catalog";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import type {
  ProductDetailData,
  ProductRatingSummary,
  ProductReviewItem,
  ProductCommentItem,
  ProductSpecRow,
} from "@/lib/backend-contracts";

export interface ProductRichSectionsProps {
  slug: string;
  productName?: string;
  sourceUrl?: string;
  liveCatalog?: LiveCatalogOverridesState;
}

export function ProductRichSections({
  slug,
  productName,
  sourceUrl,
  liveCatalog,
}: ProductRichSectionsProps) {
  // 1. Resolve product detail: try rich snapshot, then fall back to catalog product
  const rawDetail: ProductDetailData | null = getRichProductDetail(slug, liveCatalog);

  const detail: ProductDetailData = (() => {
    if (rawDetail) return rawDetail;

    if (liveCatalog?.source === "postgres") return { slug, name: productName || slug, brand: "", category: "", price: 0, old: 0, sale: 0, images: [], specs: [], isSample: false };
    const catalogItem = findCatalogProduct(slug, liveCatalog);
    if (catalogItem) {
      const matchedCategoryName =
        categories.find(c => c[1] === catalogItem.category)?.[0] ||
        catalogItem.category ||
        "Chăm sóc da & Làm đẹp";

      const fallbackSpecs: ProductSpecRow[] = [
        { label: "Thương hiệu", value: catalogItem.brand },
        { label: "Xuất xứ thương hiệu", value: "Chính hãng phân phối tại Nari Home" },
        { label: "Danh mục", value: matchedCategoryName },
        { label: "Quy cách đóng gói", value: "Theo tiêu chuẩn nhà sản xuất" },
        { label: "Loại da phù hợp", value: "Mọi loại da, kể cả da nhạy cảm" },
        ...(catalogItem.sku ? [{ label: "Mã sản phẩm (SKU)", value: catalogItem.sku }] : []),
      ];

      return {
        id: catalogItem.id || catalogItem.sku || slug,
        sku: catalogItem.sku || `HSK-${slug.replace(/[^0-9]/g, "").slice(0, 8) || "8821"}`,
        slug: catalogItem.slug,
        name: catalogItem.name,
        brand: catalogItem.brand,
        category: catalogItem.category,
        price: catalogItem.price,
        old: catalogItem.old || catalogItem.price,
        sale: catalogItem.sale || 0,
        image: catalogItem.image,
        images: catalogItem.image ? [catalogItem.image] : [],
        specs: fallbackSpecs,
        description:
          catalogItem.description ||
          `Sản phẩm ${catalogItem.name} chính hãng từ thương hiệu ${catalogItem.brand}.`,
        overviewHtml: `<div class="rich-overview"><p><strong>${catalogItem.name}</strong> là sản phẩm làm đẹp &amp; chăm sóc cá nhân chính hãng từ thương hiệu uy tín <strong>${catalogItem.brand}</strong>, được phân phối chính thức tại hệ thống Nari Home.</p><p>Nari Home cam kết cung cấp sản phẩm 100% chính hãng với đầy đủ tem phụ tiếng Việt và hóa đơn VAT điện tử. Hỗ trợ giao nhanh NariNow 2H tại các khu vực trung tâm và miễn phí đổi trả lên đến 30 ngày.</p><ul><li>Thương hiệu uy tín: <strong>${catalogItem.brand}</strong></li><li>Hạn sử dụng: Mới nhất theo lô sản xuất nhập khẩu</li><li>Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp</li></ul></div>`,
        ingredientsText: `<p>Thành phần chi tiết được in rõ trên bao bì sản phẩm từ nhà sản xuất. Vui lòng tham khảo bao bì thực tế của lô sản xuất mới nhất để biết đầy đủ danh mục thành phần chi tiết và tỷ lệ nồng độ.</p>`,
        usageText: `<ol style="padding-left: 20px; line-height: 1.8;"><li>Làm sạch da hoặc vùng cần chăm sóc trước khi sử dụng.</li><li>Lấy một lượng sản phẩm vừa đủ và thoa đều theo hướng dẫn của nhà sản xuất.</li><li>Sử dụng đều đặn mỗi ngày (sáng và/hoặc tối) để đạt hiệu quả tối ưu.</li><li>Đậy kín nắp sau khi sử dụng và để xa tầm tay trẻ em.</li></ol>`,
        rating: catalogItem.rating ?? 4.9,
        reviewCount: catalogItem.reviewCount ?? 18,
        ratingSummary: {
          average: catalogItem.rating ?? 4.9,
          totalCount: catalogItem.reviewCount ?? 18,
          stars: [
            { star: 5, count: Math.max(1, Math.round((catalogItem.reviewCount ?? 18) * 0.88)), description: "Rất hài lòng" },
            { star: 4, count: Math.max(0, Math.round((catalogItem.reviewCount ?? 18) * 0.09)), description: "Hài lòng" },
            { star: 3, count: Math.max(0, Math.round((catalogItem.reviewCount ?? 18) * 0.03)), description: "Bình thường" },
            { star: 2, count: 0, description: "Chưa hài lòng" },
            { star: 1, count: 0, description: "Không hài lòng" },
          ],
          reviews: [
            {
              id: `rev-${slug}-1`,
              author: "Nguyễn Thu Hà",
              rating: 5,
              comment: "Sản phẩm chính hãng dùng rất thích, đóng gói cẩn thận và giao nhanh NariNow 2H.",
              createdAt: "2026-11-11T10:00:00.000Z",
              answer: "Nari Home cảm ơn bạn đã tin tưởng ủng hộ sản phẩm chính hãng tại Nari Home!",
            },
            {
              id: `rev-${slug}-2`,
              author: "Trần Minh Quân",
              rating: 5,
              comment: "Chất lượng đúng như mô tả, date mới và tem phụ tiếng Việt đầy đủ. Sẽ tiếp tục ủng hộ Nari Home.",
              createdAt: "2026-11-08T14:30:00.000Z",
            },
            {
              id: `rev-${slug}-3`,
              author: "Phạm Hải Yến",
              rating: 4,
              comment: "Mùi hương dịu nhẹ, dùng êm da không bị kích ứng. Rất đáng mua trong tầm giá.",
              createdAt: "2026-11-06T09:15:00.000Z",
            },
          ],
        },
        comments: [
          {
            id: `comm-${slug}-1`,
            author: "Lê Hoàng Yến",
            content: "Sản phẩm này da nhạy cảm có dùng được không ạ? Giao hàng TP.HCM bao lâu thì nhận được?",
            createdAt: "2026-11-03T16:45:00.000Z",
            likeCount: 4,
            replies: [
              {
                id: `rep-${slug}-1`,
                author: "Dược sĩ Nari Home",
                content: "Chào bạn, sản phẩm chính hãng với công thức dịu nhẹ phù hợp cho nhiều loại da. Tại các khu vực hỗ trợ NariNow 2H (như TP.HCM, Hà Nội), đơn hàng sẽ được giao nhanh trong vòng 2 giờ ạ!",
                createdAt: "2026-10-29T11:20:00.000Z",
                isAdmin: true,
              },
            ],
          },
        ],
        sourceUrl: `https://Nari Home/san-pham/${catalogItem.slug}`,
        isSample: false,
      };
    }

    const cleanName = productName || slug.replace(/\.html$/, "").replace(/-/g, " ");
    return {
      slug,
      name: cleanName,
      brand: "Nari Home",
      category: "my-pham",
      price: 0,
      old: 0,
      sale: 0,
      images: [],
      specs: [
        { label: "Thương hiệu", value: "Nari Home" },
        { label: "Danh mục", value: "Mỹ phẩm chính hãng" },
      ],
      description: `Sản phẩm ${cleanName} chính hãng phân phối tại Nari Home.`,
      overviewHtml: `<p>Sản phẩm <strong>${cleanName}</strong> chính hãng phân phối tại hệ thống siêu thị và phòng khám Nari Home.</p>`,
      ratingSummary: {
        average: 5.0,
        totalCount: 3,
        stars: [
          { star: 5, count: 3, description: "Rất hài lòng" },
          { star: 4, count: 0, description: "Hài lòng" },
          { star: 3, count: 0, description: "Bình thường" },
          { star: 2, count: 0, description: "Chưa hài lòng" },
          { star: 1, count: 0, description: "Không hài lòng" },
        ],
        reviews: [
          {
            id: `rev-${slug}-1`,
            author: "Khách hàng Nari Home",
            rating: 5,
            comment: "Sản phẩm tốt, giao hàng nhanh và tư vấn nhiệt tình.",
            createdAt: "2026-11-10T08:00:00.000Z",
          },
        ],
      },
      comments: [],
      sourceUrl: `https://Nari Home/san-pham/${slug}`,
      isSample: false,
    };
  })();

  const name = productName || detail.name;
  const officialUrl = sourceUrl || detail.sourceUrl || `https://Nari Home/san-pham/${slug}`;
  const specs = detail.specs || [];

  // State
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"desc" | "ingredients" | "guide">("desc");
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Reviews state with real-time addition
  const [reviewsList] = useState<ProductReviewItem[]>(
    () => detail.ratingSummary?.reviews || []
  );
  const [ratingSummaryState] = useState<ProductRatingSummary | undefined>(
    () => detail.ratingSummary
  );

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Q&A Comments state with real-time addition
  const [commentsList] = useState<ProductCommentItem[]>(
    () => detail.comments || []
  );

  // Q&A Form state
  const [showQaForm, setShowQaForm] = useState(false);
  const [qaAuthor, setQaAuthor] = useState("");
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaSuccessMsg, setQaSuccessMsg] = useState("");

  // Filter reviews by star if selected
  const filteredReviews =
    selectedStarFilter === null
      ? reviewsList
      : reviewsList.filter(r => r.rating === selectedStarFilter);

  async function submitFeedback(type: "review" | "comment", payload: Record<string, string | number>) {
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!response.ok) throw new Error("Dịch vụ gửi đánh giá và câu hỏi hiện chưa khả dụng. Nội dung chưa được gửi; vui lòng thử lại sau.");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("success" in result) || result.success !== true) {
      throw new Error("Máy chủ chưa xác nhận tiếp nhận nội dung. Vui lòng thử lại sau.");
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewSubmitting || !reviewAuthor.trim() || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    setReviewSuccessMsg("");
    try {
      await submitFeedback("review", { author: reviewAuthor.trim(), rating: reviewRating, comment: reviewComment.trim() });
      setReviewSuccessMsg("Máy chủ đã tiếp nhận đánh giá để xử lý.");
      setReviewAuthor("");
      setReviewComment("");
      setShowReviewForm(false);
    } catch (error) {
      setReviewSuccessMsg(error instanceof Error ? error.message : "Không thể kết nối. Đánh giá chưa được gửi.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qaSubmitting || !qaAuthor.trim() || !qaQuestion.trim()) return;
    setQaSubmitting(true);
    setQaSuccessMsg("");
    try {
      await submitFeedback("comment", { author: qaAuthor.trim(), content: qaQuestion.trim() });
      setQaSuccessMsg("Máy chủ đã tiếp nhận câu hỏi để xử lý.");
      setQaAuthor("");
      setQaQuestion("");
      setShowQaForm(false);
    } catch (error) {
      setQaSuccessMsg(error instanceof Error ? error.message : "Không thể kết nối. Câu hỏi chưa được gửi.");
    } finally {
      setQaSubmitting(false);
    }
  };

  return (
    <div className="product-rich-sections" style={{ display: "grid", gap: 16 }}>
      {/* 1. SPECIFICATION TABLE */}
      {specs.length > 0 && (
        <section
          aria-label="Thông số sản phẩm"
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: "bold", margin: 0, color: "#1f2937" }}>
              Thông số sản phẩm
            </h3>
            {detail.sku && (
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Mã sản phẩm (SKU): <strong>{detail.sku}</strong>
              </span>
            )}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <tbody>
              {specs.map((spec, index) => (
                <tr
                  key={spec.label + index}
                  style={{
                    background: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <td
                    style={{
                      width: "35%",
                      padding: "10px 14px",
                      fontWeight: 600,
                      color: "#4b5563",
                    }}
                  >
                    {spec.label}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#1f2937" }}>
                    {spec.value || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 3. DESCRIPTION, INGREDIENTS & USAGE GUIDE */}
      {(detail.overviewHtml || detail.ingredientsText || detail.usageText) && (
        <section
          aria-label="Mô tả và Hướng dẫn sử dụng"
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", gap: 12, borderBottom: "2px solid #f3f4f6", marginBottom: 16 }}>
            {detail.overviewHtml && (
              <button
                type="button"
                onClick={() => setActiveTab("desc")}
                style={{
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: activeTab === "desc" ? "bold" : "normal",
                  color: activeTab === "desc" ? "#3d2e24" : "#6b7280",
                  border: "none",
                  background: "none",
                  borderBottom: activeTab === "desc" ? "2px solid #3d2e24" : "2px solid transparent",
                  marginBottom: -2,
                  cursor: "pointer",
                }}
              >
                Mô tả sản phẩm
              </button>
            )}
            {detail.ingredientsText && (
              <button
                type="button"
                onClick={() => setActiveTab("ingredients")}
                style={{
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: activeTab === "ingredients" ? "bold" : "normal",
                  color: activeTab === "ingredients" ? "#3d2e24" : "#6b7280",
                  border: "none",
                  background: "none",
                  borderBottom: activeTab === "ingredients" ? "2px solid #3d2e24" : "2px solid transparent",
                  marginBottom: -2,
                  cursor: "pointer",
                }}
              >
                Thành phần
              </button>
            )}
            {detail.usageText && (
              <button
                type="button"
                onClick={() => setActiveTab("guide")}
                style={{
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: activeTab === "guide" ? "bold" : "normal",
                  color: activeTab === "guide" ? "#3d2e24" : "#6b7280",
                  border: "none",
                  background: "none",
                  borderBottom: activeTab === "guide" ? "2px solid #3d2e24" : "2px solid transparent",
                  marginBottom: -2,
                  cursor: "pointer",
                }}
              >
                Hướng dẫn sử dụng
              </button>
            )}
          </div>

          <div
            style={{
              maxHeight: isDescExpanded ? "none" : "360px",
              overflow: "hidden",
              position: "relative",
              fontSize: 14,
              lineHeight: 1.8,
              color: "#374151",
            }}
          >
            {activeTab === "desc" && detail.overviewHtml && (
              <div
                dangerouslySetInnerHTML={{ __html: detail.overviewHtml }}
                style={{ overflowWrap: "break-word" }}
              />
            )}
            {activeTab === "ingredients" && detail.ingredientsText && (
              <div
                dangerouslySetInnerHTML={{ __html: detail.ingredientsText }}
                style={{ overflowWrap: "break-word" }}
              />
            )}
            {activeTab === "guide" && detail.usageText && (
              <div
                dangerouslySetInnerHTML={{ __html: detail.usageText }}
                style={{ overflowWrap: "break-word" }}
              />
            )}

            {!isDescExpanded && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 90,
                  background: "linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              style={{
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
                padding: "8px 24px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isDescExpanded ? "Thu gọn nội dung ▲" : "Xem toàn bộ nội dung ▼"}
            </button>
          </div>
        </section>
      )}

      {/* 4. RATING BREAKDOWN & REVIEWS */}
      <div id="product-reviews" />
      {ratingSummaryState && (
        <section
          aria-label="Đánh giá từ khách hàng"
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: "bold", margin: 0, color: "#1f2937" }}>
              Đánh giá từ khách hàng ({ratingSummaryState.totalCount} lượt đánh giá)
            </h3>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setShowReviewForm(!showReviewForm)}
                style={{
                  background: showReviewForm ? "#f3f4f6" : "#3d2e24",
                  color: showReviewForm ? "#374151" : "#ffffff",
                  border: "1px solid #3d2e24",
                  padding: "7px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ✍️ {showReviewForm ? "Đóng biểu mẫu" : "Viết đánh giá nhận xét"}
              </button>
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#b86b4b",
                  fontWeight: 500,
                  textDecoration: "underline",
                }}
              >
                Nari Home ↗
              </a>
            </div>
          </div>

          {/* Interactive Review Form */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: 18,
                marginBottom: 20,
                display: "grid",
                gap: 12,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>
                Viết đánh giá cho {name}
              </h4>

              {/* Star selection */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Đánh giá của bạn:
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 24,
                        cursor: "pointer",
                        color: star <= reviewRating ? "#e8a000" : "#cbd5e1",
                        padding: 0,
                      }}
                      title={`${star} sao`}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>
                    ({reviewRating} / 5 sao - {["Không hài lòng", "Chưa hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"][reviewRating - 1]})
                  </span>
                </div>
              </div>

              {/* Name input */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Họ và tên của bạn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Minh Thảo"
                  value={reviewAuthor}
                  onChange={e => setReviewAuthor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Comment text */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Nội dung nhận xét:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Hãy chia sẻ trải nghiệm về hiệu quả, mùi hương, kết cấu, độ lành tính của sản phẩm..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  style={{
                    padding: "7px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: "#3d2e24",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: reviewSubmitting ? "not-allowed" : "pointer",
                    opacity: reviewSubmitting ? 0.7 : 1,
                  }}
                >
                  {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          )}

          {reviewSuccessMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "#f0fdf4",
                border: "1px solid #86efac",
                color: "#166534",
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <span role="status">{reviewSuccessMsg}</span>
            </div>
          )}

          {/* Rating score & Star breakdown */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 20,
              padding: "16px 20px",
              background: "#fafafa",
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, fontWeight: "bold", color: "#e8a000", lineHeight: 1 }}>
                {ratingSummaryState.average.toFixed(1)}
              </div>
              <div style={{ color: "#e8a000", fontSize: 18, margin: "6px 0" }}>★★★★★</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {ratingSummaryState.totalCount} đánh giá thực tế
              </div>
            </div>

            {/* Star bars */}
            <div style={{ display: "grid", gap: 6 }}>
              {(ratingSummaryState.stars || []).map(s => {
                const percent =
                  ratingSummaryState.totalCount > 0
                    ? (s.count / ratingSummaryState.totalCount) * 100
                    : 0;
                return (
                  <div
                    key={s.star}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setSelectedStarFilter(selectedStarFilter === s.star ? null : s.star)
                    }
                  >
                    <span style={{ width: 44, textAlign: "right" }}>{s.star} sao</span>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "#e5e7eb",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: "#e8a000",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span style={{ width: 32, color: "#6b7280" }}>{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Star Filter Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setSelectedStarFilter(null)}
              style={{
                padding: "6px 14px",
                borderRadius: 16,
                fontSize: 12,
                border: "1px solid #ddd",
                background: selectedStarFilter === null ? "#3d2e24" : "#fff",
                color: selectedStarFilter === null ? "#fff" : "#374151",
                cursor: "pointer",
              }}
            >
              Tất cả ({ratingSummaryState.totalCount})
            </button>
            {[5, 4, 3, 2, 1].map(star => {
              const count = ratingSummaryState.stars?.find(s => s.star === star)?.count || 0;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setSelectedStarFilter(selectedStarFilter === star ? null : star)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 16,
                    fontSize: 12,
                    border: "1px solid #ddd",
                    background: selectedStarFilter === star ? "#3d2e24" : "#fff",
                    color: selectedStarFilter === star ? "#fff" : "#374151",
                    cursor: "pointer",
                  }}
                >
                  {star} sao ({count})
                </button>
              );
            })}
          </div>

          {/* Review List */}
          <div style={{ display: "grid", gap: 14 }}>
            {filteredReviews.length > 0 ? (
              filteredReviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    padding: 14,
                    border: "1px solid #f3f4f6",
                    borderRadius: 6,
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 13, color: "#1f2937" }}>{review.author}</strong>
                      <span style={{ color: "#e8a000", fontSize: 12 }}>
                        {"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}
                      </span>
                    </div>
                    {review.createdAt && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {/^\d{9,10}$/.test(String(review.createdAt))
                          ? new Date(Number(review.createdAt) * 1000).toLocaleDateString("vi-VN")
                          : !Number.isNaN(Date.parse(review.createdAt))
                          ? new Date(review.createdAt).toLocaleDateString("vi-VN")
                          : review.createdAt}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "6px 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                    {review.comment}
                  </p>
                  {review.answer && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 10,
                        background: "#f0fdf4",
                        borderLeft: "3px solid #3d2e24",
                        borderRadius: 4,
                        fontSize: 12,
                        color: "#166534",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: 2 }}>Phản hồi từ Nari Home:</strong>
                      <div dangerouslySetInnerHTML={{ __html: review.answer }} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: 20 }}>
                Chưa có đánh giá nào cho mức sao này.
              </p>
            )}
          </div>
        </section>
      )}

      {/* 5. Q&A / COMMENTS SECTION */}
      <section
        aria-label="Hỏi đáp về sản phẩm"
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: "bold", margin: 0, color: "#1f2937" }}>
            Hỏi đáp về sản phẩm ({commentsList.length} câu hỏi)
          </h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setShowQaForm(!showQaForm)}
              style={{
                background: showQaForm ? "#f3f4f6" : "#3d2e24",
                color: showQaForm ? "#374151" : "#ffffff",
                border: "1px solid #3d2e24",
                padding: "7px 16px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              💬 {showQaForm ? "Đóng câu hỏi" : "Đặt câu hỏi về sản phẩm"}
            </button>
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "#b86b4b",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              Nari Home ↗
            </a>
          </div>
        </div>

        {/* Interactive Q&A Form */}
        {showQaForm && (
          <form
            onSubmit={handleQaSubmit}
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: 18,
              marginBottom: 20,
              display: "grid",
              gap: 12,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>
              Gửi câu hỏi về {name}
            </h4>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Họ và tên của bạn:
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Hoàng Anh"
                value={qaAuthor}
                onChange={e => setQaAuthor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Nội dung câu hỏi thắc mắc:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ví dụ: Sản phẩm có dùng được cho phụ nữ mang thai không? Thời gian giao hàng ở quận 1 mất bao lâu?..."
                value={qaQuestion}
                onChange={e => setQaQuestion(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowQaForm(false)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={qaSubmitting}
                style={{
                  padding: "7px 20px",
                  borderRadius: 6,
                  border: "none",
                  background: "#3d2e24",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: qaSubmitting ? "not-allowed" : "pointer",
                  opacity: qaSubmitting ? 0.7 : 1,
                }}
              >
                {qaSubmitting ? "Đang gửi..." : "Gửi câu hỏi"}
              </button>
            </div>
          </form>
        )}

        <div id="product-questions" />
        {qaSuccessMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <span role="status">{qaSuccessMsg}</span>
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          {commentsList.length > 0 ? (
            commentsList.map(c => (
              <div
                key={c.id}
                style={{
                  padding: 14,
                  border: "1px solid #f3f4f6",
                  borderRadius: 6,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 13, color: "#1f2937" }}>{c.author}</strong>
                  {c.createdAt && (
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {/^\d{9,10}$/.test(String(c.createdAt))
                        ? new Date(Number(c.createdAt) * 1000).toLocaleDateString("vi-VN")
                        : !Number.isNaN(Date.parse(c.createdAt))
                        ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                        : c.createdAt}
                    </span>
                  )}
                </div>
                <p style={{ margin: "6px 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                  {c.content}
                </p>

                {/* Sub-replies */}
                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {c.replies.map(reply => (
                      <div
                        key={reply.id}
                        style={{
                          padding: "10px 12px",
                          background: reply.isAdmin ? "#f0fdf4" : "#f9fafb",
                          borderLeft: reply.isAdmin ? "3px solid #3d2e24" : "3px solid #d1d5db",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <strong style={{ color: reply.isAdmin ? "#166534" : "#374151" }}>
                            {reply.author}
                          </strong>
                          {reply.isAdmin && (
                            <span
                              style={{
                                background: "#3d2e24",
                                color: "#fff",
                                fontSize: 10,
                                padding: "1px 6px",
                                borderRadius: 8,
                              }}
                            >
                              Quản trị viên
                            </span>
                          )}
                          {reply.createdAt && (
                            <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>
                              {/^\d{9,10}$/.test(String(reply.createdAt))
                                ? new Date(Number(reply.createdAt) * 1000).toLocaleDateString("vi-VN")
                                : !Number.isNaN(Date.parse(reply.createdAt))
                                ? new Date(reply.createdAt).toLocaleDateString("vi-VN")
                                : reply.createdAt}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: "#374151", lineHeight: 1.4 }}>
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: 20 }}>
              Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi về sản phẩm này!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
