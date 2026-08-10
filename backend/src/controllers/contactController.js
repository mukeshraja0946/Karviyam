const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendContactEmail } = require('../utils/emailService');

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase().trim());
};

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json(ApiResponse.error('Full name is required.'));
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json(ApiResponse.error('A valid email address is required.'));
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json(ApiResponse.error('Message content is required.'));
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim();
    const cleanSubject = String(subject || 'Customer Contact Message').trim();
    const cleanMessage = String(message).trim();

    // 1. Send Email via SMTP Transporter to vanakkam@karviyam.com
    const emailSent = await sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      source: 'Customer Contact'
    });

    // 2. Save Message to MySQL Database
    let insertedId = null;
    try {
      const [result] = await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [cleanName, cleanEmail, cleanSubject, cleanMessage]
      );
      insertedId = result.insertId;
    } catch (dbErr) {
      console.error('[Database Warning] Could not save contact message:', dbErr.message);
    }

    return res.status(200).json(ApiResponse.success(
      { id: insertedId, name: cleanName, email: cleanEmail, subject: cleanSubject, message: cleanMessage, emailSent },
      'Thank you for reaching out! Your message has been sent to vanakkam@karviyam.com.'
    ));
  } catch (err) {
    next(err);
  }
};

exports.submitAdminHelp = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    const adminName = (name || req.user?.fullName || req.user?.name || 'Administrator').trim();
    const adminEmail = (email || req.user?.email || 'vanakkam@karviyam.com').trim();
    const helpSubject = (subject || 'Admin Support Request').trim();
    const helpMessage = String(message || '').trim();

    if (!helpMessage) {
      return res.status(400).json(ApiResponse.error('Help message content is required.'));
    }

    const emailSent = await sendContactEmail({
      name: adminName,
      email: adminEmail,
      subject: helpSubject,
      message: helpMessage,
      source: 'Admin Help'
    });

    try {
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [adminName, adminEmail, helpSubject, helpMessage]
      );
    } catch (e) {}

    return res.status(200).json(ApiResponse.success(
      { emailSent },
      'Admin help request has been sent to vanakkam@karviyam.com.'
    ));
  } catch (err) {
    next(err);
  }
};

exports.getContactMessages = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
    const messages = rows.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      isRead: Boolean(m.is_read),
      createdAt: m.created_at
    }));
    return res.status(200).json(ApiResponse.success(messages, 'Contact messages retrieved successfully'));
  } catch (err) {
    next(err);
  }
};
