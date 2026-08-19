import type { MetadataRoute } from "next";

/**
 * The **second** PWA on the phone — «لوحة التحكم», the admin app.
 *
 * Two icons on the home screen, one origin: the father taps لوحة التحكم and
 * lands on the dashboard; a customer taps مزرعة بيتنا and lands on the shop.
 * Browsers tell two installed apps apart by their manifest `id`, so this file
 * exists only to carry a different `id`, `start_url` and name from the customer
 * manifest in `manifest.ts`.
 *
 * Hand-written as a route rather than Next's `manifest.ts` convention, which
 * owns exactly one manifest per app — the second one has to be served itself.
 * `MetadataRoute.Manifest` still types it, so a bad key fails the build the same
 * way the first one does.
 *
 * **`scope` is "/" and not "/admin"** on purpose: the sign-in screens live at
 * `/login` and `/pin`, outside `/admin`. With the tighter scope the very first
 * launch would bounce the admin out into a browser tab to type the PIN, and
 * back again — so the app would leave its own window exactly when it is least
 * wanted. The scope overlaps the customer app's, which is allowed; `id` is what
 * keeps them two apps.
 */
export function GET() {
  const manifest: MetadataRoute.Manifest = {
    // The identity browsers key the installed app on. Without it `start_url`
    // is used, which would still work — stated explicitly so a later change to
    // start_url cannot silently orphan an already-installed icon.
    id: "/admin",
    name: "لوحة التحكم",
    short_name: "لوحة التحكم",
    description: "إدارة الدورات والطلبات والحسابات — مزرعة بيتنا",
    lang: "ar",
    dir: "rtl",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfdfc", // --color-background
    theme_color: "#fbfdfc",
    icons: [
      {
        src: "/icons/admin-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/admin-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/admin-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };

  return Response.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
