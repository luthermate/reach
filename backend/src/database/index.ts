import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

export const initializeDatabase = async () => {
  try {
    // Check connection
    const res = await pool.query('SELECT NOW()');
    console.log('✓ Database connected at', res.rows[0].now);

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        bio TEXT,
        age INT,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        profile_photo_url VARCHAR(500),
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    // Create interests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        icon VARCHAR(255),
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_interests junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        interest_id INT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, interest_id)
      );
    `);

    // Create matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        matched_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        compatibility_score DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, matched_user_id)
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(50) DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        billing_cycle_start TIMESTAMP,
        billing_cycle_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_payment_id VARCHAR(255) UNIQUE,
        amount DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'ZMW',
        status VARCHAR(20),
        plan_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_matches_user ON matches(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);`);

    console.log('✓ Database migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
