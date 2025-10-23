import { initDB } from './database.js';
import http from 'http';

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

// Create HTTP server for Render port binding
const server = http.createServer(async (req, res) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    // Convert Node.js request to Fetch API request
    let body = '';
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString();
    }

    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: body || null
    });

    // Handle the request using your existing logic
    const response = await handleRequest(request);

    // Set response headers
    const responseHeaders = { ...headers };
    for (const [key, value] of response.headers) {
      responseHeaders[key] = value;
    }

    // Send response
    res.writeHead(response.status, responseHeaders);
    const responseBody = await response.text();
    res.end(responseBody);

  } catch (error) {
    console.error('HTTP Server error:', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Start the HTTP server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 HTTP Server running on port ${PORT}`);
  console.log('✅ Render port binding successful');
  console.log('🚀 ALISHAN Backend with PostgreSQL is LIVE!');
});

// Render also requires this export for serverless
export async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  const response = await handleRequest(request);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  
  return response;
}

// Keep-alive heartbeat
setInterval(() => {
  console.log('💓 Server heartbeat:', new Date().toISOString());
}, 30000);

console.log('✅ ALISHAN Backend with PostgreSQL initialized successfully');