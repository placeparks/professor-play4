// Vercel Serverless Function for Stripe Webhook
// This is a standalone function that reads raw body before any parsing

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const handleWebhookEnhanced = require('./webhook-enhanced');

// Read raw body from request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (!req || typeof req.on !== 'function') {
      reject(new Error('Request is not a readable stream'));
      return;
    }
    
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    let rawBody;
    
    // Try to read raw body from request stream
    // This must happen BEFORE any body parsing
    if (req.readable && typeof req.on === 'function' && !req.readableEnded) {
      try {
        rawBody = await getRawBody(req);
        console.log('✅ Successfully read raw body from stream, length:', rawBody.length);
      } catch (streamError) {
        console.error('❌ Error reading from stream:', streamError);
        // Fall through to check if body is already available
      }
    }
    
    // If we couldn't read from stream, check if body is already a Buffer
    if (!rawBody) {
      if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;
        console.log('✅ Body is already a Buffer, length:', rawBody.length);
      } else if (typeof req.body === 'string') {
        rawBody = Buffer.from(req.body, 'utf8');
        console.log('✅ Body is a string, converted to Buffer, length:', rawBody.length);
      } else {
        // Body was parsed as JSON - we can't verify signature
        console.error('❌ Body was parsed as JSON. Cannot verify signature.');
        console.error('Body type:', typeof req.body);
        console.error('Body keys:', req.body && typeof req.body === 'object' ? Object.keys(req.body) : 'N/A');
        console.error('Request readable:', req.readable);
        console.error('Request readableEnded:', req.readableEnded);
        console.error('Request has on method:', typeof req.on === 'function');
        
        return res.status(400).json({
          error: 'Webhook payload must be provided as a string or a Buffer',
          code: 'INVALID_BODY_TYPE',
          message: 'Cannot read raw body. Vercel parsed the body before the handler could access it. The request stream may have already been consumed.',
          bodyType: typeof req.body,
          isBuffer: Buffer.isBuffer(req.body),
          suggestion: 'The webhook endpoint needs access to the raw request body for Stripe signature verification. This may require Vercel configuration changes.'
        });
      }
    }

    // Create a request object with raw body for the enhanced handler
    const mockReq = {
      method: req.method || 'POST',
      headers: req.headers || {},
      body: rawBody,
      url: req.url,
      originalUrl: req.originalUrl || req.url
    };

    // Pass to enhanced handler
    return handleWebhookEnhanced(mockReq, res);
  } catch (error) {
    console.error('❌ Error in webhook handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
