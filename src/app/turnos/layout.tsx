import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestión de Clases y Cupos",
  description:
    "Administración de clases diarias, programación de turnos, visualización de cupos y control de ocupación en Selene Pilates.",
  alternates: {
    canonical: "/turnos",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TurnosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
