import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

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

// Main request handler for both Render and HTTP server
async function requestHandler(req, res) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }
  
  try {
    // Ensure directories exist
    await ensureDataDirectories();
    
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
    console.error('Request handling error:', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// Create HTTP server for port binding (REQUIRED FOR RENDER)
const server = http.createServer(requestHandler);

// Start the server
server.listen(PORT, () => {
  console.log(`✅ ALISHAN Backend initialized successfully`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Ready to handle API requests`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
});

// Render also requires this export for serverless
export async function handler(request) {
  await ensureDataDirectories();
  return await handleRequest(request);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});