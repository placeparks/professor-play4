// Stripe Checkout API Endpoint
// This handles creating Stripe checkout sessions for custom card orders

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client only if credentials are provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY && 
    !process.env.SUPABASE_URL.includes('your-project')) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
} else {
  console.warn('⚠️ Supabase not configured - image uploads will be skipped');
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64String) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Helper function to get file extension from base64
function getExtensionFromBase64(base64String) {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : 'png';
}

// Upload images to Supabase Storage organized by card (front + back together)
async function uploadImagesToStorage(cardData, orderId, shippingAddress) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  const uploadedUrls = [];
  const bucketName = 'order-images';
  
  // Create folder structure: order-images/{orderId}/{timestamp}/{country_postal}/
  const timestamp = Date.now();
  const addressHash = shippingAddress 
    ? `${shippingAddress.country}_${(shippingAddress.postal_code || 'unknown').replace(/\s+/g, '_')}`
    : 'unknown';
  
  const baseFolderPath = `${orderId}/${timestamp}/${addressHash}`;

  // Upload each card's front and back in its own folder
  for (let cardIndex = 0; cardIndex < cardData.length; cardIndex++) {
    const card = cardData[cardIndex];
    const cardFolder = `${baseFolderPath}/card-${cardIndex + 1}`;
    
    // Upload front image
    if (card.front) {
      try {
        const imageData = card.front;
        
        // Skip if already a URL (not base64)
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
          uploadedUrls.push(imageData);
        } else {
          // Convert base64 to buffer
          const buffer = base64ToBuffer(imageData);
          const extension = getExtensionFromBase64(imageData);
          const filePath = `${cardFolder}/front.${extension}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            });
          
          if (error) {
            console.error(`Error uploading front image for card ${cardIndex + 1}:`, error);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing front image for card ${cardIndex + 1}:`, error);
      }
    }
    
    // Upload back image
    if (card.back) {
      try {
        const imageData = card.back;
        
        // Skip if already a URL (not base64)
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
          uploadedUrls.push(imageData);
        } else {
          // Convert base64 to buffer
          const buffer = base64ToBuffer(imageData);
          const extension = getExtensionFromBase64(imageData);
          const filePath = `${cardFolder}/back.${extension}`;
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            });
          
          if (error) {
            console.error(`Error uploading back image for card ${cardIndex + 1}:`, error);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing back image for card ${cardIndex + 1}:`, error);
      }
    }
  }
  
  return uploadedUrls;
}

// Pricing tiers
const PRICING_TIERS = {
  starter: { min: 1, max: 144, price: 0.35 },
  playtest: { min: 145, max: 500, price: 0.30 },
  bulk: { min: 501, max: Infinity, price: 0.26 }
};

// Shipping costs
const SHIPPING_COSTS = {
  US: 6.95,
  WORLDWIDE: 24.95
};

// Allowed shipping countries
const ALLOWED_COUNTRIES = [
  'US', 'CA', 'MX', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ', 
  'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'GR', 
  'CY', 'MT', 'LU', 'AU', 'NZ', 'JP', 'SG', 'HK', 'KR', 'TW', 
  'MY', 'TH', 'PH', 'ID', 'VN', 'IN', 'AE', 'SA', 'IL', 'TR', 
  'ZA', 'BR', 'AR', 'CL', 'PE', 'CO'
];

// Calculate price per card based on quantity
function getPricePerCard(quantity) {
  if (quantity >= PRICING_TIERS.bulk.min) {
    return PRICING_TIERS.bulk.price;
  } else if (quantity >= PRICING_TIERS.playtest.min) {
    return PRICING_TIERS.playtest.price;
  } else {
    return PRICING_TIERS.starter.price;
  }
}

// Get shipping cost based on country
function getShippingCost(country) {
  return country === 'US' ? SHIPPING_COSTS.US : SHIPPING_COSTS.WORLDWIDE;
}

// Retry helper with exponential backoff
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isCloudflareError = error?.message?.includes('520') || 
                                error?.message?.includes('Cloudflare') ||
                                error?.message?.includes('<!DOCTYPE html>');
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on network/Cloudflare errors, not validation errors
      if (isCloudflareError || error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`⚠️ Retry attempt ${attempt}/${maxRetries} after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Don't retry on validation/authentication errors
      throw error;
    }
  }
}

// Save order details to database
async function saveOrderToDatabase(orderData) {
  try {
    // If we have uploaded URLs, don't store base64 to reduce payload size
    const hasUploadedUrls = (orderData.card_images && orderData.card_images.length > 0 && 
                            orderData.card_images[0]?.startsWith?.('http'));
    
    // Only include base64 if we don't have URLs (as backup)
    const cardImagesBase64 = hasUploadedUrls ? [] : (orderData.card_images_base64 || orderData.cardImagesBase64 || []);
    
    // Limit base64 size if we must include it (store only first image as sample)
    const limitedBase64 = cardImagesBase64.length > 0 
      ? [cardImagesBase64[0]] // Only store first image as backup
      : [];
    
    // Ensure shipping_address is a JSON string if it's an object
    let shippingAddress = orderData.shippingAddress;
    if (shippingAddress && typeof shippingAddress === 'object') {
      shippingAddress = JSON.stringify(shippingAddress);
    }
    
    // Ensure billing_address is a JSON string if it's an object
    let billingAddress = orderData.billingAddress || null;
    if (billingAddress && typeof billingAddress === 'object') {
      billingAddress = JSON.stringify(billingAddress);
    }
    
    const insertData = {
      stripe_session_id: orderData.stripeSessionId,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName,
      customer_phone: orderData.customerPhone || null,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      total_amount_cents: orderData.totalAmountCents,
      currency: orderData.currency || 'usd',
      quantity: orderData.quantity,
      price_per_card: orderData.pricePerCard,
      shipping_cost_cents: orderData.shippingCostCents,
      shipping_country: orderData.shippingCountry,
      card_images: orderData.card_images || orderData.cardImages || [],
      card_images_base64: limitedBase64, // Reduced payload - only first image as backup
      card_data: orderData.card_data || orderData.cardData || [],
      front_image_urls: orderData.front_image_urls || orderData.frontImageUrls || [],
      back_image_urls: orderData.back_image_urls || orderData.backImageUrls || [],
      image_storage_path: orderData.image_storage_path || orderData.imageStoragePath || null,
      status: 'pending',
      payment_status: 'pending',
      metadata: orderData.metadata || {}
    };

    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Calculate payload size for logging
    const payloadSize = JSON.stringify(insertData).length;
    const payloadSizeKB = (payloadSize / 1024).toFixed(2);
    console.log(`📦 Saving order to database (payload: ${payloadSizeKB} KB)...`);
    
    // Use retry logic for database operations
    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('orders')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Check if it's a Cloudflare error
        const isCloudflareError = error?.message?.includes('520') || 
                                  error?.message?.includes('Cloudflare') ||
                                  error?.message?.includes('<!DOCTYPE html>');
        
        if (isCloudflareError) {
          console.error('❌ Cloudflare 520 error from Supabase - connection issue');
          console.error('💡 This usually means:');
          console.error('   1. Supabase API is temporarily unavailable');
          console.error('   2. Request payload might be too large');
          console.error('   3. Network connectivity issue');
          throw new Error(`Cloudflare connection error: ${error.message?.substring(0, 200)}`);
        }
        
        console.error('❌ Error saving order to database:', error);
        throw error;
      }

      return data;
    }, 3, 1000); // 3 retries, starting with 1 second delay

    console.log('✅ Order saved to database:', result.id);
    return result;
  } catch (error) {
    // Check if it's a Cloudflare error
    const isCloudflareError = error?.message?.includes('520') || 
                              error?.message?.includes('Cloudflare') ||
                              error?.message?.includes('<!DOCTYPE html>');
    
    if (isCloudflareError) {
      console.error('❌ Failed to save order (Cloudflare 520 error - Supabase connection issue):', {
        message: error.message?.substring(0, 200),
        hint: 'This is usually a temporary network issue. The checkout session was created successfully.'
      });
    } else {
      console.error('❌ Failed to save order:', error);
    }
    throw error;
  }
}

// Main checkout handler
async function createCheckoutSession(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check request body size (Vercel has 4.5MB limit)
  // In Vercel serverless, use req.headers instead of req.get()
  const contentLength = req.headers['content-length'] || req.headers['Content-Length'];
  if (contentLength) {
    const sizeMB = parseInt(contentLength) / (1024 * 1024);
    if (sizeMB > 4.5) {
      console.error(`❌ Request body too large: ${sizeMB.toFixed(2)} MB (Vercel limit: 4.5 MB)`);
      return res.status(413).json({ 
        error: 'Payload too large',
        message: `Request body is ${sizeMB.toFixed(2)} MB, but Vercel has a 4.5 MB limit. Please reduce the number of cards or image quality.`,
        sizeMB: sizeMB.toFixed(2),
        limitMB: 4.5
      });
    }
    console.log(`📦 Request body size: ${sizeMB.toFixed(2)} MB`);
  }

  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Stripe secret key not configured'
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Supabase credentials are not set');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Supabase credentials not configured'
    });
  }

  try {
    console.log('📨 Checkout request received:', {
      bodySize: JSON.stringify(req.body).length,
      hasCardImages: !!req.body.cardImages,
      cardImagesCount: req.body.cardImages?.length || 0,
      hasCardData: !!req.body.cardData,
      cardDataCount: req.body.cardData?.length || 0,
      quantity: req.body.quantity,
      cardDataSample: req.body.cardData?.slice(0, 2).map(c => ({
        hasFront: !!c.front,
        hasBack: !!c.back,
        frontIndex: c.frontIndex,
        backIndex: c.backIndex
      })) || []
    });

    const {
      quantity,
      shippingAddress,
      cardImages,
      cardData
    } = req.body;
    
    // Check if images are already uploaded (URLs instead of base64)
    const imagesAlreadyUploaded = cardImages && cardImages.length > 0 && 
                                  typeof cardImages[0] === 'string' && 
                                  cardImages[0].startsWith('http');
    
    if (imagesAlreadyUploaded) {
      console.log('✅ Images already uploaded, using provided URLs');
    }

    // Validate required fields
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    if (!shippingAddress || !shippingAddress.email || !shippingAddress.name || 
        !shippingAddress.line1 || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.postal_code || 
        !shippingAddress.country) {
      return res.status(400).json({ error: 'Invalid shipping address' });
    }

    // Handle "OTHER" country option (map to a default international country)
    let shippingCountry = shippingAddress.country;
    if (shippingCountry === 'OTHER') {
      shippingCountry = 'GB'; // Default to UK for international shipping
    }

    // Validate country
    if (!ALLOWED_COUNTRIES.includes(shippingCountry)) {
      return res.status(400).json({ error: 'Shipping not available to this country' });
    }

    // Calculate pricing
    const pricePerCard = getPricePerCard(quantity);
    const cardsTotal = pricePerCard * quantity;
    const shippingCost = getShippingCost(shippingCountry);
    const totalAmount = cardsTotal + shippingCost;

    // Convert to cents for Stripe
    const totalAmountCents = Math.round(totalAmount * 100);
    const shippingCostCents = Math.round(shippingCost * 100);

    // Generate temporary order ID for image organization
    const tempOrderId = `temp_${uuidv4()}`;

    // Upload images organized by card (front + back in same folder)
    let frontImageUrls = [];
    let backImageUrls = [];
    let allImageUrls = [];
    let processedCardData = cardData || [];
    
    // If images are already uploaded (URLs provided), use them directly
    if (imagesAlreadyUploaded && cardImages && cardImages.length > 0) {
      console.log('✅ Using pre-uploaded image URLs');
      allImageUrls = cardImages;
      
      // Extract front and back URLs from cardData if available
      if (cardData && cardData.length > 0) {
        processedCardData = cardData.map((card, index) => {
          const updatedCard = { ...card };
          
          // URLs are in order: [front1, back1, front2, back2, ...]
          const frontUrlIndex = index * 2;
          const backUrlIndex = index * 2 + 1;
          
          if (allImageUrls[frontUrlIndex]) {
            updatedCard.frontUrl = allImageUrls[frontUrlIndex];
            frontImageUrls.push(allImageUrls[frontUrlIndex]);
          }
          
          if (allImageUrls[backUrlIndex]) {
            updatedCard.backUrl = allImageUrls[backUrlIndex];
            backImageUrls.push(allImageUrls[backUrlIndex]);
          }
          
          return updatedCard;
        });
      }
    } else if (cardData && cardData.length > 0) {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
        try {
          // Upload images organized by card (each card gets its own folder)
          allImageUrls = await uploadImagesToStorage(
            cardData,
            tempOrderId,
            shippingAddress
          );
          
          // Extract front and back URLs from the uploaded URLs
          // URLs are in order: [front1, back1, front2, back2, ...]
          if (allImageUrls.length > 0) {
            processedCardData = cardData.map((card, index) => {
              const updatedCard = { ...card };
              
              // Front URL is at index * 2 (0, 2, 4, ...)
              // Back URL is at index * 2 + 1 (1, 3, 5, ...)
              const frontUrlIndex = index * 2;
              const backUrlIndex = index * 2 + 1;
              
              if (allImageUrls[frontUrlIndex]) {
                updatedCard.frontUrl = allImageUrls[frontUrlIndex];
                frontImageUrls.push(allImageUrls[frontUrlIndex]);
              }
              
              if (allImageUrls[backUrlIndex]) {
                updatedCard.backUrl = allImageUrls[backUrlIndex];
                backImageUrls.push(allImageUrls[backUrlIndex]);
              }
              
              return updatedCard;
            });
            
            console.log(`✅ Uploaded ${allImageUrls.length} images to storage (organized by card)`);
            console.log(`📊 Separated images: ${frontImageUrls.length} fronts, ${backImageUrls.length} backs`);
          }
        } catch (uploadError) {
          console.error('⚠️ Error uploading images to storage (continuing with base64):', uploadError.message);
          // Continue with checkout even if image upload fails
          // Images will be stored as base64 in metadata as fallback
        }
      } else {
        console.log('⚠️ Supabase not configured - skipping image upload, will use base64');
        // Supabase not configured, will store base64 in database
      }
    }

    // Use uploaded URLs if available, otherwise fall back to base64
    // For Stripe, use first front image as preview
    const firstFrontImage = processedCardData.length > 0 && processedCardData[0].front
      ? processedCardData[0].front
      : (cardImages && cardImages.length > 0 ? cardImages[0] : null);
    
    const imagesForStripe = frontImageUrls.length > 0 
      ? [frontImageUrls[0]] 
      : (firstFrontImage && typeof firstFrontImage === 'string' && firstFrontImage.startsWith('http')
          ? [firstFrontImage]
          : []);

    // Create Stripe checkout session
    // Ensure we have a valid URL with scheme
    let origin = req.headers.origin || 'http://localhost:3001';
    
    // If origin doesn't have a scheme, try to extract from referer or use default
    if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
      const referer = req.headers.referer;
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          origin = `${refererUrl.protocol}//${refererUrl.host}`;
        } catch {
          origin = 'http://localhost:3001';
        }
      } else {
        origin = 'http://localhost:3001';
      }
    }
    
    console.log('🌐 Using origin for checkout:', origin);
    
    // Prepare metadata - Stripe has 500 character limit per metadata value
    // Store only essential data in metadata, full data will be in database
    const metadata = {
      quantity: quantity.toString(),
      pricePerCard: pricePerCard.toString(),
      shippingCountry: shippingCountry,
      tempOrderId: tempOrderId,
      hasImages: (allImageUrls.length > 0 || (cardImages && cardImages.length > 0)) ? 'true' : 'false',
      imageCount: (allImageUrls.length > 0 ? allImageUrls.length : cardImages?.length || 0).toString()
    };

    // Only add image storage path if it exists and fits
    if (allImageUrls.length > 0 && tempOrderId.length < 100) {
      metadata.imageStoragePath = tempOrderId;
    }

    // Note: Full image data (URLs and base64) will be stored in database, not Stripe metadata
    // This avoids Stripe's 500 character limit per metadata value

    console.log('💳 Creating Stripe checkout session...', {
      quantity,
      totalAmountCents,
      shippingCountry,
      imageUrlsCount: allImageUrls.length,
      frontImagesCount: frontImageUrls.length,
      backImagesCount: backImageUrls.length,
      hasBase64Images: !!(cardImages && cardImages.length > 0)
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Custom Card Order - ${quantity} cards`,
              description: `Premium S33 cardstock custom cards (${quantity} cards @ $${pricePerCard.toFixed(2)}/card)`,
              images: imagesForStripe.length > 0 && typeof imagesForStripe[0] === 'string' && imagesForStripe[0].startsWith('http') 
                ? [imagesForStripe[0]] 
                : [] // Only use HTTP URLs, not base64
            },
            unit_amount: Math.round(pricePerCard * 100),
          },
          quantity: quantity,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Shipping',
              description: shippingCountry === 'US' 
                ? 'Standard Shipping (US)' 
                : 'International Shipping'
            },
            unit_amount: shippingCostCents,
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing-view`,
      customer_email: shippingAddress.email,
      shipping_address_collection: {
        allowed_countries: ALLOWED_COUNTRIES,
      },
      metadata: metadata
    });

    console.log('✅ Stripe checkout session created:', session.id);

    // Save order to database (pending payment) - only if Supabase is configured
    if (supabase) {
      try {
        await saveOrderToDatabase({
          stripeSessionId: session.id,
          customerEmail: shippingAddress.email,
          customerName: shippingAddress.name,
          customerPhone: shippingAddress.phone || null,
          shippingAddress: {
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 || null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal_code,
            country: shippingAddress.country
          },
          totalAmountCents: totalAmountCents,
          currency: 'usd',
          quantity: quantity,
          pricePerCard: pricePerCard,
          shippingCostCents: shippingCostCents,
          shippingCountry: shippingCountry,
          card_images: allImageUrls.length > 0 ? allImageUrls : (cardImages || []), // Store all image URLs (front + back) if uploaded
          card_images_base64: processedCardData.length > 0 
            ? processedCardData.flatMap(card => [card.front, card.back].filter(Boolean))
            : (cardImages || []), // Keep base64 as backup
          card_data: processedCardData, // Store card data with URL mappings
          // Additional fields for easy admin dashboard access
          front_image_urls: frontImageUrls.length > 0 ? frontImageUrls : [],
          back_image_urls: backImageUrls.length > 0 ? backImageUrls : [],
          image_storage_path: allImageUrls.length > 0 ? `${session.id}` : null, // Use session ID for final path
          metadata: {
            created_at: new Date().toISOString(),
            tempOrderId: tempOrderId // Store temp ID for reference
          }
        });
      } catch (dbError) {
        console.error('Failed to save order to database, but checkout session created:', dbError);
        // Continue even if database save fails
      }
    } else {
      console.warn('⚠️ Supabase not configured - order not saved to database');
    }

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Checkout error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      type: error.type,
      statusCode: error.statusCode
    });
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid checkout request',
        message: error.message,
        code: 'STRIPE_INVALID_REQUEST'
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Payment service configuration error',
        message: 'Stripe authentication failed. Please check server configuration.',
        code: 'STRIPE_AUTH_ERROR'
      });
    }
    
    // Return more detailed error information
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      code: error.code || error.type || 'CHECKOUT_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: {
          name: error.name,
          type: error.type,
          statusCode: error.statusCode
        }
      })
    });
  }
}

module.exports = createCheckoutSession;

