import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estadísticas y Métricas",
  description:
    "Análisis de ocupación de clases, retención de alumnos, nivel de asistencias y reportes financieros del estudio.",
  alternates: {
    canonical: "/estadisticas",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function EstadisticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
