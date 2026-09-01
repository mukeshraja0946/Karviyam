const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendCampaignEmail, sendTestEmail } = require('../utils/emailService');

// Ensure Database Tables Exist for Email Marketing Campaigns
const ensureCampaignTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        coupon_code VARCHAR(50),
        recipient_type VARCHAR(50) DEFAULT 'ACTIVE_SUBSCRIBERS',
        recipient_count INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'SENT',
        sent_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[Database Migration Error - Email Campaigns Table]:', e.message);
  }
};

// 1. Get Campaign History & Email Statistics
exports.getCampaigns = async (req, res, next) => {
  try {
    await ensureCampaignTables();

    const [campaigns] = await pool.query(
      'SELECT * FROM email_campaigns ORDER BY created_at DESC'
    );

    const [activeSubCountRows] = await pool.query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE' AND payment_status = 'SUCCESS'"
    );
    const activeSubscribersCount = activeSubCountRows[0]?.count || 0;

    const [totalSubCountRows] = await pool.query(
      "SELECT COUNT(*) as count FROM subscriptions"
    );
    const totalSubscribersCount = totalSubCountRows[0]?.count || 0;

    return res.status(200).json(ApiResponse.success({
      campaigns,
      stats: {
        activeSubscribers: Number(activeSubscribersCount),
        totalSubscribers: Number(totalSubscribersCount),
        totalCampaignsSent: campaigns.length
      }
    }, 'Email campaigns fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// 2. Dispatch Email Campaign
exports.sendCampaign = async (req, res, next) => {
  try {
    await ensureCampaignTables();
    const { subject, content, recipientType = 'ACTIVE_SUBSCRIBERS', targetEmail, couponCode } = req.body;

    if (!subject || !String(subject).trim()) {
      return res.status(400).json(ApiResponse.error('Email campaign subject is required.'));
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json(ApiResponse.error('Email campaign content is required.'));
    }

    let recipientEmails = [];

    if (recipientType === 'INDIVIDUAL') {
      if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail.trim())) {
        return res.status(400).json(ApiResponse.error('Please specify a valid recipient email address.'));
      }
      recipientEmails = [targetEmail.trim()];
    } else if (recipientType === 'ALL_SUBSCRIBERS') {
      const [rows] = await pool.query('SELECT DISTINCT email FROM subscriptions');
      recipientEmails = rows.map(r => r.email);
    } else {
      // Default: ACTIVE_SUBSCRIBERS
      const [rows] = await pool.query(
        "SELECT DISTINCT email FROM subscriptions WHERE status = 'ACTIVE' AND payment_status = 'SUCCESS'"
      );
      recipientEmails = rows.map(r => r.email);
    }

    if (recipientEmails.length === 0) {
      return res.status(400).json(ApiResponse.error('No recipients found for the selected campaign audience.'));
    }

    // Save Campaign to Database
    const [result] = await pool.query(
      `INSERT INTO email_campaigns (subject, content, coupon_code, recipient_type, recipient_count, status, sent_at)
       VALUES (?, ?, ?, ?, ?, 'SENT', NOW())`,
      [subject.trim(), content.trim(), couponCode ? couponCode.trim() : null, recipientType, recipientEmails.length]
    );

    // Asynchronously dispatch emails to all recipients
    const dispatchPromises = recipientEmails.map(email =>
      sendCampaignEmail({
        toEmail: email,
        subject: subject.trim(),
        content: content.trim(),
        couponCode: couponCode ? couponCode.trim() : null
      }).catch(e => console.error(`[Campaign Dispatch Error to ${email}]:`, e.message))
    );

    Promise.allSettled(dispatchPromises);

    return res.status(200).json(ApiResponse.success({
      campaignId: result.insertId,
      recipientCount: recipientEmails.length,
      status: 'SENT'
    }, `Email campaign dispatched successfully to ${recipientEmails.length} recipient(s)!`));
  } catch (err) {
    next(err);
  }
};

// 3. Send Test Email
exports.sendTestMail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json(ApiResponse.error('Please enter a valid test recipient email address.'));
    }

    await sendTestEmail(email.trim());

    return res.status(200).json(ApiResponse.success(null, `Test email dispatched to ${email.trim()} successfully!`));
  } catch (err) {
    next(err);
  }
};
