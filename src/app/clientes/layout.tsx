import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directorio de Alumnos",
  description:
    "Base de datos de clientas, historial de asistencias, cancelaciones, notas de salud y contacto de Selene Pilates.",
  alternates: {
    canonical: "/clientes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ClientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
