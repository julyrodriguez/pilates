import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso Administrativo",
  description:
    "Inicio de sesión y autenticación para el panel administrativo de Selene Pilates Studio.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
