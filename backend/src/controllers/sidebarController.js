const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { processBase64Images } = require('../utils/base64Helper');

// Helper to format DB row to Sidebar Section object
const mapSectionRow = (row) => {
  let parsedConfig = null;
  if (row.config_json) {
    try {
      parsedConfig = typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json;
    } catch (e) {
      parsedConfig = null;
    }
  }

  return {
    id: row.id,
    side: row.side, // 'LEFT' | 'RIGHT'
    sectionType: row.section_type,
    title: row.title || '',
    subtitle: row.subtitle || '',
    description: row.description || '',
    imageUrl: row.image_url || '',
    icon: row.icon || '',
    badgeText: row.badge_text || '',
    buttonText: row.button_text || '',
    actionType: row.action_type || 'SHOP',
    actionValue: row.action_value || '/shop',
    backgroundColor: row.background_color || '',
    textColor: row.text_color || '',
    enabled: Boolean(row.is_enabled),
    displayOrder: Number(row.display_order || 0),
    config: parsedConfig
  };
};

// GET /api/sidebar-config (Public / Storefront API)
exports.getSidebarConfig = async (req, res, next) => {
  try {
    let rows = [];
    try {
      const [r] = await pool.query(
        `SELECT * FROM homepage_sidebar_sections ORDER BY display_order ASC, created_at ASC`
      );
      rows = r || [];
    } catch (eDb) {
      console.warn('[getSidebarConfig DB Warning]:', eDb.message);
    }

    const sections = rows.map(mapSectionRow);
    const leftSections = sections.filter(s => s.side === 'LEFT');
    const rightSections = sections.filter(s => s.side === 'RIGHT');

    // Build legacy mappings for backward compatibility
    const navMenuSec = leftSections.find(s => s.sectionType === 'NAV_MENU');
    const navItems = navMenuSec && Array.isArray(navMenuSec.config) ? navMenuSec.config : [];

    const offerCardSec = leftSections.find(s => s.sectionType === 'OFFER_CARD');
    const offerCard = offerCardSec ? {
      enabled: offerCardSec.enabled,
      heading: offerCardSec.title,
      subtitle: offerCardSec.subtitle,
      badgeText: offerCardSec.badgeText,
      couponCode: offerCardSec.config?.couponCode || 'PREPAID10',
      discountPercent: offerCardSec.config?.discountPercent || '%',
      link: offerCardSec.actionValue
    } : null;

    const promoCardSec = leftSections.find(s => s.sectionType === 'PROMO_BANNER');
    const promoCard = promoCardSec ? {
      enabled: promoCardSec.enabled,
      badge: promoCardSec.badgeText,
      title: promoCardSec.title,
      subtitle: promoCardSec.subtitle,
      description: promoCardSec.description,
      buttonText: promoCardSec.buttonText,
      link: promoCardSec.actionValue,
      imageUrl: promoCardSec.imageUrl
    } : null;

    const todaySpecialSec = rightSections.find(s => s.sectionType === 'TODAYS_DEAL');
    const todaySpecial = todaySpecialSec ? {
      enabled: todaySpecialSec.enabled,
      badge: todaySpecialSec.badgeText,
      subtitle: todaySpecialSec.subtitle,
      productName: todaySpecialSec.config?.productName || 'Sports Sneakers',
      description: todaySpecialSec.description,
      price: todaySpecialSec.config?.price || 1499,
      originalPrice: todaySpecialSec.config?.originalPrice || 2499,
      discountText: todaySpecialSec.config?.discountText || '40% OFF',
      buttonText: todaySpecialSec.buttonText,
      link: todaySpecialSec.actionValue,
      imageUrl: todaySpecialSec.imageUrl
    } : null;

    return res.status(200).json(ApiResponse.success({
      leftSections,
      rightSections,
      allSections: sections,
      // Legacy backwards-compatible keys
      navItems,
      offerCard,
      promoCard,
      todaySpecial
    }, 'Sidebar configuration retrieved successfully from database'));
  } catch (err) {
    next(err);
  }
};

// POST / PUT /api/admin/sidebar-config (Bulk Save / Update Sections)
exports.updateSidebarConfig = async (req, res, next) => {
  try {
    let bodyData = req.body || {};
    bodyData = await processBase64Images(bodyData);

    const { leftSections, rightSections, sections } = bodyData;
    const sectionsToSave = sections || [...(leftSections || []), ...(rightSections || [])];

    if (Array.isArray(sectionsToSave) && sectionsToSave.length > 0) {
      for (let idx = 0; idx < sectionsToSave.length; idx++) {
        const s = sectionsToSave[idx];
        const sectionId = s.id || `sec_${Date.now()}_${idx}`;
        const side = (s.side || 'LEFT').toUpperCase();
        const sectionType = s.sectionType || s.section_type || 'CUSTOM_CARD';
        const title = s.title || '';
        const subtitle = s.subtitle || '';
        const description = s.description || '';
        const imageUrl = s.imageUrl || s.image_url || '';
        const icon = s.icon || '';
        const badgeText = s.badgeText || s.badge_text || '';
        const buttonText = s.buttonText || s.button_text || '';
        const actionType = s.actionType || s.action_type || 'SHOP';
        const actionValue = s.actionValue || s.action_value || s.link || '/shop';
        const backgroundColor = s.backgroundColor || s.background_color || '';
        const textColor = s.textColor || s.text_color || '';
        const isEnabled = s.enabled !== undefined ? (s.enabled ? 1 : 0) : 1;
        const displayOrder = s.displayOrder !== undefined ? parseInt(s.displayOrder, 10) : idx + 1;
        const configJson = s.config ? (typeof s.config === 'string' ? s.config : JSON.stringify(s.config)) : null;

        await pool.query(
          `INSERT INTO homepage_sidebar_sections (
            id, side, section_type, title, subtitle, description, image_url, icon, badge_text, button_text,
            action_type, action_value, background_color, text_color, is_enabled, display_order, config_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            side = VALUES(side),
            section_type = VALUES(section_type),
            title = VALUES(title),
            subtitle = VALUES(subtitle),
            description = VALUES(description),
            image_url = VALUES(image_url),
            icon = VALUES(icon),
            badge_text = VALUES(badge_text),
            button_text = VALUES(button_text),
            action_type = VALUES(action_type),
            action_value = VALUES(action_value),
            background_color = VALUES(background_color),
            text_color = VALUES(text_color),
            is_enabled = VALUES(is_enabled),
            display_order = VALUES(display_order),
            config_json = VALUES(config_json),
            updated_at = NOW()`,
          [
            sectionId, side, sectionType, title, subtitle, description, imageUrl, icon, badgeText, buttonText,
            actionType, actionValue, backgroundColor, textColor, isEnabled, displayOrder, configJson
          ]
        );
      }
    }

    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/sidebar-config/section (Create or Edit single section)
exports.saveSection = async (req, res, next) => {
  try {
    let bodyData = req.body || {};
    bodyData = await processBase64Images(bodyData);

    const s = bodyData;
    const sectionId = s.id || `sec_${Date.now()}`;
    const side = (s.side || 'LEFT').toUpperCase();
    const sectionType = s.sectionType || s.section_type || 'CUSTOM_CARD';
    const title = s.title || '';
    const subtitle = s.subtitle || '';
    const description = s.description || '';
    const imageUrl = s.imageUrl || s.image_url || '';
    const icon = s.icon || '';
    const badgeText = s.badgeText || s.badge_text || '';
    const buttonText = s.buttonText || s.button_text || '';
    const actionType = s.actionType || s.action_type || 'SHOP';
    const actionValue = s.actionValue || s.action_value || s.link || '/shop';
    const backgroundColor = s.backgroundColor || s.background_color || '';
    const textColor = s.textColor || s.text_color || '';
    const isEnabled = s.enabled !== undefined ? (s.enabled ? 1 : 0) : 1;
    const displayOrder = s.displayOrder !== undefined ? parseInt(s.displayOrder, 10) : 1;
    const configJson = s.config ? (typeof s.config === 'string' ? s.config : JSON.stringify(s.config)) : null;

    await pool.query(
      `INSERT INTO homepage_sidebar_sections (
        id, side, section_type, title, subtitle, description, image_url, icon, badge_text, button_text,
        action_type, action_value, background_color, text_color, is_enabled, display_order, config_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        side = VALUES(side),
        section_type = VALUES(section_type),
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        description = VALUES(description),
        image_url = VALUES(image_url),
        icon = VALUES(icon),
        badge_text = VALUES(badge_text),
        button_text = VALUES(button_text),
        action_type = VALUES(action_type),
        action_value = VALUES(action_value),
        background_color = VALUES(background_color),
        text_color = VALUES(text_color),
        is_enabled = VALUES(is_enabled),
        display_order = VALUES(display_order),
        config_json = VALUES(config_json),
        updated_at = NOW()`,
      [
        sectionId, side, sectionType, title, subtitle, description, imageUrl, icon, badgeText, buttonText,
        actionType, actionValue, backgroundColor, textColor, isEnabled, displayOrder, configJson
      ]
    );

    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/sidebar-config/section/:id
exports.deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(ApiResponse.error('Section ID is required'));
    }

    await pool.query('DELETE FROM homepage_sidebar_sections WHERE id = ?', [id]);
    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/sidebar-config/reorder
exports.reorderSections = async (req, res, next) => {
  try {
    const { sectionIds } = req.body;
    if (Array.isArray(sectionIds) && sectionIds.length > 0) {
      for (let idx = 0; idx < sectionIds.length; idx++) {
        await pool.query(
          'UPDATE homepage_sidebar_sections SET display_order = ? WHERE id = ?',
          [idx + 1, sectionIds[idx]]
        );
      }
    }
    return exports.getSidebarConfig(req, res, next);
  } catch (err) {
    next(err);
  }
};
