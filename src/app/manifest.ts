import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Irati",
    short_name: "Irati",
    description: "Seguimiento privado de peso y vacunas de Irati.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8ff",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icons/irati-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
