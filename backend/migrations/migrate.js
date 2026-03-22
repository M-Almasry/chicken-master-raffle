const fs = require('fs');
const path = require('path');
// Use the pool from db/connection if it exists, otherwise fallback or use env directly
// For this project, it seems server.js uses ./db/connection
let pool;
try {
  pool = require('../db/connection');
} catch (e) {
  // Fallback to a basic pool if the one above isn't found
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

// Mock logger if not found
let logger = {
  info: console.log,
  error: console.error
};
try {
  const customLogger = require('../utils/logger');
  if (customLogger) logger = customLogger;
} catch (e) {
  // Keep the fallback
}

async function runMigrations() {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Advisory Lock: Prevents race conditions when multiple instances run migrations simultaneously
    // 123456 is a unique session-level lock ID for this app's migrations
    await client.query('SELECT pg_advisory_xact_lock(123456)');

    // Create migrations table if it doesn't exist
    await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

    // Read migration files
    const migrationsDir = path.join(__dirname, 'sql');
    if (!fs.existsSync(migrationsDir)) {
      logger.info('Migration Service: No migrations directory found. Skipping.');
      await client.query('COMMIT');
      return;
    }

    // Natural numeric sorting: ensures 2.sql runs before 10.sql
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Get applied migrations
    const result = await client.query('SELECT name FROM _migrations');
    const applied = new Set(result.rows.map(row => row.name));

    // Apply new migrations
    let appliedCount = 0;
    for (const file of files) {
      if (!applied.has(file)) {
        logger.info(`Migration Service: Applying [${file}]`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          appliedCount++;
        } catch (sqlError) {
          logger.error(`Migration Service: Error in [${file}] - ${sqlError.message}`);
          throw sqlError; // Re-throw to trigger ROLLBACK
        }
      }
    }

    await client.query('COMMIT');

    if (appliedCount > 0) {
      logger.info(`Migration Service: ✅ Success. Applied ${appliedCount} new migrations.`);
    } else {
      logger.info('Migration Service: ℹ️ Database is already up to date.');
    }

    return appliedCount;

  } catch (e) {
    if (client) await client.query('ROLLBACK');
    logger.error('Migration Service: ❌ FAILED', e);
    throw e; // Let the caller decide how to handle the failure (e.g., stop server)
  } finally {
    if (client) client.release();
  }
}

// Only execute directly if script is run as main (node migrate.js)
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process finished effectively.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration process exited with errors.');
      process.exit(1);
    });
}

module.exports = { runMigrations };
