import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider } from "@/context/DataContext";

export const metadata: Metadata = {
  title: "L'Harmonie Pilates Studio - Sistema de Gestión y Reservas",
  description:
    "Plataforma moderna de gestión de turnos, aforos de Reformer y reservas públicas con cancelación automática.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased selection:bg-rose-500 selection:text-white">
        <ThemeProvider>
          <DataProvider>{children}</DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
