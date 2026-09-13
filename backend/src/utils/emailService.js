const nodemailer = require('nodemailer');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const VERIFIED_SENDER_EMAIL = 'vanakkam@karviyam.com';
const VERIFIED_SENDER_NAME = 'Karviyam';

const getSmtpConfig = async () => {
  // Reload dotenv if needed to catch live .env updates
  try {
    require('dotenv').config({ override: true });
  } catch (e) {}

  let envHost = process.env.SMTP_HOST || '';
  let envPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
  let envUser = process.env.SMTP_USER || '';
  let envPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '';

  let host = envHost;
  let port = envPort;
  let user = envUser;
  let pass = envPass ? envPass.replace(/\s+/g, '') : '';

  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_password', 'email_password') AND setting_value IS NOT NULL AND setting_value != ''"
    );
    const dbMap = {};
    rows.forEach(r => { dbMap[r.setting_key] = r.setting_value; });

    if (!host && dbMap.smtp_host) host = dbMap.smtp_host;
    if (!port && dbMap.smtp_port) port = Number(dbMap.smtp_port);
    if (!user && dbMap.smtp_user) user = dbMap.smtp_user;
    if (!pass && (dbMap.smtp_pass || dbMap.smtp_password || dbMap.email_password)) {
      pass = (dbMap.smtp_pass || dbMap.smtp_password || dbMap.email_password).replace(/\s+/g, '');
    }
  } catch (eDb) {
    console.error('Failed to load SMTP settings from DB:', eDb.message);
  }

  // Strict Karviyam defaults — force Google Workspace SMTP and reject legacy Hostinger SMTP host
  if (!host || host === 'smtp.hostinger.com') host = 'smtp.gmail.com';
  if (!port) port = 465;
  if (!user) user = VERIFIED_SENDER_EMAIL;

  const fromName = VERIFIED_SENDER_NAME;
  const fromEmail = VERIFIED_SENDER_EMAIL;
  const secure = port === 465;

  // Sync working config to DB settings table so DB is always aligned
  if (host && user && pass) {
    try {
      const syncKeys = [
        ['smtp_host', host],
        ['smtp_port', String(port)],
        ['smtp_user', user],
        ['smtp_pass', pass]
      ];
      for (const [k, v] of syncKeys) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?`,
          [k, v, v]
        );
      }
    } catch (eSync) {}
  }

  return { host, port, secure, user, pass, fromName, fromEmail };
};

const getTransporters = async () => {
  const config = await getSmtpConfig();
  console.log(`[SMTP Diagnostic]: Host=${config.host}:${config.port}, User=${config.user ? 'Configured (' + config.user + ')' : 'Missing'}, Password=${config.pass ? 'Configured (Hidden)' : 'Missing'}, Secure=${config.secure}`);

  const list = [];

  if (config.pass && config.user) {
    list.push(nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    }));
  }

  return list;
};

const verifySmtpConnection = async () => {
  const config = await getSmtpConfig();
  const maskedUser = config.user ? `${config.user.slice(0, 2)}***@${config.user.split('@')[1] || ''}` : null;

  if (!config.user || !config.pass) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'SMTP credentials (user/password) not configured',
      host: config.host,
      port: config.port,
      user: maskedUser
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  try {
    await transporter.verify();
    return {
      verified: true,
      status: 'CONNECTED',
      message: 'SMTP connection verified successfully',
      host: config.host,
      port: config.port,
      user: maskedUser
    };
  } catch (err) {
    const isAuthErr = err.message.includes('535') || err.message.toLowerCase().includes('authentication') || err.message.toLowerCase().includes('login');
    return {
      verified: false,
      status: isAuthErr ? 'AUTH_FAILED' : 'CONNECTION_FAILED',
      errorCode: err.code || (isAuthErr ? 'EAUTH' : 'ECONNECTION'),
      responseCode: err.responseCode || (isAuthErr ? 535 : null),
      message: err.message,
      host: config.host,
      port: config.port,
      user: maskedUser
    };
  }
};

const getEmailLogoHeader = async (options = {}) => {
  const { isPreview = false, req = null } = options;
  let customEmailLogoUrl = '';
  try {
    const [logoRows] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key IN ('email_logo_url', 'emailLogoUrl', 'logo_url', 'logoUrl') AND setting_value IS NOT NULL AND setting_value != '' ORDER BY id DESC LIMIT 1"
    );
    if (logoRows && logoRows.length > 0 && logoRows[0].setting_value) {
      customEmailLogoUrl = String(logoRows[0].setting_value).trim();
    }
  } catch (eLogo) {}

  let logoHeaderHtml = '';
  const attachments = [];

  if (customEmailLogoUrl) {
    let cleanPath = customEmailLogoUrl;

    if (cleanPath.includes('/uploads/')) {
      const match = cleanPath.match(/\/uploads\/.+$/);
      if (match) cleanPath = match[0];
    }

    if (cleanPath.startsWith('http://localhost') || cleanPath.startsWith('https://localhost') || cleanPath.startsWith('http://127.0.0.1')) {
      cleanPath = cleanPath.replace(/^https?:\/\/[^\/]+/, '');
    }

    let logoSrc = '';
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      logoSrc = cleanPath;
    } else if (cleanPath.startsWith('data:image/')) {
      logoSrc = cleanPath;
    } else {
      let publicBaseUrl = process.env.PUBLIC_BASE_URL || process.env.BASE_URL || process.env.FRONTEND_URL || 'https://karviyam.com';
      if (publicBaseUrl.includes('localhost') || publicBaseUrl.includes('127.0.0.1')) {
        publicBaseUrl = 'https://karviyam.com';
      }
      if (isPreview && req) {
        const host = req.get('host');
        const protocol = req.protocol || 'http';
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          publicBaseUrl = `${protocol}://${host}`;
        }
      }
      logoSrc = `${publicBaseUrl.replace(/\/$/, '')}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
    }

    if (logoSrc) {
      logoHeaderHtml = `
        <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; text-align: center;">
          <tr>
            <td align="center" style="padding: 10px 0 6px 0;">
              <img src="${logoSrc}" alt="Karviyam" width="220" style="max-width: 220px; width: 220px; height: auto; display: block; margin: 0 auto; border: 0; outline: none; text-decoration: none;" />
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
            <div style="display: inline-block; width: 52px; height: 52px; background-color: #B71C1C; border-radius: 12px; line-height: 52px; text-align: center; color: #ffffff; font-family: Georgia, serif; font-size: 28px; font-weight: 900; box-shadow: 0 4px 10px rgba(183, 28, 28, 0.25);">
              K
            </div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 6px;">
            <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 900; color: #B71C1C; letter-spacing: 4px; text-transform: uppercase; display: block;">KARVIYAM</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 2px;">
            <span style="font-family: Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Timeless Style • Premium Elegance</span>
          </td>
        </tr>
      </table>
    `;
  }

  return { logoHeaderHtml, attachments };
};

const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const fromUser = VERIFIED_SENDER_EMAIL;
    const supportEmail = VERIFIED_SENDER_EMAIL;
    const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

    const mailOptions = {
      from: `"Karviyam Contact Form" <${fromUser}>`,
      to: supportEmail,
      replyTo: VERIFIED_SENDER_EMAIL,
      envelope: { from: VERIFIED_SENDER_EMAIL, to: supportEmail },
      subject: `New Contact Submission: ${subject || 'Customer Inquiry'}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      attachments,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
  ${logoHeaderHtml || '<h2>KARVIYAM</h2>'}
  <h3>New Support / Contact Submission</h3>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
  <hr/>
  <p><strong>Message:</strong></p>
  <blockquote style="background:#f8fafc; padding:12px; border-left:4px solid #b71c1c;">${message}</blockquote>
</body>
</html>
      `
    };

    const transporters = await getTransporters();
    for (const transporter of transporters) {
      try {
        await transporter.sendMail(mailOptions);
        return { success: true };
      } catch (err) {
        console.warn(`[Send Contact Email Warning]: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[sendContactEmail Error]:', err.message);
  }
  return { success: false };
};

const sendAdminReplyEmail = async ({ toEmail, customerName, subject, replyMessage, originalMessage = '', orderId = '' }) => {
  const fromUser = VERIFIED_SENDER_EMAIL;
  const supportEmail = VERIFIED_SENDER_EMAIL;

  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

  const cleanCustomerName = customerName || 'Valued Customer';
  const formattedReplyText = String(replyMessage || '').split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p style="margin: 0 0 14px 0; font-size: 14.5px; line-height: 1.6; color: #1e293b;">${p}</p>`).join('');

  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const mailOptions = {
    from: `"Karviyam Support" <${fromUser}>`,
    to: toEmail,
    replyTo: VERIFIED_SENDER_EMAIL,
    envelope: { from: VERIFIED_SENDER_EMAIL, to: toEmail },
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
      const hostInfo = transporter.options?.host || 'smtp.gmail.com';
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

const sendSubscriptionSuccessEmail = async (subscription) => {
  if (!subscription || !subscription.email) return;

  const toEmail = subscription.email;
  const fromUser = VERIFIED_SENDER_EMAIL;
  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const amountText = `${subscription.currency || '₹'} ${subscription.amount || '99'}`;
  const dateText = subscription.paymentDate ? new Date(subscription.paymentDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding:24px;background-color:#ffffff;border-bottom:1px solid #F1F5F9;">
              ${logoHeaderHtml || '<h1 style="margin:0;color:#B71C1C;font-family:serif;letter-spacing:2px;">🌸 KARVIYAM</h1>'}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;color:#1E293B;">
              <div style="display:inline-block;background-color:#FEF2F2;border:1px solid #FCA5A5;color:#B71C1C;font-weight:bold;font-size:11px;padding:4px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">
                VIP DROP ALERTS ACTIVE
              </div>
              <h2 style="margin:0 0 12px 0;font-size:22px;color:#0F172A;font-weight:800;">
                Subscription Confirmed! 🎉
              </h2>
              <p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.6;">
                Welcome to the KARVIYAM VIP Club! You are now subscribed to receive exclusive drop alerts, VIP coupons, and member discounts.
              </p>

              <div style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <h4 style="margin:0 0 12px 0;font-size:13px;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px;">Subscription Receipt</h4>
                <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:13px;color:#334155;">
                  <tr>
                    <td><strong>Subscriber Email:</strong></td>
                    <td align="right">${toEmail}</td>
                  </tr>
                  <tr>
                    <td><strong>Subscription ID:</strong></td>
                    <td align="right">#SUB-${subscription.id}</td>
                  </tr>
                  <tr>
                    <td><strong>Payment Reference:</strong></td>
                    <td align="right" style="font-family:monospace;font-weight:bold;">${subscription.paymentId || 'ONLINE_PAYMENT'}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount Paid:</strong></td>
                    <td align="right" style="color:#B71C1C;font-weight:bold;">${amountText}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td align="right" style="color:#15803D;font-weight:bold;">🟢 ACTIVE VIP MEMBER</td>
                  </tr>
                  <tr>
                    <td><strong>Date & Time:</strong></td>
                    <td align="right">${dateText}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color:#FFF1F2;border:1px dashed #FDA4AF;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
                <span style="font-size:11px;color:#9F1239;font-weight:bold;text-transform:uppercase;display:block;margin-bottom:4px;">VIP Welcome Coupon</span>
                <span style="font-size:20px;font-family:monospace;font-weight:900;color:#B71C1C;letter-spacing:2px;">KARVIYAM25</span>
                <span style="font-size:11px;color:#475569;display:block;margin-top:4px;">Use at checkout for an extra 25% OFF your next order!</span>
              </div>

              <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5;">
                Thank you for supporting KARVIYAM. Should you have any questions, feel free to contact our customer care at <a href="mailto:vanakkam@karviyam.com" style="color:#B71C1C;text-decoration:none;font-weight:bold;">vanakkam@karviyam.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;background-color:#F1F5F9;text-align:center;font-size:11px;color:#64748B;">
              © 2026 KARVIYAM E-Commerce Platform. All Rights Reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Karviyam VIP Club" <${fromUser}>`,
    to: toEmail,
    replyTo: VERIFIED_SENDER_EMAIL,
    envelope: { from: VERIFIED_SENDER_EMAIL, to: toEmail },
    subject: '🎉 Subscription Confirmed! Welcome to KARVIYAM VIP Drop Alerts',
    html,
    attachments
  };

  const transporters = await getTransporters();
  for (const transporter of transporters) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Subscription Confirmation Email Sent] -> ${toEmail}`);
      return { success: true };
    } catch (err) {
      console.warn(`[Subscription Email Retry]: ${err.message}`);
    }
  }
};

const sendCampaignEmail = async ({ toEmail, subject, content, couponCode }) => {
  if (!toEmail) return;

  const fromUser = VERIFIED_SENDER_EMAIL;
  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const formattedContent = String(content || '').replace(/\n/g, '<br/>');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding:24px;background-color:#ffffff;border-bottom:1px solid #F1F5F9;">
              ${logoHeaderHtml || '<h1 style="margin:0;color:#B71C1C;font-family:serif;letter-spacing:2px;">🌸 KARVIYAM</h1>'}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;color:#1E293B;">
              <h2 style="margin:0 0 16px 0;font-size:20px;color:#0F172A;font-weight:800;">
                ${subject}
              </h2>

              <div style="font-size:14px;color:#334155;line-height:1.7;margin-bottom:24px;">
                ${formattedContent}
              </div>

              ${couponCode ? `
              <div style="background-color:#FEF2F2;border:2px dashed #FCA5A5;border-radius:12px;padding:18px;text-align:center;margin-bottom:24px;">
                <span style="font-size:11px;color:#991B1B;font-weight:bold;text-transform:uppercase;display:block;margin-bottom:4px;">Exclusive Coupon Code</span>
                <span style="font-size:22px;font-family:monospace;font-weight:900;color:#B71C1C;letter-spacing:3px;">${couponCode}</span>
                <span style="font-size:11px;color:#64748B;display:block;margin-top:6px;">Apply this coupon at checkout to enjoy your exclusive discount.</span>
              </div>
              ` : ''}

              <div style="text-align:center;margin-top:28px;">
                <a href="https://karviyam.com/shop" style="background-color:#B71C1C;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;padding:12px 28px;border-radius:99px;display:inline-block;letter-spacing:1px;text-transform:uppercase;">
                  Shop Latest Collections →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;background-color:#F1F5F9;text-align:center;font-size:11px;color:#64748B;">
              © 2026 KARVIYAM E-Commerce Platform. All Rights Reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Karviyam Offers" <${fromUser}>`,
    to: toEmail,
    replyTo: VERIFIED_SENDER_EMAIL,
    envelope: { from: VERIFIED_SENDER_EMAIL, to: toEmail },
    subject: subject,
    html,
    attachments
  };

  const transporters = await getTransporters();
  for (const transporter of transporters) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err) {
      console.warn(`[Campaign Email Retry for ${toEmail}]: ${err.message}`);
    }
  }
};

const sendTestEmail = async (toEmail) => {
  const fromUser = VERIFIED_SENDER_EMAIL;
  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;padding:20px;color:#0F172A;">
  ${logoHeaderHtml || '<h2 style="color:#B71C1C;">🌸 KARVIYAM</h2>'}
  <h3>SMTP Email Configuration Test</h3>
  <p>This is a successful test email sent from your KARVIYAM Admin Panel.</p>
  <p><strong>Configured Sender:</strong> ${fromUser}</p>
  <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Karviyam Admin" <${fromUser}>`,
    to: toEmail,
    replyTo: VERIFIED_SENDER_EMAIL,
    envelope: { from: VERIFIED_SENDER_EMAIL, to: toEmail },
    subject: '✅ KARVIYAM SMTP Email Connection Test Successful',
    html,
    attachments
  };

  const transporters = await getTransporters();
  let lastErr = null;
  for (const transporter of transporters) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err) {
      lastErr = err;
    }
  }

  const cleanErr = lastErr ? (
    lastErr.message.includes('ENOENT') || lastErr.message.includes('sendmail')
      ? 'SMTP connection failed. Please verify SMTP_USER and SMTP_PASS in backend/.env for vanakkam@karviyam.com'
      : lastErr.message
  ) : 'SMTP connection failed. Please configure SMTP_USER and SMTP_PASS in backend/.env';

  throw new Error(cleanErr);
};

const sendLoginOTPEmail = async ({ toEmail, otp }) => {
  const fromUser = VERIFIED_SENDER_EMAIL;
  const { logoHeaderHtml, attachments } = await getEmailLogoHeader();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A; }
    .card { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; border: 1px solid #E2E8F0; padding: 32px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .otp-box { background: #FEF2F2; border: 2px dashed #EF4444; border-radius: 16px; padding: 18px; font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #B71C1C; margin: 20px 0; font-family: monospace; }
    .badge { display: inline-block; padding: 6px 14px; background: #FEF3D6; color: #9A5B00; font-size: 11px; font-weight: 800; text-transform: uppercase; border-radius: 999px; letter-spacing: 1px; }
    .footer { font-size: 12px; color: #64748B; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    ${logoHeaderHtml || '<h2 style="color:#B71C1C;margin:0 0 16px;">🌸 KARVIYAM</h2>'}
    <span class="badge">SECURITY VERIFICATION</span>
    <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 16px; margin-bottom: 8px;">Karviyam Login OTP</h2>
    <p style="font-size: 14px; color: #334155; margin: 16px 0 8px;">Your Karviyam login OTP is: <strong style="color: #B71C1C; font-size: 18px;">${otp}</strong></p>
    
    <div class="otp-box">${otp}</div>
    
    <p style="font-size: 13px; color: #475569; margin: 8px 0; font-weight: 600;">OTP expires in 5 minutes.</p>
    <p style="font-size: 12px; color: #94A3B8; margin-top: 10px;">Do not share this OTP with anyone.</p>
    
    <div class="footer">
      &copy; ${new Date().getFullYear()} Karviyam. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Karviyam Security" <${fromUser}>`,
    to: toEmail,
    replyTo: VERIFIED_SENDER_EMAIL,
    envelope: { from: VERIFIED_SENDER_EMAIL, to: toEmail },
    subject: "Karviyam Login OTP",
    html,
    attachments
  };

  const transporters = await getTransporters();
  let lastErr = null;
  for (const transporter of transporters) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err) {
      console.warn(`[OTP Email Warning] Transporter failed:`, err.message);
      lastErr = err;
    }
  }
  throw new Error(lastErr?.message || 'Unable to send OTP. Please try again.');
};

const sendAdminOTPEmail = sendLoginOTPEmail;

module.exports = {
  getSmtpConfig,
  getTransporters,
  verifySmtpConnection,
  getEmailLogoHeader,
  sendContactEmail,
  sendAdminReplyEmail,
  sendSubscriptionSuccessEmail,
  sendCampaignEmail,
  sendTestEmail,
  sendAdminOTPEmail,
  sendLoginOTPEmail
};



