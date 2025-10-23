// server.js - Aapka original code with fixes
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import handlers correctly
async import('./auth.js').then(module => {
  authHandler = module;
});

async import('./save-data.js').then(module => {
  saveDataHandler = module;
});

async import('./save-profile.js').then(module => {
  saveProfileHandler = module;
});

async import('./check-user.js').then(module => {
  checkUserHandler = module;
});

let authHandler, saveDataHandler, saveProfileHandler, checkUserHandler;

// Ensure data directories exist
async function ensureDataDirectories() {
  const dirs = ['./user_data', './user_data/profiles'];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directory created: ${dir}`);
    } catch (error) {
      console.log(`📁 Directory exists: ${dir}`);
    }
  }
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Ensure handlers are loaded
    if (!authHandler || !saveDataHandler || !saveProfileHandler || !checkUserHandler) {
      await Promise.all([
        import('./auth.js').then(module => authHandler = module),
        import('./save-data.js').then(module => saveDataHandler = module),
        import('./save-profile.js').then(module => saveProfileHandler = module),
        import('./check-user.js').then(module => checkUserHandler = module)
      ]);
    }

    if (pathname === '/api/auth' && request.method === 'POST') {
      return await authHandler.POST({ request });
    }
    
    else if (pathname === '/api/check-user' && request.method === 'POST') {
      return await checkUserHandler.POST({ request });
    }
    
    else if (pathname === '/api/save-data') {
      if (request.method === 'POST') {
        return await saveDataHandler.POST({ request });
      } else if (request.method === 'GET') {
        return await saveDataHandler.GET({ request });
      }
    }
    
    else if (pathname === '/api/save-profile') {
      if (request.method === 'POST') {
        return await saveProfileHandler.POST({ request });
      } else if (request.method === 'GET') {
        return await saveProfileHandler.GET({ request });
      }
    }
    
    // Health check endpoint
    else if (pathname === '/' || pathname === '/health') {
      return new Response(JSON.stringify({
        message: 'ALISHAN Backend API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    else {
      return new Response(JSON.stringify({
        error: 'Endpoint not found',
        path: pathname
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error: ' + error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Render requires this export
export async function handler(request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  // Ensure directories exist
  await ensureDataDirectories();
  
  const response = await handleRequest(request);
  
  // Add CORS headers to response
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

// For local testing
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 10000;
  console.log(`🚀 Server would start on port ${port} in local environment`);
}