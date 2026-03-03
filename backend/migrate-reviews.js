/**
 * Migration: Create site_reviews table
 */
require('dotenv').config();
const pool = require('./db/connection');

async function migrate() {
  try {
    await pool.query(`
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

    console.log('✅ site_reviews table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
