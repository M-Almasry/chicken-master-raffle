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
        device_fingerprint VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
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
        total_before_discount DECIMAL(10,2),
        final_total DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    `);
    console.log('  ✅ Table: orders');

    // ---------------------------------------------------
    // 3. Admin users table
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
    // 4. Shop status table
    // ---------------------------------------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS shop_status (
        id SERIAL PRIMARY KEY,
        is_open BOOLEAN DEFAULT true,
        manual_override BOOLEAN DEFAULT false,
        opening_hours JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO shop_status (id, is_open, manual_override, opening_hours)
      VALUES (1, true, false, '{}')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  ✅ Table: shop_status');

    // ---------------------------------------------------
    // 5. Site reviews table (new)
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
