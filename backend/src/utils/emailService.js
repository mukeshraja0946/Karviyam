const nodemailer = require('nodemailer');

const getTransporters = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || '';

  const list = [];

  if (pass) {
    list.push(nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000
    }));
  }

  // Hostinger SSL (Port 465)
  list.push(nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  }));

  // Hostinger TLS (Port 587)
  list.push(nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false,
    auth: pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  }));

  // Server Sendmail Binary
  try {
    list.push(nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    }));
  } catch (e) {}

  return list;
};

exports.sendContactEmail = async ({ name, email, subject, message, source = 'Customer' }) => {
  const recipient = process.env.CONTACT_RECEIVER_EMAIL || 'vanakkam@karviyam.com';
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

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

  const transporters = getTransporters();
  for (const transporter of transporters) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [SMTP Success] Contact email delivered to ${recipient}! ID: ${info.messageId || 'OK'}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [SMTP Transport Warning]: ${err.message}`);
    }
  }

  console.error(`❌ [SMTP Final Failure]: Could not deliver email to ${recipient}. Please check SMTP_PASS in backend/.env`);
  return false;
};

exports.sendAdminReplyEmail = async ({ toEmail, customerName, subject, replyMessage, originalMessage = '' }) => {
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const mailOptions = {
    from: `"Karviyam Support" <${fromUser}>`,
    to: toEmail,
    replyTo: supportEmail,
    subject: `Re: ${subject || 'Karviyam Support Request'}`,
    text: `Hello ${customerName || 'Customer'},\n\n${replyMessage}\n\n----------------------------\nOriginal Message:\n${originalMessage}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background-color: #B71C1C; padding: 15px 20px; border-radius: 12px 12px 0 0; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px;">Karviyam Customer Support</h2>
        </div>
        <div style="padding: 20px 10px;">
          <p>Hello <strong>${customerName || 'Valued Customer'}</strong>,</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #B71C1C; font-size: 14px; line-height: 1.6; color: #1e293b; margin: 15px 0;">
            ${String(replyMessage || '').replace(/\n/g, '<br/>')}
          </div>
          ${originalMessage ? `
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; font-weight: bold; margin-bottom: 6px;">Your Previous Message:</p>
            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 12px; color: #475569; line-height: 1.5;">
              ${String(originalMessage).replace(/\n/g, '<br/>')}
            </div>
          ` : ''}
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; text-align: center;">
          Sent by Karviyam Support Team | Reply to: <strong>${supportEmail}</strong>
        </div>
      </div>
    `
  };

  const transporters = getTransporters();
  for (const transporter of transporters) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [SMTP Success] Admin reply email delivered to ${toEmail}! ID: ${info.messageId || 'OK'}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ [SMTP Transport Retry]: ${err.message}`);
    }
  }

  console.error(`❌ [SMTP Final Failure]: Could not deliver reply email to ${toEmail}. Please configure SMTP_PASS in backend/.env`);
  return false;
};
