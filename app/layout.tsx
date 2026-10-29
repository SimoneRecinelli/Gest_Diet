import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1417" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Schermate di avvio iPhone: larghezza e altezza in pixel, larghezza e altezza in punti, densità
const SPLASH_SIZES: [number, number, number, number, number][] = [
  [1320, 2868, 440, 956, 3],
  [1206, 2622, 402, 874, 3],
  [1290, 2796, 430, 932, 3],
  [1179, 2556, 393, 852, 3],
  [1284, 2778, 428, 926, 3],
  [1170, 2532, 390, 844, 3],
  [1125, 2436, 375, 812, 3],
  [1242, 2688, 414, 896, 3],
  [828, 1792, 414, 896, 2],
  [1080, 2340, 360, 780, 3],
  [750, 1334, 375, 667, 2],
  [1242, 2208, 414, 736, 3],
];

const startupImage = (["light", "dark"] as const).flatMap((theme) =>
  SPLASH_SIZES.map(([w, h, dw, dh, ratio]) => ({
    url: `/splash?w=${w}&h=${h}&t=${theme}`,
    media: `(prefers-color-scheme: ${theme}) and (device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
  })),
);

export const metadata: Metadata = {
  title: "DietOS",
  description: "Piano Nutrizionale",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DietOS",
    startupImage,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
