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
// Images are expected in order: [front1, back1, mask1, front2, back2, mask2, ...]
async function uploadImagesToStorage(
  images: string[],
  orderId: string,
  shippingAddress: any
): Promise<string[]> {
  // Return URLs aligned to the input array (same length, same ordering).
  // Missing images are returned as '' so the caller can keep [front, back, mask] structure.
  const uploadedUrls: string[] = new Array(images.length).fill('')
  const bucketName = 'order-images'
  
  // Create folder structure: order-images/{orderId}/{timestamp}/{country_postal}/
  const timestamp = Date.now()
  const addressHash = shippingAddress 
    ? `${shippingAddress.country}_${(shippingAddress.postal_code || 'unknown').replace(/\s+/g, '_')}`
    : 'unknown'
  
  const baseFolderPath = `${orderId}/${timestamp}/${addressHash}`
  
  // Process images in triplets (front + back + mask per card)
  for (let i = 0; i < images.length; i += 3) {
    const cardIndex = Math.floor(i / 3) + 1
    const cardFolder = `${baseFolderPath}/card-${cardIndex}`
    
    // Upload front image (index 0, 3, 6, ...)
    if (i < images.length && images[i] && images[i].trim() !== '') {
      try {
        const frontImage = images[i]
        
        // Skip if already a URL
        if (frontImage.startsWith('http')) {
          uploadedUrls[i] = frontImage
        } else {
          const buffer = base64ToBuffer(frontImage)
          const extension = getExtensionFromBase64(frontImage)
          const filePath = `${cardFolder}/front.${extension}`
          
          console.log(`📤 Uploading front for card ${cardIndex} to: ${filePath}`)
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })
          
          if (error) {
            console.error(`❌ Error uploading front for card ${cardIndex}:`, error)
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              console.log(`✅ Front uploaded for card ${cardIndex}: ${filePath}`)
              uploadedUrls[i] = urlData.publicUrl
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing front for card ${cardIndex}:`, error)
      }
    }
    
    // Upload back image (index 1, 4, 7, ...)
    if (i + 1 < images.length && images[i + 1] && images[i + 1].trim() !== '') {
      try {
        const backImage = images[i + 1]
        
        // Skip if already a URL
        if (backImage.startsWith('http')) {
          uploadedUrls[i + 1] = backImage
        } else {
          const buffer = base64ToBuffer(backImage)
          const extension = getExtensionFromBase64(backImage)
          const filePath = `${cardFolder}/back.${extension}`
          
          console.log(`📤 Uploading back for card ${cardIndex} to: ${filePath}`)
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            })
          
          if (error) {
            console.error(`❌ Error uploading back for card ${cardIndex}:`, error)
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              console.log(`✅ Back uploaded for card ${cardIndex}: ${filePath}`)
              uploadedUrls[i + 1] = urlData.publicUrl
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing back for card ${cardIndex}:`, error)
      }
    }
    
    // Upload mask image (index 2, 5, 8, ...)
    if (i + 2 < images.length && images[i + 2] && images[i + 2].trim() !== '') {
      try {
        const maskImage = images[i + 2]
        
        // Skip if already a URL
        if (maskImage.startsWith('http')) {
          uploadedUrls[i + 2] = maskImage
        } else {
          // Verify mask is PNG format (required for transparency)
          const isPNG = maskImage.startsWith('data:image/png') || maskImage.includes('image/png')
          if (!isPNG) {
            console.warn(`⚠️ Mask for card ${cardIndex} is not PNG format! Expected PNG for transparency.`)
          }
          
          // Extract base64 data - ensure we preserve PNG format
          const base64Data = maskImage.replace(/^data:image\/\w+;base64,/, '')
          const buffer = Buffer.from(base64Data, 'base64')
          
          // Masks are always PNG to preserve transparency
          const extension = 'png'
          const filePath = `${cardFolder}/mask.${extension}`
          
          console.log(`📤 Uploading mask for card ${cardIndex} to: ${filePath}`, {
            isPNG,
            bufferSize: buffer.length,
            contentType: 'image/png'
          })
          
          // Upload with explicit PNG content type to ensure transparency is preserved
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: 'image/png', // Explicitly set PNG content type
              upsert: false
            })
          
          if (error) {
            console.error(`❌ Error uploading mask for card ${cardIndex}:`, error)
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath)
            
            if (urlData?.publicUrl) {
              console.log(`✅ Mask uploaded for card ${cardIndex}: ${filePath} (${buffer.length} bytes, PNG with transparency)`)
              uploadedUrls[i + 2] = urlData.publicUrl
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing mask for card ${cardIndex}:`, error)
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

