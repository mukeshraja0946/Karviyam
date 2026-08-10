const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || '';

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
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

exports.sendContactEmail = async ({ name, email, subject, message, source = 'Customer' }) => {
  const recipient = process.env.CONTACT_RECEIVER_EMAIL || 'vanakkam@karviyam.com';
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[Email Service] SMTP password not configured in .env. Target recipient: ${recipient}`);
      return false;
    }

    const mailOptions = {
      from: `"Karviyam ${source}" <${fromUser}>`,
      to: recipient,
      replyTo: email,
      subject: `[${source}] ${subject || 'Contact Request from ' + name}`,
      text: `Customer Contact Message\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || 'N/A'}\nDate/Time: ${timestamp}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="background-color: #B71C1C; padding: 15px 20px; border-radius: 12px 12px 0 0; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px;">Karviyam ${source} Message</h2>
          </div>
          <div style="padding: 20px 10px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Date/Time:</strong> ${timestamp}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #B71C1C; font-size: 14px; line-height: 1.5; color: #1e293b;">
              ${String(message || '').replace(/\n/g, '<br/>')}
            </div>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; text-align: center;">
            Sent to <strong>${recipient}</strong> | Reply-To: ${email}
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ [Email Service] Sent ${source} email from ${email} to ${recipient}`);
    return true;
  } catch (err) {
    console.error(`⚠️ [Email Service Error] Could not send email to ${recipient}:`, err.message);
    return false;
  }
};
