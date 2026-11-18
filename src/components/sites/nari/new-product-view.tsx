"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { addToCart } from "@/lib/cart";
import type { newArrivals } from "@/lib/new-arrivals";

type Item = (typeof newArrivals)[number];

export function NewProductView({ item }: { item: Item }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();
  function add() { addToCart(item.slug, quantity); setAdded(true); }
  return <><Header /><main className="wrap snapshot-product">
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link> › <Link href="/hang-moi-ve.html?sort=position">Hàng Mới Về</Link> › {item.name}</div>
    <div className="snapshot-product-main"><div className="snapshot-product-image"><Image src={item.detail?.images[0] || item.image} alt={item.name} width={450} height={450} unoptimized /></div>
      <div className="snapshot-product-info"><p className="brand-link">{item.brand}</p><h1>{item.name}</h1><p>{item.description}</p><p className="snapshot-note">Thông tin ghi nhận ngày 13/11/2026; giá và tình trạng hàng có thể đã thay đổi.</p>
        <div className="detail-price"><strong>{item.price}</strong> {item.old && <del>{item.old}</del>}</div>
        <div className="quantity"><b>Số lượng</b><button type="button" aria-label="Giảm số lượng" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button type="button" aria-label="Tăng số lượng" onClick={() => setQuantity(quantity + 1)}>+</button></div>
        <div className="snapshot-product-actions"><button type="button" onClick={add}>THÊM VÀO GIỎ HÀNG</button><button type="button" onClick={() => { add(); router.push("/gio-hang"); }}>MUA NGAY</button></div>
        {added && <p role="status" className="added">Đã thêm vào giỏ hàng mẫu. <Link href="/gio-hang">Xem giỏ hàng</Link></p>}
        <p>Giỏ hàng và thanh toán trong bản này là giao diện thử nghiệm.</p>
      </div></div>
    <div className="snapshot-details"><nav className="snapshot-section-nav" aria-label="Thông tin sản phẩm"><a href="#mo-ta">Mô tả</a><a href="#thong-so">Thông số</a><a href="#huong-dan">HDSD</a><a href="#danh-gia">Đánh giá</a><a href="#hoi-dap">Hỏi đáp</a></nav>
      <section id="mo-ta" className="snapshot-section"><h2>Mô tả sản phẩm</h2><p>{item.description}</p><p>Nội dung mô tả đầy đủ chưa được thu thập. <a href={item.url}>Xem trên Nari Home</a></p></section>
      <section id="thong-so" className="snapshot-section"><h2>Thông số sản phẩm</h2>{item.detail?.specs.length ? <table><tbody>{item.detail.specs.map(([name, value], index) => <tr key={`${name}-${index}`}><th scope="row">{name}</th><td>{value}</td></tr>)}</tbody></table> : <p>Chưa có thông số trong dữ liệu đã lưu. <a href={item.url}>Xem trên Nari Home</a></p>}</section>
      <section id="huong-dan" className="snapshot-section"><h2>Hướng dẫn sử dụng</h2><p>Chưa có hướng dẫn trong dữ liệu đã lưu. <a href={item.url}>Xem trên Nari Home</a></p></section>
      <section id="danh-gia" className="snapshot-section"><h2>Đánh giá</h2><p>Chưa tải dữ liệu đánh giá. Việc gửi đánh giá cần tài khoản Nari Home.</p><a className="snapshot-source-button" href={item.url}>Xem và viết đánh giá trên Nari Home</a></section>
      <section id="hoi-dap" className="snapshot-section"><h2>Hỏi đáp</h2><p>Chưa tải dữ liệu hỏi đáp.</p><a className="snapshot-source-button" href={item.url}>Xem và gửi câu hỏi trên Nari Home</a></section>
    </div>
  </main><Footer /></>;
}
