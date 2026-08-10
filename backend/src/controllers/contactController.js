const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendContactEmail } = require('../utils/emailService');

const ensureContactMessagesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      await pool.query(`ALTER TABLE contact_messages ADD COLUMN status VARCHAR(20) DEFAULT 'new'`);
    } catch (e) {}
  } catch (e) {
    console.error('[Database Error] Could not ensure contact_messages table:', e.message);
  }
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase().trim());
};

exports.submitContact = async (req, res, next) => {
  try {
    await ensureContactMessagesTable();
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

    // 1. Save Message to MySQL Database FIRST
    let insertedId = null;
    try {
      const [result] = await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status, is_read, created_at)
         VALUES (?, ?, ?, ?, 'new', 0, NOW())`,
        [cleanName, cleanEmail, cleanSubject, cleanMessage]
      );
      insertedId = result.insertId;
    } catch (dbErr) {
      console.error('[Database Error] Failed to insert contact message:', dbErr.message);
    }

    // 2. Send Email via SMTP Transporter to vanakkam@karviyam.com
    const emailSent = await sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      source: 'Customer Contact'
    });

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
    await ensureContactMessagesTable();
    const { name, email, subject, message } = req.body || {};

    const adminName = (name || req.user?.fullName || req.user?.name || 'Administrator').trim();
    const adminEmail = (email || req.user?.email || 'vanakkam@karviyam.com').trim();
    const helpSubject = (subject || 'Admin Support Request').trim();
    const helpMessage = String(message || '').trim();

    if (!helpMessage) {
      return res.status(400).json(ApiResponse.error('Help message content is required.'));
    }

    try {
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status, is_read, created_at)
         VALUES (?, ?, ?, ?, 'new', 0, NOW())`,
        [adminName, adminEmail, helpSubject, helpMessage]
      );
    } catch (e) {}

    const emailSent = await sendContactEmail({
      name: adminName,
      email: adminEmail,
      subject: helpSubject,
      message: helpMessage,
      source: 'Admin Help'
    });

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
    await ensureContactMessagesTable();
    const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
    const messages = rows.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone || '',
      subject: m.subject || 'General Inquiry',
      message: m.message,
      status: m.status || (m.is_read ? 'read' : 'new'),
      isRead: Boolean(m.is_read || m.status === 'read' || m.status === 'resolved'),
      createdAt: m.created_at
    }));
    return res.status(200).json(ApiResponse.success(messages, 'Contact messages retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateMessageStatus = async (req, res, next) => {
  try {
    await ensureContactMessagesTable();
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json(ApiResponse.error('Status is required'));
    }

    const isRead = status === 'read' || status === 'resolved' ? 1 : 0;
    await pool.query(
      'UPDATE contact_messages SET status = ?, is_read = ? WHERE id = ?',
      [status, isRead, id]
    );

    const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Message not found'));
    }

    const m = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      status: m.status || status,
      isRead: Boolean(m.is_read),
      createdAt: m.created_at
    }, 'Message status updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    await ensureContactMessagesTable();
    const { id } = req.params;
    await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Contact message deleted successfully'));
  } catch (err) {
    next(err);
  }
};
