import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationBanner } from "@/components/notifications/NotificationBanner";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pilates.jariel.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Selene Pilates Studio | Clases y Reservas Online",
    template: "%s | Selene Pilates Studio",
  },
  description:
    "Plataforma integral de Selene Pilates Studio. Reserva tus clases de Pilates Reformer online, consulta horarios disponibles y gestiona tu membresía mensual.",
  keywords: [
    "Pilates",
    "Pilates Reformer",
    "Selene Pilates",
    "Reservar clases pilates",
    "Turnos pilates online",
    "Estudio de pilates",
    "Membresías pilates",
  ],
  authors: [{ name: "Selene Pilates Studio" }],
  creator: "Selene Pilates",
  publisher: "Selene Pilates Studio",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: siteUrl,
    siteName: "Selene Pilates Studio",
    title: "Selene Pilates Studio | Clases y Reservas Online",
    description:
      "Reserva tus turnos en vivo para clases de Pilates Reformer, gestiona tu plan mensual y consulta horarios disponibles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Selene Pilates Studio | Clases y Reservas Online",
    description:
      "Reserva tus turnos en vivo para clases de Pilates Reformer, gestiona tu plan mensual y consulta horarios disponibles.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-600 selection:text-white bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <NotificationProvider>
                <NotificationBanner />
                {children}
              </NotificationProvider>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
