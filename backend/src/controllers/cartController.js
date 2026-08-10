const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Helper to get or create cart ID for user
async function getUserCartId(userId) {
  let [rows] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);
  if (rows.length > 0) {
    return rows[0].id;
  }
  const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
  return result.insertId;
}

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartId = await getUserCartId(userId);

    // Try cart_items join first, fallback to cart direct table if needed
    let items = [];
    try {
      const [rows] = await pool.query(
        `SELECT ci.id, ci.product_id, ci.quantity, ci.selected_size, ci.selected_color,
                p.name as product_name, p.price, p.image_url
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.cart_id = ?`,
        [cartId]
      );
      items = rows;
    } catch (e) {
      // Fallback query if cart_items table is not used
      const [rows] = await pool.query(
        `SELECT c.id, c.product_id, c.quantity, c.selected_size, c.selected_color,
                p.name as product_name, p.price, p.image_url
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [userId]
      );
      items = rows;
    }

    let totalAmount = 0;
    const formattedItems = items.map(item => {
      const price = parseFloat(item.price || 0);
      const qty = parseInt(item.quantity || 1);
      const subtotal = price * qty;
      totalAmount += subtotal;

      return {
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        price: price,
        imageUrl: item.image_url,
        quantity: qty,
        selectedSize: item.selected_size || null,
        selectedColor: item.selected_color || null,
        totalPrice: subtotal
      };
    });

    const cartDTO = {
      id: cartId,
      userId,
      items: formattedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0)
    };

    return res.status(200).json(ApiResponse.success(cartDTO, 'Cart retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, selectedSize, selectedColor } = req.body;

    if (!productId) {
      return res.status(400).json(ApiResponse.error('Product ID is required'));
    }

    const cartId = await getUserCartId(userId);
    const qty = parseInt(quantity) > 0 ? parseInt(quantity) : 1;

    try {
      // Check existing in cart_items
      const [existing] = await pool.query(
        `SELECT id, quantity FROM cart_items 
         WHERE cart_id = ? AND product_id = ? 
         AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL))
         AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))`,
        [cartId, productId, selectedSize || null, selectedSize || null, selectedColor || null, selectedColor || null]
      );

      if (existing.length > 0) {
        const newQty = existing[0].quantity + qty;
        await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      } else {
        await pool.query(
          `INSERT INTO cart_items (cart_id, product_id, quantity, selected_size, selected_color) 
           VALUES (?, ?, ?, ?, ?)`,
          [cartId, productId, qty, selectedSize || null, selectedColor || null]
        );
      }
    } catch (e) {
      // Direct cart table fallback
      const [existing] = await pool.query(
        `SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?`,
        [userId, productId]
      );
      if (existing.length > 0) {
        await pool.query('UPDATE cart SET quantity = ? WHERE id = ?', [existing[0].quantity + qty, existing[0].id]);
      } else {
        await pool.query(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, productId, qty]
        );
      }
    }

    return exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.updateQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const quantity = parseInt(req.query.quantity || req.body.quantity);

    if (isNaN(quantity) || quantity <= 0) {
      return exports.removeItem(req, res, next);
    }

    try {
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
    } catch (e) {
      await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, itemId, userId]);
    }

    return exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    try {
      await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
    } catch (e) {
      await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [itemId, userId]);
    }

    return exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cartId = await getUserCartId(userId);

    try {
      await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    } catch (e) {
      await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    }

    return exports.getCart(req, res, next);
  } catch (err) {
    next(err);
  }
};
