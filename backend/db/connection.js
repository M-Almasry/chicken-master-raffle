const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = process.env.DB_HOST ? {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
} : {
  connectionString: process.env.DATABASE_URL,
};

const pool = new Pool({
  ...dbConfig,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
