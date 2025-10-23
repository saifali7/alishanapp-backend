import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables use karein
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting ALISHAN API in ${NODE_ENV} mode on port ${PORT}`);

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
    if (pathname === '/api/auth' && request.method === 'POST') {
      const authHandler = await import('./auth.js');
      return await authHandler.POST({ request });
    }
    
    else if (pathname === '/api/check-user' && request.method === 'POST') {
      const checkUserHandler = await import('./check-user.js');
      return await checkUserHandler.POST({ request });
    }
    
    else if (pathname === '/api/save-data') {
      const saveDataHandler = await import('./save-data.js');
      
      if (request.method === 'POST') {
        return await saveDataHandler.POST({ request });
      } else if (request.method === 'GET') {
        return await saveDataHandler.GET({ request });
      }
    }
    
    else if (pathname === '/api/save-profile') {
      const saveProfileHandler = await import('./save-profile.js');
      
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
        version: '1.0.0',
        environment: NODE_ENV,
        port: PORT
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

// Render keep-alive mechanism
console.log('✅ ALISHAN Backend initialized successfully');
console.log('📡 Server is ready to handle API requests');

// Keep the server alive for Render platform
if (process.env.NODE_ENV === 'production') {
  console.log('🔄 Setting up keep-alive for Render...');
  
  // Simple interval to keep process alive
  setInterval(() => {
    // Just keep the process running - no operation needed
  }, 60000); // Check every minute
  
  console.log('✅ Keep-alive activated for Render platform');
}

console.log('🚀 ALISHAN Backend successfully deployed on Render!');