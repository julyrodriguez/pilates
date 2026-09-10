import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendario Semanal",
  description:
    "Vista de calendario semanal interactivo para supervisar turnos, clases programadas y alumnos inscriptos.",
  alternates: {
    canonical: "/calendario",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CalendarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
