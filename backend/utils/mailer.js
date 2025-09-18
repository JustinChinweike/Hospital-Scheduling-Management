import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  SMTP_FROM
} = process.env;

let transporter;
let isEthereal = false;

export async function getTransporter() {
  if (transporter) return transporter;
  if (SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_SECURE === 'true',
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    });
    isEthereal = false;
    return transporter;
  }
  // Fallback for dev: create an Ethereal test account automatically
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  isEthereal = true;
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const from = SMTP_FROM || 'no-reply@hospital-scheduler.local';
  const t = await getTransporter();
  const info = await t.sendMail({ from, to, subject, html, text });
  let previewUrl = null;
  if (isEthereal) {
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) {
      // eslint-disable-next-line no-console
      console.log(`Ethereal email preview: ${previewUrl}`);
    }
  }
  return { info, previewUrl };
}
