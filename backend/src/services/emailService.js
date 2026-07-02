const nodemailer = require('nodemailer');

const strategy = process.env.EMAIL_STRATEGY || 'console';

let transporter = null;
if (strategy === 'smtp') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Sends an email. In "console" mode (default), just logs it — so the app
 * runs and the notification flow is fully testable with zero email setup.
 * Switch EMAIL_STRATEGY=smtp in .env for real emails (any free SMTP works).
 */
async function sendEmail({ to, subject, text }) {
  if (strategy === 'console' || !transporter) {
    console.log('\n----- EMAIL (console mode) -----');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('---------------------------------\n');
    return { success: true, mode: 'console' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@society.com',
      to,
      subject,
      text,
    });
    return { success: true, mode: 'smtp' };
  } catch (err) {
    // Email failures should never break the main request flow.
    console.error('Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendStatusChangeEmail(resident, complaint, newStatus, note) {
  return sendEmail({
    to: resident.email,
    subject: `Your complaint #${complaint.id.slice(0, 8)} is now "${newStatus}"`,
    text: `Hi ${resident.name},\n\nYour complaint "${complaint.description}" has been updated to status: ${newStatus}.\n${note ? `Note from admin: ${note}\n` : ''}\nThanks,\nSociety Admin`,
  });
}

async function sendImportantNoticeEmail(residents, notice) {
  const results = [];
  for (const resident of residents) {
    results.push(
      await sendEmail({
        to: resident.email,
        subject: `[Important Notice] ${notice.title}`,
        text: `Hi ${resident.name},\n\n${notice.content}\n\n- Society Admin`,
      })
    );
  }
  return results;
}

module.exports = { sendEmail, sendStatusChangeEmail, sendImportantNoticeEmail };
