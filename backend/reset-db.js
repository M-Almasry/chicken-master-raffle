const pool = require('./db/connection');
const bcrypt = require('bcrypt');

async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log('⚠️  STARTING DATABASE RESET...');

    // 1. Delete all data from tables
    console.log('🗑️  Deleting all data...');
    await client.query('TRUNCATE TABLE raffle_entries CASCADE');
    await client.query('TRUNCATE TABLE orders CASCADE');
    await client.query('TRUNCATE TABLE registrations CASCADE');
    await client.query('TRUNCATE TABLE admin_users CASCADE');

    // 2. Reset Sequences (Optional, but good for "reset" feel)
    console.log('🔄 Resetting sequences...');
    await client.query('ALTER SEQUENCE raffle_entries_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE registrations_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE admin_users_id_seq RESTART WITH 1');

    // 3. Create Default Admin
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const permissions = JSON.stringify(["dashboard", "orders", "users"]);

    await client.query(
      'INSERT INTO admin_users (username, password_hash, permissions) VALUES ($1, $2, $3)',
      ['admin', hashedPassword, permissions]
    );

    console.log('✅ DATABASE RESET COMPLETE');
    console.log('👉 Default Admin: admin / admin123');

  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    client.release();
    process.exit();
  }
}

// Warn user before running
if (process.argv[2] !== '--force') {
  console.log('⚠️  WARNING: This will delete ALL data!');
  console.log('Run with --force to confirm: node reset-db.js --force');
  process.exit(1);
}

resetDatabase();
