require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('Starting migration: Adding role column to admin_users...');
    await pool.query(`
            ALTER TABLE admin_users 
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'
        `);
    console.log('Migration successful: Column "role" added/verified.');

    // Update existing admin to superadmin for safety
    await pool.query("UPDATE admin_users SET role = 'superadmin' WHERE username = 'admin'");
    console.log('Updated default admin user to "superadmin" role.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
