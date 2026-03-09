const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { calculateShopStatus } = require('../utils/shopStatus');

// GET /api/shop/status
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM system_config WHERE key IN ('shop_status', 'opening_hours', 'raffle_status')");

    let shopStatusConfig = { is_open: true, mode: 'auto' };
    let openingHours = {};
    let raffleStatus = { is_active: true };

    result.rows.forEach(row => {
      if (row.key === 'shop_status') shopStatusConfig = row.value;
      if (row.key === 'opening_hours') openingHours = row.value;
      if (row.key === 'raffle_status') raffleStatus = row.value;
    });

    const calculatedStatus = calculateShopStatus(shopStatusConfig, openingHours);

    res.json({
      success: true,
      is_open: calculatedStatus.is_open,
      message: calculatedStatus.message,
      opening_hours: openingHours,
      raffle_status: raffleStatus,
      config: shopStatusConfig // Include config for admin if needed
    });

  } catch (error) {
    console.error('Error fetching shop status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      is_open: false,
      opening_hours: {}
    });
  }
});

// GET /api/shop/menu
router.get('/menu', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get Categories
      const catsRes = await client.query('SELECT * FROM categories ORDER BY sort_order ASC');
      const categories = catsRes.rows;

      // Get Items
      const itemsRes = await client.query('SELECT * FROM menu_items ORDER BY id ASC');
      const items = itemsRes.rows;

      // Get global active addons
      const addonsRes = await client.query('SELECT * FROM global_addons WHERE is_available = true ORDER BY id ASC');
      const globalAddons = addonsRes.rows;

      // Assemble Menu Tree
      const menu = categories.map(cat => {
        return {
          ...cat,
          items: items
            .filter(item => item.category_id === cat.id)
            .map(item => ({
              ...item,
              // We'll keep an empty options array or remove it entirely, 
              // since add-ons are now global.
              options: []
            }))
        };
      });

      res.json({ success: true, data: menu, addons: globalAddons });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, message: 'Error fetching menu' });
  }
});

// GET /api/shop/delivery-fee
router.get('/delivery-fee', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM system_config WHERE key = 'delivery_fee'");
    res.json({ success: true, data: result.rows[0]?.value || { amount: 0 } });
  } catch (error) {
    console.error('Error fetching delivery fee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
