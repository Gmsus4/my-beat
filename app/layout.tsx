import type { Metadata } from "next";
import { AuthProvider } from "./components/auth-provider";
import "@fontsource/outfit/800.css";
import "@fontsource/outfit/900.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://my-beatme.vercel.app/",
  ),
  title: {
    default: "MyBeat - Diario de actividad fisica seguro",
    template: "%s | MyBeat",
  },
  description:
    "Sube archivos GPX, visualiza tus metricas deportivas y comparte tu progreso con control de privacidad geografica.",
  applicationName: "MyBeat",
  keywords: [
    "GPX",
    "actividad fisica",
    "running",
    "caminatas",
    "diario deportivo",
    "privacidad geografica",
    "metricas deportivas",
  ],
  authors: [{ name: "MyBeat" }],
  creator: "MyBeat",
  category: "health",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  openGraph: {
    title: "MyBeat - Diario de actividad fisica seguro",
    description:
      "Sube archivos GPX, visualiza tus metricas deportivas y comparte tu progreso con control de privacidad geografica.",
    siteName: "MyBeat",
    locale: "es_MX",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyBeat - Diario de actividad fisica seguro",
    description:
      "Sube archivos GPX, visualiza tus metricas deportivas y comparte tu progreso con control de privacidad geografica.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
