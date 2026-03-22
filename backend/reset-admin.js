const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function resetPassword() {
  const newPassword = 'admin123'; // Change this if needed
  const username = 'admin';
  
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE admin_users SET password_hash = $1 WHERE username = $2 RETURNING id',
      [hash, username]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Success: Password for user "${username}" has been reset to "${newPassword}"`);
    } else {
      console.error(`❌ Error: User "${username}" not found in database.`);
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
