const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Middleware للتحقق من JWT Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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
      'SELECT id, username, password_hash, permissions FROM admin_users WHERE username = $1',
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
      { id: user.id, username: user.username, permissions: user.permissions },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions || []
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
 * GET /api/admin/users
 * جلب جميع المدراء (User Management)
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, permissions FROM admin_users ORDER BY id ASC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

/**
 * POST /api/admin/users
 * إضافة مدير جديد
 */
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const { username, password, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admin_users (username, password_hash, permissions) VALUES ($1, $2, $3) RETURNING id, username, permissions',
      [username, hashedPassword, JSON.stringify(permissions || [])]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * تعديل بيانات مدير (كلمة المرور / الصلاحيات)
 */
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, permissions } = req.body;

    // Build update query dynamically
    let queryArgs = [];
    let queryParts = [];
    let counter = 1;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      queryParts.push(`password_hash = $${counter++}`);
      queryArgs.push(hashedPassword);
    }

    if (permissions) {
      queryParts.push(`permissions = $${counter++}`);
      queryArgs.push(JSON.stringify(permissions));
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ success: false, message: 'No changes provided' });
    }

    queryArgs.push(id);
    const query = `UPDATE admin_users SET ${queryParts.join(', ')} WHERE id = $${counter} RETURNING id, username, permissions`;

    const result = await pool.query(query, queryArgs);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * حذف مدير
 */
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    const result = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
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
        (SELECT COUNT(*) FROM raffle_entries) as raffle_participants,
        (SELECT COALESCE(SUM(total_after_discount), 0) FROM orders) as total_revenue
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
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
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    });
  }
});

/**
 * GET /api/admin/orders
 * جميع الطلبات
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM orders');

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
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
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
    console.error('Error fetching raffle entries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching raffle entries'
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
    console.error('Error drawing winner:', error);
    res.status(500).json({
      success: false,
      message: 'Error drawing winner'
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

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
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

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

module.exports = router;
