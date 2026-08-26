const nodemailer = require('nodemailer');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const getEmailLogoHeader = async () => {
  let customEmailLogoUrl = '';
  try {
    const [logoRows] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key IN ('email_logo_url', 'emailLogoUrl', 'logo_url', 'logoUrl') AND setting_value IS NOT NULL AND setting_value != '' ORDER BY id DESC LIMIT 1"
    );
    if (logoRows && logoRows.length > 0 && logoRows[0].setting_value) {
      customEmailLogoUrl = String(logoRows[0].setting_value).trim();
    }
  } catch (eLogo) {}

  const attachments = [];
  let logoHeaderHtml = '';

  if (customEmailLogoUrl) {
    let logoSrc = '';

    if (customEmailLogoUrl.startsWith('data:image/')) {
      const matches = customEmailLogoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        attachments.push({
          filename: `email-logo.${ext}`,
          content: Buffer.from(matches[2], 'base64'),
          cid: 'admin_custom_email_logo'
        });
        logoSrc = 'cid:admin_custom_email_logo';
      }
    } else if (customEmailLogoUrl.startsWith('http://') || customEmailLogoUrl.startsWith('https://')) {
      if (!customEmailLogoUrl.includes('localhost') && !customEmailLogoUrl.includes('127.0.0.1')) {
        logoSrc = customEmailLogoUrl;
      } else {
        const relativePath = customEmailLogoUrl.replace(/^https?:\/\/[^\/]+/, '');
        const possibleDirs = [
          path.join(process.cwd(), relativePath),
          path.join(__dirname, '../..', relativePath),
          path.join(__dirname, '..', relativePath)
        ];
        let foundPath = null;
        for (const p of possibleDirs) {
          if (fs.existsSync(p)) {
            foundPath = p;
            break;
          }
        }
        if (foundPath) {
          attachments.push({
            filename: 'email-logo.png',
            path: foundPath,
            cid: 'admin_custom_email_logo'
          });
          logoSrc = 'cid:admin_custom_email_logo';
        } else {
          const publicBaseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://karviyam.com';
          logoSrc = `${publicBaseUrl.replace(/\/$/, '')}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
        }
      }
    } else if (customEmailLogoUrl.startsWith('/') || customEmailLogoUrl.startsWith('uploads/')) {
      const cleanPath = customEmailLogoUrl.startsWith('/') ? customEmailLogoUrl : `/${customEmailLogoUrl}`;
      const possibleDirs = [
        path.join(process.cwd(), cleanPath),
        path.join(__dirname, '../..', cleanPath),
        path.join(__dirname, '..', cleanPath)
      ];
      let foundPath = null;
      for (const p of possibleDirs) {
        if (fs.existsSync(p)) {
          foundPath = p;
          break;
        }
      }
      if (foundPath) {
        attachments.push({
          filename: 'email-logo.png',
          path: foundPath,
          cid: 'admin_custom_email_logo'
        });
        logoSrc = 'cid:admin_custom_email_logo';
      } else {
        const publicBaseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://karviyam.com';
        logoSrc = `${publicBaseUrl.replace(/\/$/, '')}${cleanPath}`;
      }
    }

    if (logoSrc) {
      logoHeaderHtml = `
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td align="center" style="padding: 10px 0 16px 0;">
              <img src="${logoSrc}" alt="Karviyam Logo" style="max-width: 240px; max-height: 85px; width: auto; height: auto; display: block; border: 0; outline: none; text-decoration: none;" />
            </td>
          </tr>
        </table>
      `;
    }
  }

  if (!logoHeaderHtml) {
    logoHeaderHtml = `
      <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; text-align: center;">
        <tr>
          <td align="center" style="padding-bottom: 4px;">
            <div style="display: inline-block; width: 44px; height: 44px; background-color: #B71C1C; border-radius: 12px; line-height: 44px; text-align: center; color: #ffffff; font-family: Georgia, serif; font-size: 24px; font-weight: 900; box-shadow: 0 4px 10px rgba(183, 28, 28, 0.25);">
              K
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 6px;">
            <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 900; color: #B71C1C; letter-spacing: 4px; text-transform: uppercase; display: block;">KARVIYAM</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 2px;">
            <span style="font-family: Arial, sans-serif; font-size: 11.5px; color: #64748b; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Timeless Style • Premium Elegance</span>
          </td>
        </tr>
      </table>
    `;
  }

  return { logoHeaderHtml, attachments };
};

exports.sendAdminReplyEmail = async ({ toEmail, customerName, subject, replyMessage, originalMessage = '', orderId = '' }) => {
  const fromUser = process.env.SMTP_USER || process.env.MAIL_FROM || 'vanakkam@karviyam.com';
  const supportEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

  const cleanCustomerName = customerName || 'Valued Customer';
  const formattedReplyText = String(replyMessage || '').split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.6; color: #1e293b;">${p}</p>`).join('');

  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const mailOptions = {
    from: `"Karviyam Support" <${fromUser}>`,
    to: toEmail,
    replyTo: supportEmail,
    subject: `Re: ${subject || 'Karviyam Support Request'}`,
    text: `Hello ${cleanCustomerName},\n\n${replyMessage}\n\n----------------------------\nKarviyam Support Team\n${supportEmail}`,
    attachments,
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
              ${logoHeaderHtml}
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

  const transporters = await getTransporters();
  let lastErr = null;

  for (const transporter of transporters) {
    try {
      const info = await transporter.sendMail(mailOptions);
      const hostInfo = transporter.options?.host || 'smtp.hostinger.com';
      const portInfo = transporter.options?.port || 465;

      console.log(`\n========================================`);
      console.log(`[SUPPORT EMAIL]`);
      console.log(`Ticket ID: #${orderId || 'N/A'}`);
      console.log(`Customer: ${cleanCustomerName}`);
      console.log(`Recipient: ${toEmail}`);
      console.log(`Sender: Karviyam Support <${fromUser}>`);
      console.log(`Subject: Re: ${subject || 'Karviyam Support Request'}`);
      console.log(`SMTP provider: ${hostInfo}:${portInfo}`);
      console.log(`Message ID: ${info.messageId || 'OK'}`);
      console.log(`Provider response: ${info.response || '250 OK'}`);
      console.log(`Status: SUCCESS`);
      console.log(`========================================\n`);

      return {
        success: true,
        messageId: info.messageId || 'OK',
        providerResponse: info.response || '250 OK',
        provider: `${hostInfo}:${portInfo}`
      };
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ [SMTP Transport Retry]: ${err.message}`);
    }
  }

  console.error(`\n========================================`);
  console.error(`[SUPPORT EMAIL FAILURE]`);
  console.error(`Ticket ID: #${orderId || 'N/A'}`);
  console.error(`Customer: ${cleanCustomerName}`);
  console.error(`Recipient: ${toEmail}`);
  console.error(`Sender: Karviyam Support <${fromUser}>`);
  console.error(`Subject: Re: ${subject || 'Karviyam Support Request'}`);
  console.error(`Error: ${lastErr?.message || 'SMTP Authentication Failed'}`);
  console.error(`Status: FAILURE`);
  console.error(`========================================\n`);

  return {
    success: false,
    error: lastErr?.message || 'SMTP Authentication failed. Please verify SMTP_PASS in backend/.env for vanakkam@karviyam.com'
  };
};
