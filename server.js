import { initDB } from './database.js';

const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting ALISHAN API in ${NODE_ENV} mode on port ${PORT}`);

// Initialize database on server start
await initDB();

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
        version: '2.0.0',
        environment: NODE_ENV,
        database: 'PostgreSQL'
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
  
  const response = await handleRequest(request);
  
  // Add CORS headers to response
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

console.log('✅ ALISHAN Backend with PostgreSQL initialized successfully');
console.log(`📊 Database: PostgreSQL (Render)`);
console.log(`🌐 Environment: ${NODE_ENV}`);




// Keep the server alive for Render
console.log('🔄 Setting up server keep-alive...');

// Simple interval to keep process alive
setInterval(() => {
  console.log('💓 Server heartbeat:', new Date().toISOString());
}, 30000); // Log every 30 seconds

console.log('🚀 ALISHAN Backend with PostgreSQL is LIVE!');

import http from 'http';

// Simple HTTP server for port binding
const server = http.createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({
      message: 'ALISHAN Backend API is running!',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL'
    }));
    return;
  }

  // For other routes, return not found
  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start the server
server.listen(10000, () => {
  console.log('🌐 HTTP Server running on port 10000');
  console.log('✅ Render port binding successful');
  console.log('🚀 ALISHAN Backend with PostgreSQL is LIVE!');
});

// Keep-alive for Render
setInterval(() => {
  console.log('💓 Server heartbeat:', new Date().toISOString());
}, 30000);