import pg from 'pg';
const { Pool } = pg;

console.log('🔌 Attempting PostgreSQL connection...');
console.log('Database URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');

let pool;

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Render PostgreSQL requires SSL
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  // Test connection immediately
  const client = await pool.connect();
  console.log('✅ PostgreSQL Database connected successfully');
  
  // Test simple query
  const result = await client.query('SELECT version()');
  console.log('📊 PostgreSQL Version:', result.rows[0].version);
  
  client.release();
  
} catch (error) {
  console.error('❌ PostgreSQL Connection failed:', error.message);
  // Don't exit - let server start anyway
}

export async function query(text, params) {
  if (!pool) {
    throw new Error('Database not connected');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

export async function initDB() {
  if (!pool) {
    console.log('⚠️  Database not connected, skipping initialization');
    return false;
  }

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
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    return false;
  }
}

export { pool };