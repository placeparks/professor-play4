// Utility functions for spot silver masking

export function rgbToHex(r: number, g: number, b: number): string {
  if (r > 255 || g > 255 || b > 255) {
    throw new Error('Invalid color component')
  }
  return ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function generateSilverMask(
  imgSrc: string,
  maskingColors: string[],
  tolerance: number,
  callback: (maskUrl: string) => void
): void {
  // Ensure maskingColors is always an array
  if (!Array.isArray(maskingColors)) {
    callback('')
    return
  }
  
  if (maskingColors.length === 0) {
    callback('')
    return
  }

  const img = new Image()
  img.crossOrigin = 'Anonymous'

  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      callback('')
      return
    }

    const w = img.width
    const h = img.height
    canvas.width = w
    canvas.height = h

    ctx.drawImage(img, 0, 0)

    const imgData = ctx.getImageData(0, 0, w, h)
    const data = imgData.data
    const targetColors = maskingColors.map((c) => hexToRgb(c)).filter((c) => c !== null) as {
      r: number
      g: number
      b: number
    }[]
    const threshold = (tolerance / 100) * 255

    // Iterate pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      let isMatch = false
      for (const target of targetColors) {
        // Euclidean distance
        const dist = Math.sqrt(
          Math.pow(target.r - r, 2) + Math.pow(target.g - g, 2) + Math.pow(target.b - b, 2)
        )

        if (dist <= threshold) {
          isMatch = true
          break
        }
      }

      if (isMatch) {
        // Opaque (will show silver)
        data[i] = 0 // Black
        data[i + 1] = 0 // Black
        data[i + 2] = 0 // Black
        data[i + 3] = 255 // Full Alpha
      } else {
        // Transparent
        data[i + 3] = 0
      }
    }

    ctx.putImageData(imgData, 0, 0)
    // Always use PNG format to preserve transparency in masks
    const maskUrl = canvas.toDataURL('image/png')
    callback(maskUrl)
  }

  img.onerror = () => {
    callback('')
  }

  img.src = imgSrc
}

export function handleImageClick(
  e: React.MouseEvent<HTMLImageElement>,
  imgSrc: string,
  onColorSelected: (color: string) => void
): void {
  const img = e.currentTarget
  const rect = img.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Map visual coordinates to natural image size (using img.width/img.height like HTML version)
  const scaleX = img.naturalWidth / img.width
  const scaleY = img.naturalHeight / img.height

  const naturalX = Math.floor(x * scaleX)
  const naturalY = Math.floor(y * scaleY)

  // Use the masking-source-canvas if it exists, or create a new one
  let canvas = document.getElementById('masking-source-canvas') as HTMLCanvasElement
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = 'masking-source-canvas'
    canvas.style.display = 'none'
    document.body.appendChild(canvas)
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.warn('Could not get canvas context')
    return
  }

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  ctx.drawImage(img, 0, 0)

  // Ensure coordinates are within bounds
  const safeX = Math.max(0, Math.min(naturalX, canvas.width - 1))
  const safeY = Math.max(0, Math.min(naturalY, canvas.height - 1))

  try {
    const p = ctx.getImageData(safeX, safeY, 1, 1).data
    // Format hex to ensure 6 digits like HTML version: "#" + ("000000" + rgbToHex(...)).slice(-6)
    const hex = '#' + ('000000' + rgbToHex(p[0], p[1], p[2])).slice(-6).toUpperCase()
    onColorSelected(hex)
  } catch (error) {
    console.warn('Error reading pixel data (CORS?):', error)
    // If CORS error, try loading image from src
    const tempImg = new Image()
    tempImg.crossOrigin = 'Anonymous'
    tempImg.onload = () => {
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      tempCanvas.width = tempImg.naturalWidth
      tempCanvas.height = tempImg.naturalHeight
      tempCtx.drawImage(tempImg, 0, 0)

      // Recalculate coordinates for temp image
      const scaleX2 = tempImg.naturalWidth / img.width
      const scaleY2 = tempImg.naturalHeight / img.height
      const naturalX2 = Math.floor(x * scaleX2)
      const naturalY2 = Math.floor(y * scaleY2)

      const safeX2 = Math.max(0, Math.min(naturalX2, tempCanvas.width - 1))
      const safeY2 = Math.max(0, Math.min(naturalY2, tempCanvas.height - 1))

      const p = tempCtx.getImageData(safeX2, safeY2, 1, 1).data
      const hex = '#' + ('000000' + rgbToHex(p[0], p[1], p[2])).slice(-6).toUpperCase()
      onColorSelected(hex)
    }
    tempImg.onerror = () => {
      console.warn('Failed to load image for color picking')
    }
    tempImg.src = img.src
  }
}

