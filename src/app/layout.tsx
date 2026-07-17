import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Irati",
    template: "%s | Irati",
  },
  description: "Seguimiento privado de peso y vacunas de Irati.",
  applicationName: "Irati",
  appleWebApp: {
    capable: true,
    title: "Irati",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/irati-icon.svg",
    apple: "/icons/irati-icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
