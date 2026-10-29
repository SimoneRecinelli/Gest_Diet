import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  // Serve per usare env(safe-area-inset-*) quando l'app è aperta dalla home del telefono
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "DietOS",
  description: "Piano Nutrizionale",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DietOS",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {/* Copre la zona dell'orologio/notch: niente testo che scorre sotto la barra di stato */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-white"
          style={{ height: "env(safe-area-inset-top)" }}
        />
        {children}
      </body>
    </html>
  );
}
