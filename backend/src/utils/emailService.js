const getTransporters = () => {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.HOSTINGER_SMTP_PASS || process.env.MAIL_PASS || '';

  const list = [];

  if (pass) {
    // 1. Primary Configured SMTP
    list.push(nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    }));

    // 2. Hostinger SSL (Port 465)
    list.push(nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    }));

    // 3. Hostinger TLS (Port 587)
    list.push(nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    }));
  } else {
    console.warn(`⚠️ [SMTP Configuration Warning]: SMTP_PASS is missing in backend/.env for ${user}. Hostinger SMTP requires authentication password.`);
  }

  // 4. Server Sendmail Binary Fallback
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
  const formattedReplyText = String(replyMessage || '').split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.6; color: #1e293b;">${p}</p>`).join('');

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
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; padding: 20px 10px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 680px; background-color: #ffffff;">
          
          <!-- 1. Header Logo & Brand -->
          <tr>
            <td align="center" style="padding: 10px 0 20px 0;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
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
                    <span style="font-size: 12px; color: #64748b; font-weight: 500; letter-spacing: 0.5px;">Timeless Style. Trusted Quality.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Greeting & Time Header -->
          <tr>
            <td style="padding: 10px 0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="font-size: 15px; color: #0f172a; font-weight: 400;">
                    Hello <strong style="color: #0f172a; font-weight: 700;">${cleanCustomerName}</strong>,
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.4;">
                    ${formattedTime}<br/>${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Divider Line -->
          <tr>
            <td style="padding: 12px 0 20px 0;">
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0;" />
            </td>
          </tr>

          <!-- 4. Email Body Text -->
          <tr>
            <td style="padding: 0 0 10px 0; font-size: 14.5px; color: #1e293b; line-height: 1.6;">
              
              <p style="margin: 0 0 16px 0;">Hello from Karviyam Customer Support,</p>

              ${(subject || originalMessage || orderId) ? `
              <p style="margin: 0 0 16px 0;">
                We understand that you have an issue with <strong style="color: #B71C1C;">${subject || 'your support inquiry'}</strong>${orderId ? ` regarding Order <strong style="color: #B71C1C;">#${orderId}</strong>` : ''}.
              </p>
              ` : ''}

              <!-- Dynamic Support Reply Paragraphs -->
              ${formattedReplyText}

              <!-- Sign Off -->
              <p style="margin: 24px 0 0 0; font-size: 14.5px; color: #1e293b; line-height: 1.6;">
                We appreciate your cooperation and understanding in this regard.<br/><br/>
                Thank you for choosing Karviyam,<br/><br/>
                <strong style="color: #B71C1C; font-size: 15px; display: block; margin-bottom: 2px;">Karviyam Support Team</strong>
                <a href="mailto:${supportEmail}" style="color: #334155; text-decoration: none; font-size: 13.5px;">${supportEmail}</a>
              </p>

            </td>
          </tr>

          <!-- 5. Bottom Divider Line -->
          <tr>
            <td style="padding: 24px 0 20px 0;">
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 0;" />
            </td>
          </tr>

          <!-- 6. Pre-Footer Support Info Section (3 Columns on White) -->
          <tr>
            <td style="padding: 10px 0 24px 0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  
                  <!-- Column 1: We're here to help -->
                  <td width="33%" style="vertical-align: top; padding-right: 12px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="vertical-align: top; padding-right: 8px;">
                          <div style="width: 26px; height: 26px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; font-size: 14px;">🎧</div>
                        </td>
                        <td style="font-size: 12px; color: #475569; line-height: 1.4;">
                          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">We're here to help!</strong>
                          Your satisfaction is important to us. Thank you for being a valued customer.
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Column 2: Need more help? -->
                  <td width="33%" style="vertical-align: top; padding: 0 10px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="vertical-align: top; padding-right: 8px;">
                          <div style="width: 26px; height: 26px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; font-size: 13px;">📖</div>
                        </td>
                        <td style="font-size: 12px; color: #475569; line-height: 1.4;">
                          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">Need more help?</strong>
                          <a href="https://karviyam.com/contact" style="color: #B71C1C; text-decoration: none; font-weight: 600;">Visit our Help Center</a>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Column 3: Reply to this email -->
                  <td width="33%" style="vertical-align: top; padding-left: 12px;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="vertical-align: top; padding-right: 8px;">
                          <div style="width: 26px; height: 26px; background-color: #fff5f5; border-radius: 50%; text-align: center; line-height: 26px; color: #B71C1C; font-size: 13px;">✉</div>
                        </td>
                        <td style="font-size: 12px; color: #475569; line-height: 1.4;">
                          <strong style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 2px;">Reply to this email</strong>
                          <a href="mailto:${supportEmail}" style="color: #B71C1C; text-decoration: none; font-weight: 600;">${supportEmail}</a>
                        </td>
                      </tr>
                    </table>
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. Footer Social Icons & Copyright -->
          <tr>
            <td align="center" style="padding: 10px 0 20px 0;">
              
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://facebook.com" style="display: inline-block; width: 28px; height: 28px; background-color: #B71C1C; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px;">f</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://instagram.com" style="display: inline-block; width: 28px; height: 28px; background-color: #B71C1C; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px;">📷</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://youtube.com" style="display: inline-block; width: 28px; height: 28px; background-color: #B71C1C; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px;">▶</a>
                  </td>
                  <td style="padding: 0 6px;">
                    <a href="https://x.com" style="display: inline-block; width: 28px; height: 28px; background-color: #B71C1C; border-radius: 50%; text-align: center; line-height: 28px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px;">𝕏</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
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
