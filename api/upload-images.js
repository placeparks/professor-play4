// Image Upload API Endpoint
// Uploads card images to Supabase Storage and returns URLs

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Convert base64 to buffer
function base64ToBuffer(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Get file extension from base64 data URL
function getExtensionFromBase64(base64String) {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : 'png';
}

// Upload images to Supabase Storage
// Images are expected in order: [front1, back1, front2, back2, ...]
// Organized by card: each card gets its own folder with front and back
async function uploadImagesToStorage(images, orderId, shippingAddress) {
  const uploadedUrls = [];
  const bucketName = 'order-images';
  
  // Create folder structure: order-images/{orderId}/{timestamp}/{country_postal}/
  const timestamp = Date.now();
  const addressHash = shippingAddress 
    ? `${shippingAddress.country}_${(shippingAddress.postal_code || 'unknown').replace(/\s+/g, '_')}`
    : 'unknown';
  
  const baseFolderPath = `${orderId}/${timestamp}/${addressHash}`;
  
  // Process images in pairs (front + back per card)
  // Images array: [front1, back1, front2, back2, ...]
  for (let i = 0; i < images.length; i += 2) {
    const cardIndex = Math.floor(i / 2) + 1;
    const cardFolder = `${baseFolderPath}/card-${cardIndex}`;
    
    // Upload front image (even index)
    if (i < images.length) {
      try {
        const frontImage = images[i];
        
        // Skip if already a URL
        if (typeof frontImage === 'string' && frontImage.startsWith('http')) {
          uploadedUrls.push(frontImage);
        } else {
          const buffer = base64ToBuffer(frontImage);
          const extension = getExtensionFromBase64(frontImage);
          const filePath = `${cardFolder}/front.${extension}`;
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            });
          
          if (error) {
            console.error(`Error uploading front for card ${cardIndex}:`, error);
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing front for card ${cardIndex}:`, error);
      }
    }
    
    // Upload back image (odd index)
    if (i + 1 < images.length) {
      try {
        const backImage = images[i + 1];
        
        // Skip if already a URL
        if (typeof backImage === 'string' && backImage.startsWith('http')) {
          uploadedUrls.push(backImage);
        } else {
          const buffer = base64ToBuffer(backImage);
          const extension = getExtensionFromBase64(backImage);
          const filePath = `${cardFolder}/back.${extension}`;
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
              contentType: `image/${extension}`,
              upsert: false
            });
          
          if (error) {
            console.error(`Error uploading back for card ${cardIndex}:`, error);
          } else {
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing back for card ${cardIndex}:`, error);
      }
    }
  }
  
  return uploadedUrls;
}

// Main upload handler
async function uploadImages(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      images,
      orderId,
      shippingAddress
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Upload images to storage
    const imageUrls = await uploadImagesToStorage(
      images,
      orderId,
      shippingAddress
    );

    if (imageUrls.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any images' });
    }

    return res.status(200).json({
      success: true,
      imageUrls,
      uploadedCount: imageUrls.length,
      totalCount: images.length
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload images',
      message: error.message
    });
  }
}

module.exports = uploadImages;

