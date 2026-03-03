require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migration = async () => {
  try {
    console.log('🔄 Starting Menu & Hours migration...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Categories Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name_ar VARCHAR(100) NOT NULL,
          name_en VARCHAR(100),
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Menu Items Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS menu_items (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES categories(id),
          name_ar VARCHAR(200) NOT NULL,
          name_en VARCHAR(200),
          description_ar TEXT,
          description_en TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url TEXT,
          is_available BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Menu Options (Add-ons) Table
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

      // 4. Update System Config for Opening Hours (Insert default if not exists)
      const defaultHours = {
        sunday: { open: "12:00", close: "23:00", closed: false },
        monday: { open: "12:00", close: "23:00", closed: false },
        tuesday: { open: "12:00", close: "23:00", closed: false },
        wednesday: { open: "12:00", close: "23:00", closed: false },
        thursday: { open: "12:00", close: "23:00", closed: false },
        friday: { open: "14:00", close: "00:00", closed: false },
        saturday: { open: "12:00", close: "23:00", closed: false }
      };

      await client.query(`
        INSERT INTO system_config (key, value)
        VALUES ('opening_hours', $1)
        ON CONFLICT (key) DO NOTHING;
      `, [JSON.stringify(defaultHours)]);

      // 5. Seed Initial Data (Optional - just categories to start with)
      // Check if categories exist
      const catCheck = await client.query('SELECT COUNT(*) FROM categories');
      if (parseInt(catCheck.rows[0].count) === 0) {
        console.log('🌱 Seeding initial categories...');
        await client.query(`
            INSERT INTO categories (name_ar, name_en, sort_order) VALUES 
            ('وجبات الدجاج', 'Chicken Meals', 1),
            ('السلطات والمقبلات', 'Salads & Sides', 2),
            ('المشروبات', 'Drinks', 3);
         `);
      }

      await client.query('COMMIT');
      console.log('✅ Migration successful: Menu tables and Hours config created.');
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
