require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migration = async () => {
  try {
    console.log('🔄 Starting migration...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      INSERT INTO system_config (key, value)
      VALUES ('shop_status', '{"is_open": true}')
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('✅ Migration successful: Shop status table created.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
};

migration();
