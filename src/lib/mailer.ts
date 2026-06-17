import "server-only";

import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD && (process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER));
}

export async function sendMail(payload: MailPayload) {
  if (!isSmtpConfigured()) {
    return { ok: false, message: "E-Mail-Versand ist noch nicht konfiguriert. Die Einladung wurde gespeichert, aber nicht versendet." };
  }

  const port = Number(process.env.SMTP_PORT ?? "465");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.ionos.de",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "E-Mail konnte nicht versendet werden. Die Einladung wurde gespeichert, aber nicht versendet." };
  }
}
