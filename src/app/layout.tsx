import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// خط Almarai — مستضاف محلياً (القرار T-05)، مش من CDN.
const almarai = localFont({
  src: [
    { path: "../../public/fonts/Almarai/Almarai-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Almarai/Almarai-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Almarai/Almarai-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Almarai/Almarai-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-almarai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مزرعة بيتنا",
  description: "إدارة مزرعة الدواجن العائلية — الطلبات والدورات والحسابات",
};

// عرض مناسب للموبايل، بدون تكبير يكسر التصميم (320→430px+).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbfdfc", // App canvas — matches the page background
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
