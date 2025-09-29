// utils/sendEmail.js
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    await transporter.sendMail({ from: EMAIL_FROM || SMTP_USER, to, subject, html });
    return;
  }

  // Development fallback — log
  console.log('--- sendEmail (dev fallback) ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html);
  console.log('--------------------------------');
}

module.exports = sendEmail;
