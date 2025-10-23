import { query } from './database.js';

export async function POST({ request }) {
  const { email } = await request.json();
  
  if (!email) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Email is required'
    }), { status: 400 });
  }

  try {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const userExists = result.rows.length > 0;

    return new Response(JSON.stringify({
      success: true,
      exists: userExists,
      message: userExists ? 'User exists' : 'User not found'
    }), { status: 200 });

  } catch (error) {
    console.error('Check user error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check user: ' + error.message
    }), { status: 500 });
  }
}