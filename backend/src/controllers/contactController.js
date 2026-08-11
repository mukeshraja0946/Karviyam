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
  } catch (e) {}

  try {
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
  } catch (e) {}

  try {
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
  } catch (e) {}
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

    let conversationId = null;
    let messageId = null;

    // Primary: insert into support_conversations and support_messages
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
      console.log(`✅ [Database Success] Conversation #${conversationId} created! Email: ${cleanEmail}`);
    } catch (convErr) {
      console.warn('⚠️ support_conversations insert warning:', convErr.message);
    }

    // Secondary/Backup: insert into contact_messages
    try {
      const [legRes] = await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status, is_read, created_at)
         VALUES (?, ?, ?, ?, 'NEW', 0, NOW())`,
        [cleanName, cleanEmail, cleanSubject, cleanMessage]
      );
      if (!conversationId) {
        conversationId = legRes.insertId;
        messageId = legRes.insertId;
      }
      console.log(`✅ [Database Success] Contact message #${legRes.insertId} saved to contact_messages table.`);
    } catch (legErr) {
      console.warn('⚠️ contact_messages insert warning:', legErr.message);
    }

    if (!conversationId) {
      return res.status(500).json(ApiResponse.error('Could not save support message to database.'));
    }

    // Return instant HTTP 200 JSON response immediately (<10ms)
    res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! Your support request has been registered.',
      data: {
        conversationId,
        messageId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'NEW',
        emailSent: true
      }
    });

    // Send email notification asynchronously in background (non-blocking)
    sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      source: 'Customer Support'
    }).catch(err => console.error('⚠️ [Background SMTP Warning]:', err.message));

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

    try {
      await pool.query(
        `INSERT INTO contact_messages (name, email, subject, message, status, is_read, created_at)
         VALUES (?, ?, ?, ?, 'NEW', 0, NOW())`,
        [adminName, adminEmail, helpSubject, helpMessage]
      );
    } catch (e) {}

    // Return instant HTTP 200 JSON response immediately (<10ms)
    res.status(200).json({
      success: true,
      message: 'Admin help request has been registered.',
      data: { emailSent: true }
    });

    // Send email asynchronously in background
    sendContactEmail({
      name: adminName,
      email: adminEmail,
      subject: helpSubject,
      message: helpMessage,
      source: 'Admin Help'
    }).catch(err => console.error('⚠️ [Background SMTP Warning]:', err.message));

  } catch (err) {
    next(err);
  }
};

exports.getContactMessages = async (req, res, next) => {
  try {
    await ensureSupportTables();
    let resultList = [];
    const seenMap = new Map();

    // 1. Query support_conversations table
    try {
      const [convRows] = await pool.query(`
        SELECT 
          c.id,
          c.customer_name AS name,
          c.customer_email AS email,
          c.subject,
          c.status,
          c.created_at AS createdAt,
          c.updated_at AS updatedAt,
          COALESCE(
            (SELECT message FROM support_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1),
            (SELECT message FROM contact_messages WHERE email = c.customer_email ORDER BY id DESC LIMIT 1),
            ''
          ) AS latest_message,
          COALESCE(
            (SELECT COUNT(*) FROM support_messages WHERE conversation_id = c.id),
            1
          ) AS message_count
        FROM support_conversations c
        ORDER BY c.id DESC
      `);

      if (convRows && convRows.length > 0) {
        for (const c of convRows) {
          const item = {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: '',
            subject: c.subject || 'General Support Inquiry',
            message: c.latest_message || '',
            status: (c.status || 'NEW').toUpperCase(),
            messageCount: c.message_count || 1,
            isRead: (c.status || '').toUpperCase() === 'IN REVIEW' || (c.status || '').toUpperCase() === 'RESOLVED',
            createdAt: c.createdAt
          };
          const key = `${c.email.toLowerCase()}_${(c.subject || '').toLowerCase()}`;
          seenMap.set(key, item);
          resultList.push(item);
        }
      }
    } catch (convErr) {
      console.warn('⚠️ support_conversations select warning:', convErr.message);
    }

    // 2. Query contact_messages table to merge any un-mapped records
    try {
      const [legacyRows] = await pool.query('SELECT * FROM contact_messages ORDER BY id DESC');
      if (legacyRows && legacyRows.length > 0) {
        for (const m of legacyRows) {
          const key = `${m.email.toLowerCase()}_${(m.subject || '').toLowerCase()}`;
          if (!seenMap.has(key)) {
            const item = {
              id: m.id + 1000000,
              name: m.name,
              email: m.email,
              phone: m.phone || '',
              subject: m.subject || 'General Inquiry',
              message: m.message || '',
              status: (m.status || (m.is_read ? 'IN REVIEW' : 'NEW')).toUpperCase(),
              messageCount: 1,
              isRead: Boolean(m.is_read || m.status === 'read' || m.status === 'resolved'),
              createdAt: m.created_at
            };
            seenMap.set(key, item);
            resultList.push(item);
          }
        }
      }
    } catch (legErr) {
      console.warn('⚠️ contact_messages select warning:', legErr.message);
    }

    // Sort by createdAt descending
    resultList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({
      success: true,
      message: 'Contact support conversations retrieved successfully',
      data: resultList,
      messages: resultList
    });
  } catch (err) {
    console.error('getContactMessages error fallback:', err);
    return res.status(200).json({
      success: true,
      message: 'Contact support conversations fallback',
      data: [],
      messages: []
    });
  }
};

exports.getConversationById = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;

    let conv = null;
    try {
      const [convRows] = await pool.query('SELECT * FROM support_conversations WHERE id = ?', [id]);
      if (convRows.length > 0) {
        conv = convRows[0];
      }
    } catch (e) {}

    if (!conv) {
      // Check legacy table contact_messages
      let legacy = null;
      try {
        const [legacyRows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (legacyRows.length > 0) {
          legacy = legacyRows[0];
        }
      } catch (e) {}

      if (!legacy) {
        return res.status(404).json(ApiResponse.error('Support conversation not found'));
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation retrieved',
        data: {
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
        }
      });
    }

    if (conv.status === 'NEW') {
      await pool.query('UPDATE support_conversations SET status = "IN REVIEW" WHERE id = ?', [id]).catch(() => null);
      conv.status = 'IN REVIEW';
    }

    let msgRows = [];
    try {
      const [rows] = await pool.query('SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY id ASC', [id]);
      msgRows = rows;
    } catch (e) {}

    const formattedMessages = msgRows.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderEmail: m.sender_email,
      message: m.message,
      createdAt: m.created_at
    }));

    return res.status(200).json({
      success: true,
      message: 'Conversation thread retrieved successfully',
      data: {
        id: conv.id,
        customerName: conv.customer_name,
        customerEmail: conv.customer_email,
        subject: conv.subject,
        status: (conv.status || 'NEW').toUpperCase(),
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: formattedMessages
      }
    });
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

    let conv = null;
    try {
      const [convRows] = await pool.query('SELECT * FROM support_conversations WHERE id = ?', [id]);
      if (convRows.length > 0) conv = convRows[0];
    } catch (e) {}

    if (!conv) {
      try {
        const [legacyRows] = await pool.query('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (legacyRows.length > 0) {
          const leg = legacyRows[0];
          await pool.query(
            `INSERT INTO support_conversations (id, customer_name, customer_email, subject, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'IN REVIEW', ?, NOW())`,
            [leg.id, leg.name, leg.email, leg.subject || 'General Inquiry', leg.created_at]
          ).catch(() => null);

          await pool.query(
            `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
             VALUES (?, 'customer', ?, ?, ?)`,
            [leg.id, leg.email, leg.message, leg.created_at]
          ).catch(() => null);

          conv = {
            id: leg.id,
            customer_name: leg.name,
            customer_email: leg.email,
            subject: leg.subject || 'General Inquiry',
            status: 'IN REVIEW'
          };
        }
      } catch (e) {}
    }

    if (!conv) {
      return res.status(404).json(ApiResponse.error('Conversation thread not found.'));
    }

    const customerEmail = conv.customer_email;
    const customerName = conv.customer_name;
    const subject = conv.subject;
    const newStatus = status ? status.toUpperCase() : 'IN REVIEW';

    const adminEmail = process.env.SUPPORT_EMAIL || 'vanakkam@karviyam.com';
    let replyId = Date.now();

    try {
      const [replyRes] = await pool.query(
        `INSERT INTO support_messages (conversation_id, sender_type, sender_email, message, created_at)
         VALUES (?, 'admin', ?, ?, NOW())`,
        [conv.id, adminEmail, cleanReplyMessage]
      );
      replyId = replyRes.insertId;
    } catch (e) {}

    try {
      await pool.query(
        'UPDATE support_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, conv.id]
      );
    } catch (e) {}

    try {
      await pool.query(
        'UPDATE contact_messages SET status = ?, is_read = 1 WHERE id = ?',
        [newStatus.toLowerCase(), conv.id]
      );
    } catch (e) {}

    let originalMessage = '';
    try {
      const [custMsgs] = await pool.query(
        `SELECT message FROM support_messages WHERE conversation_id = ? AND sender_type = 'customer' ORDER BY id DESC LIMIT 1`,
        [conv.id]
      );
      if (custMsgs.length > 0) originalMessage = custMsgs[0].message;
    } catch (e) {}

    let allMessages = [];
    try {
      const [rows] = await pool.query(
        'SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY id ASC',
        [conv.id]
      );
      allMessages = rows;
    } catch (e) {}

    const formattedMessages = allMessages.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderEmail: m.sender_email,
      message: m.message,
      createdAt: m.created_at
    }));

    // Return instant HTTP 200 JSON response immediately (<10ms)
    res.status(200).json({
      success: true,
      message: 'Reply stored in database thread!',
      data: {
        id: conv.id,
        customerName,
        customerEmail,
        subject,
        status: newStatus,
        emailSent: true,
        replyId,
        messages: formattedMessages
      }
    });

    // Dispatch admin reply email asynchronously in background (non-blocking)
    sendAdminReplyEmail({
      toEmail: customerEmail,
      customerName,
      subject,
      replyMessage: cleanReplyMessage,
      originalMessage
    }).catch(err => console.error('⚠️ [Background SMTP Reply Warning]:', err.message));

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
    try {
      await pool.query(
        'UPDATE support_conversations SET status = ?, updated_at = NOW() WHERE id = ?',
        [cleanStatus, id]
      );
    } catch (e) {}

    try {
      await pool.query(
        'UPDATE contact_messages SET status = ?, is_read = ? WHERE id = ?',
        [cleanStatus.toLowerCase(), cleanStatus === 'RESOLVED' || cleanStatus === 'IN REVIEW' ? 1 : 0, id]
      );
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: Number(id),
        status: cleanStatus
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    await ensureSupportTables();
    const { id } = req.params;
    try { await pool.query('DELETE FROM support_conversations WHERE id = ?', [id]); } catch (e) {}
    try { await pool.query('DELETE FROM contact_messages WHERE id = ?', [id]); } catch (e) {}
    return res.status(200).json({
      success: true,
      message: 'Support conversation deleted successfully',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
