import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancelar o Reprogramar Turno",
  description:
    "Gestiona la cancelación o reprogramación de tu turno reservado en Selene Pilates ingresando tu código alfanumérico único.",
  alternates: {
    canonical: "/cancelar",
  },
  openGraph: {
    title: "Cancelar o Reprogramar Turno | Selene Pilates Studio",
    description:
      "Gestiona la cancelación o reprogramación de tu turno reservado en Selene Pilates ingresando tu código alfanumérico único.",
    url: "/cancelar",
  },
};

export default function CancelarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
