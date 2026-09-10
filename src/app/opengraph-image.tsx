import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Selene Pilates Studio | Clases y Reservas Online";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090d16",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.25) 0%, transparent 50%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px 80px",
        }}
      >
        {/* Top bar with studio badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
            }}
          >
            ✨
          </div>
          <span
            style={{
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#c7d2fe",
            }}
          >
            Selene Pilates Studio
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "950px",
          }}
        >
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              margin: "0 0 20px 0",
              color: "#ffffff",
            }}
          >
            Clases de Pilates Reformer y Reservas Online
          </h1>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              lineHeight: 1.4,
              margin: 0,
              maxWidth: "780px",
            }}
          >
            Reserva tus turnos en tiempo real, consulta horarios disponibles y gestiona tu membresía mensual fácilmente.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "44px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(99, 102, 241, 0.2)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              borderRadius: "9999px",
              padding: "10px 22px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#e0e7ff",
            }}
          >
            Turnos en Vivo
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "9999px",
              padding: "10px 22px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#a7f3d0",
            }}
          >
            Cancelación y Reprogramación Inmediata
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(244, 63, 94, 0.2)",
              border: "1px solid rgba(244, 63, 94, 0.4)",
              borderRadius: "9999px",
              padding: "10px 22px",
              fontSize: "18px",
              fontWeight: 700,
              color: "#fecdd3",
            }}
          >
            Planes y Membresías Mensuales
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
