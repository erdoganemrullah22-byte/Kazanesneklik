import type { MetadataRoute } from "next";

/** Web app manifest: installable on Android (Chrome) and iOS (Safari). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kazan Esneklik",
    short_name: "Kazan",
    description: "Düzenli çalışmayla esnekliğini adım adım geliştirmen için kişisel antrenman planı.",
    lang: "tr",
    dir: "ltr",
    start_url: "/bugun",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfaf4",
    theme_color: "#115d4d",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
