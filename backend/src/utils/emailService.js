const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER || 'vanakkam@karviyam.com';
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';

  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

exports.sendContactEmail = async ({ name, email, subject, message }) => {
  const recipient = 'vanakkam@karviyam.com';
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[Email Service] SMTP credentials not set. Contact message from ${email} saved to database. Target: ${recipient}`);
      return false;
    }

    const mailOptions = {
      from: `"Karviyam Contact" <vanakkam@karviyam.com>`,
      to: recipient,
      replyTo: email,
      subject: `[Customer Message] ${subject || 'Inquiry from ' + name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="background-color: #B71C1C; padding: 15px 20px; border-radius: 12px 12px 0 0; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px;">Karviyam Customer Contact Message</h2>
          </div>
          <div style="padding: 20px 10px;">
            <p><strong>Customer Name:</strong> ${name}</p>
            <p><strong>Email Address:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #B71C1C; font-size: 14px; line-height: 1.5; color: #1e293b;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; text-align: center;">
            Sent directly from Karviyam.com Contact Page to <strong>vanakkam@karviyam.com</strong>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Sent contact email to ${recipient}`);
    return true;
  } catch (err) {
    console.error(`⚠️ [Email Service Error] Could not send email to ${recipient}:`, err.message);
    return false;
  }
};
