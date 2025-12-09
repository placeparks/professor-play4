// Enhanced Stripe Webhook Handler
// Adapted from Next.js version to Node.js/Express

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Enhanced logging and error handling system for webhook processing
 */

// Log levels for different types of events
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Error categories for better monitoring and alerting
const ErrorCategory = {
  SIGNATURE_VERIFICATION: 'SIGNATURE_VERIFICATION',
  EVENT_PARSING: 'EVENT_PARSING',
  INVENTORY_UPDATE: 'INVENTORY_UPDATE',
  CUSTOMER_DATA: 'CUSTOMER_DATA',
  WEBHOOK_PROCESSING: 'WEBHOOK_PROCESSING',
  RATE_LIMITING: 'RATE_LIMITING',
  EXTERNAL_API: 'EXTERNAL_API',
  CONSENT_PROCESSING: 'CONSENT_PROCESSING',
  DATABASE: 'DATABASE'
};

// Performance monitoring interface
function startPerformanceMonitoring(eventId, eventType, sessionId) {
  return {
    startTime: Date.now(),
    eventId,
    eventType,
    sessionId
  };
}

function completePerformanceMonitoring(metrics, operation, correlationId, success = true) {
  const duration = Date.now() - metrics.startTime;
  
  logEvent({
    level: success ? LogLevel.INFO : LogLevel.WARN,
    message: `Operation ${operation} completed in ${duration}ms`,
    eventId: metrics.eventId,
    sessionId: metrics.sessionId,
    performance: { duration, operation },
    data: { success, eventType: metrics.eventType }
  }, correlationId);

  // Log performance warnings for slow operations
  if (duration > 5000) {
    logEvent({
      level: LogLevel.WARN,
      category: ErrorCategory.WEBHOOK_PROCESSING,
      message: `Slow webhook operation detected: ${operation} took ${duration}ms`,
      eventId: metrics.eventId,
      sessionId: metrics.sessionId,
      data: { operation, duration, threshold: 5000 }
    }, correlationId);
  }
}

/**
 * Generate a correlation ID for tracking requests across functions
 */
function generateCorrelationId() {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced structured logging function
 */
function logEvent(entry, correlationId) {
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    correlationId
  };

  const logMessage = `[${logEntry.level}] ${logEntry.message}`;
  const logData = {
    timestamp: logEntry.timestamp,
    level: logEntry.level,
    category: logEntry.category,
    eventId: logEntry.eventId,
    sessionId: logEntry.sessionId,
    correlationId: logEntry.correlationId,
    message: logEntry.message,
    ...(logEntry.data && { context: logEntry.data }),
    ...(logEntry.error && { error: logEntry.error }),
    ...(logEntry.performance && { metrics: logEntry.performance })
  };

  switch (entry.level) {
    case LogLevel.INFO:
      console.log(logMessage, logData);
      break;
    case LogLevel.WARN:
      console.warn(logMessage, logData);
      break;
    case LogLevel.ERROR:
      console.error(logMessage, logData);
      break;
    case LogLevel.CRITICAL:
      console.error(`🚨 ${logMessage}`, logData);
      break;
  }
}

/**
 * Enhanced error logging with categorization and context
 */
function logError(category, message, error, correlationId, context) {
  let errorInfo;
  
  if (error instanceof Error) {
    errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  } else if (typeof error === 'object' && error !== null) {
    try {
      errorInfo = {
        message: JSON.stringify(error),
        type: typeof error,
        constructor: error.constructor?.name || 'Unknown'
      };
    } catch (jsonError) {
      errorInfo = {
        message: String(error),
        type: typeof error,
        serializationError: 'Failed to serialize error object'
      };
    }
  } else {
    errorInfo = { 
      message: String(error),
      type: typeof error
    };
  }

  logEvent({
    level: LogLevel.ERROR,
    category,
    message,
    error: errorInfo,
    data: context
  }, correlationId);
}

/**
 * Retry and Idempotency System for Webhook Processing
 */

// Retry configuration interface
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  retryableErrors: [
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'NETWORK_ERROR',
    'RATE_LIMITED'
  ]
};

/**
 * Check if a webhook event has already been processed (idempotency check)
 */
async function isEventAlreadyProcessed(eventId, correlationId) {
  try {
    logEvent({
      level: LogLevel.INFO,
      message: 'Checking event idempotency',
      eventId,
      data: { operation: 'idempotency_check' }
    }, correlationId);

    // Check if this event exists in Supabase
    const { data, error } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('id', eventId)
      .single();
    
    const isProcessed = !!data && !error;
    
    logEvent({
      level: LogLevel.INFO,
      message: `Event idempotency check result: ${isProcessed ? 'already processed' : 'new event'}`,
      eventId,
      data: { isProcessed }
    }, correlationId);
    
    return isProcessed;
    
  } catch (error) {
    logError(
      ErrorCategory.WEBHOOK_PROCESSING,
      'Error checking event idempotency',
      error,
      correlationId,
      { eventId, operation: 'idempotency_check' }
    );
    
    return false; // Assume not processed to avoid blocking legitimate events
  }
}

/**
 * Mark a webhook event as processed (for idempotency tracking)
 */
async function markEventAsProcessed(eventId, eventType, correlationId) {
  try {
    logEvent({
      level: LogLevel.INFO,
      message: 'Marking event as processed',
      eventId,
      data: { eventType, operation: 'mark_processed' }
    }, correlationId);

    // Insert the event into Supabase
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        id: eventId,
        type: eventType,
        processed_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }
    
    logEvent({
      level: LogLevel.INFO,
      message: 'Successfully marked event as processed',
      eventId,
      data: { eventType }
    }, correlationId);
    
  } catch (error) {
    logError(
      ErrorCategory.WEBHOOK_PROCESSING,
      'Error marking event as processed',
      error,
      correlationId,
      { eventId, eventType, operation: 'mark_processed' }
    );
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error, config) {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const errorWithCode = error;
  const errorCode = errorWithCode.code;
  return config.retryableErrors.some(retryableCode => 
    errorCode === retryableCode || 
    error.message.includes(retryableCode) ||
    error.name.includes(retryableCode)
  );
}

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateRetryDelay(attempt, config) {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialBase, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  const finalDelay = Math.max(100, cappedDelay + jitter);
  
  return Math.round(finalDelay);
}

/**
 * Execute an operation with retry logic and exponential backoff
 */
async function executeWithRetry(operation, operationName, correlationId, config = DEFAULT_RETRY_CONFIG, context) {
  let lastError = new Error('Operation failed');
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      logEvent({
        level: LogLevel.INFO,
        message: `Executing ${operationName} (attempt ${attempt}/${config.maxAttempts})`,
        data: { 
          operation: operationName,
          attempt,
          maxAttempts: config.maxAttempts,
          ...context
        }
      }, correlationId);
      
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;
      
      logEvent({
        level: LogLevel.INFO,
        message: `${operationName} succeeded on attempt ${attempt}`,
        data: { 
          operation: operationName,
          attempt,
          duration,
          success: true,
          ...context
        }
      }, correlationId);
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      const isRetryable = isRetryableError(error, config);
      const isLastAttempt = attempt === config.maxAttempts;
      
      logEvent({
        level: isLastAttempt ? LogLevel.ERROR : LogLevel.WARN,
        message: `${operationName} failed on attempt ${attempt}${isRetryable ? ' (retryable)' : ' (non-retryable)'}`,
        data: { 
          operation: operationName,
          attempt,
          maxAttempts: config.maxAttempts,
          isRetryable,
          isLastAttempt,
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          ...context
        }
      }, correlationId);
      
      if (!isRetryable || isLastAttempt) {
        break;
      }
      
      const delayMs = calculateRetryDelay(attempt, config);
      
      logEvent({
        level: LogLevel.INFO,
        message: `Retrying ${operationName} in ${delayMs}ms`,
        data: { 
          operation: operationName,
          attempt: attempt + 1,
          delayMs,
          ...context
        }
      }, correlationId);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  logError(
    ErrorCategory.WEBHOOK_PROCESSING,
    `${operationName} failed after ${config.maxAttempts} attempts`,
    lastError,
    correlationId,
    { operation: operationName, maxAttempts: config.maxAttempts, ...context }
  );
  
  throw lastError;
}

/**
 * Update order in database after payment
 */
async function updateOrderAfterPayment(session) {
  try {
    // Retrieve the full session with line items
    // Note: shipping_details cannot be expanded, but it's included by default
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer']
    });

    // Get order from database
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();

    // Prepare order update data
    // Only update fields that should change, preserve existing data if Stripe doesn't provide it
    const orderUpdate = {
      payment_status: session.payment_status,
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
      updated_at: new Date().toISOString()
    };

    // Only update these fields if they exist in the session
    if (session.customer_details?.email || session.customer_email) {
      orderUpdate.customer_email = session.customer_details?.email || session.customer_email;
    }
    if (session.customer_details?.name) {
      orderUpdate.customer_name = session.customer_details?.name;
    }
    if (session.customer_details?.phone) {
      orderUpdate.customer_phone = session.customer_details?.phone;
    }
    // Only update shipping_address if Stripe provides it, otherwise keep existing
    if (session.shipping_details?.address) {
      orderUpdate.shipping_address = session.shipping_details.address;
    }
    if (session.customer_details?.address) {
      orderUpdate.billing_address = session.customer_details.address;
    }
    if (session.amount_total) {
      orderUpdate.total_amount_cents = session.amount_total;
    }
    if (session.shipping_cost?.amount_total) {
      orderUpdate.shipping_cost_cents = session.shipping_cost.amount_total;
    }

    if (existingOrder) {
      // Update existing order - only update fields that are provided
      const { data, error } = await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('stripe_session_id', session.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      return data;
    } else {
      // Create new order if it doesn't exist
      const { data, error } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          ...orderUpdate,
          quantity: parseInt(session.metadata?.quantity || '0'),
          price_per_card: parseFloat(session.metadata?.pricePerCard || '0'),
          shipping_country: session.metadata?.shippingCountry || session.shipping_details?.address?.country,
          card_images: session.metadata?.cardImages ? JSON.parse(session.metadata.cardImages) : [],
          card_images_base64: session.metadata?.cardImagesBase64 ? JSON.parse(session.metadata.cardImagesBase64) : [],
          card_data: session.metadata?.cardData ? JSON.parse(session.metadata.cardData) : [],
          image_storage_path: session.metadata?.imageStoragePath || null,
          metadata: session.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Failed to update order after payment:', error);
    throw error;
  }
}

/**
 * Handle payment intent succeeded events
 */
async function handlePaymentIntentSucceeded(paymentIntent, correlationId) {
  logEvent({
    level: LogLevel.INFO,
    message: 'Processing payment_intent.succeeded',
    eventId: paymentIntent.id,
    data: { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    }
  }, correlationId);

  // Payment intent success is already handled by checkout.session.completed
  // This is here for additional processing if needed
}

/**
 * Handle completed checkout sessions
 */
async function handleCheckoutSessionCompleted(session, correlationId) {
  const sessionMetrics = startPerformanceMonitoring(session.id, 'checkout.session.completed', session.id);
  
  logEvent({
    level: LogLevel.INFO,
    message: 'Processing completed checkout session',
    eventId: session.id,
    sessionId: session.id,
    data: { amount: session.amount_total, currency: session.currency }
  }, correlationId);
  
  try {
    // Extract purchase details from session
    const quantity = parseInt(session.metadata?.quantity || '1', 10);
    const customerEmail = session.customer_details?.email;
    
    logEvent({
      level: LogLevel.INFO,
      message: 'Extracted purchase details from session',
      eventId: session.id,
      sessionId: session.id,
      data: {
        quantity,
        customerEmail: customerEmail ? 'present' : 'missing',
        amount: session.amount_total,
        paymentStatus: session.payment_status
      }
    }, correlationId);

    // Update order in database
    await executeWithRetry(
      () => updateOrderAfterPayment(session),
      'update_order_after_payment',
      correlationId,
      DEFAULT_RETRY_CONFIG,
      { sessionId: session.id }
    );
    
    completePerformanceMonitoring(sessionMetrics, 'checkout_session_completed', correlationId, true);
    
    logEvent({
      level: LogLevel.INFO,
      message: 'Checkout session processed successfully',
      eventId: session.id,
      sessionId: session.id,
      data: { quantity, amount: session.amount_total }
    }, correlationId);
    
  } catch (error) {
    completePerformanceMonitoring(sessionMetrics, 'checkout_session_completed', correlationId, false);
    
    logError(
      ErrorCategory.WEBHOOK_PROCESSING,
      'Error processing checkout session',
      error,
      correlationId,
      { 
        sessionId: session.id,
        amount: session.amount_total,
        paymentStatus: session.payment_status
      }
    );
    throw error;
  }
}

/**
 * Main webhook handler
 */
async function handleWebhook(req, res) {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  
  logEvent({
    level: LogLevel.INFO,
    message: 'Webhook request received',
    data: { 
      method: 'POST',
      userAgent: req.headers['user-agent'],
      contentLength: req.headers['content-length']
    }
  }, correlationId);

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    logError(
      ErrorCategory.SIGNATURE_VERIFICATION,
      'Missing Stripe signature header',
      new Error('stripe-signature header not found'),
      correlationId,
      { headers: req.headers }
    );
    
    return res.status(400).json({ 
      error: 'Missing Stripe signature',
      code: 'MISSING_SIGNATURE',
      correlationId
    });
  }

  if (!webhookSecret) {
    logError(
      ErrorCategory.SIGNATURE_VERIFICATION,
      'STRIPE_WEBHOOK_SECRET environment variable not configured',
      new Error('Missing webhook secret configuration'),
      correlationId,
      { environment: process.env.NODE_ENV }
    );
    
    return res.status(500).json({ 
      error: 'Webhook secret not configured',
      code: 'WEBHOOK_SECRET_MISSING',
      correlationId
    });
  }

  // Ensure we have the raw body as a Buffer or string
  // On Vercel, req.body might be parsed as JSON, so we need to handle it
  let rawBody = req.body;
  
  // Check if body is already a Buffer (from express.raw())
  if (Buffer.isBuffer(rawBody)) {
    // Good, we have the raw body
  } else if (typeof rawBody === 'string') {
    // Also good, convert to Buffer
    rawBody = Buffer.from(rawBody, 'utf8');
  } else if (typeof rawBody === 'object' && rawBody !== null) {
    // Body was parsed as JSON - this shouldn't happen but we need to handle it
    // Try to get raw body from request stream if available
    logError(
      ErrorCategory.SIGNATURE_VERIFICATION,
      'Webhook body was parsed as JSON instead of raw',
      new Error('Body is an object, not raw Buffer'),
      correlationId,
      { 
        bodyType: typeof rawBody,
        isBuffer: Buffer.isBuffer(rawBody),
        bodyKeys: Object.keys(rawBody || {})
      }
    );
    
    return res.status(400).json({ 
      error: 'Webhook payload must be provided as a string or a Buffer',
      code: 'INVALID_BODY_TYPE',
      message: 'Body was parsed as JSON. Ensure express.raw() middleware is applied to /api/webhook route.',
      correlationId
    });
  }

  let event;

  try {
    // Verify the webhook signature with raw body
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    );
    
    logEvent({
      level: LogLevel.INFO,
      message: 'Webhook signature verified successfully',
      eventId: event.id,
      data: { eventType: event.type }
    }, correlationId);

  } catch (err) {
    logError(
      ErrorCategory.SIGNATURE_VERIFICATION,
      'Webhook signature verification failed',
      err,
      correlationId,
      { 
        signatureLength: sig.length,
        bodyLength: rawBody ? (Buffer.isBuffer(rawBody) ? rawBody.length : rawBody.length) : 0,
        bodyType: typeof rawBody,
        isBuffer: Buffer.isBuffer(rawBody),
        secretConfigured: !!webhookSecret
      }
    );
    
    return res.status(400).json({ 
      error: 'Webhook signature verification failed',
      code: 'SIGNATURE_VERIFICATION_FAILED',
      correlationId
    });
  }

  // Start performance monitoring for event processing
  const performanceMetrics = startPerformanceMonitoring(event.id, event.type);

  logEvent({
    level: LogLevel.INFO,
    message: `Processing Stripe webhook event: ${event.type}`,
    eventId: event.id,
    data: { 
      eventType: event.type,
      livemode: event.livemode,
      apiVersion: event.api_version,
      created: new Date(event.created * 1000).toISOString()
    }
  }, correlationId);

  try {
    // Check for idempotency
    const alreadyProcessed = await executeWithRetry(
      () => isEventAlreadyProcessed(event.id, correlationId),
      'idempotency_check',
      correlationId,
      { maxAttempts: 2, baseDelayMs: 500, maxDelayMs: 2000, exponentialBase: 2, retryableErrors: ['ECONNRESET', 'ETIMEDOUT'] },
      { eventId: event.id, eventType: event.type }
    );

    if (alreadyProcessed) {
      logEvent({
        level: LogLevel.INFO,
        message: 'Event already processed - skipping due to idempotency',
        eventId: event.id,
        data: { 
          eventType: event.type,
          reason: 'duplicate_event',
          skipProcessing: true
        }
      }, correlationId);

      return res.json({ 
        received: true,
        eventType: event.type,
        eventId: event.id,
        correlationId,
        processingTime: Date.now() - startTime,
        status: 'already_processed'
      });
    }

    // Process event with retry logic
    await executeWithRetry(
      async () => {
        // Handle different event types
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutSessionCompleted(event.data.object, correlationId);
            break;
          
          case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event.data.object, correlationId);
            break;
          
          case 'payment_intent.payment_failed':
            logEvent({
              level: LogLevel.WARN,
              message: 'Payment failed',
              eventId: event.id,
              data: { 
                paymentIntentId: event.data.object.id,
                lastPaymentError: event.data.object.last_payment_error
              }
            }, correlationId);
            break;
          
          default:
            logEvent({
              level: LogLevel.INFO,
              message: `Unhandled event type: ${event.type}`,
              eventId: event.id,
              data: { eventType: event.type, skipProcessing: true }
            }, correlationId);
        }
      },
      'event_processing',
      correlationId,
      DEFAULT_RETRY_CONFIG,
      { eventId: event.id, eventType: event.type }
    );

    // Mark event as processed for idempotency
    await markEventAsProcessed(event.id, event.type, correlationId);

    // Complete performance monitoring
    if (performanceMetrics) {
      completePerformanceMonitoring(performanceMetrics, 'webhook_processing', correlationId, true);
    }

    logEvent({
      level: LogLevel.INFO,
      message: 'Webhook processing completed successfully',
      eventId: event.id,
      data: { 
        eventType: event.type,
        totalDuration: Date.now() - startTime,
        idempotencyCheck: true,
        retryLogic: true
      }
    }, correlationId);

    // Always return 200 to acknowledge receipt
    return res.json({ 
      received: true,
      eventType: event.type,
      eventId: event.id,
      correlationId,
      processingTime: Date.now() - startTime,
      status: 'processed'
    });

  } catch (error) {
    // Complete performance monitoring with failure
    if (performanceMetrics) {
      completePerformanceMonitoring(performanceMetrics, 'webhook_processing', correlationId, false);
    }

    logError(
      ErrorCategory.WEBHOOK_PROCESSING,
      'Error processing webhook event',
      error,
      correlationId,
      { 
        eventType: event.type,
        eventId: event.id,
        totalDuration: Date.now() - startTime
      }
    );
    
    // Still return 200 to prevent Stripe from retrying
    return res.json({ 
      received: true,
      error: 'Event processing failed',
      eventType: event.type,
      eventId: event.id,
      correlationId,
      processingTime: Date.now() - startTime
    });
  }
}

module.exports = handleWebhook;

