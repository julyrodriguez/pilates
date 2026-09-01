import { NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = "confirmation",
      recipientEmail,
      recipientName,
      shiftTitle,
      shiftDate,
      shiftTime,
      instructorName,
      room,
      cancellationCode,
      cancellationUrl,
      studioName = "Selene Pilates",
    } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, error: "recipientEmail es requerido" },
        { status: 400 }
      );
    }

    const originHeader = req.headers.get("origin") || req.headers.get("referer");
    const hostHeader = req.headers.get("host");
    const detectedOrigin = originHeader
      ? new URL(originHeader).origin
      : hostHeader
      ? (hostHeader.includes("localhost") ? `http://${hostHeader}` : `https://${hostHeader}`)
      : "https://pilates.jariel.com.ar";

    const baseDomain = process.env.NEXT_PUBLIC_APP_URL || detectedOrigin;
    const fullCancelUrl = cancellationUrl?.startsWith("http")
      ? cancellationUrl
      : `${baseDomain}/cancelar/${cancellationCode}`;

    function formatToDDMMAAAA(dateStr?: string): string {
      if (!dateStr) return "-";
      const trimmed = dateStr.trim();
      const parts = trimmed.split("-");
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return trimmed;
    }

    const displayDate = formatToDDMMAAAA(shiftDate);

    let subject = "";
    let html = "";
    let text = "";

    if (type === "confirmation") {
      subject = `Reserva Confirmada en ${studioName}: ${shiftTitle || "Clase"} (${displayDate})`;
      text = `¡Hola ${recipientName || "Alumno/a"}!\n\nTu lugar está confirmado en ${studioName}.\n\nDetalle del turno:\n- Clase: ${shiftTitle || "Pilates"}\n- Fecha: ${displayDate}\n- Horario: ${shiftTime || "-"} hs\n${instructorName ? `- Instructor/a: ${instructorName}\n` : ""}${room ? `- Sala: ${room}\n` : ""}- Código de Reserva: ${cancellationCode || "-"}\n\nPara modificar o cancelar tu turno, ingresa al siguiente enlace:\n${fullCancelUrl}\n\nRecuerda llegar 5 minutos antes con ropa cómoda y medias antideslizantes.\n¡Te esperamos!`;
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${studioName}</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Comprobante Oficial de Turno</p>
          </div>
          
          <div style="padding: 28px 24px;">
            <p style="font-size: 16px; margin: 0 0 20px;">¡Hola <strong>${recipientName || "Alumno/a"}</strong>! Tu lugar está reservado y confirmado.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 35%;">Clase / Turno:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${shiftTitle || "Pilates"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Fecha:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #4f46e5;">${displayDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Horario:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${shiftTime || "-"} hs</td>
                </tr>
                ${instructorName ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Instructor/a:</td><td style="padding: 6px 0; color: #334155;">${instructorName}</td></tr>` : ""}
                ${room ? `<tr><td style="padding: 6px 0; color: #64748b; font-weight: 600;">Espacio / Sala:</td><td style="padding: 6px 0; color: #334155;">${room}</td></tr>` : ""}
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Código de Reserva:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: 800; color: #0f172a;">${cancellationCode || "-"}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">¿Necesitas cambiar de horario o surgió un imprevisto? Gestiona tu reserva fácilmente:</p>
              <a href="${fullCancelUrl}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 26px; border-radius: 12px; font-weight: 800; font-size: 13px; display: inline-block;">
                Modificar / Cancelar Turno
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0; line-height: 1.5;">
              Recuerda llegar 5 minutos antes con ropa cómoda y medias antideslizantes.<br>
              ¡Te esperamos en ${studioName}!
            </p>
          </div>
        </div>
      `;
    } else if (type === "rescheduled") {
      subject = `Turno Reprogramado en ${studioName}: ${shiftTitle || "Clase"} (${displayDate})`;
      text = `¡Hola ${recipientName || "Alumno/a"}!\n\nTu turno en ${studioName} fue modificado con éxito.\n\nNuevo horario:\n- Clase: ${shiftTitle || "Pilates"}\n- Nueva Fecha: ${displayDate}\n- Nuevo Horario: ${shiftTime || "-"} hs\n${instructorName ? `- Instructor/a: ${instructorName}\n` : ""}${room ? `- Sala: ${room}\n` : ""}- Código de Reserva: ${cancellationCode || "-"}\n\nPara gestionar o cancelar tu turno:\n${fullCancelUrl}\n\n¡Te esperamos!`;
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${studioName}</h1>
            <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">¡Turno Reprogramado con Éxito!</p>
          </div>
          
          <div style="padding: 28px 24px;">
            <p style="font-size: 16px; margin: 0 0 20px;">¡Hola <strong>${recipientName || "Alumno/a"}</strong>! Tu cambio de horario fue confirmado exitosamente.</p>
            
            <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #4338ca; font-weight: 700; width: 38%;">Nuevo Turno:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #1e1b4b;">${shiftTitle || "Pilates"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #4338ca; font-weight: 700;">Nueva Fecha:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #4338ca;">${displayDate}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #4338ca; font-weight: 700;">Nuevo Horario:</td>
                  <td style="padding: 6px 0; font-weight: 800; color: #1e1b4b;">${shiftTime || "-"} hs</td>
                </tr>
                ${instructorName ? `<tr><td style="padding: 6px 0; color: #4338ca; font-weight: 700;">Instructor/a:</td><td style="padding: 6px 0; color: #334155;">${instructorName}</td></tr>` : ""}
                ${room ? `<tr><td style="padding: 6px 0; color: #4338ca; font-weight: 700;">Espacio / Sala:</td><td style="padding: 6px 0; color: #334155;">${room}</td></tr>` : ""}
                <tr>
                  <td style="padding: 6px 0; color: #4338ca; font-weight: 700;">Código de Reserva:</td>
                  <td style="padding: 6px 0; font-family: monospace; font-weight: 800; color: #0f172a;">${cancellationCode || "-"}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">¿Necesitas volver a cambiar de horario o cancelar? Gestiona tu reserva aquí:</p>
              <a href="${fullCancelUrl}" style="background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 26px; border-radius: 12px; font-weight: 800; font-size: 13px; display: inline-block;">
                Modificar / Cancelar Turno
              </a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0; line-height: 1.5;">
              ¡Te esperamos en tu nuevo horario en ${studioName}!
            </p>
          </div>
        </div>
      `;
    } else {
      subject = `Cancelación de Turno en ${studioName}: ${shiftTitle || "Clase"} (${displayDate})`;
      text = `Hola ${recipientName || "Alumno/a"},\n\nTe confirmamos que tu turno para ${shiftTitle || "la clase"} el día ${displayDate} a las ${shiftTime} hs ha sido cancelado con éxito y el cupo fue liberado.\n\n¡Esperamos verte pronto en otra clase! Puedes reservar un nuevo turno en cualquier momento desde nuestro portal.`;
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
          <div style="background: #475569; padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${studioName}</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Confirmación de Cancelación</p>
          </div>
          <div style="padding: 28px 24px;">
            <p style="font-size: 15px; margin: 0 0 16px;">Hola <strong>${recipientName || "Alumno/a"}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Te confirmamos que tu turno para <strong>${shiftTitle || "la clase"}</strong> el día <strong>${displayDate}</strong> a las <strong>${shiftTime} hs</strong> ha sido cancelado con éxito y el cupo fue liberado.
            </p>
            <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
              ¡Esperamos verte pronto en otra clase! Puedes reservar un nuevo turno en cualquier momento desde nuestro portal.
            </p>
          </div>
        </div>
      `;
    }

    // 1. Intentar envío con Resend (Mayor entregabilidad y reputación)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || `${studioName} <turnos@jariel.com.ar>`;

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: recipientEmail,
          subject,
          html,
          text,
        });

        if (!error && data) {
          return NextResponse.json({ success: true, messageId: data.id, provider: "resend" });
        }
        console.warn("Resend retorno error, usando fallback Nodemailer:", error);
      } catch (resendErr) {
        console.warn("Error enviando por Resend, intentando fallback:", resendErr);
      }
    }

    // 2. Fallback a Nodemailer / SMTP si Resend no está configurado
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { success: false, error: "Servicio de email no configurado en el servidor." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"${studioName}" <${smtpUser}>`,
      to: recipientEmail,
      replyTo: smtpUser,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId, provider: "nodemailer" });
  } catch (error: any) {
    console.error("Error al enviar email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al enviar correo" },
      { status: 500 }
    );
  }
}
