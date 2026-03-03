/**
 * migrate-all.js
 * 
 * Runs ALL database migrations in order.
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS and IF NOT EXISTS.
 * 
 * Render: Set Start Command to:
 *   node migrate-all.js && node server.js
 */
require('dotenv').config();
const pool = require('./db/connection');

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running all migrations...');

    // ---------------------------------------------------
    // 1. Registrations table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        coupon_code VARCHAR(50) UNIQUE NOT NULL,
        coupon_status VARCHAR(20) DEFAULT 'new',
        ip_address VARCHAR(45),
        device_fingerprint VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
      );
      CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
      CREATE INDEX IF NOT EXISTS idx_registrations_coupon ON registrations(coupon_code);
    `);
    console.log('  ✅ Table: registrations');

    // ---------------------------------------------------
    // 2. Orders table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_location TEXT,
        delivery_type VARCHAR(20) DEFAULT 'delivery',
        notes TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        coupon_code VARCHAR(50),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        total_before_discount DECIMAL(10,2),
        total_after_discount DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    `);
    console.log('  ✅ Table: orders');

    // Add missing columns to existing orders table (for existing deployments)
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='final_total') THEN
          ALTER TABLE orders RENAME COLUMN final_total TO total_after_discount;
        END IF;
      END $$;
    `);

    // ---------------------------------------------------
    // 3. Categories Table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name_ar VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Table: categories');

    // ---------------------------------------------------
    // 4. Menu Items Table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name_ar VARCHAR(200) NOT NULL,
        name_en VARCHAR(200),
        description_ar TEXT,
        description_en TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2) DEFAULT NULL,
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Table: menu_items');

    // ---------------------------------------------------
    // 5. Menu Options Table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_options (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
        name_ar VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Table: menu_options');

    // ---------------------------------------------------
    // 6. Admin users table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Table: admin_users');

    // ---------------------------------------------------
    // 7. Raffle Entries Table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS raffle_entries (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER REFERENCES registrations(id),
        order_id INTEGER REFERENCES orders(id),
        entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('  ✅ Table: raffle_entries');

    // ---------------------------------------------------
    // 8. Shop status / System Config table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Default Shop Status
      INSERT INTO system_config (key, value)
      VALUES ('shop_status', '{"is_open": true, "mode": "auto", "message": ""}')
      ON CONFLICT (key) DO NOTHING;

      -- Default Delivery Fee
      INSERT INTO system_config (key, value)
      VALUES ('delivery_fee', '{"amount": 5}')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('  ✅ Table: system_config');

    // ---------------------------------------------------
    // 9. Site reviews table (new)
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_reviews (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) DEFAULT 'زبون',
        fingerprint VARCHAR(255),
        ip_address VARCHAR(45),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_clean BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_fingerprint ON site_reviews(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_reviews_public ON site_reviews(is_public, is_clean);
    `);
    console.log('  ✅ Table: site_reviews');

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigrations();
