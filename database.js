import pg from 'pg';
const { Pool } = pg;

// Render PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

console.log('📊 PostgreSQL Database connected');

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Database initialization - tables create karega
export async function initDB() {
  try {
    console.log('🔄 Initializing database tables...');

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Inventory items table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_type VARCHAR(50),
        quality VARCHAR(100),
        lot_number VARCHAR(100),
        colors JSONB,
        sizes JSONB,
        price DECIMAL(10,2),
        material DECIMAL(8,2),
        weight DECIMAL(8,2),
        total_dozens INTEGER,
        total_pieces INTEGER,
        total_amount DECIMAL(12,2),
        in_stock BOOLEAN DEFAULT true,
        notes TEXT,
        date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unique_code VARCHAR(100),
        size_option VARCHAR(20),
        added_date_time TIMESTAMP,
        last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        avatar TEXT,
        settings JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

export { pool };