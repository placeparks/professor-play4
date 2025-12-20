import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase client
let supabase: ReturnType<typeof createClient> | null = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY &&
  !process.env.SUPABASE_URL.includes('your-project')) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
} else {
  console.warn('⚠️ Supabase not configured - image uploads will be skipped')
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

// Helper function to get file extension from base64
function getExtensionFromBase64(base64String: string): string {
  const match = base64String.match(/^data:image\/(\w+);base64,/)
  return match ? match[1] : 'png'
}

// Upload images to Supabase Storage organized by card (front + back + mask together)
async function uploadImagesToStorage(
  cardData: Array<{ front?: string | null; back?: string | null; silverMask?: string | null }>,
  orderId: string,
  shippingAddress: any
): Promise<{ uploadedUrls: string[]; maskUrls: (string | null)[] }> {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const uploadedUrls: string[] = []
  const maskUrls: (string | null)[] = []
  const bucketName = 'order-images'

  // Create folder structure: order-images/{orderId}/{timestamp}/{country_postal}/
  const timestamp = Date.now()
  const addressHash = shippingAddress
    ? `${shippingAddress.country}_${(shippingAddress.postal_code || 'unknown').replace(/\s+/g, '_')}`
    : 'unknown'

  const baseFolderPath = `${orderId}/${timestamp}/${addressHash}`

  // Upload each card's front, back, and mask in its own folder
  // Each card gets its own numbered folder: card-1, card-2, card-3, etc.
  for (let cardIndex = 0; cardIndex < cardData.length; cardIndex++) {
    const card = cardData[cardIndex]
    // Ensure each card gets a unique folder: card-1, card-2, card-3, etc.
    const cardFolder = `${baseFolderPath}/card-${cardIndex + 1}`

    console.log(`📁 Processing card ${cardIndex + 1} in folder: ${cardFolder}`)

    // Upload front image
    if (card.front && typeof card.front === 'string' && card.front.trim() !== '') {
      try {
        // Skip if already a URL (not base64)
        if (card.front.startsWith('http')) {
          console.log(`✅ Front for card ${cardIndex + 1} already a URL, skipping upload`)
          uploadedUrls.push(card.front)
        } else {
          // Convert base64 to buffer
          const buffer = base64ToBuffer(card.front)
          const extension = getExtensionFromBase64(card.front)
          const filePath = `${cardFolder}/front.${extension}`

          console.log(`📤 Uploading front for card ${cardIndex + 1} to: ${filePath}`)

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })

          if (error) {
            console.error(`❌ Error uploading front image for card ${cardIndex + 1}:`, error)
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)

            if (urlData?.publicUrl) {
              console.log(`✅ Front uploaded for card ${cardIndex + 1}: ${filePath}`)
              uploadedUrls.push(urlData.publicUrl)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing front image for card ${cardIndex + 1}:`, error)
      }
    }

    // Upload back image
    if (card.back && typeof card.back === 'string' && card.back.trim() !== '') {
      try {
        // Skip if already a URL (not base64)
        if (card.back.startsWith('http')) {
          console.log(`✅ Back for card ${cardIndex + 1} already a URL, skipping upload`)
          uploadedUrls.push(card.back)
        } else {
          // Convert base64 to buffer
          const buffer = base64ToBuffer(card.back)
          const extension = getExtensionFromBase64(card.back)
          const filePath = `${cardFolder}/back.${extension}`

          console.log(`📤 Uploading back for card ${cardIndex + 1} to: ${filePath}`)

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })

          if (error) {
            console.error(`❌ Error uploading back image for card ${cardIndex + 1}:`, error)
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)

            if (urlData?.publicUrl) {
              console.log(`✅ Back uploaded for card ${cardIndex + 1}: ${filePath}`)
              uploadedUrls.push(urlData.publicUrl)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing back image for card ${cardIndex + 1}:`, error)
      }
    }

    // Upload silver mask if present
    // Mask is saved as "mask.png" in each card folder (e.g., card-1/mask.png)
    if (card.silverMask && typeof card.silverMask === 'string' && card.silverMask.trim() !== '') {
      try {
        // Skip if already a URL (not base64)
        if (card.silverMask.startsWith('http')) {
          console.log(`✅ Mask for card ${cardIndex + 1} already a URL, skipping upload`)
          maskUrls.push(card.silverMask)
        } else {
          console.log(`📤 Uploading mask for card ${cardIndex + 1}...`)

          // Verify mask is PNG format (required for transparency)
          const isPNG = card.silverMask.startsWith('data:image/png') || card.silverMask.includes('image/png')
          if (!isPNG) {
            console.warn(`⚠️ Mask for card ${cardIndex + 1} is not PNG format! Expected PNG for transparency.`)
          }

          // Convert base64 to buffer - ensure we preserve PNG format
          // Masks should always be PNG to preserve transparency
          const base64Data = card.silverMask.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')

          // Force PNG extension for masks to ensure transparency is preserved
          // Mask file is always named "mask.png" in the card folder
          const extension = 'png'
          const filePath = `${cardFolder}/mask.${extension}` // e.g., "order-123/1234567890/US_12345/card-1/mask.png"

          console.log(`📤 Uploading mask for card ${cardIndex + 1} to: ${filePath}`, {
            isPNG,
            bufferSize: buffer.length,
            contentType: 'image/png'
          })

          // Upload to Supabase Storage with explicit PNG content type
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: 'image/png', // Explicitly set PNG content type to preserve transparency
              upsert: false
            })

          if (error) {
            console.error(`❌ Error uploading mask for card ${cardIndex + 1}:`, error)
            maskUrls.push(null)
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)

            if (urlData?.publicUrl) {
              console.log(`✅ Mask uploaded for card ${cardIndex + 1}: ${filePath}`)
              maskUrls.push(urlData.publicUrl)
            } else {
              console.warn(`⚠️ No public URL for mask ${cardIndex + 1}`)
              maskUrls.push(null)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing mask for card ${cardIndex + 1}:`, error)
        maskUrls.push(null)
      }
    } else {
      console.log(`ℹ️ No mask for card ${cardIndex + 1} (silverMask: ${card.silverMask ? 'exists but empty' : 'null/undefined'})`)
      maskUrls.push(null)
    }
  }

  return { uploadedUrls, maskUrls }
}

// Pricing tiers
const PRICING_TIERS = {
  starter: { min: 1, max: 144, price: 0.35 },
  playtest: { min: 145, max: 500, price: 0.30 },
  bulk: { min: 501, max: Infinity, price: 0.26 }
}

// Shipping costs
const SHIPPING_COSTS = {
  US: 6.95,
  WORLDWIDE: 24.95
}

// Allowed shipping countries
const ALLOWED_COUNTRIES = [
  'US', 'CA', 'MX', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
  'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'PL', 'CZ',
  'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'GR',
  'CY', 'MT', 'LU', 'AU', 'NZ', 'JP', 'SG', 'HK', 'KR', 'TW',
  'MY', 'TH', 'PH', 'ID', 'VN', 'IN', 'AE', 'SA', 'IL', 'TR',
  'ZA', 'BR', 'AR', 'CL', 'PE', 'CO'
]

// Calculate price per card based on quantity
function getPricePerCard(quantity: number): number {
  if (quantity >= PRICING_TIERS.bulk.min) {
    return PRICING_TIERS.bulk.price
  } else if (quantity >= PRICING_TIERS.playtest.min) {
    return PRICING_TIERS.playtest.price
  } else {
    return PRICING_TIERS.starter.price
  }
}

// Get shipping cost based on country
function getShippingCost(country: string): number {
  return country === 'US' ? SHIPPING_COSTS.US : SHIPPING_COSTS.WORLDWIDE
}

// Save order details to database
async function saveOrderToDatabase(orderData: any) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  try {
    // Prepare insert data matching the database schema
    const insertData = {
      stripe_session_id: orderData.stripeSessionId,
      customer_email: orderData.customerEmail,
      customer_name: orderData.customerName || null,
      customer_phone: orderData.customerPhone || null,
      // shipping_address is JSONB - send as object, Supabase will handle conversion
      shipping_address: orderData.shippingAddress || {},
      // billing_address is JSONB - send as object or null
      billing_address: orderData.billingAddress || null,
      total_amount_cents: orderData.totalAmountCents,
      currency: orderData.currency || 'usd',
      quantity: orderData.quantity,
      price_per_card: orderData.pricePerCard,
      shipping_cost_cents: orderData.shippingCostCents,
      shipping_country: orderData.shippingCountry,
      // JSONB fields - send as arrays/objects
      card_images: orderData.card_images || [],
      card_images_base64: orderData.card_images_base64 || [],
      card_data: orderData.card_data || [],
      front_image_urls: orderData.front_image_urls || [],
      back_image_urls: orderData.back_image_urls || [],
      mask_image_urls: orderData.mask_image_urls || [],
      image_storage_path: orderData.image_storage_path || null,
      status: 'pending',
      payment_status: 'pending',
      metadata: orderData.metadata || {}
    }

    // Log finish/effects information for verification
    const finishInfo = Array.isArray(insertData.card_data)
      ? insertData.card_data.map((card: any) => ({
        finish: card.finish || 'standard',
        hasSilverMask: !!card.silverMask,
        hasMaskingColors: Array.isArray(card.maskingColors) && card.maskingColors.length > 0,
        maskingTolerance: card.maskingTolerance || null
      }))
      : []

    // Log a sample of card_data to verify all fields are present
    if (Array.isArray(insertData.card_data) && insertData.card_data.length > 0) {
      console.log('📋 Sample card_data being saved:', JSON.stringify(insertData.card_data[0], null, 2))
    }

    console.log('💾 Inserting order data:', {
      stripe_session_id: insertData.stripe_session_id,
      customer_email: insertData.customer_email,
      quantity: insertData.quantity,
      card_images_count: Array.isArray(insertData.card_images) ? insertData.card_images.length : 0,
      card_data_count: Array.isArray(insertData.card_data) ? insertData.card_data.length : 0,
      finish_effects: finishInfo
    })

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('❌ Error saving order to database:', error)
      throw error
    }

    console.log('✅ Order saved to database:', (data as any).id)
    return data as any
  } catch (error) {
    console.error('❌ Failed to save order:', error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      quantity,
      shippingAddress,
      cardImages,
      cardData
    } = body

    // Validate required fields
    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    if (!shippingAddress || !shippingAddress.email || !shippingAddress.name ||
      !shippingAddress.line1 || !shippingAddress.city ||
      !shippingAddress.state || !shippingAddress.postal_code ||
      !shippingAddress.country) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
    }

    // Handle "OTHER" country option
    let shippingCountry = shippingAddress.country
    if (shippingCountry === 'OTHER') {
      shippingCountry = 'GB' // Default to UK for international shipping
    }

    // Validate country
    if (!ALLOWED_COUNTRIES.includes(shippingCountry)) {
      return NextResponse.json({ error: 'Shipping not available to this country' }, { status: 400 })
    }

    // Calculate pricing
    const pricePerCard = getPricePerCard(quantity)
    const cardsTotal = pricePerCard * quantity

    // Calculate finish surcharges from cardData
    let finishSurcharge = 0
    if (cardData && Array.isArray(cardData)) {
      cardData.forEach((card: any) => {
        const qty = card.quantity || 1
        if (card.finish && card.finish !== 'standard') {
          if (card.finish.includes('silver')) {
            let cardCost = 3.50
            if (card.finish.includes('rainbow') || card.finish.includes('gloss')) {
              cardCost += 2.50 // Total 6.00 for silver + rainbow/gloss
            }
            finishSurcharge += (cardCost * qty)
          } else {
            // Just Rainbow or Gloss
            finishSurcharge += (2.50 * qty)
          }
        }
      })
    }

    const shippingCost = getShippingCost(shippingCountry)
    const totalAmount = cardsTotal + finishSurcharge + shippingCost

    // Convert to cents for Stripe
    const totalAmountCents = Math.round(totalAmount * 100)
    const shippingCostCents = Math.round(shippingCost * 100)
    const finishSurchargeCents = Math.round(finishSurcharge * 100)

    // Generate temporary order ID for image organization
    const tempOrderId = `temp_${uuidv4()}`

    // Upload images organized by card (front + back + mask in same folder)
    let frontImageUrls: string[] = []
    let backImageUrls: string[] = []
    let maskImageUrls: string[] = []
    let allImageUrls: string[] = []
    let processedCardData = cardData || []

    // Log incoming cardData to verify finish/effects are present
    if (cardData && cardData.length > 0) {
      console.log('📋 Incoming cardData sample:', JSON.stringify(cardData[0], null, 2))
    }

    // Check if images are already uploaded (URLs instead of base64)
    const imagesAlreadyUploaded = cardImages && cardImages.length > 0 &&
      typeof cardImages[0] === 'string' &&
      cardImages[0].startsWith('http')

    if (imagesAlreadyUploaded && cardImages && cardImages.length > 0) {
      console.log('✅ Using pre-uploaded image URLs')
      allImageUrls = cardImages

      // Extract front, back, and mask URLs from cardData if available
      // URLs are in order: [front1, back1, mask1, front2, back2, mask2, ...]
      if (cardData && cardData.length > 0) {
        processedCardData = cardData.map((card: any, index: number) => {
          // Preserve all card data including finish/effects (finish, silverMask, maskingColors, etc.)
          const updatedCard = { ...card }

          const frontUrlIndex = index * 3
          const backUrlIndex = index * 3 + 1
          const maskUrlIndex = index * 3 + 2

          if (allImageUrls[frontUrlIndex]) {
            updatedCard.frontUrl = allImageUrls[frontUrlIndex]
            frontImageUrls.push(allImageUrls[frontUrlIndex])
          }

          if (allImageUrls[backUrlIndex]) {
            updatedCard.backUrl = allImageUrls[backUrlIndex]
            backImageUrls.push(allImageUrls[backUrlIndex])
          }

          // Extract mask URL from array (masks are saved as separate images)
          if (allImageUrls[maskUrlIndex]) {
            updatedCard.silverMask = allImageUrls[maskUrlIndex]
            maskImageUrls.push(allImageUrls[maskUrlIndex])
          }

          return updatedCard
        })
      }
    } else if (cardData && cardData.length > 0 && supabase) {
      try {
        // Extract front, back, and mask images from cardImages array
        // cardImages is in order: [front1, back1, mask1, front2, back2, mask2, ...]
        const extractImages = (index: number) => {
          const frontIndex = index * 3
          const backIndex = index * 3 + 1
          const maskIndex = index * 3 + 2

          // Filter out empty strings - only return non-empty values
          const front = (cardImages && cardImages[frontIndex] && cardImages[frontIndex].trim() !== '')
            ? cardImages[frontIndex]
            : null
          const back = (cardImages && cardImages[backIndex] && cardImages[backIndex].trim() !== '')
            ? cardImages[backIndex]
            : null
          const mask = (cardImages && cardImages[maskIndex] && cardImages[maskIndex].trim() !== '')
            ? cardImages[maskIndex]
            : null

          // Log extraction with more detail to debug front/back swap
          console.log(`📋 Card ${index + 1} extraction from cardImages array:`, {
            frontIndex,
            backIndex,
            maskIndex,
            front: front ? `found (starts with: ${front.substring(0, 50)}...)` : 'null/empty',
            back: back ? `found (starts with: ${back.substring(0, 50)}...)` : 'null/empty',
            mask: mask ? `found (starts with: ${mask.substring(0, 50)}...)` : 'null/empty',
            cardSilverMask: cardData[index]?.silverMask ? 'exists in cardData' : 'null'
          })

          return { front, back, mask }
        }

        // Prepare card data with front, back, and mask images for upload
        const cardDataForUpload = cardData.map((card: any, index: number) => {
          const { front, back, mask } = extractImages(index)

          // Verify we're not swapping front/back - log what we're assigning
          const result = {
            front: front || null,
            back: back || null,
            silverMask: mask || card.silverMask || null // Use mask from array, fallback to card.silverMask
          }

          console.log(`📤 Card ${index + 1} prepared for upload:`, {
            hasFront: !!result.front,
            hasBack: !!result.back,
            hasMask: !!result.silverMask,
            frontType: result.front ? (result.front.startsWith('data:image') ? 'base64' : 'URL') : 'null',
            backType: result.back ? (result.back.startsWith('data:image') ? 'base64' : 'URL') : 'null',
            maskType: result.silverMask ? (result.silverMask.startsWith('data:image') ? 'base64' : 'URL') : 'null'
          })

          return result
        })

        // Upload images organized by card (each card gets its own folder)
        const uploadResult = await uploadImagesToStorage(
          cardDataForUpload,
          tempOrderId,
          shippingAddress
        )

        // Combine uploadedUrls (fronts + backs) with maskUrls in correct order
        // uploadedUrls contains: [front1, back1, front2, back2, ...]
        // maskUrls contains: [mask1, mask2, ...]
        // We need to combine them into: [front1, back1, mask1, front2, back2, mask2, ...]
        allImageUrls = []
        for (let i = 0; i < cardData.length; i++) {
          const frontIndex = i * 2
          const backIndex = i * 2 + 1

          if (uploadResult.uploadedUrls[frontIndex]) {
            allImageUrls.push(uploadResult.uploadedUrls[frontIndex])
          }
          if (uploadResult.uploadedUrls[backIndex]) {
            allImageUrls.push(uploadResult.uploadedUrls[backIndex])
          }
          const maskUrl = uploadResult.maskUrls[i]
          if (typeof maskUrl === 'string' && maskUrl.length > 0) {
            allImageUrls.push(maskUrl)
          }
        }

        // Extract front, back, and mask URLs from the combined array
        if (allImageUrls.length > 0) {
          processedCardData = cardData.map((card: any, index: number) => {
            // Preserve all card data including finish/effects (finish, silverMask, maskingColors, etc.)
            const updatedCard = { ...card }

            const frontUrlIndex = index * 3
            const backUrlIndex = index * 3 + 1
            const maskUrlIndex = index * 3 + 2

            if (allImageUrls[frontUrlIndex]) {
              updatedCard.frontUrl = allImageUrls[frontUrlIndex]
              frontImageUrls.push(allImageUrls[frontUrlIndex])
            }

            if (allImageUrls[backUrlIndex]) {
              updatedCard.backUrl = allImageUrls[backUrlIndex]
              backImageUrls.push(allImageUrls[backUrlIndex])
            }

            // Update mask URL if it was uploaded (masks are saved as separate image files)
            // Each mask gets its own URL: {orderId}/{timestamp}/{addressHash}/card-{index}/mask.{extension}
            if (allImageUrls[maskUrlIndex]) {
              updatedCard.silverMask = allImageUrls[maskUrlIndex]
              maskImageUrls.push(allImageUrls[maskUrlIndex])
            }

            return updatedCard
          })

          console.log(`✅ Uploaded ${allImageUrls.length} images (fronts, backs, masks) to storage`)
        }
      } catch (uploadError: any) {
        console.error('⚠️ Error uploading images to storage (continuing with base64):', uploadError.message)
        // Continue with checkout even if image upload fails
      }
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get('origin') ||
      req.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
      'http://localhost:3000'

    // Prepare metadata
    const metadata: Record<string, string> = {
      quantity: quantity.toString(),
      pricePerCard: pricePerCard.toString(),
      finishSurcharge: finishSurcharge.toFixed(2),
      shippingCountry: shippingCountry,
      tempOrderId: tempOrderId,
      hasImages: (allImageUrls.length > 0 || (cardImages && cardImages.length > 0)) ? 'true' : 'false',
      imageCount: (allImageUrls.length > 0 ? allImageUrls.length : cardImages?.length || 0).toString()
    }

    if (allImageUrls.length > 0 && tempOrderId.length < 100) {
      metadata.imageStoragePath = tempOrderId
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Custom Card Order - ${quantity} cards`,
            description: `Premium S33 cardstock custom cards (${quantity} cards @ $${pricePerCard.toFixed(2)}/card)`,
            images: frontImageUrls.length > 0 && frontImageUrls[0].startsWith('http')
              ? [frontImageUrls[0]]
              : []
          },
          unit_amount: Math.round(pricePerCard * 100),
        },
        quantity: quantity,
      }
    ]

    // Add finish surcharges as a separate line item if any
    if (finishSurchargeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Premium Finishes',
            description: 'Additional cost for premium finishes (Rainbow Foil, Piano Gloss, Spot Silver)'
          },
          unit_amount: finishSurchargeCents,
        },
        quantity: 1,
      })
    }

    // Add shipping
    lineItems.push({
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
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing-view`,
      customer_email: shippingAddress.email,
      shipping_address_collection: {
        allowed_countries: ALLOWED_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      // Enable automatic tax calculation based on customer location
      automatic_tax: {
        enabled: true,
      },
      metadata: metadata
    })

    console.log('✅ Stripe checkout session created:', session.id)

    // Save order to database (pending payment)
    if (supabase) {
      try {
        console.log('💾 Attempting to save order to database...')
        const savedOrder = await saveOrderToDatabase({
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
          card_images: allImageUrls.length > 0 ? allImageUrls : (cardImages || []),
          card_images_base64: processedCardData.length > 0
            ? processedCardData.flatMap((card: any) => [card.front, card.back].filter(Boolean))
            : (cardImages || []),
          card_data: processedCardData,
          front_image_urls: frontImageUrls.length > 0 ? frontImageUrls : [],
          back_image_urls: backImageUrls.length > 0 ? backImageUrls : [],
          mask_image_urls: maskImageUrls.length > 0 ? maskImageUrls : [],
          image_storage_path: allImageUrls.length > 0 ? `${session.id}` : null,
          metadata: {
            created_at: new Date().toISOString(),
            tempOrderId: tempOrderId
          }
        })
        console.log('✅ Order successfully saved to database:', savedOrder?.id)
      } catch (dbError: any) {
        console.error('❌ Failed to save order to database:', dbError)
        console.error('Error details:', {
          message: dbError?.message,
          code: dbError?.code,
          details: dbError?.details,
          hint: dbError?.hint
        })
        // Continue even if database save fails - Stripe session is already created
        // Order can be saved later via webhook
      }
    } else {
      console.warn('⚠️ Supabase not configured - order will not be saved to database')
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    })

  } catch (error: any) {
    console.error('❌ Checkout error:', error)

    return NextResponse.json({
      error: 'Failed to create checkout session',
      message: error.message
    }, { status: 500 })
  }
}

