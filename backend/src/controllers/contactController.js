const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { sendContactEmail, sendAdminReplyEmail } = require('../utils/emailService');

const ensureSupportTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_conversations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        subject VARCHAR(255) DEFAULT 'General Support Inquiry',
        status VARCHAR(20) DEFAULT 'NEW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        sender_email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'NEW',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {
    console.error('[Database Error] Could not ensure support tables:', e.message);
  }
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase().trim());
};

exports.submitContact = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { name, email, subject, message } = req.body || {};

    console.log(`\n---------------- CUSTOMER SUPPORT SUBMISSION ----------------`);
    console.log(`[Input]: Name=${name}, Email=${email}, Subject=${subject}`);

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
    const cleanSubject = String(subject || 'Customer Support Inquiry').trim();
    const cleanMessage = String(message).trim();

    // 1. Create support conversation record
    let conversationId = null;
    let messageId = null;
    try {
      const [convRes] = await pool.query(
        `INSERT INTO support_conversations (customer_name, customer_email, subject, status, created_at, updated_at)
         VALUES (?, ?, ?, 'NEW', NOW(), NOW())`,
        [cleanName, cleanEmail, cleanSubject]
      );
      conversationId = convRes.insertId;

      const [msgRes] = await pool.query(
        `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
         VALUES (?, 'customer', ?, ?, NOW())`,
        [conversationId, cleanEmail, cleanMessage]
      );
      messageId = msgRes.insertId;

      // Sync legacy contact_messages table
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status, is_read, created_at)
         VALUES (?, ?, ?, ?, 'NEW', 0, NOW())`,
        [cleanName, cleanEmail, cleanSubject, cleanMessage]
      ).catch(() => null);

      console.log(`✅ [Database Success] Conversation #${conversationId} created! Customer email: ${cleanEmail}`);
    } catch (dbErr) {
      console.error('❌ [Database Error] Failed to insert support message:', dbErr.message);
      return res.status(500).json(ApiResponse.error(`Database error: Could not save message (${dbErr.message})`));
    }

    // 2. Send Email notification to vanakkam@karviyam.com
    const emailSent = await sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      source: 'Customer Support'
    });

    console.log(`-------------------------------------------------------------\n`);

    return res.status(200).json(ApiResponse.success(
      {
        conversationId,
        messageId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'NEW',
        emailSent
      },
      'Thank you for reaching out! Your support request has been registered.'
    ));
  } catch (err) {
    next(err);
  }
};

exports.submitAdminHelp = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { name, email, subject, message } = req.body || {};

    const adminName = (name || req.user?.fullName || req.user?.name || 'Administrator').trim();
    const adminEmail = (email || req.user?.email || 'vanakkam@karviyam.com').trim();
    const helpSubject = (subject || 'Admin Support Request').trim();
    const helpMessage = String(message || '').trim();

    if (!helpMessage) {
      return res.status(400).json(ApiResponse.error('Help message content is required.'));
    }

    try {
      const [convRes] = await pool.query(
        `INSERT INTO support_conversations (customer_name, customer_email, subject, status, created_at, updated_at)
         VALUES (?, ?, ?, 'NEW', NOW(), NOW())`,
        [adminName, adminEmail, helpSubject]
      );
      const convId = convRes.insertId;

      await pool.query(
        `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
         VALUES (?, 'admin', ?, ?, NOW())`,
        [convId, adminEmail, helpMessage]
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
    await ensureSupportTables();

    // Query conversations with latest message & msg count
    const [convRows] = await pool.query(`
      SELECT 
        c.id,
        c.customer_name AS name,
        c.customer_email AS email,
        c.subject,
        c.status,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        (SELECT message FROM support_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS latest_message,
        (SELECT COUNT(*) FROM support_messages WHERE conversation_id = c.id) AS message_count
      FROM support_conversations c
      ORDER BY c.id DESC
    `);

    let resultList = convRows.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: '',
      subject: c.subject || 'General Support Inquiry',
      message: c.latest_message || '',
      status: (c.status || 'NEW').toUpperCase(),
      messageCount: c.message_count || 1,
      isRead: c.status === 'IN REVIEW' || c.status === 'RESOLVED',
      createdAt: c.createdAt
    }));

    // If support_conversations is empty, fallback/bridge with contact_messages
    if (resultList.length === 0) {
      const [legacyRows] = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
      resultList = legacyRows.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone || '',
        subject: m.subject || 'General Inquiry',
        message: m.message,
        status: (m.status || (m.is_read ? 'IN REVIEW' : 'NEW')).toUpperCase(),
        messageCount: 1,
        isRead: Boolean(m.is_read || m.status === 'read' || m.status === 'resolved'),
        createdAt: m.created_at
      }));
    }

    return res.status(200).json(ApiResponse.success(resultList, 'Contact support conversations retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getConversationById = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;

    const [convRows] = await pool.query('SELECT * FROM support_conversations WHERE id = ?', [id]);
    if (convRows.length === 0) {
      // Fallback: check contact_messages
      const [legacyRows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
      if (legacyRows.length === 0) {
        return res.status(404).json(ApiResponse.error('Support conversation not found'));
      }
      const legacy = legacyRows[0];
      return res.status(200).json(ApiResponse.success({
        id: legacy.id,
        customerName: legacy.name,
        customerEmail: legacy.email,
        subject: legacy.subject || 'General Inquiry',
        status: (legacy.status || 'NEW').toUpperCase(),
        createdAt: legacy.created_at,
        messages: [{
          id: legacy.id,
          conversationId: legacy.id,
          senderType: 'customer',
          senderEmail: legacy.email,
          message: legacy.message,
          createdAt: legacy.created_at
        }]
      }, 'Conversation retrieved'));
    }

    const conv = convRows[0];

    // Automatically transition NEW -> IN REVIEW when admin opens conversation
    if (conv.status === 'NEW') {
      await pool.query('UPDATE support_conversations SET status = "IN REVIEW" WHERE id = ?', [id]);
      conv.status = 'IN REVIEW';
    }

    const [msgRows] = await pool.query('SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY id ASC', [id]);

    const formattedMessages = msgRows.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderEmail: m.sender_email,
      message: m.message,
      createdAt: m.created_at
    }));

    return res.status(200).json(ApiResponse.success({
      id: conv.id,
      customerName: conv.customer_name,
      customerEmail: conv.customer_email,
      subject: conv.subject,
      status: (conv.status || 'NEW').toUpperCase(),
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messages: formattedMessages
    }, 'Conversation thread retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.replyToConversation = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;
    const { message, reply, status } = req.body || {};

    const cleanReplyMessage = String(message || reply || '').trim();
    if (!cleanReplyMessage) {
      return res.status(400).json(ApiResponse.error('Reply message cannot be empty.'));
    }

    // 1. Fetch conversation details to get dynamic customer email
    let [convRows] = await pool.query('SELECT * FROM support_conversations WHERE id = ?', [id]);
    let conv = null;

    if (convRows.length === 0) {
      // Migrate/Import from legacy contact_messages if needed
      const [legacyRows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
      if (legacyRows.length === 0) {
        return res.status(404).json(ApiResponse.error('Conversation thread not found.'));
      }
      const leg = legacyRows[0];
      const [newConv] = await pool.query(
        `INSERT INTO support_conversations (id, customer_name, customer_email, subject, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'IN REVIEW', ?, NOW())`,
        [leg.id, leg.name, leg.email, leg.subject || 'General Inquiry', leg.created_at]
      );

      await pool.query(
        `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
         VALUES (?, 'customer', ?, ?, ?)`,
        [leg.id, leg.email, leg.message, leg.created_at]
      );

      conv = {
        id: leg.id,
        customer_name: leg.name,
        customer_email: leg.email,
        subject: leg.subject || 'General Inquiry',
        status: 'IN REVIEW'
      };
    } else {
      conv = convRows[0];
    }

    const customerEmail = conv.customer_email;
    const customerName = conv.customer_name;
    const subject = conv.subject;
    const newStatus = status ? status.toUpperCase() : 'IN REVIEW';

    // 2. Insert Admin Reply into support_messages
    const adminEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';
    const [replyRes] = await pool.query(
      `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
       VALUES (?, 'admin', ?, ?, NOW())`,
      [conv.id, adminEmail, cleanReplyMessage]
    );

    // 3. Update Conversation Status & UpdatedAt timestamp
    await pool.query(
      'UPDATE support_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, conv.id]
    );

    // Sync legacy table status
    await pool.query(
      'UPDATE contact_messages SET status = ?, is_read = 1 WHERE id = ?',
      [newStatus.toLowerCase(), conv.id]
    ).catch(() => null);

    // 4. Get latest thread customer message for context
    const [custMsgs] = await pool.query(
      `SELECT message FROM support_messages WHERE conversation_id = ? AND sender_type = 'customer' ORDER BY id DESC LIMIT 1`,
      [conv.id]
    );
    const originalMessage = custMsgs.length > 0 ? custMsgs[0].message : '';

    // 5. Send Reply Email via SMTP from vanakkam@karviyam.com -> customerEmail
    const emailSent = await sendAdminReplyEmail({
      toEmail: customerEmail,
      customerName,
      subject,
      replyMessage: cleanReplyMessage,
      originalMessage
    });

    // 6. Return updated thread information
    const [allMessages] = await pool.query(
      'SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY id ASC',
      [conv.id]
    );

    const formattedMessages = allMessages.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderEmail: m.sender_email,
      message: m.message,
      createdAt: m.created_at
    }));

    return res.status(200).json(ApiResponse.success({
      id: conv.id,
      customerName,
      customerEmail,
      subject,
      status: newStatus,
      emailSent,
      replyId: replyRes.insertId,
      messages: formattedMessages
    }, emailSent ? 'Reply sent successfully to customer!' : 'Reply saved in database. (Note: Email dispatch issue logged)'));

  } catch (err) {
    next(err);
  }
};

exports.updateMessageStatus = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json(ApiResponse.error('Status is required'));
    }

    const cleanStatus = String(status).toUpperCase();
    await pool.query(
      'UPDATE support_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
      [cleanStatus, id]
    );

    await pool.query(
      'UPDATE contact_messages SET status = ?, is_read = ? WHERE id = ?',
      [cleanStatus.toLowerCase(), cleanStatus === 'RESOLVED' || cleanStatus === 'IN REVIEW' ? 1 : 0, id]
    ).catch(() => null);

    const [rows] = await pool.query('SELECT * FROM support_conversations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Conversation not found'));
    }

    const c = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: c.id,
      customerName: c.customer_name,
      customerEmail: c.customer_email,
      subject: c.subject,
      status: c.status
    }, 'Status updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;
    await pool.query('DELETE FROM support_conversations WHERE id = ?', [id]);
    await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]).catch(() => null);
    return res.status(200).json(ApiResponse.success(null, 'Support conversation deleted successfully'));
  } catch (err) {
    next(err);
  }
};
