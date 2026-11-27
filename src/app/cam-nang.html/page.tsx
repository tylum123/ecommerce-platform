"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";

interface GuideArticle {
  id: string;
  title: string;
  topic: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  summary: string;
  contentHtml: string;
  relatedService: {
    name: string;
    url: string;
    price: string;
  };
  relatedProduct?: {
    name: string;
    url: string;
    price: string;
  };
}

const TOPICS = [
  "Tất cả",
  "Trị mụn chuẩn y khoa",
  "Triệt lông Diode Laser",
  "Chăm sóc da nhạy cảm",
  "Chống lão hóa",
] as const;

const ARTICLES: GuideArticle[] = [
  {
    id: "quy-trinh-lay-mun-y-khoa",
    title: "Quy trình lấy mụn chuẩn Y khoa 12 bước: Vì sao không nên tự nặn mụn tại nhà?",
    topic: "Trị mụn chuẩn y khoa",
    author: "BS. CKI Da Liễu Nguyễn Thảo Nhi",
    date: "12/11/2026",
    readTime: "5 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/4/_/4_avt-mun-249k-1716968747.jpg",
    summary:
      "Tự ý nặn mụn bằng tay hoặc que kim loại tại nhà là nguyên nhân hàng đầu khiến vi khuẩn P.acnes lan rộng, gây viêm sâu và để lại sẹo rỗ vĩnh viễn. Tìm hiểu quy trình lấy mụn bằng tăm bông vô trùng tại Nari Clinic & Spa.",
    contentHtml: `
      <p>Nhiều người thường có thói quen dùng tay hoặc cây nặn mụn kim loại để loại bỏ nhân mụn ngay khi thấy cồi trắng xuất hiện. Tuy nhiên, hành động này tiềm ẩn rủi ro phá vỡ thành nang lông bên dưới bề mặt da, đẩy ổ viêm vào sâu trung bì và để lại sẹo rỗ vĩnh viễn.</p>
      
      <h4>Quy trình lấy mụn 12 bước chuẩn y khoa tại Nari Clinic & Spa</h4>
      <ol>
        <li><strong>Bác sĩ thăm khám:</strong> Bác sĩ Da Liễu soi da, phân loại mức độ mụn (mụn ẩn, mụn đầu đen, mụn viêm).</li>
        <li><strong>Tẩy trang dịu nhẹ:</strong> Loại bỏ dầu thừa và cặn trang điểm với dược mỹ phẩm Bioderma/La Roche-Posay.</li>
        <li><strong>Rửa mặt sạch sâu:</strong> Làm sạch bã nhờn bằng sữa rửa mặt pH 5.5 cân bằng.</li>
        <li><strong>Xông hơi nóng &amp; hút bã nhờn:</strong> Giúp giãn nở lỗ chân lông tự nhiên, hạn chế ma sát.</li>
        <li><strong>Sát khuẩn y tế Povidine:</strong> Đảm bảo vô trùng tuyệt đối toàn bộ bề mặt da.</li>
        <li><strong>Lấy nhân mụn bằng tăm bông vô trùng:</strong> Kỹ thuật viên dùng đầu tăm bông tiệt trùng gắp nhẹ cồi mụn mà không làm dập mô da xung quanh.</li>
        <li><strong>Sát khuẩn lại bằng cồn đỏ &amp; nước muối sinh lý:</strong> Ngăn ngừa vi khuẩn xâm nhập vào miệng vết thương.</li>
        <li><strong>Điện tím diệt khuẩn:</strong> Ứng dụng tia ozon kháng viêm tại chỗ, làm khô se cồi mụn tức thì.</li>
        <li><strong>Đắp mặt nạ thảo dược kháng khuẩn:</strong> Giảm sưng đỏ, làm dịu da nhanh chóng.</li>
        <li><strong>Chiếu Ánh Sáng Sinh Học ASSH (Ánh sáng xanh):</strong> Tiêu diệt triệt để vi khuẩn P.acnes còn sót lại.</li>
        <li><strong>Thoa kem dưỡng phục hồi chuyên sâu:</strong> Cấp ẩm và củng cố hàng rào bảo vệ da.</li>
        <li><strong>Dặn dò chăm sóc tại nhà:</strong> Bác sĩ hướng dẫn chế độ sinh hoạt và cấp phát cồn đỏ sát trùng.</li>
      </ol>

      <h4>Lời khuyên từ Bác sĩ Da Liễu</h4>
      <p>Trong 24 giờ đầu sau lấy mụn, bạn chỉ nên rửa mặt bằng nước muối sinh lý và tránh bôi thoa các loại kem đặc, serum có hoạt tính mạnh như BHA, AHA hoặc Retinol. Duy trì lịch lấy mụn 2 - 3 tuần/lần kết hợp bôi thuốc theo đơn của bác sĩ để điều trị mụn tận gốc.</p>
    `,
    relatedService: {
      name: "Combo Lấy Mụn + Mặt Nạ Jean D'Arcel + Chiếu ASSH",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "249.000 ₫",
    },
    relatedProduct: {
      name: "Dung Dịch Tẩy Trang Bioderma Sébium H2O Cho Da Dầu Mụn 500ml",
      url: "/danh-muc/sua-rua-mat-c19.html",
      price: "385.000 ₫",
    },
  },
  {
    id: "cong-nghe-diode-laser-triet-long",
    title: "Công nghệ Diode Laser là gì? Vì sao triệt lông Diode Laser lại vượt trội hơn IPL?",
    topic: "Triệt lông Diode Laser",
    author: "ThS. BS Trần Đình Quân",
    date: "10/11/2026",
    readTime: "6 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/c/o/cong-nghe-diode-laser-triet-long-bao-hanh-5-nam.jpg",
    summary:
      "So sánh chi tiết bước sóng 808nm chuyên sâu của Diode Laser với ánh sáng phân tán IPL. Khám phá lý do công nghệ Diode Laser tại Nari Clinic & Spa giúp triệt sạch lông tận gốc và được cam kết bảo hành 5 năm bằng văn bản.",
    contentHtml: `
      <p>Triệt lông vĩnh viễn là một trong những nhu cầu thẩm mỹ phổ biến nhất hiện nay. Tuy nhiên, nhiều khách hàng vẫn nhầm lẫn giữa công nghệ Diode Laser hiện đại và công nghệ IPL thế hệ cũ.</p>

      <h4>Sự khác biệt cốt lõi giữa Diode Laser và IPL</h4>
      <p><strong>IPL (Intense Pulsed Light):</strong> Thực chất là một chùm ánh sáng đa sắc, dải bước sóng rộng từ 500nm - 1200nm, năng lượng bị phân tán và dễ hấp thu bởi cả sắc tố da xung quanh, gây cảm giác nóng rát, châm chích và nguy cơ tăng sắc tố.</p>
      <p><strong>Diode Laser 808nm:</strong> Là ánh sáng đơn sắc có bước sóng chuẩn xác 808nm - bước sóng vàng được FDA công nhận có khả năng xuyên sâu qua nang lông và hấp thu chọn lọc tối đa hắc tố melanin tại chân lông mà không làm tổn thương các mô lân cận.</p>

      <h4>Ưu điểm của công nghệ Diode Laser tại Nari Clinic & Spa</h4>
      <ul>
        <li><strong>Đầu đá Sapphire làm lạnh -5°C:</strong> Mang lại cảm giác mát lạnh êm ái suốt quá trình triệt, hoàn toàn không đau rát.</li>
        <li><strong>Rút ngắn liệu trình:</strong> Chỉ từ 6 - 8 buổi là lông tơ đã thưa mảnh và biến mất hoàn toàn, so với 12 - 15 buổi của IPL.</li>
        <li><strong>Se khít lỗ chân lông và mờ thâm:</strong> Nhiệt quang chọn lọc giúp kích thích tăng sinh collagen, làm sáng mịn vùng da dưới cánh tay hoặc bikini.</li>
        <li><strong>Chế độ bảo hành 5 năm:</strong> Nari Clinic & Spa cấp phiếu bảo hành bằng văn bản, hỗ trợ dặm lại miễn phí trong suốt 5 năm.</li>
      </ul>
    `,
    relatedService: {
      name: "Triệt Lông Nách Nữ Diode Laser (8 Buổi) (Bảo Hành 5 Năm)",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "800.000 ₫",
    },
    relatedProduct: {
      name: "Gel Tẩy Tế Bào Chết Toàn Thân Cocoon Cà Phê Đắk Lắk 200ml",
      url: "/danh-muc/sua-rua-mat-c19.html",
      price: "115.000 ₫",
    },
  },
  {
    id: "aqua-mesoderm-khong-kim",
    title: "Mesoderm không kim: Đưa hoạt chất vào sâu tầng trung bì không xâm lấn",
    topic: "Trị mụn chuẩn y khoa",
    author: "BS. Chuyên khoa Thẩm mỹ Da Vũ Lan Anh",
    date: "08/11/2026",
    readTime: "4 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/m/e/meso-1747989063_img_380x380_64adc6_fit_center.png",
    summary:
      "Ứng dụng hiện tượng điện di phân tử và dòng xung điện từ Ý giúp mở tạm thời hàng triệu kênh vi mô trên màng tế bào, dẫn truyền 99% dưỡng chất trị mụn và phục hồi vào sâu đáy biểu bì mà không cần tiêm kim.",
    contentHtml: `
      <p>Nếu bạn sợ đau, sợ kim tiêm hay lo ngại nguy cơ bầm tím sau thủ thuật mesotherapy truyền thống thì công nghệ Aqua Mesoderm đến từ Ý chính là giải pháp thay thế hoàn hảo.</p>
      
      <h4>Cơ chế hoạt động của Aqua Mesoderm</h4>
      <p>Máy Aqua Mesoderm phát ra xung điện vi phân tử có tần số đặc biệt làm giãn nở tạm thời lỗ chân lông và mở ra hàng triệu kênh vận chuyển siêu nhỏ trên lipid màng tế bào da. Ngay sau khi dưỡng chất thẩm thấu sâu xuống trung bì, các kênh vi mô này tự động khép lại, khóa chặt tinh chất trong tế bào.</p>
      
      <h4>Hiệu quả thực tế</h4>
      <ul>
        <li>Tỷ lệ thẩm thấu dưỡng chất đạt tới 99%, cao gấp 2.000 lần so với việc thoa serum thông thường.</li>
        <li>Không xâm lấn, không chảy máu, không tạo vết thương hở và không cần nghỉ dưỡng.</li>
        <li>Kết hợp tinh chất đặc trị mụn kháng viêm tức thì, làm dịu da ửng đỏ và kiểm soát bã nhờn kéo dài.</li>
      </ul>
    `,
    relatedService: {
      name: "Mesoderm Trị Mụn",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "400.000 ₫",
    },
  },
  {
    id: "laser-fractional-co2-seo-ro",
    title: "Laser Fractional CO2: Tiêu chuẩn vàng trong điều trị sẹo rỗ và xóa nốt ruồi an toàn",
    topic: "Chống lão hóa",
    author: "BS. CKI Lê Hoàng Phúc",
    date: "05/11/2026",
    readTime: "7 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/9/0/900190004-1668740987_img_380x380_64adc6_fit_center.jpg",
    summary:
      "Cơ chế tạo vi tổn thương nhiệt có kiểm soát với bước sóng 10.600nm kích thích tái tạo collagen tự thân, san phẳng sẹo lõm, se khít lỗ chân lông và loại bỏ nốt ruồi triệt để không để lại sẹo lõm.",
    contentHtml: `
      <p>Laser CO2 Fractional được Hiệp hội Da Liễu Hoa Kỳ đánh giá là bước tiến vượt bậc trong công nghệ tái tạo bề mặt da và xử lý thương tổn biểu bì dạng nốt ruồi, mụn thịt, sẹo rỗ lâu năm.</p>
      
      <h4>Ứng dụng điều trị tại Nari Clinic & Spa</h4>
      <p><strong>1. Xóa nốt ruồi, u tuyến mồ hôi, mụn thịt:</strong> Tia laser hội tụ siêu mảnh chỉ 70 micromet đốt cháy chính xác chân nốt ruồi mà không làm lan rộng tổn thương ra vùng da lành. Vết thương đóng mài nhanh và bong tự nhiên sau 5 - 7 ngày.</p>
      <p><strong>2. Điều trị sẹo rỗ &amp; tái tạo da:</strong> Tạo hàng ngàn cột nhiệt vi điểm xuyên sâu tới lớp bì, kích hoạt phản ứng lành thương tự nhiên và tổng hợp sợi collagen type I &amp; III giúp đáy sẹo nâng lên đầy đặn.</p>

      <h4>Chăm sóc sau liệu trình Laser CO2</h4>
      <ul>
        <li>Kiêng nước rửa mặt trực tiếp trong 24 giờ đầu, vệ sinh bằng gạc y tế và nước muối sinh lý.</li>
        <li>Tuyệt đối không dùng tay cạy hoặc bóc vảy non sớm; hãy để mài tự bong nhằm tránh nguy cơ thâm sẹo.</li>
        <li>Chống nắng nghiêm ngặt với kem chống nắng phổ rộng và che chắn khẩu trang tối màu.</li>
      </ul>
    `,
    relatedService: {
      name: "Xóa Nốt Ruồi Công Nghệ Laser Fractional CO2",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "100.000 ₫",
    },
  },
  {
    id: "cham-soc-da-sau-nan-mun",
    title: "Chăm sóc da sau khi lấy nhân mụn: 4 nguyên tắc vàng ngăn ngừa thâm và tái phát mụn",
    topic: "Chăm sóc da nhạy cảm",
    author: "Dược sĩ Lâm sàng Nari Home Care",
    date: "02/11/2026",
    readTime: "5 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/m/n/mn-149-1747988808_img_380x380_64adc6_fit_center.png",
    summary:
      "48 giờ đầu sau khi lấy nhân mụn là thời điểm vàng quyết định da có bị thâm đỏ (PIE) hay thâm đen (PIH) hay không. Bỏ túi ngay 4 nguyên tắc chăm sóc da khoa học được Bác sĩ Da Liễu khuyên dùng.",
    contentHtml: `
      <p>Lấy nhân mụn thành công chỉ chiếm 50% hiệu quả điều trị; 50% còn lại phụ thuộc vào chế độ chăm sóc da và sinh hoạt tại nhà của bạn sau khi rời phòng khám.</p>
      
      <h4>4 nguyên tắc bất di bất dịch</h4>
      <ol>
        <li><strong>Giữ vệ sinh tuyệt đối:</strong> Thường xuyên thay vỏ gối, khử khuẩn màn hình điện thoại và không đưa tay lên sờ mặt. Rửa mặt nhẹ nhàng bằng nước mát.</li>
        <li><strong>Tập trung phục hồi thay vì treatment:</strong> Tạm ngừng các sản phẩm có nồng độ acid cao, cồn khô hoặc hạt scrub tẩy da chết cơ học. Ưu tiên các thành phần làm dịu như B5 (Panthenol), Rau má (Centella Asiatica), Hyaluronic Acid và Ceramide.</li>
        <li><strong>Chống nắng phổ rộng:</strong> Da sau nặn mụn rất dễ bắt nắng và sản sinh sắc tố melanin gây thâm mụn kéo dài. Luôn thoa kem chống nắng chỉ số SPF 50+ PA++++ mỗi sáng.</li>
        <li><strong>Duy trì lối sống lành mạnh:</strong> Uống đủ 2 lít nước mỗi ngày, ngủ trước 23h và hạn chế đồ uống có cồn, đồ ngọt hoặc sữa bò động vật.</li>
      </ol>
    `,
    relatedService: {
      name: "Combo Lấy Mụn + Mặt Nạ Kháng Khuẩn + Chiếu ASSH (Trải nghiệm)",
      url: "/danh-muc/sua-rua-mat-c19.html",
      price: "149.000 ₫",
    },
    relatedProduct: {
      name: "Kem Dưỡng La Roche-Posay Cicaplast Baume B5+ Làm Dịu & Phục Hồi Da 40ml",
      url: "/danh-muc/sua-rua-mat-c19.html",
      price: "360.000 ₫",
    },
  },
  {
    id: "nang-co-exilis-ultra-360",
    title: "Nâng cơ trẻ hóa Exilis Ultra 360 & RF: Giữ gìn đường nét thon gọn không phẫu thuật",
    topic: "Chống lão hóa",
    author: "BS. Chuyên khoa Thẩm mỹ Nội khoa",
    date: "28/10/2026",
    readTime: "6 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/m/a/mat-1667209339_img_380x380_64adc6_fit_center.jpg",
    summary:
      "Sự kết hợp đồng thời giữa sóng vô tuyến đơn cực Monopolar RF và sóng siêu âm Ultrasound giúp phá vỡ các mô mỡ thừa vùng nọng cằm, kích thích co thắt collagen lỏng lẻo và tái tạo đường viền hàm V-line sắc nét.",
    contentHtml: `
      <p>Khi bước qua tuổi 25, lượng collagen trong cơ thể suy giảm khoảng 1.5% mỗi năm, dẫn đến hiện tượng chảy xệ da viền hàm, xuất hiện rãnh cười sâu và nọng cằm tích mỡ.</p>
      
      <h4>Công nghệ đỉnh cao từ tập đoàn BTL Industries (Anh Quốc)</h4>
      <p>Exilis Ultra 360 là thiết bị duy nhất trên thế giới kết hợp đồng thời sóng vô tuyến đơn cực RF và sóng siêu âm liên tục. Năng lượng nhiệt chuẩn xác 40 - 42°C truyền sâu vào lớp mỡ dưới da, kích thích quá trình tự tiêu mỡ (apoptosis) đồng thời làm co tức thì mạng lưới collagen cũ, thúc đẩy sản sinh collagen và elastin mới.</p>

      <h4>Hiệu quả cảm nhận sau liệu trình</h4>
      <ul>
        <li>Gương mặt thon gọn, đường viền hàm rõ nét ngay sau buổi đầu tiên.</li>
        <li>Nâng cơ má chảy xệ, làm mờ rãnh mũi má và nếp nhăn đuôi mắt.</li>
        <li>Hoàn toàn không đau rát nhờ hệ thống cảm biến nhiệt độ thời gian thực DTC độc quyền.</li>
        <li>Không xâm lấn, khách hàng có thể trang điểm và làm việc bình thường ngay sau khi kết thúc buổi làm đẹp.</li>
      </ul>
    `,
    relatedService: {
      name: "Nâng Cơ - Thon Gọn Mặt Công Nghệ Exilis Ultra 360",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "1.700.000 ₫",
    },
  },
  {
    id: "phuc-hoi-da-nhiem-corticoid",
    title: "Phục hồi hàng rào bảo vệ da nhạy cảm bị kích ứng, nhiễm corticoid: Phác đồ y khoa",
    topic: "Chăm sóc da nhạy cảm",
    author: "BS. CKI Da Liễu Nguyễn Thảo Nhi",
    date: "24/10/2026",
    readTime: "5 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/2/2/22-1709864248_img_380x380_64adc6_fit_center.jpg",
    summary:
      "Dấu hiệu nhận biết da teo mỏng, giãn mao mạch do kem trộn chứa corticoid và quy trình điện di lạnh làm dịu da đa tầng Cool Relax II giúp tái thiết lập màng bảo vệ tự nhiên.",
    contentHtml: `
      <p>Sử dụng mỹ phẩm không rõ nguồn gốc hoặc kem trộn chứa corticoid khiến da bị nghiện độc chất, hàng rào bảo vệ tự nhiên bị phá vỡ hoàn toàn, dẫn đến hiện tượng đỏ rát, châm chích và lộ mao mạch mạng nhện.</p>
      
      <h4>Phác đồ cai nghiện corticoid và phục hồi da tại Nari Clinic & Spa</h4>
      <p><strong>1. Thăm khám bằng máy soi da 3D:</strong> Bác sĩ xác định mức độ teo da và mật độ vi khuẩn ký sinh Demodex.</p>
      <p><strong>2. Điện di lạnh Cool Relax II:</strong> Dẫn truyền tinh chất phục hồi nồng độ cao vào sâu tầng sinh trưởng của da ở nhiệt độ -15°C, giúp co mạch máu giãn, cắt đứt cảm giác ngứa rát khó chịu ngay lập tức.</p>
      <p><strong>3. Chiếu ánh sáng sinh học vàng:</strong> Kích hoạt tuần hoàn máu và thúc đẩy tế bào biểu bì mới phát triển khỏe mạnh.</p>
    `,
    relatedService: {
      name: "Điện Di Lạnh Vitamin C (20%) Trắng Sáng Vùng Nách",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "400.000 ₫",
    },
  },
  {
    id: "peel-da-hoa-hoc-y-khoa",
    title: "Peel da hóa học BHA & Retinol y khoa: Cách lựa chọn nồng độ phù hợp cho từng loại da",
    topic: "Trị mụn chuẩn y khoa",
    author: "BS. Da Liễu Phạm Hoàng Nam",
    date: "20/10/2026",
    readTime: "5 phút đọc",
    image: "https://media.hcdn.vn/catalog/product/p/e/peel-da-1702535856_img_380x380_64adc6_fit_center.jpg",
    summary:
      "Phân biệt peel da nông, trung bình và sâu. Hướng dẫn ứng dụng dung dịch Peel BHA 7% + LAC 7% + Res 7% của Image Skincare USA để gom cồi mụn và trẻ hóa bề mặt da an toàn dưới sự giám sát y khoa.",
    contentHtml: `
      <p>Chemical Peel (thay da sinh học) là phương pháp dùng các acid hữu cơ có nguồn gốc từ thiên nhiên để đẩy nhanh tốc độ thay mới tế bào, loại bỏ sừng già cỗi và đẩy nhân mụn ẩn lên bề mặt.</p>

      <h4>Vì sao nên Peel da tại cơ sở y tế uy tín?</h4>
      <p>Nồng độ acid trong peel y khoa cao hơn nhiều lần so với sản phẩm tẩy da chết tại nhà. Nếu không trung hòa acid đúng thời điểm hoặc không đánh giá chính xác độ dày sừng của da, nguy cơ bỏng hóa chất và tăng sắc tố sau viêm (PIH) là rất cao.</p>

      <h4>Sản phẩm Image Skincare USA chính hãng tại Nari Clinic & Spa</h4>
      <ul>
        <li><strong>BHA 7% + Lactic 7% + Resorcinol 7%:</strong> Phối hợp 3 hoạt chất vàng giúp kháng khuẩn, thông thoáng lỗ chân lông và gom cồi mụn khô nhanh chóng.</li>
        <li><strong>Retinol 25%:</strong> Thúc đẩy tăng sinh tế bào mới, cải thiện thâm mụn và làm mờ các nếp nhăn li ti trên bề mặt da.</li>
        <li><strong>100% Bác sĩ da liễu chỉ định và theo dõi:</strong> Bác sĩ trực tiếp bấm giờ trung hòa dung dịch acid, đảm bảo an toàn tuyệt đối cho làn da.</li>
      </ul>
    `,
    relatedService: {
      name: "Điều Trị Mụn, Trẻ Hóa Da Bằng BHA 7% + LAC 7% + Res 7% (Image USA) ( Vùng Mặt)",
      url: "/danh-muc/cham-soc-da-mat-c4.html",
      price: "660.000 ₫",
    },
    relatedProduct: {
      name: "Kem Chống Nắng La Roche-Posay Anthelios UVMune 400 Oil Control 50ml",
      url: "/danh-muc/sua-rua-mat-c19.html",
      price: "435.000 ₫",
    },
  },
];

export default function CamNangPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>("Tất cả");
  const [activeArticle, setActiveArticle] = useState<GuideArticle | null>(null);

  const filteredArticles = ARTICLES.filter(item => {
    if (selectedTopic === "Tất cả") return true;
    return item.topic === selectedTopic;
  });

  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: "14px" }}>
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Cẩm nang làm đẹp &amp; Chăm sóc da
        </div>

        {/* Hero Banner Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #3d2e24 0%, #1e1b18 100%)",
            color: "white",
            padding: "32px 24px",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "rgba(255,255,255,0.2)",
              padding: "4px 10px",
              borderRadius: "20px",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            Kiến thức y khoa chính thống
          </span>
          <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: "0 0 10px", lineHeight: 1.3 }}>
            CẨM NANG Y KHOA &amp; LÀM ĐẸP Nari Clinic & Spa
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, opacity: 0.95, margin: 0, maxWidth: "800px" }}>
            Chia sẻ kiến thức da liễu chuẩn y khoa, phác đồ điều trị mụn, triệt lông laser và chăm sóc da an toàn từ đội ngũ Bác sĩ chuyên khoa Da Liễu giàu kinh nghiệm tại Nari Clinic & Spa &amp; Spa.
          </p>
        </div>

        {/* Topic Filter Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            background: "white",
            padding: "16px 20px",
            borderRadius: "8px",
            border: "1px solid #eee",
            marginBottom: "24px",
          }}
        >
          {TOPICS.map(topic => {
            const count =
              topic === "Tất cả"
                ? ARTICLES.length
                : ARTICLES.filter(a => a.topic === topic).length;
            const isActive = selectedTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: isActive ? "1px solid #3d2e24" : "1px solid #ddd",
                  background: isActive ? "#3d2e24" : "white",
                  color: isActive ? "white" : "#444",
                  fontSize: "13px",
                  fontWeight: isActive ? "bold" : "normal",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{topic}</span>
                <span
                  style={{
                    fontSize: "11px",
                    background: isActive ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                    padding: "2px 6px",
                    borderRadius: "10px",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 8 Rich Dermatology Guide Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          {filteredArticles.map(art => (
            <article
              key={art.id}
              style={{
                background: "white",
                borderRadius: "8px",
                border: "1px solid #eee",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div
                style={{ position: "relative", width: "100%", height: "180px", cursor: "pointer" }}
                onClick={() => setActiveArticle(art)}
              >
                <Image
                  src={art.image}
                  alt={art.title}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "#3d2e24",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {art.topic}
                </span>
              </div>

              <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "11px", color: "#888", marginBottom: "6px" }}>
                  ✍️ {art.author} · ⏱ {art.readTime}
                </div>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "bold",
                    lineHeight: 1.4,
                    margin: "0 0 8px",
                    color: "#222",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveArticle(art)}
                >
                  {art.title}
                </h2>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: 1.5,
                    margin: "0 0 14px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                  }}
                >
                  {art.summary}
                </p>

                <div
                  style={{
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveArticle(art)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3d2e24",
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Đọc tiếp bài viết →
                  </button>
                  <Link
                    href={art.relatedService.url}
                    style={{
                      fontSize: "11px",
                      background: "#eef6f2",
                      color: "#276844",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: 500,
                    }}
                  >
                    Dịch vụ liên quan
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Expandable Reader Modal / Drawer */}
        {activeArticle && (
          <div
            className="modal-bg"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 100,
              display: "grid",
              placeItems: "center",
              padding: "16px",
            }}
            onClick={() => setActiveArticle(null)}
          >
            <div
              className="modal"
              style={{
                background: "white",
                borderRadius: "8px",
                maxWidth: "760px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative",
                padding: "24px 28px",
                textAlign: "left",
                color: "#333",
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                className="close"
                onClick={() => setActiveArticle(null)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "16px",
                  fontSize: "24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#666",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
                aria-label="Đóng bài viết"
              >
                ✕
              </button>

              <span
                style={{
                  background: "#e8f5ec",
                  color: "#276844",
                  fontSize: "12px",
                  fontWeight: "bold",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  display: "inline-block",
                  marginBottom: "10px",
                }}
              >
                {activeArticle.topic}
              </span>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  lineHeight: 1.35,
                  margin: "0 0 10px",
                  color: "#111",
                  paddingRight: "30px",
                }}
              >
                {activeArticle.title}
              </h2>

              <div style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
                👨‍⚕️ Tác giả: <strong>{activeArticle.author}</strong> · Ngày đăng: {activeArticle.date} · {activeArticle.readTime}
              </div>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "280px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  marginBottom: "20px",
                }}
              >
                <Image
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>

              {/* Summary note box */}
              <div
                style={{
                  background: "#f7f9f8",
                  borderLeft: "4px solid #3d2e24",
                  padding: "12px 16px",
                  fontSize: "13px",
                  fontStyle: "italic",
                  lineHeight: "1.6",
                  color: "#444",
                  marginBottom: "20px",
                }}
              >
                {activeArticle.summary}
              </div>

              {/* Full Content */}
              <div
                style={{ lineHeight: "1.7", fontSize: "14px" }}
                dangerouslySetInnerHTML={{ __html: activeArticle.contentHtml }}
              />

              {/* Related Clinic Service CTA Card */}
              <div
                style={{
                  background: "#f0f7f3",
                  border: "1px solid #c8e0d1",
                  borderRadius: "6px",
                  padding: "16px",
                  marginTop: "24px",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#3d2e24", fontWeight: "bold" }}>
                    DỊCH VỤ PHÒNG KHÁM LIÊN QUAN:
                  </div>
                  <strong style={{ fontSize: "14px", color: "#111" }}>
                    {activeArticle.relatedService.name}
                  </strong>
                  <div style={{ color: "#f47722", fontWeight: "bold", fontSize: "13px", marginTop: "2px" }}>
                    {activeArticle.relatedService.price}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={activeArticle.relatedService.url}
                    style={{
                      background: "#3d2e24",
                      color: "white",
                      padding: "8px 14px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    onClick={() => setActiveArticle(null)}
                  >
                    Xem danh mục gợi ý
                  </Link>
                  <Link
                    href="/san-pham-ban-chay.html"
                    style={{
                      background: "#b86b4b",
                      color: "white",
                      padding: "8px 14px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    onClick={() => setActiveArticle(null)}
                  >
                    Sản phẩm bán chạy
                  </Link>
                </div>
              </div>

              {/* Related Skincare Product if available */}
              {activeArticle.relatedProduct && (
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: "6px",
                    padding: "12px 16px",
                    marginTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <span style={{ color: "#777" }}>Dược mỹ phẩm khuyên dùng: </span>
                    <strong>{activeArticle.relatedProduct.name}</strong>
                    <span style={{ color: "#f47722", marginLeft: "8px", fontWeight: "bold" }}>
                      {activeArticle.relatedProduct.price}
                    </span>
                  </div>
                  <Link
                    href={activeArticle.relatedProduct.url}
                    style={{ color: "#3d2e24", fontWeight: "bold" }}
                    onClick={() => setActiveArticle(null)}
                  >
                    Mua tại Nari Home →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
