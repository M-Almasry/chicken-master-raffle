const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const orderEvents = require('../utils/events');

/**
 * Middleware للتحقق من JWT Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Also check query param (for SSE)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * POST /api/admin/login
 * تسجيل دخول الإدارة
 */
/**
 * POST /api/admin/login
 * تسجيل دخول الإدارة
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM admin_users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
});

/**
 * GET /api/admin/users — قائمة المدراء
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, created_at FROM admin_users ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching admin users:', e);
    res.status(500).json({ success: false, message: 'Error fetching users', details: e.message });
  }
});

/**
 * POST /api/admin/users — إضافة مدير جديد
 */
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    const existing = await pool.query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(409).json({ success: false, message: 'اسم المستخدم موجود بالفعل' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admin_users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hash, role || 'receiver']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Error creating admin user:', e);
    res.status(500).json({ success: false, message: 'Error creating user', details: e.message });
  }
});

/**
 * PUT /api/admin/users/:id — تعديل بيانات مدير
 */
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const { id } = req.params;
    const fields = [], values = [];
    let idx = 1;
    if (username) { fields.push(`username=$${idx++}`); values.push(username); }
    if (role) { fields.push(`role=$${idx++}`); values.push(role); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash=$${idx++}`); values.push(hash);
    }
    if (fields.length === 0) return res.status(400).json({ success: false, message: 'لا توجد تغييرات' });
    values.push(id);
    await pool.query(`UPDATE admin_users SET ${fields.join(', ')} WHERE id=$${idx}`, values);
    res.json({ success: true, message: 'تم التحديث بنجاح' });
  } catch (e) {
    console.error('Error updating admin user:', e);
    res.status(500).json({ success: false, message: 'Error updating user', details: e.message });
  }
});

/**
 * DELETE /api/admin/users/:id — حذف مدير
 */
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(403).json({ success: false, message: 'لا يمكن حذف حسابك الشخصي' });
    const check = await pool.query('SELECT username FROM admin_users WHERE id = $1', [id]);
    if (check.rows[0]?.username === 'admin') return res.status(403).json({ success: false, message: 'لا يمكن حذف المدير الأساسي' });
    await pool.query('DELETE FROM admin_users WHERE id=$1', [id]);
    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (e) {
    console.error('Error deleting admin user:', e);
    res.status(500).json({ success: false, message: 'Error deleting user', details: e.message });
  }
});

/**
 * GET /api/admin/stats
 * إحصائيات عامة
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM registrations) as total_registrations,
        (SELECT COUNT(*) FROM registrations WHERE coupon_status = 'new') as unused_coupons,
        (SELECT COUNT(*) FROM registrations WHERE coupon_status = 'used') as used_coupons,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders,
        (SELECT COUNT(*) FROM raffle_entries) as raffle_participants,
        (SELECT COALESCE(SUM(total_after_discount - delivery_fee), 0) FROM orders WHERE status != 'cancelled') as total_revenue
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/top-items
 * الأصناف الأكثر طلباً
 */
router.get('/top-items', authenticateToken, async (req, res) => {
  try {
    // Extract top selling items from the JSONB 'items' column in orders
    // Added safety checks for non-array items and null values
    const result = await pool.query(`
      WITH item_stats AS (
        SELECT 
          (substring(item->>'id' FROM '^[0-9]+'))::bigint as menu_item_id,
          COALESCE((item->>'quantity')::integer, 1) as qty
        FROM orders,
        jsonb_array_elements(CASE 
          WHEN jsonb_typeof(items) = 'array' THEN items 
          ELSE '[]'::jsonb 
        END) as item
        WHERE status != 'cancelled'
        AND (item->>'id') ~ '^[0-9]+'
      )
      SELECT 
        mi.id,
        mi.name_ar,
        mi.name_en,
        c.name_ar as category_name,
        SUM(ist.qty) as total_sold
      FROM item_stats ist
      JOIN menu_items mi ON ist.menu_item_id = mi.id
      JOIN categories c ON mi.category_id = c.id
      GROUP BY mi.id, mi.name_ar, mi.name_en, c.name_ar
      ORDER BY total_sold DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching admin top items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top items',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/registrations
 * جميع المسجلين
 */
router.get('/registrations', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM registrations';
    const params = [];

    if (status) {
      query += ' WHERE coupon_status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status
      ? 'SELECT COUNT(*) FROM registrations WHERE coupon_status = $1'
      : 'SELECT COUNT(*) FROM registrations';
    const countResult = await pool.query(countQuery, status ? [status] : []);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Error fetching admin registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/orders
 * جميع الطلبات
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM orders';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    const countResult = await pool.query(
      status ? 'SELECT COUNT(*) FROM orders WHERE status = $1' : 'SELECT COUNT(*) FROM orders',
      status ? [status] : []
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/raffle-entries
 * المؤهلين للسحب
 */
router.get('/raffle-entries', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        re.id,
        re.entry_date,
        r.name,
        r.phone,
        r.coupon_code,
        o.id as order_id,
        o.total_after_discount
      FROM raffle_entries re
      JOIN registrations r ON re.registration_id = r.id
      JOIN orders o ON re.order_id = o.id
      ORDER BY re.entry_date DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching admin raffle entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raffle entries',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/draw-winner
 * إجراء السحب واختيار فائز عشوائي
 */
router.post('/draw-winner', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        re.id,
        r.name,
        r.phone,
        r.coupon_code
      FROM raffle_entries re
      JOIN registrations r ON re.registration_id = r.id
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No participants found'
      });
    }

    res.json({
      success: true,
      winner: result.rows[0]
    });

  } catch (error) {
    console.error('Error drawing admin raffle winner:', error);
    res.status(500).json({
      success: false,
      message: 'Error drawing winner',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * تحديث حالة الطلب (pending, completed, cancelled)
 */
router.put('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Emit event for real-time notifications
    orderEvents.emit('orderUpdate', {
      type: 'order_status_update',
      orderId: id,
      status: status
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating admin order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/orders/stream
 * قناة SSE لتنبيهات الإدارة بالوقت الحقيقي
 */
router.get('/orders/stream', authenticateToken, (req, res) => {
  // إعدادات SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // إرسال رسالة تأكيد الاتصال
  res.write(`data: ${JSON.stringify({ type: 'init', message: 'Connected to admin stream' })}\n\n`);

  // مستمع لتحديثات الطلبات
  const onOrderUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  orderEvents.on('orderUpdate', onOrderUpdate);

  // إرسال Heartbeat كل 15 ثانية للتأكد من بقاء الاتصال مفتوحاً
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // إغلاق الاتصال
  req.on('close', () => {
    orderEvents.removeListener('orderUpdate', onOrderUpdate);
    clearInterval(heartbeat);
  });
});

/**
 * GET /api/admin/shop-status
 * جلب حالة فتح/إغلاق المتجر وإعداده
 */
router.get('/shop-status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM system_config WHERE key = 'shop_status'");

    if (result.rows.length === 0) {
      // Default fallback
      return res.json({ success: true, is_open: true, mode: 'auto', message: '' });
    }

    res.json({ success: true, ...result.rows[0].value });
  } catch (error) {
    console.error('Error fetching admin shop status:', error);
    res.status(500).json({ success: false, message: 'Error fetching status', details: error.message });
  }
});

/**
 * PUT /api/admin/shop-status
 * تحديث حالة المتجر (يدوي/تلقائي)
 */
router.put('/shop-status', authenticateToken, async (req, res) => {
  try {
    const { is_open, mode, message } = req.body;

    const value = {
      is_open: !!is_open,
      mode: mode || 'auto',
      message: message || ''
    };

    await pool.query(
      "INSERT INTO system_config (key, value) VALUES ('shop_status', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
      [JSON.stringify(value)]
    );

    res.json({ success: true, message: 'Shop status updated', data: value });
  } catch (error) {
    console.error('Error updating admin shop status:', error);
    res.status(500).json({ success: false, message: 'Error updating status', details: error.message });
  }
});

/**
 * --- Menu Management ---
 */

// Categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error in GET /admin/categories:', e);
    res.status(500).json({ success: false, message: 'Error fetching categories', details: e.message });
  }
});

router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name_ar, name_en, sort_order } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name_ar, name_en, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name_ar, name_en, sort_order || 0]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Error in POST /admin/categories:', e);
    res.status(500).json({ success: false, message: 'Error creating category', details: e.message });
  }
});

router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en, sort_order } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name_ar=$1, name_en=$2, sort_order=$3 WHERE id=$4 RETURNING *',
      [name_ar, name_en, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Error in PUT /admin/categories/:id:', e);
    res.status(500).json({ success: false, message: 'Error updating category', details: e.message });
  }
});

router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    console.error('Error in DELETE /admin/categories/:id:', e);
    res.status(500).json({ success: false, message: 'Error deleting category', details: e.message });
  }
});

// Menu Items
// ==========================================
// 🌟 GLOBAL ADD-ONS MANAGEMENT (الإضافات العامة)
// ==========================================

// GET all global addons
router.get('/global-addons', authenticateToken, async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM global_addons ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Error fetching global addons:', e);
    res.status(500).json({ success: false, message: 'Internal server error while fetching global add-ons' });
  } finally {
    if (client) client.release();
  }
});

// POST new global addon
router.post('/global-addons', authenticateToken, async (req, res) => {
  let client;
  try {
    const { name_ar, name_en, price, is_available } = req.body;

    if (!name_ar) {
      return res.status(400).json({ success: false, message: 'الاسم بالعربية مطلوب' });
    }

    const parsedPrice = !isNaN(parseFloat(price)) ? parseFloat(price) : 0;
    const finalIsAvailable = is_available === undefined ? true : !!is_available;

    client = await pool.connect();
    const result = await client.query(
      `INSERT INTO global_addons (name_ar, name_en, price, is_available) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name_ar, name_en || null, parsedPrice, finalIsAvailable]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Error creating global addon:', e);
    res.status(500).json({ success: false, message: 'Internal server error while creating global add-on' });
  } finally {
    if (client) client.release();
  }
});

// PUT update global addon
router.put('/global-addons/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const { name_ar, name_en, price, is_available } = req.body;

    if (!name_ar) {
      return res.status(400).json({ success: false, message: 'الاسم بالعربية مطلوب' });
    }

    const parsedPrice = !isNaN(parseFloat(price)) ? parseFloat(price) : 0;
    const finalIsAvailable = is_available === undefined ? true : !!is_available;

    client = await pool.connect();
    const result = await client.query(
      `UPDATE global_addons 
       SET name_ar = $1, name_en = $2, price = $3, is_available = $4 
       WHERE id = $5 RETURNING *`,
      [name_ar, name_en || null, parsedPrice, finalIsAvailable, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الإضافة غير موجودة' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Error updating global addon:', e);
    res.status(500).json({ success: false, message: 'Internal server error while updating global add-on' });
  } finally {
    if (client) client.release();
  }
});

// DELETE global addon
router.delete('/global-addons/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    client = await pool.connect();

    const result = await client.query('DELETE FROM global_addons WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'الإضافة غير موجودة' });
    }

    res.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch (e) {
    console.error('Error deleting global addon:', e);
    res.status(500).json({ success: false, message: 'Internal server error while deleting global add-on' });
  } finally {
    if (client) client.release();
  }
});

router.get('/items', authenticateToken, async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    console.log('[API] Fetching all menu items and options...');

    // Fetch items with category names
    const itemsRes = await client.query(`
      SELECT i.*, c.name_ar as category_name 
      FROM menu_items i 
      LEFT JOIN categories c ON i.category_id = c.id 
      ORDER BY i.id DESC
    `);
    console.log(`[API] Found ${itemsRes.rows.length} items`);

    // Fetch all options
    const optionsRes = await client.query(`SELECT * FROM menu_options ORDER BY id ASC`);
    console.log(`[API] Found ${optionsRes.rows.length} total options`);

    // Merge options into items
    const items = itemsRes.rows.map(item => {
      const itemOptions = optionsRes.rows.filter(opt => opt.menu_item_id === item.id);
      return { ...item, options: itemOptions };
    });

    res.json({ success: true, data: items });
  } catch (e) {
    console.error('❌ Fatal error in GET /admin/items:', {
      message: e.message,
      stack: e.stack,
      hint: e.hint,
      detail: e.detail
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching items',
      details: e.message
    });
  } finally {
    if (client) client.release();
  }
});

router.post('/items', authenticateToken, async (req, res) => {
  let client;
  try {
    const { category_id, name_ar, name_en, description_ar, description_en, price, discount_price, image_url, is_available, options } = req.body;
    console.log('[API] Creating new item:', { name_ar, category_id, price });

    // Validate and parse numeric fields safely
    const parsedCategoryId = category_id && !isNaN(parseInt(category_id)) ? parseInt(category_id) : null;
    const parsedPrice = !isNaN(parseFloat(price)) ? parseFloat(price) : 0;
    const parsedDiscountPrice = (discount_price !== undefined && discount_price !== '' && !isNaN(parseFloat(discount_price)))
      ? parseFloat(discount_price)
      : null;
    const finalIsAvailable = is_available === undefined ? true : !!is_available;

    client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemRes = await client.query(
        `INSERT INTO menu_items (category_id, name_ar, name_en, description_ar, description_en, price, discount_price, image_url, is_available) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          parsedCategoryId,
          name_ar,
          name_en || null,
          description_ar || null,
          description_en || null,
          parsedPrice,
          parsedDiscountPrice,
          image_url || null,
          finalIsAvailable
        ]
      );

      const itemId = itemRes.rows[0].id;
      console.log(`[API] Item created with ID: ${itemId}`);

      if (options && Array.isArray(options)) {
        for (const opt of options) {
          if (opt.name_ar) { // Only insert if name is present
            await client.query(
              'INSERT INTO menu_options (menu_item_id, name_ar, name_en, price) VALUES ($1, $2, $3, $4)',
              [itemId, opt.name_ar, opt.name_en || null, parseFloat(opt.price) || 0]
            );
          }
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: itemRes.rows[0] });
    } catch (e) {
      if (client) await client.query('ROLLBACK');
      console.error('❌ Database transaction error in POST /admin/items:', {
        message: e.message,
        detail: e.detail,
        constraint: e.constraint
      });
      throw e;
    }
  } catch (e) {
    console.error('❌ Fatal error in POST /admin/items:', {
      message: e.message,
      stack: e.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating item',
      details: e.message
    });
  } finally {
    if (client) client.release();
  }
});

router.put('/items/:id', authenticateToken, async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const { category_id, name_ar, name_en, description_ar, description_en, price, discount_price, image_url, is_available, options } = req.body;
    console.log(`[API] Updating item ID: ${id}`, { name_ar });

    // Validate and parse numeric fields safely
    const parsedCategoryId = category_id && !isNaN(parseInt(category_id)) ? parseInt(category_id) : null;
    const parsedPrice = !isNaN(parseFloat(price)) ? parseFloat(price) : 0;
    const parsedDiscountPrice = (discount_price !== undefined && discount_price !== '' && !isNaN(parseFloat(discount_price)))
      ? parseFloat(discount_price)
      : null;
    const finalIsAvailable = is_available === undefined ? true : !!is_available;

    client = await pool.connect();
    try {
      await client.query('BEGIN');
      const itemRes = await client.query(
        `UPDATE menu_items SET category_id=$1, name_ar=$2, name_en=$3, description_ar=$4, description_en=$5, price=$6, discount_price=$7, image_url=$8, is_available=$9
         WHERE id=$10 RETURNING *`,
        [
          parsedCategoryId,
          name_ar,
          name_en || null,
          description_ar || null,
          description_en || null,
          parsedPrice,
          parsedDiscountPrice,
          image_url || null,
          finalIsAvailable,
          id
        ]
      );

      if (itemRes.rows.length === 0) {
        throw new Error('Item not found');
      }

      // Replace options
      await client.query('DELETE FROM menu_options WHERE menu_item_id=$1', [id]);
      if (options && Array.isArray(options)) {
        for (const opt of options) {
          if (opt.name_ar) {
            await client.query(
              'INSERT INTO menu_options (menu_item_id, name_ar, name_en, price) VALUES ($1, $2, $3, $4)',
              [id, opt.name_ar, opt.name_en || null, parseFloat(opt.price) || 0]
            );
          }
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, data: itemRes.rows[0] });
    } catch (e) {
      if (client) await client.query('ROLLBACK');
      console.error(`❌ Database transaction error in PUT /admin/items/${id}:`, {
        message: e.message,
        detail: e.detail
      });
      throw e;
    }
  } catch (e) {
    console.error(`❌ Fatal error in PUT /admin/items/${req.params.id}:`, {
      message: e.message,
      stack: e.stack
    });
    res.status(e.message === 'Item not found' ? 404 : 500).json({
      success: false,
      message: e.message === 'Item not found' ? 'Item not found' : 'Internal server error while updating item',
      details: e.message
    });
  } finally {
    if (client) client.release();
  }
});

router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM menu_items WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    console.error('Error in DELETE /admin/items/:id:', e);
    res.status(500).json({ success: false, message: 'Error deleting item', details: e.message });
  }
});

// Opening Hours
router.get('/opening-hours', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM system_config WHERE key = 'opening_hours'");
    res.json({ success: true, data: result.rows[0]?.value || {} });
  } catch (e) {
    console.error('Error in GET /admin/opening-hours:', e);
    res.status(500).json({ success: false, message: 'Error fetching hours', details: e.message });
  }
});

router.put('/opening-hours', authenticateToken, async (req, res) => {
  try {
    const { hours } = req.body; // Expecting object
    await pool.query(
      "INSERT INTO system_config (key, value) VALUES ('opening_hours', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [JSON.stringify(hours)]
    );
    res.json({ success: true, message: 'Updated' });
  } catch (e) {
    console.error('Error in PUT /admin/opening-hours:', e);
    res.status(500).json({ success: false, message: 'Error updating hours', details: e.message });
  }
});

// Delivery Fee
router.get('/delivery-fee', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM system_config WHERE key = 'delivery_fee'");
    res.json({ success: true, data: result.rows[0]?.value || { amount: 0 } });
  } catch (e) {
    console.error('Error in GET /admin/delivery-fee:', e);
    res.status(500).json({ success: false, message: 'Error fetching fee', details: e.message });
  }
});

router.put('/delivery-fee', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    await pool.query(
      "INSERT INTO system_config (key, value) VALUES ('delivery_fee', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
      [JSON.stringify({ amount: parseFloat(amount) || 0 })]
    );
    res.json({ success: true, message: 'Delivery fee updated' });
  } catch (e) {
    console.error('Error in PUT /admin/delivery-fee:', e);
    res.status(500).json({ success: false, message: 'Error updating fee', details: e.message });
  }
});


// --- Raffle Configuration ---

// GET /api/admin/raffle-config
router.get('/raffle-config', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT value FROM system_config WHERE key = 'raffle_status'"
    );
    // Default config if not set
    const status = result.rows.length > 0 ? result.rows[0].value : { is_active: true, expiry_date: '2026-03-29' };
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error fetching raffle config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/raffle-config
router.post('/raffle-config', authenticateToken, async (req, res) => {
  try {
    const { is_active, expiry_date } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const configValue = {
      is_active,
      expiry_date: expiry_date || '2026-03-29'
    };

    await pool.query(
      "INSERT INTO system_config (key, value) VALUES ('raffle_status', $1) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
      [JSON.stringify(configValue)]
    );

    res.json({
      success: true,
      message: 'Raffle configuration updated successfully',
      is_active,
      expiry_date: configValue.expiry_date
    });
  } catch (error) {
    console.error('Error updating raffle config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/admin/raffle-config/update-all
 * تحديث تاريخ انتهاء الصلاحية لجميع المشتركين السابقين
 */
router.post('/raffle-config/update-all', authenticateToken, async (req, res) => {
  try {
    const { expiry_date } = req.body;

    if (!expiry_date) {
      return res.status(400).json({ success: false, message: 'Expiry date is required' });
    }

    await pool.query(
      "UPDATE registrations SET expires_at = $1 WHERE coupon_status = 'new'",
      [expiry_date]
    );

    res.json({
      success: true,
      message: 'تم تحديث تاريخ انتهاء جميع الكوبونات غير المستخدمة بنجاح'
    });
  } catch (error) {
    console.error('Error updating all registrations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
