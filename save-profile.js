import { query } from './database.js';

export async function POST({ request }) {
  const { userId, userEmail, profileData } = await request.json();
  
  if (!userId || !profileData) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User ID and profile data are required'
    }), { status: 400 });
  }

  try {
    // Check if profile already exists
    const existingProfile = await query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      // Update existing profile
      await query(
        `UPDATE user_profiles 
         SET avatar = $1, settings = $2, updated_at = $3 
         WHERE user_id = $4`,
        [
          profileData.avatar,
          JSON.stringify(profileData.settings || {}),
          new Date().toISOString(),
          userId
        ]
      );
    } else {
      // Insert new profile
      await query(
        `INSERT INTO user_profiles (user_id, avatar, settings) 
         VALUES ($1, $2, $3)`,
        [
          userId,
          profileData.avatar,
          JSON.stringify(profileData.settings || {})
        ]
      );
    }

    console.log(`✅ Profile saved for user ${userId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile saved successfully'
    }), { status: 200 });

  } catch (error) {
    console.error('Save profile error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to save profile: ' + error.message
    }), { status: 500 });
  }
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'User ID is required'
    }), { status: 400 });
  }

  try {
    const result = await query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        profile: {
          userId: parseInt(userId),
          avatar: null,
          settings: {},
          updatedAt: new Date().toISOString()
        }
      }), { status: 200 });
    }

    const profile = result.rows[0];
    const profileData = {
      userId: profile.user_id,
      avatar: profile.avatar,
      settings: profile.settings || {},
      updatedAt: profile.updated_at
    };

    return new Response(JSON.stringify({
      success: true,
      profile: profileData
    }), { status: 200 });

  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to load profile: ' + error.message
    }), { status: 500 });
  }
}