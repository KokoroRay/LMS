const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8081;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CloudFront Proxy Server Running' });
});

// CloudFront proxy endpoint
app.use('/cloudfront', createProxyMiddleware({
  target: 'https://d1ybhieu7adt5b.cloudfront.net',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/cloudfront': '' // Remove /cloudfront prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔗 Proxying CloudFront request: ${req.url}`);
    
    // Add development headers that Lambda@Edge might recognize
    proxyReq.setHeader('Origin', 'http://localhost:5174');
    proxyReq.setHeader('Referer', 'http://localhost:5174/');
    proxyReq.setHeader('X-Forwarded-For', '127.0.0.1');
    proxyReq.setHeader('X-Development', 'localhost');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 CloudFront-Proxy localhost-development');
    
    // Try to mimic browser behavior
    proxyReq.setHeader('Accept', '*/*');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Pragma', 'no-cache');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ CloudFront response: ${proxyRes.statusCode} for ${req.url}`);
    
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    
    // Remove problematic headers
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
  },
  onError: (err, req, res) => {
    console.error(`❌ CloudFront proxy error:`, err.message);
    res.status(500).json({
      error: 'CloudFront proxy failed',
      message: err.message,
      url: req.url
    });
  }
}));

// Direct CloudFront video endpoint for easier access
app.get('/video/:courseId/:lessonId/:videoUuid', async (req, res) => {
  const { courseId, lessonId, videoUuid } = req.params;
  const cloudFrontUrl = `https://d1ybhieu7adt5b.cloudfront.net/vod/hls/${courseId}_${lessonId}/${videoUuid}.m3u8`;
  
  console.log(`🎥 Video request: Course ${courseId}, Lesson ${lessonId}`);
  console.log(`🔗 CloudFront URL: ${cloudFrontUrl}`);
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(cloudFrontUrl, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/',
        'User-Agent': 'Mozilla/5.0 CloudFront-Proxy localhost-development',
        'Accept': '*/*',
        'X-Forwarded-For': '127.0.0.1',
        'X-Development': 'localhost'
      }
    });
    
    console.log(`📡 CloudFront response status: ${response.status}`);
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'CloudFront access failed',
        status: response.status,
        statusText: response.statusText,
        url: cloudFrontUrl
      });
    }
    
    // Forward the response
    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    const data = await response.text();
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    res.send(data);
    
  } catch (error) {
    console.error(`❌ Video proxy error:`, error);
    res.status(500).json({
      error: 'Video proxy failed',
      message: error.message,
      url: cloudFrontUrl
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CloudFront Proxy Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎥 Video endpoint: http://localhost:${PORT}/video/3/32/c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8`);
  console.log(`🔗 CloudFront proxy: http://localhost:${PORT}/cloudfront/vod/hls/3_32/c0f317b9-4cbb-4d19-b27c-3dbc0a18d0f8.m3u8`);
});