import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instructores",
  description:
    "Equipo docente y profesores especializados en Pilates Reformer de Selene Pilates Studio.",
  alternates: {
    canonical: "/instructores",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function InstructoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
