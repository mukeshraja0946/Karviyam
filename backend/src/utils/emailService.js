const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || '';

  if (pass) {
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
  }

  // Fallback 1: Try Hostinger port 587 without auth if internal relay allowed
  if (host.includes('hostinger')) {
    return nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback 2: Local sendmail
  return nodemailer.createTransport({
    sendmail: true,
    newline: 'unix',
    path: '/usr/sbin/sendmail'
  });
};

exports.sendContactEmail = async ({ name, email, subject, message, source = 'Customer' }) => {
  const recipient = process.env.CONTACT_RECEIVER_EMAIL || 'vanakkam@karviyam.com';
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  console.log(`\n================ EMAIL SEND ATTEMPT ================`);
  console.log(`[SMTP Target]: ${recipient}`);
  console.log(`[From]: ${fromUser} | [ReplyTo]: ${email}`);
  console.log(`[Subject]: ${subject}`);
  console.log(`[Source]: ${source}`);

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error(`❌ [SMTP Error]: No valid transport configuration found.`);
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [SMTP Success] Message sent! MessageId: ${info.messageId || 'OK'}`);
    console.log(`====================================================\n`);
    return true;
  } catch (err) {
    console.error(`❌ [SMTP Send Failure]: ${err.message}`);
    console.log(`====================================================\n`);

    // Backup try: Google Workspace SMTP if hostinger fails
    try {
      console.log(`[SMTP Fallback] Retrying with Google Workspace / alternate port 587...`);
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'vanakkam@karviyam.com',
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ''
        },
        tls: { rejectUnauthorized: false }
      });
      if (process.env.SMTP_PASS || process.env.SMTP_PASSWORD) {
        await fallbackTransporter.sendMail({
          from: `"Karviyam ${source}" <${fromUser}>`,
          to: recipient,
          replyTo: email,
          subject: `[${source}] ${subject || 'Contact Request from ' + name}`,
          text: message
        });
        console.log(`✅ [SMTP Fallback Success] Delivered via fallback server!`);
        return true;
      }
    } catch (fallbackErr) {
      console.error(`❌ [SMTP Fallback Error]: ${fallbackErr.message}`);
    }

    return false;
  }
};

exports.sendAdminReplyEmail = async ({ toEmail, customerName, subject, replyMessage, originalMessage = '' }) => {
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  console.log(`\n================ ADMIN REPLY EMAIL SEND ATTEMPT ================`);
  console.log(`[From]: ${fromUser}`);
  console.log(`[To]: ${toEmail}`);
  console.log(`[Reply-To]: ${supportEmail}`);
  console.log(`[Subject]: Re: ${subject}`);

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error(`❌ [SMTP Error]: No valid transport configuration found.`);
      return false;
    }

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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [SMTP Success] Admin reply sent to ${toEmail}! MessageId: ${info.messageId || 'OK'}`);
    console.log(`================================================================\n`);
    return true;
  } catch (err) {
    console.error(`❌ [SMTP Send Failure]: ${err.message}`);
    console.log(`================================================================\n`);

    try {
      console.log(`[SMTP Fallback] Retrying reply via fallback server...`);
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'vanakkam@karviyam.com',
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ''
        },
        tls: { rejectUnauthorized: false }
      });
      if (process.env.SMTP_PASS || process.env.SMTP_PASSWORD) {
        await fallbackTransporter.sendMail({
          from: `"Karviyam Support" <${fromUser}>`,
          to: toEmail,
          replyTo: supportEmail,
          subject: `Re: ${subject || 'Karviyam Support Request'}`,
          text: replyMessage
        });
        console.log(`✅ [SMTP Fallback Success] Delivered reply via fallback server!`);
        return true;
      }
    } catch (fallbackErr) {
      console.error(`❌ [SMTP Fallback Error]: ${fallbackErr.message}`);
    }

    return false;
  }
};

