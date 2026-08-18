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
  applicationName: "مزرعة بيتنا",
  // iOS ignores the manifest: it needs its own touch icon and its own
  // "open without browser chrome" flag (the manifest handles Android).
  appleWebApp: {
    capable: true,
    title: "مزرعة بيتنا",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // Stops iOS from turning any run of digits into a blue phone link — every
  // number on screen here is a weight, a price, or an order number, and the
  // real phone numbers already have their own call buttons (ContactLinks).
  formatDetection: { telephone: false },
};

// عرض مناسب للموبايل، بدون تكبير يكسر التصميم (320→430px+).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fbfdfc", // App canvas — matches the page background
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // No height on <html> on purpose. `h-full` resolves to the viewport with the
    // browser's address bar hidden, while the app shells are sized to the
    // viewport with it showing — on a phone the two disagree by the height of
    // that bar, which left the document itself scrollable by ~60px.
    // Letting <html> size to its content keeps the document exactly one screen tall.
    <html lang="ar" dir="rtl" className={`${almarai.variable} antialiased`}>
      {/* `svh` matches the shells: a height that doesn't move when the browser
          shows or hides its address bar. `overscroll-none` stops pull-to-refresh
          and the rubber-band bounce, so this reads as an installed app. */}
      <body className="flex min-h-svh flex-col overscroll-none">{children}</body>
    </html>
  );
}
