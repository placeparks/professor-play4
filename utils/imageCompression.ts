// Image compression utility for reducing payload size before upload

export async function compressImage(
  base64String: string,
  maxSizeMB: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // Calculate new dimensions to stay under maxSizeMB
      const maxDimension = 2048 // Max 2048px on longest side
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension
          width = maxDimension
        } else {
          width = (width / height) * maxDimension
          height = maxDimension
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(base64String) // Fallback to original if canvas fails
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      
      // Try different quality levels to stay under size limit
      let quality = 0.8
      let result = canvas.toDataURL('image/jpeg', quality)
      
      // If still too large, reduce quality
      while (result.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.3) {
        quality -= 0.1
        result = canvas.toDataURL('image/jpeg', quality)
      }
      
      resolve(result)
    }
    img.onerror = () => resolve(base64String) // Fallback to original if compression fails
    img.src = base64String
  })
}

