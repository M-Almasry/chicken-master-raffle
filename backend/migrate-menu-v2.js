
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migration = async () => {
  try {
    console.log('🔄 Starting Menu V2 migration (Discounts & Fixes)...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Add discount_price column if not exists
      await client.query(`
        ALTER TABLE menu_items 
        ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2) DEFAULT NULL;
      `);

      // 2. Add description_en column if not exists (just in case)
      await client.query(`
        ALTER TABLE menu_items 
        ADD COLUMN IF NOT EXISTS description_en TEXT;
      `);

      // 3. Add is_available column if not exists (just in case)
      await client.query(`
        ALTER TABLE menu_items 
        ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
      `);

      // 4. Add image_url column if not exists (just in case)
      await client.query(`
        ALTER TABLE menu_items 
        ADD COLUMN IF NOT EXISTS image_url TEXT;
      `);

      await client.query('COMMIT');
      console.log('✅ Migration V2 successful: Added discount_price and ensured other columns exist.');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migration();
