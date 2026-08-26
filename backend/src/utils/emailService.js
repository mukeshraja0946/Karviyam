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

exports.sendAdminReplyEmail = async ({ toEmail, customerName, subject, replyMessage, originalMessage = '', orderId = '' }) => {
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';
  
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  
  const cleanCustomerName = customerName || 'Valued Customer';
  const formattedReplyText = String(replyMessage || '').split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p style="margin: 0 0 12px 0;">${p}</p>`).join('');

  const mailOptions = {
    from: `"Karviyam Support" <${fromUser}>`,
    to: toEmail,
    replyTo: supportEmail,
    subject: `Re: ${subject || 'Karviyam Support Request'}`,
    text: `Hello ${cleanCustomerName},\n\n${replyMessage}\n\n----------------------------\nKarviyam Support Team\n${supportEmail}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Karviyam Customer Support</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 720px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- 1. Top Red Bar -->
          <tr>
            <td style="height: 6px; background-color: #B71C1C; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- 2. Logo & Brand Header -->
          <tr>
            <td align="center" style="padding: 24px 20px 16px 20px; background-color: #ffffff;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
                      <path d="M12 3C12 3 8.5 7.5 8.5 12C8.5 14.5 10 16.5 12 17.5C14 16.5 15.5 14.5 15.5 12C15.5 7.5 12 3 12 3Z" fill="#B71C1C"/>
                      <path d="M12 17.5C9.5 16.8 6 14 6 11C6 9 7.5 7.5 7.5 7.5C7.5 7.5 5 10.5 5 13.5C5 16.5 8 18.5 12 19C16 18.5 19 16.5 19 13.5C19 10.5 16.5 7.5 16.5 7.5C16.5 7.5 18 9 18 11C18 14 14.5 16.8 12 17.5Z" fill="#B71C1C"/>
                      <path d="M12 19C7 18.5 3 15.5 3 13.5C3 12 4 10.5 4 10.5C4 10.5 2 12.5 2 15C2 17.5 6 20.5 12 21C18 20.5 22 17.5 22 15C22 12.5 20 10.5 20 10.5C20 10.5 21 12 21 13.5C21 15.5 17 18.5 12 19Z" fill="#B71C1C"/>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 900; color: #B71C1C; letter-spacing: 3px; text-transform: uppercase;">KARVIYAM</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 2px;">
                    <span style="font-size: 11px; color: #64748b; font-weight: 500; letter-spacing: 0.5px;">Timeless Style. Trusted Quality.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Red Banner Section -->
          <tr>
            <td align="center" style="background-color: #B71C1C; padding: 14px 20px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                  </td>
                  <td style="vertical-align: middle; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">
                    Karviyam Customer Support
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 4. Email Main Content -->
          <tr>
            <td style="padding: 24px 28px; background-color: #ffffff;">
              
              <!-- Greeting & Date/Time -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 18px;">
                <tr>
                  <td align="left" style="font-size: 15px; color: #1e293b; font-weight: 400;">
                    Hello <strong style="color: #0f172a; font-weight: 700;">${cleanCustomerName}</strong>,
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.4;">
                    ${formattedTime}<br/>${formattedDate}
                  </td>
                </tr>
              </table>

              <p style="font-size: 13.5px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
                Thank you for contacting Karviyam. We have reviewed your support inquiry and provided an update below:
              </p>

              <!-- Original Customer Message Alert Callout -->
              ${(subject || originalMessage) ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; background-color: #fff5f5; border-left: 4px solid #B71C1C; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="vertical-align: top; padding-right: 10px;">
                          <div style="width: 24px; height: 24px; background-color: #B71C1C; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-weight: bold; font-size: 13px;">!</div>
                        </td>
                        <td style="font-size: 13px; color: #1e293b; line-height: 1.5;">
                          We understand that you have an issue with <strong style="color: #B71C1C;">${subject || 'your inquiry'}</strong>${orderId ? ` regarding Order <strong style="color: #B71C1C;">#${orderId}</strong>` : ''}.
                          ${originalMessage ? `<div style="margin-top: 6px; font-style: italic; color: #475569;">"${originalMessage}"</div>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Support Team Reply Text -->
              <div style="font-size: 14px; color: #1e293b; line-height: 1.65; margin-bottom: 20px;">
                ${formattedReplyText}
              </div>

              <!-- Sign Off -->
              <p style="font-size: 13.5px; color: #334155; line-height: 1.6; margin: 24px 0 0 0;">
                We know how important this is to you, rest assured that we are here to assist you.<br/><br/>
                Thank you for choosing Karviyam,<br/>
                <strong style="color: #B71C1C; font-size: 14.5px; display: block; margin-top: 4px;">Karviyam Support Team</strong>
                <a href="mailto:${supportEmail}" style="color: #64748b; text-decoration: none; font-size: 13px;">${supportEmail}</a>
              </p>

            </td>
          </tr>

          <!-- 5. Pre-Footer Support Information -->
          <tr>
            <td style="padding: 20px 28px; background-color: #ffffff; border-top: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 16px; border-right: 1px solid #f1f5f9;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="34" style="vertical-align: top; padding-right: 8px;">
                          <div style="width: 28px; height: 28px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 28px; color: #B71C1C; font-size: 14px;">♥</div>
                        </td>
                        <td style="font-size: 12px; color: #475569; line-height: 1.4;">
                          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">We're here to help!</strong>
                          Your satisfaction is important to us. Thank you for being a valued customer.
                        </td>
                      </tr>
                    </table>
                  </td>

                  <td width="50%" style="vertical-align: top; padding-left: 16px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
                      <tr>
                        <td width="26" style="vertical-align: middle; padding-right: 6px;">
                          <div style="width: 22px; height: 22px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 22px; color: #B71C1C; font-size: 11px;">🎧</div>
                        </td>
                        <td style="font-size: 12px; color: #0f172a;">
                          <strong style="display: inline;">Need more help?</strong>
                          <a href="https://karviyam.com/contact" style="color: #B71C1C; text-decoration: none; font-weight: 600; display: block;">Visit our Help Center</a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="26" style="vertical-align: middle; padding-right: 6px;">
                          <div style="width: 22px; height: 22px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 22px; color: #B71C1C; font-size: 11px;">✉</div>
                        </td>
                        <td style="font-size: 12px; color: #0f172a;">
                          <strong style="display: inline;">Reply to this email</strong>
                          <a href="mailto:${supportEmail}" style="color: #B71C1C; text-decoration: none; font-weight: 600; display: block;">${supportEmail}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Dark Red Bottom Footer -->
          <tr>
            <td align="center" style="background-color: #B71C1C; padding: 18px 20px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://facebook.com" style="display: inline-block; width: 26px; height: 26px; background-color: #ffffff; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; text-decoration: none; font-weight: bold; font-size: 12px;">f</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://instagram.com" style="display: inline-block; width: 26px; height: 26px; background-color: #ffffff; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; text-decoration: none; font-weight: bold; font-size: 12px;">📷</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://youtube.com" style="display: inline-block; width: 26px; height: 26px; background-color: #ffffff; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; text-decoration: none; font-weight: bold; font-size: 12px;">▶</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://x.com" style="display: inline-block; width: 26px; height: 26px; background-color: #ffffff; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; text-decoration: none; font-weight: bold; font-size: 12px;">𝕏</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11px; color: #ffffff; font-weight: 500; letter-spacing: 0.5px;">
                © ${new Date().getFullYear()} Karviyam. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
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
