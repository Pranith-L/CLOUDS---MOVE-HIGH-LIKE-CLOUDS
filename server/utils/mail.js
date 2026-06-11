import nodemailer from 'nodemailer';

function hasSmtp() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter;

function getTransporter() {
  if (!hasSmtp()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * @param {{ to: string; subject: string; text: string; html?: string }} opts
 * @returns {{ sent: boolean; skipped?: boolean; error?: string }}
 */
export async function sendMail(opts) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@localhost';
  const t = getTransporter();
  if (!t) {
    console.log('[mail] SMTP not configured — would send to', opts.to, '|', opts.subject);
    return { sent: false, skipped: true };
  }
  try {
    await t.sendMail({
      from: `"CLOUDS" <${from}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, '<br/>')
    });
    return { sent: true };
  } catch (e) {
    console.error('[mail]', e.message);
    return { sent: false, error: e.message };
  }
}
