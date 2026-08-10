const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendContactEmail } = require('../utils/emailService');

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json(ApiResponse.error('Name, email, and message are required'));
    }

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [name, email, subject || null, message]
    );

    // Send email asynchronously to vanakkam@karviyam.com
    sendContactEmail({ name, email, subject, message }).catch(err => {
      console.error('[Contact Email Warning]:', err.message);
    });

    const [rows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [result.insertId]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Thank you for reaching out! Your message has been sent to vanakkam@karviyam.com.'));
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
