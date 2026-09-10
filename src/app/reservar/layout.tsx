import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar Turno Online",
  description:
    "Reserva tu clase de Pilates Reformer online en Selene Pilates. Selecciona el día, horario e instructora disponible y asegura tu lugar en segundos.",
  alternates: {
    canonical: "/reservar",
  },
  openGraph: {
    title: "Reservar Turno Online | Selene Pilates Studio",
    description:
      "Reserva tu clase de Pilates Reformer online en Selene Pilates. Selecciona el día, horario e instructora disponible.",
    url: "/reservar",
  },
};

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
