import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración de Reservas",
  description:
    "Listado y gestión completa de reservas, control de asistencia presencial y cancelaciones administrativas en Selene Pilates.",
  alternates: {
    canonical: "/reservas",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReservasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
