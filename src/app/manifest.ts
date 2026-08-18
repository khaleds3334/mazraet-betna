import type { MetadataRoute } from "next";

/**
 * PWA manifest — served at /manifest.webmanifest and linked automatically by
 * Next.js from the root layout.
 *
 * Written as a typed route (not a static public/manifest.json) so a wrong key
 * or a bad enum value fails at build time instead of silently disabling the
 * install prompt on the phone.
 *
 * `display: "standalone"` is the whole point of this file: once installed, the
 * app opens with no browser chrome — no URL bar, no tabs. That matters more
 * here than in most apps, because the admin taps this while standing over a
 * scale and every wasted pixel is a smaller touch target.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مزرعة بيتنا",
    short_name: "مزرعة بيتنا",
    description: "إدارة مزرعة الدواجن العائلية — الطلبات والدورات والحسابات",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfdfc", // --color-background (the splash screen)
    theme_color: "#fbfdfc", // --color-background (the status bar)
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Android crops icons to its own shape, so this one keeps the artwork
        // inside the 80% safe zone and lets the background fill the corners.
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
