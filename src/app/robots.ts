import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://pilates.jariel.com.ar";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/reservar", "/cancelar", "/info"],
        disallow: [
          "/api/",
          "/turnos",
          "/clientes",
          "/planes",
          "/calendario",
          "/reservas",
          "/instructores",
          "/estadisticas",
          "/simulador-emails",
          "/login",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
