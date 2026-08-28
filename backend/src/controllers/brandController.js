const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getAllBrands = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM brands ORDER BY name ASC');
    const brands = rows.map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url,
      description: b.description,
      isActive: Boolean(b.is_active)
    }));
    return res.status(200).json(ApiResponse.success(brands, 'Brands retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Brand not found'));
    }
    const b = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url,
      description: b.description,
      isActive: Boolean(b.is_active)
    }, 'Brand details retrieved'));
  } catch (err) {
    next(err);
  }
};

exports.createBrand = async (req, res, next) => {
  try {
    const { name, logoUrl, description } = req.body;
    if (!name) {
      return res.status(400).json(ApiResponse.error('Brand name is required'));
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const [result] = await pool.query(
      'INSERT INTO brands (name, slug, logo_url, description, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [name, slug, logoUrl || null, description || null]
    );

    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [result.insertId]);
    const b = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url,
      description: b.description,
      isActive: Boolean(b.is_active)
    }, 'Brand created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, logoUrl, description, isActive } = req.body;

    let updates = [];
    let params = [];

    if (name !== undefined) {
      updates.push('name = ?'); params.push(name);
      updates.push('slug = ?'); params.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
    if (logoUrl !== undefined) { updates.push('logo_url = ?'); params.push(logoUrl); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE brands SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await pool.query('SELECT * FROM brands WHERE id = ?', [id]);
    const b = rows[0];
    return res.status(200).json(ApiResponse.success({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url,
      description: b.description,
      isActive: Boolean(b.is_active)
    }, 'Brand updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM brands WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Brand deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAllBrands = async (req, res, next) => {
  try {
    const [cnt] = await pool.query('SELECT COUNT(*) as c FROM brands');
    const totalCount = cnt[0]?.c || 0;

    try { await pool.query('UPDATE products SET brand_id = NULL WHERE brand_id IS NOT NULL'); } catch (e) {}
    await pool.query('DELETE FROM brands');

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Brands',
        details: `Successfully cleared all ${totalCount} brands.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully deleted ${totalCount} brands.`
    ));
  } catch (err) {
    next(err);
  }
};
