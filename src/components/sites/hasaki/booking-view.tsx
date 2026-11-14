"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import branches from "../../../../docs/research/hasaki/booking-branches-2026-11-13.json";

const times = Array.from({ length: 17 }, (_, index) => `${String(9 + Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const subscribeDate = () => () => {};
const currentDate = () => dateKey(new Date());
const serverDate = () => "";

export function BookingView({ initialService = "" }: { initialService?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const today = useSyncExternalStore(subscribeDate, currentDate, serverDate);
  const dates = today ? Array.from({ length: 28 }, (_, i) => { const day = new Date(`${today}T12:00:00`); day.setDate(day.getDate() + i); return dateKey(day); }) : [];
  const [week, setWeek] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [branch, setBranch] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [service, setService] = useState(initialService);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedDate = date || dates[0] || "";
  const selectedBranch = branches.find(item => item.id === branch);

  function changeWeek(next: number) {
    setWeek(next);
    setDate(dates[next * 7] || "");
    setTime("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (!/^0\d{9}$/.test(phone.trim())) {
      setError("Vui lòng nhập số điện thoại gồm 10 chữ số bắt đầu bằng 0.");
      return;
    }
    if (!name.trim() || !branch || !service.trim() || !selectedDate || !time) {
      setError("Vui lòng điền họ tên, chọn chi nhánh, dịch vụ và ngày giờ.");
      return;
    }

    setError("");
    setPreview(false);
    setSubmitting(true);

    const bookingPayload = {
      name: name.trim(),
      phone: phone.trim(),
      branchId: branch,
      branchName: selectedBranch?.name || "",
      branchAddress: selectedBranch?.address || "",
      service: service.trim(),
      date: selectedDate,
      time,
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload),
      });
      if (!response.ok) throw new Error("Dịch vụ đặt lịch hiện chưa khả dụng. Lịch hẹn chưa được tạo; vui lòng đặt trực tiếp với Hasaki.");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("code" in result) || typeof result.code !== "string" || !result.code) {
        throw new Error("Máy chủ chưa trả mã xác nhận lịch hẹn. Vui lòng thử lại sau.");
      }
      setBookingCode(result.code);
      setPreview(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể kết nối dịch vụ đặt lịch. Lịch hẹn chưa được tạo.");
    } finally {
      setSubmitting(false);
    }
  }

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
          <Link href="/booking" style={{ fontWeight: "bold", color: "#f47722" }}>
            ĐẶT HẸN
          </Link>
        </div>
      </nav>

      <main className="booking-page wrap">
        <div className="breadcrumbs" style={{ paddingTop: 0 }}>
          <Link href="/">Trang chủ</Link> › <Link href="/clinic">Hasaki Clinic &amp; Spa</Link> › Đặt hẹn
        </div>
        <div className="booking-steps" aria-label="Các phần thông tin đặt hẹn">
          ① Số điện thoại　–　② Chi nhánh　–　③ Dịch vụ　–　④ Ngày giờ
        </div>
        <p className="booking-disclaimer">
          Giao diện thử nghiệm: danh sách chi nhánh ghi nhận ngày 13/11/2026; khung giờ là ví dụ, không xác nhận tình trạng còn chỗ và không gửi lịch hẹn.
        </p>

        <form onSubmit={submit} noValidate>
          <section className="booking-box">
            <h1>
              Thông Tin Đặt Hẹn <em>*</em>
            </h1>
            <div className="booking-contact">
              <label>
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                />
              </label>
              <label>
                <span>Họ và tên</span>
                <input
                  maxLength={50}
                  placeholder="Họ và tên"
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="booking-box">
            <h2>
              Chọn Chi Nhánh <em>*</em>
            </h2>
            <div className="booking-rail-wrap">
              <button
                type="button"
                className="booking-arrow previous"
                aria-label="Chi nhánh trước"
                onClick={() => rail.current?.scrollBy({ left: -460, behavior: "smooth" })}
              >
                ‹
              </button>
              <div className="booking-rail" ref={rail}>
                {branches.map(item => (
                  <label
                    className={`booking-branch ${branch === item.id ? "selected" : ""}`}
                    key={item.id}
                  >
                    <Image src={item.image} alt="" width={220} height={146} unoptimized />
                    <span>{item.name}</span>
                    <span>{item.address}</span>
                    <input
                      type="radio"
                      name="branch"
                      value={item.id}
                      checked={branch === item.id}
                      onChange={() => {
                        setBranch(item.id);
                        setPreview(false);
                      }}
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="booking-arrow next"
                aria-label="Chi nhánh tiếp theo"
                onClick={() => rail.current?.scrollBy({ left: 460, behavior: "smooth" })}
              >
                ›
              </button>
            </div>
          </section>

          <section className="booking-box">
            <h2>
              <label htmlFor="booking-service">
                Dịch vụ bạn muốn làm <em>*</em>
              </label>
            </h2>
            <input
              id="booking-service"
              className="booking-input"
              placeholder="Nhập tên dịch vụ bạn muốn làm..."
              value={service}
              onChange={event => setService(event.target.value)}
            />
          </section>

          <section className="booking-box">
            <h2>
              Chọn Ngày Giờ <em>*</em> <small>Khung giờ minh họa</small>
            </h2>
            <div className="booking-dates">
              <button
                type="button"
                aria-label="Tuần trước"
                disabled={week === 0}
                onClick={() => changeWeek(week - 1)}
              >
                ‹
              </button>
              {dates.slice(week * 7, week * 7 + 7).map(value => {
                const day = new Date(`${value}T12:00:00`);
                return (
                  <button
                    type="button"
                    key={value}
                    className={selectedDate === value ? "selected" : ""}
                    aria-pressed={selectedDate === value}
                    onClick={() => {
                      setDate(value);
                      setTime("");
                    }}
                  >
                    {new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(day)}
                    <br />
                    <b>
                      {new Intl.DateTimeFormat("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      }).format(day)}
                    </b>
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Tuần tiếp theo"
                disabled={week >= 3}
                onClick={() => changeWeek(week + 1)}
              >
                ›
              </button>
            </div>
            <div className="booking-times">
              {times.map(value => (
                <button
                  type="button"
                  key={value}
                  className={time === value ? "selected" : ""}
                  aria-pressed={time === value}
                  onClick={() => setTime(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </section>

          <p className="booking-help">
            * Nếu đặt nhiều người, vui lòng dùng số điện thoại khác cho mỗi người hoặc gọi{" "}
            <a href="tel:18006324">1800 6324</a> (nhấn phím 2) để được sắp xếp.
          </p>
          {error && (
            <p role="alert" className="booking-error">
              {error}
            </p>
          )}

          <div className="booking-actions">
            <Link href="/">Quay lại</Link>
            <button type="submit" disabled={submitting || preview}>{submitting ? "Đang gửi..." : "Đặt hẹn"}</button>
          </div>
        </form>

        {preview && (
          <div className="booking-preview" role="status">
            <h2>Thông tin đặt hẹn mẫu</h2>
            {bookingCode && (
              <p style={{ color: "#326e51" }}>
                Mã đặt hẹn: <strong>{bookingCode}</strong>
              </p>
            )}
            <p>
              {name} · {phone}
            </p>
            <p>
              {selectedBranch?.name} — {selectedBranch?.address}
            </p>
            <p>
              {service} · {selectedDate} · {time}
            </p>
            <p style={{ margin: "10px 0" }}>
              <Link
                href="/khach-hang/lich-hen"
                className="booking-portal-link"
                style={{ color: "#326e51", fontWeight: "bold", textDecoration: "underline" }}
              >
                Xem lịch hẹn trong Cổng khách hàng →
              </Link>
            </p>
            <strong>Chưa gửi lịch hẹn. Vui lòng đặt trực tiếp với Hasaki để xác nhận.</strong>{" "}
            <a href="https://hasaki.vn/booking">Mở trang đặt hẹn Hasaki</a>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
