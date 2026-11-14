"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import {
  clinicServices,
  getClinicServiceRichDetail,
  categorizeClinicService,
} from "@/lib/clinic-services";

type Service = (typeof clinicServices)[number];

export function ServiceView({ service }: { service: Service }) {
  const richDetail = getClinicServiceRichDetail(service.slug);

  // Gallery image state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state & interactive form
  const reviews = richDetail.ratingSummary.reviews;
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  // Comments state & interactive form
  const comments = richDetail.comments;
  const [qaAuthor, setQaAuthor] = useState("");
  const [qaContent, setQaContent] = useState("");
  const [qaMsg, setQaMsg] = useState("");

  // Related clinic services (4 items from same category or others)
  const currentCategory = categorizeClinicService(service.name);
  const relatedCandidates = clinicServices.filter(item => item.slug !== service.slug);
  const sameCategoryItems = relatedCandidates.filter(
    item => categorizeClinicService(item.name) === currentCategory
  );
  const otherItems = relatedCandidates.filter(
    item => categorizeClinicService(item.name) !== currentCategory
  );
  const relatedServices = [...sameCategoryItems, ...otherItems].slice(0, 4);

  const sku =
    new URLSearchParams(service.booking.split("?")[1] || "").get("sku") || richDetail.sku;

  function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewMsg("Gửi đánh giá tạm chưa hỗ trợ. Nội dung của bạn chưa được gửi hoặc lưu.");
  }

  function handleQaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQaMsg("Gửi câu hỏi tạm chưa hỗ trợ. Nội dung chưa được chuyển tới bác sĩ hoặc tư vấn viên.");
  }

  const currentImage =
    richDetail.images[activeImageIndex] || service.detail?.image || service.image || "";

  return (
    <>
      <Header />
      <nav className="booking-clinic-nav" aria-label="Hasaki Clinic">
        <div className="wrap">
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">HASAKI CLINIC &amp; SPA</Link>
          <Link href="/ho-tro/gioi-thieu">GIỚI THIỆU</Link>
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">DỊCH VỤ</Link>
          <Link href="/bang-gia-dich-vu.html">BẢNG GIÁ</Link>
          <Link href="/cam-nang.html">CẨM NANG</Link>
          <Link href="/ho-tro/lien-he">LIÊN HỆ</Link>
          <Link href="/booking">ĐẶT HẸN</Link>
        </div>
      </nav>

      <main className="wrap snapshot-product service-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> ›{" "}
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">Hasaki Clinic &amp; Spa</Link> ›{" "}
          {service.name}
        </div>

        <div className="snapshot-product-main">
          <div className="snapshot-product-image">
            <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
              <Image
                src={currentImage}
                alt={service.name}
                width={450}
                height={450}
                style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: "6px" }}
                unoptimized
              />
            </div>

            {/* Multi-image gallery thumbnails */}
            {richDetail.images.length > 1 && (
              <div
                className="gallery-thumbs"
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "12px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                }}
              >
                {richDetail.images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      border:
                        activeImageIndex === idx ? "2px solid #326e51" : "1px solid #ddd",
                      padding: "2px",
                      borderRadius: "4px",
                      background: "white",
                      cursor: "pointer",
                      flex: "0 0 60px",
                      height: "60px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    aria-label={`Xem ảnh ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt=""
                      width={60}
                      height={60}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="snapshot-product-info">
            <h1>{service.name}</h1>
            {service.detail?.subtitle && (
              <p style={{ color: "#326e51", fontWeight: 500, margin: "4px 0 10px" }}>
                {service.detail.subtitle}
              </p>
            )}
            <p className="snapshot-note">
              Thông tin dịch vụ và giá ghi nhận ngày 13/11/2026, có thể đã thay đổi.
            </p>
            <p style={{ fontSize: "13px", color: "#666" }}>
              Mã dịch vụ: <strong>{sku}</strong> · Chuyên khoa: <strong>{currentCategory}</strong>
            </p>
            <div className="detail-price">
              <strong>{service.price}</strong>
              <span style={{ fontSize: "12px", color: "#2d754e", background: "#e8f5ec", padding: "4px 8px", borderRadius: "4px" }}>
                100% Khám da miễn phí với Bác sĩ Da Liễu
              </span>
            </div>
            <p style={{ fontSize: "14px", margin: "10px 0" }}>
              ⏱ Thời lượng: <strong>{service.duration}</strong>
            </p>
            <div style={{ margin: "16px 0" }}>
              <Link className="service-book" href={service.booking}>
                Đặt hẹn ngay
              </Link>
            </div>
            <p style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>
              Lịch hẹn local là bản thử nghiệm và chưa gửi tới Hasaki.
            </p>

            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                background: "#f7faf8",
                border: "1px solid #dbeae2",
                borderRadius: "6px",
                fontSize: "12px",
                lineHeight: "1.6",
                color: "#2f5c44",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>CAM KẾT DỊCH VỤ TẠI HASAKI CLINIC:</div>
              <div>✓ 100% Bác sĩ chuyên khoa Da Liễu trực tiếp thăm khám và tư vấn.</div>
              <div>✓ Mỗi khách hàng 01 bộ dụng cụ vô trùng riêng biệt, tránh lây nhiễm chéo.</div>
              <div>✓ Máy móc, công nghệ chuẩn y khoa chính hãng được FDA chứng nhận.</div>
            </div>
          </div>
        </div>

        <div className="snapshot-details">
          <nav className="snapshot-section-nav" aria-label="Thông tin dịch vụ">
            <a href="#mo-ta">Mô tả &amp; Liệu trình</a>
            <a href="#danh-gia">Đánh giá ({reviews.length})</a>
            <a href="#hoi-dap">Hỏi đáp ({comments.length})</a>
          </nav>

          {/* Section: Mô tả & Liệu trình */}
          <section className="snapshot-section" id="mo-ta">
            <h2>Mô tả dịch vụ</h2>
            <p>{service.description.replace(/Xem thêm$/, "")}</p>

            {/* Protocol / Specification table */}
            <div style={{ margin: "24px 0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#326e51" }}>
                Thông tin liệu trình &amp; Thông số chuyên khoa
              </h3>
              <table>
                <tbody>
                  {richDetail.specs.map((spec, i) => (
                    <tr key={`${spec.name}-${i}`}>
                      <th>{spec.name || "Thông số"}</th>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed clinical description */}
            <div
              style={{ marginTop: "20px", lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: richDetail.overviewHtml }}
            />

            {/* Treatment Protocol steps */}
            <div
              style={{ marginTop: "20px", lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: richDetail.usageHtml }}
            />

            <div style={{ marginTop: "24px" }}>
              <a
                className="snapshot-source-button"
                href={service.url}
                target="_blank"
                rel="noreferrer"
              >
                Xem thông tin trên Hasaki.vn →
              </a>
            </div>
          </section>

          {/* Section: Đánh giá */}
          <section className="snapshot-section" id="danh-gia">
            <h2>Đánh giá từ khách hàng</h2>

            {/* Rating Summary Card */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px",
                background: "#fafbf9",
                border: "1px solid #eee",
                padding: "20px",
                borderRadius: "8px",
                margin: "16px 0 24px",
              }}
            >
              <div style={{ textAlign: "center", borderRight: "1px solid #eee" }}>
                <div style={{ fontSize: "44px", fontWeight: "bold", color: "#326e51", lineHeight: 1 }}>
                  {richDetail.ratingSummary.average.toFixed(1)}
                </div>
                <div style={{ color: "#f59e0b", fontSize: "20px", margin: "6px 0" }}>★★★★★</div>
                <div style={{ fontSize: "13px", color: "#777" }}>
                  Dựa trên {richDetail.ratingSummary.totalCount} đánh giá thực tế
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
                {richDetail.ratingSummary.stars.map(s => (
                  <div
                    key={s.star}
                    style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}
                  >
                    <span style={{ width: "40px" }}>{s.star} sao</span>
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        background: "#e5e7eb",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${s.percent}%`,
                          height: "100%",
                          background: "#f59e0b",
                        }}
                      />
                    </div>
                    <span style={{ width: "35px", textAlign: "right", color: "#666" }}>
                      {s.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Review Form */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #dce8e1",
                padding: "18px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "12px", color: "#326e51" }}>
                Viết đánh giá dịch vụ
              </h3>
              <form onSubmit={handleReviewSubmit}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px" }}>Mức độ hài lòng:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setReviewRating(st)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "20px",
                          color: st <= reviewRating ? "#f59e0b" : "#d1d5db",
                        }}
                        aria-label={`${st} sao`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: "12px", color: "#666" }}>({reviewRating} sao)</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Họ và tên của bạn *"
                    value={reviewAuthor}
                    onChange={e => setReviewAuthor(e.target.value)}
                    style={{
                      border: "1px solid #ddd",
                      padding: "9px 12px",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Chia sẻ trải nghiệm thực tế của bạn sau khi trải nghiệm liệu trình tại Hasaki Clinic..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #ddd",
                    padding: "9px 12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    marginBottom: "10px",
                    fontFamily: "inherit",
                  }}
                />

                {reviewMsg && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: reviewMsg.includes("thành công") ? "#2e7d32" : "#c62828",
                      marginBottom: "10px",
                      fontWeight: 500,
                    }}
                  >
                    {reviewMsg}
                  </p>
                )}

                <button
                  type="submit"
                  style={{
                    background: "#326e51",
                    color: "white",
                    border: "none",
                    padding: "9px 20px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Gửi đánh giá
                </button>
              </form>
            </div>

            {/* Scraped Customer Reviews list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>{rev.author}</div>
                    <span style={{ fontSize: "12px", color: "#888" }}>{rev.createdAt}</span>
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: "14px", marginBottom: "6px" }}>
                    {"★".repeat(rev.rating || 5)}
                    {"☆".repeat(5 - (rev.rating || 5))}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#444", lineHeight: "1.5" }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px" }}>
              <a
                className="snapshot-source-button"
                href={service.url}
                target="_blank"
                rel="noreferrer"
              >
                Xem thêm đánh giá trên Hasaki →
              </a>
            </div>
          </section>

          {/* Section: Hỏi đáp */}
          <section className="snapshot-section" id="hoi-dap">
            <h2>Hỏi đáp về dịch vụ</h2>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
              Mọi thắc mắc của bạn sẽ được đội ngũ Bác sĩ chuyên khoa Da Liễu và Chuyên viên tư vấn Hasaki Clinic giải đáp tận tình.
            </p>

            {/* Interactive Q&A Form */}
            <div
              style={{
                background: "#fbfcfe",
                border: "1px solid #d5e3ef",
                padding: "18px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "12px", color: "#2563eb" }}>
                Đặt câu hỏi cho bác sĩ / tư vấn viên
              </h3>
              <form onSubmit={handleQaSubmit}>
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Họ và tên của bạn *"
                    value={qaAuthor}
                    onChange={e => setQaAuthor(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: "360px",
                      border: "1px solid #ddd",
                      padding: "9px 12px",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Nhập câu hỏi của bạn về tình trạng da, chi phí, phác đồ điều trị..."
                  value={qaContent}
                  onChange={e => setQaContent(e.target.value)}
                  style={{
                    width: "100%",
                    border: "1px solid #ddd",
                    padding: "9px 12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    marginBottom: "10px",
                    fontFamily: "inherit",
                  }}
                />

                {qaMsg && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#2563eb",
                      marginBottom: "10px",
                      fontWeight: 500,
                    }}
                  >
                    {qaMsg}
                  </p>
                )}

                <button
                  type="submit"
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "9px 20px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Gửi câu hỏi
                </button>
              </form>
            </div>

            {/* Scraped Q&A comments & Hasaki Care replies */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {comments.map(comm => (
                <div
                  key={comm.id}
                  style={{
                    border: "1px solid #f0f0f0",
                    background: "white",
                    padding: "16px",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#333" }}>
                      👤 {comm.author}
                    </div>
                    <span style={{ fontSize: "12px", color: "#888" }}>
                      {comm.createdAt.includes("T") ? comm.createdAt.slice(0, 10) : comm.createdAt}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#333", lineHeight: 1.5 }}>
                    {comm.content}
                  </p>

                  {/* Hasaki Care Replies */}
                  {comm.replies && comm.replies.length > 0 && (
                    <div
                      style={{
                        background: "#f4f9f6",
                        borderLeft: "3px solid #326e51",
                        padding: "12px 14px",
                        borderRadius: "0 6px 6px 0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {comm.replies.map((reply, rIdx) => (
                        <div key={reply.id || rIdx}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "13px", color: "#326e51" }}>
                              {reply.author}
                            </strong>
                            <span
                              style={{
                                fontSize: "10px",
                                background: "#326e51",
                                color: "white",
                                padding: "2px 6px",
                                borderRadius: "3px",
                              }}
                            >
                              Chăm sóc khách hàng
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "#222", lineHeight: "1.5" }}>
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px" }}>
              <a
                className="snapshot-source-button"
                href={service.url}
                target="_blank"
                rel="noreferrer"
              >
                Xem thêm hỏi đáp trên Hasaki →
              </a>
            </div>
          </section>
        </div>

        {/* Dịch vụ liên quan tại Hasaki Clinic */}
        <section style={{ marginTop: "36px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#222" }}>
              Dịch vụ liên quan tại Hasaki Clinic
            </h2>
            <Link
              href="/danh-muc/hasaki-clinic-spa-c331.html"
              style={{ fontSize: "13px", color: "#326e51", fontWeight: "bold" }}
            >
              Xem tất cả 42 dịch vụ →
            </Link>
          </div>

          <div className="clinic-service-grid">
            {relatedServices.map(item => (
              <article className="clinic-service-card" key={item.url}>
                <Link href={`/dich-vu/${item.url.split("/").pop()}`}>
                  <small>{categorizeClinicService(item.name)}</small>
                  <h2>{item.name}</h2>
                  <Image
                    src={item.image || ""}
                    alt={item.name}
                    width={380}
                    height={380}
                    unoptimized
                  />
                  <strong>{item.price}</strong>
                  <p>{item.duration}</p>
                </Link>
                <p className="clinic-description">
                  {item.description.replace(/Xem thêm$/, "")}{" "}
                  <Link href={`/dich-vu/${item.url.split("/").pop()}`}>Xem thêm</Link>
                </p>
                <div className="clinic-card-actions">
                  <a href="tel:18006324">
                    1800 6324
                    <br />
                    <small>(nhấn phím 2)</small>
                  </a>
                  <Link href={item.booking}>Đặt hẹn</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
