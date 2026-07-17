import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Irati",
    short_name: "Irati",
    description: "Seguimiento privado de peso y vacunas de Irati.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf8ff",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icons/irati-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/irati-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/irati-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
