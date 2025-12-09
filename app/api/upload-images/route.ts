import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Convert base64 to buffer
function base64ToBuffer(base64String: string): Buffer {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

// Get file extension from base64 data URL
function getExtensionFromBase64(base64String: string): string {
  const match = base64String.match(/^data:image\/(\w+);base64,/)
  return match ? match[1] : 'png'
}

// Upload images to Supabase Storage
// Images are expected in order: [front1, back1, front2, back2, ...]
async function uploadImagesToStorage(
  images: string[],
  orderId: string,
  shippingAddress: any
): Promise<string[]> {
  const uploadedUrls: string[] = []
  const bucketName = 'order-images'
  
  // Create folder structure: order-images/{orderId}/{timestamp}/{country_postal}/
  const timestamp = Date.now()
  const addressHash = shippingAddress 
    ? `${shippingAddress.country}_${(shippingAddress.postal_code || 'unknown').replace(/\s+/g, '_')}`
    : 'unknown'
  
  const baseFolderPath = `${orderId}/${timestamp}/${addressHash}`
  
  // Process images in pairs (front + back per card)
  for (let i = 0; i < images.length; i += 2) {
    const cardIndex = Math.floor(i / 2) + 1
    const cardFolder = `${baseFolderPath}/card-${cardIndex}`
    
    // Upload front image (even index)
    if (i < images.length) {
      try {
        const frontImage = images[i]
        
        // Skip if already a URL
        if (frontImage.startsWith('http')) {
          uploadedUrls.push(frontImage)
        } else {
          const buffer = base64ToBuffer(frontImage)
          const extension = getExtensionFromBase64(frontImage)
          const filePath = `${cardFolder}/front.${extension}`
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })
          
          if (error) {
            console.error(`Error uploading front for card ${cardIndex}:`, error)
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing front for card ${cardIndex}:`, error)
      }
    }
    
    // Upload back image (odd index)
    if (i + 1 < images.length) {
      try {
        const backImage = images[i + 1]
        
        // Skip if already a URL
        if (backImage.startsWith('http')) {
          uploadedUrls.push(backImage)
        } else {
          const buffer = base64ToBuffer(backImage)
          const extension = getExtensionFromBase64(backImage)
          const filePath = `${cardFolder}/back.${extension}`
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })
          
          if (error) {
            console.error(`Error uploading back for card ${cardIndex}:`, error)
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing back for card ${cardIndex}:`, error)
      }
    }
  }
  
  return uploadedUrls
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      images,
      orderId,
      shippingAddress
    } = body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Images array is required' }, { status: 400 })
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Upload images to storage
    const imageUrls = await uploadImagesToStorage(
      images,
      orderId,
      shippingAddress
    )

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'Failed to upload any images' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imageUrls,
      uploadedCount: imageUrls.length,
      totalCount: images.length
    })

  } catch (error: any) {
    console.error('Image upload error:', error)
    return NextResponse.json({
      error: 'Failed to upload images',
      message: error.message
    }, { status: 500 })
  }
}

