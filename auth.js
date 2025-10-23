import { query } from './database.js';

// Simple password hash function (basic)
function simpleHash(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function POST({ request }) {
  const { action, email, password } = await request.json();
  
  if (!email || !password) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Email and password are required'
    }), { status: 400 });
  }

  try {
    if (action === 'register') {
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1', 
        [email.toLowerCase().trim()]
      );

      if (existingUser.rows.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'User already exists with this email'
        }), { status: 400 });
      }

      // Hash password
      const hashedPassword = simpleHash(password);

      // Create new user
      const newUser = await query(
        `INSERT INTO users (email, password, created_at) 
         VALUES ($1, $2, $3) RETURNING id, email, created_at`,
        [email.toLowerCase().trim(), hashedPassword, new Date().toISOString()]
      );

      console.log(`✅ New user registered: ${email}`);

      return new Response(JSON.stringify({
        success: true,
        userId: newUser.rows[0].id,
        email: newUser.rows[0].email,
        message: 'Registration successful'
      }), { status: 200 });

    } else if (action === 'login') {
      // Hash password for comparison
      const hashedPassword = simpleHash(password);

      // Find user
      const user = await query(
        `SELECT id, email, created_at FROM users 
         WHERE email = $1 AND password = $2 AND is_active = true`,
        [email.toLowerCase().trim(), hashedPassword]
      );

      if (user.rows.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        }), { status: 401 });
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = $1 WHERE id = $2',
        [new Date().toISOString(), user.rows[0].id]
      );

      console.log(`✅ User logged in: ${email}`);

      return new Response(JSON.stringify({
        success: true,
        userId: user.rows[0].id,
        email: user.rows[0].email,
        message: 'Login successful'
      }), { status: 200 });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid action'
      }), { status: 400 });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Authentication failed: ' + error.message
    }), { status: 500 });
  }
}