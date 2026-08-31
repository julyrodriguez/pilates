import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

export const metadata: Metadata = {
  title: "Selene Pilates - Sistema de Gestión y Reservas",
  description: "Plataforma integral de gestión de turnos, reservas y alumnos para Selene Pilates Studio.",
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
            <DataProvider>{children}</DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
