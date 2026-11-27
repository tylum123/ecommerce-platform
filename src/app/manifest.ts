import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nari Home — Mỹ Phẩm Chính Hãng",
    short_name: "Nari Home",
    description:
      "Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất. Hệ thống phân phối mỹ phẩm chính hãng 100%, giao nhanh 2H NariNow.",
    start_url: "/",
    display: "standalone",
    theme_color: "#3d2e24",
    background_color: "#faf5f0",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
