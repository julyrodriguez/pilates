import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Información y Horarios del Estudio",
  description:
    "Conoce Selene Pilates Studio: ubicación, disciplinas de Pilates Reformer, equipamiento, horarios de atención, instructores y preguntas frecuentes.",
  alternates: {
    canonical: "/info",
  },
  openGraph: {
    title: "Información y Horarios del Estudio | Selene Pilates Studio",
    description:
      "Conoce Selene Pilates Studio: ubicación, disciplinas de Pilates Reformer, horarios y preguntas frecuentes.",
    url: "/info",
  },
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
