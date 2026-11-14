import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Hasaki - Giao diện thử nghiệm", description: "Bản giao diện tham khảo" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="vi"><body>{children}</body></html>; }
