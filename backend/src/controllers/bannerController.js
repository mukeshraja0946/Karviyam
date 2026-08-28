const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

const mapBannerRow = (b) => {
  if (!b) return null;
  const isAct = b.status 
    ? String(b.status).toLowerCase() === 'active' 
    : (b.is_active !== undefined && b.is_active !== null ? Boolean(b.is_active) : true);
  const statusStr = isAct ? 'active' : 'inactive';
  const imgUrl = b.image_url || b.image_path || b.image || '';
  const desktopImg = b.desktop_image_url || b.desktop_image || imgUrl;
  const mobileImg = b.mobile_image_url || b.mobile_image || imgUrl;

  return {
    id: b.id,
    title: b.title || '',
    subtitle: b.subtitle || '',
    imageUrl: imgUrl,
    imagePath: imgUrl,
    image: imgUrl,
    desktopImageUrl: desktopImg,
    mobileImageUrl: mobileImg,
    buttonText: b.button_text || 'Shop Now',
    buttonLink: b.button_link || b.link || '/shop',
    link: b.button_link || b.link || '/shop',
    isActive: isAct,
    status: statusStr,
    sortOrder: b.sort_order || b.display_order || 0,
    displayOrder: b.display_order || b.sort_order || 0
  };
};

const ensureTableExists = async () => {
  try {
    // 1. Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS home_banners (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        image_url LONGTEXT,
        image_path LONGTEXT,
        image LONGTEXT,
        desktop_image_url LONGTEXT,
        mobile_image_url LONGTEXT,
        button_text VARCHAR(100),
        button_link VARCHAR(255),
        link VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'active',
        sort_order INT DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Safe migrations for existing tables missing specific columns
    try { await pool.query("ALTER TABLE home_banners MODIFY id BIGINT AUTO_INCREMENT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN image_path LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN image LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN desktop_image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN mobile_image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN title VARCHAR(255)"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN subtitle VARCHAR(255)"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN button_text VARCHAR(100)"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN button_link VARCHAR(255)"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN link VARCHAR(255)"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN status VARCHAR(50) DEFAULT 'active'"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN is_active BOOLEAN DEFAULT TRUE"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN sort_order INT DEFAULT 0"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners ADD COLUMN display_order INT DEFAULT 0"); } catch (e) {}

    // 3. Ensure image columns are LONGTEXT (to allow base64 or long paths)
    try { await pool.query("ALTER TABLE home_banners MODIFY COLUMN image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners MODIFY COLUMN image_path LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners MODIFY COLUMN image LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners MODIFY COLUMN desktop_image_url LONGTEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE home_banners MODIFY COLUMN mobile_image_url LONGTEXT"); } catch (e) {}
  } catch (err) {
    console.error('[Banner DB Table Ensure Error]:', err.message);
  }
};

const saveBase64ImageToDisk = (imageStr, prefix = 'banner') => {
  if (typeof imageStr === 'string' && imageStr.startsWith('data:image/')) {
    try {
      const matches = imageStr.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
        
        const possibleDirs = [
          path.join(__dirname, '../../uploads'),
          path.join(__dirname, '../uploads'),
          path.join(process.cwd(), 'uploads'),
          path.join(process.cwd(), 'backend/uploads')
        ];
        
        for (const uDir of possibleDirs) {
          try {
            if (!fs.existsSync(uDir)) {
              fs.mkdirSync(uDir, { recursive: true });
            }
            const filePath = path.join(uDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            return `/uploads/${fileName}`;
          } catch (eWrite) {}
        }
      }
    } catch (e) {
      console.error('[Banner Save] Error writing base64 image file:', e);
    }
  }
  return imageStr;
};

exports.getActiveBanners = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    await ensureTableExists();
    let rows = [];
    try {
      const [r] = await pool.query(
        "SELECT * FROM home_banners WHERE (status = 'active' OR is_active = 1) AND status != 'inactive' AND is_active != 0 ORDER BY display_order ASC, sort_order ASC, id DESC"
      );
      rows = r;
    } catch (e) {
      const [r] = await pool.query('SELECT * FROM home_banners WHERE status = "active" ORDER BY id DESC');
      rows = r;
    }
    const banners = rows.map(mapBannerRow).filter(b => b && b.isActive && b.status === 'active');

    let autoScroll = true;
    let speed = 5000;
    try {
      const [sRows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('banner_autoscroll', 'banner_speed')");
      sRows.forEach(s => {
        if (s.setting_key === 'banner_autoscroll') autoScroll = s.setting_value !== 'false' && s.setting_value !== '0';
        if (s.setting_key === 'banner_speed') speed = parseInt(s.setting_value, 10) || 5000;
      });
    } catch (eSettings) {}

    const payload = {
      banners,
      autoScroll,
      speed
    };

    return res.status(200).json(ApiResponse.success(payload, 'Active banners retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getAllBanners = async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    await ensureTableExists();
    let rows = [];
    try {
      const [r] = await pool.query('SELECT * FROM home_banners ORDER BY display_order ASC, sort_order ASC, id DESC');
      rows = r;
    } catch (e) {
      const [r] = await pool.query('SELECT * FROM home_banners ORDER BY id DESC');
      rows = r;
    }
    const banners = rows.map(mapBannerRow).filter(Boolean);

    let autoScroll = true;
    let speed = 5000;
    try {
      const [sRows] = await pool.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('banner_autoscroll', 'banner_speed')");
      sRows.forEach(s => {
        if (s.setting_key === 'banner_autoscroll') autoScroll = s.setting_value !== 'false' && s.setting_value !== '0';
        if (s.setting_key === 'banner_speed') speed = parseInt(s.setting_value, 10) || 5000;
      });
    } catch (eSettings) {}

    return res.status(200).json(ApiResponse.success({ banners, autoScroll, speed }, 'All banners retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateBannerSettings = async (req, res, next) => {
  try {
    const { autoScroll, speed } = req.body || {};
    if (autoScroll !== undefined) {
      await pool.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES ('banner_autoscroll', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [String(autoScroll)]
      );
    }
    if (speed !== undefined) {
      await pool.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES ('banner_speed', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [String(speed)]
      );
    }
    return res.status(200).json(ApiResponse.success({ autoScroll, speed }, 'Banner slider settings saved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.saveBanner = async (req, res, next) => {
  try {
    await ensureTableExists();

    const { id, title, subtitle, imageUrl, imagePath, desktopImageUrl, mobileImageUrl, buttonText, buttonLink, link, isActive, status, sortOrder, displayOrder } = req.body;
    let finalImage = imageUrl || imagePath || req.body.image;
    let finalDesktop = desktopImageUrl || req.body.desktopImage || finalImage;
    let finalMobile = mobileImageUrl || req.body.mobileImage || finalImage;

    const finalLink = buttonLink || link || '/shop';
    const finalBtnText = buttonText || 'Shop Now';
    const finalOrder = displayOrder || sortOrder || 0;
    const bannerStatus = (status || (isActive !== false ? 'active' : 'inactive')).toLowerCase();
    const activeBool = bannerStatus === 'active' ? 1 : 0;

    if (!finalImage && !finalDesktop && !finalMobile) {
      return res.status(400).json(ApiResponse.error('Banner image URL or file is required'));
    }

    // Process base64 files if present
    finalImage = saveBase64ImageToDisk(finalImage, 'banner');
    finalDesktop = saveBase64ImageToDisk(finalDesktop, 'banner-desktop');
    finalMobile = saveBase64ImageToDisk(finalMobile, 'banner-mobile');

    if (!finalImage) finalImage = finalDesktop || finalMobile;
    if (!finalDesktop) finalDesktop = finalImage;
    if (!finalMobile) finalMobile = finalImage;

    if (id) {
      await pool.query(
        `UPDATE home_banners 
         SET title = ?, subtitle = ?, image_url = ?, image_path = ?, image = ?, desktop_image_url = ?, mobile_image_url = ?, button_text = ?, button_link = ?, link = ?, status = ?, is_active = ?, sort_order = ?, display_order = ? 
         WHERE id = ?`,
        [title || null, subtitle || null, finalImage, finalImage, finalImage, finalDesktop, finalMobile, finalBtnText, finalLink, finalLink, bannerStatus, activeBool, finalOrder, finalOrder, id]
      );

      const [rows] = await pool.query('SELECT * FROM home_banners WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json(ApiResponse.error('Banner not found in database'));
      }
      return res.status(200).json(ApiResponse.success(mapBannerRow(rows[0]), 'Banner updated successfully'));
    } else {
      const [r] = await pool.query(
        `INSERT INTO home_banners (title, subtitle, image_url, image_path, image, desktop_image_url, mobile_image_url, button_text, button_link, link, status, is_active, sort_order, display_order, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [title || null, subtitle || null, finalImage, finalImage, finalImage, finalDesktop, finalMobile, finalBtnText, finalLink, finalLink, bannerStatus, activeBool, finalOrder, finalOrder]
      );
      
      const insertId = r.insertId;
      if (!insertId) {
        return res.status(500).json(ApiResponse.error('Failed to create banner record in MySQL database'));
      }

      const [rows] = await pool.query('SELECT * FROM home_banners WHERE id = ?', [insertId]);
      if (rows.length === 0) {
        return res.status(500).json(ApiResponse.error('Created banner record could not be retrieved from MySQL database'));
      }

      return res.status(200).json(ApiResponse.success(mapBannerRow(rows[0]), 'Banner created successfully'));
    }
  } catch (err) {
    console.error('[saveBanner Error]:', err);
    return res.status(500).json(ApiResponse.error(err.message || 'Server database error while saving banner'));
  }
};

exports.deleteBanner = async (req, res, next) => {
  try {
    await ensureTableExists();
    const { id } = req.params;
    await pool.query('DELETE FROM home_banners WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Banner deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllBanners = async (req, res, next) => {
  try {
    await ensureTableExists();
    let totalCount = 0;
    try {
      const [cnt] = await pool.query('SELECT COUNT(*) as c FROM home_banners');
      totalCount = cnt[0]?.c || 0;
    } catch (e) {}

    try { await pool.query('DELETE FROM home_banners'); } catch (e) {}
    try { await pool.query('DELETE FROM banners'); } catch (e) {}

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Banners',
        details: `Successfully cleared all ${totalCount} homepage banners.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} banners.`
    ));
  } catch (err) {
    next(err);
  }
};

