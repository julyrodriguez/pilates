import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulador de Notificaciones",
  description:
    "Previsualización y prueba de plantillas de correos electrónicos transaccionales y notificaciones de Selene Pilates.",
  alternates: {
    canonical: "/simulador-emails",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SimuladorEmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
