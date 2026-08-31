import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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
