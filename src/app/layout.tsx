import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "./_components/service-worker-register";
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
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
  userScalable: false,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
