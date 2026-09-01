import nodemailer from "nodemailer";

const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const transporter = smtpReady ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
}) : null;

export async function sendMail(message) {
  if (!transporter) {
    console.warn("Correo omitido: SMTP no está configurado.");
    return false;
  }
  await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, ...message });
  return true;
}

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[character]);

export function resetEmail(name, resetUrl) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Restablece tu contraseña de FOCUGEX",
    text: `Hola ${name}. Usa este enlace durante los próximos 30 minutos para crear una contraseña nueva: ${resetUrl}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#16182d"><h1 style="color:#315bf5">FOCUGEX</h1><h2>Restablece tu contraseña</h2><p>Hola ${safeName}, recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#5c55ed;color:#fff;text-decoration:none;font-weight:bold">Crear contraseña nueva</a></p><p style="color:#667085">El enlace vence en 30 minutos. Si no hiciste esta solicitud, ignora este mensaje.</p></div>`,
  };
}

export function newDeviceEmail(name, device, ip) {
  return {
    subject: "Nuevo acceso a tu cuenta FOCUGEX",
    text: `Hola ${name}. Detectamos un acceso desde ${device}${ip ? `, IP ${ip}` : ""}. Si no fuiste tú, cambia tu contraseña.`,
  };
}
