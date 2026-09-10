import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes y Membresías",
  description:
    "Configuración de planes semanales y mensuales, control de consumos de clases por clienta, seguimiento de pagos y aranceles personalizados.",
  alternates: {
    canonical: "/planes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
